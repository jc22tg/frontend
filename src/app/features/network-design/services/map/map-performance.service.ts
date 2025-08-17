import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, interval } from 'rxjs';
import { map, takeWhile, tap } from 'rxjs/operators';
import { LoggerService } from '../../../../core/services/logger.service';
import { MapService } from '../map.service';

/**
 * Interfaz para la configuración de rendimiento
 */
export interface PerformanceConfig {
  enableClustering: boolean;
  clusterDistance: number;
  enableVirtualization: boolean;
  maxVisibleElements: number;
  enableFPSMonitoring: boolean;
  targetFPS: number;
  autoOptimize: boolean;
  memoryLimit: number; // En MB
}

/**
 * Interfaz para el estado actual de rendimiento
 */
export interface PerformanceState {
  fps: number;
  elementCount: number;
  visibleElements: number;
  renderTime: number;
  memoryUsage: number;
  isClusteringActive: boolean;
  isVirtualizationActive: boolean;
  recommendedSettings?: Partial<PerformanceConfig>;
}

/**
 * Servicio para gestionar el rendimiento del mapa
 * 
 * Este servicio proporciona funcionalidades para:
 * - Monitorizar el rendimiento (FPS, tiempo de renderizado)
 * - Gestionar estrategias de optimización (clustering, virtualización)
 * - Aplicar configuraciones de rendimiento automáticamente
 */
@Injectable({
  providedIn: 'root'
})
export class MapPerformanceService {
  // Dependencias
  private logger = inject(LoggerService);
  private mapService = inject(MapService);
  
  // Configuración por defecto
  private defaultConfig: PerformanceConfig = {
    enableClustering: true,
    clusterDistance: 60,
    enableVirtualization: true, 
    maxVisibleElements: 1000,
    enableFPSMonitoring: true,
    targetFPS: 30,
    autoOptimize: true,
    memoryLimit: 500
  };
  
  // Estado actual
  private config: PerformanceConfig;
  private state: PerformanceState = {
    fps: 0,
    elementCount: 0,
    visibleElements: 0,
    renderTime: 0,
    memoryUsage: 0,
    isClusteringActive: false,
    isVirtualizationActive: false
  };
  
  // BehaviorSubjects
  private configSubject = new BehaviorSubject<PerformanceConfig>(this.defaultConfig);
  private stateSubject = new BehaviorSubject<PerformanceState>(this.state);
  private isMonitoringSubject = new BehaviorSubject<boolean>(false);
  
  // Observables públicos
  readonly config$ = this.configSubject.asObservable();
  readonly state$ = this.stateSubject.asObservable();
  readonly isMonitoring$ = this.isMonitoringSubject.asObservable();
  
  // Variables para monitoreo
  private frameCount = 0;
  private lastFrameTime = 0;
  private monitoringStartTime = 0;
  private isMonitoring = false;
  private animationFrameId: number | null = null;
  
  constructor() {
    this.config = {...this.defaultConfig};
    this.logger.debug('MapPerformanceService inicializado');
  }
  
  /**
   * Inicializa el servicio de rendimiento
   * @param config Configuración personalizada (opcional)
   */
  initialize(config?: Partial<PerformanceConfig>): void {
    // Combinar configuración personalizada con la predeterminada
    this.config = {
      ...this.defaultConfig,
      ...config
    };
    
    this.configSubject.next(this.config);
    
    // Iniciar monitoreo si está configurado
    if (this.config.enableFPSMonitoring) {
      this.startMonitoring();
    }
    
    this.logger.debug('Servicio de rendimiento inicializado', this.config);
  }
  
  /**
   * Actualiza la configuración de rendimiento
   * @param config Configuración parcial a aplicar
   */
  updateConfig(config: Partial<PerformanceConfig>): void {
    this.config = {
      ...this.config,
      ...config
    };
    
    // Aplicar cambios
    if (config.enableClustering !== undefined) {
      this.toggleClustering(config.enableClustering);
    }
    
    if (config.enableVirtualization !== undefined) {
      this.toggleVirtualization(config.enableVirtualization);
    }
    
    if (config.enableFPSMonitoring !== undefined) {
      if (config.enableFPSMonitoring) {
        this.startMonitoring();
      } else {
        this.stopMonitoring();
      }
    }
    
    this.configSubject.next(this.config);
    this.logger.debug('Configuración de rendimiento actualizada', config);
  }
  
  /**
   * Inicia el monitoreo de rendimiento
   */
  startMonitoring(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.isMonitoringSubject.next(true);
    this.monitoringStartTime = performance.now();
    this.frameCount = 0;
    
    // Iniciar monitoreo con requestAnimationFrame
    this.lastFrameTime = performance.now();
    this.monitorFrames();
    
    this.logger.debug('Monitoreo de rendimiento iniciado');
  }
  
  /**
   * Detiene el monitoreo de rendimiento
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) return;
    
    this.isMonitoring = false;
    this.isMonitoringSubject.next(false);
    
    // Detener el ciclo de monitoreo
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    this.logger.debug('Monitoreo de rendimiento detenido');
  }
  
  /**
   * Realiza el monitoreo de frames para calcular FPS
   */
  private monitorFrames(): void {
    const frameCallback = () => {
      const now = performance.now();
      const delta = now - this.lastFrameTime;
      this.lastFrameTime = now;
      
      // Incrementar contador de frames
      this.frameCount++;
      
      // Actualizar FPS cada medio segundo
      if (now - this.monitoringStartTime > 500) {
        const fps = Math.round((this.frameCount * 1000) / (now - this.monitoringStartTime));
        this.updateState({ fps });
        
        // Reiniciar contador
        this.frameCount = 0;
        this.monitoringStartTime = now;
        
        // Auto-optimizar si está activado
        if (this.config.autoOptimize) {
          this.autoOptimize(fps);
        }
      }
      
      // Continuar el ciclo si seguimos monitoreando
      if (this.isMonitoring) {
        this.animationFrameId = requestAnimationFrame(frameCallback);
      }
    };
    
    this.animationFrameId = requestAnimationFrame(frameCallback);
  }
  
  /**
   * Aplica optimizaciones automáticas basadas en el rendimiento actual
   * @param currentFPS FPS actual
   */
  private autoOptimize(currentFPS: number): void {
    const targetFPS = this.config.targetFPS;
    
    // Si estamos por debajo del target, aplicar optimizaciones
    if (currentFPS < targetFPS * 0.8) {
      // Calcular recomendaciones
      const recommendations: Partial<PerformanceConfig> = {};
      
      if (!this.state.isClusteringActive && this.state.elementCount > 200) {
        recommendations.enableClustering = true;
      }
      
      if (!this.state.isVirtualizationActive && this.state.elementCount > 500) {
        recommendations.enableVirtualization = true;
        recommendations.maxVisibleElements = Math.min(
          this.state.elementCount, 
          Math.round(this.state.elementCount * (currentFPS / targetFPS))
        );
      }
      
      // Actualizar recomendaciones
      if (Object.keys(recommendations).length > 0) {
        this.updateState({ recommendedSettings: recommendations });
        
        // Aplicar automáticamente si está configurado
        if (this.config.autoOptimize) {
          this.updateConfig(recommendations);
          this.logger.debug('Optimizaciones automáticas aplicadas', recommendations);
        }
      }
    }
  }
  
  /**
   * Activa o desactiva el clustering de elementos
   * @param enable Si es true, activa el clustering
   */
  toggleClustering(enable: boolean): void {
    // Actualizar estado
    this.state.isClusteringActive = enable;
    this.stateSubject.next({ ...this.state });
    
    // Aplicar al mapa (a implementar en MapService)
    // this.mapService.setClustering?.(enable, this.config.clusterDistance);
    
    this.logger.debug(`Clustering ${enable ? 'activado' : 'desactivado'}`);
  }
  
  /**
   * Activa o desactiva la virtualización (mostrar solo elementos visibles)
   * @param enable Si es true, activa la virtualización
   */
  toggleVirtualization(enable: boolean): void {
    // Actualizar estado
    this.state.isVirtualizationActive = enable;
    this.stateSubject.next({ ...this.state });
    
    // Aplicar al mapa (a implementar en MapService)
    // this.mapService.setVirtualization?.(enable, this.config.maxVisibleElements);
    
    this.logger.debug(`Virtualización ${enable ? 'activada' : 'desactivada'}`);
  }
  
  /**
   * Actualiza el estado de rendimiento
   * @param partialState Estado parcial a actualizar
   */
  updateState(partialState: Partial<PerformanceState>): void {
    this.state = {
      ...this.state,
      ...partialState
    };
    
    this.stateSubject.next(this.state);
  }
  
  /**
   * Mide el tiempo de ejecución de una función
   * @param fn Función a medir
   * @returns Resultado de la función y tiempo de ejecución en ms
   */
  measureExecutionTime<T>(fn: () => T): { result: T, time: number } {
    const start = performance.now();
    const result = fn();
    const time = performance.now() - start;
    
    return { result, time };
  }
  
  /**
   * Actualiza el recuento de elementos
   * @param total Total de elementos
   * @param visible Elementos visibles actualmente
   */
  updateElementCount(total: number, visible: number): void {
    this.updateState({
      elementCount: total,
      visibleElements: visible
    });
  }
  
  /**
   * Estima el uso de memoria del mapa
   * @returns Observable que emite el uso estimado de memoria en MB
   */
  estimateMemoryUsage(): Observable<number> {
    // Esta es una implementación básica y aproximada
    // En un entorno real, se necesitaría una medición más precisa
    return interval(5000).pipe(
      takeWhile(() => this.isMonitoring),
      map(() => {
        // Estimar memoria basada en número de elementos y complejidad
        const elementsMemory = this.state.elementCount * 5; // ~5KB por elemento
        const mapMemory = 50; // ~50MB base para el mapa
        
        // Convertir a MB
        return Math.round((elementsMemory + mapMemory) / 10) / 100;
      }),
      tap(memoryUsage => {
        this.updateState({ memoryUsage });
      })
    );
  }
  
  /**
   * Intenta liberar memoria forzando la recolección de basura
   * Nota: Esto solo funciona en entornos específicos donde window.gc está disponible
   */
  forceGarbageCollection(): void {
    // Intentar forzar la recolección de basura si está disponible
    // Esto solo funciona en algunos navegadores con flags especiales
    if ((window as any).gc) {
      this.logger.debug('Forzando recolección de basura');
      (window as any).gc();
    } else {
      this.logger.debug('La recolección de basura manual no está disponible en este entorno');
    }
  }

  /**
   * Obtiene las métricas de rendimiento actuales
   * @returns Observable con las métricas de rendimiento
   */
  getMetrics(): Observable<any> {
    return this.state$.pipe(
      map(state => ({
        fps: state.fps,
        renderTime: state.renderTime,
        elementCount: state.elementCount,
        memoryUsage: state.memoryUsage,
        elapsed: performance.now() - this.monitoringStartTime
      }))
    );
  }

  /**
   * Obtiene estadísticas del mapa
   * @returns Observable con las estadísticas del mapa
   */
  getMapStatistics(): Observable<any> {
    return this.state$.pipe(
      map(state => {
        // Calcular nivel de rendimiento basado en FPS
        let performanceLevel = 'Óptimo';
        if (state.fps < 30 && state.fps >= 20) {
          performanceLevel = 'Aceptable';
        } else if (state.fps < 20 && state.fps >= 10) {
          performanceLevel = 'Bajo';
        } else if (state.fps < 10) {
          performanceLevel = 'Crítico';
        }

        // Formatear uso de memoria
        const memoryUsageFormatted = state.memoryUsage < 1024 
          ? `${Math.round(state.memoryUsage)} MB` 
          : `${(state.memoryUsage / 1024).toFixed(2)} GB`;

        return {
          totalElements: state.elementCount,
          totalConnections: 0, // Esto debería venir de otro servicio
          visibleConnections: 0, // Esto debería venir de otro servicio
          totalAlerts: 0, // Esto debería venir de otro servicio
          performanceLevel,
          memoryUsageFormatted,
          loadTime: 0 // Esto debería venir de otro servicio o calcularse
        };
      })
    );
  }

  /**
   * Limpia la caché de memoización
   */
  clearMemoizationCache(): void {
    // Implementación para limpiar caches si existen
    this.logger.debug('Caché de memoización limpiada');
  }
} 
