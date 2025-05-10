import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { LoggerService } from '../../../../../core/services/logger.service';

/**
 * Configuración de optimización de rendimiento
 */
export interface PerformanceConfig {
  useWebGL: boolean;
  useClustering: boolean;
  useVirtualization: boolean;
  maxElementsPerView: number;
  fpsTarget: number;
}

/**
 * Información de rendimiento del mapa
 */
export interface PerformanceInfo {
  fps: number;
  elementsRendered: number;
  connectionsRendered: number;
  memoryUsage?: number; // En MB si está disponible
  renderTime: number; // Tiempo en ms
}

/**
 * Servicio para gestionar y optimizar el rendimiento del mapa
 * 
 * Este servicio proporciona funcionalidades para:
 * - Monitorear performance (FPS, elementos renderizados)
 * - Configurar ajustes de optimización
 * - Implementar técnicas de carga progresiva
 * - Gestionar clustering de elementos
 */
@Injectable({
  providedIn: 'root'
})
export class MapPerformanceService {
  // Dependencias
  private logger = inject(LoggerService);
  
  // Configuración por defecto
  private defaultConfig: PerformanceConfig = {
    useWebGL: true,
    useClustering: true,
    useVirtualization: true,
    maxElementsPerView: 1000,
    fpsTarget: 60
  };
  
  // Estado interno
  private config: PerformanceConfig;
  private performanceInfo: PerformanceInfo = {
    fps: 0,
    elementsRendered: 0,
    connectionsRendered: 0,
    renderTime: 0
  };
  
  // Monitoreo de FPS
  private lastFrameTime = 0;
  private frameCount = 0;
  private frameTimeTotal = 0;
  private fpsUpdateInterval = 1000; // 1 segundo
  private lastFpsUpdateTime = 0;
  
  // BehaviorSubjects
  private configSubject = new BehaviorSubject<PerformanceConfig>(this.defaultConfig);
  private performanceInfoSubject = new BehaviorSubject<PerformanceInfo>(this.performanceInfo);
  
  // Observables públicos
  readonly config$ = this.configSubject.asObservable();
  readonly performanceInfo$ = this.performanceInfoSubject.asObservable();
  
  constructor() {
    this.config = { ...this.defaultConfig };
    this.logger.debug('MapPerformanceService inicializado');
  }
  
  /**
   * Inicializa el monitoreo de rendimiento
   */
  initPerformanceMonitoring(): void {
    this.lastFrameTime = performance.now();
    this.lastFpsUpdateTime = this.lastFrameTime;
    
    // Iniciar el loop de monitoreo
    this.monitorPerformance();
    
    this.logger.debug('Monitoreo de rendimiento iniciado');
  }
  
  /**
   * Actualiza y monitorea el rendimiento
   */
  private monitorPerformance(): void {
    const now = performance.now();
    const elapsed = now - this.lastFrameTime;
    
    // Registrar datos de este frame
    this.frameCount++;
    this.frameTimeTotal += elapsed;
    
    // Actualizar FPS cada segundo
    if (now - this.lastFpsUpdateTime >= this.fpsUpdateInterval) {
      this.performanceInfo.fps = Math.round((this.frameCount * 1000) / (now - this.lastFpsUpdateTime));
      this.performanceInfoSubject.next({ ...this.performanceInfo });
      
      // Resetear contadores
      this.frameCount = 0;
      this.frameTimeTotal = 0;
      this.lastFpsUpdateTime = now;
      
      // Auto-optimizar si está por debajo del objetivo
      if (this.performanceInfo.fps < this.config.fpsTarget * 0.8) {
        this.autoOptimize();
      }
    }
    
    this.lastFrameTime = now;
    
    // Continuar el loop
    requestAnimationFrame(() => this.monitorPerformance());
  }
  
  /**
   * Actualiza la información de elementos renderizados
   * @param elementsCount Número de elementos
   * @param connectionsCount Número de conexiones
   * @param renderTime Tiempo de renderizado
   */
  updateRenderingInfo(elementsCount: number, connectionsCount: number, renderTime: number): void {
    this.performanceInfo.elementsRendered = elementsCount;
    this.performanceInfo.connectionsRendered = connectionsCount;
    this.performanceInfo.renderTime = renderTime;
    
    // No emitir aquí, se hará en el intervalo de FPS
  }
  
  /**
   * Auto-optimiza la configuración según el rendimiento actual
   */
  private autoOptimize(): void {
    const currentConfig = { ...this.config };
    let configChanged = false;
    
    // Si FPS bajo, intentar optimizaciones
    if (this.performanceInfo.fps < this.config.fpsTarget * 0.8) {
      // Reducir elementos máximos si hay muchos
      if (this.performanceInfo.elementsRendered > currentConfig.maxElementsPerView) {
        currentConfig.maxElementsPerView = Math.max(100, Math.floor(currentConfig.maxElementsPerView * 0.8));
        configChanged = true;
      }
      
      // Activar clustering si no está activo
      if (!currentConfig.useClustering) {
        currentConfig.useClustering = true;
        configChanged = true;
      }
      
      // Activar virtualización si no está activa
      if (!currentConfig.useVirtualization) {
        currentConfig.useVirtualization = true;
        configChanged = true;
      }
    }
    
    if (configChanged) {
      this.logger.debug('Auto-optimización aplicada debido a bajo rendimiento');
      this.setConfig(currentConfig);
    }
  }
  
  /**
   * Obtiene la configuración actual de rendimiento
   */
  getConfig(): PerformanceConfig {
    return { ...this.config };
  }
  
  /**
   * Establece la configuración de rendimiento
   * @param config Nueva configuración
   */
  setConfig(config: Partial<PerformanceConfig>): void {
    this.config = { ...this.config, ...config };
    this.configSubject.next(this.config);
    this.logger.debug('Configuración de rendimiento actualizada', this.config);
  }
  
  /**
   * Restablece la configuración a los valores por defecto
   */
  resetConfig(): void {
    this.config = { ...this.defaultConfig };
    this.configSubject.next(this.config);
    this.logger.debug('Configuración de rendimiento restablecida a valores por defecto');
  }
  
  /**
   * Obtiene la información actual de rendimiento
   */
  getPerformanceInfo(): PerformanceInfo {
    return { ...this.performanceInfo };
  }
  
  /**
   * Determina si se debe usar clustering según la configuración y el número de elementos
   * @param elementCount Número de elementos en vista
   */
  shouldUseClustering(elementCount: number): boolean {
    return this.config.useClustering && elementCount > 200;
  }
  
  /**
   * Determina si se debe usar WebGL según la configuración
   */
  shouldUseWebGL(): boolean {
    return this.config.useWebGL;
  }
  
  /**
   * Determina si se debe usar virtualización según la configuración
   */
  shouldUseVirtualization(): boolean {
    return this.config.useVirtualization;
  }
  
  /**
   * Obtiene el número máximo de elementos a renderizar
   */
  getMaxElementsPerView(): number {
    return this.config.maxElementsPerView;
  }
} 