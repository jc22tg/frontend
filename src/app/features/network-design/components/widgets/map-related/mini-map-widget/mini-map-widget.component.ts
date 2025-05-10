import { Component, OnInit, OnDestroy, Input, ElementRef, ViewChild, AfterViewInit, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, fromEvent, Observable } from 'rxjs';
import { takeUntil, debounceTime } from 'rxjs/operators';
import * as d3 from 'd3';

import { BaseWidgetComponent } from '../../base/base-widget.component';
import { NetworkElement, NetworkConnection, ElementType, ElementStatus } from '../../../../../../shared/types/network.types';
import { MapPositionService } from '../../../../services/map-position.service';
import { NetworkStateService } from '../../../../services/network-state.service';
import { ElementService } from '../../../../services/element.service';
import { ConnectionService } from '../../../../services/connection.service';
import { MapEventsService } from '../../../../services/map-events.service';
import { fadeAnimation } from '../../../../../../shared/animations/common.animations';

@Component({
  selector: 'app-mini-map-widget',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule
  ],
  template: `
    <div class="widget-container mini-map-widget" *ngIf="(widgetState$ | async)?.isVisible">
      <div class="widget-header">
        <h3>{{ title }}</h3>
        <div class="widget-controls">
          <button mat-icon-button (click)="centerMap()" matTooltip="Centrar mapa">
            <mat-icon>my_location</mat-icon>
          </button>
          <button mat-icon-button (click)="toggleMiniMapMode()" matTooltip="Cambiar modo">
            <mat-icon>{{ showActiveElements ? 'view_comfy' : 'filter_center_focus' }}</mat-icon>
          </button>
          <button mat-icon-button (click)="refreshData()" matTooltip="Actualizar">
            <mat-icon>refresh</mat-icon>
          </button>
          <button mat-icon-button (click)="toggleCollapse()" *ngIf="collapsible" matTooltip="Colapsar">
            <mat-icon>{{ (widgetState$ | async)?.isCollapsed ? 'expand_more' : 'expand_less' }}</mat-icon>
          </button>
          <button mat-icon-button (click)="closeWidget()" *ngIf="closable" matTooltip="Cerrar">
            <mat-icon>close</mat-icon>
          </button>
        </div>
      </div>
      
      <div class="widget-content" *ngIf="!(widgetState$ | async)?.isCollapsed"
           [@fadeAnimation]="(widgetState$ | async)?.isCollapsed ? 'collapsed' : 'expanded'">
        <!-- Contenedor del mini mapa -->
        <div class="mini-map-container" #miniMapContainer>
          <svg #miniMapSvg width="100%" height="100%">
            <g class="mini-map-content">
              <g class="connections-layer"></g>
              <g class="elements-layer"></g>
              <rect class="viewport-indicator" 
                    [attr.x]="viewportInfo.x" 
                    [attr.y]="viewportInfo.y" 
                    [attr.width]="viewportInfo.width" 
                    [attr.height]="viewportInfo.height">
              </rect>
            </g>
          </svg>
          <div class="mini-map-controls">
            <div class="mini-map-stats">
              <span>{{ visibleElements }}/{{ totalElements }} elementos</span>
            </div>
            <div class="status-indicators">
              <span class="status-dot active" [matTooltip]="'Activo: ' + activeCount"></span>
              <span class="status-dot warning" [matTooltip]="'Advertencia: ' + warningCount"></span>
              <span class="status-dot error" [matTooltip]="'Error: ' + errorCount"></span>
            </div>
          </div>
        </div>
        
        <div class="sync-status" *ngIf="lastSyncTime">
          <mat-icon>sync</mat-icon>
          <span>Actualizado: {{ lastSyncTime | date:'HH:mm:ss' }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
    
    .mini-map-widget {
      min-width: 220px;
      min-height: 200px;
    }
    
    .widget-content {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    
    .mini-map-container {
      position: relative;
      background-color: #f5f5f5;
      border-radius: 4px;
      overflow: hidden;
      height: 180px;
      width: 100%;
      box-shadow: inset 0 0 3px rgba(0, 0, 0, 0.1);
    }
    
    .mini-map-controls {
      position: absolute;
      bottom: 5px;
      right: 5px;
      font-size: 10px;
      background: rgba(255, 255, 255, 0.8);
      border-radius: 2px;
      padding: 2px 5px;
      display: flex;
      align-items: center;
      gap: 5px;
    }
    
    .status-indicators {
      display: flex;
      gap: 5px;
      align-items: center;
    }
    
    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      display: inline-block;
    }
    
    .status-dot.active {
      background-color: #4caf50;
    }
    
    .status-dot.warning {
      background-color: #ffc107;
    }
    
    .status-dot.error {
      background-color: #f44336;
    }
    
    svg {
      width: 100%;
      height: 100%;
    }
    
    .viewport-indicator {
      fill: rgba(30, 136, 229, 0.2);
      stroke: #1976d2;
      stroke-width: 1px;
      cursor: move;
    }
    
    .mini-map-stats {
      color: #555;
      font-weight: 500;
    }
    
    .sync-status {
      display: flex;
      align-items: center;
      font-size: 12px;
      color: #757575;
      margin-top: 5px;
      justify-content: flex-end;
    }
    
    .sync-status mat-icon {
      font-size: 14px;
      height: 14px;
      width: 14px;
      margin-right: 4px;
    }
    
    :host-context(.dark-theme) .mini-map-container {
      background-color: #303030;
    }
    
    :host-context(.dark-theme) .mini-map-controls {
      background: rgba(48, 48, 48, 0.8);
      color: #e0e0e0;
    }
  `],
  animations: [fadeAnimation],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MiniMapWidgetComponent extends BaseWidgetComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('miniMapContainer') miniMapContainer!: ElementRef;
  @ViewChild('miniMapSvg') miniMapSvg!: ElementRef;
  
  // Inputs para datos de elementos y conexiones
  @Input() allElements: NetworkElement[] = [];
  @Input() allConnections: NetworkConnection[] = [];
  
  // Inputs para información del viewport
  @Input() viewportOffsetX = 0;
  @Input() viewportOffsetY = 0;
  @Input() viewportWidth = 800;
  @Input() viewportHeight = 600;
  @Input() zoomLevel = 100;
  @Input() isDarkMode = false;
  
  // Variables para estadísticas visuales
  totalElements = 0;
  visibleElements = 0;
  activeCount = 0;
  warningCount = 0;
  errorCount = 0;
  
  // Configuración del mini mapa
  showActiveElements = true; // Si es true, resalta elementos activos o con problemas
  lastSyncTime: Date | null = null;
  
  // Variables internas para dibujo
  private svg: any;
  private elementsGroup: any;
  private connectionsGroup: any;
  // Exponer el viewportRect público para acceso desde el template
  viewportInfo = { x: 0, y: 0, width: 0, height: 0 };
  private mapBounds: { minX: number, maxX: number, minY: number, maxY: number } = { 
    minX: 0, maxX: 0, minY: 0, maxY: 0 
  };
  private draggingViewport = false;
  private destroy$ = new Subject<void>();
  
  // Servicios adicionales para la integración
  private mapPositionService = inject(MapPositionService);
  private networkStateService = inject(NetworkStateService);
  private elementService = inject(ElementService);
  private connectionService = inject(ConnectionService);
  private mapEventsService = inject(MapEventsService);
  private cdr = inject(ChangeDetectorRef);
  
  constructor() {
    super();
    this.widgetId = 'mini-map-widget';
    this.title = 'Mini Mapa';
    this.position = 'bottom-right';
  }
  
  override ngOnInit(): void {
    super.ngOnInit();
    
    // Suscribirse a cambios de estado de la red
    this.networkStateService.state$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(mapState => {
      this.updateFromNetworkState(mapState);
      this.cdr.markForCheck();
    });
    
    // Obtener elementos iniciales si no se proporcionan como Input
    if (this.allElements.length === 0) {
      this.loadElements();
    }
    
    // Obtener conexiones iniciales si no se proporcionan como Input
    if (this.allConnections.length === 0) {
      this.loadConnections();
    }
  }
  
  ngAfterViewInit(): void {
    // Inicializar el mini mapa
    setTimeout(() => {
      this.initializeMiniMap();
      this.setupEventListeners();
    });
  }
  
  private initializeMiniMap(): void {
    if (!this.miniMapSvg?.nativeElement) {
      console.error('Error: miniMapSvg no inicializado');
      return;
    }
    
    this.svg = d3.select(this.miniMapSvg.nativeElement);
    this.elementsGroup = this.svg.select('.elements-layer');
    this.connectionsGroup = this.svg.select('.connections-layer');
    
    if (this.allElements.length > 0) {
      this.calculateMapBounds();
      this.drawMiniMap();
      this.updateViewportIndicator();
    }
    
    this.calculateElementStats();
  }
  
  private setupEventListeners(): void {
    // Configurar eventos de arrastre para el indicador de viewport
    const drag = d3.drag()
      .on('start', () => {
        this.draggingViewport = true;
      })
      .on('drag', (event: any) => {
        if (!this.draggingViewport) return;
        
        const scale = this.calculateScale();
        const newX = this.viewportInfo.x + event.dx;
        const newY = this.viewportInfo.y + event.dy;
        
        // Actualizar la posición del indicador
        this.viewportInfo.x = newX;
        this.viewportInfo.y = newY;
        
        // Calcular la posición real en el mapa
        const mapX = (newX / scale) + this.mapBounds.minX;
        const mapY = (newY / scale) + this.mapBounds.minY;
        
        // Notificar al servicio de posición del mapa
        this.mapPositionService.updatePosition(mapX, mapY);
        
        this.cdr.markForCheck();
      })
      .on('end', () => {
        this.draggingViewport = false;
      });
    
    this.svg.select('.viewport-indicator').call(drag);
    
    // Escuchar cambios de tamaño de ventana
    fromEvent(window, 'resize')
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(200)
      )
      .subscribe(() => {
        this.drawMiniMap();
        this.updateViewportIndicator();
      });
      
    // Escuchar eventos del mapa provenientes del servicio
    if (this.mapEventsService.getEvents) {
      this.mapEventsService.getEvents().pipe(
        takeUntil(this.destroy$)
      ).subscribe(event => {
        // Verificar cualquier cambio en el mapa que requiera actualizar el viewport
        if (event && typeof event === 'object' && 'type' in event) {
          this.updateViewportIndicator();
        }
      });
    }
  }
  
  private updateViewportIndicator(): void {
    // Obtener el estado actual del mapa
    this.networkStateService.state$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(mapState => {
      const viewport = this.mapPositionService.getCurrentViewport();
      
      // Calcular escala para el mini mapa
      const scale = this.calculateScale();
      
      // Actualizar la posición del indicador de viewport
      this.viewportInfo = {
        x: (viewport.x - this.mapBounds.minX) * scale,        
        y: (viewport.y - this.mapBounds.minY) * scale,        
        width: viewport.width * scale / viewport.zoom,   
        height: viewport.height * scale / viewport.zoom  
      };
      
      this.cdr.markForCheck();
    });
  }
  
  private calculateScale(): number {
    if (!this.miniMapContainer) return 1;
    
    const containerWidth = this.miniMapContainer.nativeElement.clientWidth;
    const containerHeight = this.miniMapContainer.nativeElement.clientHeight;
    
    const mapWidth = this.mapBounds.maxX - this.mapBounds.minX;
    const mapHeight = this.mapBounds.maxY - this.mapBounds.minY;
    
    if (mapWidth <= 0 || mapHeight <= 0) return 1;
    
    // Calcular escalas para ancho y alto
    const scaleX = containerWidth / mapWidth;
    const scaleY = containerHeight / mapHeight;
    
    // Usar la escala menor para mantener la proporción
    return Math.min(scaleX, scaleY) * 0.9; // 90% para dejar un margen
  }
  
  private drawMiniMap(): void {
    if (!this.svg || this.allElements.length === 0) return;
    
    // Limpiar capas
    this.elementsGroup.selectAll('*').remove();
    this.connectionsGroup.selectAll('*').remove();
    
    const scale = this.calculateScale();
    
    // Dibujar conexiones
    this.drawConnections(scale);
    
    // Dibujar elementos
    this.drawElements(scale);
    
    // Actualizar el indicador de viewport
    this.updateViewportIndicator();
  }
  
  private drawElements(scale: number): void {
    const elements = this.allElements;
    
    this.elementsGroup.selectAll('circle')
      .data(elements)
      .enter()
      .append('circle')
      .attr('cx', (d: NetworkElement) => {
        // Verificar y acceder a las coordenadas x e y desde d.position.coordinates
        const lng = d.position.coordinates ? d.position.coordinates[0] : 0;
        return (lng - this.mapBounds.minX) * scale;
      })
      .attr('cy', (d: NetworkElement) => {
        // Verificar y acceder a las coordenadas x e y desde d.position.coordinates
        const lat = d.position.coordinates ? d.position.coordinates[1] : 0;
        return (lat - this.mapBounds.minY) * scale;
      })
      .attr('r', 3)
      .attr('fill', (d: NetworkElement) => this.getElementColor(d))
      .attr('stroke', '#000')
      .attr('stroke-width', 0.5)
      .style('cursor', 'pointer')
      .on('click', (event: any, d: NetworkElement) => {
        this.centerOnElement(d);
      });
  }
  
  private drawConnections(scale: number): void {
    const connections = this.allConnections;
    
    connections.forEach(connection => {
      const sourceElement = this.findElementById(connection.sourceId);
      const targetElement = this.findElementById(connection.targetId);
      
      if (sourceElement && targetElement) {
        this.connectionsGroup.append('line')
          .attr('x1', () => {
            // Obtener coordenadas desde sourceElement.position.coordinates
            const lng = sourceElement.position.coordinates ? sourceElement.position.coordinates[0] : 0;
            return (lng - this.mapBounds.minX) * scale;
          })
          .attr('y1', () => {
            // Obtener coordenadas desde sourceElement.position.coordinates
            const lat = sourceElement.position.coordinates ? sourceElement.position.coordinates[1] : 0;
            return (lat - this.mapBounds.minY) * scale;
          })
          .attr('x2', () => {
            // Obtener coordenadas desde targetElement.position.coordinates
            const lng = targetElement.position.coordinates ? targetElement.position.coordinates[0] : 0;
            return (lng - this.mapBounds.minX) * scale;
          })
          .attr('y2', () => {
            // Obtener coordenadas desde targetElement.position.coordinates
            const lat = targetElement.position.coordinates ? targetElement.position.coordinates[1] : 0;
            return (lat - this.mapBounds.minY) * scale;
          })
          .attr('stroke', this.getConnectionColor(connection))
          .attr('stroke-width', 1)
          .attr('opacity', 0.6);
      }
    });
  }
  
  private calculateMapBounds(): void {
    if (!this.allElements || this.allElements.length === 0) {
      this.mapBounds = { minX: 0, maxX: 100, minY: 0, maxY: 100 };
      return;
    }
    
    // Inicializar con valores extremos
    this.mapBounds = {
      minX: Number.MAX_VALUE,
      maxX: Number.MIN_VALUE,
      minY: Number.MAX_VALUE,
      maxY: Number.MIN_VALUE
    };
    
    // Calcular los límites basados en las posiciones de los elementos
    this.allElements.forEach(element => {
      // Verificar y acceder a las coordenadas desde element.position.coordinates
      if (element.position && element.position.coordinates) {
        const lng = element.position.coordinates[0];
        const lat = element.position.coordinates[1];
        
        this.mapBounds.minX = Math.min(this.mapBounds.minX, lng);
        this.mapBounds.maxX = Math.max(this.mapBounds.maxX, lng);
        this.mapBounds.minY = Math.min(this.mapBounds.minY, lat);
        this.mapBounds.maxY = Math.max(this.mapBounds.maxY, lat);
      }
    });
    
    // Asegurar que haya al menos un tamaño mínimo
    if (this.mapBounds.maxX - this.mapBounds.minX < 0.001) {
      this.mapBounds.minX -= 0.5;
      this.mapBounds.maxX += 0.5;
    }
    
    if (this.mapBounds.maxY - this.mapBounds.minY < 0.001) {
      this.mapBounds.minY -= 0.5;
      this.mapBounds.maxY += 0.5;
    }
  }
  
  private centerOnElement(element: NetworkElement): void {
    if (!element || !element.position || !element.position.coordinates) return;
    
    // Usar la API correcta para centrar en el elemento
    // Pasamos las coordenadas en formato [lng, lat] al servicio
    this.mapPositionService.centerAt(
      element.position.coordinates[0],
      element.position.coordinates[1]
    );
  }
  
  centerMap(): void {
    if (this.allElements.length === 0) return;
    
    // Calcular el centro del mapa basado en los límites
    const centerX = (this.mapBounds.minX + this.mapBounds.maxX) / 2;
    const centerY = (this.mapBounds.minY + this.mapBounds.maxY) / 2;
    
    // Usar el servicio para centrar el mapa
    this.mapPositionService.centerAt(centerX, centerY);
  }
  
  toggleMiniMapMode(): void {
    this.showActiveElements = !this.showActiveElements;
    
    // Redibujar con el nuevo modo
    if (this.svg) {
      this.drawMiniMap();
    }
    
    this.cdr.markForCheck();
  }
  
  override refreshData(): void {
    const endMeasurement = this.startPerformanceMeasurement('update');
    
    // Cargar datos actualizados
    const elements$ = this.elementService.getAllElements();
    const connections$ = this.connectionService.getConnections();
    
    // Procesar datos cargados
    elements$.pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (elements) => {
        this.allElements = elements;
        this.processElements();
        this.calculateMapBounds();
        this.drawMiniMap();
        this.lastSyncTime = new Date();
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error al cargar elementos:', error);
        this.handleError('refreshData', error);
      }
    });
    
    connections$.pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (connections) => {
        this.allConnections = connections;
        this.drawMiniMap();
      },
      error: (error) => {
        console.error('Error al cargar conexiones:', error);
        this.handleError('refreshData', error);
      }
    });
    
    endMeasurement();
  }
  
  private loadElements(): void {
    this.elementService.getAllElements().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (elements) => {
        this.allElements = elements;
        this.processElements();
        this.calculateMapBounds();
        this.drawMiniMap();
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error al cargar elementos:', error);
        this.handleError('loadElements', error);
      }
    });
  }
  
  private loadConnections(): void {
    this.connectionService.getConnections().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (connections) => {
        this.allConnections = connections;
        if (this.allElements.length > 0) {
          this.drawMiniMap();
        }
      },
      error: (error) => {
        console.error('Error al cargar conexiones:', error);
        this.handleError('loadConnections', error);
      }
    });
  }
  
  private processElements(): void {
    this.totalElements = this.allElements.length;
    this.visibleElements = this.allElements.length;
    
    // Calcular estadísticas
    this.calculateElementStats();
  }
  
  private calculateElementStats(): void {
    // Reiniciar contadores
    this.activeCount = 0;
    this.warningCount = 0;
    this.errorCount = 0;
    
    // Contar por estado
    this.allElements.forEach(element => {
      switch (element.status) {
        case ElementStatus.ACTIVE:
          this.activeCount++;
          break;
        case ElementStatus.WARNING:
          this.warningCount++;
          break;
        case ElementStatus.FAULT:
          this.errorCount++;
          break;
        // No incluir estado ERROR ya que no existe en ElementStatus
        default:
          // No contar otros estados
          break;
      }
    });
  }
  
  private getElementColor(element: NetworkElement): string {
    // Colores por defecto según estado
    switch (element.status) {
      case ElementStatus.ACTIVE:
        return '#4caf50';
      case ElementStatus.WARNING:
        return '#ffc107';
      case ElementStatus.FAULT:
        return '#f44336';
      // No incluir caso para ERROR ya que no existe en ElementStatus
      case ElementStatus.INACTIVE:
        return '#9e9e9e';
      case ElementStatus.MAINTENANCE:
        return '#2196f3';
      case ElementStatus.PLANNED:
        return '#3f51b5';
      case ElementStatus.BUILDING:
        return '#795548';
      case ElementStatus.RESERVED:
        return '#009688';
      case ElementStatus.DECOMMISSIONED:
        return '#607d8b';
      case ElementStatus.UNKNOWN:
        return '#9c27b0';
      default:
        return '#9e9e9e';
    }
  }
  
  private getConnectionColor(connection: NetworkConnection): string {
    // Verificar si status es string (para compatibilidad)
    if (typeof connection.status === 'string') {
      // Type assertion para evitar error de TypeScript
      const statusAsString = connection.status as unknown as string;
      
      switch (statusAsString) {
        case 'error':
          return '#f44336';
        case 'warning':
          return '#ffc107';
        case 'inactive':
          return '#9e9e9e';
        default:
          return '#9e9e9e';
      }
    }
    
    // Si es ElementStatus
    switch (connection.status) {
      case ElementStatus.ACTIVE:
        return '#4caf50';
      case ElementStatus.WARNING:
        return '#ffc107';
      case ElementStatus.FAULT:
        return '#f44336';
      case ElementStatus.INACTIVE:
        return '#9e9e9e';
      default:
        return '#9e9e9e';
    }
  }
  
  private findElementById(id: string): NetworkElement | undefined {
    return this.allElements.find(e => e.id === id);
  }
  
  private getElementTypeName(type: ElementType): string {
    // Convertir ElementType a nombre legible
    switch (type) {
      case ElementType.ODF:
        return 'ODF';
      case ElementType.OLT:
        return 'OLT';
      case ElementType.ONT:
        return 'ONT';
      case ElementType.SPLITTER:
        return 'Splitter';
      case ElementType.EDFA:
        return 'EDFA';
      case ElementType.MANGA:
        return 'Manga';
      default:
        return 'Elemento';
    }
  }
  
  private updateFromNetworkState(mapState: any): void {
    // Verificar que exista la propiedad viewportWidth, etc.
    const viewport = this.mapPositionService.getCurrentViewport();
    if (viewport) {
      this.viewportOffsetX = viewport.x;
      this.viewportOffsetY = viewport.y;
      this.viewportWidth = viewport.width;
      this.viewportHeight = viewport.height;
      this.zoomLevel = viewport.zoom;
      
      this.updateViewportIndicator();
    }
  }
  
  override ngOnDestroy(): void {
    super.ngOnDestroy();
    
    // Limpiar suscripciones
    this.destroy$.next();
    this.destroy$.complete();
    
    // Limpiar referencias de D3
    if (this.svg) {
      this.svg.selectAll('*').remove();
    }
  }
} 