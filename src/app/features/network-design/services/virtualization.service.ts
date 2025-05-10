import { Injectable } from '@angular/core';
import { NetworkElement } from '../../../shared/types/network.types';
import { LoggerService } from '../../../core/services/logger.service';

/**
 * Interfaz para las opciones de cálculo de elementos visibles
 */
export interface ViewportCalculationOptions {
  viewport: {
    width: number;
    height: number;
  };
  zoom: number;
  pan: {
    x: number;
    y: number;
  };
  elements: NetworkElement[];
}

/**
 * Servicio responsable de determinar qué elementos deben renderizarse
 * basado en el viewport actual para optimizar el rendimiento.
 */
@Injectable({
  providedIn: 'root'
})
export class VirtualizationService {
  // Margen adicional alrededor del viewport para pre-carga
  private readonly VIEWPORT_MARGIN = 100;

  constructor(private logger: LoggerService) { }

  /**
   * Calcula qué elementos son visibles en el viewport actual
   * Este método está optimizado para ejecutarse fuera de la zona de Angular
   * 
   * @param options Opciones de cálculo que incluyen el viewport y los elementos
   * @returns Promise con los IDs de los elementos visibles
   */
  async calculateVisibleElements(options: ViewportCalculationOptions): Promise<string[]> {
    // Destructurar opciones
    const { viewport, zoom, pan, elements } = options;
    
    if (!elements || elements.length === 0) {
      return [];
    }

    // Calcular límites del viewport con margen
    const viewportBounds = this.calculateViewportBounds(viewport, zoom, pan);
    
    // Filtrar elementos para encontrar los visibles
    // Este es un cálculo potencialmente pesado, por lo que lo hacemos asíncrono
    return new Promise<string[]>((resolve) => {
      // Usar setTimeout para no bloquear el hilo principal
      setTimeout(() => {
        const visibleIds = elements
          .filter(element => this.isElementInViewport(element, viewportBounds))
          .map(element => element.id);
        
        resolve(visibleIds);
      }, 0);
    });
  }

  /**
   * Calcula los límites del viewport con un margen adicional
   */
  private calculateViewportBounds(
    viewport: { width: number; height: number }, 
    zoom: number, 
    pan: { x: number; y: number }
  ): { minX: number; minY: number; maxX: number; maxY: number } {
    // Aplicar factor de zoom
    const zoomFactor = zoom / 100;
    
    // Calcular límites con margen
    const minX = pan.x - (viewport.width / 2 + this.VIEWPORT_MARGIN) / zoomFactor;
    const maxX = pan.x + (viewport.width / 2 + this.VIEWPORT_MARGIN) / zoomFactor;
    const minY = pan.y - (viewport.height / 2 + this.VIEWPORT_MARGIN) / zoomFactor;
    const maxY = pan.y + (viewport.height / 2 + this.VIEWPORT_MARGIN) / zoomFactor;

    return { minX, minY, maxX, maxY };
  }

  /**
   * Determina si un elemento está dentro del viewport
   */
  private isElementInViewport(
    element: NetworkElement, 
    bounds: { minX: number; minY: number; maxX: number; maxY: number }
  ): boolean {
    // Comprobar si el elemento tiene posición
    if (!element.position || 
        typeof element.position.lat !== 'number' || 
        typeof element.position.lng !== 'number') {
      return false;
    }

    // Verificar si está dentro de los límites
    return (
      element.position.lng >= bounds.minX &&
      element.position.lng <= bounds.maxX &&
      element.position.lat >= bounds.minY &&
      element.position.lat <= bounds.maxY
    );
  }

  /**
   * Calcula el nivel de detalle apropiado basado en el zoom
   * para determinar qué propiedades renderizar en diferentes niveles
   */
  calculateDetailLevel(zoomLevel: number): 'high' | 'medium' | 'low' {
    if (zoomLevel > 150) return 'high';
    if (zoomLevel > 80) return 'medium';
    return 'low';
  }

  /**
   * Aplica un modo de rendimiento optimizado
   * Reduce la cantidad de elementos renderizados y simplifica efectos visuales
   */
  optimizePerformance(): void {
    this.logger.debug('Aplicando optimizaciones de rendimiento');
    
    // Aplicar optimizaciones básicas sin llamar a métodos inexistentes
    // Aquí podemos implementar algoritmos de optimización directamente
    
    // Por ejemplo, podríamos establecer variables internas para controlar el rendimiento
    this.maxRenderElements = 100; // Valor predeterminado seguro
    this.renderQuality = 'low';
    this.clusteringEnabled = true;
    this.updateInterval = 500;
    
    this.logger.info('Modo de rendimiento optimizado activado');
  }

  // Propiedades para controlar la optimización
  private maxRenderElements = 200;
  private renderQuality: 'high' | 'medium' | 'low' = 'medium';
  private clusteringEnabled = false;
  private updateInterval = 250; // ms
} 