import { Injectable } from '@angular/core';
import { LoggerService } from '../../../core/services/logger.service';
import { NetworkMapRendererService } from './network-map-renderer.service';
import { MapService } from './map.service';

/**
 * Niveles de capacidad de hardware
 */
export type HardwareLevel = 'low' | 'medium' | 'high';

/**
 * Resultados de la detección de hardware
 */
export interface HardwareCapabilities {
  level: HardwareLevel;
  gpuAcceleration: boolean;
  memoryConstraints: boolean;
  isMobile: boolean;
  webGLAvailable: boolean;
  maxTextureSize?: number;
  details: {
    cores: number;
    ram: string;
    gpu: string | null;
    userAgent: string;
  };
}

/**
 * Servicio que detecta las capacidades del dispositivo y configura el rendimiento
 * en consecuencia para optimizar la experiencia del usuario.
 */
@Injectable({
  providedIn: 'root'
})
export class HardwareDetectionService {
  private _capabilities: HardwareCapabilities | null = null;

  constructor(
    private logger: LoggerService,
    private mapRenderer: NetworkMapRendererService,
    private mapService: MapService
  ) {}

  /**
   * Detecta las capacidades de hardware del dispositivo
   * @returns Capacidades de hardware detectadas
   */
  detectCapabilities(): HardwareCapabilities {
    if (this._capabilities) {
      return this._capabilities;
    }

    const result: HardwareCapabilities = {
      level: 'medium', // Por defecto
      gpuAcceleration: this.hasGPUAcceleration(),
      memoryConstraints: this.hasMemoryConstraints(),
      isMobile: this.isMobileDevice(),
      webGLAvailable: this.isWebGLAvailable(),
      details: {
        cores: this.detectCPUCores(),
        ram: 'Desconocido',
        gpu: this.detectGPU(),
        userAgent: navigator.userAgent
      }
    };

    // Detectar tamaño máximo de textura si WebGL está disponible
    if (result.webGLAvailable) {
      result.maxTextureSize = this.detectMaxTextureSize();
    }

    // Determinar nivel según las capacidades
    result.level = this.determineHardwareLevel(result);

    this._capabilities = result;
    return result;
  }

  /**
   * Obtiene la configuración de rendimiento recomendada según las capacidades de hardware
   * @returns Configuración de rendimiento recomendada
   */
  getRecommendedPerformanceConfig(): Record<string, any> {
    const capabilities = this.detectCapabilities();
    
    // Configuración adaptada según nivel de hardware
    switch (capabilities.level) {
      case 'low':
        return {
          maxVisibleElements: 200,
          enableClustering: true,
          clusterRadius: 100,
          enableWebGL: false,
          animationsEnabled: false,
          useProgressiveLoading: true,
          batchSize: 25,
          processingDelay: 100,
          useSimplifiedRendering: true,
          preloadDistance: 50,
          connectionsVisible: 'limited', // Solo conexiones cercanas
          enableMiniMap: false
        };
      
      case 'medium':
        return {
          maxVisibleElements: 1000,
          enableClustering: true,
          clusterRadius: 80,
          enableWebGL: capabilities.webGLAvailable,
          animationsEnabled: true,
          useProgressiveLoading: true,
          batchSize: 50,
          processingDelay: 50,
          useSimplifiedRendering: false,
          preloadDistance: 100,
          connectionsVisible: 'visible', // Conexiones en área visible
          enableMiniMap: true
        };
      
      case 'high':
        return {
          maxVisibleElements: 5000,
          enableClustering: capabilities.isMobile, // Solo en móviles
          clusterRadius: 50,
          enableWebGL: capabilities.webGLAvailable,
          animationsEnabled: true,
          useProgressiveLoading: false,
          batchSize: 100,
          processingDelay: 10,
          useSimplifiedRendering: false,
          preloadDistance: 200,
          connectionsVisible: 'all', // Todas las conexiones
          enableMiniMap: true
        };
      
      default:
        return {
          maxVisibleElements: 500,
          enableClustering: true,
          enableWebGL: capabilities.webGLAvailable && !capabilities.isMobile,
          useProgressiveLoading: true
        };
    }
  }

  /**
   * Determina el nivel de hardware según capacidades detectadas
   */
  private determineHardwareLevel(capabilities: HardwareCapabilities): HardwareLevel {
    // Dispositivos móviles generalmente se consideran nivel bajo o medio
    if (capabilities.isMobile) {
      return capabilities.webGLAvailable && capabilities.gpuAcceleration ? 'medium' : 'low';
    }

    // Comprobar restricciones de memoria
    if (capabilities.memoryConstraints) {
      return 'low';
    }

    // Si tiene GPU y WebGL, probablemente sea nivel alto
    if (capabilities.gpuAcceleration && capabilities.webGLAvailable) {
      return capabilities.details.cores >= 4 ? 'high' : 'medium';
    }

    // Por defecto, nivel medio
    return 'medium';
  }

  /**
   * Detecta si el dispositivo tiene restricciones de memoria
   */
  private hasMemoryConstraints(): boolean {
    // En navegadores que lo soportan
    if ('deviceMemory' in navigator) {
      // @ts-expect-error: deviceMemory no está en la definición estándar de Navigator
      return navigator.deviceMemory < 4; // Menos de 4GB se considera limitado
    }

    // Estimación basada en otras características si no está disponible
    return this.isMobileDevice();
  }

  /**
   * Detecta si hay aceleración GPU disponible
   */
  private hasGPUAcceleration(): boolean {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as WebGLRenderingContext | null;
    
    if (!gl) {
      return false;
    }

    // Comprobamos extensiones y rendimiento
    const extensions = gl.getSupportedExtensions();
    return !!extensions && extensions.length > 20; // Heurística simple
  }

  /**
   * Comprueba si WebGL está disponible
   */
  private isWebGLAvailable(): boolean {
    try {
      const canvas = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && 
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch(e) {
      return false;
    }
  }

  /**
   * Detecta si es un dispositivo móvil
   */
  private isMobileDevice(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  /**
   * Intenta detectar el número de núcleos de CPU
   */
  private detectCPUCores(): number {
    if (typeof navigator.hardwareConcurrency !== 'undefined') {
      return navigator.hardwareConcurrency;
    }
    return 2; // Valor por defecto
  }

  /**
   * Intenta detectar información de la GPU
   */
  private detectGPU(): string | null {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as WebGLRenderingContext | null;
      
      if (!gl) {
        return null;
      }
      
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        return gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      }
    } catch (e) {
      // Error al detectar GPU
    }
    
    return null;
  }

  /**
   * Detecta el tamaño máximo de textura soportado por WebGL
   */
  private detectMaxTextureSize(): number {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as WebGLRenderingContext | null;
      
      if (!gl) {
        return 2048; // Valor por defecto conservador
      }
      
      return gl.getParameter(gl.MAX_TEXTURE_SIZE);
    } catch (e) {
      return 2048; // Valor por defecto conservador
    }
  }

  /**
   * Detecta las capacidades del dispositivo y configura el rendimiento
   */
  optimizeForHardware(): void {
    // Verificar rendimiento del dispositivo
    const hardwareLevel = this.determineHardwareLevel(this.detectCapabilities());
    this.logger.debug(`Nivel de hardware detectado: ${hardwareLevel}`);
    
    // Aplicar configuración de rendimiento
    const map = this.mapService.getMap();
    if (map) {
      this.mapRenderer.optimizeForHardware(map, hardwareLevel);
    }
    
    // Aplicar optimizaciones específicas según el nivel
    if (hardwareLevel === 'low') {
      // Reducir animaciones y efectos visuales
      this.reduceVisualEffects();
    }
  }

  /**
   * Reduce efectos visuales para mejorar rendimiento
   */
  private reduceVisualEffects(): void {
    // Agregar clase para reducir animaciones
    document.body.classList.add('reduce-animations');
    
    // Configurar opciones del mapa para rendimiento
    const map = this.mapService.getMap();
    if (map) {
      // Reducir framerate de animaciones
      map.options.fadeAnimation = false;
      map.options.markerZoomAnimation = false;
      map.options.zoomAnimation = false;
    }
    
    // Aplicar configuración al renderer
    this.mapRenderer.updateOptions({
      useWebGL: false,
      progressiveLoading: true,
      clusteringEnabled: true
    });
  }
} 
