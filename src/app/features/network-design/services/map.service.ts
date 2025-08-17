import { Injectable, NgZone, Inject, Optional, inject } from '@angular/core';
import * as d3 from 'd3';
import { LoggerService } from '../../../core/services/logger.service';
import * as L from 'leaflet';
import 'leaflet-editable';
import { Observable, of, Subject, BehaviorSubject } from 'rxjs';
import { MapConfig } from './map-types';
import { NetworkElement, NetworkConnection, ElementType, ElementStatus } from '../../../shared/types/network.types';
import { GeographicPosition } from '../../../shared/types/geo-position';
import { IMapService } from '../interfaces/map.interface';
import { NetworkEventBusService, NetworkEventType, NetworkEvent } from './network-event-bus.service';
import { NETWORK_STATE_SERVICE_TOKEN, INetworkStateService } from './event-tokens';
import { MapToolType, MapStateService } from './map/state/map-state.service';
import { MapStateManagerService, ToolType as MapManagerToolType } from './map/map-state-manager.service';
import { takeUntil } from 'rxjs/operators';
import { NetworkMapRendererService } from './network-map-renderer.service';
import { MapElementManagerService } from './map/map-element-manager.service';
import { ElementRef, OnDestroy } from '@angular/core';
// import { OfflineMapService } from './offline-map.service'; // Comentado temporalmente si la ruta es incorrecta

// Ya no aumentamos L.MapOptions aquí para 'editOptions' 
// si ya está definido en otro lugar (como sugieren los errores de linter).
// declare module 'leaflet' {
//   interface MapOptions {
//     editable?: boolean;
//     editOptions?: any; 
//   }
// }

// Exportar interfaz para posición en mapa
export interface MapPosition {
  lat: number;
  lng: number;
  coordinates?: [number, number];
}

// Extender la interfaz D3Node para permitir propiedades adicionales
interface ExtendedD3Node extends d3.SimulationNodeDatum, Omit<NetworkElement, 'id'> {
  id: string;
  x: number;
  y: number;
  fx: number | null;
  fy: number | null;
  group?: number;
  weight?: number;
  isDragging?: boolean;
  isFixed?: boolean;
}

interface BaseLayerConfig {
  id: string;
  name: string;
  url: string;
  options: L.TileLayerOptions;
}

// Esta es la interfaz para la configuración del MapService, que puede usar MapConfig internamente
// o ser similar a ella pero para la inicialización del servicio.
// Si MapConfig es la que se debe usar aquí, ajusta según sea necesario.
export interface MapServiceOptions {
  center?: L.LatLngExpression;
  zoom?: number;
  minZoom?: number;
  maxZoom?: number;
  layerId?: string;
  preferCanvas?: boolean;
  editOptions?: any; 
  container?: HTMLElement;
  initialCenter?: L.LatLngExpression;
  initialZoom?: number;
  onElementSelect?: (element: NetworkElement) => void;
  isDarkMode?: boolean;
}

/**
 * Servicio principal para la gestión del mapa
 * 
 * Este servicio actúa como fachada para los servicios especializados
 * y proporciona métodos para manejar todas las interacciones con el mapa.
 */
@Injectable({
  providedIn: 'root'
})
export class MapService implements IMapService, OnDestroy {
  // Dependencias
  private logger = inject(LoggerService);
  private mapStateService = inject(MapStateService);
  private mapStateManagerService = inject(MapStateManagerService);
  private networkMapRendererService = inject(NetworkMapRendererService);
  private mapElementManagerService = inject(MapElementManagerService);
  private destroy$ = new Subject<void>();
  private mapElementRef = new ElementRef(null);
  
  // Estado interno
  private isInitialized = false;
  private isInteractionEnabled = true;
  
  // BehaviorSubjects
  private isReadySubject = new BehaviorSubject<boolean>(false);
  private currentToolSubject = new BehaviorSubject<MapToolType>('pan');
  
  // Observables públicos
  readonly isReady$ = this.isReadySubject.asObservable();
  readonly currentTool$ = this.currentToolSubject.asObservable();
  
  private svg: d3.Selection<SVGSVGElement, unknown, null, undefined> | null = null;
  private container: HTMLElement | null = null;
  private zoomBehavior: d3.ZoomBehavior<SVGSVGElement, unknown> | null = null;
  private simulation: d3.Simulation<ExtendedD3Node, undefined> | null = null;
  private width = 0;
  private height = 0;
  private currentMapZoom = 1;
  private nodesGroup!: d3.Selection<SVGGElement, unknown, null, undefined>;
  private linksGroup!: d3.Selection<SVGGElement, unknown, null, undefined>;
  private mainGroup!: d3.Selection<SVGGElement, unknown, null, undefined>;
  private selectedElement: NetworkElement | null = null;
  private currentToolActive = 'pan';
  private isMapDarkMode = false;
  private serviceConfig: MapServiceOptions | null = null;
  private map: L.Map | null = null;
  
  // Propiedades para selección de posición
  private isPositionSelectionEnabled = false;
  private positionMarker: L.Marker | null = null;
  private previewMarker: L.Marker | null = null;
  private selectedPosition: MapPosition | null = null;
  private selectedPositionSubject = new Subject<MapPosition | null>();
  
  // Propiedades para la herramienta de medición
  private measuringPoints: L.LatLng[] = [];
  private measurementPolyline: L.Polyline | null = null;
  private measurementMarkers: L.CircleMarker[] = [];
  
  // Propiedades para la herramienta de selección por área
  private areaSelectionRectangle: L.Rectangle | null = null;
  private areaSelectionStartPoint: L.Point | null = null; // Coordenadas de capa del mapa (pixels)
  private isDrawingAreaSelection = false;
  
  // Propiedades para el paneo en los bordes (edge panning)
  private edgePanningZone = 50; // Píxeles desde el borde
  private edgePanningSpeed = 10; // Píxeles por frame de paneo (reducido de 15)
  private edgePanningAnimationFrameId: number | null = null;
  private currentPanDirection: { x: number; y: number } = { x: 0, y: 0 };
  
  // Almacenar los datos procesados para acceso externo
  private nodesData: ExtendedD3Node[] = [];
  private linksData: any[] = [];
  
  // Observables para estado del mapa
  private internalIsDarkMode$ = new BehaviorSubject<boolean>(false);
  private currentBaseLayerId$ = new BehaviorSubject<string>('osm');
  private activeTileLayer: L.TileLayer | null = null;
  public readonly isDarkMode$: Observable<boolean> = this.internalIsDarkMode$.asObservable();

  private baseLayers: Record<string, BaseLayerConfig> = {
    osm: {
      id: 'osm',
      name: 'OpenStreetMap',
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      options: {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        errorTileUrl: 'assets/leaflet/error-tiles/error-tile.png',
        crossOrigin: true,
        maxZoom: 19
      }
    },
    satellite: {
      id: 'satellite',
      name: 'Satélite',
      // Usar una capa de satélite de Esri como ejemplo, requiere atribución adecuada.
      // Considerar alternativas si se necesitan diferentes proveedores o no se puede cumplir la atribución.
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      options: {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
        errorTileUrl: 'assets/leaflet/error-tiles/error-tile.png',
        crossOrigin: true,
        maxZoom: 18
      }
    },
    terrain: {
      id: 'terrain',
      name: 'Terreno',
      // OpenTopoMap es una buena opción con atribución requerida.
      url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
      options: {
        attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)',
        errorTileUrl: 'assets/leaflet/error-tiles/error-tile.png',
        crossOrigin: true,
        maxZoom: 17
      }
    }
  };
  
  constructor(
    private zone: NgZone,
    private eventBus: NetworkEventBusService,
    @Optional() @Inject(NETWORK_STATE_SERVICE_TOKEN) private networkStateService: INetworkStateService
  ) {
    // Suscribirse a eventos relevantes del bus
    // Vamos a comentar/eliminar la dependencia del bus para toolChanged, ya que nos suscribiremos directamente
    // this.initializeEvents(); 
    this.logger.debug('MapService inicializado');

    // Suscribirse a los cambios de zoom de MapStateService
    this.mapStateService.zoom$
      .pipe(takeUntil(this.destroy$))
      .subscribe(zoomLevel => {
        if (this.map && this.isInitialized) {
          this.logger.debug(`MapService: Recibido nuevo nivel de zoom desde MapStateService: ${zoomLevel}`);
          this.setZoom(zoomLevel, true);
        }
      });

    // Suscribirse a los cambios de centro de MapStateService
    this.mapStateService.center$
      .pipe(takeUntil(this.destroy$))
      .subscribe(centerCoordinates => {
        if (this.map && this.isInitialized && centerCoordinates) {
          this.logger.debug(`MapService: Recibidas nuevas coordenadas de centro desde MapStateService: ${centerCoordinates}`);
          this.map.panTo(centerCoordinates as L.LatLngExpression); 
        }
      });

    // Suscribirse a los cambios de herramienta activa de MapStateManagerService
    this.mapStateManagerService.activeTool$
      .pipe(takeUntil(this.destroy$))
      .subscribe((tool: MapManagerToolType) => {
        if (this.isInitialized) { // Solo necesitamos que el servicio esté inicializado, no necesariamente el mapa para llamar a handleToolChange
          this.logger.debug(`MapService: Recibida nueva herramienta desde MapStateManagerService: ${tool}`);
          this.handleToolChange(tool); // Llamar al método existente que ya tiene la lógica del switch
        }
      });
  }
  
  /**
   * Suscribirse a eventos del bus de eventos de la red
   */
  private initializeEvents(): void {
    // Suscribirse a eventos relevantes para el mapa
    this.eventBus.on(NetworkEventType.WIDGET_ACTION)
    .pipe(takeUntil(this.destroy$)) // Asegurar desuscripción también aquí
    .subscribe(event => {
      // Ejemplo: manejar acciones de UI como cambio de modo oscuro o herramienta
      if (event.payload?.component === 'darkMode') {
        this.toggleDarkMode(event.payload?.enabled as boolean);
      }
      if (event.payload?.component === 'elementSelected') {
        const element = event.payload?.element;
        if (element) this.selectElement(element);
      }
      if (event.payload?.component === 'mapReset') {
        this.resetMap();
      }
      if (event.payload?.component === 'changeBaseLayer') {
        const layerId = event.payload?.layerId as string;
        if (layerId) this.setBaseLayer(layerId);
      }
    });
    // También puedes suscribirte a eventos de tipo MAP_READY o MAP_ERROR si es necesario
  }
  
  /**
   * Inicializa el mapa con la configuración proporcionada
   * @param config Configuración del mapa
   */
  initialize(config: MapServiceOptions): void {
    this.serviceConfig = config;
    this.container = config.container || null;

    if (!this.container) {
      this.logger.error('Contenedor de mapa no especificado en MapService.initialize');
      this.isReadySubject.next(false);
      return;
    }

    // Destruir mapa existente si lo hay
    if (this.map) {
      this.destroyMap();
    }

    const preferCanvas = config.preferCanvas ?? true;
    
    this.zone.runOutsideAngular(() => {
      try {
        this.map = L.map(this.container!, {
          center: config.initialCenter || [19.783750, -70.676666],
          zoom: config.initialZoom || 16,
          minZoom: config.minZoom || 3, // Usar de config o valor por defecto
          maxZoom: config.maxZoom || 19, // Usar de config o valor por defecto
          zoomControl: false,
          preferCanvas: preferCanvas,
          // editable: true, // Comentado - no es propiedad válida de Leaflet MapOptions
          // editOptions: config.editOptions || {}, // Comentado - no es propiedad válida de Leaflet MapOptions
          attributionControl: true
        });

        this.logger.info('Instancia de Leaflet Map creada en MapService.initialize');

        // Inicializar el renderer con la instancia del mapa
        if (this.networkMapRendererService) {
          this.networkMapRendererService.initialize(this.map);
          this.logger.debug('NetworkMapRendererService inicializado por MapService');
        }
        
        // Verificar e inicializar la biblioteca de Leaflet
        if (!L || !L.tileLayer) {
          this.logger.error('Error: Leaflet no está disponible. Verificar que la biblioteca esté correctamente importada');
          return;
        }
        
        // Configurar capa base por defecto
        this.setBaseLayer(config.layerId || this.currentBaseLayerId$.value);
        
        // Configurar modo oscuro si es necesario
        if (config.isDarkMode) {
          this.setDarkMode(config.isDarkMode);
        }
        
        // Configurar eventos
        this.setupMapEvents(config);
        
        // Notificar que el mapa está listo
        this.isInitialized = true;
        this.isReadySubject.next(true);
        this.eventBus.emit({
          type: NetworkEventType.MAP_READY,
          timestamp: new Date(),
          payload: { map: this.map }
        });
        this.logger.debug('Mapa inicializado correctamente');
      } catch (error) {
        this.logger.error('Error al inicializar el mapa:', error);
        this.isReadySubject.next(false);
        this.eventBus.emit({
          type: NetworkEventType.MAP_ERROR,
          timestamp: new Date(),
          payload: { error }
        });
      }
    });
  }
  
  /**
   * Establece la capa base del mapa.
   * @param layerId El ID de la capa base a activar (ej: 'osm', 'satellite', 'terrain').
   */
  setBaseLayer(layerId: string): void {
    if (!this.map) {
      this.logger.warn('Mapa no inicializado. No se puede cambiar la capa base.');
      return;
    }

    const layerConfig = this.baseLayers[layerId];
    if (!layerConfig) {
      this.logger.error(`Configuración de capa base no encontrada para el ID: ${layerId}`);
      // Intentar cargar OSM como fallback si la capa solicitada no existe
      if (layerId !== 'osm') this.setBaseLayer('osm');
      return;
    }

    try {
      this.logger.debug(`Cambiando a capa base: ${layerConfig.name}`);
      const newTileLayer = L.tileLayer(layerConfig.url, layerConfig.options);

      newTileLayer.on('tileerror', (error) => {
        this.logger.error(`Error al cargar tile para ${layerConfig.name}:`, error);
        this.loadBackupTiles(); // Podrías tener un fallback específico por capa si es necesario
      });

      if (this.activeTileLayer) {
        this.map.removeLayer(this.activeTileLayer);
      }
      
      newTileLayer.addTo(this.map);
      this.activeTileLayer = newTileLayer;
      this.currentBaseLayerId$.next(layerId);
      this.logger.debug(`Capa base ${layerConfig.name} cargada y activada.`);

    } catch (tileError) {
      this.logger.error(`Error al cambiar a capa base ${layerConfig.name}:`, tileError);
      // Podrías intentar cargar una capa de fallback como OSM aquí
      if (layerId !== 'osm') {
         this.logger.info('Intentando cargar OpenStreetMap como fallback.');
         this.setBaseLayer('osm');
      }
    }
  }
  
  /**
   * Configurar eventos del mapa
   */
  private setupMapEvents(config: MapServiceOptions): void {
    if (!this.map) return;
    
    // Configurar selección de elementos si se proporciona callback
    if (config.onElementSelect) {
      // Implementar según necesidades específicas
    }
    
    // Otros eventos del mapa
    this.map.on('zoomend', () => {
      if (this.map) {
        // Manejar eventos de zoom
      }
    });
    
    this.map.on('moveend', () => {
      if (this.map) {
        // Manejar eventos de movimiento
      }
    });
  }
  
  /**
   * Destruye el mapa y libera recursos
   */
  destroyMap(): void {
    if (this.simulation) {
      this.simulation.stop();
    }
    
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
    
    if (this.svg) {
      this.svg.selectAll('*').remove();
      this.svg.remove();
      this.svg = null;
    }
    
    this.container = null;
    this.isReadySubject.next(false);
  }
  
  /**
   * Verifica si el mapa está listo para usarse
   * @returns Observable que emite el estado de preparación
   */
  isMapReady(): Observable<boolean> {
    return this.isReadySubject.asObservable();
  }
  
  /**
   * Obtiene la instancia del mapa
   * @returns Instancia del mapa Leaflet
   */
  getMap(): L.Map | null {
    return this.map;
  }
  
  /**
   * Mueve el mapa a una posición específica
   * @param position Posición a la que mover el mapa
   */
  panTo(position: GeographicPosition): void {
    if (this.map) {
      this.map.panTo([position.lat, position.lng]);
    }
  }
  
  /**
   * Cambia el nivel de zoom del mapa
   * @param level Nivel de zoom
   */
  zoomTo(level: number): void {
    if (this.map) {
      this.map.setZoom(level);
    }
  }
  
  /**
   * Centra el mapa en las coordenadas específicas
   * @param position Coordenadas en píxeles
   */
  centerOnCoordinates(position: { x: number, y: number }): void {
    if (this.map) {
      // Convertir coordenadas de píxeles a geográficas
      const latlng = this.map.containerPointToLatLng([position.x, position.y]);
      this.map.panTo(latlng);
    }
  }
  
  /**
   * Configura el modo oscuro del mapa
   * @param isDark Indica si se debe activar el modo oscuro
   */
  setDarkMode(isDark: boolean): void {
    this.isMapDarkMode = isDark;
    this.internalIsDarkMode$.next(isDark);
    
    if (this.map) {
      // Cambiar capa base según el modo
      this.updateBaseLayer(isDark ? 'dark' : 'osm');
    }
    
    if (this.svg) {
      // Actualizar tema del SVG
      this.svg.classed('dark-theme', isDark);
    }
  }
  
  /**
   * Actualiza la capa base del mapa
   * @param layerId ID de la capa base
   */
  updateBaseLayer(layerId: string): void {
    this.currentBaseLayerId$.next(layerId);
    
    if (!this.map) {
      return;
    }
    
    try {
      // Eliminar capas base existentes
      this.map.eachLayer(layer => {
        if (layer instanceof L.TileLayer) {
          this.map?.removeLayer(layer);
        }
      });
      
      // Configuración común para todas las capas
      const tileOptions = {
        errorTileUrl: 'assets/error-tiles/error-tile.png',
        crossOrigin: true,
        maxZoom: 19
      };
      
      // Añadir nueva capa base
      switch (layerId) {
        case 'dark':
          L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            ...tileOptions,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            subdomains: 'abcd'
          }).addTo(this.map);
          break;
        case 'satellite':
          L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            ...tileOptions,
            attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
          }).addTo(this.map);
          break;
        case 'hybrid':
          L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
            ...tileOptions,
            attribution: 'Map data &copy; Google'
          }).addTo(this.map);
          break;
        case 'terrain':
          L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
            ...tileOptions,
            attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
          }).addTo(this.map);
          break;
        case 'offline':
          L.tileLayer('assets/leaflet/offline-tiles/{z}/{x}/{y}.png', {
            ...tileOptions,
            attribution: 'Tiles Offline'
          }).addTo(this.map);
          break;
        case 'osm':
        default:
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            ...tileOptions,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          }).addTo(this.map);
          break;
      }
      
      this.logger.debug(`Capa base actualizada a: ${layerId}`);
    } catch (error) {
      this.logger.error('Error al cambiar la capa base:', error);
      // Intentar cargar capa fallback
      this.loadFallbackLayer();
    }
  }
  
  /**
   * Convierte un nivel de zoom de Leaflet a porcentaje
   * @param zoomLevel Nivel de zoom Leaflet (ej: 0-19)
   * @returns Porcentaje de zoom (0-100)
   */
  private convertZoomLevelToPercent(zoomLevel: number): number {
    const maxZoom = 19; // Nivel máximo de zoom en Leaflet
    return Math.round((zoomLevel / maxZoom) * 100);
  }
  
  /**
   * Convierte un porcentaje de zoom a nivel Leaflet
   * @param percent Porcentaje de zoom (0-100)
   * @returns Nivel de zoom Leaflet (ej: 0-19)
   */
  private convertZoomPercentToLevel(percent: number): number {
    const maxZoom = 19;
    return Math.round((percent / 100) * maxZoom);
  }
  
  /**
   * Establece la herramienta activa
   */
  setTool(tool: string): void {
    this.currentToolActive = tool;
    
    switch (tool) {
      case 'pan':
        this.enablePanMode();
        break;
      case 'select':
        this.enableSelectMode();
        break;
      case 'measure':
        this.enableMeasurement();
        break;
      case 'area_select':
        this.enableAreaSelectMode(true);
        break;
      default:
        this.enablePanMode();
    }
    
    // Notificar el cambio de herramienta
    this.eventBus.emit({
      type: NetworkEventType.WIDGET_ACTION,
      timestamp: new Date(),
      payload: { component: 'toolChanged', tool: this.currentToolActive }
    });
  }
  
  /**
   * Habilita el modo de panorámica (pan)
   */
  private enablePanMode(): void {
    if (this.map) {
      this.map.dragging.enable();
      // Desactivar cualquier otro modo activo
    }
  }
  
  /**
   * Habilita el modo de selección
   */
  private enableSelectMode(): void {
    if (this.map) {
      // Configurar el mapa para el modo de selección
    }
  }
  
  /**
   * Habilita el modo de selección de área
   */
  private enableAreaSelectMode(enable: boolean): void {
    if (this.map) {
      // Configurar el mapa para la selección de área
    }
  }
  
  /**
   * Obtiene los nodos renderizados
   */
  getNodesData(): ExtendedD3Node[] {
    return this.nodesData;
  }
  
  /**
   * Obtiene las conexiones renderizadas
   */
  getLinksData(): any[] {
    return this.linksData;
  }
  
  /**
   * Ajusta el contenido para que se vea completamente en la pantalla
   */
  fitContentToScreen(): void {
    if (this.map) {
      // Si hay elementos, crear un bounds para mostrarlos todos
      if (this.nodesData.length > 0) {
        const latLngs = this.nodesData
          .filter(node => node.x !== undefined && node.y !== undefined)
          .map(node => new L.LatLng(node.y || 0, node.x || 0));
        
        if (latLngs.length > 0) {
          const bounds = L.latLngBounds(latLngs);
          this.map.fitBounds(bounds, { padding: [30, 30] });
        }
      }
    }
  }
  
  /**
   * Obtiene los límites visibles actuales como un bounding box
   */
  getVisibleBoundingBox(): { north: number, south: number, east: number, west: number } {
    if (this.map) {
      const bounds = this.map.getBounds();
      return {
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest()
      };
    }
    
    // Si no hay mapa, devolver un área por defecto
    return {
      north: 90,
      south: -90,
      east: 180,
      west: -180
    };
  }
  
  /**
   * Aumenta el zoom del mapa
   */
  zoomIn(): void {
    if (this.map) {
      this.map.zoomIn();
    } else if (this.zoomBehavior && this.svg) {
      // Si estamos usando D3, aumentar el zoom
      const currentTransform = d3.zoomTransform(this.svg.node()!);
      const newScale = currentTransform.k * 1.2;
      
      this.zoomBehavior.scaleBy(this.svg, 1.2);
      this.currentMapZoom = newScale;
    }
  }
  
  /**
   * Disminuye el zoom del mapa
   */
  zoomOut(): void {
    if (this.map) {
      this.map.zoomOut();
    } else if (this.zoomBehavior && this.svg) {
      // Si estamos usando D3, disminuir el zoom
      const currentTransform = d3.zoomTransform(this.svg.node()!);
      const newScale = currentTransform.k / 1.2;
      
      this.zoomBehavior.scaleBy(this.svg, 1/1.2);
      this.currentMapZoom = newScale;
    }
  }
  
  /**
   * Centra el mapa en un elemento específico
   */
  centerOnElement(element: NetworkElement): void {
    if (!element.position) return;
    
    if (this.map) {
      const position = new L.LatLng(
        element.position.lat,
        element.position.lng
      );
      this.map.panTo(position);
    } else if (this.svg && element.position.coordinates) {
      // Si estamos usando D3, centrar en las coordenadas del elemento
      const [x, y] = element.position.coordinates;
      this.centerOnCoordinates({ x, y });
    }
  }
  
  /**
   * Ajusta la vista para mostrar todos los elementos
   */
  fitToScreen(): void {
    if (this.map) {
      const elements = this.getNodesData().map(node => {
        // Convertir nodos a elementos de red
        return {
          id: node.id,
          position: {
            lat: node.y || 0,
            lng: node.x || 0
          }
        } as NetworkElement;
      });
      
      if (elements.length === 0) return;
      
      // Crear bounds basado en elementos
      const positions = elements
        .filter(element => element.position)
        .map(element => new L.LatLng(
          element.position!.lat,
          element.position!.lng
        ));
      
      if (positions.length === 0) return;
      
      const bounds = L.latLngBounds(positions);
      
      // Ajustar vista para mostrar todos los elementos
      this.map.fitBounds(bounds, {
        padding: [50, 50],
        maxZoom: 15
      });
    } else if (this.svg && this.zoomBehavior) {
      // Si estamos usando D3, implementar el fit to screen
      this.fitContentToScreen();
    }
  }
  
  /**
   * Establece el nivel de zoom
   */
  setZoom(level: number, animate = false): void {
    if (this.map) {
      // El nivel de zoom ya viene como un nivel de Leaflet desde MapStateService
      const leafletZoom = level;

      // Cambiar zoom con o sin animación
      this.logger.debug(`MapService: Aplicando zoom de Leaflet: ${leafletZoom}, Animado: ${animate}`);
      this.map.setZoom(leafletZoom, { animate });
    } else if (this.svg && this.zoomBehavior) {
      // Si estamos usando D3, implementar el zoom
      // Esta parte necesitaría revisión si se usa D3 para el zoom y espera porcentajes.
      const scale = this.convertPercentToScale(level);
      this.zoomBehavior.scaleTo(this.svg, scale);
    }
  }
  
  /**
   * Habilita la selección de posición para agregar elementos
   */
  enablePositionSelection(): void {
    if (!this.map) return;
    
    this.isPositionSelectionEnabled = true;
    
    // Cambiar cursor
    this.container?.classList.add('map-position-selection');
    
    // Agregar event listener para clicks en el mapa
    this.map.on('click', this.handleMapClick);
    
    this.logger.debug('Modo de selección de posición activado');
  }
  
  /**
   * Deshabilita la selección de posición
   */
  disablePositionSelection(): void {
    if (!this.map) return;
    
    this.isPositionSelectionEnabled = false;
    
    // Restaurar cursor
    this.container?.classList.remove('map-position-selection');
    
    // Remover event listener
    this.map.off('click', this.handleMapClick);
    
    // Limpiar marcador si existe
    if (this.positionMarker) {
      this.map.removeLayer(this.positionMarker);
      this.positionMarker = null;
    }
    
    this.logger.debug('Modo de selección de posición desactivado');
  }
  
  /**
   * Maneja clics en el mapa para selección de posición
   */
  private handleMapClick = (e: L.LeafletMouseEvent): void => {
    if (!this.isPositionSelectionEnabled || !this.map) return;
    
    const latlng = e.latlng;
    
    // Actualizar posición seleccionada
    this.selectedPosition = {
      lat: latlng.lat,
      lng: latlng.lng
    };
    
    // Emitir la posición seleccionada
    this.selectedPositionSubject.next(this.selectedPosition);
    
    // Actualizar o crear marcador de posición
    if (this.positionMarker) {
      this.positionMarker.setLatLng(latlng);
    } else {
      const icon = L.icon({
        iconUrl: 'assets/leaflet/map-icons/position-marker.svg',
        iconSize: [32, 32],
        iconAnchor: [16, 32]
      });
      
      this.positionMarker = L.marker(latlng, { icon, draggable: true }).addTo(this.map);
      
      // Permitir arrastrar el marcador
      this.positionMarker.on('dragend', () => {
        if (this.positionMarker) {
          const newPos = this.positionMarker.getLatLng();
          this.selectedPosition = {
            lat: newPos.lat,
            lng: newPos.lng
          };
          this.selectedPositionSubject.next(this.selectedPosition);
        }
      });
    }
  }
  
  /**
   * Obtiene la posición seleccionada como observable
   */
  getSelectedPosition(): Observable<MapPosition | null> {
    return this.selectedPositionSubject.asObservable();
  }
  
  /**
   * Muestra una vista previa de un elemento en el mapa
   */
  previewElement(element: NetworkElement): void {
    if (!this.map || !element.position) return;
    
    this.clearPreview();
    
    const position = new L.LatLng(element.position.lat, element.position.lng);
    
    // Crear icono según tipo de elemento
    const icon = L.icon({
      iconUrl: `assets/leaflet/map-icons/${element.type.toLowerCase()}.svg`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      className: 'preview-marker'
    });
    
    // Crear marcador
    this.previewMarker = L.marker(position, { icon }).addTo(this.map);
    
    // Centrar mapa en la posición
    this.map.panTo(position);
  }
  
  /**
   * Limpia cualquier vista previa del mapa
   */
  clearPreview(): void {
    if (!this.map) return;
    
    if (this.previewMarker) {
      this.map.removeLayer(this.previewMarker);
      this.previewMarker = null;
    }
  }
  
  /**
   * Centra el mapa en su posición predeterminada
   */
  centerMap(): void {
    if (this.map && this.serviceConfig && this.serviceConfig.initialCenter) {
      this.map.setView(this.serviceConfig.initialCenter, this.convertZoomPercentToLevel(this.serviceConfig.initialZoom || 100));
    }
  }
  
  /**
   * Añade un elemento en una posición específica
   */
  addElementAtPosition(element: NetworkElement, x: number, y: number): void {
    if (!this.map) return;
    // Crear y añadir marcador para el nuevo elemento
    const latLng = new L.LatLng(y, x);
    // Aquí se podría crear un marcador permanente para el elemento
    // Pero en general, los elementos se gestionan a través del renderer
    // Centrar en el elemento añadido
    this.map.panTo(latLng);
    // Limpiar cualquier marcador temporal
    this.clearPreview();
    this.disablePositionSelection();
  }
  
  /**
   * Actualiza los elementos visibles en el mapa
   */
  updateMapElements(elements: NetworkElement[], connections: NetworkConnection[]): void {
    this.logger.debug(`Actualización de elementos solicitada: ${elements.length} elementos, ${connections.length} conexiones`);
    
    this.nodesData = elements
      .filter(element => !!element.id && !!element.position) 
      .map(element => {
        const xVal = (element.position as any)?.lng ?? 0;
        const yVal = (element.position as any)?.lat ?? 0;

        const node: ExtendedD3Node = {
          ...element,
          id: element.id!, // Asegurar que id sea string y no undefined
          x: xVal, 
          y: yVal, 
          fx: (element.metadata?.fixed ? xVal : null) as number | null, 
          fy: (element.metadata?.fixed ? yVal : null) as number | null, 
        };
        return node;
      });
    
    // En un caso real, esta función delegaría en el renderer
  }
  
  /**
   * Exporta el mapa al formato especificado
   */
  exportMap(format: string): void {
    if (!this.map) {
      return;
    }
    this.logger.debug(`Exportando mapa en formato ${format}`);
    // Aquí se implementaría la lógica real de exportación
  }
  
  // Métodos stub para cumplir con la interfaz IMapService
  initializeMap(mapConfig: MapConfig): Promise<void> { 
    this.logger.debug('[MapService] initializeMap llamado con MapConfig', mapConfig);
    // MapConfig define 'container' como HTMLElement | string.
    // Nuestro servicio necesita HTMLElement.
    let mapContainerElement: HTMLElement | null = null;
    if (typeof mapConfig.container === 'string') {
      mapContainerElement = document.getElementById(mapConfig.container);
      if (!mapContainerElement) {
        this.logger.error(`Contenedor del mapa con ID '${mapConfig.container}' no encontrado en el DOM.`);
        return Promise.reject(`Contenedor del mapa '${mapConfig.container}' no encontrado.`);
      }
    } else {
      mapContainerElement = mapConfig.container;
    }
    this.container = mapContainerElement; // Establecer el contenedor del servicio

    if (!this.container) {
      this.logger.error('Contenedor del mapa no resuelto desde MapConfig para initializeMap');
      return Promise.reject('Contenedor del mapa no disponible');
    }

    const serviceOptions: MapServiceOptions = {
        container: this.container,
        initialCenter: [19.783750, -70.676666], // Default center, MapConfig no tiene 'center'
        initialZoom: mapConfig.initialZoom || 16, // Usar initialZoom de MapConfig
        minZoom: mapConfig.minZoom, // Pasar desde MapConfig
        maxZoom: mapConfig.maxZoom, // Pasar desde MapConfig
        layerId: 'osm', // Default layerId, MapConfig no tiene 'layerId'
        preferCanvas: true, // Default preferCanvas, MapConfig no tiene 'preferCanvas'
        editOptions: {}, // Default editOptions, MapConfig no tiene 'editOptions'
        isDarkMode: mapConfig.isDarkMode || false, // Usar isDarkMode de MapConfig
        onElementSelect: mapConfig.onElementSelect // Pasar el callback si existe
    };
    this.initialize(serviceOptions);
    return Promise.resolve(); 
  }

  clearMap(): void {}
  stopSimulation(): void {}
  selectElement(element: NetworkElement | null): void {}
  handleConnection(source: NetworkElement, target: NetworkElement, status?: string): void {}
  getMapCenter(): { x: number, y: number } { return { x: 0, y: 0 }; }
  getCurrentZoom(): number { return 1; }
  clearMeasurements(): void {}
  refreshMapSize(): void {}
  convertPercentToScale(percentageZoom: number): number { return 1; }
  convertScaleToPercent(scaleZoom: number): number { return 100; }
  sendPositionToEditor(lat: number, lng: number): void {}
  
  private handleElementSelectedViaEvent(element: NetworkElement | null): void {
    this.selectedElement = element;
    if (element && this.map && element.position) {
      this.panTo(element.position);
    }
  }
  
  private resetMap(): void {
    if (this.map) {
      const initialCenter = this.serviceConfig?.initialCenter || [19.783750, -70.676666];
      const initialZoom = this.serviceConfig?.initialZoom || 16;
      this.map.setView(initialCenter, initialZoom);
      this.clearMarkers();
      this.selectedElement = null;
    }
  }
  
  private clearMarkers(): void {
    if (this.positionMarker && this.map) {
      this.map.removeLayer(this.positionMarker);
      this.positionMarker = null;
    }
    if (this.previewMarker && this.map) {
      this.map.removeLayer(this.previewMarker);
      this.previewMarker = null;
    }
    this.selectedPosition = null;
    this.selectedPositionSubject.next(null);
  }

  private handleToolChange(tool: string): void {
    this.currentToolActive = tool;
    const mapContainer = this.map?.getContainer();
    if (this.map && mapContainer) {
      this.map.dragging.disable();
      L.DomUtil.removeClass(mapContainer, 'cursor-pointer');
      L.DomUtil.removeClass(mapContainer, 'cursor-crosshair');
      L.DomUtil.removeClass(mapContainer, 'cursor-grab');
      this.disableMeasurementTool();
      this.disableAreaSelectionTool();
      this.disableSelectionTool();
    }
    switch (tool) {
      case 'pan': this.enablePanning(); break;
      case 'select': this.enableSelection(); break;
      case 'areaSelect': this.enableAreaSelection(); break;
      case 'measure': this.enableMeasurement(); break;
      default: this.enablePanning(); break;
    }
    this.logger.debug(`Herramienta cambiada a: ${tool}`);
  }

  private toggleDarkMode(isDark: boolean): void {
    this.setDarkMode(isDark);
    this.logger.debug(`Modo oscuro ${isDark ? 'activado' : 'desactivado'}`);
  }

  disableInteraction(): void {
    this.logger.debug('Deshabilitando interacciones del mapa');
  }

  enablePanning(): void {
    this.logger.debug('Habilitando navegación del mapa (pan)');
    if (this.map) {
      this.map.dragging.enable();
    }
  }

  enableSelection(): void {
    this.logger.debug('Habilitando selección de elementos');
    if (this.map) {
      this.map.dragging.disable(); 
      const mapContainer = this.map.getContainer();
      L.DomUtil.addClass(mapContainer, 'cursor-pointer'); 
      this.map.on('click', this.handleMapSelectionClick);
    }
  }

  private disableSelectionTool(): void {
    if (this.map) {
      this.map.off('click', this.handleMapSelectionClick);
    }
    this.logger.debug('Herramienta de selección deshabilitada.');
  }

  private handleMapSelectionClick = (event: L.LeafletMouseEvent): void => {
    this.logger.debug('Clic en mapa vacío con herramienta seleccionar. Limpiando selección.');
    this.mapStateManagerService.clearSelectedElements();
  }

  enableMeasurement(): void {
    this.logger.debug('Habilitando medición de distancias');
    if (this.map) {
      this.clearCurrentMeasurement();
      this.map.dragging.disable();
      const mapContainer = this.map.getContainer();
      L.DomUtil.addClass(mapContainer, 'cursor-crosshair');
      this.map.on('click', this.handleMeasureMapClick);
      mapContainer.addEventListener('mousemove', this.handleMouseMoveForEdgePanning);
      mapContainer.addEventListener('mouseleave', this.stopEdgePanningOnMouseLeave);
    }
  }

  private handleMeasureMapClick = (event: L.LeafletMouseEvent): void => {
    if (!this.map || this.currentToolActive !== 'measure') return;
    const currentLatLng = event.latlng;
    let segmentDistanceKm = 0;
    let totalDistanceKm = 0;
    this.measuringPoints.push(currentLatLng);
    if (this.measuringPoints.length >= 2) {
      const previousLatLng = this.measuringPoints[this.measuringPoints.length - 2];
      const distanceMeters = currentLatLng.distanceTo(previousLatLng);
      segmentDistanceKm = parseFloat((distanceMeters / 1000).toFixed(2));
    }
    if (this.measuringPoints.length >= 2) {
      totalDistanceKm = 0;
      for (let i = 1; i < this.measuringPoints.length; i++) {
        totalDistanceKm += this.measuringPoints[i].distanceTo(this.measuringPoints[i-1]);
      }
      totalDistanceKm = parseFloat((totalDistanceKm / 1000).toFixed(2));
    }
    const marker = L.circleMarker(currentLatLng, { 
      radius: 6,
      color: 'blue',
      fillColor: '#3388ff',
      fillOpacity: 0.7,
      weight: 1
    }).addTo(this.map);
    let tooltipContent = '';
    if (this.measuringPoints.length === 1) {
      tooltipContent = 'Punto inicial';
    } else {
      tooltipContent = `Segmento: ${segmentDistanceKm} km`;
      if (this.measuringPoints.length >= 2) {
        tooltipContent += `<br>Total: ${totalDistanceKm} km`;
      }
    }
    marker.bindTooltip(tooltipContent, { 
      permanent: true, 
      direction: 'top', 
      offset: [0, -7],
      className: 'measurement-tooltip'
    }).openTooltip();
    this.measurementMarkers.push(marker);
    if (this.measuringPoints.length >= 2) {
      if (this.measurementPolyline) {
        this.measurementPolyline.setLatLngs(this.measuringPoints);
      } else {
        this.measurementPolyline = L.polyline(this.measuringPoints, { color: 'blue' }).addTo(this.map);
      }
    }
    this.logger.debug(`Punto de medición añadido: ${currentLatLng}. Total puntos: ${this.measuringPoints.length}`);
  }

  clearCurrentMeasurement(): void {
    this.measuringPoints = [];
    if (this.measurementPolyline) {
      this.map?.removeLayer(this.measurementPolyline);
      this.measurementPolyline = null;
    }
    this.measurementMarkers.forEach(marker => this.map?.removeLayer(marker));
    this.measurementMarkers = [];
    this.logger.debug('Medición actual limpiada.');
  }

  private disableMeasurementTool(): void {
    if (this.map) {
      this.map.off('click', this.handleMeasureMapClick);
      const mapContainer = this.map.getContainer();
      mapContainer.removeEventListener('mousemove', this.handleMouseMoveForEdgePanning);
      mapContainer.removeEventListener('mouseleave', this.stopEdgePanningOnMouseLeave);
      this.stopEdgePanningLoop(); 
    }
    this.clearCurrentMeasurement();
    this.logger.debug('Herramienta de medición deshabilitada.');
  }

  enableConnectionCreation(): void {
    this.logger.debug('Habilitando creación de conexiones');
  }

  enableAreaSelection(): void {
    this.logger.debug('Habilitando selección por área');
    if (this.map) {
      this.disableAreaSelectionTool();
      this.map.dragging.disable(); 
      const mapContainer = this.map.getContainer();
      L.DomUtil.addClass(mapContainer, 'cursor-crosshair');
      mapContainer.addEventListener('mousedown', this.handleAreaSelectMouseDown);
      mapContainer.addEventListener('mousemove', this.handleMouseMoveForEdgePanning);
      mapContainer.addEventListener('mouseleave', this.stopEdgePanningOnMouseLeave);
    }
  }

  private disableAreaSelectionTool(): void {
    if (this.map) {
      const mapContainer = this.map.getContainer();
      mapContainer.removeEventListener('mousedown', this.handleAreaSelectMouseDown);
      mapContainer.removeEventListener('mousemove', this.handleAreaSelectMouseMove);
      document.removeEventListener('mouseup', this.handleAreaSelectMouseUp);
      if (this.areaSelectionRectangle) {
        this.map.removeLayer(this.areaSelectionRectangle);
        this.areaSelectionRectangle = null;
      }
      this.isDrawingAreaSelection = false;
      this.areaSelectionStartPoint = null;
      this.stopEdgePanningLoop(); 
    }
    this.logger.debug('Herramienta de selección por área deshabilitada.');
  }

  private handleAreaSelectMouseDown = (event: MouseEvent): void => {
    if (!this.map || this.currentToolActive !== 'areaSelect' || event.button !== 0) return; 
    event.preventDefault(); 
    this.isDrawingAreaSelection = true;
    this.areaSelectionStartPoint = this.map.mouseEventToLayerPoint(event);
    if (this.areaSelectionRectangle) {
      this.map.removeLayer(this.areaSelectionRectangle);
      this.areaSelectionRectangle = null;
    }
    const mapContainer = this.map.getContainer();
    mapContainer.addEventListener('mousemove', this.handleAreaSelectMouseMove);
    document.addEventListener('mouseup', this.handleAreaSelectMouseUp);
    this.logger.debug('Inicio de selección por área en:', this.areaSelectionStartPoint);
  }

  private handleAreaSelectMouseMove = (event: MouseEvent): void => {
    if (!this.map || !this.isDrawingAreaSelection || !this.areaSelectionStartPoint) return;
    const currentPoint = this.map.mouseEventToLayerPoint(event);
    const pixelBounds = L.bounds(this.areaSelectionStartPoint, currentPoint);
    const latLngBounds = L.latLngBounds(
      this.map.layerPointToLatLng(pixelBounds.min!),
      this.map.layerPointToLatLng(pixelBounds.max!)
    );
    if (this.areaSelectionRectangle) {
      this.areaSelectionRectangle.setBounds(latLngBounds);
    } else {
      this.areaSelectionRectangle = L.rectangle(latLngBounds, {
        color: '#3388ff',
        weight: 1,
        fillOpacity: 0.2,
      }).addTo(this.map);
    }
  }

  private handleAreaSelectMouseUp = (event: MouseEvent): void => {
    if (!this.map || !this.isDrawingAreaSelection || event.button !== 0) {
      if (this.isDrawingAreaSelection) {
         this.finishAreaSelection(null); 
      }
      return;
    }
    event.preventDefault();
    const endPoint = this.map.mouseEventToLayerPoint(event);
    this.finishAreaSelection(endPoint);
  }

  private finishAreaSelection(endPoint: L.Point | null): void {
    this.isDrawingAreaSelection = false;
    const mapContainer = this.map?.getContainer(); 
    mapContainer?.removeEventListener('mousemove', this.handleAreaSelectMouseMove);
    document.removeEventListener('mouseup', this.handleAreaSelectMouseUp);
    if (!this.map || !this.areaSelectionStartPoint || !this.areaSelectionRectangle || !endPoint) {
      if (this.areaSelectionRectangle) {
        this.map?.removeLayer(this.areaSelectionRectangle);
        this.areaSelectionRectangle = null;
      }
      this.areaSelectionStartPoint = null;
      this.logger.debug('Selección por área cancelada o incompleta.');
      return;
    }
    const selectionBoundsLatLng = this.areaSelectionRectangle.getBounds();
    this.logger.debug('Selección por área finalizada. Bounds:', selectionBoundsLatLng);
    const selectedElements = this.findElementsInBounds(selectionBoundsLatLng);
    this.logger.info(`Elementos seleccionados por área: ${selectedElements.length}`, selectedElements);
    this.mapStateManagerService.setSelectedElements(selectedElements);
    if (this.areaSelectionRectangle) {
      this.map.removeLayer(this.areaSelectionRectangle);
      this.areaSelectionRectangle = null;
    }
    this.areaSelectionStartPoint = null;
    if (selectedElements.length > 0) {
      this.mapStateManagerService.setTool('select');
    }
  }
  
  /**
   * Encuentra elementos dentro de los límites geográficos dados.
   * @param bounds Los límites L.LatLngBounds.
   * @returns Un array de NetworkElement que están dentro de los límites.
   */
  private findElementsInBounds(bounds: L.LatLngBounds): NetworkElement[] {
    if (!this.nodesData || this.nodesData.length === 0) {
      return [];
    }
    // Asumiendo que nodesData tiene elementos con 'position: { lat: number, lng: number }'
    // o 'x' (lng) y 'y' (lat) directamente si esa es tu estructura.
    // Para el ejemplo, usaré element.position.lat y element.position.lng
    
    return this.nodesData.filter(node => {
      // Asegurarse de que el nodo tenga una posición válida
      // La estructura de node es ExtendedD3Node que hereda de NetworkElement
      // y tiene x, y que son lng, lat respectivamente.
      if (typeof node.y === 'number' && typeof node.x === 'number') {
        const nodeLatLng = L.latLng(node.y, node.x);
        return bounds.contains(nodeLatLng);
      }
      return false;
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.destroyMap();
    // Desadjuntar listener para la tecla Escape
    document.removeEventListener('keydown', this.handleGlobalKeyDown);
    this.logger.debug('MapService destruido y desuscrito de observables, listener de teclado eliminado.');
  }

  /**
   * Habilita el modo de edición de elementos
   */
  enableElementEditing(): void {
    this.logger.debug('Habilitando edición de elementos');
  }

  /**
   * Carga una capa de respaldo en caso de error con la principal
   */
  private loadFallbackLayer(): void {
    try {
      if (!this.map) { this.logger.error('El mapa no está inicializado'); return; }
      this.logger.debug('Cargando capa fallback');
      L.tileLayer('https://a.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        errorTileUrl: 'assets/leaflet/error-tiles/error-tile.png',
        crossOrigin: true
      }).addTo(this.map);
    } catch (error) {
      this.logger.error('Error al cargar capa fallback:', error);
      // Último recurso: usar tiles offline
      this.loadOfflineTiles();
    }
  }
  
  /**
   * Carga tiles desde almacenamiento local
   */
  private loadOfflineTiles(): void {
    try {
      if (!this.map) { this.logger.error('El mapa no está inicializado'); return; }
      this.logger.debug('Intentando cargar tiles offline');
      L.tileLayer('assets/leaflet/offline-tiles/{z}/{x}/{y}.png', {
        errorTileUrl: 'assets/leaflet/error-tiles/error-tile.png',
        attribution: 'Tiles Offline',
        crossOrigin: true,
        minZoom: 10,
        maxZoom: 18
      }).addTo(this.map);
    } catch (error) {
      this.logger.error('No se pudieron cargar los tiles offline:', error);
      // Crear una capa de color plano como último recurso
      this.createPlainLayer();
    }
  }
  
  /**
   * Crea una capa de color plano como último recurso
   */
  private createPlainLayer(): void {
    if (!this.map) { this.logger.error('El mapa no está inicializado'); return; }
    this.logger.debug('Creando capa plana como último recurso');
    // Crear un canvas como capa base en caso extremo
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#f2f2f2';
      ctx.fillRect(0, 0, 256, 256);
      ctx.strokeStyle = '#ddd';
      ctx.strokeRect(0, 0, 256, 256);
      ctx.font = '10px Arial';
      ctx.fillStyle = '#888';
      ctx.fillText('Error de carga', 80, 128);
    }
    
    const dataUrl = canvas.toDataURL();
    L.tileLayer(dataUrl, { attribution: 'Fallback Layer' }).addTo(this.map);
  }
  
  /**
   * Carga tiles de respaldo cuando hay errores en la carga de tiles
   */
  private loadBackupTiles(): void {
    this.logger.debug('Cargando tiles de respaldo');
    // Lógica para intentar diferentes fuentes de tiles
  }

  /**
   * Manejador para el evento keydown global, para la tecla Escape.
   */
  private handleGlobalKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape' || event.keyCode === 27) {
      if (this.currentToolActive === 'measure' && this.measuringPoints.length > 0) {
        this.logger.debug('Tecla Escape presionada durante la medición. Limpiando medición...');
        this.clearCurrentMeasurement();
      } else if (this.currentToolActive === 'areaSelect' && this.isDrawingAreaSelection) {
        this.logger.debug('Tecla Escape presionada durante la selección por área. Cancelando...');
        this.finishAreaSelection(null); // Cancelar la selección en curso
      }
    }
  }

  // --- Métodos para Edge Panning ---
  private handleMouseMoveForEdgePanning = (event: MouseEvent): void => {
    if (!this.map || (this.currentToolActive !== 'measure' && this.currentToolActive !== 'areaSelect' && this.currentToolActive !== 'connect')) {
      this.stopEdgePanningLoop(); 
      return;
    }
    const mapContainer = this.map.getContainer();
    const rect = mapContainer.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    let panX = 0;
    let panY = 0;

    if (x < this.edgePanningZone) panX = -1; 
    else if (x > rect.width - this.edgePanningZone) panX = 1; 

    if (y < this.edgePanningZone) panY = -1; 
    else if (y > rect.height - this.edgePanningZone) panY = 1; 

    this.currentPanDirection = { x: panX, y: panY };

    if (panX !== 0 || panY !== 0) {
      if (!this.edgePanningAnimationFrameId) {
        this.startEdgePanningLoop();
      }
    } else {
      this.stopEdgePanningLoop();
    }
  }

  private startEdgePanningLoop(): void {
    if (this.edgePanningAnimationFrameId) return; 
    this.edgePanLoop(); 
  }

  private edgePanLoop = (): void => {
    if (!this.map || (this.currentPanDirection.x === 0 && this.currentPanDirection.y === 0)) {
      this.stopEdgePanningLoop();
      return;
    }
    this.map.panBy(
      [this.currentPanDirection.x * this.edgePanningSpeed, this.currentPanDirection.y * this.edgePanningSpeed],
      { animate: false }
    );
    this.edgePanningAnimationFrameId = requestAnimationFrame(this.edgePanLoop);
  }

  private stopEdgePanningLoop(): void {
    if (this.edgePanningAnimationFrameId) {
      cancelAnimationFrame(this.edgePanningAnimationFrameId);
      this.edgePanningAnimationFrameId = null;
    }
  }
  
  private stopEdgePanningOnMouseLeave = (): void => {
    this.logger.debug('Mouse ha salido del contenedor del mapa, deteniendo edge panning.');
    this.currentPanDirection = { x: 0, y: 0 }; 
    this.stopEdgePanningLoop();
  }
  // --- Fin de Métodos para Edge Panning ---

  /**
   * Refresca la visualización de los elementos y conexiones en el mapa.
   */
  refreshElementsDisplay(): void {
    if (!this.map || !this.isInitialized || !this.networkMapRendererService || !this.mapElementManagerService) {
      this.logger.warn('[MapService] No se puede refrescar elementos: Mapa o servicios no inicializados.');
      return;
    }

    const allElements = this.mapElementManagerService.getAllElements();
    this.logger.debug(`[MapService] refreshElementsDisplay: Obtenidos ${allElements.length} elementos.`);

    this.networkMapRendererService.renderElements(allElements, this.map.getBounds());

    const allConnections = this.mapElementManagerService.getAllConnections();
    // Log detallado de las conexiones obtenidas
    this.logger.info(`[MapService] refreshElementsDisplay: Obtenidas ${allConnections.length} conexiones para renderizar:`, JSON.stringify(allConnections.map(c => ({ id: c.id, source: c.sourceElementId, target: c.targetElementId }))));

    if (allConnections && allConnections.length > 0) {
      this.networkMapRendererService.renderConnections(allConnections); 
      this.logger.debug(`[MapService] Renderizado de conexiones solicitado para ${allConnections.length} conexiones.`);
    } else {
      this.logger.debug('[MapService] No hay conexiones para renderizar o no se pudieron obtener.');
      this.networkMapRendererService.renderConnections([]);
    }

    this.logger.info('[MapService] Visualización de elementos y conexiones refrescada.');
  }

  /**
   * Actualiza la posición visual de un elemento durante el arrastre
   * @param elementId ID del elemento a actualizar
   * @param lng Longitud (coordenada X)
   * @param lat Latitud (coordenada Y)
   */
  updateElementPreviewPosition(elementId: string, lng: number, lat: number): void {
    if (!this.map) return;
    
    // Buscar el marcador del elemento en el mapa
    const markerLayer = this.findElementMarker(elementId);
    if (markerLayer) {
      // Actualizar la posición del marcador
      markerLayer.setLatLng([lat, lng]);
    } else {
      this.logger.debug(`No se encontró el marcador para el elemento ${elementId}`);
    }
  }
  
  /**
   * Busca el marcador de un elemento en el mapa
   * @param elementId ID del elemento
   * @returns Marcador del elemento o null si no se encuentra
   */
  private findElementMarker(elementId: string): L.Marker | null {
    if (!this.map) return null;
    
    let foundMarker: L.Marker | null = null;
    
    // Recorrer todas las capas del mapa
    this.map.eachLayer((layer: L.Layer) => {
      // Verificar si la capa es un marcador y tiene el ID del elemento
      if (layer instanceof L.Marker && 
          layer.options.title === elementId || 
          (layer as any).elementId === elementId) {
        foundMarker = layer as L.Marker;
      }
    });
    
    return foundMarker;
  }
} 
