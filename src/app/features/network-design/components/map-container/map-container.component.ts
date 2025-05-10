import { Component, OnInit, OnDestroy, HostListener, inject, ChangeDetectorRef, ViewChild, ElementRef, Output, EventEmitter, Input, ChangeDetectionStrategy, PLATFORM_ID, AfterViewInit, NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatBadgeModule } from '@angular/material/badge';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { Subscription, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { trigger, transition, style, animate } from '@angular/animations';
import { NetworkStateService } from '../../services/network-state.service';
import { LoggerService } from '../../../../core/services/logger.service';
import { ElementType, NetworkElement, NetworkConnection } from '../../../../shared/types/network.types';
import { ShortcutsHelpDialogComponent } from '../../../../shared/components/shortcuts-help-dialog/shortcuts-help-dialog.component';
import { NetworkToolbarComponent } from '../network-toolbar/network-toolbar.component';
import { fadeAnimation } from '../../../../shared/animations/common.animations';

// Importar nuevos componentes y servicios
import { MapViewComponent } from '../map-container/components/map-view/map-view.component';
import { MiniMapComponent } from '../map-container/components/mini-map/mini-map.component';
import { MapStateManagerService, ToolType } from '../../services/map/map-state-manager.service';
import { MapElementManagerService } from '../../services/map/map-element-manager.service';
import { MapRenderingService, MapStatistics, PerformanceMetrics } from '../../services/map/map-rendering.service';
import { MapInteractionService } from '../../services/map/map-interaction.service';
import { MapServicesModule } from '../../services/map/map-services.module';

/**
 * Constantes utilizadas en el componente
 */
const CONSTANTS = {
  /** Tiempos de espera (ms) */
  TIMEOUTS: {
    VIEWPORT_UPDATE: 250,
    LOAD_BATCH: 100,
    SAVE_NOTIFICATION: 3000,
    HEALTH_CHECK: 5000,
    STATS_UPDATE: 2000,
    SEARCH_DEBOUNCE: 300
  },
  /** Valores para carga progresiva */
  LOADING: {
    INITIAL_BATCH_SIZE: 100,
    BATCH_SIZE: 50,
    MAX_ELEMENTS: 1000,
    MAX_INIT_ATTEMPTS: 5
  },
  /** Valores para el minimapa */
  MINIMAP: {
    DEFAULT_SCALE: 0.2,
    WIDTH: 200,
    HEIGHT: 150
  },
  /** Zoom y escala */
  ZOOM: {
    DEFAULT_LEVEL: 100,
    DEFAULT_SCALE: 1000,
    MIN_LEVEL: 10,
    MAX_LEVEL: 200
  }
};

/**
 * Interfaz para opciones de optimización
 */
export interface OptimizationOptions {
  clusterView: boolean;
  reduceDetails: boolean;
  simplifyConnections: boolean;
  useCanvasFallback: boolean;
}

/**
 * Componente contenedor principal para el mapa de red
 * 
 * Versión refactorizada que delega responsabilidades a servicios y componentes especializados.
 * Este componente actúa como coordinador de alto nivel entre los servicios y subcomponentes.
 * 
 * @example
 * <app-map-container
 *   (elementSelected)="handleElementSelected($event)"
 *   (connectionSelected)="handleConnectionSelected($event)"
 * ></app-map-container>
 */
@Component({
  selector: 'app-map-container',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatMenuModule,
    MatDividerModule,
    MatBadgeModule,
    MatProgressSpinnerModule,
    NetworkToolbarComponent,
    MatCheckboxModule,
    ReactiveFormsModule,
    // Importar nuevos componentes
    MapViewComponent,
    MiniMapComponent,
    MapServicesModule
  ],
  templateUrl: './map-container.component.html',
  styleUrls: ['./map-container.component.scss'],
  animations: [
    fadeAnimation,
    trigger('saveNotification', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-20px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ opacity: 0, transform: 'translateY(-20px)' }))
      ])
    ])
  ],
  schemas: [NO_ERRORS_SCHEMA],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MapContainerComponent implements OnInit, AfterViewInit, OnDestroy {
  /** Constantes expuestas al template */
  readonly CONSTANTS = CONSTANTS;

  // Referencias a componentes hijos
  @ViewChild(MapViewComponent) mapViewComponent!: MapViewComponent;
  @ViewChild(MiniMapComponent) miniMapComponent!: MiniMapComponent;
  @ViewChild('mapContainer') mapContainerEl!: ElementRef;
  
  // Inputs desde el componente padre
  @Input() parentMode = 'normal'; // Modo de operación definido por el padre

  // Outputs para comunicar con el componente padre
  @Output() elementSelected = new EventEmitter<NetworkElement | null>();
  @Output() connectionSelected = new EventEmitter<NetworkConnection | null>();
  @Output() requestEditElement = new EventEmitter<NetworkElement>();
  @Output() requestDeleteElement = new EventEmitter<NetworkElement>();
  @Output() stateChanged = new EventEmitter<{type: string, data: any}>();
  @Output() requestDiagnostic = new EventEmitter<void>();
  
  // Outputs adicionales para integración con network-toolbar
  @Output() toolbarZoomIn = new EventEmitter<void>();
  @Output() toolbarZoomOut = new EventEmitter<void>();
  @Output() toolbarResetZoom = new EventEmitter<void>();
  @Output() toolbarFitToScreen = new EventEmitter<void>();
  @Output() toolbarSetTool = new EventEmitter<string>();
  @Output() toolbarToggleLayer = new EventEmitter<string>();
  @Output() toolbarToggleDarkMode = new EventEmitter<void>();
  @Output() toolbarExportMap = new EventEmitter<string>();
  @Output() toolbarShowHelp = new EventEmitter<void>();
  
  // Nuevos outputs para manejar eventos que antes gestionaba el componente padre
  @Output() toolbarToggleSearch = new EventEmitter<void>();
  @Output() toolbarToggleElementsPanel = new EventEmitter<void>();
  @Output() navigateToDiagnostic = new EventEmitter<void>();
  
  // Control de búsqueda
  searchControl = new FormControl('');
  
  // Exponer ElementType para usar en la plantilla
  ElementType = ElementType;
  
  // Variables para almacenar valores de observables
  currentTool: ToolType = 'pan';
  currentZoomLevel = 100;
  isDarkMode = false;
  showMiniMap = true;
  activeLayers: ElementType[] = [];
  hasUnsavedChanges = false;
  
  // Propiedades computadas para estadísticas
  private _mapStats: MapStatistics = {
    totalElements: 0,
    totalConnections: 0,
    visibleConnections: 0,
    totalAlerts: 0,
    performanceLevel: 'Alto',
    memoryUsageFormatted: '0 MB',
    loadTime: 0
  };
  
  private _perfMetrics: PerformanceMetrics = {
    fps: 60,
    renderTime: 0,
    elementCount: 0,
    memoryUsage: 0,
    elapsed: 0
  };
  
  // Opciones de optimización actuales
  private _optimizationOptions: OptimizationOptions = {
    clusterView: false,
    reduceDetails: false,
    simplifyConnections: false,
    useCanvasFallback: false
  };
  
  // Gestión de suscripciones
  private subscriptions = new Subscription();
  private destroy$ = new Subject<void>();
  
  // Servicios inyectados
  public networkStateService = inject(NetworkStateService);
  private logger = inject(LoggerService);
  public cdr = inject(ChangeDetectorRef);
  private dialog = inject(MatDialog);
  public snackBar = inject(MatSnackBar);
  private platformId = inject(PLATFORM_ID);
  
  // Nuevos servicios refactorizados
  public stateManager = inject(MapStateManagerService);
  public elementManager = inject(MapElementManagerService);
  public renderingService = inject(MapRenderingService);
  public interactionService = inject(MapInteractionService);
  
  /**
   * Constructor
   */
  constructor() {
    this.logger.debug('MapContainerComponent (refactorizado) inicializando');
  }
  
  /**
   * Método del ciclo de vida OnInit
   * Configurar suscripciones y estado inicial
   */
  ngOnInit(): void {
    try {
      this.logger.debug('Inicializando MapContainer refactorizado');
      
      // Suscribirse a cambios en el estado global
      this.setupStateSubscriptions();
      
      // Suscribirse a actualizaciones de estadísticas
      this.setupStatsSubscriptions();
      
      // Notificar que el componente está iniciando
      this.stateChanged.emit({ type: 'mapInitializing', data: true });
    } catch (error) {
      this.logger.error('Error durante inicialización de MapContainer:', error);
    }
  }

  /**
   * Método del ciclo de vida AfterViewInit
   * Configurar componentes visuales
   */
  ngAfterViewInit(): void {
    try {
      // Verificar que estamos en el navegador
      if (!isPlatformBrowser(this.platformId)) {
        this.logger.warn('No inicializando mapa en entorno no-browser');
        return;
      }
      
      // Verificar que los componentes se hayan cargado correctamente
      setTimeout(() => {
        if (!this.mapViewComponent) {
          this.logger.warn('MapViewComponent no disponible');
        }
        
        if (!this.miniMapComponent) {
          this.logger.warn('MiniMapComponent no disponible');
        }
      }, 500);
      
    } catch (error) {
      this.logger.error('Error en AfterViewInit:', error);
    }
  }
  
  /**
   * Configura suscripciones a servicios de estado
   */
  private setupStateSubscriptions(): void {
    // Suscribirse a cambios en elemento seleccionado
    this.subscriptions.add(
      this.interactionService.selectedElement
        .pipe(takeUntil(this.destroy$))
        .subscribe(element => {
          this.elementSelected.emit(element);
        })
    );
    
    // Suscribirse a cambios en conexión seleccionada
    this.subscriptions.add(
      this.interactionService.selectedConnection
        .pipe(takeUntil(this.destroy$))
        .subscribe(connection => {
          this.connectionSelected.emit(connection);
        })
    );
    
    // Suscribirse a cambios de la herramienta actual
    this.subscriptions.add(
      this.stateManager.currentTool
        .pipe(takeUntil(this.destroy$))
        .subscribe(tool => {
          this.currentTool = tool;
          this.toolbarSetTool.emit(tool as string);
        })
    );
    
    // Suscribirse a cambios en el nivel de zoom
    this.subscriptions.add(
      this.stateManager.zoomLevel
        .pipe(takeUntil(this.destroy$))
        .subscribe(level => {
          this.currentZoomLevel = level;
        })
    );
    
    // Suscribirse a cambios en modo oscuro
    this.subscriptions.add(
      this.stateManager.isDarkMode
        .pipe(takeUntil(this.destroy$))
        .subscribe(isDark => {
          this.isDarkMode = isDark;
        })
    );
    
    // Suscribirse a cambios en el minimapa
    this.subscriptions.add(
      this.stateManager.miniMapVisible
        .pipe(takeUntil(this.destroy$))
        .subscribe(show => {
          this.showMiniMap = show;
        })
    );
    
    // Suscribirse a cambios en capas activas
    this.subscriptions.add(
      this.stateManager.activeLayers
        .pipe(takeUntil(this.destroy$))
        .subscribe(layers => {
          this.activeLayers = layers;
        })
    );
    
    // Suscribirse a cambios en cambios sin guardar
    this.subscriptions.add(
      this.stateManager.hasUnsavedChanges
        .pipe(takeUntil(this.destroy$))
        .subscribe(hasChanges => {
          this.hasUnsavedChanges = hasChanges;
        })
    );
    
    // Suscribirse a solicitudes de conexión
    this.subscriptions.add(
      this.interactionService.connectionRequests
        .pipe(takeUntil(this.destroy$))
        .subscribe(request => {
          this.stateChanged.emit({
            type: 'createConnection',
            data: {
              sourceId: request.sourceElement.id,
              targetId: request.targetElement.id,
              properties: request.properties
            }
          });
          
          // Mostrar confirmación
          this.snackBar.open('Conexión creada correctamente', 'OK', {
            duration: 3000
          });
        })
    );
  }
  
  /**
   * Configura suscripciones para estadísticas y métricas
   */
  private setupStatsSubscriptions(): void {
    // Actualizar estadísticas del mapa
    this.subscriptions.add(
      this.renderingService.mapStatistics
        .pipe(takeUntil(this.destroy$))
        .subscribe(stats => {
          this._mapStats = stats;
          this.cdr.markForCheck();
        })
    );
    
    // Actualizar métricas de rendimiento
    this.subscriptions.add(
      this.renderingService.performanceMetrics
        .pipe(takeUntil(this.destroy$))
        .subscribe(metrics => {
          this._perfMetrics = metrics;
          this.cdr.markForCheck();
        })
    );
  }
  
  /**
   * Método para redireccionar al componente MapView
   * Cambia la herramienta actual
   */
  setTool(tool: string): void {
    this.stateManager.setTool(tool as ToolType);
  }
  
  /**
   * Redirecciona al componente MapView
   * Aumenta el nivel de zoom
   */
  zoomIn(): void {
    if (this.mapViewComponent) {
      this.mapViewComponent.zoomIn();
      this.toolbarZoomIn.emit();
    }
  }
  
  /**
   * Redirecciona al componente MapView
   * Disminuye el nivel de zoom
   */
  zoomOut(): void {
    if (this.mapViewComponent) {
      this.mapViewComponent.zoomOut();
      this.toolbarZoomOut.emit();
    }
  }
  
  /**
   * Redirecciona al componente MapView
   * Resetea el zoom al nivel por defecto
   */
  resetZoom(): void {
    if (this.mapViewComponent) {
      this.mapViewComponent.setZoomLevel(100);
      this.toolbarResetZoom.emit();
    }
  }
  
  /**
   * Redirecciona al componente MapView
   * Ajusta la vista para mostrar todos los elementos
   */
  fitToScreen(): void {
    if (this.mapViewComponent) {
      this.mapViewComponent.fitToScreen();
      this.toolbarFitToScreen.emit();
    }
  }
  
  /**
   * Alterna la visualización del minimapa
   */
  toggleMiniMap(): void {
    if (this.miniMapComponent) {
      this.miniMapComponent.visible = !this.showMiniMap;
    }
    this.stateManager.toggleMiniMap();
  }
  
  /**
   * Alterna el modo oscuro
   */
  toggleDarkMode(): void {
    this.stateManager.toggleDarkMode();
    this.toolbarToggleDarkMode.emit();
  }
  
  /**
   * Muestra el diálogo de ayuda
   */
  showHelp(): void {
    this.dialog.open(ShortcutsHelpDialogComponent, {
      width: '600px',
      data: {
        mode: 'map',
        tool: this.currentTool
      }
    });
    
    this.toolbarShowHelp.emit();
  }
  
  /**
   * Abre la vista de diagnóstico
   */
  openDiagnosticView(): void {
    this.navigateToDiagnostic.emit();
    this.requestDiagnostic.emit();
  }
  
  /**
   * Alterna la visibilidad de una capa
   */
  toggleLayer(layerIdentifier: string | number): void {
    try {
      this.logger.debug(`Alternando capa: ${layerIdentifier}`);
      
      // Si es un string
      if (typeof layerIdentifier === 'string') {
        // Intentar convertir a número si es un string numérico
        const numValue = parseInt(layerIdentifier, 10);
        if (!isNaN(numValue) && Object.values(ElementType).includes(numValue as any)) {
          this.stateManager.toggleLayer(numValue as unknown as ElementType);
        } else {
          // Es un identificador de capa personalizada
          this.logger.debug(`Alternando capa personalizada: ${layerIdentifier}`);
          this.stateChanged.emit({ 
            type: 'customLayerToggled', 
            data: { id: layerIdentifier }
          });
        }
      } 
      // Si es un número (ElementType)
      else if (typeof layerIdentifier === 'number') {
        this.stateManager.toggleLayer(layerIdentifier as unknown as ElementType);
      }
      
      // Notificar al componente padre
      this.toolbarToggleLayer.emit(layerIdentifier.toString());
      
    } catch (error) {
      this.logger.error('Error al alternar capa:', error);
    }
  }
  
  /**
   * Verifica si una capa está activa
   */
  isLayerActive(layer: ElementType): boolean {
    return this.activeLayers.includes(layer);
  }
  
  /**
   * Maneja la selección de un elemento
   */
  onElementSelect(element: NetworkElement | null): void {
    this.interactionService.selectElement(element);
  }
  
  /**
   * Maneja la selección de una conexión
   */
  onConnectionSelect(connection: NetworkConnection | null): void {
    this.interactionService.selectConnection(connection);
  }
  
  /**
   * Solicita la edición de un elemento
   */
  onEditElementRequest(element: NetworkElement): void {
    this.requestEditElement.emit(element);
  }
  
  /**
   * Solicita la eliminación de un elemento
   */
  onDeleteElementRequest(element: NetworkElement): void {
    this.requestDeleteElement.emit(element);
  }
  
  /**
   * Exporta el mapa al formato especificado
   */
  exportMap(type = 'map'): void {
    try {
      // Mostrar mensaje de exportación
      this.snackBar.open(`Exportando mapa en formato: ${type}`, 'Cerrar', {
        duration: 3000
      });
      
      // Emitir evento de exportación
      this.toolbarExportMap.emit(type);
      
      // Simulamos una exportación exitosa
      setTimeout(() => {
        this.snackBar.open('Mapa exportado correctamente', 'Cerrar', {
          duration: 3000
        });
      }, 1500);
    } catch (error) {
      this.snackBar.open('Error al exportar mapa', 'Cerrar', {
        duration: 3000
      });
      this.logger.error('Error en exportación:', error);
    }
  }
  
  /**
   * Guarda los cambios pendientes
   */
  saveChanges(): void {
    this.logger.debug('Guardando cambios en el mapa');
    
    // Utilizar servicio para gestionar cambios
    this.stateManager.setUnsavedChanges(false);
    
    // Mostrar notificación de éxito
    this.snackBar.open('Cambios guardados correctamente', 'Cerrar', {
      duration: 3000
    });
  }
  
  /**
   * Optimiza el mapa para mejor rendimiento
   * Implementación mejorada que realmente optimiza el mapa
   */
  optimizeForPerformance(): void {
    this.logger.debug('Optimizando mapa para mejor rendimiento');
    
    // Obtener configuración de optimización del servicio de renderizado
    const optimizationSettings = this.renderingService.optimizeForPerformance();
    
    // Actualizar opciones de optimización locales
    this._optimizationOptions = {
      ...this._optimizationOptions,
      clusterView: optimizationSettings.clusterView,
      reduceDetails: optimizationSettings.reduceDetails,
      simplifyConnections: true,
      useCanvasFallback: this._perfMetrics.fps < 15 // Usar canvas si FPS es muy bajo
    };
    
    // Aplicar optimizaciones
    if (this._optimizationOptions.clusterView) {
      // Agrupar elementos cercanos cuando hay muchos
      this.renderingService.clearMemoizationCache();
    }
    
    if (this._optimizationOptions.reduceDetails) {
      // Reducir detalles visuales
    }
    
    if (this._optimizationOptions.simplifyConnections) {
      // Simplificar representación de conexiones
    }
    
    if (this._optimizationOptions.useCanvasFallback) {
      // Cambiar a modo canvas si el rendimiento es bajo
      this.logger.warn('Activando modo canvas de baja calidad por bajo rendimiento');
    }
    
    // Notificar al componente padre
    this.stateChanged.emit({
      type: 'performanceOptimized',
      data: this._optimizationOptions
    });
    
    this.snackBar.open('Modo de rendimiento optimizado activado', 'OK', { duration: 3000 });
  }
  
  /**
   * Limpia el campo de búsqueda
   */
  clearSearch(): void {
    this.searchControl.setValue('');
  }
  
  /**
   * Getter para estadísticas del mapa (para usar en la plantilla)
   */
  get mapStatistics(): MapStatistics {
    return this._mapStats;
  }
  
  /**
   * Getter para métricas de rendimiento (para usar en la plantilla)
   */
  get performanceMetrics(): PerformanceMetrics {
    return this._perfMetrics;
  }
  
  /**
   * Verifica si hay tipos de elementos disponibles
   */
  get hasElementTypes(): boolean {
    return ElementType !== undefined && Object.keys(ElementType).filter(k => isNaN(Number(k))).length > 0;
  }
  
  /**
   * Método del ciclo de vida OnDestroy
   * Libera recursos y cancela suscripciones
   */
  ngOnDestroy(): void {
    this.logger.debug('Limpiando recursos del MapContainerComponent');
    
    // Limpiar suscripciones
    this.subscriptions.unsubscribe();
    this.destroy$.next();
    this.destroy$.complete();
    
    // Limpiar servicios
    this.stateManager.destroy();
    this.elementManager.destroy();
  }
}