import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, ElementRef, ViewChild, AfterViewInit, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
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
import { MapStateService } from '../../../../services/map/state/map-state.service';
import { LoggerService } from '../../../../../../core/services/logger.service';

/**
 * Widget de mini-mapa para mostrar una vista general de la red
 * 
 * Este widget muestra una versión reducida del mapa principal permitiendo
 * una navegación rápida y visualizar la ubicación actual en el contexto
 * del mapa completo.
 */
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
          <canvas #miniMapCanvas width="200" height="150"></canvas>
          <div class="viewport-indicator" [style.left.px]="viewportLeft" [style.top.px]="viewportTop" 
               [style.width.px]="viewportWidth" [style.height.px]="viewportHeight"></div>
        </div>
        
        <div class="mini-map-controls">
          <button class="mini-map-control" (click)="zoomIn()">
            <i class="fa fa-plus"></i>
          </button>
          <button class="mini-map-control" (click)="zoomOut()">
            <i class="fa fa-minus"></i>
          </button>
          <button class="mini-map-control" (click)="resetView()">
            <i class="fa fa-home"></i>
          </button>
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
      width: 200px;
      height: 150px;
      border: 1px solid #ccc;
      overflow: hidden;
      background-color: #f5f5f5;
    }
    
    :host-context(.dark-mode) .mini-map-container {
      background-color: #333;
      border-color: #555;
    }
    
    canvas {
      width: 100%;
      height: 100%;
    }
    
    .viewport-indicator {
      position: absolute;
      border: 2px solid rgba(255, 0, 0, 0.7);
      background-color: rgba(255, 0, 0, 0.1);
      pointer-events: none;
      z-index: 10;
    }
    
    .mini-map-controls {
      display: flex;
      justify-content: center;
      gap: 4px;
      margin-top: 4px;
    }
    
    .mini-map-control {
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: #f0f0f0;
      border: 1px solid #ccc;
      border-radius: 4px;
      cursor: pointer;
    }
    
    :host-context(.dark-mode) .mini-map-control {
      background-color: #444;
      border-color: #555;
      color: #fff;
    }
    
    .mini-map-control:hover {
      background-color: #e0e0e0;
    }
    
    :host-context(.dark-mode) .mini-map-control:hover {
      background-color: #555;
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
  `],
  animations: [fadeAnimation],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MiniMapWidgetComponent extends BaseWidgetComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('miniMapContainer') miniMapContainer!: ElementRef;
  @ViewChild('miniMapCanvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;
  
  // Inputs para datos de elementos y conexiones
  @Input() allElements: NetworkElement[] = [];
  @Input() allConnections: NetworkConnection[] = [];
  
  // Inputs para información del viewport
  @Input() viewportOffsetX = 0;
  @Input() viewportOffsetY = 0;
  @Input() viewportWidth = 50;
  @Input() viewportHeight = 40;
  @Input() zoomLevel = 100;
  @Input() isDarkMode = false;
  
  // Variables para el indicador de viewport
  viewportLeft = 0;
  viewportTop = 0;
  
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
  private mapStateService = inject(MapStateService);
  private logger = inject(LoggerService);
  
  // Contenedor del widget
  private widgetElement: HTMLElement | null = null;
  
  // Canvas context
  private ctx: CanvasRenderingContext2D | null = null;
  
  // Salidas de eventos para el contenedor
  @Output() widgetAction = new EventEmitter<any>();
  @Output() widgetError = new EventEmitter<any>();
  @Output() widgetUpdate = new EventEmitter<any>();
  
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
    
    // Suscribirse a cambios en el estado del mapa
    this.mapStateService.mapState$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        // Actualizar indicador de viewport
        this.updateViewportIndicator(state.bounds);
      });
      
    // Suscribirse a cambios en los elementos
    this.mapStateService.selectedElementIds$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Redibujar el mapa con selección
        this.redrawMiniMap();
      });
  }
  
  ngAfterViewInit(): void {
    // Inicializar el mini mapa
    setTimeout(() => {
      this.initializeMiniMap();
      this.setupEventListeners();
    });
  }
  
  private initializeMiniMap(): void {
    if (!this.canvasRef) {
      this.logger.error('Referencia al canvas no disponible');
      return;
    }
    
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d');
    
    if (!this.ctx) {
      this.logger.error('No se pudo obtener el contexto 2D del canvas');
      return;
    }
    
    // Configurar evento de clic para navegación
    canvas.addEventListener('click', this.handleCanvasClick.bind(this));
    
    if (this.allElements.length > 0) {
      this.calculateMapBounds();
      this.redrawMiniMap();
    }
    
    this.calculateElementStats();
  }
  
  private setupEventListeners(): void {
    // Escuchar arrastre del indicador de viewport
    const drag = d3.drag()
        .on('start', () => {
          // Lógica de inicio de arrastre
        })
        .on('drag', (event: any) => {
          // Actualizar posición del viewport
        })
        .on('end', () => {
          // Finalizar arrastre
        });
      
    // Usar un selector para escuchar eventos de arrastre, no directamente en el canvas
    // this.ctx!.canvas.addEventListener('click', drag);
    
    // Escuchar cambios de tamaño de ventana
    fromEvent(window, 'resize')
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(200)
      )
      .subscribe(() => {
        this.redrawMiniMap();
      });
  }
  
  private updateViewportIndicator(bounds?: [[number, number], [number, number]]): void {
    if (!bounds || !this.canvasRef) return;
    
    const canvas = this.canvasRef.nativeElement;
    const width = canvas.width;
    const height = canvas.height;
    
    // Calcular posición y tamaño del viewport
    const [[minX, minY], [maxX, maxY]] = bounds;
    
    // Transformar a coordenadas del canvas
    this.viewportInfo = {
      x: ((minX - this.mapBounds.minX) / (this.mapBounds.maxX - this.mapBounds.minX)) * width,
      y: ((1 - (maxY - this.mapBounds.minY) / (this.mapBounds.maxY - this.mapBounds.minY)) * height),
      width: ((maxX - minX) / (this.mapBounds.maxX - this.mapBounds.minX)) * width,
      height: ((maxY - minY) / (this.mapBounds.maxY - this.mapBounds.minY)) * height
    };
    
    this.cdr.markForCheck();
  }
  
  private calculateScale(): number {
    if (!this.canvasRef) return 1;
    
    const canvas = this.canvasRef.nativeElement;
    const width = canvas.width;
    const height = canvas.height;
    
    const mapWidth = this.mapBounds.maxX - this.mapBounds.minX;
    const mapHeight = this.mapBounds.maxY - this.mapBounds.minY;
    
    if (mapWidth <= 0 || mapHeight <= 0) return 1;
    
    // Calcular escalas para ancho y alto
    const scaleX = width / mapWidth;
    const scaleY = height / mapHeight;
    
    // Usar la escala menor para mantener la proporción
    return Math.min(scaleX, scaleY) * 0.9; // 90% para dejar un margen
  }
  
  private redrawMiniMap(): void {
    if (!this.ctx || !this.canvasRef) return;
    
    const canvas = this.canvasRef.nativeElement;
    const width = canvas.width;
    const height = canvas.height;
    
    // Limpiar canvas
    this.ctx.clearRect(0, 0, width, height);
    
    // Dibujar fondo
    this.ctx.fillStyle = this.isDarkMode ? '#222' : '#f8f8f8';
    this.ctx.fillRect(0, 0, width, height);
    
    // Calcular escala para ajustar elementos al canvas
    const boundsWidth = this.mapBounds.maxX - this.mapBounds.minX;
    const boundsHeight = this.mapBounds.maxY - this.mapBounds.minY;
    
    const scaleX = width / boundsWidth;
    const scaleY = height / boundsHeight;
    
    // Usar la menor escala para mantener proporciones
    const scale = Math.min(scaleX, scaleY) * 0.9;
    
    // Obtener los elementos seleccionados
    const selectedIds: string[] = (this.mapStateService.getState().selectedElementIds || []).filter((id: any) => typeof id === 'string');
    
    // Dibujar elementos
    this.allElements.forEach(el => {
      const pos = (el.position as any)?.coordinates;
      if (!pos) return;
      
      const [x, y] = pos;
      
      // Transformar coordenadas
      const canvasX = (x - this.mapBounds.minX) * scale;
      const canvasY = height - (y - this.mapBounds.minY) * scale; // Invertir Y
      
      // Determinar color según tipo y selección
      const isSelected = selectedIds.includes(el.id || '');
      const color = this.getElementColor(el.type, isSelected);
      
      // Dibujar punto
      this.ctx!.fillStyle = color;
      this.ctx!.beginPath();
      this.ctx!.arc(canvasX, canvasY, isSelected ? 4 : 2, 0, Math.PI * 2);
      this.ctx!.fill();
    });
  }
  
  private calculateMapBounds(): void {
    if (!this.allElements || this.allElements.length === 0) {
      this.mapBounds = { minX: -100, maxX: 100, minY: -100, maxY: 100 };
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
      const coords = (element.position as any)?.coordinates;
      if (coords) {
        const lng = coords[0];
        const lat = coords[1];
        
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
    if (!element || !element.position || !(element.position as any).coordinates) return;
    const coords = (element.position as any).coordinates;
    this.mapPositionService.centerAt(
      coords[0],
      coords[1]
    );
  }
  
  centerMap(): void {
    if (this.allElements.length === 0) return;
    
    // Calcular el centro del mapa basado en los límites
    const centerX = (this.mapBounds.minX + this.mapBounds.maxX) / 2;
    const centerY = (this.mapBounds.minY + this.mapBounds.maxY) / 2;
    
    // Usar el servicio para centrar el mapa
    this.mapPositionService.centerAt(centerX, centerY);
    
    // Emitir acción
    this.widgetAction.emit({ source: 'mini-map-widget', type: 'center', timestamp: new Date(), payload: { centerX, centerY } });
  }
  
  toggleMiniMapMode(): void {
    this.showActiveElements = !this.showActiveElements;
    
    // Redibujar con el nuevo modo
    if (this.ctx) {
      this.redrawMiniMap();
    }
    
    this.cdr.markForCheck();
    
    // Emitir acción
    this.widgetAction.emit({ source: 'mini-map-widget', type: 'toggleMode', timestamp: new Date(), payload: { showActiveElements: this.showActiveElements } });
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
        this.redrawMiniMap();
        this.lastSyncTime = new Date();
        this.cdr.markForCheck();
        
        // Emitir actualización
        this.widgetUpdate.emit({ source: 'mini-map-widget', type: 'update', timestamp: new Date(), updateType: 'data', currentState: { elements } });
      },
      error: (error) => {
        console.error('Error al cargar elementos:', error);
        this.handleError('refreshData', error);
        
        // Emitir error
        this.widgetError.emit({ source: 'mini-map-widget', type: 'error', timestamp: new Date(), error: { code: 'LOAD_ELEMENTS', message: 'Error al cargar elementos', details: error } });
      }
    });
    
    connections$.pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (connections) => {
        this.allConnections = connections;
        this.redrawMiniMap();
        
        // Emitir actualización
        this.widgetUpdate.emit({ source: 'mini-map-widget', type: 'update', timestamp: new Date(), updateType: 'data', currentState: { connections } });
      },
      error: (error) => {
        console.error('Error al cargar conexiones:', error);
        this.handleError('refreshData', error);
        
        // Emitir error
        this.widgetError.emit({ source: 'mini-map-widget', type: 'error', timestamp: new Date(), error: { code: 'LOAD_CONNECTIONS', message: 'Error al cargar conexiones', details: error } });
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
        this.redrawMiniMap();
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
          this.redrawMiniMap();
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
        case ElementStatus.MAINTENANCE:
          this.warningCount++;
          break;
        case ElementStatus.ERROR:
          this.errorCount++;
          break;
        // Otros estados no se cuentan
        default:
          break;
      }
    });
  }
  
  private getElementColor(type: string, isSelected: boolean): string {
    if (isSelected) {
      return '#ff4500'; // Color para elementos seleccionados
    }
    
    switch (type) {
      case 'OLT':
        return '#4caf50';
      case 'ONT':
        return '#2196f3';
      case 'FDP':
        return '#ff9800';
      case 'SPLITTER':
        return '#9c27b0';
      case 'EDFA':
        return '#f44336';
      case 'MANGA':
        return '#795548';
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
        case 'maintenance':
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
      case ElementStatus.MAINTENANCE:
        return '#ffc107';
      case ElementStatus.ERROR:
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
    if (this.ctx) {
      this.ctx.canvas.removeEventListener('click', this.handleCanvasClick.bind(this));
    }
  }
  
  /**
   * Maneja el clic en el canvas
   */
  private handleCanvasClick(event: MouseEvent): void {
    if (!this.canvasRef) return;
    
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    
    // Calcular posición relativa al canvas
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Convertir a coordenadas del mapa
    const mapX = this.mapBounds.minX + (x / canvas.width) * (this.mapBounds.maxX - this.mapBounds.minX);
    const mapY = this.mapBounds.minY + ((canvas.height - y) / canvas.height) * (this.mapBounds.maxY - this.mapBounds.minY);
    
    // Centrar mapa en la posición
    this.mapStateService.setCenter([mapX, mapY]);
    
    // Emitir acción
    this.widgetAction.emit({ source: 'mini-map-widget', type: 'canvasClick', timestamp: new Date(), payload: { mapX, mapY } });
  }
  
  /**
   * Aumenta el zoom del mapa principal
   */
  zoomIn(): void {
    const currentState = this.mapStateService.getState();
    const newZoom = currentState.zoom + 1;
    this.mapStateService.setZoom(newZoom);
    
    // Emitir acción
    this.widgetAction.emit({ source: 'mini-map-widget', type: 'zoomIn', timestamp: new Date(), payload: { newZoom } });
  }
  
  /**
   * Disminuye el zoom del mapa principal
   */
  zoomOut(): void {
    const currentState = this.mapStateService.getState();
    const newZoom = Math.max(1, currentState.zoom - 1);
    this.mapStateService.setZoom(newZoom);
    
    // Emitir acción
    this.widgetAction.emit({ source: 'mini-map-widget', type: 'zoomOut', timestamp: new Date(), payload: { newZoom } });
  }
  
  /**
   * Restablece la vista del mapa
   */
  resetView(): void {
    // Calcular el centro del mapa
    const centerX = (this.mapBounds.minX + this.mapBounds.maxX) / 2;
    const centerY = (this.mapBounds.minY + this.mapBounds.maxY) / 2;
    
    // Restablecer zoom y centro
    this.mapStateService.setZoom(10);
    this.mapStateService.setCenter([centerX, centerY]);
    
    // Emitir acción
    this.widgetAction.emit({ source: 'mini-map-widget', type: 'resetView', timestamp: new Date(), payload: { centerX, centerY } });
  }
} 
