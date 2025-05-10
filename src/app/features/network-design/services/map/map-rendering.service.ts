import { Injectable, NgZone } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { NetworkElement } from '../../../../shared/types/network.types';
import { LoggerService } from '../../../../core/services/logger.service';

/**
 * Interfaz para métricas de rendimiento del mapa
 */
export interface PerformanceMetrics {
  /** Cuadros por segundo estimados */
  fps: number;
  /** Tiempo de renderizado en ms */
  renderTime: number;
  /** Número de elementos renderizados */
  elementCount: number;
  /** Uso estimado de memoria en MB */
  memoryUsage: number;
  /** Tiempo transcurrido en ms */
  elapsed: number;
}

/**
 * Interfaz para estadísticas del mapa
 */
export interface MapStatistics {
  /** Número total de elementos */
  totalElements: number;
  /** Número total de conexiones */
  totalConnections: number;
  /** Número de conexiones visibles */
  visibleConnections: number;
  /** Número de alertas */
  totalAlerts: number;
  /** Nivel de rendimiento (Alto, Medio, Bajo) */
  performanceLevel: string;
  /** Uso de memoria formateado */
  memoryUsageFormatted: string;
  /** Tiempo de carga en ms */
  loadTime: number;
}

/**
 * Servicio para gestionar el renderizado y métricas de rendimiento del mapa
 * 
 * Este servicio proporciona funcionalidades para monitorear y optimizar
 * el rendimiento del mapa, así como para calcular estadísticas útiles.
 */
@Injectable({
  providedIn: 'root'
})
export class MapRenderingService {
  /** Subject para métricas de rendimiento */
  private performanceMetrics$ = new Subject<PerformanceMetrics>();
  
  /** Subject para estadísticas del mapa */
  private mapStatistics$ = new Subject<MapStatistics>();
  
  /** Valores de la última medición de rendimiento */
  private lastMetrics: PerformanceMetrics = {
    fps: 60,
    renderTime: 0,
    elementCount: 0,
    memoryUsage: 0,
    elapsed: 0
  };
  
  /** Valores de las últimas estadísticas */
  private lastStatistics: MapStatistics = {
    totalElements: 0,
    totalConnections: 0,
    visibleConnections: 0,
    totalAlerts: 0,
    performanceLevel: 'Alto',
    memoryUsageFormatted: '0 MB',
    loadTime: 0
  };
  
  /** Tiempo de inicio para mediciones */
  private startTime = 0;
  
  /** Contador de frames para cálculo de FPS */
  private frameCount = 0;
  
  /** Timestamp del último frame para cálculo de FPS */
  private lastFrameTime = 0;
  
  /** Valor de caché para memoización */
  private memoizedValues = new Map<string, any>();
  
  constructor(
    private logger: LoggerService,
    private zone: NgZone
  ) {
    // Iniciar tiempo de referencia
    this.startTime = performance.now();
  }
  
  /**
   * Inicia el seguimiento de rendimiento
   */
  startPerformanceTracking(): void {
    this.startTime = performance.now();
    this.lastFrameTime = performance.now();
    this.frameCount = 0;
  }
  
  /**
   * Registra un frame renderizado para métricas de rendimiento
   * @param elementCount Número de elementos renderizados
   */
  trackFrame(elementCount: number): void {
    // Incrementar contador de frames
    this.frameCount++;
    
    // Calcular tiempo transcurrido desde el último frame
    const now = performance.now();
    const elapsed = now - this.lastFrameTime;
    
    // Actualizar tiempo del último frame
    this.lastFrameTime = now;
    
    // Calcular FPS cada 10 frames
    if (this.frameCount % 10 === 0) {
      const totalElapsed = now - this.startTime;
      const fps = Math.round((this.frameCount / totalElapsed) * 1000);
      
      // Actualizar métricas
      this.lastMetrics = {
        fps,
        renderTime: elapsed,
        elementCount,
        memoryUsage: this.estimateMemoryUsage(elementCount),
        elapsed: totalElapsed
      };
      
      // Notificar nuevas métricas
      this.zone.run(() => {
        this.performanceMetrics$.next(this.lastMetrics);
      });
    }
  }
  
  /**
   * Estima el uso de memoria basado en la cantidad de elementos
   * @param elementCount Número de elementos
   * @returns Uso estimado de memoria en MB
   */
  private estimateMemoryUsage(elementCount: number): number {
    // Estimación básica: cada elemento usa aproximadamente 5KB
    // y hay overhead general de la aplicación
    const baseMemory = 50; // MB
    const elementMemory = (elementCount * 5) / 1024; // MB
    
    return Math.round((baseMemory + elementMemory) * 10) / 10;
  }
  
  /**
   * Actualiza estadísticas del mapa
   * @param elements Elementos del mapa
   * @param connectionCount Número de conexiones
   * @param visibleConnectionCount Número de conexiones visibles
   * @param alertCount Número de alertas
   * @param loadTime Tiempo de carga
   */
  updateMapStatistics(
    elements: NetworkElement[],
    connectionCount: number,
    visibleConnectionCount: number,
    alertCount: number,
    loadTime: number
  ): void {
    // Calcular nivel de rendimiento basado en FPS
    const performanceLevel = this.lastMetrics.fps > 30 ? 'Alto' : 
                           this.lastMetrics.fps > 15 ? 'Medio' : 'Bajo';
    
    // Formato de uso de memoria
    const memoryUsageFormatted = `${this.lastMetrics.memoryUsage} MB`;
    
    // Actualizar estadísticas
    this.lastStatistics = {
      totalElements: elements.length,
      totalConnections: connectionCount,
      visibleConnections: visibleConnectionCount,
      totalAlerts: alertCount,
      performanceLevel,
      memoryUsageFormatted,
      loadTime
    };
    
    // Notificar nuevas estadísticas
    this.zone.run(() => {
      this.mapStatistics$.next(this.lastStatistics);
    });
  }
  
  /**
   * Implementa memoización para cálculos costosos
   * @param key Clave única para el cálculo
   * @param callback Función que realiza el cálculo costoso
   * @param ttlMs Tiempo de vida en milisegundos para la caché
   */
  memoize<T>(key: string, callback: () => T, ttlMs = 5000): T {
    // Verificar si tenemos un valor en caché y si sigue siendo válido
    const cachedValue = this.memoizedValues.get(key);
    
    if (cachedValue && (Date.now() - cachedValue.timestamp) < ttlMs) {
      return cachedValue.value as T;
    }
    
    // Calcular nuevo valor
    const value = callback();
    
    // Guardar en caché con timestamp
    this.memoizedValues.set(key, {
      value,
      timestamp: Date.now()
    });
    
    return value;
  }
  
  /**
   * Limpia la caché de memoización
   */
  clearMemoizationCache(): void {
    this.memoizedValues.clear();
  }
  
  /**
   * Obtiene las métricas de rendimiento actuales
   */
  getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.lastMetrics };
  }
  
  /**
   * Obtiene las estadísticas del mapa actuales
   */
  getMapStatistics(): MapStatistics {
    return { ...this.lastStatistics };
  }
  
  /**
   * Observable para métricas de rendimiento
   */
  get performanceMetrics(): Observable<PerformanceMetrics> {
    return this.performanceMetrics$.asObservable();
  }
  
  /**
   * Observable para estadísticas del mapa
   */
  get mapStatistics(): Observable<MapStatistics> {
    return this.mapStatistics$.asObservable();
  }
  
  /**
   * Optimiza el mapa para mejor rendimiento
   * @returns Ajustes aplicados para la optimización
   */
  optimizeForPerformance(): { clusterView: boolean, reduceDetails: boolean } {
    return {
      clusterView: true,
      reduceDetails: true
    };
  }
} 