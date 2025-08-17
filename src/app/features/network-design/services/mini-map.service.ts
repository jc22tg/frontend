import { Injectable } from '@angular/core';
import { NetworkElement, NetworkConnection } from '../../../shared/types/network.types';
import { LoggerService } from '../../../core/services/logger.service';

/**
 * Servicio para gestionar la representación del mini-mapa
 */
@Injectable({
  providedIn: 'root'
})
export class MiniMapService {
  private canvasContext: CanvasRenderingContext2D | null = null;
  
  constructor(private logger: LoggerService) {}
  
  /**
   * Renderiza el mapa miniatura basado en los elementos y conexiones
   * 
   * @param canvas Elemento canvas donde renderizar
   * @param elements Lista de elementos a mostrar
   * @param connections Lista de conexiones a mostrar
   */
  renderMap(
    canvas: HTMLCanvasElement,
    elements: NetworkElement[],
    connections: NetworkConnection[]
  ): void {
    try {
      // Obtener el contexto 2D
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        this.logger.error('No se pudo obtener el contexto 2D del canvas');
        return;
      }
      
      this.canvasContext = ctx;
      
      // Establecer dimensiones del canvas
      const devicePixelRatio = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      
      canvas.width = rect.width * devicePixelRatio;
      canvas.height = rect.height * devicePixelRatio;
      
      // Escalar el contexto
      ctx.scale(devicePixelRatio, devicePixelRatio);
      
      // Limpiar el canvas
      ctx.clearRect(0, 0, rect.width, rect.height);
      
      // Establecer estilo para el fondo
      ctx.fillStyle = '#f5f5f5';
      ctx.fillRect(0, 0, rect.width, rect.height);
      
      // Si no hay elementos, terminar
      if (!elements.length) {
        this.logger.debug('No hay elementos para renderizar en el mini-mapa');
        return;
      }
      
      // Calcular límites para el escalado
      const bounds = this.calculateBounds(elements);
      const scale = this.calculateScale(bounds, rect.width, rect.height);
      
      // Dibujar conexiones
      this.renderConnections(connections, elements, bounds, scale);
      
      // Dibujar elementos
      this.renderElements(elements, bounds, scale);
      
      this.logger.debug('Mini-mapa renderizado con éxito');
    } catch (error) {
      this.logger.error('Error al renderizar el mini-mapa:', error);
    }
  }
  
  /**
   * Calcula los límites de los elementos para escalar correctamente
   */
  private calculateBounds(elements: NetworkElement[]): { minX: number, maxX: number, minY: number, maxY: number } {
    if (!elements.length) {
      return { minX: 0, maxX: 100, minY: 0, maxY: 100 };
    }
    
    // Inicializar con valores extremos
    let minX = Number.MAX_VALUE;
    let maxX = Number.MIN_VALUE;
    let minY = Number.MAX_VALUE;
    let maxY = Number.MIN_VALUE;
    
    // Encontrar los límites reales
    elements.forEach(element => {
      if (!element.position?.coordinates) return;
      
      const [x, y] = element.position.coordinates;
      
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    });
    
    // Añadir margen
    const xMargin = (maxX - minX) * 0.1;
    const yMargin = (maxY - minY) * 0.1;
    
    return {
      minX: minX - xMargin,
      maxX: maxX + xMargin,
      minY: minY - yMargin,
      maxY: maxY + yMargin
    };
  }
  
  /**
   * Calcula el factor de escala para ajustar los elementos al canvas
   */
  private calculateScale(bounds: { minX: number, maxX: number, minY: number, maxY: number }, width: number, height: number): number {
    const xScale = width / (bounds.maxX - bounds.minX);
    const yScale = height / (bounds.maxY - bounds.minY);
    
    // Usar el menor de los dos para mantener proporción
    return Math.min(xScale, yScale) * 0.9; // 90% para dejar margen
  }
  
  /**
   * Renderiza las conexiones en el mini-mapa
   */
  private renderConnections(
    connections: NetworkConnection[],
    elements: NetworkElement[],
    bounds: { minX: number, maxX: number, minY: number, maxY: number },
    scale: number
  ): void {
    if (!this.canvasContext) return;
    
    const ctx = this.canvasContext;
    
    // Crear mapa de elementos para buscar por id
    const elementsMap = new Map<string, NetworkElement>();
    elements.forEach(element => {
      if (element.id) {
        elementsMap.set(element.id, element);
      }
    });
    
    // Dibujar conexiones
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.lineWidth = 1;
    
    connections.forEach(connection => {
      const sourceElement = elementsMap.get(connection.sourceElementId);
      const targetElement = elementsMap.get(connection.targetElementId);
      
      if (sourceElement?.position?.coordinates && targetElement?.position?.coordinates) {
        const [srcX, srcY] = sourceElement.position.coordinates;
        const [tgtX, tgtY] = targetElement.position.coordinates;
        
        // Transformar coordenadas
        const x1 = (srcX - bounds.minX) * scale;
        const y1 = (srcY - bounds.minY) * scale;
        const x2 = (tgtX - bounds.minX) * scale;
        const y2 = (tgtY - bounds.minY) * scale;
        
        // Dibujar línea
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    });
  }
  
  /**
   * Renderiza los elementos en el mini-mapa
   */
  private renderElements(
    elements: NetworkElement[],
    bounds: { minX: number, maxX: number, minY: number, maxY: number },
    scale: number
  ): void {
    if (!this.canvasContext) return;
    
    const ctx = this.canvasContext;
    
    // Dibujar elementos
    elements.forEach(element => {
      if (!element.position?.coordinates) return;
      
      const [x, y] = element.position.coordinates;
      
      // Transformar coordenadas
      const renderX = (x - bounds.minX) * scale;
      const renderY = (y - bounds.minY) * scale;
      
      // Estilo según tipo
      switch (element.type) {
        case 'OLT':
          ctx.fillStyle = '#4caf50';
          ctx.beginPath();
          ctx.arc(renderX, renderY, 4, 0, 2 * Math.PI);
          ctx.fill();
          break;
        case 'FDP':
          ctx.fillStyle = '#2196f3';
          ctx.beginPath();
          ctx.arc(renderX, renderY, 3, 0, 2 * Math.PI);
          ctx.fill();
          break;
        case 'SPLITTER':
          ctx.fillStyle = '#ff9800';
          ctx.beginPath();
          ctx.arc(renderX, renderY, 2, 0, 2 * Math.PI);
          ctx.fill();
          break;
        default:
          ctx.fillStyle = '#9e9e9e';
          ctx.beginPath();
          ctx.arc(renderX, renderY, 2, 0, 2 * Math.PI);
          ctx.fill();
      }
    });
  }
  
  /**
   * Calcula las dimensiones del rectángulo de vista para mostrar en el mini-mapa
   */
  calculateViewRect(
    viewport: { x: number, y: number, width: number, height: number, zoom: number },
    canvasDimensions: { width: number, height: number }
  ): { x: number, y: number, width: number, height: number } {
    // Implementación simplificada
    const zoom = viewport.zoom || 1;
    
    // Ajustar el rectángulo según el zoom y posición
    const width = canvasDimensions.width * (1 / zoom);
    const height = canvasDimensions.height * (1 / zoom);
    
    // Posición del rectángulo
    const x = (viewport.x / 100) * canvasDimensions.width;
    const y = (viewport.y / 100) * canvasDimensions.height;
    
    return {
      x: Math.max(0, Math.min(x, canvasDimensions.width - width)),
      y: Math.max(0, Math.min(y, canvasDimensions.height - height)),
      width: Math.min(width, canvasDimensions.width),
      height: Math.min(height, canvasDimensions.height)
    };
  }
} 
