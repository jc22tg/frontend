import { Injectable } from '@angular/core';
import * as d3 from 'd3';
import { LoggerService } from '../../../core/services/logger.service';
import { NetworkElement } from '../../../shared/types/network.types';
import { IMapPreviewService } from '../interfaces/map-preview.interface';
import { MapPositionService } from './map-position.service';
import { MapRenderService } from './map-render.service';

@Injectable({
  providedIn: 'root'
})
export class MapPreviewService implements IMapPreviewService {
  // Referencias al mapa
  private svg: d3.Selection<SVGSVGElement, unknown, null, undefined> | null = null;
  private mainGroup: d3.Selection<SVGGElement, unknown, null, undefined> | null = null;
  
  // Estado de la vista previa
  private currentPreviewElement: NetworkElement | null = null;
  private previewGroup: d3.Selection<SVGGElement, unknown, null, undefined> | null = null;
  private animationTimer: any = null;
  
  constructor(
    private logger: LoggerService,
    private positionService: MapPositionService,
    private renderService: MapRenderService
  ) {}
  
  /**
   * Inicializa el servicio de vista previa
   */
  initialize(
    svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
    mainGroup: d3.Selection<SVGGElement, unknown, null, undefined>
  ): void {
    this.svg = svg;
    this.mainGroup = mainGroup;
    
    // Crear grupo para la vista previa
    this.previewGroup = mainGroup.append('g')
      .attr('class', 'preview-layer')
      .style('pointer-events', 'none');
    
    this.logger.debug('Servicio de vista previa inicializado');
  }
  
  /**
   * Muestra una vista previa de un elemento en el mapa
   */
  previewElement(element: NetworkElement): void {
    // Limpiar vista previa anterior
    this.clearPreview();
    
    if (!this.previewGroup || !element) return;
    
    this.currentPreviewElement = element;
    
    // Convertir las coordenadas geográficas a coordenadas de pantalla
    let x = this.svg?.node()?.clientWidth ? this.svg.node()!.clientWidth / 2 : 0;
    let y = this.svg?.node()?.clientHeight ? this.svg.node()!.clientHeight / 2 : 0;
    
    // Si el elemento tiene posición, usarla
    if (element.position && element.position.coordinates) {
      const coords = this.positionService.coordinatesToPixel(
        element.position.coordinates[1],
        element.position.coordinates[0]
      );
      x = coords.x;
      y = coords.y;
    }
    
    // Crear grupo para el elemento de vista previa
    const elementGroup = this.previewGroup
      .append('g')
      .attr('class', 'preview-element')
      .attr('transform', `translate(${x}, ${y})`);
    
    // Añadir círculo para el elemento
    const circle = elementGroup.append('circle')
      .attr('r', 15)
      .attr('fill', this.renderService.getElementColor(element.type, element.status))
      .attr('stroke', '#FF4081')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '4,4');
    
    // Añadir etiqueta para el elemento
    elementGroup.append('text')
      .attr('dy', '.35em')
      .attr('y', 30)
      .style('text-anchor', 'middle')
      .style('fill', '#333333')
      .style('stroke', '#ffffff')
      .style('stroke-width', '0.5px')
      .style('font-size', '12px')
      .text(element.name || 'Nuevo elemento');
    
    // Añadir una animación pulsante
    this.animatePreview(circle);
    
    this.logger.debug(`Vista previa creada para elemento: ${element.id || 'nuevo'}`);
  }
  
  /**
   * Limpia la vista previa actual
   */
  clearPreview(): void {
    if (this.previewGroup) {
      this.previewGroup.selectAll('*').remove();
    }
    
    if (this.animationTimer) {
      clearInterval(this.animationTimer);
      this.animationTimer = null;
    }
    
    this.currentPreviewElement = null;
  }
  
  /**
   * Comprueba si hay una vista previa activa
   */
  hasActivePreview(): boolean {
    return this.currentPreviewElement !== null;
  }
  
  /**
   * Obtiene el elemento actualmente en vista previa
   */
  getPreviewElement(): NetworkElement | null {
    return this.currentPreviewElement;
  }
  
  /**
   * Anima el elemento de vista previa con un efecto pulsante
   */
  private animatePreview(circle: d3.Selection<SVGCircleElement, unknown, null, undefined>): void {
    // Cancelar animación anterior si existe
    if (this.animationTimer) {
      clearInterval(this.animationTimer);
    }
    
    let radius = 15;
    let increasing = false;
    
    // Crear animación con un temporizador
    this.animationTimer = setInterval(() => {
      if (increasing) {
        radius += 0.2;
        if (radius >= 18) {
          increasing = false;
        }
      } else {
        radius -= 0.2;
        if (radius <= 15) {
          increasing = true;
        }
      }
      
      circle.attr('r', radius);
    }, 50);
  }
} 