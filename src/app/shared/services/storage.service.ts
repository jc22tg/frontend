import { Injectable } from '@angular/core';
import { LoggerService } from '../../core/services/logger.service';

/**
 * Servicio para gestionar el almacenamiento persistente
 * Utiliza IndexedDB para guardar datos grandes como imágenes y localStorage para datos pequeños
 */
@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private readonly DB_NAME = 'network-map-storage';
  private readonly DB_VERSION = 1;
  private readonly STORE_NAME = 'cache-store';
  
  private db: IDBDatabase | null = null;
  private dbReady: Promise<boolean>;
  private dbReadyResolver!: (value: boolean) => void;

  constructor(private logger: LoggerService) {
    // Crear promesa que se resolverá cuando la base de datos esté lista
    this.dbReady = new Promise<boolean>(resolve => {
      this.dbReadyResolver = resolve;
    });
    
    // Inicializar la base de datos
    this.initDatabase();
  }

  /**
   * Inicializa la base de datos IndexedDB
   */
  private async initDatabase(): Promise<void> {
    try {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);
      
      // Gestionar evento de actualización/creación
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Crear almacén de objetos si no existe
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          db.createObjectStore(this.STORE_NAME, { keyPath: 'key' });
          this.logger.debug('Almacén de caché creado');
        }
      };
      
      // Gestionar éxito
      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        this.logger.debug('Base de datos inicializada correctamente');
        this.dbReadyResolver(true);
      };
      
      // Gestionar error
      request.onerror = (event) => {
        this.logger.error('Error al inicializar la base de datos', (event.target as IDBOpenDBRequest).error);
        this.dbReadyResolver(false);
      };
    } catch (error) {
      this.logger.error('Error inesperado al inicializar la base de datos:', error);
      this.dbReadyResolver(false);
    }
  }

  /**
   * Guarda un elemento en el almacenamiento
   * @param key Clave única del elemento
   * @param value Valor a guardar
   * @returns Promesa que se resuelve cuando se completa la operación
   */
  async setItem<T>(key: string, value: T): Promise<void> {
    // Intentar usar IndexedDB para datos grandes
    if (this.isLargeObject(value)) {
      return this.setItemInIndexedDB(key, value);
    }
    
    // Usar localStorage para datos pequeños
    try {
      localStorage.setItem(key, JSON.stringify({
        key,
        value,
        timestamp: Date.now()
      }));
    } catch (error) {
      this.logger.error(`Error al guardar ${key} en localStorage:`, error);
      
      // Si falla (posiblemente por tamaño), intentar usar IndexedDB
      return this.setItemInIndexedDB(key, value);
    }
  }

  /**
   * Guarda un elemento en IndexedDB
   */
  private async setItemInIndexedDB<T>(key: string, value: T): Promise<void> {
    // Esperar a que la base de datos esté lista
    const isReady = await this.dbReady;
    if (!isReady || !this.db) {
      throw new Error('Base de datos no disponible');
    }
    
    return new Promise<void>((resolve, reject) => {
      try {
        const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
        const store = transaction.objectStore(this.STORE_NAME);
        
        const request = store.put({
          key,
          value,
          timestamp: Date.now()
        });
        
        request.onsuccess = () => resolve();
        request.onerror = (event) => {
          this.logger.error(`Error al guardar ${key} en IndexedDB:`, request.error);
          reject(request.error);
        };
      } catch (error) {
        this.logger.error(`Error al guardar ${key} en IndexedDB:`, error);
        reject(error);
      }
    });
  }

  /**
   * Obtiene un elemento del almacenamiento
   * @param key Clave del elemento
   * @returns El valor almacenado o null si no existe
   */
  async getItem<T>(key: string): Promise<T | null> {
    // Intentar primero con localStorage
    try {
      const storedItem = localStorage.getItem(key);
      if (storedItem) {
        const parsed = JSON.parse(storedItem);
        return parsed.value as T;
      }
    } catch (error) {
      this.logger.warn(`No se pudo obtener ${key} de localStorage:`, error);
    }
    
    // Si no está en localStorage, intentar con IndexedDB
    return this.getItemFromIndexedDB<T>(key);
  }

  /**
   * Obtiene un elemento de IndexedDB
   */
  private async getItemFromIndexedDB<T>(key: string): Promise<T | null> {
    // Esperar a que la base de datos esté lista
    const isReady = await this.dbReady;
    if (!isReady || !this.db) {
      return null;
    }
    
    return new Promise<T | null>((resolve, reject) => {
      try {
        const transaction = this.db!.transaction([this.STORE_NAME], 'readonly');
        const store = transaction.objectStore(this.STORE_NAME);
        
        const request = store.get(key);
        
        request.onsuccess = () => {
          if (request.result) {
            resolve(request.result.value as T);
          } else {
            resolve(null);
          }
        };
        
        request.onerror = () => {
          this.logger.error(`Error al obtener ${key} de IndexedDB:`, request.error);
          reject(request.error);
        };
      } catch (error) {
        this.logger.error(`Error al acceder a IndexedDB para ${key}:`, error);
        resolve(null);
      }
    });
  }

  /**
   * Elimina un elemento del almacenamiento
   * @param key Clave del elemento a eliminar
   */
  async removeItem(key: string): Promise<void> {
    // Eliminar de localStorage
    try {
      localStorage.removeItem(key);
    } catch (error) {
      this.logger.warn(`Error al eliminar ${key} de localStorage:`, error);
    }
    
    // Eliminar de IndexedDB
    await this.removeItemFromIndexedDB(key);
  }

  /**
   * Elimina un elemento de IndexedDB
   */
  private async removeItemFromIndexedDB(key: string): Promise<void> {
    // Esperar a que la base de datos esté lista
    const isReady = await this.dbReady;
    if (!isReady || !this.db) {
      return;
    }
    
    return new Promise<void>((resolve) => {
      try {
        const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
        const store = transaction.objectStore(this.STORE_NAME);
        
        const request = store.delete(key);
        
        request.onsuccess = () => resolve();
        request.onerror = () => {
          this.logger.error(`Error al eliminar ${key} de IndexedDB:`, request.error);
          resolve(); // Resolver de todos modos para no bloquear
        };
      } catch (error) {
        this.logger.error(`Error al acceder a IndexedDB para eliminar ${key}:`, error);
        resolve(); // Resolver de todos modos para no bloquear
      }
    });
  }

  /**
   * Obtiene todas las claves que empiezan con un prefijo
   * @param prefix Prefijo para filtrar las claves
   * @returns Lista de claves que coinciden con el prefijo
   */
  async getKeys(prefix = ''): Promise<string[]> {
    const keys: string[] = [];
    
    // Obtener claves de localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        keys.push(key);
      }
    }
    
    // Obtener claves de IndexedDB
    const dbKeys = await this.getKeysFromIndexedDB(prefix);
    keys.push(...dbKeys);
    
    // Eliminar duplicados
    return [...new Set(keys)];
  }

  /**
   * Obtiene claves de IndexedDB que coinciden con un prefijo
   */
  private async getKeysFromIndexedDB(prefix: string): Promise<string[]> {
    // Esperar a que la base de datos esté lista
    const isReady = await this.dbReady;
    if (!isReady || !this.db) {
      return [];
    }
    
    return new Promise<string[]>((resolve) => {
      try {
        const transaction = this.db!.transaction([this.STORE_NAME], 'readonly');
        const store = transaction.objectStore(this.STORE_NAME);
        const keys: string[] = [];
        
        const request = store.openCursor();
        
        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result as IDBCursorWithValue;
          
          if (cursor) {
            const key = cursor.value.key;
            if (key.startsWith(prefix)) {
              keys.push(key);
            }
            cursor.continue();
          } else {
            resolve(keys);
          }
        };
        
        request.onerror = () => {
          this.logger.error('Error al obtener claves de IndexedDB:', request.error);
          resolve([]);
        };
      } catch (error) {
        this.logger.error('Error al acceder a IndexedDB para obtener claves:', error);
        resolve([]);
      }
    });
  }

  /**
   * Limpia todo el almacenamiento o solo los elementos con un prefijo
   * @param prefix Prefijo opcional para limpiar selectivamente
   */
  async clear(prefix?: string): Promise<void> {
    if (prefix) {
      // Obtener todas las claves con el prefijo y eliminarlas una por una
      const keys = await this.getKeys(prefix);
      for (const key of keys) {
        await this.removeItem(key);
      }
    } else {
      // Limpiar localStorage
      localStorage.clear();
      
      // Limpiar IndexedDB
      await this.clearIndexedDB();
    }
  }

  /**
   * Limpia todos los datos en IndexedDB
   */
  private async clearIndexedDB(): Promise<void> {
    // Esperar a que la base de datos esté lista
    const isReady = await this.dbReady;
    if (!isReady || !this.db) {
      return;
    }
    
    return new Promise<void>((resolve) => {
      try {
        const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
        const store = transaction.objectStore(this.STORE_NAME);
        
        const request = store.clear();
        
        request.onsuccess = () => {
          this.logger.debug('IndexedDB limpiado correctamente');
          resolve();
        };
        
        request.onerror = () => {
          this.logger.error('Error al limpiar IndexedDB:', request.error);
          resolve(); // Resolver de todos modos para no bloquear
        };
      } catch (error) {
        this.logger.error('Error al acceder a IndexedDB para limpiarlo:', error);
        resolve(); // Resolver de todos modos para no bloquear
      }
    });
  }

  /**
   * Determina si un objeto es "grande" y debería almacenarse en IndexedDB
   * En este caso, consideramos grandes los objetos que son Blob, File o ArrayBuffer
   */
  private isLargeObject(value: any): boolean {
    return value instanceof Blob || 
           value instanceof File || 
           value instanceof ArrayBuffer ||
           // También considerar grande si la serialización es mayor a 100KB
           (typeof value === 'object' && JSON.stringify(value).length > 100 * 1024);
  }
} 
