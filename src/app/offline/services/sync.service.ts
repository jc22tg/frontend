import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, timer, of, from } from 'rxjs';
import { filter, debounceTime, switchMap, takeUntil, retry, map, tap, catchError } from 'rxjs/operators';
import { OfflineStorageService } from './offline-storage.service';
import { ConnectionService } from './connection.service';
import { SyncStatus } from '../models/sync-status.enum';
import { OfflineOperation, OperationType } from '../models/offline-operation.model';
import { environment } from '../../../environments/environment';
import { Store } from '@ngrx/store';

// Configuración de reintentos
const MAX_RETRY_ATTEMPTS = 5;
const RETRY_DELAY_BASE = 5000; // 5 segundos iniciales

@Injectable({
  providedIn: 'root'
})
export class SyncService {
  private syncStatusSubject = new BehaviorSubject<SyncStatus>(SyncStatus.SYNCED);
  public syncStatus$ = this.syncStatusSubject.asObservable();
  
  private isSyncing = false;
  private forceSyncSubject = new BehaviorSubject<boolean>(false);
  
  constructor(
    private offlineStorage: OfflineStorageService,
    private connectionService: ConnectionService,
    private http: HttpClient,
    private store: Store
  ) {
    this.initSyncListeners();
  }

  private initSyncListeners(): void {
    // Iniciar sincronización cuando se recupera la conectividad o hay cambios en operaciones pendientes
    this.connectionService.online$.pipe(
      filter(online => online),
      debounceTime(2000) // Esperar 2 segundos para asegurar conectividad estable
    ).subscribe(() => {
      this.syncPendingOperations();
    });
    
    // Observar recuento de operaciones y sincronizar cuando cambie (si estamos online)
    this.offlineStorage.operationsCount$.pipe(
      debounceTime(1000) // Agrupar cambios rápidos sucesivos
    ).subscribe(count => {
      if (count > 0) {
        this.connectionService.online$.pipe(
          filter(online => online),
          // Solo tomar el primer valor para evitar múltiples sincronizaciones
          takeUntil(timer(100))
        ).subscribe(() => {
          this.syncPendingOperations();
        });
      } else if (count === 0 && this.syncStatusSubject.value === SyncStatus.PENDING) {
        // Si no hay operaciones pendientes pero el estado es PENDING, actualizar a SYNCED
        this.syncStatusSubject.next(SyncStatus.SYNCED);
      }
    });
    
    // Escuchar solicitudes de sincronización forzada
    this.forceSyncSubject.pipe(
      filter(force => force)
    ).subscribe(() => {
      this.syncPendingOperations();
      this.forceSyncSubject.next(false);
    });
  }

  // Sincronización de operaciones pendientes
  public async syncPendingOperations(): Promise<void> {
    // Evitar sincronizaciones simultáneas
    if (this.isSyncing) {
      return;
    }
    
    const isOnline = await this.connectionService.checkConnectivity();
    if (!isOnline) {
      this.syncStatusSubject.next(SyncStatus.OFFLINE);
      return;
    }

    this.isSyncing = true;
    this.syncStatusSubject.next(SyncStatus.SYNCING);
    
    try {
      const pendingOperations = await this.offlineStorage.getPendingOperations();
      
      if (pendingOperations.length === 0) {
        // No hay operaciones pendientes
        this.syncStatusSubject.next(SyncStatus.SYNCED);
        this.isSyncing = false;
        return;
      }
      
      // Procesar operaciones una por una
      for (const operation of pendingOperations) {
        try {
          await this.processOperation(operation);
          // Si tiene éxito, eliminar la operación
          await this.offlineStorage.removeOperation(operation.id);
        } catch (error) {
          // Incrementar contador de intentos
          await this.offlineStorage.updateOperationAttempt(operation.id);
          
          // Si ha excedido los intentos máximos, mover a la siguiente operación
          if (operation.attempts >= MAX_RETRY_ATTEMPTS) {
            console.warn(`Operación ${operation.id} abandonada después de ${MAX_RETRY_ATTEMPTS} intentos.`);
            await this.offlineStorage.removeOperation(operation.id);
          } else {
            // Si falla, interrumpir el proceso de sincronización
            console.error('Error during sync operation:', error);
            this.syncStatusSubject.next(SyncStatus.FAILED);
          }
        }
      }
      
      // Verificar si quedan operaciones pendientes
      const remainingOperations = await this.offlineStorage.getPendingOperations();
      this.syncStatusSubject.next(remainingOperations.length > 0 ? SyncStatus.PENDING : SyncStatus.SYNCED);
      
    } catch (error) {
      console.error('Error durante la sincronización:', error);
      this.syncStatusSubject.next(SyncStatus.FAILED);
    } finally {
      this.isSyncing = false;
    }
  }

  // Solicitar sincronización manual
  public forceSync(): void {
    this.forceSyncSubject.next(true);
  }

  // Procesar una operación individual
  private async processOperation(operation: OfflineOperation): Promise<void> {
    // Calcular retraso exponencial basado en número de intentos
    const delayMs = operation.attempts > 0
      ? Math.min(RETRY_DELAY_BASE * Math.pow(2, operation.attempts - 1), 60000) // Máximo 1 minuto
      : 0;
    
    if (delayMs > 0) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }

    // Determinar la URL y método según el tipo de operación y almacén
    const url = this.getUrlForStore(operation.storeName, operation.key);
    let method: string;
    
    switch (operation.type) {
      case OperationType.CREATE:
        method = 'POST';
        break;
      case OperationType.UPDATE:
        method = 'PUT';
        break;
      case OperationType.DELETE:
        method = 'DELETE';
        break;
      default:
        throw new Error(`Tipo de operación no soportado: ${operation.type}`);
    }

    // Ejecutar la operación HTTP
    try {
      const response = await this.executeHttpRequest(method, url, operation.data);
      
      // Si la operación fue un éxito, actualizar datos locales
      if (operation.type !== OperationType.DELETE) {
        // Actualizar el caché local con la respuesta del servidor (sin añadir a la cola)
        await this.offlineStorage.set(
          operation.storeName,
          operation.key,
          response,
          false // No añadir a la cola
        );
      }
      
      return response;
    } catch (error) {
      console.error(`Error al procesar operación ${operation.id}:`, error);
      
      // Si el error es 404 y la operación es DELETE, considerar exitosa
      if (operation.type === OperationType.DELETE && 
          typeof error === 'object' && error !== null && 'status' in error && error.status === 404) {
        return;
      }
      
      throw error;
    }
  }

  // Realizar solicitud HTTP
  private executeHttpRequest(method: string, url: string, data?: any): Promise<any> {
    return new Promise((resolve, reject) => {
      let request$: Observable<any>;
      
      switch (method) {
        case 'GET':
          request$ = this.http.get(url);
          break;
        case 'POST':
          request$ = this.http.post(url, data);
          break;
        case 'PUT':
          request$ = this.http.put(url, data);
          break;
        case 'PATCH':
          request$ = this.http.patch(url, data);
          break;
        case 'DELETE':
          request$ = this.http.delete(url);
          break;
        default:
          reject(new Error(`Método HTTP no soportado: ${method}`));
          return;
      }
      
      request$.pipe(
        retry(2) // Reintentar automáticamente 2 veces
      ).subscribe({
        next: (response) => resolve(response),
        error: (error) => reject(error)
      });
    });
  }

  // Determinar la URL para el tipo de almacén
  private getUrlForStore(storeName: string, key: string): string {
    const baseUrl = '/api';
    
    switch (storeName) {
      case 'networkElements':
        return `${baseUrl}/network-elements/${key}`;
      case 'connections':
        return `${baseUrl}/connections/${key}`;
      default:
        // Si es un almacén personalizado, usar una convención estándar
        return `${baseUrl}/${storeName.toLowerCase()}/${key}`;
    }
  }

  // Obtener cambios actualizados del servidor (para sincronización bidireccional)
  public async pullServerChanges(storeName: string): Promise<void> {
    const isOnline = await this.connectionService.checkConnectivity();
    if (!isOnline) {
      return;
    }

    try {
      const url = `/api/${storeName.toLowerCase()}`;
      const data = await this.executeHttpRequest('GET', url);
      
      // Actualizar caché local con los datos del servidor (sin añadir a la cola)
      for (const item of data) {
        const key = item.id.toString();
        await this.offlineStorage.set(storeName, key, item, false);
      }
    } catch (error) {
      console.error(`Error al obtener cambios del servidor para ${storeName}:`, error);
      throw error;
    }
  }
} 
