import { Injectable } from '@angular/core';
import * as d3 from 'd3';
import { BehaviorSubject, Observable } from 'rxjs';
import { IMapCoreService } from '../interfaces/map-core.interface';
import { MapConfig } from './map-types';
import { LoggerService } from '../../../core/services/logger.service';

/**
 * Servicio central para la gestión del mapa
 * Responsable de la inicialización y operaciones básicas del mapa
 */
@Injectable({
  providedIn: 'root'
})
export class MapCoreService implements IMapCoreService {
  // Propiedades base de D3
  private svg: d3.Selection<SVGSVGElement, unknown, null, undefined> | null = null;
  private container: HTMLElement | null = null;
  private zoom: d3.ZoomBehavior<SVGSVGElement, unknown> | null = null;
  private simulation: d3.Simulation<any, undefined> | null = null;
  private width = 0;
  private height = 0;
  private currentZoom = 1;
  private mainGroup!: d3.Selection<SVGGElement, unknown, null, undefined>;
  private nodesGroup!: d3.Selection<SVGGElement, unknown, null, undefined>;
  private linksGroup!: d3.Selection<SVGGElement, unknown, null, undefined>;
  
  // Estado
  private config: MapConfig | null = null;
  private mapReadySubject = new BehaviorSubject<boolean>(false);
  
  constructor(
    private logger: LoggerService
  ) {}

  /**
   * Inicializa el mapa con la configuración proporcionada
   * @param config Configuración del mapa
   */
  async initializeMap(config: MapConfig): Promise<void> {
    try {
      if (!config.container) {
        throw new Error('Container inválido: no se proporcionó');
      }

      // Verificar si el contenedor es un elemento HTML o un selector
      if (typeof config.container === 'string') {
        const container = document.querySelector(config.container);
        if (!container) {
          throw new Error(`Container inválido: no se encontró el elemento con selector "${config.container}"`);
        }
        this.container = container as HTMLElement;
      } else if (config.container instanceof HTMLElement) {
        this.container = config.container;
      } else {
        throw new Error('Container inválido: debe ser un elemento HTML o un selector');
      }

      // Verificar las dimensiones del contenedor y aplicar mínimos si es necesario
      if (!this.container) {
        throw new Error('Container inválido: no se pudo inicializar');
      }
      
      let width = this.container.offsetWidth || this.container.clientWidth;
      let height = this.container.offsetHeight || this.container.clientHeight;
      
      if (width < 50 || height < 50) {
        this.logger.warn(`Dimensiones del contenedor demasiado pequeñas: ${width}x${height}, aplicando valores mínimos`);
        
        // Aplicar dimensiones mínimas al contenedor
        if (width < 50 && this.container) {
          this.container.style.minWidth = '500px';
        }
        
        if (height < 50 && this.container) {
          this.container.style.minHeight = '500px';
        }
        
        // Forzar reflow y obtener nuevas dimensiones
        if (this.container) {
          this.container.getBoundingClientRect();
          width = this.container.offsetWidth || this.container.clientWidth || 800;
          height = this.container.offsetHeight || this.container.clientHeight || 600;
        }
      }
      
      this.width = width;
      this.height = height;
      
      this.logger.debug(`Dimensiones finales del contenedor: ${this.width}x${this.height}`);
      
      this.config = config;

      this.logger.debug(`Inicializando mapa con dimensiones ${this.width}x${this.height}`);

      // Limpiar el contenedor
      d3.select(this.container).selectAll('*').remove();

      // Crear el SVG
      this.svg = d3.select(this.container)
        .append('svg')
        .attr('width', '100%')
        .attr('height', '100%')
        .attr('viewBox', `0 0 ${this.width} ${this.height}`)
        .attr('preserveAspectRatio', 'xMidYMid meet')
        .attr('class', config.isDarkMode ? 'dark-theme' : '');

      // Crear grupos principales
      this.mainGroup = this.svg.append('g');
      this.linksGroup = this.mainGroup.append('g').attr('class', 'links');
      this.nodesGroup = this.mainGroup.append('g').attr('class', 'nodes');

      // Agregar un rectángulo de fondo para eventos de pan/zoom
      this.svg.append('rect')
        .attr('width', this.width)
        .attr('height', this.height)
        .attr('fill', 'none')
        .attr('pointer-events', 'all');

      this.logger.debug('Grupos de SVG creados');

      // Inicializar la simulación
      this.initializeSimulation();
      this.setupZoom();
      
      this.logger.debug('Simulación y zoom inicializados');

      // Configurar callbacks si se proporcionan
      if (config.onZoomChange) {
        this.zoom?.on('zoom', (event) => {
          this.mainGroup.attr('transform', event.transform);
          this.currentZoom = parseFloat(event.transform.k.toFixed(2));
          config.onZoomChange?.(this.currentZoom);
        });
      }

      this.logger.debug('Mapa inicializado correctamente');

      // Marcar el mapa como listo
      this.mapReadySubject.next(true);
    } catch (error) {
      this.mapReadySubject.next(false);
      this.logger.error('Error al inicializar el mapa:', error);
      throw error;
    }
  }

  /**
   * Inicializa la simulación física del mapa
   */
  private initializeSimulation(): void {
    try {
      // Crear la simulación con configuración segura
      this.simulation = d3.forceSimulation()
        .force('link', d3.forceLink()
          .id((d: any) => d.id || '')
          .distance(100))
        .force('charge', d3.forceManyBody().strength(-300))
        .force('center', d3.forceCenter(this.width / 2, this.height / 2));
      
      this.logger.debug('Simulación D3 inicializada');
    } catch (error) {
      this.logger.error('Error al inicializar la simulación D3:', error);
    }
  }

  /**
   * Configura el comportamiento de zoom
   */
  private setupZoom(): void {
    try {
      if (!this.svg) {
        throw new Error('No se puede configurar el zoom: SVG no inicializado');
      }

      // Configurar comportamiento de zoom
      this.zoom = d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.1, 10])
        .on('zoom', (event) => {
          this.mainGroup.attr('transform', event.transform);
          this.currentZoom = parseFloat(event.transform.k.toFixed(2));
          
          // Notificar cambio de zoom si hay un callback configurado
          this.config?.onZoomChange?.(this.currentZoom);
        });

      // Aplicar comportamiento de zoom al SVG
      this.svg.call(this.zoom);
      
      this.logger.debug('Comportamiento de zoom configurado');
    } catch (error) {
      this.logger.error('Error al configurar el zoom:', error);
    }
  }

  /**
   * Limpia todos los elementos del mapa
   */
  clearMap(): void {
    if (this.nodesGroup && this.linksGroup) {
      this.nodesGroup.selectAll('*').remove();
      this.linksGroup.selectAll('*').remove();
      this.logger.debug('Mapa limpiado');
    }
  }

  /**
   * Detiene la simulación física del mapa
   */
  stopSimulation(): void {
    if (this.simulation) {
      this.simulation.stop();
      this.logger.debug('Simulación detenida');
    }
  }

  /**
   * Obtiene el nivel de zoom actual
   */
  getCurrentZoom(): number {
    return this.currentZoom;
  }

  /**
   * Establece el nivel de zoom del mapa
   * @param zoomLevel Nivel de zoom (escala)
   * @param animate Si debe animarse la transición
   */
  setZoom(zoomLevel: number, animate = true): void {
    try {
      if (!this.svg || !this.zoom) {
        throw new Error('No se puede establecer zoom: SVG o zoom no inicializados');
      }

      // Normalizar el nivel de zoom
      const normalizedZoom = Math.max(0.1, Math.min(10, zoomLevel));
      
      // Obtener el centro actual de la vista
      const center = this.getMapCenter();
      
      // Calcular la transformación
      const transform = d3.zoomIdentity
        .translate(center.x, center.y)
        .scale(normalizedZoom)
        .translate(-center.x, -center.y);
      
      // Aplicar zoom con o sin animación
      if (animate) {
        this.svg
          .transition()
          .duration(300)
          .call(this.zoom.transform, transform);
      } else {
        this.svg.call(this.zoom.transform, transform);
      }
      
      this.logger.debug(`Zoom establecido a ${normalizedZoom}`);
    } catch (error) {
      this.logger.error('Error al establecer zoom:', error);
    }
  }

  /**
   * Centra el mapa en su posición original
   */
  centerMap(): void {
    try {
      if (!this.svg || !this.zoom) {
        throw new Error('No se puede centrar el mapa: SVG o zoom no inicializados');
      }

      // Resetear la transformación
      this.svg
        .transition()
        .duration(750)
        .call(
          this.zoom.transform,
          d3.zoomIdentity
            .translate(this.width / 2, this.height / 2)
            .scale(this.currentZoom)
            .translate(-this.width / 2, -this.height / 2)
        );
      
      this.logger.debug('Mapa centrado');
    } catch (error) {
      this.logger.error('Error al centrar el mapa:', error);
    }
  }

  /**
   * Centra el mapa en las coordenadas especificadas
   * @param coordinates Coordenadas donde centrar el mapa
   */
  centerOnCoordinates(coordinates: { x: number, y: number }): void {
    try {
      if (!this.svg || !this.zoom) {
        throw new Error('No se puede centrar en coordenadas: SVG o zoom no inicializados');
      }

      // Aplicar la transformación para centrar en las coordenadas dadas
      this.svg
        .transition()
        .duration(750)
        .call(
          this.zoom.transform,
          d3.zoomIdentity
            .translate(this.width / 2, this.height / 2)
            .scale(this.currentZoom)
            .translate(-coordinates.x, -coordinates.y)
        );
      
      this.logger.debug(`Mapa centrado en (${coordinates.x}, ${coordinates.y})`);
    } catch (error) {
      this.logger.error('Error al centrar en coordenadas:', error);
    }
  }

  /**
   * Obtiene las coordenadas del centro actual del mapa
   */
  getMapCenter(): { x: number, y: number } {
    return { x: this.width / 2, y: this.height / 2 };
  }

  /**
   * Ajusta la vista para mostrar todo el contenido
   */
  fitContentToScreen(): void {
    try {
      if (!this.svg || !this.zoom || !this.nodesGroup) {
        throw new Error('No se puede ajustar contenido: SVG, zoom o nodos no inicializados');
      }

      // Obtener todos los nodos
      const nodes = this.nodesGroup.selectAll('.node');
      
      // Si no hay nodos, simplemente centrar el mapa
      if (nodes.size() === 0) {
        this.centerMap();
        return;
      }
      
      // Calcular los límites (bounds) de todos los nodos
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      
      nodes.each(function() {
        const node = d3.select(this);
        const transform = node.attr('transform');
        if (transform) {
          // Extraer las coordenadas de la transformación
          const match = /translate\(([^,]+),([^)]+)\)/.exec(transform);
          if (match) {
            const x = parseFloat(match[1]);
            const y = parseFloat(match[2]);
            
            // Actualizar límites
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
          }
        }
      });
      
      // Añadir margen
      const padding = 50;
      minX -= padding;
      minY -= padding;
      maxX += padding;
      maxY += padding;
      
      // Calcular centro y escala
      const dx = maxX - minX;
      const dy = maxY - minY;
      const x = (minX + maxX) / 2;
      const y = (minY + maxY) / 2;
      
      // Calcular escala para ajustar el contenido
      const scale = Math.min(
        0.9 / Math.max(dx / this.width, dy / this.height),
        4
      );
      
      // Aplicar transformación
      this.svg
        .transition()
        .duration(750)
        .call(
          this.zoom.transform,
          d3.zoomIdentity
            .translate(this.width / 2, this.height / 2)
            .scale(scale)
            .translate(-x, -y)
        );
      
      this.logger.debug(`Contenido ajustado a la pantalla con escala ${scale}`);
    } catch (error) {
      this.logger.error('Error al ajustar contenido:', error);
    }
  }

  /**
   * Actualiza el tamaño del mapa según el contenedor actual
   */
  refreshMapSize(): void {
    try {
      if (!this.container || !this.svg) {
        throw new Error('No se puede actualizar tamaño: contenedor o SVG no inicializados');
      }

      // Obtener nuevas dimensiones
      const width = this.container.offsetWidth || this.container.clientWidth;
      const height = this.container.offsetHeight || this.container.clientHeight;
      
      // Si las dimensiones son válidas, actualizar
      if (width > 0 && height > 0) {
        this.width = width;
        this.height = height;
        
        // Actualizar SVG
        this.svg
          .attr('width', '100%')
          .attr('height', '100%')
          .attr('viewBox', `0 0 ${this.width} ${this.height}`);
        
        // Actualizar simulación si existe
        if (this.simulation) {
          this.simulation
            .force('center', d3.forceCenter(this.width / 2, this.height / 2))
            .restart();
        }
        
        this.logger.debug(`Tamaño del mapa actualizado a ${this.width}x${this.height}`);
      } else {
        this.logger.warn('Dimensiones inválidas para actualizar el tamaño del mapa');
      }
    } catch (error) {
      this.logger.error('Error al actualizar tamaño del mapa:', error);
    }
  }

  /**
   * Retorna un Observable que indica si el mapa está listo
   */
  isMapReady(): Observable<boolean> {
    return this.mapReadySubject.asObservable();
  }

  // Métodos para acceso desde otros servicios

  /**
   * Obtiene el contenedor SVG
   */
  getSvg(): d3.Selection<SVGSVGElement, unknown, null, undefined> | null {
    return this.svg;
  }

  /**
   * Obtiene el grupo principal
   */
  getMainGroup(): d3.Selection<SVGGElement, unknown, null, undefined> {
    return this.mainGroup;
  }

  /**
   * Obtiene el grupo de nodos
   */
  getNodesGroup(): d3.Selection<SVGGElement, unknown, null, undefined> {
    return this.nodesGroup;
  }

  /**
   * Obtiene el grupo de enlaces
   */
  getLinksGroup(): d3.Selection<SVGGElement, unknown, null, undefined> {
    return this.linksGroup;
  }

  /**
   * Obtiene la simulación
   */
  getSimulation(): d3.Simulation<any, undefined> | null {
    return this.simulation;
  }

  /**
   * Obtiene el comportamiento de zoom
   */
  getZoom(): d3.ZoomBehavior<SVGSVGElement, unknown> | null {
    return this.zoom;
  }

  /**
   * Obtiene el ancho actual del mapa
   */
  getWidth(): number {
    return this.width;
  }

  /**
   * Obtiene el alto actual del mapa
   */
  getHeight(): number {
    return this.height;
  }
} 
