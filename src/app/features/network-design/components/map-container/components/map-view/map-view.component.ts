import { Component, OnInit, OnDestroy, AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, ElementRef, ViewChild, Input, Output, EventEmitter, inject, Injector, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ElementType, NetworkElement, NetworkConnection, ElementStatus, ConnectionType, ConnectionStatus } from '../../../../../../shared/types/network.types';
import { CommonPositions } from '../../../../../../shared/utils/migration-helpers';
import { LoggerService } from '../../../../../../core/services/logger.service';
import { MapStateManagerService, ToolType } from '../../../../services/map/map-state-manager.service';
import { MapElementManagerService } from '../../../../services/map/map-element-manager.service';
import { MapPerformanceService } from '../../../../services/map/map-performance.service';
import { MapInteractionService } from '../../../../services/map/map-interaction.service';
import { MapConnectionService } from '../../../../services/map/map-connection.service';
import { MapStateService } from '../../../../services/map/state/map-state.service';
import { BaseMapComponent } from '../../../base/base-map.component';

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

// Niveles de log disponibles para depuraciÃ³n - Duplicado de BaseMapComponent para evitar dependencia cÃ­clica
enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  PERFORMANCE = 'performance'
}

/**
 * Componente para la vista principal del mapa
 * 
 * Este componente se encarga especÃ­ficamente del renderizado y manejo
 * de interacciones con el mapa, mejorando la separaciÃ³n de responsabilidades.
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
      [class.dragging]="isDragging"
      [class.has-error]="!!errorMessage"
      tabindex="0"
      (mousedown)="onMouseDown($event)"
      (mousemove)="onMouseMove($event)"
      (mouseup)="onMouseUp($event)"
      (wheel)="onWheel($event)"
      #mapContainer>
      
      <!-- Overlay de carga -->
      <div class="loading-overlay fade-in" *ngIf="isLoading">
        <mat-spinner [diameter]="48"></mat-spinner>
        <span>Cargando mapa...</span>
      </div>
      
      <!-- Overlay de error -->
      <div class="error-message fade-in" *ngIf="errorMessage">
        <p>{{ errorMessage }}</p>
        <button class="retry-btn" (click)="retryLoading()">Reintentar</button>
      </div>
      
      <!-- SVG Container -->
      <div class="svg-wrapper">
        <svg #mapSvg class="map-svg fade-in"
          [attr.width]="width"
          [attr.height]="height"
          [class.interactive]="!isLoading && !errorMessage"
          [class.has-selection]="!!selectedElement || !!selectedConnection">
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
    </div>
  `,
  styleUrls: ['./map-view.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MapViewComponent extends BaseMapComponent implements AfterViewInit {
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
  errorMessage: string | null = null;
  
  // Variables de interacciÃ³n
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
  public selectedElement: NetworkElement | null = null;
  public selectedConnection: NetworkConnection | null = null;
  
  // Servicios
  private stateManager: MapStateManagerService;
  private elementManager: MapElementManagerService;
  private performanceService: MapPerformanceService;
  private interactionService: MapInteractionService;
  private connectionService: MapConnectionService | null = null;
  declare protected zone: NgZone;
  
  constructor(injector: Injector) {
    super(injector);
    
    // Inicializar servicios especÃ­ficos
    this.stateManager = injector.get(MapStateManagerService);
    this.elementManager = injector.get(MapElementManagerService);
    this.performanceService = injector.get(MapPerformanceService);
    this.interactionService = injector.get(MapInteractionService);
    this.zone = injector.get(NgZone);
    
    // Intentar obtener el servicio de conexiones (puede no estar disponible)
    try {
      this.connectionService = injector.get(MapConnectionService);
      this.logDebug('MapConnectionService inicializado correctamente');
    } catch (error) {
      this.logDebug('MapConnectionService no disponible, algunas funciones de conexiÃ³n podrÃ­an estar limitadas', null, LogLevel.WARN);
    }
    
    this.logDebug('MapViewComponent inicializado');
  }
  
  /**
   * ImplementaciÃ³n del mÃ©todo abstracto de BaseMapComponent
   */
  protected initializeComponent(): void {
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
    
    // Establecer un timeout corto para finalizar la carga automÃ¡ticamente
    setTimeout(() => {
      this.finishLoading();
    }, 1500);
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
    
    // Subscripciones a elementos seleccionados - Manejando de forma mÃ¡s flexible segÃºn el servicio disponible
    if (this.interactionService) {
      try {
        // Intentar obtener los observables de selecciÃ³n desde MapStateService
        const mapStateService = this.injector.get(MapStateService, null);
        
        if (mapStateService) {
          // Usar MapStateService para observables de selecciÃ³n
          this.logDebug('Usando observables de selecciÃ³n de MapStateService');
          
          // SuscripciÃ³n a IDs de elementos seleccionados
          mapStateService.selectedElementIds$
            .pipe(takeUntil(this.destroy$))
            .subscribe(selectedIds => {
              if (selectedIds && selectedIds.length > 0) {
                // Buscar el elemento por ID
                const elementId = selectedIds[0]; // Tomamos el primero para mantener compatibilidad
                const selectedElement = this.elements.find(el => el.id === elementId) || null;
                
                if (this.selectedElement?.id !== selectedElement?.id) {
                  this.selectedElement = selectedElement;
                  this.updateSelectionIndicators();
                  this.elementSelected.emit(selectedElement);
                  this.cdr.markForCheck();
                }
              } else if (this.selectedElement) {
                // Limpiar selecciÃ³n
                this.selectedElement = null;
                this.updateSelectionIndicators();
                this.elementSelected.emit(null);
                this.cdr.markForCheck();
              }
            });
          
          // SuscripciÃ³n a IDs de conexiones seleccionadas
          mapStateService.selectedConnectionIds$
            .pipe(takeUntil(this.destroy$))
            .subscribe(selectedIds => {
              if (selectedIds && selectedIds.length > 0) {
                // Buscar la conexiÃ³n por ID
                const connectionId = selectedIds[0]; // Tomamos la primera para mantener compatibilidad
                const selectedConnection = this.connections.find(conn => conn.id === connectionId) || null;
                
                if (this.selectedConnection?.id !== selectedConnection?.id) {
                  this.selectedConnection = selectedConnection;
                  this.updateSelectionIndicators();
                  this.connectionSelected.emit(selectedConnection);
                  this.cdr.markForCheck();
                }
              } else if (this.selectedConnection) {
                // Limpiar selecciÃ³n
                this.selectedConnection = null;
                this.updateSelectionIndicators();
                this.connectionSelected.emit(null);
                this.cdr.markForCheck();
              }
            });
        } else if (this.elementManager && (this.elementManager as any).elementSelected) {
          // Alternativa: suscribirse al Observable de elemento seleccionado de ElementManager
          this.logDebug('Usando observable elementSelected de ElementManager');
          
          (this.elementManager as any).elementSelected
            .pipe(takeUntil(this.destroy$))
            .subscribe((element: NetworkElement | null) => {
              if (this.selectedElement?.id !== element?.id) {
                this.selectedElement = element;
                this.updateSelectionIndicators();
                this.elementSelected.emit(element);
                this.cdr.markForCheck();
              }
            });
            
          // No hay observable para conexiones en este modo, por lo que manejamos la selecciÃ³n manualmente
        } else {
          // No hay observables disponibles, usamos la implementaciÃ³n manual
          this.logDebug('No se encontraron observables de selecciÃ³n, usando selecciÃ³n manual', null, LogLevel.WARN);
        }
      } catch (error) {
        this.logDebug('Error al configurar suscripciones de selecciÃ³n', error, LogLevel.ERROR);
      }
    } else {
      this.logDebug('InteractionService no disponible, la selecciÃ³n funcionarÃ¡ solo manualmente', null, LogLevel.WARN);
    }
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
    if (!this.mapSvgEl || !this.mapSvgEl.nativeElement) {
      this.logDebug('No se puede generar el grid: elemento SVG no disponible', null, LogLevel.WARN);
      return;
    }
    
    try {
      const svgElement = this.mapSvgEl.nativeElement;
      const gridContainer = svgElement.querySelector('.grid-container');
      
      if (!gridContainer) {
        this.logDebug('No se encuentra el contenedor de la cuadrÃ­cula', null, LogLevel.WARN);
        return;
      }
      
      // Limpiar grid existente
      while (gridContainer.firstChild) {
        gridContainer.removeChild(gridContainer.firstChild);
      }
      
      // Definir tamaÃ±o de cuadrÃ­cula y espacio
      const gridSize = 50; // Unidades de mapa
      const gridExtent = 5000; // Ãrea total cubierta (aumentada para asegurar que cubra toda la vista)
      
      // Crear fondo de color sÃ³lido
      const background = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      background.setAttribute('x', (-gridExtent).toString());
      background.setAttribute('y', (-gridExtent).toString());
      background.setAttribute('width', (gridExtent * 2).toString());
      background.setAttribute('height', (gridExtent * 2).toString());
      background.setAttribute('fill', this.isDarkMode ? '#2D3748' : '#E8EEF2'); // Gris pizarra oscuro / Gris azulado claro
      gridContainer.appendChild(background);
      
      // Crear cuadrÃ­cula con lÃ­neas mÃ¡s visibles
      for (let x = -gridExtent; x <= gridExtent; x += gridSize) {
        // LÃ­nea vertical
        const vLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        vLine.setAttribute('x1', x.toString());
        vLine.setAttribute('y1', (-gridExtent).toString());
        vLine.setAttribute('x2', x.toString());
        vLine.setAttribute('y2', gridExtent.toString());
        vLine.setAttribute('class', 'grid-line');
        vLine.setAttribute('stroke', this.isDarkMode ? '#777777' : '#aaaaaa');
        vLine.setAttribute('stroke-width', '1');
        gridContainer.appendChild(vLine);
      }
      
      for (let y = -gridExtent; y <= gridExtent; y += gridSize) {
        // LÃ­nea horizontal
        const hLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        hLine.setAttribute('x1', (-gridExtent).toString());
        hLine.setAttribute('y1', y.toString());
        hLine.setAttribute('x2', gridExtent.toString());
        hLine.setAttribute('y2', y.toString());
        hLine.setAttribute('class', 'grid-line');
        hLine.setAttribute('stroke', this.isDarkMode ? '#777777' : '#aaaaaa');
        hLine.setAttribute('stroke-width', '1');
        gridContainer.appendChild(hLine);
      }
      
      // AÃ±adir ejes principales con un color mÃ¡s oscuro
      const xAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      xAxis.setAttribute('x1', (-gridExtent).toString());
      xAxis.setAttribute('y1', '0');
      xAxis.setAttribute('x2', gridExtent.toString());
      xAxis.setAttribute('y2', '0');
      xAxis.setAttribute('class', 'grid-axis');
      xAxis.setAttribute('stroke', this.isDarkMode ? '#999999' : '#666666');
      xAxis.setAttribute('stroke-width', '2');
      gridContainer.appendChild(xAxis);
      
      const yAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      yAxis.setAttribute('x1', '0');
      yAxis.setAttribute('y1', (-gridExtent).toString());
      yAxis.setAttribute('x2', '0');
      yAxis.setAttribute('y2', gridExtent.toString());
      yAxis.setAttribute('class', 'grid-axis');
      yAxis.setAttribute('stroke', this.isDarkMode ? '#999999' : '#666666');
      yAxis.setAttribute('stroke-width', '2');
      gridContainer.appendChild(yAxis);
      
      // Centrar automÃ¡ticamente el mapa en el origen
      this.panOffset = {
        x: this.width / 2,
        y: this.height / 2
      };
      this.lastPanOffset = { ...this.panOffset };
      
      this.logDebug('Grid generado correctamente');
    } catch (error) {
      this.logDebug('Error al generar el grid', error, LogLevel.ERROR);
    }
  }
  
  /**
   * Carga los elementos del mapa
   */
  private loadElements(): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.cdr.markForCheck();
    
    // Verificar que ElementManager estÃ© disponible
    if (!this.elementManager) {
      this.logDebug('ElementManager no disponible, finalizando carga', null, LogLevel.WARN);
      setTimeout(() => {
        this.finishLoading();
      }, 500);
      return;
    }
    
    this.logDebug('Iniciando carga de elementos del mapa', null, LogLevel.INFO);
    
    // Asegurar que la detecciÃ³n de cambios actualice la UI antes de continuar
    setTimeout(() => {
      try {
        // Registrar tiempo inicial para mediciÃ³n de rendimiento
        const startTime = performance.now();
        
        this.elementManager.loadElementsProgressively({
          batchSize: 50, // Aumentado para acelerar carga
          maxElements: 1000, // Aumentado para mayor contenido
          progressCallback: (progress) => {
            // Forzar actualizaciÃ³n de la UI cada 10% de progreso para mÃ¡s retroalimentaciÃ³n
            if (progress % 10 === 0) {
              this.zone.run(() => {
                this.logDebug(`Progreso de carga: ${progress}%`, null, LogLevel.INFO);
                this.cdr.detectChanges();
              });
            }
          },
          elementsCallback: (elements) => {
            // Verificar que los elementos tengan la estructura correcta
            if (!elements || !Array.isArray(elements)) {
              this.logDebug('Elementos recibidos con formato incorrecto', elements, LogLevel.WARN);
              return;
            }
            
            // Filtrar elementos sin posiciones vÃ¡lidas
            const validElements = elements.filter(el => {
              // Verificar que el elemento exista
              if (!el) return false;
              
              // Verificar la posiciÃ³n
              const position = el.position;
              
              // Verificar los diferentes formatos posibles de posiciÃ³n
              // 1. Array de coordenadas [x, y]
              if (Array.isArray(position) && position.length >= 2) {
                return true; 
              }
              
              // 2. Objeto GeographicPosition con lat/lng
              if (position && typeof position === 'object') {
                // Formato con lat/lng
                if (typeof position.lat === 'number' && typeof position.lng === 'number') {
                  return true;
                }
                
                // Formato con coordenadas GeoJSON
                if (Array.isArray(position.coordinates) && position.coordinates.length >= 2) {
                  return true;
                }
              }
              
              // Si llegamos aquÃ­, la posiciÃ³n no es vÃ¡lida
              this.logDebug(`Elemento con posiciÃ³n invÃ¡lida: ${el.id || '(sin ID)'} - Tipo: ${el.type}`, 
                { positionType: position ? typeof position : 'undefined' }, LogLevel.DEBUG);
              return false;
            });
            
            if (validElements.length !== elements.length) {
              this.logDebug(`Filtrados ${elements.length - validElements.length} elementos con posiciones invÃ¡lidas`, null, LogLevel.WARN);
            }
            
            // Actualizar elementos dentro de la zona de Angular
            this.zone.run(() => {
              this.renderElements(validElements);
              this.cdr.detectChanges();
            });
          }
        }).subscribe({
          next: (result) => {
            // Calcular tiempo total de carga
            const loadTime = Math.round(performance.now() - startTime);
            
            this.zone.run(() => {
              if (result && result.success) {
                // Verificar que getAllElements devuelva datos vÃ¡lidos
                const allElements = this.elementManager.getAllElements && typeof this.elementManager.getAllElements === 'function' 
                  ? this.elementManager.getAllElements() 
                  : [];
                  
                this.elements = allElements;
                
                // Iniciar monitorizaciÃ³n de rendimiento si estÃ¡ disponible
                if (this.performanceService && typeof this.performanceService.startMonitoring === 'function') {
                  this.performanceService.startMonitoring();
                }

                // Asegurar que la grilla y elementos estÃ©n visibles
                this.refreshMap();
                
                this.logDebug(
                  `Carga de elementos completada con Ã©xito en ${loadTime}ms`, 
                  { 
                    elementsCount: this.elements.length,
                    loadTimeMs: loadTime
                  }, 
                  LogLevel.INFO
                );

                // Finalizar la carga despuÃ©s de un pequeÃ±o retraso para asegurar renderizado
                setTimeout(() => this.finishLoading(), 100);
              } else {
                this.errorMessage = 'Error al cargar elementos';
                this.mapError.emit(this.errorMessage);
                this.logDebug('Error en la carga de elementos', result, LogLevel.ERROR);
                this.finishLoading();
              }
            });
          },
          error: (err) => {
            const loadTime = Math.round(performance.now() - startTime);
            
            this.zone.run(() => {
              this.handleError(err, 'Error al cargar el mapa');
              
              // Detallar mejor el mensaje de error
              const errorMessage = (err as any)?.message || 'Error desconocido';
              this.errorMessage = `Error al cargar el mapa: ${errorMessage}`;
              this.mapError.emit(this.errorMessage);
              
              // Mostrar informaciÃ³n detallada en el log
              this.logDebug(`Error de carga despuÃ©s de ${loadTime}ms`, err, LogLevel.ERROR);
              
              this.finishLoading();
            });
          }
        });
      } catch (err) {
        // Capturar errores durante la inicializaciÃ³n
        this.zone.run(() => {
          this.handleError(err, 'Error al iniciar la carga del mapa');
          
          // Detallar mejor el mensaje de error
          const errorMessage = (err as any)?.message || 'InicializaciÃ³n fallida';
          this.errorMessage = `Error al iniciar la carga: ${errorMessage}`;
          this.mapError.emit(this.errorMessage);
          
          this.logDebug('Error crÃ­tico al iniciar la carga del mapa', err, LogLevel.ERROR);
          
          this.finishLoading();
        });
      }
    }, 100);
  }
  
  /**
   * Finaliza el proceso de carga y actualiza la UI
   */
  private finishLoading(): void {
    this.zone.run(() => {
      this.isLoading = false;
      
      // Si no hay elementos en el mapa, agregar algunos elementos de muestra
      if (this.elements.length === 0) {
        this.addSampleElements();
      }
      
      this.cdr.markForCheck();
      this.mapLoaded.emit();

      // Forzar detecciÃ³n de cambios para asegurar actualizaciÃ³n de UI
      setTimeout(() => this.cdr.detectChanges(), 0);
    });
  }
  
  /**
   * Agrega elementos de muestra al mapa para visualizaciÃ³n
   */
  private addSampleElements(): void {
    this.logDebug('Agregando elementos de muestra al mapa');
    
    try {
      // Elementos de muestra en diferentes posiciones
      const sampleElements: NetworkElement[] = [
        {
          id: 'sample-olt-1',
          type: ElementType.OLT,
          name: 'OLT Muestra 1',
          position: CommonPositions.origin(),
          status: ElementStatus.ACTIVE
        },
        {
          id: 'sample-splitter-1',
          type: ElementType.SPLITTER,
          name: 'Splitter Muestra 1',
          position: CommonPositions.santo_domingo(),
          status: ElementStatus.ACTIVE
        },
        {
          id: 'sample-splitter-2',
          type: ElementType.SPLITTER,
          name: 'Splitter Muestra 2',
          position: CommonPositions.domincanRepublic(),
          status: ElementStatus.ACTIVE
        },
        {
          id: 'sample-fdp-1',
          type: ElementType.FDP,
          name: 'FDP Muestra 1',
          position: CommonPositions.santo_domingo(),
          status: ElementStatus.ACTIVE
        },
        {
          id: 'sample-fdp-2',
          type: ElementType.FDP,
          name: 'FDP Muestra 2',
          position: CommonPositions.domincanRepublic(),
          status: ElementStatus.ACTIVE
        },
        {
          id: 'sample-ont-1',
          type: ElementType.ONT,
          name: 'ONT Muestra 1',
          position: CommonPositions.santo_domingo(),
          status: ElementStatus.ACTIVE
        },
        {
          id: 'sample-ont-2',
          type: ElementType.ONT,
          name: 'ONT Muestra 2',
          position: CommonPositions.domincanRepublic(),
          status: ElementStatus.ACTIVE
        }
      ];
      
      // Conexiones de muestra
      const sampleConnections: NetworkConnection[] = [
        {
          id: 'sample-conn-1',
          name: 'ConexiÃ³n 1',
          sourceElementId: 'sample-olt-1',
          targetElementId: 'sample-splitter-1',
          type: ConnectionType.FIBER,
          status: ConnectionStatus.ACTIVE
        },
        {
          id: 'sample-conn-2',
          name: 'ConexiÃ³n 2',
          sourceElementId: 'sample-olt-1',
          targetElementId: 'sample-splitter-2',
          type: ConnectionType.FIBER,
          status: ConnectionStatus.ACTIVE
        },
        {
          id: 'sample-conn-3',
          name: 'ConexiÃ³n 3',
          sourceElementId: 'sample-splitter-1',
          targetElementId: 'sample-fdp-1',
          type: ConnectionType.FIBER,
          status: ConnectionStatus.ACTIVE
        },
        {
          id: 'sample-conn-4',
          name: 'ConexiÃ³n 4',
          sourceElementId: 'sample-splitter-2',
          targetElementId: 'sample-fdp-2',
          type: ConnectionType.FIBER,
          status: ConnectionStatus.ACTIVE
        },
        {
          id: 'sample-conn-5',
          name: 'ConexiÃ³n 5',
          sourceElementId: 'sample-fdp-1',
          targetElementId: 'sample-ont-1',
          type: ConnectionType.FIBER,
          status: ConnectionStatus.ACTIVE
        },
        {
          id: 'sample-conn-6',
          name: 'ConexiÃ³n 6',
          sourceElementId: 'sample-fdp-2',
          targetElementId: 'sample-ont-2',
          type: ConnectionType.FIBER,
          status: ConnectionStatus.ACTIVE
        }
      ];
      
      // Guardar los elementos y conexiones
      this.elements = sampleElements;
      this.connections = sampleConnections;
      
      // Forzar la actualizaciÃ³n del mapa
      this._activeLayers = [
        ElementType.OLT, 
        ElementType.SPLITTER, 
        ElementType.FDP, 
        ElementType.ONT
      ];
      
      // Renderizar elementos y conexiones
      this.renderElements(this.elements);
      this.renderConnections();
      
      // Centrar en el primer elemento
      if (this.elements.length > 0) {
        const position = this.elements[0].position;
        if (position && typeof position === 'object' && position.lat !== undefined && position.lng !== undefined) {
          // Usando los campos lat y lng para calcular coordenadas del mapa (asumiendo conversiÃ³n simple)
          this.centerMap([position.lng, position.lat]);
        }
      }
      
    } catch (error) {
      this.logDebug('Error al agregar elementos de muestra', error, LogLevel.ERROR);
    }
  }
  
  /**
   * Refresca el mapa cuando cambian las capas activas
   */
  private refreshMap(): void {
    if (!this.mapSvgEl) {
      this.logDebug('No se puede refrescar el mapa: elemento SVG no disponible', null, LogLevel.WARN);
      return;
    }
    
    // Filtrar elementos por capas activas
    const visibleElements = this.elements.filter(e => 
      this.activeLayers.includes(e.type));
    
    // Renderizar elementos filtrados
    this.renderElements(visibleElements);
    
    // Actualizar indicadores de selecciÃ³n despuÃ©s de refrescar
    this.updateSelectionIndicators();
    
    // Actualizar estadÃ­sticas si el servicio estÃ¡ disponible
    if (this.performanceService) {
      // Asumimos que el servicio tiene un mÃ©todo para registrar actualizaciones
      // Si hay problemas de tipos, adaptar segÃºn la implementaciÃ³n real
      if (typeof (this.performanceService as any).registerMapUpdate === 'function') {
        (this.performanceService as any).registerMapUpdate({
          elementsCount: visibleElements.length,
          timestamp: Date.now(),
          visibleLayers: this.activeLayers
        });
      }
    }

    this.cdr.markForCheck();
  }
  
  /**
   * Renderiza elementos en el mapa
   * @param elements Elementos a renderizar
   */
  private renderElements(elements: NetworkElement[]): void {
    if (!this.mapSvgEl || !this.mapSvgEl.nativeElement) {
      this.logDebug('No se pueden renderizar elementos: elemento SVG no disponible', null, LogLevel.WARN);
      return;
    }
    
    try {
      const svgElement = this.mapSvgEl.nativeElement;
      const elementLayer = svgElement.querySelector('.elements-layer');
      
      if (!elementLayer) {
        this.logDebug('No se encuentra la capa para elementos', null, LogLevel.WARN);
        return;
      }
      
      // Limpiar capa existente
      while (elementLayer.firstChild) {
        elementLayer.removeChild(elementLayer.firstChild);
      }
      
      // Procesamos primero las conexiones si el servicio estÃ¡ disponible
      if (this.elementManager) {
        this.renderConnections();
      }
      
      this.logDebug(`Renderizando ${elements.length} elementos en el mapa`, null, LogLevel.INFO);
      
      // Conteo de elementos para verificaciÃ³n
      let renderedCount = 0;
      
      // Renderizar elementos
      elements.forEach(element => {
        // Obtener las coordenadas x, y del elemento segÃºn el formato de posiciÃ³n
        let x = 0;
        let y = 0;
        
        if (Array.isArray(element.position) && element.position.length >= 2) {
          // Formato array [x, y]
          [x, y] = element.position;
        } else if (element.position && typeof element.position === 'object') {
          if (typeof element.position.lat === 'number' && typeof element.position.lng === 'number') {
            // Formato objeto lat/lng - convertimos a coordenadas del mapa
            x = element.position.lng * 100; // Escala arbitraria para ejemplo
            y = element.position.lat * 100; // Ajustar segÃºn tu sistema de coordenadas
          } else if (Array.isArray(element.position.coordinates) && element.position.coordinates.length >= 2) {
            // Formato coordinates GeoJSON [lng, lat]
            x = element.position.coordinates[0] * 100;
            y = element.position.coordinates[1] * 100;
          } else {
            this.logDebug(`Elemento con formato de posiciÃ³n no soportado: ${element.id || '(sin ID)'}`);
            return; // Saltar este elemento
          }
        } else {
          this.logDebug(`Elemento sin posiciÃ³n vÃ¡lida: ${element.id || '(sin ID)'}`);
          return; // Saltar elementos sin posiciÃ³n vÃ¡lida
        }
        
        // Crear grupo para el elemento
        const elementGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        elementGroup.setAttribute('class', `network-element element-type-${element.type}`);
        elementGroup.setAttribute('data-element-id', element.id || '');
        elementGroup.setAttribute('data-element-type', element.type);
        
        // Posicionar grupo
        elementGroup.setAttribute('transform', `translate(${x}, ${y})`);
        
        // AÃ±adir forma segÃºn el tipo de elemento (simplificado)
        const elementShape = this.createElementShape(element);
        elementGroup.appendChild(elementShape);
        
        // AÃ±adir etiqueta si existe
        if (element.name) {
          const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          label.setAttribute('x', '0');
          label.setAttribute('y', '20');
          label.setAttribute('text-anchor', 'middle');
          label.setAttribute('fill', this.isDarkMode ? '#ffffff' : '#333333');
          label.setAttribute('font-size', '10');
          label.setAttribute('class', 'element-label');
          label.textContent = element.name || '';
          elementGroup.appendChild(label);
        }
        
        // AÃ±adir eventos
        elementGroup.addEventListener('mousedown', (e) => {
          e.stopPropagation();
          if (this.tool === 'select') {
            this.selectElement(element);
          }
        });
        
        // AÃ±adir el grupo
        elementLayer.appendChild(elementGroup);
        renderedCount++;
      });
      
      this.logDebug(`Elementos renderizados con Ã©xito: ${renderedCount} de ${elements.length}`);
      
      // Si no se renderiza ningÃºn elemento pero la lista no estÃ¡ vacÃ­a, esto indica un problema
      if (renderedCount === 0 && elements.length > 0) {
        this.logDebug('No se pudo renderizar ningÃºn elemento aunque la lista no estÃ¡ vacÃ­a', 
                    { elementsSample: elements.slice(0, 3) }, LogLevel.WARN);
      }
      
      // Centrar automÃ¡ticamente el mapa si es la primera vez
      if (renderedCount > 0 && this.panOffset.x === 0 && this.panOffset.y === 0) {
        this.centerMap([0, 0]);
      }
      
    } catch (error) {
      this.logDebug('Error al renderizar elementos', error, LogLevel.ERROR);
    }
  }
  
  /**
   * Crea una forma SVG para representar un elemento segÃºn su tipo
   */
  private createElementShape(element: NetworkElement): SVGElement {
    let shape: SVGElement;
    
    switch (element.type) {
      case ElementType.OLT:
        // RectÃ¡ngulo para OLT
        shape = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        shape.setAttribute('x', '-10');
        shape.setAttribute('y', '-10');
        shape.setAttribute('width', '20');
        shape.setAttribute('height', '20');
        shape.setAttribute('rx', '3');
        shape.setAttribute('fill', '#4CAF50');
        break;
        
      case ElementType.ONT:
        // CÃ­rculo para ONT
        shape = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        shape.setAttribute('cx', '0');
        shape.setAttribute('cy', '0');
        shape.setAttribute('r', '8');
        shape.setAttribute('fill', '#F44336');
        break;
        
      case ElementType.SPLITTER:
        // Diamante para Splitter
        shape = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        shape.setAttribute('points', '0,-8 8,0 0,8 -8,0');
        shape.setAttribute('fill', '#FF9800');
        break;
        
      default:
        // CÃ­rculo genÃ©rico para otros tipos
        shape = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        shape.setAttribute('cx', '0');
        shape.setAttribute('cy', '0');
        shape.setAttribute('r', '6');
        shape.setAttribute('fill', '#9E9E9E');
    }
    
    // Agregar borde 
    shape.setAttribute('stroke', '#333');
    shape.setAttribute('stroke-width', '1');
    
    return shape;
  }
  
  /**
   * Renderiza las conexiones entre elementos
   */
  private renderConnections(): void {
    if (!this.mapSvgEl || !this.mapSvgEl.nativeElement) {
      this.logDebug('No se pueden renderizar conexiones: elemento SVG no disponible', null, LogLevel.WARN);
      return;
    }
    
    try {
      const svgElement = this.mapSvgEl.nativeElement;
      const connectionsLayer = svgElement.querySelector('.connections-layer');
      
      if (!connectionsLayer) {
        this.logDebug('No se encuentra la capa de conexiones', null, LogLevel.WARN);
        return;
      }
      
      // Limpiar conexiones existentes
      while (connectionsLayer.firstChild) {
        connectionsLayer.removeChild(connectionsLayer.firstChild);
      }
      
      // Obtener conexiones a partir de los elementos
      let connections: NetworkConnection[] = [];
      
      // Intentar obtener el servicio de conexiones
      if (this.connectionService && typeof this.connectionService.getConnections === 'function') {
        // Obtener conexiones del servicio de conexiones si existe
        connections = this.connectionService.getConnections();
        this.logDebug(`Obtenidas ${connections.length} conexiones del servicio MapConnectionService`);
      } else {
        // Si no estÃ¡ disponible MapConnectionService, buscar en ElementManager
        this.logDebug('MapConnectionService no disponible, buscando en ElementManager', null, LogLevel.INFO);
        
        // Intentar obtener conexiones del ElementManager
        if (this.elementManager && typeof (this.elementManager as any).getConnections === 'function') {
          connections = (this.elementManager as any).getConnections() || [];
          this.logDebug(`Obtenidas ${connections.length} conexiones de ElementManager`);
        } else {
          // Usar una alternativa: mantener conexiones previamente cargadas
          this.logDebug('MÃ©todo getConnections no disponible, usando alternativa', null, LogLevel.WARN);
          connections = this.connections;
        }
      }
      
      // Filtrar conexiones segÃºn capas activas
      const visibleConnections = connections.filter(connection => {
        if (!connection.sourceElementId || !connection.targetElementId) {
          return false;
        }
        
        // Buscar elementos fuente y destino para verificar su tipo
        const sourceElement = this.elements.find(e => e.id === connection.sourceElementId);
        const targetElement = this.elements.find(e => e.id === connection.targetElementId);
        
        if (!sourceElement || !targetElement) {
          return false;
        }
        
        // Verificar si los tipos estÃ¡n en las capas activas
        return this.activeLayers.includes(sourceElement.type) && 
               this.activeLayers.includes(targetElement.type);
      });
      
      // Guardar las conexiones filtradas para uso futuro
      this.connections = connections;
      
      this.logDebug(`Renderizando ${visibleConnections.length} conexiones visibles de ${connections.length} totales`);
      
      // Renderizar conexiones visibles
      visibleConnections.forEach(connection => {
        const sourceElement = this.elements.find(e => e.id === connection.sourceElementId);
        const targetElement = this.elements.find(e => e.id === connection.targetElementId);
        
        if (!sourceElement?.position || !targetElement?.position) {
          return; // Saltar conexiones sin elementos vÃ¡lidos
        }
        
        // Obtener coordenadas del elemento origen
        let sourceX = 0;
        let sourceY = 0;
        
        // Obtener coordenadas segÃºn el formato de posiciÃ³n
        if (Array.isArray(sourceElement.position) && sourceElement.position.length >= 2) {
          // Formato array [x, y]
          [sourceX, sourceY] = sourceElement.position;
        } else if (sourceElement.position && typeof sourceElement.position === 'object') {
          if (typeof sourceElement.position.lat === 'number' && typeof sourceElement.position.lng === 'number') {
            // Formato objeto lat/lng
            sourceX = sourceElement.position.lng * 100; // Escala arbitraria para ejemplo
            sourceY = sourceElement.position.lat * 100; // Ajustar segÃºn tu sistema de coordenadas
          } else if (Array.isArray(sourceElement.position.coordinates) && sourceElement.position.coordinates.length >= 2) {
            // Formato coordinates GeoJSON [lng, lat]
            sourceX = sourceElement.position.coordinates[0] * 100;
            sourceY = sourceElement.position.coordinates[1] * 100;
          } else {
            return; // Formato no soportado
          }
        } else {
          return; // PosiciÃ³n no vÃ¡lida
        }
        
        // Obtener coordenadas del elemento destino
        let targetX = 0;
        let targetY = 0;
        
        // Obtener coordenadas segÃºn el formato de posiciÃ³n
        if (Array.isArray(targetElement.position) && targetElement.position.length >= 2) {
          // Formato array [x, y]
          [targetX, targetY] = targetElement.position;
        } else if (targetElement.position && typeof targetElement.position === 'object') {
          if (typeof targetElement.position.lat === 'number' && typeof targetElement.position.lng === 'number') {
            // Formato objeto lat/lng
            targetX = targetElement.position.lng * 100; // Escala arbitraria para ejemplo
            targetY = targetElement.position.lat * 100; // Ajustar segÃºn tu sistema de coordenadas
          } else if (Array.isArray(targetElement.position.coordinates) && targetElement.position.coordinates.length >= 2) {
            // Formato coordinates GeoJSON [lng, lat]
            targetX = targetElement.position.coordinates[0] * 100;
            targetY = targetElement.position.coordinates[1] * 100;
          } else {
            return; // Formato no soportado
          }
        } else {
          return; // PosiciÃ³n no vÃ¡lida
        }
        
        // Crear lÃ­nea para la conexiÃ³n
        const connectionLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        connectionLine.setAttribute('x1', sourceX.toString());
        connectionLine.setAttribute('y1', sourceY.toString());
        connectionLine.setAttribute('x2', targetX.toString());
        connectionLine.setAttribute('y2', targetY.toString());
        
        // Estilo segÃºn estado
        const status = connection.status || 'unknown';
        let strokeColor;
        
        // Convertir a string y comparar para evitar problemas con el tipo ConnectionStatus
        const statusStr = String(status);
        if (statusStr === 'active' || statusStr === 'ACTIVE') {
          strokeColor = '#4CAF50'; // Verde
        } else if (statusStr === 'inactive' || statusStr === 'INACTIVE') {
          strokeColor = '#F44336'; // Rojo
        } else if (statusStr === 'warning' || statusStr === 'WARNING' || 
                  statusStr === 'degraded' || statusStr === 'DEGRADED') {
          strokeColor = '#FF9800'; // Naranja
        } else {
          strokeColor = '#9E9E9E'; // Gris
        }
        
        connectionLine.setAttribute('stroke', strokeColor);
        connectionLine.setAttribute('stroke-width', '2');
        connectionLine.setAttribute('class', `connection-line connection-status-${status}`);
        connectionLine.setAttribute('data-connection-id', connection.id || '');
        connectionLine.setAttribute('data-source-id', connection.sourceElementId);
        connectionLine.setAttribute('data-target-id', connection.targetElementId);
        
        // AÃ±adir evento para seleccionar la conexiÃ³n
        connectionLine.addEventListener('mousedown', (e) => {
          e.stopPropagation();
          if (this.tool === 'select') {
            this.selectConnection(connection);
          }
        });
        
        // AÃ±adir la lÃ­nea al contenedor
        connectionsLayer.appendChild(connectionLine);
      });
      
    } catch (error) {
      this.logDebug('Error al renderizar conexiones', error, LogLevel.ERROR);
    }
  }
  
  /**
   * Selecciona un elemento
   */
  private selectElement(element: NetworkElement): void {
    this.selectedElement = element;
    this.selectedConnection = null;
    this.updateSelectionIndicators();
    this.elementSelected.emit(element);
    this.cdr.markForCheck();
  }
  
  /**
   * Selecciona una conexiÃ³n
   */
  private selectConnection(connection: NetworkConnection): void {
    this.selectedConnection = connection;
    this.selectedElement = null;
    this.updateSelectionIndicators();
    this.connectionSelected.emit(connection);
    this.cdr.markForCheck();
  }
  
  /**
   * Actualiza indicadores de selecciÃ³n
   */
  private updateSelectionIndicators(): void {
    if (!this.mapSvgEl || !this.mapSvgEl.nativeElement) {
      return;
    }
    
    try {
      const svgElement = this.mapSvgEl.nativeElement;
      const selectionLayer = svgElement.querySelector('.selection-layer');
      
      if (!selectionLayer) {
        this.logDebug('No se encuentra la capa de selecciÃ³n', null, LogLevel.WARN);
        return;
      }
      
      // Limpiar indicadores existentes
      while (selectionLayer.firstChild) {
        selectionLayer.removeChild(selectionLayer.firstChild);
      }
      
      // Crear indicador segÃºn lo que estÃ© seleccionado
      if (this.selectedElement) {
        this.createElementSelectionIndicator(selectionLayer, this.selectedElement);
      } else if (this.selectedConnection) {
        this.createConnectionSelectionIndicator(selectionLayer, this.selectedConnection);
      }
      
    } catch (error) {
      this.logDebug('Error al actualizar indicadores de selecciÃ³n', error, LogLevel.ERROR);
    }
  }
  
  /**
   * Crea un indicador de selecciÃ³n para un elemento
   */
  private createElementSelectionIndicator(container: Element, element: NetworkElement): void {
    // Verificar que la posiciÃ³n sea un array y tenga al menos 2 elementos
    if (!element.position || !Array.isArray(element.position) || element.position.length < 2) {
      return;
    }
    
    // Acceder a las coordenadas directamente en lugar de usar desestructuraciÃ³n
    const x = element.position[0];
    const y = element.position[1];
    
    // Crear cÃ­rculo de selecciÃ³n
    const selectionCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    selectionCircle.setAttribute('cx', x.toString());
    selectionCircle.setAttribute('cy', y.toString());
    selectionCircle.setAttribute('r', '16'); // Radio mayor que el elemento
    selectionCircle.setAttribute('fill', 'none');
    selectionCircle.setAttribute('stroke', '#1976d2');
    selectionCircle.setAttribute('stroke-width', '2');
    selectionCircle.setAttribute('stroke-dasharray', '4,2');
    selectionCircle.setAttribute('class', 'selection-indicator pulse-effect');
    
    // AÃ±adir animaciÃ³n de pulsaciÃ³n
    const animation = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
    animation.setAttribute('attributeName', 'r');
    animation.setAttribute('from', '16');
    animation.setAttribute('to', '18');
    animation.setAttribute('dur', '1s');
    animation.setAttribute('repeatCount', 'indefinite');
    animation.setAttribute('values', '16;18;16');
    animation.setAttribute('keyTimes', '0;0.5;1');
    selectionCircle.appendChild(animation);
    
    container.appendChild(selectionCircle);
  }
  
  /**
   * Crea un indicador de selecciÃ³n para una conexiÃ³n
   */
  private createConnectionSelectionIndicator(container: Element, connection: NetworkConnection): void {
    // Buscar elementos fuente y destino usando sourceId y targetId
    const sourceElement = this.elements.find(e => e.id === connection.sourceElementId);
    const targetElement = this.elements.find(e => e.id === connection.targetElementId);
    
    // Verificar que ambos elementos existan y tengan posiciones vÃ¡lidas
    if (!sourceElement?.position || !targetElement?.position) {
      return;
    }
    
    // Verificar que las posiciones sean arrays con al menos 2 elementos
    if (!Array.isArray(sourceElement.position) || sourceElement.position.length < 2 ||
        !Array.isArray(targetElement.position) || targetElement.position.length < 2) {
      return;
    }
    
    // Obtener coordenadas de los elementos
    const sourceX = sourceElement.position[0];
    const sourceY = sourceElement.position[1];
    const targetX = targetElement.position[0];
    const targetY = targetElement.position[1];
    
    // Crear lÃ­nea de selecciÃ³n que sigue la conexiÃ³n
    const selectionLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    selectionLine.setAttribute('x1', sourceX.toString());
    selectionLine.setAttribute('y1', sourceY.toString());
    selectionLine.setAttribute('x2', targetX.toString());
    selectionLine.setAttribute('y2', targetY.toString());
    selectionLine.setAttribute('stroke', '#1976d2');
    selectionLine.setAttribute('stroke-width', '4');
    selectionLine.setAttribute('stroke-dasharray', '6,3');
    selectionLine.setAttribute('class', 'selection-indicator');
    
    // AÃ±adir animaciÃ³n de flujo a lo largo de la lÃ­nea
    const animation = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
    animation.setAttribute('attributeName', 'stroke-dashoffset');
    animation.setAttribute('from', '0');
    animation.setAttribute('to', '12');
    animation.setAttribute('dur', '1s');
    animation.setAttribute('repeatCount', 'indefinite');
    selectionLine.appendChild(animation);
    
    container.appendChild(selectionLine);
  }
  
  /**
   * Actualiza el cursor segÃºn la herramienta activa
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
    if (event.button !== 0) return; // Solo botÃ³n izquierdo
    
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
    // Emitir posiciÃ³n del cursor
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
    
    // Determinar direcciÃ³n de zoom
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
   * Ajustar zoom a un nivel especÃ­fico
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
    // ImplementaciÃ³n pendiente para calcular lÃ­mites y centrar todos los elementos
    this.zoomScale = 1;
    this.panOffset = { x: 0, y: 0 };
    this.zoomChanged.emit(100);
    this.cdr.markForCheck();
  }
  
  /**
   * Centra el mapa en las coordenadas especificadas (sistema de coordenadas del mapa).
   * @param coordinates Coordenadas [x, y] a centrar.
   */
  centerMap(coordinates: [number, number]): void {
    if (!this.mapContainerEl || !this.mapContainerEl.nativeElement) {
      this.logger.warn('Contenedor del mapa no disponible para centrar.');
      return;
    }

    const centerX = this.width / 2;
    const centerY = this.height / 2;

    // Calculamos el nuevo panOffset para que las coordenadas (x,y)
    // multiplicadas por el zoom actual, mÃ¡s el offset, resulten en el centro de la pantalla.
    // targetX * zoomScale + newPanX = screenCenterX
    // newPanX = screenCenterX - targetX * zoomScale
    this.panOffset = {
      x: centerX - (coordinates[0] * this.zoomScale),
      y: centerY - (coordinates[1] * this.zoomScale)
    };

    this.lastPanOffset = { ...this.panOffset }; // Actualizar el Ãºltimo offset para el panning
    this.refreshMap(); // Volver a dibujar el mapa con el nuevo centrado
    this.logger.debug(`Mapa centrado en [${coordinates[0]}, ${coordinates[1]}] con panOffset:`, this.panOffset);
    this.cdr.markForCheck();
  }
} 

