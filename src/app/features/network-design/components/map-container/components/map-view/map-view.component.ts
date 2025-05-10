import { Component, OnInit, OnDestroy, AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, ElementRef, ViewChild, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ElementType, NetworkElement, NetworkConnection } from '../../../../../../shared/types/network.types';
import { LoggerService } from '../../../../../../core/services/logger.service';
import { MapStateManagerService, ToolType } from '../../../../services/map/map-state-manager.service';
import { MapElementManagerService } from '../../../../services/map/map-element-manager.service';
import { MapRenderingService } from '../../../../services/map/map-rendering.service';
import { MapInteractionService } from '../../../../services/map/map-interaction.service';

/**
 * Constantes utilizadas en el componente
 */
const CONSTANTS = {
  /** Estilos y posicionamiento */
  STYLES: {
    DEFAULT_CURSOR: 'grab',
    ACTIVE_CURSOR: 'grabbing',
    MAP_BG_LIGHT: '#f5f5f5',
    MAP_BG_DARK: '#333',
    MAP_GRID_LIGHT: '#ddd',
    MAP_GRID_DARK: '#555'
  },
  /** Zoom y escala */
  ZOOM: {
    DEFAULT_LEVEL: 100,
    MIN_LEVEL: 10,
    MAX_LEVEL: 200,
    STEP: 10
  }
};

/**
 * Componente para la vista principal del mapa
 * 
 * Este componente se encarga específicamente del renderizado y manejo
 * de interacciones con el mapa, mejorando la separación de responsabilidades.
 */
@Component({
  selector: 'app-map-view',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="map-view-container" 
      [class.dark-mode]="isDarkMode" 
      [class.loading]="isLoading"
      (mousedown)="onMouseDown($event)"
      (mousemove)="onMouseMove($event)"
      (mouseup)="onMouseUp($event)"
      (wheel)="onWheel($event)"
      #mapContainer>
      
      <!-- Loading spinner -->
      <div class="loading-overlay" *ngIf="isLoading">
        <mat-spinner [diameter]="40"></mat-spinner>
        <span>Cargando mapa...</span>
      </div>
      
      <!-- Error message -->
      <div class="error-message" *ngIf="errorMessage">
        <p>{{ errorMessage }}</p>
        <button (click)="retryLoading()">Reintentar</button>
      </div>
      
      <!-- SVG Container -->
      <svg #mapSvg class="map-svg" [attr.width]="width" [attr.height]="height">
        <!-- Background Grid -->
        <g class="grid-container" [attr.transform]="'translate(' + panOffset.x + ',' + panOffset.y + ') scale(' + zoomScale + ')'">
          <!-- Grid will be generated dynamically -->
        </g>
        
        <!-- Connections Layer -->
        <g class="connections-layer" [attr.transform]="'translate(' + panOffset.x + ',' + panOffset.y + ') scale(' + zoomScale + ')'">
          <!-- Connections will be rendered here -->
        </g>
        
        <!-- Elements Layer -->
        <g class="elements-layer" [attr.transform]="'translate(' + panOffset.x + ',' + panOffset.y + ') scale(' + zoomScale + ')'">
          <!-- Network elements will be rendered here -->
        </g>
        
        <!-- Selection Layer -->
        <g class="selection-layer">
          <!-- Selection indicators, measurement lines, etc. -->
        </g>
      </svg>
    </div>
  `,
  styles: [`
    .map-view-container {
      width: 100%;
      height: 100%;
      position: relative;
      overflow: hidden;
      background-color: var(--map-bg-color, #f5f5f5);
      cursor: grab;
    }
    
    .map-view-container.dark-mode {
      --map-bg-color: #333;
      --map-grid-color: #555;
      --map-text-color: #fff;
      --map-element-stroke: #ddd;
      --map-selection-color: #4fc3f7;
    }
    
    .map-view-container.loading {
      cursor: wait;
    }
    
    .map-svg {
      width: 100%;
      height: 100%;
      display: block;
    }
    
    .loading-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      background-color: rgba(255, 255, 255, 0.7);
      z-index: 10;
    }
    
    .map-view-container.dark-mode .loading-overlay {
      background-color: rgba(0, 0, 0, 0.7);
      color: white;
    }
    
    .error-message {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      padding: 20px;
      background-color: rgba(244, 67, 54, 0.9);
      color: white;
      border-radius: 4px;
      text-align: center;
      z-index: 11;
    }
    
    .error-message button {
      margin-top: 10px;
      padding: 8px 16px;
      background-color: white;
      color: #f44336;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    
    .grid-container line {
      stroke: var(--map-grid-color, #ddd);
      stroke-width: 0.5;
    }
    
    .connections-layer path {
      stroke-width: 2;
      fill: none;
    }
    
    .elements-layer circle, .elements-layer rect {
      stroke: var(--map-element-stroke, #333);
      stroke-width: 1;
    }
    
    .selection-layer .selection-indicator {
      stroke: var(--map-selection-color, #2196F3);
      stroke-width: 2;
      stroke-dasharray: 5;
      fill: none;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MapViewComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mapContainer', { static: true }) mapContainerEl!: ElementRef;
  @ViewChild('mapSvg', { static: true }) mapSvgEl!: ElementRef;
  
  @Input() set activeLayers(layers: ElementType[]) {
    this._activeLayers = layers;
    this.refreshMap();
  }
  get activeLayers(): ElementType[] {
    return this._activeLayers;
  }
  
  @Input() set tool(value: ToolType) {
    this._tool = value;
    this.updateCursor();
  }
  get tool(): ToolType {
    return this._tool;
  }
  
  @Input() set darkMode(value: boolean) {
    this.isDarkMode = value;
    this.applyTheme();
  }
  
  @Input() set loading(value: boolean) {
    this.isLoading = value;
    this.cdr.markForCheck();
  }
  
  @Output() elementSelected = new EventEmitter<NetworkElement | null>();
  @Output() connectionSelected = new EventEmitter<NetworkConnection | null>();
  @Output() zoomChanged = new EventEmitter<number>();
  @Output() mapError = new EventEmitter<string>();
  @Output() mapLoaded = new EventEmitter<void>();
  @Output() cursorPositionChanged = new EventEmitter<{x: number, y: number}>();
  @Output() measurementComplete = new EventEmitter<{source: NetworkElement, target: NetworkElement, distance: number}>();
  
  // Variables de estado
  width = 800;
  height = 600;
  isDarkMode = false;
  isLoading = true;
  errorMessage: string | null = null;
  
  // Variables de interacción
  zoomScale = 1;
  panOffset = { x: 0, y: 0 };
  isDragging = false;
  dragStart = { x: 0, y: 0 };
  lastPanOffset = { x: 0, y: 0 };
  
  // Variables internas
  private _tool: ToolType = 'pan';
  private _activeLayers: ElementType[] = [];
  private elements: NetworkElement[] = [];
  private connections: NetworkConnection[] = [];
  private selectedElement: NetworkElement | null = null;
  private selectedConnection: NetworkConnection | null = null;
  
  // Gestión de suscripciones
  private destroy$ = new Subject<void>();
  
  // Servicios
  private logger = inject(LoggerService);
  private stateManager = inject(MapStateManagerService);
  private elementManager = inject(MapElementManagerService);
  private renderingService = inject(MapRenderingService);
  private interactionService = inject(MapInteractionService);
  private cdr = inject(ChangeDetectorRef);
  
  constructor() {}
  
  ngOnInit(): void {
    // Suscribirse a eventos relevantes
    this.setupSubscriptions();
  }
  
  ngAfterViewInit(): void {
    // Inicializar dimensiones
    this.updateDimensions();
    
    // Generar grid inicial
    this.generateGrid();
    
    // Cargar elementos
    this.loadElements();
  }
  
  /**
   * Configura las suscripciones a servicios
   */
  private setupSubscriptions(): void {
    // Estado del mapa
    this.stateManager.activeLayers
      .pipe(takeUntil(this.destroy$))
      .subscribe(layers => {
        this._activeLayers = layers;
        this.refreshMap();
      });
    
    // Herramienta actual
    this.stateManager.currentTool
      .pipe(takeUntil(this.destroy$))
      .subscribe(tool => {
        this._tool = tool;
        this.updateCursor();
      });
    
    // Elemento seleccionado
    this.interactionService.selectedElement
      .pipe(takeUntil(this.destroy$))
      .subscribe(element => {
        this.selectedElement = element;
        this.updateSelectionIndicators();
        this.cdr.markForCheck();
      });
    
    // Conexión seleccionada
    this.interactionService.selectedConnection
      .pipe(takeUntil(this.destroy$))
      .subscribe(connection => {
        this.selectedConnection = connection;
        this.updateSelectionIndicators();
        this.cdr.markForCheck();
      });
  }
  
  /**
   * Actualiza las dimensiones del mapa
   */
  private updateDimensions(): void {
    if (this.mapContainerEl && this.mapContainerEl.nativeElement) {
      const rect = this.mapContainerEl.nativeElement.getBoundingClientRect();
      this.width = rect.width;
      this.height = rect.height;
      this.cdr.markForCheck();
    }
  }
  
  /**
   * Genera el grid de fondo
   */
  private generateGrid(): void {
    // Implementación pendiente
    // Este método generaría líneas de grid en el SVG
  }
  
  /**
   * Carga los elementos del mapa
   */
  private loadElements(): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.cdr.markForCheck();
    
    this.elementManager.loadElementsProgressively({
      batchSize: 50,
      maxElements: 1000,
      progressCallback: (progress) => {
        // Actualizar progreso si es necesario
      },
      elementsCallback: (elements) => {
        // Actualizar elementos
        this.renderElements(elements);
      }
    }).subscribe({
      next: (result) => {
        this.isLoading = false;
        if (result.success) {
          this.mapLoaded.emit();
          this.elements = this.elementManager.getAllElements();
          this.renderingService.startPerformanceTracking();
        } else {
          this.errorMessage = 'Error al cargar elementos';
          this.mapError.emit(this.errorMessage);
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = 'Error al cargar el mapa: ' + (err.message || 'Error desconocido');
        this.mapError.emit(this.errorMessage);
        this.cdr.markForCheck();
      }
    });
  }
  
  /**
   * Renderiza elementos en el mapa
   * @param elements Elementos a renderizar
   */
  private renderElements(elements: NetworkElement[]): void {
    // Implementación pendiente
    // Este método renderizaría los elementos en el SVG
  }
  
  /**
   * Refresca el mapa cuando cambian las capas activas
   */
  private refreshMap(): void {
    if (!this.mapSvgEl) return;
    
    // Filtrar elementos por capas activas
    const visibleElements = this.elements.filter(e => 
      this.activeLayers.includes(e.type));
    
    // Renderizar elementos filtrados
    this.renderElements(visibleElements);
    
    // Actualizar estadísticas
    this.renderingService.trackFrame(visibleElements.length);
    
    this.cdr.markForCheck();
  }
  
  /**
   * Actualiza indicadores de selección
   */
  private updateSelectionIndicators(): void {
    // Implementación pendiente
    // Este método actualizaría los indicadores visuales de selección
  }
  
  /**
   * Actualiza el cursor según la herramienta activa
   */
  private updateCursor(): void {
    if (!this.mapContainerEl) return;
    
    const element = this.mapContainerEl.nativeElement as HTMLElement;
    
    switch (this.tool) {
      case 'pan':
        element.style.cursor = this.isDragging ? 'grabbing' : 'grab';
        break;
      case 'select':
        element.style.cursor = 'pointer';
        break;
      case 'measure':
        element.style.cursor = 'crosshair';
        break;
      case 'connect':
        element.style.cursor = 'cell';
        break;
      default:
        element.style.cursor = 'default';
    }
  }
  
  /**
   * Aplica el tema actual (claro/oscuro)
   */
  private applyTheme(): void {
    // Los estilos ya se aplican mediante clases CSS
    this.cdr.markForCheck();
  }
  
  /**
   * Maneja el evento mousedown
   */
  onMouseDown(event: MouseEvent): void {
    if (event.button !== 0) return; // Solo botón izquierdo
    
    this.isDragging = this.tool === 'pan';
    this.dragStart = { x: event.clientX, y: event.clientY };
    this.lastPanOffset = { ...this.panOffset };
    
    this.updateCursor();
    event.preventDefault();
  }
  
  /**
   * Maneja el evento mousemove
   */
  onMouseMove(event: MouseEvent): void {
    // Emitir posición del cursor
    const rect = this.mapSvgEl.nativeElement.getBoundingClientRect();
    const cursorPosition = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
    this.cursorPositionChanged.emit(cursorPosition);
    
    // Manejar arrastre
    if (this.isDragging) {
      this.panOffset = {
        x: this.lastPanOffset.x + (event.clientX - this.dragStart.x),
        y: this.lastPanOffset.y + (event.clientY - this.dragStart.y)
      };
      this.cdr.markForCheck();
    }
  }
  
  /**
   * Maneja el evento mouseup
   */
  onMouseUp(event: MouseEvent): void {
    this.isDragging = false;
    this.updateCursor();
  }
  
  /**
   * Maneja el evento wheel (zoom)
   */
  onWheel(event: WheelEvent): void {
    event.preventDefault();
    
    // Determinar dirección de zoom
    const direction = event.deltaY < 0 ? 1 : -1;
    
    // Calcular nuevo zoom
    const zoomStep = 0.1;
    const newZoom = Math.max(0.1, Math.min(3, this.zoomScale + (direction * zoomStep)));
    
    // Actualizar zoom
    this.zoomScale = newZoom;
    
    // Emitir evento de zoom
    const zoomPercent = Math.round(newZoom * 100);
    this.zoomChanged.emit(zoomPercent);
    
    this.cdr.markForCheck();
  }
  
  /**
   * Reintenta la carga del mapa
   */
  retryLoading(): void {
    this.errorMessage = null;
    this.loadElements();
  }
  
  /**
   * Ajustar zoom a un nivel específico
   * @param level Nivel de zoom (porcentaje)
   */
  setZoomLevel(level: number): void {
    this.zoomScale = level / 100;
    this.cdr.markForCheck();
  }
  
  /**
   * Aumenta zoom
   */
  zoomIn(): void {
    const newZoom = Math.min(3, this.zoomScale + 0.1);
    this.zoomScale = newZoom;
    this.zoomChanged.emit(Math.round(newZoom * 100));
    this.cdr.markForCheck();
  }
  
  /**
   * Disminuye zoom
   */
  zoomOut(): void {
    const newZoom = Math.max(0.1, this.zoomScale - 0.1);
    this.zoomScale = newZoom;
    this.zoomChanged.emit(Math.round(newZoom * 100));
    this.cdr.markForCheck();
  }
  
  /**
   * Ajusta la vista para mostrar todos los elementos
   */
  fitToScreen(): void {
    // Implementación pendiente para calcular límites y centrar todos los elementos
    this.zoomScale = 1;
    this.panOffset = { x: 0, y: 0 };
    this.zoomChanged.emit(100);
    this.cdr.markForCheck();
  }
  
  /**
   * Limpieza al destruir el componente
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
} 