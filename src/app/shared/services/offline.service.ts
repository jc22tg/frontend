import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, from, throwError, switchMap } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { StorageService } from './storage.service';
import { LoggerService } from '../../core/services/logger.service';

/**
 * Interfaz para configurar el cacheo
 */
export interface CacheConfig {
  maxAge?: number;  // Tiempo máximo en ms antes de considerar el cache obsoleto
  version?: string; // Versión del caché para invalidación
  cacheOnly?: boolean; // Indica si solo se debe usar el caché sin red
}

/**
 * Servicio para gestionar el modo offline y cacheo de recursos
 */
@Injectable({
  providedIn: 'root'
})
export class OfflineService {
  // Estado de la conexión
  private isOnline: boolean = navigator.onLine;
  
  // Caché de tiles
  private tileCache = new Map<string, {data: Blob, timestamp: number, version: string}>();
  
  // Base URL para recursos de mapa offline
  private readonly offlineMapAssetsPath = 'assets/leaflet/offline-tiles';
  
  // Tamaño máximo del caché en bytes (50MB)
  private readonly maxCacheSize = 50 * 1024 * 1024;
  
  // Versión actual del caché
  private readonly cacheVersion = '1.0.0';

  constructor(
    private http: HttpClient,
    private storage: StorageService,
    private logger: LoggerService
  ) {
    // Observar cambios en la conexión
    window.addEventListener('online', () => this.handleConnectionChange(true));
    window.addEventListener('offline', () => this.handleConnectionChange(false));
    
    // Cargar caché al inicio
    this.loadCache();
  }

  /**
   * Maneja cambios en el estado de la conexión
   */
  private handleConnectionChange(online: boolean): void {
    this.isOnline = online;
    this.logger.debug(`Conexión cambiada: ${online ? 'Online' : 'Offline'}`);
    
    // Si volvemos a estar online, sincronizar datos pendientes
    if (online) {
      this.syncPendingData();
    }
  }

  /**
   * Verifica si el dispositivo está online
   */
  isNetworkAvailable(): boolean {
    return this.isOnline;
  }

  /**
   * Obtiene un recurso con soporte para modo offline
   * @param url URL del recurso
   * @param config Configuración del cacheo
   * @returns Observable con el recurso
   */
  getResource<T>(url: string, config: CacheConfig = {}): Observable<T> {
    // Usar valores por defecto si no se proporcionan
    const options = {
      maxAge: config.maxAge || 24 * 60 * 60 * 1000, // 24 horas por defecto
      version: config.version || this.cacheVersion,
      cacheOnly: config.cacheOnly || false
    };
    
    // Convertir la promesa a Observable
    return from(this.getFromCache<T>(url, options.version, options.maxAge)).pipe(
      switchMap(cachedData => {
        if (cachedData) {
          return of(cachedData);
        }
        
        // Si estamos offline o en modo cacheOnly, fallar si no hay datos en caché
        if (!this.isOnline || options.cacheOnly) {
          return throwError(() => new Error('No hay conexión y el recurso no está en caché'));
        }
        
        // Obtener de la red y guardar en caché
        return this.http.get<T>(url).pipe(
          tap(data => this.saveToCache(url, data, options.version)),
          catchError(error => {
            this.logger.error(`Error al obtener ${url}:`, error);
            return throwError(() => error);
          })
        );
      })
    );
  }

  /**
   * Obtiene un tile de mapa con soporte para modo offline
   * @param z Nivel de zoom
   * @param x Coordenada X
   * @param y Coordenada Y
   * @returns Observable con el blob de la imagen
   */
  getTileImage(z: number, x: number, y: number): Observable<Blob> {
    const tileKey = `${z}/${x}/${y}`;
    const url = `https://tile.openstreetmap.org/${tileKey}.png`;
    
    // Revisar caché de tiles
    const cachedTile = this.tileCache.get(tileKey);
    if (cachedTile && (Date.now() - cachedTile.timestamp) < (30 * 24 * 60 * 60 * 1000)) {
      return of(cachedTile.data);
    }
    
    // Si estamos offline, intentar cargar tile local
    if (!this.isOnline) {
      return this.getOfflineTile(z, x, y);
    }
    
    // Obtener de la red y guardar en caché
    return this.http.get(url, { responseType: 'blob' }).pipe(
      tap(blob => {
        // Guardar en caché
        this.tileCache.set(tileKey, {
          data: blob,
          timestamp: Date.now(),
          version: this.cacheVersion
        });
        
        // Guardar en IndexedDB para persistencia
        this.storage.setItem(`tile:${tileKey}`, blob);
        
        // Limpiar caché si excede el tamaño máximo
        this.cleanupCache();
      }),
      catchError(error => {
        // En caso de error, intentar cargar tile offline
        return this.getOfflineTile(z, x, y);
      })
    );
  }

  /**
   * Obtiene un tile offline almacenado en assets
   */
  private getOfflineTile(z: number, x: number, y: number): Observable<Blob> {
    const localPath = `${this.offlineMapAssetsPath}/${z}/${x}/${y}.png`;
    
    return this.http.get(localPath, { responseType: 'blob' }).pipe(
      catchError(error => {
        // Si no se encuentra el tile offline, devolver un tile de error
        return this.http.get('assets/leaflet/error-tiles/error-tile.png', { responseType: 'blob' });
      })
    );
  }

  /**
   * Carga el caché desde el almacenamiento persistente
   */
  private async loadCache(): Promise<void> {
    try {
      // Obtener todas las claves que empiezan con "tile:"
      const keys = await this.storage.getKeys('tile:');
      
      // Cargar cada tile al caché en memoria
      for (const key of keys) {
        const tileKey = key.replace('tile:', '');
        const blob = await this.storage.getItem<Blob>(key);
        
        if (blob) {
          this.tileCache.set(tileKey, {
            data: blob,
            timestamp: Date.now(), // Usar tiempo actual como aproximación
            version: this.cacheVersion
          });
        }
      }
      
      this.logger.debug(`Caché cargado: ${this.tileCache.size} tiles`);
    } catch (error) {
      this.logger.error('Error al cargar caché:', error);
    }
  }

  /**
   * Limpia el caché si excede el tamaño máximo
   */
  private cleanupCache(): void {
    if (this.tileCache.size <= 100) return; // No limpiar si hay pocos elementos
    
    // Ordenar por antigüedad
    const entries = Array.from(this.tileCache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    // Eliminar los más antiguos hasta reducir el tamaño
    while (this.tileCache.size > 1000) {
      const [key] = entries.shift() || [];
      if (key) {
        this.tileCache.delete(key);
        this.storage.removeItem(`tile:${key}`);
      }
    }
  }

  /**
   * Guarda un recurso en caché
   */
  private saveToCache<T>(key: string, data: T, version: string): void {
    this.storage.setItem(key, {
      data,
      timestamp: Date.now(),
      version
    });
  }

  /**
   * Obtiene un recurso del caché
   */
  private async getFromCache<T>(key: string, version: string, maxAge: number): Promise<T | null> {
    try {
      const cachedItem = await this.storage.getItem<{data: T, timestamp: number, version: string}>(key);
      
      // Verificar si existe, es válido por versión y no ha expirado
      if (cachedItem && 
          cachedItem.version === version && 
          (Date.now() - cachedItem.timestamp) < maxAge) {
        return cachedItem.data;
      }
    } catch (error) {
      this.logger.error(`Error al obtener ${key} de caché:`, error);
    }
    
    return null;
  }

  /**
   * Sincroniza datos pendientes cuando se recupera la conexión
   */
  private syncPendingData(): void {
    // Implementación para sincronizar cambios realizados offline
    this.logger.debug('Sincronizando datos pendientes...');
    
    // Aquí iría la lógica para enviar cambios al servidor
  }

  /**
   * Prepara recursos para uso offline
   * @param boundingBox Área geográfica a preparar
   * @param zoomLevels Niveles de zoom a descargar
   */
  prepareOfflineResources(
    boundingBox: { north: number, south: number, east: number, west: number },
    zoomLevels: number[] = [13, 14, 15]
  ): Observable<{total: number, current: number, status: string}> {
    // Calcular tiles necesarios
    const tiles: {z: number, x: number, y: number}[] = [];
    
    for (const zoom of zoomLevels) {
      // Convertir coordenadas geográficas a coordenadas de tiles
      const minX = this.long2tile(boundingBox.west, zoom);
      const maxX = this.long2tile(boundingBox.east, zoom);
      const minY = this.lat2tile(boundingBox.north, zoom);
      const maxY = this.lat2tile(boundingBox.south, zoom);
      
      // Agregar cada tile al array
      for (let x = minX; x <= maxX; x++) {
        for (let y = minY; y <= maxY; y++) {
          tiles.push({ z: zoom, x, y });
        }
      }
    }
    
    // Crear observable para seguimiento de progreso
    return new Observable(observer => {
      const total = tiles.length;
      let current = 0;
      
      // Procesar tiles en lotes para no saturar la red
      const processNextBatch = (startIndex: number, batchSize: number) => {
        const endIndex = Math.min(startIndex + batchSize, total);
        const batch = tiles.slice(startIndex, endIndex);
        
        // Si no hay más tiles, completar
        if (batch.length === 0) {
          observer.next({ total, current, status: 'Completado' });
          observer.complete();
          return;
        }
        
        // Descargar tiles en paralelo con límite
        const promises = batch.map(tile => 
          this.getTileImage(tile.z, tile.x, tile.y).toPromise()
            .then(() => {
              current++;
              observer.next({ 
                total, 
                current, 
                status: `Descargando tiles (${current}/${total})` 
              });
            })
            .catch(() => {
              current++;
              // Continuar incluso si hay errores
            })
        );
        
        // Cuando se complete el lote, procesar el siguiente
        Promise.all(promises).then(() => {
          processNextBatch(endIndex, batchSize);
        });
      };
      
      // Iniciar procesamiento con lotes de 10 tiles
      observer.next({ total, current, status: 'Iniciando descarga...' });
      processNextBatch(0, 10);
    });
  }
  
  /**
   * Convierte longitud a coordenada X de tile
   */
  private long2tile(lon: number, zoom: number): number {
    return Math.floor((lon + 180) / 360 * Math.pow(2, zoom));
  }
  
  /**
   * Convierte latitud a coordenada Y de tile
   */
  private lat2tile(lat: number, zoom: number): number {
    return Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom));
  }
} 
