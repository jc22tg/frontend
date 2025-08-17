import { Injectable } from '@angular/core';
import { openDB, IDBPDatabase } from 'idb';
import { OperationType, OfflineOperation } from '../models/offline-operation.model';
import { BehaviorSubject } from 'rxjs';

export interface StoreConfig {
  name: string;
  keyPath: string;
  indexes?: { name: string; keyPath: string; unique?: boolean }[];
}

// Versión de la base de datos - incrementar cuando cambie la estructura
const DB_VERSION = 1;
const DB_NAME = 'network-map-offline';

@Injectable({
  providedIn: 'root',
})
export class OfflineStorageService {
  private db: IDBPDatabase | null = null;
  private operationsCount = new BehaviorSubject<number>(0);
  public operationsCount$ = this.operationsCount.asObservable();

  // Configuración de tiendas predeterminadas
  private defaultStores: StoreConfig[] = [
    {
      name: 'operations', // Almacén para operaciones pendientes
      keyPath: 'id',
      indexes: [
        { name: 'timestamp', keyPath: 'timestamp' },
        { name: 'storeName', keyPath: 'storeName' },
        { name: 'priority', keyPath: 'priority' },
      ],
    },
    {
      name: 'networkElements', // Elementos de red en caché
      keyPath: 'id',
      indexes: [
        { name: 'type', keyPath: 'type' },
        { name: 'status', keyPath: 'status' },
      ],
    },
    {
      name: 'connections', // Conexiones en caché
      keyPath: 'id',
      indexes: [
        { name: 'sourceId', keyPath: 'sourceId' },
        { name: 'targetId', keyPath: 'targetId' },
      ],
    },
  ];

  // Almacén de configuraciones adicionales de módulos específicos
  private additionalStoreConfigs: StoreConfig[] = [];

  constructor() {
    this.initDatabase();
  }

  // Permitir que módulos específicos registren sus propios almacenes
  public registerStores(storeConfigs: StoreConfig[]): void {
    this.additionalStoreConfigs = [...this.additionalStoreConfigs, ...storeConfigs];
    
    // Si la base de datos ya está inicializada, incrementar versión y reinicializar
    if (this.db) {
      this.db.close();
      this.initDatabase(DB_VERSION + 1);
    }
  }

  private async initDatabase(version = DB_VERSION): Promise<void> {
    try {
      // Combinar almacenes predeterminados y adicionales
      const allStores = [...this.defaultStores, ...this.additionalStoreConfigs];
      
      this.db = await openDB(DB_NAME, version, {
        upgrade(db, oldVersion, newVersion, transaction) {
          // Crear los almacenes que no existan
          for (const store of allStores) {
            if (!db.objectStoreNames.contains(store.name)) {
              const objectStore = db.createObjectStore(store.name, { keyPath: store.keyPath });
              
              // Crear índices para el almacén
              if (store.indexes) {
                for (const index of store.indexes) {
                  objectStore.createIndex(index.name, index.keyPath, { unique: index.unique || false });
                }
              }
            }
          }
        },
      });

      // Inicializar contador de operaciones pendientes
      this.updateOperationsCount();
      
      console.log('Base de datos offline inicializada correctamente');
    } catch (error) {
      console.error('Error al inicializar la base de datos offline:', error);
    }
  }

  // Método auxiliar para garantizar que la base de datos esté disponible
  private async ensureDb(): Promise<IDBPDatabase> {
    if (!this.db) {
      await this.initDatabase();
    }
    
    if (!this.db) {
      throw new Error('No se pudo inicializar la base de datos offline');
    }
    
    return this.db;
  }

  // Obtener un elemento por su clave
  public async get<T>(storeName: string, key: string): Promise<T | undefined> {
    try {
      const db = await this.ensureDb();
      return await db.get(storeName, key);
    } catch (error) {
      console.error(`Error al obtener datos de ${storeName}:`, error);
      return undefined;
    }
  }

  // Obtener todos los elementos de un almacén
  public async getAll<T>(storeName: string): Promise<T[]> {
    try {
      const db = await this.ensureDb();
      return await db.getAll(storeName);
    } catch (error) {
      console.error(`Error al obtener todos los datos de ${storeName}:`, error);
      return [];
    }
  }

  // Guardar un elemento (y opcionalmente añadir a la cola de operaciones)
  public async set<T>(
    storeName: string, 
    key: string, 
    data: T, 
    addToQueue = true, 
    priority = 1
  ): Promise<void> {
    try {
      const db = await this.ensureDb();
      await db.put(storeName, data);

      // Si se solicita, añadir a la cola de operaciones
      if (addToQueue) {
        await this.addOperation({
          id: `${storeName}_${key}_${Date.now()}`,
          timestamp: Date.now(),
          storeName,
          type: OperationType.UPDATE,
          key,
          data,
          priority,
          attempts: 0
        });
      }
    } catch (error) {
      console.error(`Error al almacenar datos en ${storeName}:`, error);
      throw error;
    }
  }

  // Eliminar un elemento
  public async delete(
    storeName: string, 
    key: string, 
    addToQueue = true, 
    priority = 1
  ): Promise<void> {
    try {
      const db = await this.ensureDb();
      await db.delete(storeName, key);

      // Si se solicita, añadir a la cola de operaciones
      if (addToQueue) {
        await this.addOperation({
          id: `${storeName}_${key}_${Date.now()}`,
          timestamp: Date.now(),
          storeName,
          type: OperationType.DELETE,
          key,
          priority,
          attempts: 0
        });
      }
    } catch (error) {
      console.error(`Error al eliminar datos de ${storeName}:`, error);
      throw error;
    }
  }

  // Limpiar un almacén completo
  public async clearStore(storeName: string): Promise<void> {
    try {
      const db = await this.ensureDb();
      await db.clear(storeName);
    } catch (error) {
      console.error(`Error al limpiar el almacén ${storeName}:`, error);
      throw error;
    }
  }

  // Añadir una operación a la cola de pendientes
  private async addOperation(operation: OfflineOperation): Promise<void> {
    try {
      const db = await this.ensureDb();
      await db.add('operations', operation);
      await this.updateOperationsCount();
    } catch (error) {
      console.error('Error al añadir operación a la cola:', error);
      throw error;
    }
  }

  // Obtener operaciones pendientes para sincronización
  public async getPendingOperations(limit = 50): Promise<OfflineOperation[]> {
    try {
      const db = await this.ensureDb();
      
      // Obtener operaciones ordenadas por prioridad y luego por timestamp
      const tx = db.transaction('operations', 'readonly');
      const index = tx.store.index('priority');
      
      // La consulta no admite directamente ordenación múltiple, así que ordenamos por prioridad
      // y luego manualmente por timestamp
      const operations = await index.getAll();
      
      return operations
        .sort((a, b) => {
          // Primero ordenar por prioridad (descendente)
          if (a.priority !== b.priority) {
            return b.priority - a.priority;
          }
          // Luego por timestamp (ascendente - más antiguos primero)
          return a.timestamp - b.timestamp;
        })
        .slice(0, limit);
    } catch (error) {
      console.error('Error al obtener operaciones pendientes:', error);
      return [];
    }
  }

  // Eliminar una operación completada
  public async removeOperation(operationId: string): Promise<void> {
    try {
      const db = await this.ensureDb();
      await db.delete('operations', operationId);
      await this.updateOperationsCount();
    } catch (error) {
      console.error('Error al eliminar operación completada:', error);
      throw error;
    }
  }

  // Actualizar el contador de operaciones pendientes
  private async updateOperationsCount(): Promise<void> {
    try {
      const db = await this.ensureDb();
      const count = await db.count('operations');
      this.operationsCount.next(count);
    } catch (error) {
      console.error('Error al actualizar contador de operaciones:', error);
      this.operationsCount.next(0);
    }
  }

  // Actualizar los intentos de una operación fallida
  public async updateOperationAttempt(operationId: string): Promise<void> {
    try {
      const db = await this.ensureDb();
      const operation = await db.get('operations', operationId);
      
      if (operation) {
        operation.attempts += 1;
        operation.lastAttempt = Date.now();
        await db.put('operations', operation);
      }
    } catch (error) {
      console.error('Error al actualizar intento de operación:', error);
      throw error;
    }
  }

  // Buscar elementos por índice
  public async getByIndex<T>(
    storeName: string, 
    indexName: string, 
    value: any
  ): Promise<T[]> {
    try {
      const db = await this.ensureDb();
      const tx = db.transaction(storeName, 'readonly');
      const index = tx.store.index(indexName);
      return await index.getAll(value);
    } catch (error) {
      console.error(`Error al buscar por índice ${indexName} en ${storeName}:`, error);
      return [];
    }
  }
} 
