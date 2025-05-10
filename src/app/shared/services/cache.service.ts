import { Injectable } from '@angular/core';
import { AppConfig } from '../config/app.config';
import { LoggerService } from '../../core/services/logger.service';

/**
 * Opciones para configurar el comportamiento del caché
 */
export interface CacheOptions {
  /** Tiempo de expiración en milisegundos */
  expiryTime?: number;
  /** Clave para almacenamiento local (si es diferente de la clave principal) */
  storageKey?: string;
  /** Si se debe usar localStorage además de memoria */
  useLocalStorage?: boolean;
}

/**
 * Estructura de datos para elementos almacenados en caché
 */
interface CacheEntry<T> {
  /** Datos almacenados */
  data: T;
  /** Timestamp de cuando se guardó en caché */
  timestamp: number;
}

/**
 * Servicio de caché genérico que gestiona almacenamiento en memoria y localStorage
 */
@Injectable({
  providedIn: 'root'
})
export class CacheService {
  /** Almacenamiento en memoria para caché rápida */
  private memoryCache = new Map<string, CacheEntry<any>>();
  
  constructor(private logger: LoggerService) {}
  
  /**
   * Guarda un elemento en caché
   * @param key Clave única para identificar el elemento
   * @param data Datos a almacenar
   * @param options Opciones de configuración
   */
  set<T>(key: string, data: T, options?: CacheOptions): void {
    const timestamp = Date.now();
    const cacheEntry: CacheEntry<T> = { data, timestamp };
    
    // Guardar en memoria
    this.memoryCache.set(key, cacheEntry);
    this.logger.debug(`[Cache] Guardado en memoria: ${key}`);
    
    // Guardar en localStorage si está configurado
    if (options?.useLocalStorage) {
      try {
        const storageKey = options.storageKey || key;
        const prefixedKey = this.getPrefixedKey(storageKey);
        localStorage.setItem(prefixedKey, JSON.stringify(cacheEntry));
        this.logger.debug(`[Cache] Guardado en localStorage: ${prefixedKey}`);
      } catch (error) {
        this.logger.error('[Cache] Error al guardar en localStorage', error);
      }
    }
  }
  
  /**
   * Obtiene un elemento del caché
   * @param key Clave única del elemento
   * @param options Opciones de configuración
   * @returns El elemento almacenado o null si no existe o expiró
   */
  get<T>(key: string, options?: CacheOptions): T | null {
    // Definir tiempo de expiración
    const expiryTime = options?.expiryTime || AppConfig.cache.defaultExpiryTime;
    const now = Date.now();
    
    // Primero intentar desde memoria
    const cachedEntry = this.memoryCache.get(key);
    
    if (cachedEntry) {
      // Comprobar si ha expirado
      if (now - cachedEntry.timestamp < expiryTime) {
        this.logger.debug(`[Cache] Obtenido de memoria: ${key}`);
        return cachedEntry.data as T;
      }
      
      // Si expiró, eliminarlo
      this.logger.debug(`[Cache] Expirado en memoria: ${key}`);
      this.memoryCache.delete(key);
    }
    
    // Intentar desde localStorage si está habilitado
    if (options?.useLocalStorage) {
      try {
        const storageKey = options.storageKey || key;
        const prefixedKey = this.getPrefixedKey(storageKey);
        const storedItem = localStorage.getItem(prefixedKey);
        
        if (storedItem) {
          const parsedItem: CacheEntry<T> = JSON.parse(storedItem);
          
          // Comprobar si ha expirado
          if (now - parsedItem.timestamp < expiryTime) {
            // Actualizar caché en memoria
            this.memoryCache.set(key, parsedItem);
            this.logger.debug(`[Cache] Obtenido de localStorage: ${prefixedKey}`);
            return parsedItem.data as T;
          }
          
          // Si expiró, eliminarlo
          this.logger.debug(`[Cache] Expirado en localStorage: ${prefixedKey}`);
          localStorage.removeItem(prefixedKey);
        }
      } catch (error) {
        this.logger.error('[Cache] Error al leer de localStorage', error);
      }
    }
    
    return null;
  }
  
  /**
   * Comprueba si una clave existe en el caché y no ha expirado
   * @param key Clave a verificar
   * @param options Opciones de configuración
   * @returns true si existe y no ha expirado
   */
  has(key: string, options?: CacheOptions): boolean {
    const expiryTime = options?.expiryTime || AppConfig.cache.defaultExpiryTime;
    const now = Date.now();
    
    // Comprobar en memoria
    const cachedEntry = this.memoryCache.get(key);
    if (cachedEntry && (now - cachedEntry.timestamp < expiryTime)) {
      return true;
    }
    
    // Comprobar en localStorage si está habilitado
    if (options?.useLocalStorage) {
      try {
        const storageKey = options.storageKey || key;
        const prefixedKey = this.getPrefixedKey(storageKey);
        const storedItem = localStorage.getItem(prefixedKey);
        
        if (storedItem) {
          const parsedItem: CacheEntry<any> = JSON.parse(storedItem);
          return (now - parsedItem.timestamp < expiryTime);
        }
      } catch (error) {
        this.logger.error('[Cache] Error al verificar existencia en localStorage', error);
      }
    }
    
    return false;
  }
  
  /**
   * Elimina un elemento de caché
   * @param key Clave del elemento a eliminar
   * @param options Opciones de configuración
   */
  remove(key: string, options?: CacheOptions): void {
    // Eliminar de memoria
    this.memoryCache.delete(key);
    this.logger.debug(`[Cache] Eliminado de memoria: ${key}`);
    
    // Eliminar de localStorage si está habilitado
    if (options?.useLocalStorage) {
      try {
        const storageKey = options.storageKey || key;
        const prefixedKey = this.getPrefixedKey(storageKey);
        localStorage.removeItem(prefixedKey);
        this.logger.debug(`[Cache] Eliminado de localStorage: ${prefixedKey}`);
      } catch (error) {
        this.logger.error('[Cache] Error al eliminar de localStorage', error);
      }
    }
  }
  
  /**
   * Limpia toda la caché
   * @param options Opciones para la limpieza
   */
  clear(options?: {preserveLocalStorage?: boolean}): void {
    // Limpiar memoria
    this.memoryCache.clear();
    this.logger.debug('[Cache] Memoria limpiada');
    
    // Limpiar localStorage si no se indica preservarlo
    if (!options?.preserveLocalStorage) {
      try {
        // Obtener todas las claves del localStorage
        const toRemove: string[] = [];
        const prefix = AppConfig.cache.storagePrefix;
        
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(prefix)) {
            toRemove.push(key);
          }
        }
        
        // Eliminar las claves relacionadas con la caché
        toRemove.forEach(key => localStorage.removeItem(key));
        this.logger.debug(`[Cache] LocalStorage limpiado: ${toRemove.length} elementos`);
      } catch (error) {
        this.logger.error('[Cache] Error al limpiar localStorage', error);
      }
    }
  }
  
  /**
   * Elimina todas las entradas expiradas del caché
   * @param expiryTime Tiempo de expiración personalizado (opcional)
   */
  cleanExpired(expiryTime?: number): void {
    const expiry = expiryTime || AppConfig.cache.defaultExpiryTime;
    const now = Date.now();
    
    // Limpiar memoria
    for (const [key, entry] of this.memoryCache.entries()) {
      if (now - entry.timestamp >= expiry) {
        this.memoryCache.delete(key);
        this.logger.debug(`[Cache] Eliminada entrada expirada: ${key}`);
      }
    }
    
    // Limpiar localStorage
    try {
      const prefix = AppConfig.cache.storagePrefix;
      const toRemove: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
          try {
            const item = localStorage.getItem(key);
            if (item) {
              const parsedItem: CacheEntry<any> = JSON.parse(item);
              if (now - parsedItem.timestamp >= expiry) {
                toRemove.push(key);
              }
            }
          } catch (e) {
            // Si hay error al parsear, se considera inválido
            toRemove.push(key);
          }
        }
      }
      
      toRemove.forEach(key => localStorage.removeItem(key));
      this.logger.debug(`[Cache] Limpiadas entradas expiradas de localStorage: ${toRemove.length}`);
    } catch (error) {
      this.logger.error('[Cache] Error al limpiar entradas expiradas', error);
    }
  }
  
  /**
   * Obtiene la clave con el prefijo de la aplicación para localStorage
   */
  private getPrefixedKey(key: string): string {
    return `${AppConfig.cache.storagePrefix}${key}`;
  }
} 