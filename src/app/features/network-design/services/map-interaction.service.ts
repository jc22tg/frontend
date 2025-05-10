import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import * as d3 from 'd3';
import { LoggerService } from '../../../core/services/logger.service';
import { NetworkElement, NetworkConnection, ElementStatus } from '../../../shared/types/network.types';
import { IMapInteractionService } from '../interfaces/map-interaction.interface';
import { MapPositionService } from './map-position.service';

@Injectable({
  providedIn: 'root'
})
export class MapInteractionService implements IMapInteractionService {
  // Referencias al mapa
  private svg: d3.Selection<SVGSVGElement, unknown, null, undefined> | null = null;
  private mainGroup: d3.Selection<SVGGElement, unknown, null, undefined> | null = null;
  
  // Propiedades de interacción
  private currentTool = 'pan';
  private selectedElement: NetworkElement | null = null;
  private isDarkMode = false;
  
  // Propiedades para el modo de medición
  private measurementPoints: { x: number, y: number }[] = [];
  private measurementLine: d3.Selection<SVGLineElement, unknown, null, undefined> | null = null;
  private measurementText: d3.Selection<SVGTextElement, unknown, null, undefined> | null = null;
  private measurementGroup: d3.Selection<SVGGElement, unknown, null, undefined> | null = null;
  
  // Propiedades para selección por área
  private isAreaSelectMode = false;
  private areaSelectStartPoint: { x: number, y: number } | null = null;
  private areaSelectCurrentPoint: { x: number, y: number } | null = null;
  private areaSelectGroup: d3.Selection<SVGGElement, unknown, null, undefined> | null = null;
  private areaSelectRect: d3.Selection<SVGRectElement, unknown, null, undefined> | null = null;
  private selectedElements: NetworkElement[] = [];
  
  // Eventos
  private elementSelectedEvent = new Subject<NetworkElement | null>();
  private connectionSelectedEvent = new Subject<NetworkConnection>();
  private measurementCompletedEvent = new Subject<{
    sourceElement: NetworkElement | null;
    targetElement: NetworkElement | null;
    distance: number;
  }>();
  
  constructor(
    private logger: LoggerService,
    private positionService: MapPositionService
  ) {}
  
  /**
   * Inicializa las interacciones del mapa
   */
  initializeInteractions(
    svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
    mainGroup: d3.Selection<SVGGElement, unknown, null, undefined>
  ): void {
    this.svg = svg;
    this.mainGroup = mainGroup;
    
    // Crear grupo para mediciones y selección por área
    this.measurementGroup = mainGroup.append('g').attr('class', 'measurements');
    this.areaSelectGroup = mainGroup.append('g').attr('class', 'area-select');
    
    // Habilitar el modo panorámico por defecto
    this.enablePanMode();
    
    this.logger.debug('Interacciones del mapa inicializadas');
  }
  
  /**
   * Establece la herramienta activa
   */
  setTool(tool: string): void {
    if (this.currentTool === tool) return;
    
    this.currentTool = tool;
    this.logger.debug(`Herramienta cambiada a: ${tool}`);
    
    // Limpiar cualquier estado actual
    this.clearMeasurements();
    this.disableAreaSelectMode();
    
    // Habilitar la herramienta correspondiente
    switch (tool) {
      case 'pan':
        this.enablePanMode();
        break;
      case 'select':
        this.enableSelectMode();
        break;
      case 'measure':
        this.enableMeasureMode();
        break;
      case 'areaSelect':
        this.enableAreaSelectMode();
        break;
      default:
        this.logger.warn(`Herramienta desconocida: ${tool}`);
        this.enablePanMode(); // Fallback a pan
        break;
    }
  }
  
  /**
   * Habilita el modo de panorámica (pan)
   */
  enablePanMode(): void {
    if (!this.svg) return;
    
    // Cambiar cursor
    this.svg.style('cursor', 'grab');
    
    // Eliminar cualquier listener existente
    this.svg.on('mousedown.interaction', null);
    this.svg.on('mousemove.interaction', null);
    this.svg.on('mouseup.interaction', null);
    this.svg.on('click.interaction', null);
  }
  
  /**
   * Habilita el modo de selección
   */
  enableSelectMode(): void {
    if (!this.svg) return;
    
    // Cambiar cursor
    this.svg.style('cursor', 'pointer');
    
    // Configurar evento de clic para seleccionar elementos
    this.svg.on('click.interaction', (event) => {
      // Ignorar si el clic es en un control, no en el mapa
      if ((event.target as Element).tagName !== 'rect' && 
          !(event.target as Element).classList.contains('node')) {
        // Clic en un espacio vacío, deseleccionar
        this.selectElement(null);
        return;
      }
      
      // Si el clic es en un nodo, la selección se manejará por el evento del nodo
    });
  }
  
  /**
   * Habilita el modo de medición
   */
  enableMeasureMode(): void {
    if (!this.svg || !this.measurementGroup) return;
    
    // Cambiar cursor
    this.svg.style('cursor', 'crosshair');
    
    // Reiniciar puntos de medición
    this.measurementPoints = [];
    
    // Limpiar mediciones existentes
    this.clearMeasurements();
    
    // Configurar evento de clic para añadir puntos de medición
    this.svg.on('click.interaction', (event) => {
      const point = this.getEventCoordinates(event);
      this.addMeasurementPoint(point.x, point.y);
    });
  }
  
  /**
   * Habilita el modo de selección por área
   */
  enableAreaSelectMode(): void {
    if (!this.svg || !this.areaSelectGroup) return;
    
    this.isAreaSelectMode = true;
    
    // Cambiar cursor
    this.svg.style('cursor', 'crosshair');
    
    // Preparar el rectángulo de selección
    this.areaSelectRect = this.areaSelectGroup
      .append('rect')
      .attr('class', 'selection-rect')
      .attr('fill', 'rgba(33, 150, 243, 0.1)')
      .attr('stroke', '#2196F3')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '3,3')
      .style('display', 'none');
    
    // Configurar eventos de ratón para la selección por área
    this.svg.on('mousedown.interaction', (event) => {
      const point = this.getEventCoordinates(event);
      this.areaSelectStartPoint = point;
      this.areaSelectCurrentPoint = point;
      
      if (this.areaSelectRect) {
        this.areaSelectRect
          .style('display', null)
          .attr('x', point.x)
          .attr('y', point.y)
          .attr('width', 0)
          .attr('height', 0);
      }
    });
    
    this.svg.on('mousemove.interaction', (event) => {
      if (!this.areaSelectStartPoint) return;
      
      const point = this.getEventCoordinates(event);
      this.areaSelectCurrentPoint = point;
      this.updateSelectionRect();
    });
    
    this.svg.on('mouseup.interaction', () => {
      if (!this.areaSelectStartPoint || !this.areaSelectCurrentPoint) return;
      
      this.selectElementsInArea();
      
      // Ocultar el rectángulo pero no eliminarlo para reutilizarlo
      if (this.areaSelectRect) {
        this.areaSelectRect.style('display', 'none');
      }
      
      // Reiniciar puntos
      this.areaSelectStartPoint = null;
      this.areaSelectCurrentPoint = null;
    });
  }
  
  /**
   * Deshabilita el modo de selección por área
   */
  disableAreaSelectMode(): void {
    if (!this.svg) return;
    
    this.isAreaSelectMode = false;
    
    // Eliminar eventos
    this.svg.on('mousedown.interaction', null);
    this.svg.on('mousemove.interaction', null);
    this.svg.on('mouseup.interaction', null);
    
    // Limpiar rectángulo de selección
    if (this.areaSelectRect) {
      this.areaSelectRect.remove();
      this.areaSelectRect = null;
    }
    
    // Reiniciar puntos
    this.areaSelectStartPoint = null;
    this.areaSelectCurrentPoint = null;
  }
  
  /**
   * Selecciona un elemento
   */
  selectElement(element: NetworkElement | null): void {
    this.selectedElement = element;
    this.elementSelectedEvent.next(element);
  }
  
  /**
   * Selecciona una conexión
   */
  selectConnection(connection: NetworkConnection): void {
    this.connectionSelectedEvent.next(connection);
  }
  
  /**
   * Añade un elemento en una posición específica
   */
  addElementAtPosition(element: NetworkElement, x: number, y: number): void {
    // Convertir coordenadas de píxeles a coordenadas geográficas
    const [lng, lat] = this.positionService.pixelToCoordinates(x, y);
    
    // Asignar coordenadas al elemento
    if (!element.position) {
      element.position = {
        lat: lat,
        lng: lng,
        coordinates: [lng, lat]
      };
    } else {
      element.position.lat = lat;
      element.position.lng = lng;
      element.position.coordinates = [lng, lat];
    }
    
    this.logger.debug(`Elemento añadido en posición: [${lat}, ${lng}]`);
  }
  
  /**
   * Maneja la conexión entre dos elementos
   */
  handleConnection(source: NetworkElement, target: NetworkElement, status: string = ElementStatus.ACTIVE): void {
    if (!source || !target) {
      this.logger.warn('No se puede crear conexión: elemento(s) no válido(s)');
      return;
    }
    
    this.logger.debug(`Conexión creada: ${source.id} -> ${target.id}`);
    
    // En un caso real, aquí habría lógica para crear la conexión en la base de datos
    // y luego actualizar la visualización
  }
  
  /**
   * Añade un punto de medición
   */
  addMeasurementPoint(x: number, y: number): void {
    if (!this.measurementGroup) return;
    
    // Añadir el punto a la lista
    this.measurementPoints.push({ x, y });
    
    // Añadir marcador visual
    this.measurementGroup.append('circle')
      .attr('cx', x)
      .attr('cy', y)
      .attr('r', 5)
      .attr('fill', '#FF4081')
      .attr('stroke', '#FFFFFF')
      .attr('stroke-width', 2);
    
    // Si tenemos dos puntos, mostrar la línea y la distancia
    if (this.measurementPoints.length === 2) {
      const p1 = this.measurementPoints[0];
      const p2 = this.measurementPoints[1];
      
      // Calcular distancia (pixel distance for now)
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Crear línea
      this.measurementLine = this.measurementGroup.append('line')
        .attr('x1', p1.x)
        .attr('y1', p1.y)
        .attr('x2', p2.x)
        .attr('y2', p2.y)
        .attr('stroke', '#FF4081')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '5,5');
      
      // Crear texto de distancia
      const midX = (p1.x + p2.x) / 2;
      const midY = (p1.y + p2.y) / 2;
      
      this.measurementText = this.measurementGroup.append('text')
        .attr('x', midX)
        .attr('y', midY - 10)
        .attr('text-anchor', 'middle')
        .attr('fill', this.isDarkMode ? '#FFFFFF' : '#000000')
        .attr('stroke', this.isDarkMode ? '#000000' : '#FFFFFF')
        .attr('stroke-width', 0.5)
        .text(`${distance.toFixed(2)} píxeles`);
      
      // Emitir evento de medición completa
      this.measurementCompletedEvent.next({
        sourceElement: null, // En un caso real, estos serían los elementos asociados
        targetElement: null,
        distance: distance
      });
      
      // Reiniciar para nueva medición
      setTimeout(() => {
        this.clearMeasurements();
      }, 5000);
    }
  }
  
  /**
   * Limpia las mediciones
   */
  clearMeasurements(): void {
    if (!this.measurementGroup) return;
    
    this.measurementGroup.selectAll('*').remove();
    this.measurementPoints = [];
    this.measurementLine = null;
    this.measurementText = null;
  }
  
  /**
   * Actualiza el rectángulo de selección
   */
  updateSelectionRect(): void {
    if (!this.areaSelectRect || !this.areaSelectStartPoint || !this.areaSelectCurrentPoint) return;
    
    const x1 = Math.min(this.areaSelectStartPoint.x, this.areaSelectCurrentPoint.x);
    const y1 = Math.min(this.areaSelectStartPoint.y, this.areaSelectCurrentPoint.y);
    const x2 = Math.max(this.areaSelectStartPoint.x, this.areaSelectCurrentPoint.x);
    const y2 = Math.max(this.areaSelectStartPoint.y, this.areaSelectCurrentPoint.y);
    
    this.areaSelectRect
      .attr('x', x1)
      .attr('y', y1)
      .attr('width', x2 - x1)
      .attr('height', y2 - y1);
  }
  
  /**
   * Selecciona elementos en el área definida
   */
  selectElementsInArea(): void {
    if (!this.areaSelectStartPoint || !this.areaSelectCurrentPoint || !this.mainGroup) return;
    
    const x1 = Math.min(this.areaSelectStartPoint.x, this.areaSelectCurrentPoint.x);
    const y1 = Math.min(this.areaSelectStartPoint.y, this.areaSelectCurrentPoint.y);
    const x2 = Math.max(this.areaSelectStartPoint.x, this.areaSelectCurrentPoint.x);
    const y2 = Math.max(this.areaSelectStartPoint.y, this.areaSelectCurrentPoint.y);
    
    // En una implementación real, esto recorrería todos los nodos y vería cuáles están dentro del rectángulo
    this.logger.debug(`Elementos seleccionados en el área: (${x1},${y1}) - (${x2},${y2})`);
    
    // Ejemplo: seleccionar nodos en el rectángulo
    const selectedNodes = this.mainGroup.selectAll('.node').filter(function() {
      const node = d3.select(this);
      const transform = node.attr('transform');
      if (!transform) return false;
      
      // Parsear transformación para obtener posición
      const translateMatch = transform.match(/translate\(([^,]+),([^)]+)\)/);
      if (!translateMatch) return false;
      
      const nodeX = parseFloat(translateMatch[1]);
      const nodeY = parseFloat(translateMatch[2]);
      
      return nodeX >= x1 && nodeX <= x2 && nodeY >= y1 && nodeY <= y2;
    });
    
    // Aquí se podrían obtener los datos asociados a los nodos y hacer algo con ellos
    this.logger.debug(`Número de elementos seleccionados: ${selectedNodes.size()}`);
  }
  
  /**
   * Establece el modo oscuro
   */
  setDarkMode(isDarkMode: boolean): void {
    this.isDarkMode = isDarkMode;
    
    // Actualizar estilos de texto para mediciones
    if (this.measurementText) {
      this.measurementText
        .attr('fill', isDarkMode ? '#FFFFFF' : '#000000')
        .attr('stroke', isDarkMode ? '#000000' : '#FFFFFF');
    }
  }
  
  /**
   * Obtiene la herramienta actual
   */
  getCurrentTool(): string {
    return this.currentTool;
  }
  
  /**
   * Suscribe a eventos de selección de elementos
   */
  onElementSelected(): Subject<NetworkElement | null> {
    return this.elementSelectedEvent;
  }
  
  /**
   * Suscribe a eventos de selección de conexiones
   */
  onConnectionSelected(): Subject<NetworkConnection> {
    return this.connectionSelectedEvent;
  }
  
  /**
   * Suscribe a eventos de medición completada
   */
  onMeasurementCompleted(): Subject<{
    sourceElement: NetworkElement | null;
    targetElement: NetworkElement | null;
    distance: number;
  }> {
    return this.measurementCompletedEvent;
  }
  
  /**
   * Obtiene las coordenadas del evento del ratón
   */
  private getEventCoordinates(event: any): { x: number, y: number } {
    if (!this.svg || !event) return { x: 0, y: 0 };
    
    // Obtener la posición del ratón relativa al SVG
    const svgNode = this.svg.node();
    if (!svgNode) return { x: 0, y: 0 };
    
    const point = svgNode.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    
    // Transformar al espacio de coordenadas del SVG
    const ctm = svgNode.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    
    const svgPoint = point.matrixTransform(ctm.inverse());
    
    return { x: svgPoint.x, y: svgPoint.y };
  }
} 