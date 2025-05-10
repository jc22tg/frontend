import { Injectable } from '@angular/core';
import * as d3 from 'd3';
import { Subject } from 'rxjs';
import { LoggerService } from '../../../core/services/logger.service';
import { NetworkElement } from '../../../shared/types/network.types';
import { Measurement, IMapMeasurementService } from '../interfaces/map-measurement.interface';
import { MapExportService } from './map-export.service';
import { MapPositionService } from './map-position.service';
import { NetworkStateService } from './network-state.service';

@Injectable({
  providedIn: 'root'
})
export class MapMeasurementService implements IMapMeasurementService {
  // Referencias al mapa
  private svg: d3.Selection<SVGSVGElement, unknown, null, undefined> | null = null;
  private mainGroup: d3.Selection<SVGGElement, unknown, null, undefined> | null = null;
  private measurementGroup: d3.Selection<SVGGElement, unknown, null, undefined> | null = null;
  
  // Estado de mediciones
  private isMeasurementMode = false;
  private measurementPoints: { x: number, y: number, element?: NetworkElement }[] = [];
  private currentMeasurement: Measurement | null = null;
  private measurementHistory: Measurement[] = [];
  private isDarkMode = false;
  
  // Elementos visuales
  private measurementLine: d3.Selection<SVGLineElement, unknown, null, undefined> | null = null;
  private measurementText: d3.Selection<SVGTextElement, unknown, null, undefined> | null = null;
  
  // Eventos
  private measurementCompletedEvent = new Subject<Measurement>();
  
  constructor(
    private logger: LoggerService,
    private positionService: MapPositionService,
    private exportService: MapExportService,
    private networkStateService: NetworkStateService
  ) {}
  
  /**
   * Inicializa el servicio de mediciones
   */
  initialize(
    svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
    mainGroup: d3.Selection<SVGGElement, unknown, null, undefined>
  ): void {
    this.svg = svg;
    this.mainGroup = mainGroup;
    
    // Crear grupo para mediciones
    this.measurementGroup = mainGroup.append('g')
      .attr('class', 'measurements-layer');
    
    this.logger.debug('Servicio de mediciones inicializado');
  }
  
  /**
   * Habilita el modo de medición
   */
  enableMeasurementMode(): void {
    this.isMeasurementMode = true;
    
    // Limpiar mediciones previas
    this.clearMeasurements();
    
    // Cambiar cursor en el SVG
    if (this.svg) {
      this.svg.style('cursor', 'crosshair');
      
      // Configurar evento de clic para añadir puntos de medición
      this.svg.on('click.measurement', (event) => {
        if (!this.isMeasurementMode) return;
        
        const point = this.getEventCoordinates(event);
        this.addMeasurementPoint(point.x, point.y);
      });
    }
    
    this.logger.debug('Modo de medición habilitado');
  }
  
  /**
   * Deshabilita el modo de medición
   */
  disableMeasurementMode(): void {
    this.isMeasurementMode = false;
    
    // Restaurar cursor
    if (this.svg) {
      this.svg.style('cursor', null);
      this.svg.on('click.measurement', null);
    }
    
    this.logger.debug('Modo de medición deshabilitado');
  }
  
  /**
   * Añade un punto de medición
   */
  addMeasurementPoint(x: number, y: number, element?: NetworkElement): void {
    if (!this.measurementGroup) return;
    
    // Añadir el punto a la lista
    this.measurementPoints.push({ x, y, element });
    
    // Añadir marcador visual
    this.measurementGroup.append('circle')
      .attr('cx', x)
      .attr('cy', y)
      .attr('r', 5)
      .attr('fill', '#FF4081')
      .attr('stroke', '#FFFFFF')
      .attr('stroke-width', 2);
    
    // Si tenemos dos puntos, mostrar la línea y calcular la distancia
    if (this.measurementPoints.length === 2) {
      this.calculateAndDisplayMeasurement();
    }
  }
  
  /**
   * Limpia todas las mediciones
   */
  clearMeasurements(): void {
    if (!this.measurementGroup) return;
    
    this.measurementGroup.selectAll('*').remove();
    this.measurementPoints = [];
    this.measurementLine = null;
    this.measurementText = null;
    this.currentMeasurement = null;
  }
  
  /**
   * Obtiene la medición actual
   */
  getCurrentMeasurement(): Measurement | null {
    return this.currentMeasurement;
  }
  
  /**
   * Obtiene el historial de mediciones
   */
  getMeasurementHistory(): Measurement[] {
    return [...this.measurementHistory];
  }
  
  /**
   * Exporta las mediciones actuales
   */
  exportMeasurements(format: string): void {
    if (!this.currentMeasurement) {
      this.logger.warn('No hay mediciones para exportar');
      this.networkStateService.showSnackbar('No hay mediciones para exportar', 'warning');
      return;
    }
    
    // Establecer las mediciones en el servicio de exportación y exportarlas
    this.exportService.setMeasurements(this.currentMeasurement);
    this.exportService.exportMap('measurements');
  }
  
  /**
   * Actualiza la configuración del modo oscuro
   */
  setDarkMode(isDarkMode: boolean): void {
    this.isDarkMode = isDarkMode;
    
    // Actualizar estilo del texto de medición si existe
    if (this.measurementText) {
      this.measurementText
        .attr('fill', isDarkMode ? '#FFFFFF' : '#000000')
        .attr('stroke', isDarkMode ? '#000000' : '#FFFFFF');
    }
  }
  
  /**
   * Suscribe a eventos de medición completada
   */
  onMeasurementCompleted(): Subject<Measurement> {
    return this.measurementCompletedEvent;
  }
  
  /**
   * Calcula y muestra la medición entre los dos puntos
   */
  private calculateAndDisplayMeasurement(): void {
    if (this.measurementPoints.length < 2 || !this.measurementGroup) return;
    
    const p1 = this.measurementPoints[0];
    const p2 = this.measurementPoints[1];
    
    // Calcular distancia en píxeles
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const pixelDistance = Math.sqrt(dx * dx + dy * dy);
    
    // Convertir a metros (simplificado - en un caso real usaríamos la proyección correcta)
    // Asumiendo una escala de 1 pixel = 0.5 metros
    const distance = pixelDistance * 0.5;
    
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
      .text(`${distance.toFixed(2)} metros`);
    
    // Crear objeto de medición
    this.currentMeasurement = {
      sourceElement: p1.element || null,
      targetElement: p2.element || null,
      distance,
      unit: 'metros',
      points: this.measurementPoints.map(p => ({ x: p.x, y: p.y }))
    };
    
    // Añadir al historial
    this.measurementHistory.push({ ...this.currentMeasurement });
    
    // Emitir evento de medición completada
    this.measurementCompletedEvent.next(this.currentMeasurement);
    
    this.logger.debug(`Medición completada: ${distance.toFixed(2)} metros`);
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