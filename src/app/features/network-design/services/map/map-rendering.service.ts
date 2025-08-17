import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { MapPerformanceService } from './map-performance.service';
import { LoggerService } from '../../../../core/services/logger.service';
import { map } from 'rxjs/operators';

export interface PerformanceMetrics {
  fps: number;
  renderTime: number;
  elementCount: number;
  memoryUsage: number;
  elapsed: number;
}

export interface MapStatistics {
  totalElements: number;
  totalConnections: number;
  visibleConnections: number;
  totalAlerts: number;
  performanceLevel: string;
  memoryUsageFormatted: string;
  loadTime: number;
}

export interface OptimizationConfig {
  level: OptimizationLevel;
  autoOptimize: boolean;
  maxVisibleElements: number;
  clusteringEnabled: boolean;
  virtualScrollingEnabled: boolean;
}

export enum OptimizationLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  ULTRA = 'ULTRA',
  AUTO = 'AUTO'
}

/**
 * Servicio que se encarga del renderizado del mapa
 * Adaptador para el MapPerformanceService para mantener compatibilidad
 */
@Injectable({
  providedIn: 'root'
})
export class MapRenderingService {
  private performanceService = inject(MapPerformanceService);
  private logger = inject(LoggerService);
  
  // Subjects para las métricas
  private performanceMetricsSubject = new BehaviorSubject<PerformanceMetrics>({
    fps: 0,
    renderTime: 0,
    elementCount: 0,
    memoryUsage: 0,
    elapsed: 0
  });
  
  private mapStatisticsSubject = new BehaviorSubject<MapStatistics>({
    totalElements: 0,
    totalConnections: 0,
    visibleConnections: 0,
    totalAlerts: 0,
    performanceLevel: 'Desconocido',
    memoryUsageFormatted: '0 MB',
    loadTime: 0
  });
  
  private optimizationConfigSubject = new BehaviorSubject<OptimizationConfig>({
    level: OptimizationLevel.AUTO,
    autoOptimize: true,
    maxVisibleElements: 1000,
    clusteringEnabled: true,
    virtualScrollingEnabled: true
  });
  
  // Observables públicos
  public performanceMetrics = this.performanceMetricsSubject.asObservable();
  public mapStatistics = this.mapStatisticsSubject.asObservable();
  public optimizationConfig = this.optimizationConfigSubject.asObservable();
  
  // Último puntaje de rendimiento calculado
  private lastPerformanceScore = 0;
  
  constructor() {
    this.initializeSubscriptions();
    this.logger.debug('MapRenderingService inicializado - Adaptador para MapPerformanceService');
  }
  
  /**
   * Inicializa las suscripciones a los servicios originales
   */
  private initializeSubscriptions(): void {
    // Suscribirse a las métricas de rendimiento del MapPerformanceService
    this.performanceService.getMetrics().subscribe(metrics => {
      this.performanceMetricsSubject.next(metrics);
      this.calculatePerformanceScore();
    });
    
    // Suscribirse a las estadísticas del mapa del MapPerformanceService
    this.performanceService.getMapStatistics().subscribe(stats => {
      this.mapStatisticsSubject.next(stats);
    });
    
    // Suscribirse a la configuración de rendimiento
    this.performanceService.config$.subscribe(config => {
      this.optimizationConfigSubject.next({
        level: this.determineOptimizationLevel(config),
        autoOptimize: config.autoOptimize,
        maxVisibleElements: config.maxVisibleElements,
        clusteringEnabled: config.enableClustering,
        virtualScrollingEnabled: config.enableVirtualization
      });
    });
  }
  
  /**
   * Determina el nivel de optimización basado en la configuración
   */
  private determineOptimizationLevel(config: any): OptimizationLevel {
    if (!config.autoOptimize) {
      if (config.enableClustering && config.enableVirtualization) {
        return OptimizationLevel.HIGH;
      } else if (config.enableClustering || config.enableVirtualization) {
        return OptimizationLevel.MEDIUM;
      } else {
        return OptimizationLevel.LOW;
      }
    }
    
    return OptimizationLevel.AUTO;
  }
  
  /**
   * Calcula una puntuación de rendimiento en base a las métricas actuales
   * @returns Puntuación de rendimiento entre 0 y 100
   */
  calculatePerformanceScore(): number {
    const metrics = this.performanceMetricsSubject.value;
    
    // Usar FPS y tiempo de renderizado como base
    const fpsFactor = Math.min(metrics.fps / 60, 1); // FPS relativo a 60fps
    const renderFactor = Math.max(0, 1 - (metrics.renderTime / 100)); // Factor de tiempo de renderizado
    
    // Calcular factor de complejidad basado en número de elementos
    let complexityFactor = 1;
    if (metrics.elementCount > 1000) {
      complexityFactor = Math.max(0.5, 1000 / metrics.elementCount);
    }
    
    // Combinar factores con pesos:
    // - FPS: 50%
    // - Tiempo de renderizado: 30%
    // - Complejidad: 20%
    const score = (fpsFactor * 0.5 + renderFactor * 0.3 + complexityFactor * 0.2) * 100;
    
    this.lastPerformanceScore = Math.round(score);
    return this.lastPerformanceScore;
  }
  
  /**
   * Establece el nivel de optimización
   * @param level Nivel de optimización
   */
  setOptimizationLevel(level: OptimizationLevel): void {
    const config = this.optimizationConfigSubject.value;
    
    // Actualizar configuración del adaptador
    this.optimizationConfigSubject.next({
      ...config,
      level
    });
    
    // Actualizar la configuración real en el servicio subyacente
    this.performanceService.updateConfig({
      autoOptimize: level === OptimizationLevel.AUTO,
      enableClustering: level !== OptimizationLevel.LOW,
      enableVirtualization: level === OptimizationLevel.HIGH || level === OptimizationLevel.ULTRA
    });
    
    this.logger.debug(`Nivel de optimización actualizado a: ${level}`);
  }
  
  /**
   * Habilita o deshabilita la optimización automática
   * @param enabled Estado de la optimización automática
   */
  setAutoOptimization(enabled: boolean): void {
    const config = this.optimizationConfigSubject.value;
    
    // Actualizar configuración del adaptador
    this.optimizationConfigSubject.next({
      ...config,
      autoOptimize: enabled,
      level: enabled ? OptimizationLevel.AUTO : config.level
    });
    
    // Actualizar la configuración real en el servicio subyacente
    this.performanceService.updateConfig({
      autoOptimize: enabled
    });
    
    this.logger.debug(`Optimización automática ${enabled ? 'activada' : 'desactivada'}`);
  }
} 
