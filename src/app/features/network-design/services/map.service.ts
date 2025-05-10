import { Injectable, NgZone, Inject, Optional } from '@angular/core';
import * as d3 from 'd3';
import { LoggerService } from '../../../core/services/logger.service';
import * as L from 'leaflet';
import { Observable, of, Subject, BehaviorSubject } from 'rxjs';
import { MapConfig } from '../types/network.types';
import { NetworkElement, NetworkConnection, GeographicPosition } from '../../../shared/types/network.types';
import { IMapService } from '../interfaces/map.interface';
import { NetworkEventBusService, NetworkEventType, NetworkEvent, ElementSelectedEvent, ToolChangedEvent, DarkModeToggledEvent } from './network-event-bus.service';
import { NETWORK_STATE_SERVICE_TOKEN, INetworkStateService } from './event-tokens';

// Exportar interfaz para posición en mapa
export interface MapPosition {
  lat: number;
  lng: number;
  coordinates?: [number, number];
}

// Extender la interfaz D3Node para permitir propiedades adicionales
interface ExtendedD3Node extends d3.SimulationNodeDatum {
  id: string;
  x?: number;
  y?: number;
  group?: number;
  weight?: number;
  elementType?: string;
  status?: string;
  isDragging?: boolean;
  isFixed?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class MapService implements IMapService {
  private svg: d3.Selection<SVGSVGElement, unknown, null, undefined> | null = null;
  private container: HTMLElement | null = null;
  private zoom: d3.ZoomBehavior<SVGSVGElement, unknown> | null = null;
  private simulation: d3.Simulation<ExtendedD3Node, undefined> | null = null;
  private width = 0;
  private height = 0;
  private currentZoom = 1;
  private nodesGroup!: d3.Selection<SVGGElement, unknown, null, undefined>;
  private linksGroup!: d3.Selection<SVGGElement, unknown, null, undefined>;
  private mainGroup!: d3.Selection<SVGGElement, unknown, null, undefined>;
  private selectedElement: NetworkElement | null = null;
  private currentTool = 'pan';
  private isDarkMode = false;
  private config: any = null;
  private isMapReady$ = new BehaviorSubject<boolean>(false);
  private map: L.Map | null = null;
  
  // Propiedades para selección de posición
  private isPositionSelectionEnabled = false;
  private positionMarker: L.Marker | null = null;
  private previewMarker: L.Marker | null = null;
  private selectedPosition: MapPosition | null = null;
  private selectedPositionSubject = new Subject<MapPosition | null>();
  
  // Almacenar los datos procesados para acceso externo
  private nodesData: ExtendedD3Node[] = [];
  private linksData: any[] = [];
  
  // Observables para estado del mapa
  private isDarkMode$ = new BehaviorSubject<boolean>(false);
  private currentLayer$ = new BehaviorSubject<string>('osm');
  
  constructor(
    private zone: NgZone,
    private logger: LoggerService,
    private eventBus: NetworkEventBusService,
    @Optional() @Inject(NETWORK_STATE_SERVICE_TOKEN) private networkStateService: INetworkStateService
  ) {
    // Suscribirse a eventos relevantes del bus
    this.initializeEvents();
  }
  
  /**
   * Suscribirse a eventos del bus de eventos de la red
   */
  private initializeEvents(): void {
    // Suscribirse a eventos relevantes para el mapa
    this.eventBus.ofType<DarkModeToggledEvent>(NetworkEventType.DARK_MODE_TOGGLED).subscribe(event => {
      this.toggleDarkMode(event.payload?.enabled as boolean);
    });

    this.eventBus.ofType<ToolChangedEvent>(NetworkEventType.TOOL_CHANGED).subscribe(event => {
      this.handleToolChange(event.payload?.tool as string);
    });

    this.eventBus.ofType<ElementSelectedEvent>(NetworkEventType.ELEMENT_SELECTED).subscribe(event => {
      const element = event.payload?.element;
      if (element) this.selectElement(element);
    });

    this.eventBus.ofType<NetworkEvent>(NetworkEventType.MAP_RESET).subscribe(() => {
      this.resetMap();
    });
  }
  
  /**
   * Inicializa el mapa con la configuración proporcionada
   * @param config Configuración del mapa
   */
  initialize(config: any): void {
    this.config = config;
    this.container = config.container;
    
    if (!this.container) {
      this.logger.error('No se proporcionó un contenedor para el mapa');
      return;
    }
    
    try {
      // Inicializar el mapa de Leaflet
      this.map = L.map(this.container, {
        center: [0, 0],
        zoom: config.initialZoom || 13,
        zoomControl: false,
        preferCanvas: true
      });
      
      // Configurar capa base por defecto
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(this.map);
      
      // Configurar modo oscuro si es necesario
      if (config.isDarkMode) {
        this.setDarkMode(true);
      }
      
      // Configurar eventos
      this.setupMapEvents(config);
      
      // Notificar que el mapa está listo
      this.isMapReady$.next(true);
      this.eventBus.emit({
        type: NetworkEventType.MAP_READY,
        payload: { map: this.map }
      });
      this.logger.debug('Mapa inicializado correctamente');
    } catch (error) {
      this.logger.error('Error al inicializar el mapa:', error);
      this.isMapReady$.next(false);
      this.eventBus.emit({
        type: NetworkEventType.MAP_ERROR,
        payload: { error }
      });
    }
  }
  
  /**
   * Configurar eventos del mapa
   */
  private setupMapEvents(config: any): void {
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
    this.isMapReady$.next(false);
  }
  
  /**
   * Verifica si el mapa está listo para usarse
   * @returns Observable que emite el estado de preparación
   */
  isMapReady(): Observable<boolean> {
    return this.isMapReady$.asObservable();
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
    this.isDarkMode = isDark;
    this.isDarkMode$.next(isDark);
    
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
    this.currentLayer$.next(layerId);
    
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
      
      // Añadir nueva capa base
      switch (layerId) {
        case 'dark':
          L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            subdomains: 'abcd',
            maxZoom: 19
          }).addTo(this.map);
          break;
        case 'satellite':
          L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
            maxZoom: 19
          }).addTo(this.map);
          break;
        case 'osm':
        default:
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19
          }).addTo(this.map);
          break;
      }
    } catch (error) {
      this.logger.error('Error al cambiar la capa base:', error);
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
    this.currentTool = tool;
    
    switch (tool) {
      case 'pan':
        this.enablePanMode();
        break;
      case 'select':
        this.enableSelectMode();
        break;
      case 'measure':
        // Implementación para modo de medición
        break;
      case 'area_select':
        this.enableAreaSelectMode(true);
        break;
      default:
        this.enablePanMode();
    }
    
    // Notificar el cambio de herramienta
    this.eventBus.emit({
      type: NetworkEventType.TOOL_CHANGED,
      payload: { tool: this.currentTool }
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
    } else if (this.zoom && this.svg) {
      // Si estamos usando D3, aumentar el zoom
      const currentTransform = d3.zoomTransform(this.svg.node()!);
      const newScale = currentTransform.k * 1.2;
      
      this.zoom.scaleBy(this.svg, 1.2);
      this.currentZoom = newScale;
    }
  }
  
  /**
   * Disminuye el zoom del mapa
   */
  zoomOut(): void {
    if (this.map) {
      this.map.zoomOut();
    } else if (this.zoom && this.svg) {
      // Si estamos usando D3, disminuir el zoom
      const currentTransform = d3.zoomTransform(this.svg.node()!);
      const newScale = currentTransform.k / 1.2;
      
      this.zoom.scaleBy(this.svg, 1/1.2);
      this.currentZoom = newScale;
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
    } else if (this.svg && this.zoom) {
      // Si estamos usando D3, implementar el fit to screen
      this.fitContentToScreen();
    }
  }
  
  /**
   * Establece el nivel de zoom
   */
  setZoom(level: number, animate = false): void {
    if (this.map) {
      // Convertir porcentaje a nivel de zoom Leaflet (asumiendo que el nivel viene como porcentaje)
      const leafletZoom = Math.round((level / 100) * 19);
      
      // Cambiar zoom con o sin animación
      this.map.setZoom(leafletZoom, { animate });
    } else if (this.svg && this.zoom) {
      // Si estamos usando D3, implementar el zoom
      const scale = this.convertPercentToScale(level);
      this.zoom.scaleTo(this.svg, scale);
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
    if (this.map && this.config && this.config.initialCenter) {
      this.map.setView(this.config.initialCenter, this.convertZoomPercentToLevel(this.config.initialZoom || 100));
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
    // Esta función sería un punto de integración con el renderer
    // Típicamente, no modificaríamos directamente las capas aquí, sino
    // que notificaríamos al NetworkMapRendererService para actualizar la visualización
    
    this.logger.debug(`Actualización de elementos solicitada: ${elements.length} elementos, ${connections.length} conexiones`);
    
    // Actualizar datos internos
    this.nodesData = elements.map(element => ({
      id: element.id,
      x: element.position?.lng,
      y: element.position?.lat,
      elementType: element.type
    }));
    
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
  initializeMap(config: MapConfig): Promise<void> { return Promise.resolve(); }
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
  
  /**
   * Maneja un elemento seleccionado a través del bus de eventos
   */
  private handleElementSelectedViaEvent(element: NetworkElement | null): void {
    this.selectedElement = element;
    
    // Implementar lógica específica para destacar el elemento en el mapa
    if (element && this.map) {
      // Centrar en el elemento seleccionado
      if (element.position) {
        this.panTo(element.position);
      }
    }
  }
  
  /**
   * Resetea el mapa a su estado inicial
   */
  private resetMap(): void {
    if (this.map) {
      // Resetear zoom y posición
      this.map.setView([0, 0], this.config?.initialZoom || 13);
      
      // Limpiar marcadores y selecciones
      this.clearMarkers();
      this.selectedElement = null;
    }
  }
  
  /**
   * Limpia todos los marcadores del mapa
   */
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

  /**
   * Maneja el cambio de la herramienta actual
   * @param tool Nombre de la herramienta
   */
  private handleToolChange(tool: string): void {
    this.currentTool = tool;
    
    // Habilitar/deshabilitar modos según la herramienta seleccionada
    switch (tool) {
      case 'pan':
        this.enablePanMode();
        break;
      case 'select':
        this.enableSelectMode();
        break;
      case 'area_select':
        this.enableAreaSelectMode(true);
        break;
      case 'measure':
        // Implementación para herramienta de medición
        break;
      default:
        // Por defecto, volver al modo pan
        this.enablePanMode();
        break;
    }
    
    this.logger.debug(`Herramienta cambiada a: ${tool}`);
  }

  /**
   * Activa o desactiva el modo oscuro del mapa
   * @param isDark Indica si se debe activar el modo oscuro
   */
  private toggleDarkMode(isDark: boolean): void {
    // Actualizar estado interno
    this.isDarkMode = isDark;
    this.isDarkMode$.next(isDark);
    
    // Cambiar la capa del mapa según el modo
    this.updateBaseLayer(isDark ? 'dark' : 'osm');
    
    // Emitir evento interno para actualizar elementos visuales si es necesario
    this.logger.debug(`Modo oscuro ${isDark ? 'activado' : 'desactivado'}`);
  }
} 