import { Injectable, OnDestroy, NgZone, inject } from '@angular/core';
import { BehaviorSubject, Observable, Subject, Subscription, timer, fromEvent, of } from 'rxjs';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { catchError, takeUntil, switchMap, tap, map, filter, debounceTime, retry, share } from 'rxjs/operators';
import { HttpClient, HttpResponse } from '@angular/common/http';

import { environment } from '../../../../environments/environment';
import { LoggerService } from '../../../core/services/logger.service';
import { AuthService } from '../../../features/auth/services/auth.service';
import { NetworkElement, ElementType, ElementStatus, NetworkConnection } from '../../../shared/types/network.types';

// Extender environment para incluir wsUrl
declare global {
  interface Environment {
    wsUrl?: string;
  }
}

export interface SyncEventData {
  type: 'element' | 'connection' | 'state' | 'alert';
  action: 'create' | 'update' | 'delete' | 'batch';
  data: any;
  timestamp: number;
  source?: string;
}

export interface SyncStatus {
  connected: boolean;
  lastSync: Date | null;
  syncInProgress: boolean;
  pendingChanges: number;
  connectionType: 'websocket' | 'sse' | 'polling' | 'none';
}

/**
 * Servicio para la sincronización en tiempo real de los elementos de red
 * Proporciona comunicación bidireccional para mantener sincronizado el estado entre clientes
 */
@Injectable({
  providedIn: 'root'
})
export class RealTimeSyncService implements OnDestroy {
  // Estado de la conexión de sincronización
  private syncStatusSubject = new BehaviorSubject<SyncStatus>({
    connected: false,
    lastSync: null,
    syncInProgress: false,
    pendingChanges: 0,
    connectionType: 'none'
  });
  
  // Eventos recibidos desde el servidor
  private eventsSubject = new Subject<SyncEventData>();
  
  // Control de finalización
  private destroy$ = new Subject<void>();
  
  // WebSocket
  private wsSubject: WebSocketSubject<any> | null = null;
  private wsSubscription: Subscription | null = null;
  
  // SSE (Server-Sent Events)
  private eventSource: EventSource | null = null;
  
  // Polling fallback
  private pollingSubscription: Subscription | null = null;
  private pollingInterval = 10000; // 10 segundos
  
  // Cambios locales pendientes de sincronización
  private pendingChanges: SyncEventData[] = [];
  
  // Token de identificación del cliente
  private clientId = `client_${Math.random().toString(36).substring(2, 9)}`;
  
  // URLs
  private readonly wsUrl = (environment as any).wsUrl || 
    `${environment.apiUrl.replace('http', 'ws')}/realtime/ws`;
  private readonly sseUrl = `${environment.apiUrl}/realtime/sse`;
  private readonly pollUrl = `${environment.apiUrl}/realtime/poll`;
  private readonly pushUrl = `${environment.apiUrl}/realtime/push`;
  
  // Servicios inyectados
  private logger = inject(LoggerService);
  private http = inject(HttpClient);
  private zone = inject(NgZone);
  private authService = inject(AuthService);
  
  constructor() {
    // Inicializar conexión cuando el servicio se cree
    this.initializeConnection();
    
    // Manejar cambios en el estado de conexión del navegador
    fromEvent(window, 'online').pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => this.onNetworkStatusChange(true));
    
    fromEvent(window, 'offline').pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => this.onNetworkStatusChange(false));
  }
  
  /**
   * Inicializa la conexión de sincronización
   * Intenta conectar usando WebSockets, si falla usa SSE, y como último recurso usa polling
   */
  private initializeConnection(): void {
    // Primero intentar WebSocket
    this.connectWebSocket()
      .pipe(
        catchError(() => {
          this.logger.info('WebSocket no disponible, intentando SSE...');
          // Si WebSocket falla, intentar SSE
          return this.connectSSE().pipe(
            catchError(() => {
              this.logger.info('SSE no disponible, usando polling...');
              // Si SSE también falla, usar polling
              return this.startPolling();
            })
          );
        }),
        takeUntil(this.destroy$)
      )
      .subscribe();
  }
  
  /**
   * Intenta establecer conexión WebSocket
   */
  private connectWebSocket(): Observable<boolean> {
    return new Observable<boolean>(observer => {
      try {
        // Actualizar estado de sincronización
        this.updateSyncStatus({ syncInProgress: true });
        
        const authToken = (this.authService as any).getToken?.() || '';
        
        // Crear WebSocket con autenticación
        this.wsSubject = webSocket({
          url: `${this.wsUrl}?token=${authToken}&clientId=${this.clientId}`,
          openObserver: {
            next: () => {
              this.logger.info('Conexión WebSocket establecida');
              this.updateSyncStatus({ 
                connected: true, 
                syncInProgress: false,
                connectionType: 'websocket',
                lastSync: new Date()
              });
              observer.next(true);
            }
          },
          closeObserver: {
            next: event => {
              this.logger.warn(`Conexión WebSocket cerrada: ${event.code} - ${event.reason}`);
              if (event.code !== 1000) {
                // Si no es un cierre normal, reintentar conexión
                this.reconnect();
              }
              this.updateSyncStatus({ connected: false });
              observer.error(new Error(`WebSocket cerrado: ${event.reason}`));
            }
          }
        });
        
        // Suscribirse a mensajes
        this.wsSubscription = this.wsSubject.pipe(
          retry({ count: 3, delay: 1000 }),
          takeUntil(this.destroy$)
        ).subscribe({
          next: data => this.handleSyncEvent(data),
          error: err => {
            this.logger.error('Error en WebSocket:', err);
            this.updateSyncStatus({ connected: false });
            observer.error(err);
          }
        });
      } catch (error) {
        this.logger.error('Error al inicializar WebSocket:', error);
        this.updateSyncStatus({ connected: false, syncInProgress: false });
        observer.error(error);
      }
      
      return () => {
        if (this.wsSubject) {
          this.wsSubject.complete();
          this.wsSubject = null;
        }
        if (this.wsSubscription) {
          this.wsSubscription.unsubscribe();
          this.wsSubscription = null;
        }
      };
    });
  }
  
  /**
   * Intenta establecer conexión SSE (Server-Sent Events)
   */
  private connectSSE(): Observable<boolean> {
    return new Observable<boolean>(observer => {
      try {
        this.updateSyncStatus({ syncInProgress: true });
        
        const authToken = (this.authService as any).getToken?.() || '';
        
        // Crear EventSource con autenticación
        this.eventSource = new EventSource(
          `${this.sseUrl}?token=${authToken}&clientId=${this.clientId}`
        );
        
        // Manejar eventos
        this.eventSource.addEventListener('open', () => {
          this.logger.info('Conexión SSE establecida');
          this.updateSyncStatus({ 
            connected: true, 
            syncInProgress: false,
            connectionType: 'sse',
            lastSync: new Date()
          });
          observer.next(true);
        });
        
        this.eventSource.addEventListener('message', (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleSyncEvent(data);
          } catch (error) {
            this.logger.error('Error al procesar evento SSE:', error);
          }
        });
        
        this.eventSource.addEventListener('error', (error) => {
          this.logger.error('Error en conexión SSE:', error);
          this.updateSyncStatus({ connected: false });
          
          if (this.eventSource) {
            this.eventSource.close();
            this.eventSource = null;
          }
          
          observer.error(error);
        });
      } catch (error) {
        this.logger.error('Error al inicializar SSE:', error);
        this.updateSyncStatus({ connected: false, syncInProgress: false });
        observer.error(error);
      }
      
      return () => {
        if (this.eventSource) {
          this.eventSource.close();
          this.eventSource = null;
        }
      };
    });
  }
  
  /**
   * Inicia el polling como mecanismo de fallback
   */
  private startPolling(): Observable<boolean> {
    this.logger.info(`Iniciando polling cada ${this.pollingInterval / 1000} segundos`);
    
    this.updateSyncStatus({ 
      connected: true, 
      syncInProgress: false,
      connectionType: 'polling',
      lastSync: new Date()
    });
    
    // Detener polling existente si lo hay
    this.stopPolling();
    
    // Iniciar nuevo polling
    this.pollingSubscription = timer(0, this.pollingInterval).pipe(
      switchMap(() => this.pollChanges()),
      catchError(error => {
        this.logger.error('Error en polling:', error);
        this.updateSyncStatus({ connected: false });
        return this.reconnect();
      }),
      takeUntil(this.destroy$)
    ).subscribe();
    
    return of(true);
  }
  
  /**
   * Detiene el polling actual
   */
  private stopPolling(): void {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
      this.pollingSubscription = null;
    }
  }
  
  /**
   * Realiza una petición de polling para obtener cambios
   */
  private pollChanges(): Observable<any> {
    const authToken = (this.authService as any).getToken?.() || '';
    const lastSync = this.syncStatusSubject.value.lastSync;
    const timestamp = lastSync ? lastSync.getTime() : 0;
    
    this.updateSyncStatus({ syncInProgress: true });
    
    return this.http.get<SyncEventData[]>(
      `${this.pollUrl}?clientId=${this.clientId}&since=${timestamp}`, 
      { headers: { Authorization: `Bearer ${authToken}` } }
    ).pipe(
      tap(events => {
        // Procesar eventos recibidos
        events.forEach(event => this.handleSyncEvent(event));
        
        // Actualizar estado de sincronización
        this.updateSyncStatus({ 
          syncInProgress: false,
          lastSync: new Date()
        });
        
        // Si tenemos cambios pendientes, intentar enviarlos
        if (this.pendingChanges.length > 0) {
          this.pushPendingChanges();
        }
      }),
      catchError(error => {
        this.logger.error('Error en polling:', error);
        this.updateSyncStatus({ syncInProgress: false });
        throw error;
      })
    );
  }
  
  /**
   * Maneja eventos de sincronización entrantes
   */
  private handleSyncEvent(data: SyncEventData): void {
    // Verificar que no sean nuestros propios eventos
    if (data.source === this.clientId) {
      return;
    }
    
    // Actualizar última sincronización
    this.updateSyncStatus({ lastSync: new Date() });
    
    // Emitir el evento para los suscriptores
    this.zone.run(() => {
      this.eventsSubject.next(data);
    });
  }
  
  /**
   * Envía un evento de sincronización
   */
  sendSyncEvent(event: Omit<SyncEventData, 'timestamp' | 'source'>): void {
    const completeEvent: SyncEventData = {
      ...event,
      timestamp: Date.now(),
      source: this.clientId
    };
    
    // Verificar el estado de la conexión
    if (!this.syncStatusSubject.value.connected) {
      // Guardar el evento para enviarlo cuando la conexión se restablezca
      this.addPendingChange(completeEvent);
      return;
    }
    
    // Enviar según el tipo de conexión
    switch (this.syncStatusSubject.value.connectionType) {
      case 'websocket':
        this.sendViaWebSocket(completeEvent);
        break;
      case 'sse':
      case 'polling':
      default:
        // SSE es unidireccional, usar HTTP para enviar datos
        this.sendViaHttp(completeEvent);
        break;
    }
  }
  
  /**
   * Envía un evento vía WebSocket
   */
  private sendViaWebSocket(event: SyncEventData): void {
    if (this.wsSubject) {
      this.wsSubject.next(event);
    } else {
      this.logger.warn('WebSocket no disponible, añadiendo a pendientes');
      this.addPendingChange(event);
    }
  }
  
  /**
   * Envía un evento vía HTTP
   */
  private sendViaHttp(event: SyncEventData): void {
    const authToken = (this.authService as any).getToken?.() || '';
    
    this.http.post(this.pushUrl, event, {
      headers: { Authorization: `Bearer ${authToken}` }
    }).pipe(
      catchError(error => {
        this.logger.error('Error al enviar evento:', error);
        this.addPendingChange(event);
        return of(error);
      })
    ).subscribe();
  }
  
  /**
   * Añade un cambio a la lista de pendientes
   */
  private addPendingChange(event: SyncEventData): void {
    this.pendingChanges.push(event);
    this.updateSyncStatus({ 
      pendingChanges: this.pendingChanges.length 
    });
  }
  
  /**
   * Intenta enviar los cambios pendientes
   */
  private pushPendingChanges(): void {
    if (this.pendingChanges.length === 0) {
      return;
    }
    
    const changes = [...this.pendingChanges];
    this.pendingChanges = [];
    
    const authToken = (this.authService as any).getToken?.() || '';
    
    // Enviar todos los cambios pendientes en una sola petición
    this.http.post(`${this.pushUrl}/batch`, { events: changes }, {
      headers: { Authorization: `Bearer ${authToken}` }
    }).pipe(
      catchError(error => {
        this.logger.error('Error al enviar cambios pendientes:', error);
        // Devolver los cambios a la lista de pendientes
        this.pendingChanges = [...this.pendingChanges, ...changes];
        this.updateSyncStatus({ 
          pendingChanges: this.pendingChanges.length 
        });
        return of(error);
      })
    ).subscribe(() => {
      this.updateSyncStatus({ 
        pendingChanges: this.pendingChanges.length 
      });
    });
  }
  
  /**
   * Actualiza el estado de sincronización
   */
  private updateSyncStatus(partialStatus: Partial<SyncStatus>): void {
    const currentStatus = this.syncStatusSubject.value;
    this.syncStatusSubject.next({
      ...currentStatus,
      ...partialStatus
    });
  }
  
  /**
   * Maneja cambios en el estado de red del navegador
   */
  private onNetworkStatusChange(isOnline: boolean): void {
    this.logger.info(`Estado de red: ${isOnline ? 'online' : 'offline'}`);
    
    if (isOnline) {
      // Reintentar conexión
      this.reconnect();
      
      // Intentar enviar cambios pendientes
      if (this.pendingChanges.length > 0) {
        this.pushPendingChanges();
      }
    } else {
      // Registrar la desconexión
      this.updateSyncStatus({ connected: false });
    }
  }
  
  /**
   * Reintenta la conexión
   */
  reconnect(): Observable<boolean> {
    // Limpiar conexiones existentes
    this.cleanupConnections();
    
    // Reiniciar conexión
    this.initializeConnection();
    
    // Retornar observable que indica éxito (para mantener la interfaz)
    return of(true);
  }
  
  /**
   * Limpia todas las conexiones activas
   */
  private cleanupConnections(): void {
    // WebSocket
    if (this.wsSubject) {
      this.wsSubject.complete();
      this.wsSubject = null;
    }
    if (this.wsSubscription) {
      this.wsSubscription.unsubscribe();
      this.wsSubscription = null;
    }
    
    // SSE
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    
    // Polling
    this.stopPolling();
  }
  
  /**
   * Retorna observable con el estado de sincronización
   */
  get syncStatus$(): Observable<SyncStatus> {
    return this.syncStatusSubject.asObservable();
  }
  
  /**
   * Observable para eventos de sincronización
   */
  get events$(): Observable<SyncEventData> {
    return this.eventsSubject.asObservable();
  }
  
  /**
   * Observable filtrado para eventos de elementos
   */
  get elementEvents$(): Observable<SyncEventData> {
    return this.events$.pipe(
      filter(event => event.type === 'element')
    );
  }
  
  /**
   * Observable filtrado para eventos de conexiones
   */
  get connectionEvents$(): Observable<SyncEventData> {
    return this.events$.pipe(
      filter(event => event.type === 'connection')
    );
  }
  
  /**
   * Observable filtrado para eventos de alertas
   */
  get alertEvents$(): Observable<SyncEventData> {
    return this.events$.pipe(
      filter(event => event.type === 'alert')
    );
  }
  
  /**
   * Observable filtrado para eventos de estado
   */
  get stateEvents$(): Observable<SyncEventData> {
    return this.events$.pipe(
      filter(event => event.type === 'state')
    );
  }
  
  /**
   * Método para forzar la sincronización manual
   */
  forceSync(): Observable<boolean> {
    // Según el tipo de conexión, forzar sincronización
    switch (this.syncStatusSubject.value.connectionType) {
      case 'polling':
        return this.pollChanges().pipe(map(() => true));
      case 'websocket':
      case 'sse':
      default:
        // Para WebSocket y SSE, enviar un ping para verificar la conexión
        return this.http.get<{success: boolean}>(`${this.pollUrl}/ping`).pipe(
          map(response => response.success)
        );
    }
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.cleanupConnections();
  }
} 
