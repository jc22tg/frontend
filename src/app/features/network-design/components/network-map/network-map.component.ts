import { Component, OnInit, OnDestroy, ViewChild, ElementRef, Input, Output, 
  EventEmitter, ChangeDetectorRef, OnChanges, SimpleChanges, 
  NgZone, inject, AfterViewInit, HostListener, NO_ERRORS_SCHEMA, ChangeDetectionStrategy } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subject, Subscription, takeUntil, throttleTime, debounceTime, distinctUntilChanged, Observable } from 'rxjs';
import { animate, style, transition, trigger } from '@angular/animations';
import * as L from 'leaflet';
import { effect } from '@angular/core';

// Angular Material
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatMenuModule } from '@angular/material/menu';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar } from '@angular/material/snack-bar';

// Servicios
import { MapPositionService } from '../../services/map-position.service';
import { LoggerService } from '../../../../core/services/logger.service';
import { ElementService } from '../../services/element.service';
import { MapService } from '../../services/map.service';
import { NetworkMapStateService } from '../../services/network-map-state.service';
import { NetworkMapRendererService } from '../../services/network-map-renderer.service';
import { VirtualizationService } from '../../services/virtualization.service';
import { OfflineService } from '../../../../shared/services/offline.service';
import { MapConfigService } from '../../services/map-config.service';
import { HardwareDetectionService } from '../../services/hardware-detection.service';
import { ConnectionService } from '../../services/connection.service';

// Tipos y modelos
import { ElementStatus, NetworkElement, NetworkConnection } from '../../../../shared/types/network.types';
import { ElementType } from '../../../../shared/types/network.types';
import { MapConfig } from '../../types/network.types';

// Componentes
import { MapWidgetsContainerComponent } from '../widgets/container';

@Component({
  selector: 'app-network-map',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatBadgeModule,
    MatButtonToggleModule,
    MatMenuModule,
    MatCardModule,
    MatListModule,
    MatDividerModule
  ],
  templateUrl: './network-map.component.html',
  styleUrls: ['./network-map.component.scss'],
  // Usar estrategia OnPush para optimizar rendimiento
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateX(100%)' }),
        animate('200ms ease-out', style({ transform: 'translateX(0)' }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ transform: 'translateX(100%)' }))
      ])
    ])
  ]
})
export class NetworkMapComponent implements OnInit, OnDestroy, OnChanges, AfterViewInit {
  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef;
  
  // Inputs desde el contenedor
  @Input() zoomLevel = 100;
  @Input() isDarkMode = false;
  @Input() currentTool = 'pan';
  @Input() activeLayers: ElementType[] = [];
  
  // Outputs para emitir eventos al contenedor
  @Output() zoomChange = new EventEmitter<number>();
  @Output() elementSelect = new EventEmitter<NetworkElement | null>();
  @Output() connectionSelect = new EventEmitter<NetworkConnection | null>();
  @Output() elementsCountChange = new EventEmitter<number>();
  @Output() layerToggle = new EventEmitter<ElementType>();
  @Output() editElementRequest = new EventEmitter<NetworkElement>();
  @Output() connectElementRequest = new EventEmitter<NetworkElement>();
  @Output() deleteElementRequest = new EventEmitter<NetworkElement>();
  
  // Outputs para la integración de componentes
  @Output() createLayerRequest = new EventEmitter<void>();
  @Output() addElementRequest = new EventEmitter<{type: ElementType, batch: boolean}>();
  @Output() createConnectionRequest = new EventEmitter<NetworkConnection>();
  @Output() toggleCustomLayerRequest = new EventEmitter<string>();
  
  // Output para mediciones completadas
  @Output() measurementComplete = new EventEmitter<{
    sourceElement: NetworkElement;
    targetElement: NetworkElement;
    distance: number;
  }>();
  
  // Exportar tipos para usar en la plantilla
  readonly ElementType = ElementType;
  readonly ElementStatus = ElementStatus;
  
  // Estado del mapa
  loading = false;
  error: string | null = null;
  
  // Controles de búsqueda
  searchControl = new FormControl('');
  
  // UI State
  showFilters = false;
  showLayers = false;
  showMapToolbar = true;
  
  // Opciones de capas base
  baseLayerOptions = [
    { id: 'osm', name: 'OpenStreetMap' },
    { id: 'dark', name: 'Modo oscuro' },
    { id: 'satellite', name: 'Satélite' },
    { id: 'hybrid', name: 'Híbrido' },
    { id: 'light', name: 'Claro' },
    { id: 'offline', name: 'Offline' }
  ];
  currentBaseLayer = 'osm';
  
  // Almacenar elemento seleccionado
  selectedElement: NetworkElement | null = null;
  
  // Servicios inyectados
  private zone = inject(NgZone);
  private logger = inject(LoggerService);
  private cdr = inject(ChangeDetectorRef);
  private snackBar = inject(MatSnackBar);
  private mapStateService = inject(NetworkMapStateService);
  public mapRenderer = inject(NetworkMapRendererService);
  private mapService = inject(MapService);
  private virtualizationService = inject(VirtualizationService);
  private offline = inject(OfflineService);
  private mapConfigService = inject(MapConfigService);
  private hardwareService = inject(HardwareDetectionService);
  private connectionService = inject(ConnectionService);
  
  // Gestión de suscripciones
  private destroy$ = new Subject<void>();
  private subscriptions: Subscription[] = [];
  
  // Mapeo de iconos para los tipos de elementos
  private elementTypeIconMap: Record<ElementType, string> = {
    [ElementType.OLT]: 'router',
    [ElementType.ONT]: 'settings_input_hdmi',
    [ElementType.FDP]: 'dns',
    [ElementType.ODF]: 'dns',
    [ElementType.SPLITTER]: 'call_split',
    [ElementType.EDFA]: 'amp_stories',
    [ElementType.MANGA]: 'input',
    [ElementType.TERMINAL_BOX]: 'domain',
    [ElementType.FIBER_THREAD]: 'timeline',
    [ElementType.DROP_CABLE]: 'cable',
    [ElementType.DISTRIBUTION_CABLE]: 'lan',
    [ElementType.FEEDER_CABLE]: 'swap_vert',
    [ElementType.BACKBONE_CABLE]: 'swap_horiz',
    [ElementType.MSAN]: 'device_hub',
    [ElementType.ROUTER]: 'router',
    [ElementType.RACK]: 'storage',
    [ElementType.NETWORK_GRAPH]: 'hub',
    [ElementType.WDM_FILTER]: 'filter_list',
    [ElementType.COHERENT_TRANSPONDER]: 'waves',
    [ElementType.WAVELENGTH_ROUTER]: 'compare_arrows',
    [ElementType.OPTICAL_SWITCH]: 'switch_access',
    [ElementType.ROADM]: 'scatter_plot',
    [ElementType.OPTICAL_AMPLIFIER]: 'trending_up',
    [ElementType.FIBER_CONNECTION]: 'timeline',
    [ElementType.FIBER_SPLICE]: 'connect_without_contact',
    [ElementType.FIBER_CABLE]: 'linear_scale',
    [ElementType.FIBER_STRAND]: 'line_style'
  };
  
  // Propiedades para monitoreo de rendimiento
  private lastCheckedTimestamp = 0;
  private frameInterval = 0;
  private frameCheckCount = 0;
  private lowPerformanceCount = 0;
  private performanceMonitorTimer: any = null;
  
  constructor(
    private elementService: ElementService,
    private mapPositionService: MapPositionService,
    private offlineService: OfflineService
  ) {}
  
  ngOnInit(): void {
    // Optimizar inicio con observables para evitar bloqueos
    this.setupSearchListener();
    
    // Inicialización diferida del mapa
    setTimeout(() => {
      this.loading = true;
      this.initMap();
    }, 10);
    
    // Otras configuraciones iniciales
    effect(() => {
      this.updateDarkMode(this.isDarkMode);
    });
    
    effect(() => {
      this.updateTool(this.currentTool);
    });
    
    effect(() => {
      this.updateActiveLayers(this.activeLayers);
    });
    
    effect(() => {
      this.updateZoomLevel(this.zoomLevel);
    });
    
    // Subscribirse a cambios en el estado del mapa con el signal de loading
    this.zone.runOutsideAngular(() => {
      effect(() => {
        this.loading = this.mapStateService.loading();
        this.zone.run(() => {
          this.cdr.markForCheck();
        });
      });
    });
    
    // Suscribirse a cambios en elementos seleccionados
    this.subscriptions.push(
      this.mapStateService.selectedElement$.subscribe(element => {
        this.selectedElement = element;
        this.elementSelect.emit(element);
        this.cdr.markForCheck();
      }),
      
      this.mapStateService.selectedConnection$.subscribe(connection => {
        this.connectionSelect.emit(connection);
        this.cdr.markForCheck();
      }),
      
      this.mapRenderer.elementsCountChange$.subscribe(count => {
        this.elementsCountChange.emit(count);
        this.cdr.markForCheck();
      })
    );
  }
  
  ngOnChanges(changes: SimpleChanges): void {
    // Verificar si el mapa está listo
    const subscription = this.mapService.isMapReady().subscribe(isReady => {
      if (!isReady) return;
      
      subscription.unsubscribe();
      
      // Manejar cambios en inputs
      if (changes['isDarkMode'] && !changes['isDarkMode'].firstChange) {
        this.updateDarkMode(changes['isDarkMode'].currentValue);
      }
      
      if (changes['currentTool'] && !changes['currentTool'].firstChange) {
        this.updateTool(changes['currentTool'].currentValue);
      }
      
      if (changes['activeLayers'] && !changes['activeLayers'].firstChange) {
        this.updateActiveLayers(changes['activeLayers'].currentValue);
      }
      
      if (changes['zoomLevel'] && !changes['zoomLevel'].firstChange) {
        this.updateZoomLevel(changes['zoomLevel'].currentValue);
      }
    });
    
    this.subscriptions.push(subscription);
  }
  
  ngAfterViewInit(): void {
    // Inicializar el mapa fuera de la zona de Angular para mejor rendimiento
    this.zone.runOutsideAngular(() => {
      this.initMap();
    });
  }
  
  ngOnDestroy(): void {
    this.logger.debug('NetworkMapComponent destruido');
    this.destroy$.next();
    this.destroy$.complete();
    
    // Limpiar suscripciones
    this.subscriptions.forEach(sub => sub.unsubscribe());
    
    // Destruir mapa y liberar recursos
    this.mapService.destroyMap();
  }
  
  /**
   * Inicializa el mapa con carga diferida de datos
   */
  private initMap(): void {
    try {
      if (!this.mapContainer) {
        this.error = 'Error: El contenedor del mapa no está disponible';
        this.loading = false;
        return;
      }
      
      // Configurar detector de bloqueo del navegador
      this.setupPerformanceMonitor();
      
      // Detectar capacidades de hardware para optimizar
      this.optimizeForHardware();
      
      const container = this.mapContainer.nativeElement;
      
      // Fase 1: Crear contenedor y estructura básica del mapa sin cargar datos
      this.createEmptyMap(container);
      
      // Fase 2: Iniciar carga asíncrona de datos progresivamente
      setTimeout(() => this.startProgressiveLoading(), 300);
    } catch (error: any) {
      // Gestionar errores de inicialización
      this.error = `Error al inicializar el mapa: ${error?.message || 'Error desconocido'}`;
      this.loading = false;
      console.error('Error en la inicialización del mapa:', error);
    }
  }
  
  /**
   * Crea la estructura básica del mapa sin cargar datos
   */
  private createEmptyMap(container: HTMLElement): void {
    // Ejecutar fuera de la zona de Angular para mejor rendimiento
    this.zone.runOutsideAngular(() => {
      this.mapService.initialize({
        container,
        initialZoom: this.zoomLevel,
        isDarkMode: this.isDarkMode,
        onElementSelect: (element) => {
          // Volver a la zona de Angular para los cambios de UI
          this.zone.run(() => {
            this.selectElement(element);
          });
        }
      });
    });
  }
  
  /**
   * Inicia la carga progresiva de datos para evitar bloqueo del navegador
   */
  private startProgressiveLoading(): void {
    this.zone.runOutsideAngular(() => {
      // Verificar que el mapa está listo antes de continuar
      this.mapService.isMapReady().subscribe(ready => {
        if (!ready) {
          // Reintentar
          setTimeout(() => this.startProgressiveLoading(), 200);
          return;
        }
        
        // Cargar datos en etapas
        this.loadNetworkDataInStages();
      });
    });
  }
  
  /**
   * Carga los datos de red en etapas para prevenir bloqueos
   */
  private loadNetworkDataInStages(): void {
    // ETAPA 1: Cargar datos más cercanos y configuración básica
    this.zone.run(() => this.loading = true);
    
    // Cargar en fases con timeouts para dar tiempo al navegador a responder
    setTimeout(() => {
      // Fase 1: Cargar solo los 50 elementos más importantes
      this.loadNetworkData(50);
      
      // Fase 2: Cargar hasta 200 elementos
      setTimeout(() => {
        this.loadNetworkData(200);
        
        // Fase 3: Cargar el resto de elementos
        setTimeout(() => {
          this.loadRemainingNetworkData();
          
          this.zone.run(() => {
            this.loading = false;
            this.cdr.markForCheck();
          });
          
          // Configurar actualización periódica de rendimiento
          this.setupPeriodicCheck();
        }, 1000);
      }, 500);
    }, 100);
  }
  
  /**
   * Establece una verificación periódica del rendimiento del mapa
   */
  private setupPeriodicCheck(): void {
    // Crear un intervalo que monitorea el rendimiento
    const monitor = setInterval(() => {
      const metrics = this.performanceMetrics;
      
      // Si el FPS cae por debajo de 20, optimizar automáticamente
      if (metrics.fps < 20) {
        this.logger.debug('Rendimiento bajo detectado. Optimizando...');
        this.optimizeForPerformance();
      }
    }, 10000); // Verificar cada 10 segundos
    
    // Limpiar en destrucción
    const subscription = new Subscription();
    subscription.add(() => clearInterval(monitor));
    this.subscriptions.push(subscription);
  }
  
  /**
   * Optimiza la configuración para mejorar el rendimiento
   */
  private optimizeForPerformance(): void {
    // Activar clustering automáticamente
    this.toggleClustering(true);
    
    // Desactivar WebGL si el rendimiento es muy bajo
    if (this.performanceMetrics.fps < 10) {
      this.toggleWebGLRendering(false);
    }
    
    // Activar carga progresiva
    this.toggleProgressiveLoading(true);
    
    // Reducir opciones de renderizado
    this.mapRenderer.updateOptions({
      progressiveLoading: true,
      clusteringEnabled: true,
      showConnections: this.performanceMetrics.fps < 15 ? false : true
    });
  }
  
  /**
   * Carga los datos iniciales de red
   */
  private loadNetworkData(limit?: number): void {
    // Carga limitada de elementos para inicialización rápida
    this.mapRenderer.renderElements(
      this.mapStateService.getVisibleElements(limit), 
      this.mapService.getMap()?.getBounds() || null
    );
    
    // Solo conexiones de los elementos visibles
    this.mapRenderer.renderConnections(
      this.mapStateService.getVisibleConnections(limit)
    );
  }
  
  /**
   * Carga el resto de elementos de red
   */
  private loadRemainingNetworkData(): void {
    // Carga completa de elementos
    this.mapRenderer.renderElements(
      this.mapStateService.getVisibleElements(), 
      this.mapService.getMap()?.getBounds() || null
    );
    
    this.mapRenderer.renderConnections(
      this.mapStateService.getVisibleConnections()
    );
  }
  
  /**
   * Configura el listener para la búsqueda
   */
  private setupSearchListener(): void {
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(value => {
      // Actualizar query de búsqueda en el estado
      this.mapStateService.updateSearchQuery(value || '');
      
      // Marcar para detección de cambios
      this.cdr.markForCheck();
    });
  }
  
  /**
   * Optimiza el mapa para el nivel de hardware detectado
   */
  private optimizeForHardware(): void {
    // Detectar nivel de hardware
    const hardwareLevel = this.determineHardwareLevel();
    this.logger.debug(`Nivel de hardware detectado: ${hardwareLevel}`);
    
    // Aplicar configuración basada en el nivel
    if (hardwareLevel === 'low') {
      this.mapRenderer.updateOptions({
        useWebGL: false,
        progressiveLoading: true,
        clusteringEnabled: true
      });
      
      // Reducir animaciones
      document.body.classList.add('reduce-animations');
    }
  }
  
  /**
   * Determina el nivel de capacidad del hardware
   */
  private determineHardwareLevel(): 'low' | 'medium' | 'high' {
    // Verificar memoria disponible (si está disponible)
    const memory = (navigator as any).deviceMemory;
    
    if (memory !== undefined) {
      if (memory <= 2) return 'low';     // 2GB o menos
      if (memory <= 4) return 'medium';  // 4GB o menos
      return 'high';                     // Más de 4GB
    }
    
    // Verificar si es un dispositivo móvil
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Verificar cores de CPU (si está disponible)
    const cores = navigator.hardwareConcurrency || 0;
    
    if (isMobile && cores <= 2) return 'low';
    if (isMobile || cores <= 4) return 'medium';
    return 'high';
  }
  
  /**
   * Actualiza el modo oscuro
   */
  private updateDarkMode(isDarkMode: boolean): void {
    this.mapService.setDarkMode(isDarkMode);
    this.mapRenderer.updateOptions({ darkMode: isDarkMode });
  }
  
  /**
   * Actualiza la herramienta activa
   */
  private updateTool(tool: string): void {
    this.mapStateService.setCurrentTool(tool);
    this.mapService.setTool(tool);
  }
  
  /**
   * Actualiza las capas activas
   */
  private updateActiveLayers(layers: ElementType[]): void {
    this.mapStateService.updateVisibleElementTypes(layers);
    
    // Actualizar renderer
    setTimeout(() => {
      this.mapRenderer.renderElements(this.mapStateService.filteredElements());
      this.mapRenderer.renderConnections(this.mapStateService.filteredConnections());
    }, 0);
  }
  
  /**
   * Actualiza el nivel de zoom
   */
  private updateZoomLevel(level: number): void {
    this.mapStateService.updateZoomLevel(level);
    this.mapService.setZoom(level);
  }
  
  /**
   * Selecciona un elemento del mapa
   */
  selectElement(element: NetworkElement | null): void {
    this.mapStateService.selectElement(element);
  }
  
  /**
   * Selecciona una conexión
   */
  selectConnection(connection: NetworkConnection | null): void {
    this.mapStateService.selectConnection(connection);
  }
  
  /**
   * Solicita editar un elemento
   */
  editElement(element: NetworkElement): void {
    this.editElementRequest.emit(element);
  }
  
  /**
   * Solicita conectar un elemento
   */
  connectElement(element: NetworkElement): void {
    this.connectElementRequest.emit(element);
  }
  
  /**
   * Solicita eliminar un elemento
   */
  deleteElement(element: NetworkElement): void {
    this.deleteElementRequest.emit(element);
  }
  
  /**
   * Aumenta el zoom del mapa
   */
  zoomIn(): void {
    this.mapService.zoomIn();
  }
  
  /**
   * Reduce el zoom del mapa
   */
  zoomOut(): void {
    this.mapService.zoomOut();
  }
  
  /**
   * Centra el mapa en un elemento
   */
  centerOnElement(element: NetworkElement): void {
    if (!element.position) return;
    
    this.mapService.centerOnElement(element);
  }
  
  /**
   * Ajusta el zoom para mostrar todos los elementos
   */
  fitToScreen(): void {
    this.mapService.fitToScreen();
  }
  
  /**
   * Cambia entre WebGL y Canvas para rendering
   */
  toggleWebGLRendering(enabled?: boolean): void {
    const useWebGL = enabled !== undefined ? enabled : 
      this.mapRenderer.getUseWebGL();
    
    // Actualizar opciones del renderizador
    this.mapRenderer.updateOptions({ useWebGL });
    
    // Renderizar de nuevo
    this.mapRenderer.renderElements(this.mapStateService.filteredElements());
  }
  
  /**
   * Cambia la carga progresiva
   */
  toggleProgressiveLoading(enabled?: boolean): void {
    const progressiveLoading = enabled !== undefined ? enabled : 
      this.mapRenderer.getProgressiveLoading();
    
    // Actualizar opciones del renderizador
    this.mapRenderer.updateOptions({ progressiveLoading });
    
    // Renderizar de nuevo
    this.mapRenderer.renderElements(this.mapStateService.filteredElements());
  }
  
  /**
   * Cambia el clustering de elementos
   */
  toggleClustering(enabled?: boolean): void {
    const clusteringEnabled = enabled !== undefined ? enabled : 
      this.mapRenderer.getClusteringEnabled();
    
    // Actualizar opciones del renderizador
    this.mapRenderer.updateOptions({ clusteringEnabled });
    
    // Renderizar de nuevo
    this.mapRenderer.renderElements(this.mapStateService.filteredElements());
  }
  
  /**
   * Obtiene las métricas de rendimiento
   */
  get performanceMetrics(): { fps: number, rendered: number, visible: number } {
    return this.mapRenderer.performanceMetrics;
  }
  
  /**
   * Obtiene estadísticas del mapa
   */
  get mapStatistics(): { totalElements: number, visibleElements: number, totalConnections: number, visibleConnections: number } {
    return this.mapStateService.statistics();
  }
  
  /**
   * Alterna la visibilidad de un tipo de elemento
   */
  toggleElementType(type: ElementType): void {
    this.mapStateService.toggleElementType(type);
    this.layerToggle.emit(type);
  }
  
  /**
   * Verifica si un tipo de elemento está activo
   */
  isElementTypeVisible(type: ElementType): boolean {
    return this.activeLayers.includes(type);
  }
  
  /**
   * Alterna la visibilidad de una capa personalizada
   */
  toggleCustomLayer(layerId: string): void {
    this.mapStateService.toggleCustomLayer(layerId);
    this.toggleCustomLayerRequest.emit(layerId);
  }
  
  /**
   * Muestra u oculta los filtros
   */
  toggleFilters(): void {
    this.showFilters = !this.showFilters;
    this.cdr.markForCheck();
  }
  
  /**
   * Muestra u oculta las capas
   */
  toggleLayers(): void {
    this.showLayers = !this.showLayers;
    this.cdr.markForCheck();
  }
  
  /**
   * Solicita crear una capa
   */
  handleCreateLayer(): void {
    this.createLayerRequest.emit();
  }
  
  /**
   * Solicita añadir un elemento
   */
  handleAddElement(event: {type: ElementType, batch: boolean}): void {
    this.addElementRequest.emit(event);
  }
  
  /**
   * Solicita crear una conexión
   */
  handleCreateConnection(connection: NetworkConnection): void {
    this.createConnectionRequest.emit(connection);
  }
  
  /**
   * Recarga los datos del mapa
   */
  reloadMap(): void {
    this.loadNetworkData();
  }
  
  /**
   * Obtiene el icono para un tipo de elemento
   */
  getElementTypeIcon(type: ElementType): string {
    return this.elementTypeIconMap[type] || 'fiber_manual_record';
  }
  
  /**
   * Cambia la herramienta actual
   */
  setTool(tool: string): void {
    this.currentTool = tool;
    this.updateTool(tool);
  }
  
  /**
   * Activa/desactiva el modo oscuro
   */
  toggleDarkMode(): void {
    this.isDarkMode = !this.isDarkMode;
    this.updateDarkMode(this.isDarkMode);
  }
  
  /**
   * Actualiza la capa base del mapa
   */
  updateBaseLayer(layerId: string): void {
    this.mapService.updateBaseLayer(layerId);
  }
  
  /**
   * Prepara datos para el modo offline
   */
  prepareOfflineData(): void {
    // Verificar si hay conexión
    if (!this.offline.isNetworkAvailable()) {
      this.snackBar.open('No hay conexión a internet para descargar datos offline', 'Cerrar', {
        duration: 5000
      });
      return;
    }
    
    // Obtener el área visible actual del servicio
    const boundingBox = this.mapService.getVisibleBoundingBox();
    
    // Mostrar mensaje
    this.snackBar.open('Preparando mapa para uso offline...', 'Cerrar', {
      duration: 2000
    });
    
    // Descargar tiles del mapa
    this.offline.prepareOfflineResources(boundingBox).subscribe({
      next: (progress) => {
        // Actualizar indicador de progreso
        if (progress.current === 1) {
          this.snackBar.open(progress.status, 'Cerrar', { duration: 3000 });
        } else if (progress.current === progress.total) {
          this.snackBar.open('Mapa preparado para uso offline', 'OK', { duration: 5000 });
        }
      },
      error: (error) => {
        this.snackBar.open('Error al preparar datos offline: ' + error.message, 'Cerrar', {
          duration: 5000
        });
      }
    });
  }
  
  /**
   * Carga una cantidad limitada de elementos en el mapa (modo seguro)
   * @param elements Lista limitada de elementos a cargar
   */
  loadMapElementsLimited(elements: NetworkElement[]): void {
    this.zone.runOutsideAngular(() => {
      try {
        // Parar cualquier renderizado en progreso
        this.mapRenderer.clearAll();
        
        // Registrar la cantidad limitada
        this.logger.debug(`Cargando solo ${elements.length} elementos en modo seguro`);
        
        // Renderizar solo estos elementos sin conexiones inicialmente
        this.mapRenderer.renderElements(elements);
        
        // Después, intentar mostrar algunas conexiones básicas si el rendimiento lo permite
        setTimeout(() => {
          const visibleIds = new Set(elements.map(e => e.id));
          
          // Tomar solo conexiones entre elementos visibles, limitado a 30 máximo
          this.connectionService.getConnections().subscribe(connections => {
            const filteredConnections = connections
              .filter(conn => visibleIds.has(conn.sourceId) && visibleIds.has(conn.targetId))
              .slice(0, 30);
              
            // Renderizar estas pocas conexiones
            if (filteredConnections.length > 0) {
              this.mapRenderer.renderConnections(filteredConnections);
            }
          });
        }, 2000);
        
        // Marcar carga como completa
        this.zone.run(() => {
          this.loading = false;
          this.cdr.markForCheck();
        });
      } catch (error) {
        this.logger.error('Error en carga segura:', error);
        this.zone.run(() => {
          this.loading = false;
          this.error = 'Error al cargar elementos: ' + (error instanceof Error ? error.message : String(error));
          this.cdr.markForCheck();
        });
      }
    });
  }
  
  /**
   * Configura sistema de monitoreo de rendimiento para detectar bloqueos
   */
  private setupPerformanceMonitor(): void {
    // Limpiar cualquier timer anterior
    if (this.performanceMonitorTimer) {
      clearInterval(this.performanceMonitorTimer);
    }
    
    this.lastCheckedTimestamp = performance.now();
    this.frameInterval = 0;
    this.frameCheckCount = 0;
    this.lowPerformanceCount = 0;
    
    // Verificar cada 2 segundos
    this.performanceMonitorTimer = setInterval(() => {
      this.checkForPerformanceIssues();
    }, 2000);
    
    // Limpiar en destrucción
    this.subscriptions.push(new Subscription(() => {
      if (this.performanceMonitorTimer) {
        clearInterval(this.performanceMonitorTimer);
      }
    }));
  }
  
  /**
   * Verifica si hay problemas de rendimiento del navegador y aplica medidas
   */
  private checkForPerformanceIssues(): void {
    const now = performance.now();
    const elapsed = now - this.lastCheckedTimestamp;
    
    // Si han pasado más de 3 segundos, podríamos estar experimentando bloqueos
    if (elapsed > 3000) {
      this.logger.warn('Posible bloqueo detectado: respuesta lenta');
      this.lowPerformanceCount++;
      
      // Si tenemos varios bloqueos consecutivos, aplicar medidas de emergencia
      if (this.lowPerformanceCount >= 2) {
        this.applyEmergencyPerformanceMeasures();
      }
    } else {
      // Reducir contador si el rendimiento mejora
      this.lowPerformanceCount = Math.max(0, this.lowPerformanceCount - 1);
    }
    
    this.frameCheckCount++;
    this.lastCheckedTimestamp = now;
    
    // Cada 5 verificaciones, reiniciar contadores
    if (this.frameCheckCount >= 5) {
      this.frameCheckCount = 0;
      this.lowPerformanceCount = Math.max(0, this.lowPerformanceCount - 1);
    }
  }
  
  /**
   * Aplica medidas de emergencia cuando se detectan bloqueos
   */
  private applyEmergencyPerformanceMeasures(): void {
    this.zone.run(() => {
      this.logger.error('Aplicando medidas de emergencia debido a bloqueos detectados');
      
      // Mostrar mensaje al usuario
      this.snackBar.open(
        'Detectados problemas de rendimiento. Aplicando modo de bajo rendimiento.', 
        'OK', 
        { duration: 5000 }
      );
      
      try {
        // 1. Activar modo emergencia en el renderizador
        this.mapRenderer.enableEmergencyMode();
        
        // 2. Limpiar el mapa actual
        this.mapRenderer.clearAll();
        
        // 3. Recargar con restricciones muy estrictas
        const currentElements = this.mapStateService.getVisibleElements();
        const limitedElements = currentElements.slice(0, 20); // Solo 20 elementos
        
        // 4. Cargar solo estos pocos elementos
        setTimeout(() => {
          this.mapRenderer.renderElements(limitedElements);
        }, 500);
        
        // 5. Desactivar funcionalidades secundarias
        this.mapStateService.updateVisibleElementTypes([
          ElementType.OLT,
          ElementType.FDP,
          ElementType.SPLITTER
        ]);
      } catch (error) {
        this.logger.error('Error al aplicar medidas de emergencia:', error);
      }
    });
  }
}

