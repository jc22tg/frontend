import { Injectable } from '@angular/core';
import * as L from 'leaflet';
import { GeoSearchControl, OpenStreetMapProvider } from 'leaflet-geosearch';
import { Observable, Subject, fromEvent, of, BehaviorSubject, throwError } from 'rxjs';
import { map, tap, delay, catchError } from 'rxjs/operators';
import { GeographicPosition, createPosition } from '../../../shared/types/network.types';
import { MapDiagnosticService } from './map-diagnostic.service';
import { LoggerService } from '../../../core/services/logger.service';

export interface MapLayer {
  name: string;
  url: string;
  attribution: string;
  subdomains?: string[];
  maxZoom?: number;
  minZoom?: number;
}

/**
 * Interfaz para posiciones geográficas
 */
export interface MapPosition {
  lat: number;
  lng: number;
}

/**
 * Interfaz para la información del viewport
 */
export interface MapViewport {
  x: number;
  y: number;
  zoom: number;
  width: number;
  height: number;
}

/**
 * Interfaz para el servicio de posición en el mapa
 */
export interface IMapPositionService {
  /**
   * Centra el mapa en las coordenadas específicas
   */
  centerOnCoordinates(coordinates: { x: number, y: number }): void;
  
  /**
   * Obtiene las coordenadas del centro del mapa
   */
  getMapCenter(): { x: number, y: number };
  
  /**
   * Envía la posición seleccionada al editor
   */
  sendPositionToEditor(lat: number, lng: number): void;
  
  /**
   * Obtiene la posición seleccionada
   */
  getSelectedPosition(): Observable<MapPosition | null>;
  
  /**
   * Habilita la selección de posición
   */
  enablePositionSelection(): void;
  
  /**
   * Deshabilita la selección de posición
   */
  disablePositionSelection(): void;
  
  /**
   * Convierte coordenadas de píxeles a coordenadas geográficas
   */
  pixelToCoordinates(x: number, y: number): [number, number];
  
  /**
   * Convierte coordenadas geográficas a coordenadas de píxeles
   */
  coordinatesToPixel(lat: number, lng: number): { x: number, y: number };
}

@Injectable({
  providedIn: 'root'
})
export class MapPositionService implements IMapPositionService {
  private map: L.Map | null = null;
  private marker: L.Marker | null = null;
  private searchProvider = new OpenStreetMapProvider();
  private zoomChange$ = new Subject<number>();
  private clickSubject = new Subject<GeographicPosition>();
  private markerDragEndSubject = new Subject<GeographicPosition>();
  private mapInitialized = false;
  private mapElement: HTMLElement | null = null;
  private currentZoom = 1;
  
  // Coordenadas predeterminadas de Puerto Plata, República Dominicana
  private defaultLatitude = 19.7934;
  private defaultLongitude = -70.6884;
  private defaultZoom = 13;

  private readonly baseLayers: Record<string, MapLayer> = {
    OpenStreetMap: {
      name: 'OpenStreetMap',
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '© OpenStreetMap contributors'
    },
    Satellite: {
      name: 'Satélite',
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: 'Tiles &copy; Esri'
    },
    Hybrid: {
      name: 'Híbrido',
      url: 'https://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}',
      attribution: 'Google Maps',
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
    }
  };

  // Capa base activa actualmente
  private currentBaseLayer = 'OpenStreetMap';
  private currentBaseLayerObject: L.TileLayer | null = null;
  
  // Subjects para comunicación bidireccional con el editor
  private selectedPositionSubject = new BehaviorSubject<MapPosition | null>(null);
  private isPositionSelectionEnabled = false;
  
  // Referencias al mapa
  private mapSvg: any;
  private mainGroup: any;
  private width = 0;
  private height = 0;
  
  // Cola de solicitudes de cambio de capa base pendientes para cuando el mapa esté listo
  private pendingBaseLayerRequests: string[] = [];
  private mapInitAttempts = 0;
  private readonly MAX_INIT_ATTEMPTS = 5;
  
  // Última posición conocida del mapa
  private lastKnownPosition: any = null;
  
  // Observable para notificar cuando el mapa está listo
  private mapReady$ = new BehaviorSubject<boolean>(false);
  
  // Observable para notificar cambios en la capa base
  private layerChanged$ = new BehaviorSubject<string>('');
  
  // Valores predeterminados
  private readonly DEFAULT_ZOOM = 1;
  private readonly MIN_ZOOM = 0.2;
  private readonly MAX_ZOOM = 5;
  private readonly ZOOM_STEP = 0.2;
  
  // Estado actual del viewport
  private _viewport = new BehaviorSubject<MapViewport>({
    x: 0,
    y: 0,
    zoom: this.DEFAULT_ZOOM,
    width: window.innerWidth,
    height: window.innerHeight
  });
  
  constructor(private diagnosticService: MapDiagnosticService, private logger: LoggerService) {}

  /**
   * Inicializa la posición del mapa en el contenedor
   */
  initMapPosition(container: HTMLElement): Observable<boolean> {
    this.mapElement = container;
    this.logger.debug('Inicializando mapa en contenedor:', container);
    // Aquí iría la lógica real de inicialización del mapa
    // Por ahora devolvemos un Observable simulado
    return of(true).pipe(delay(300));
  }

  /**
   * Establece el nivel de zoom del mapa
   */
  setZoom(zoom: number): void {
    if (this.map) {
      this.map.setZoom(zoom);
    }
    
    // Actualizar también el viewport
    const current = this._viewport.getValue();
    this._viewport.next({
      ...current,
      zoom: Math.max(this.MIN_ZOOM, Math.min(zoom, this.MAX_ZOOM))
    });
    
    this.logger.debug(`Zoom establecido a: ${zoom}`);
  }

  /**
   * Centra el mapa en la posición por defecto
   */
  centerMap(): void {
    this.logger.debug('Centrando mapa');
    // Implementación real
    if (this.map) {
      this.map.setView([this.defaultLatitude, this.defaultLongitude], this.defaultZoom);
    }
    
    // También actualizar el viewport
    this.updatePosition(0, 0);
  }

  /**
   * Obtiene el elemento DOM del mapa
   */
  getMapElement(): HTMLElement | null {
    return this.mapElement;
  }

  /**
   * Obtiene el nivel de zoom actual
   */
  getCurrentZoom(): number {
    return this.map ? this.map.getZoom() : this._viewport.getValue().zoom;
  }

  /**
   * Pane a una posición específica
   */
  panTo(lat: number, lng: number): void {
    this.logger.debug(`Moviendo mapa a: lat=${lat}, lng=${lng}`);
    if (this.map) {
      this.map.panTo([lat, lng]);
    }
    
    // También actualizar el viewport
    this.updatePosition(lng, lat);
  }

  /**
   * Realiza un fitBounds para mostrar todos los elementos
   */
  fitBounds(bounds: any): void {
    this.logger.debug('Ajustando mapa a los límites', bounds);
    if (this.map) {
      this.map.fitBounds(bounds);
    }
  }

  /**
   * Inicializa el mapa Leaflet con la posición proporcionada
   */
  initializeMap(container: HTMLElement, initialPosition: GeographicPosition | null = null): void {
    this.logger.debug('Inicializando mapa Leaflet');
    
    if (!container) {
      this.logger.error('El contenedor del mapa no es válido');
      return;
    }
    
    // Si no se proporciona una posición inicial, usar las coordenadas predeterminadas
    if (!initialPosition) {
      initialPosition = createPosition(
        [this.defaultLongitude, this.defaultLatitude],
        { type: 'Point' }
      );
    }
    
    try {
      // Ejecutar diagnóstico previo a inicialización
      this.diagnosticService.verificarRecursosLeaflet().subscribe(recursosOk => {
        if (!recursosOk) {
          this.logger.warn('Algunos recursos de Leaflet no están disponibles, pero intentando inicializar de todos modos...');
        }
        
        // Continuar con inicialización
        this.inicializarMapaConDiagnostico(container, initialPosition!);
      });
    } catch (error) {
      this.logger.error('Error fatal al inicializar el mapa Leaflet:', error);
    }
  }
  
  /**
   * Método interno para inicializar el mapa con diagnóstico
   */
  private inicializarMapaConDiagnostico(container: HTMLElement, initialPosition: GeographicPosition): void {
    try {
      // Registrar intento de inicialización
      this.mapInitAttempts++;
      this.logger.debug(`Intento ${this.mapInitAttempts} de inicialización del mapa`);
      
      // Coordenadas de Puerto Plata, República Dominicana
      const puertoPlataLat = this.defaultLatitude;
      const puertoPlataLng = this.defaultLongitude;
      
      // Asegurarse de que las coordenadas son válidas, usando Puerto Plata como valor predeterminado
      const validLat = initialPosition?.coordinates?.[1] || puertoPlataLat;
      const validLng = initialPosition?.coordinates?.[0] || puertoPlataLng;
      
      // Crear un pequeño indicador visual para mostrar que el mapa se está inicializando
      const initIndicator = document.createElement('div');
      initIndicator.className = 'map-init-indicator';
      initIndicator.textContent = 'Inicializando mapa...';
      initIndicator.style.position = 'absolute';
      initIndicator.style.top = '50%';
      initIndicator.style.left = '50%';
      initIndicator.style.transform = 'translate(-50%, -50%)';
      initIndicator.style.padding = '10px 20px';
      initIndicator.style.background = 'rgba(0,0,0,0.7)';
      initIndicator.style.color = 'white';
      initIndicator.style.borderRadius = '4px';
      initIndicator.style.zIndex = '1000';
      container.appendChild(initIndicator);
      
      // Inicializar el mapa con opciones específicas para permitir arrastre y zoom
      this.map = L.map(container, {
        center: [validLat, validLng],
        zoom: 13,
        zoomDelta: 0.5,
        zoomSnap: 0.5,
        // Opciones críticas para permitir la interacción con el mouse
        dragging: true,
        scrollWheelZoom: true,
        doubleClickZoom: true,
        boxZoom: true,
        // Opciones de rendimiento
        preferCanvas: true,
        renderer: L.canvas()
      });
            
      // Configurar evento para cuando el mapa esté completamente listo
      this.map.whenReady(() => {
        this.logger.debug('Mapa completamente cargado y listo');
        
        try {
          // Eliminar el indicador visual
          if (initIndicator.parentNode) {
            initIndicator.parentNode.removeChild(initIndicator);
          }
          
          // Ahora que el mapa está inicializado, marcar como listo
          this.mapInitialized = true;
          
          // Añadir controles del mapa después de la inicialización
          this.addMapControls();
          
          // Configurar otros eventos del mapa
          this.setupMapEvents();
          
          // Notificar que el mapa está listo
          this.mapReady$.next(true);
          
          // Registrar diagnóstico
          this.diagnosticService.logMapInfo(this.map);
          
          // Procesar solicitudes pendientes de cambio de capa base
          setTimeout(() => {
            this.processPendingBaseLayerRequests();
          }, 500);
        } catch (error) {
          this.logger.error('Error en la inicialización del mapa:', error);
        }
      });
      
      // Si tenemos una capa base predefinida, establecerla inmediatamente
      this.setBaseLayer(this.currentBaseLayer || 'OpenStreetMap');
      
      // Añadir eventos para diagnosticar problemas de interacción
      this.map.on('dragstart', () => this.logger.debug('Evento dragstart detectado'));
      this.map.on('drag', () => this.logger.debug('Evento drag detectado'));
      this.map.on('dragend', () => this.logger.debug('Evento dragend detectado'));
      this.map.on('zoomstart', () => this.logger.debug('Evento zoomstart detectado'));
      this.map.on('zoom', () => this.logger.debug('Evento zoom detectado'));
      this.map.on('zoomend', () => this.logger.debug('Evento zoomend detectado'));
      
      // Log completo para diagnóstico
      this.logger.debug(`Mapa inicializado con centro en [${validLat}, ${validLng}], zoom: ${this.map.getZoom()}`);
      
    } catch (error) {
      this.mapInitialized = false;
      this.logger.error('Error al inicializar el mapa con diagnóstico:', error);
      throw error;
    }
  }

  /**
   * Configura los eventos del mapa
   */
  private setupMapEvents(): void {
    if (!this.map) {
      this.logger.warn('No se pueden configurar eventos: mapa no inicializado');
      return;
    }
    
    this.logger.debug('Configurando eventos del mapa');
    
    this.map.on('zoomend', () => {
      if (this.map) {
        this.logger.debug(`Zoom cambiado a: ${this.map.getZoom()}`);
        this.zoomChange$.next(this.map.getZoom());
      }
    });
    
    // Añadir eventos de clic para la selección de posición
    this.map.on('click', (event) => {
      if (this.isPositionSelectionEnabled && this.mapInitialized) {
        const latlng = event.latlng;
        this.logger.debug(`Clic en mapa: [${latlng.lat}, ${latlng.lng}]`);
        
        // Emitir posición seleccionada
        this.clickSubject.next(createPosition(
          [latlng.lng, latlng.lat],
          { type: 'Point' }
        ));
      }
    });
  }

  /**
   * Obtiene el observable de cambios de zoom
   */
  onZoomChange(): Observable<number> {
    return this.zoomChange$.asObservable();
  }

  /**
   * Añade controles al mapa
   */
  private addMapControls(): void {
    if (!this.map) {
      console.warn('No se pueden añadir controles: mapa no inicializado');
      return;
    }
    
    console.log('Añadiendo controles al mapa');
    
    // Control de zoom
    L.control.zoom({
      position: 'bottomright'
    }).addTo(this.map);

    // Control de escala
    L.control.scale({
      imperial: false,
      position: 'bottomleft'
    }).addTo(this.map);
  }

  /**
   * Añade un marcador al mapa
   */
  private addMarker(position: GeographicPosition): void {
    if (!this.map) {
      console.warn('No se puede añadir marcador: mapa no inicializado');
      return;
    }
    
    console.log(`Añadiendo marcador en [${position.coordinates[1]}, ${position.coordinates[0]}]`);
    
    try {
      const customIcon = L.icon({
        iconUrl: 'assets/icons/marker-icon.png',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
      });

      // Limpiar marcador existente si existe
      if (this.marker) {
        this.marker.remove();
      }

      // Crear nuevo marcador
      this.marker = L.marker([position.coordinates[1], position.coordinates[0]], {
        draggable: true,
        icon: customIcon
      });
      
      this.marker.addTo(this.map);
      
      // Añadir evento para cuando se arrastra el marcador
      this.marker.on('dragend', () => {
        const newPos = this.marker?.getLatLng();
        if (newPos) {
          console.log(`Marcador movido a: [${newPos.lat}, ${newPos.lng}]`);
          this.markerDragEndSubject.next(createPosition(
            [newPos.lng, newPos.lat],
            { type: 'Point' }
          ));
        }
      });
    } catch (error) {
      console.error('Error al añadir marcador:', error);
    }
  }

  /**
   * Añade control de búsqueda al mapa
   */
  private addSearchControl(): void {
    if (!this.map) {
      console.warn('No se puede añadir control de búsqueda: mapa no inicializado');
      return;
    }
    
    console.log('Añadiendo control de búsqueda');
    
    try {
      const searchControl = (GeoSearchControl as any)({
        provider: this.searchProvider,
        style: 'bar',
        showMarker: false,
        autoClose: true,
        retainZoomLevel: false,
        animateZoom: true,
        keepResult: true,
        searchLabel: 'Buscar ubicación'
      });

      this.map.addControl(searchControl);
    } catch (error) {
      console.error('Error al añadir control de búsqueda:', error);
    }
  }

  /**
   * Realiza una búsqueda de ubicación
   */
  async searchLocation(query: string): Promise<GeographicPosition | null> {
    try {
      const results = await this.searchProvider.search({ query });
      if (results.length > 0) {
        const result = results[0];
        const position = createPosition(
          [result.x, result.y],
          { type: 'Point' }
        );
        this.updateMarkerPosition(position);
        return position;
      }
      return null;
    } catch (error) {
      console.error('Error en la búsqueda:', error);
      return null;
    }
  }

  /**
   * Actualiza la posición del marcador
   */
  updateMarkerPosition(position: GeographicPosition): void {
    if (!this.map || !this.marker) return;
    
    const latLng = L.latLng(position.coordinates[1], position.coordinates[0]);
    this.marker.setLatLng(latLng);
    
    // Opcional: centrar el mapa en la nueva posición
    this.map.panTo(latLng);
  }

  /**
   * Obtiene la posición del marcador
   */
  getMarkerPosition(): GeographicPosition {
    if (!this.marker) {
      return createPosition([0, 0], { type: 'Point' });
    }
    
    const position = this.marker.getLatLng();
    return createPosition(
      [position.lng, position.lat],
      { type: 'Point' }
    );
  }

  /**
   * Establece una función de callback para el evento de clic en el mapa
   */
  onMapClick(callback: (position: GeographicPosition) => void): void {
    if (!this.map) return;
    
    this.map.on('click', (e: L.LeafletMouseEvent) => {
      const position = createPosition(
        [e.latlng.lng, e.latlng.lat],
        { type: 'Point' }
      );
      this.updateMarkerPosition(position);
      callback(position);
    });
  }

  /**
   * Establece una función de callback para el evento de arrastre de marcador
   */
  onMarkerDragEnd(callback: (position: GeographicPosition) => void): void {
    if (!this.marker) return;
    
    this.marker.on('dragend', () => {
      callback(this.getMarkerPosition());
    });
  }

  /**
   * Acerca el mapa (zoom in)
   */
  zoomIn(): void {
    if (this.map) {
      this.map.zoomIn();
    }
    
    // También actualizar el viewport
    const current = this._viewport.getValue();
    const newZoom = Math.min(current.zoom + this.ZOOM_STEP, this.MAX_ZOOM);
    this._viewport.next({
      ...current,
      zoom: newZoom
    });
    
    this.logger.debug(`Zoom in: ${newZoom}`);
  }

  /**
   * Aleja el mapa (zoom out)
   */
  zoomOut(): void {
    if (this.map) {
      this.map.zoomOut();
    }
    
    // También actualizar el viewport
    const current = this._viewport.getValue();
    const newZoom = Math.max(current.zoom - this.ZOOM_STEP, this.MIN_ZOOM);
    this._viewport.next({
      ...current,
      zoom: newZoom
    });
    
    this.logger.debug(`Zoom out: ${newZoom}`);
  }

  /**
   * Restablece la vista del mapa
   */
  resetView(position?: GeographicPosition): void {
    // Si no se proporciona una posición, usar las coordenadas predeterminadas
    const defaultPosition = createPosition(
      [this.defaultLongitude, this.defaultLatitude],
      { type: 'Point' }
    );
    
    // Usar la posición proporcionada o la predeterminada
    const finalPosition = position || defaultPosition;
    
    if (this.map) {
      this.map.setView([finalPosition.coordinates[1], finalPosition.coordinates[0]], this.defaultZoom);
      this.updateMarkerPosition(finalPosition);
    }
    
    // También actualizar el viewport
    this._viewport.next({
      x: 0,
      y: 0,
      zoom: this.DEFAULT_ZOOM,
      width: this._viewport.getValue().width,
      height: this._viewport.getValue().height
    });
    
    this.logger.debug(`Vista del mapa restablecida: [${finalPosition.coordinates[1]}, ${finalPosition.coordinates[0]}]`);
  }

  /**
   * Destruye el mapa
   */
  destroyMap(): void {
    if (this.map) {
      this.map.remove();
      this.zoomChange$.complete();
    }
  }

  /**
   * Comprueba si el mapa está inicializado
   */
  isMapInitialized(): boolean {
    return this.mapInitialized;
  }
  
  /**
   * Realiza un diagnóstico completo del mapa
   */
  diagnosticarMapa(): Observable<any> {
    return this.diagnosticService.diagnosticoCompleto().pipe(
      tap(resultado => {
        this.logger.debug('Resultado del diagnóstico:', resultado);
        // Actualizar diagnóstico con info del mapa actual
        this.diagnosticService.logMapInfo(this.map);
      })
    );
  }
  
  /**
   * Reinicializa el mapa para resolver problemas
   */
  reinicializarMapa(): Observable<boolean> {
    console.log('Intentando reinicializar el mapa...');
    
    if (!this.mapElement) {
      console.error('No se puede reinicializar el mapa: no hay elemento contenedor');
      return of(false);
    }
    
    try {
      // Guardar la posición actual antes de destruir el mapa
      let currentPosition: GeographicPosition;
      try {
        currentPosition = this.getMarkerPosition();
      } catch (error) {
        // Si hay un error al obtener la posición actual, usar la predeterminada
        currentPosition = createPosition(
          [this.defaultLongitude, this.defaultLatitude],
          { type: 'Point' }
        );
      }
      
      const currentZoom = this.map?.getZoom() || this.defaultZoom;
      
      // Destruir el mapa actual
      this.destroyMap();
      
      // Limpiar el contenedor
      if (this.mapElement) {
        this.mapElement.innerHTML = '';
      }
      
      // Recrear el mapa con un pequeño retraso
      return of(true).pipe(
        delay(500),
        tap(() => {
          if (this.mapElement) {
            // Recrear con la posición guardada
            this.initializeMap(this.mapElement, currentPosition);
            
            // Restaurar el zoom
            setTimeout(() => {
              if (this.map) {
                this.map.setZoom(currentZoom);
                console.log(`Mapa reinicializado en: [${currentPosition.coordinates[1]}, ${currentPosition.coordinates[0]}], zoom: ${currentZoom}`);
              }
            }, 300);
          }
        }),
        catchError(error => {
          console.error('Error al reinicializar el mapa:', error);
          return of(false);
        })
      );
    } catch (error) {
      console.error('Error fatal al reiniciar el mapa:', error);
      return of(false);
    }
  }

  /**
   * Actualiza el tamaño del mapa cuando cambia el tamaño del contenedor
   */
  invalidateSize(forceUpdate = false): void {
    if (!this.map) {
      console.warn('No se puede invalidar el tamaño: mapa no inicializado');
      return;
    }
    
    console.log('Actualizando tamaño del mapa');
    try {
      // Usar el método invalidateSize nativo de Leaflet
      this.map.invalidateSize(forceUpdate);
      console.log('Tamaño del mapa actualizado correctamente');
    } catch (error) {
      console.error('Error al actualizar el tamaño del mapa:', error);
    }
  }

  /**
   * Configura las referencias al mapa D3
   */
  setMapReferences(svg: any, mainGroup: any, width: number, height: number): void {
    this.mapSvg = svg;
    this.mainGroup = mainGroup;
    this.width = width;
    this.height = height;
    this.logger.debug('Referencias del mapa configuradas en MapPositionService');
  }
  
  /**
   * Centra el mapa en las coordenadas específicas
   */
  centerOnCoordinates(coordinates: { x: number, y: number }): void {
    if (!this.mapSvg || !this.mainGroup) {
      this.logger.error('No se puede centrar el mapa: referencias no inicializadas');
      return;
    }
    
    const transform = this.getTransform();
    const x = -coordinates.x * transform.k + this.width / 2;
    const y = -coordinates.y * transform.k + this.height / 2;
    
    this.mainGroup.transition().duration(750)
      .attr('transform', `translate(${x},${y}) scale(${transform.k})`);
  }
  
  /**
   * Obtiene las coordenadas del centro del mapa
   */
  getMapCenter(): { x: number, y: number } {
    if (!this.mapSvg || !this.mainGroup) {
      this.logger.warn('No se puede obtener el centro del mapa: referencias no inicializadas');
      return { x: this.width / 2, y: this.height / 2 };
    }
    
    const transform = this.getTransform();
    const x = -transform.x / transform.k + this.width / (2 * transform.k);
    const y = -transform.y / transform.k + this.height / (2 * transform.k);
    
    return { x, y };
  }
  
  /**
   * Envía la posición seleccionada al editor
   */
  sendPositionToEditor(lat: number, lng: number): void {
    this.selectedPositionSubject.next({ lat, lng });
  }
  
  /**
   * Obtiene la posición seleccionada
   */
  getSelectedPosition(): Observable<MapPosition | null> {
    return this.selectedPositionSubject.asObservable();
  }
  
  /**
   * Habilita la selección de posición en el mapa
   */
  enablePositionSelection(): void {
    if (!this.mapSvg) {
      this.logger.error('No se puede habilitar la selección de posición: referencias no inicializadas');
      return;
    }
    
    this.isPositionSelectionEnabled = true;
    this.mapSvg.style('cursor', 'crosshair');
    
    // Añadir evento de clic para seleccionar posición
    this.mapSvg.on('click.positionSelector', (event: any) => {
      if (!this.isPositionSelectionEnabled) return;
      
      const point = this.getEventCoordinates(event);
      const [lng, lat] = this.pixelToCoordinates(point.x, point.y);
      
      this.logger.debug(`Posición seleccionada: [${lat}, ${lng}]`);
      this.sendPositionToEditor(lat, lng);
      
      // Mostrar marcador temporal en el mapa
      this.showTemporaryMarker(point.x, point.y);
    });
  }
  
  /**
   * Deshabilita la selección de posición
   */
  disablePositionSelection(): void {
    if (!this.mapSvg) return;
    
    this.isPositionSelectionEnabled = false;
    this.mapSvg.style('cursor', null);
    this.mapSvg.on('click.positionSelector', null);
    
    // Limpiar cualquier marcador temporal
    if (this.mapSvg) {
      this.mapSvg.select('.temp-position-marker').remove();
    }
  }
  
  /**
   * Convierte coordenadas de píxeles a coordenadas geográficas
   */
  pixelToCoordinates(x: number, y: number): [number, number] {
    // Implementación existente
    return [0, 0];
  }
  
  /**
   * Convierte coordenadas geográficas a coordenadas de píxeles
   */
  coordinatesToPixel(lat: number, lng: number): { x: number, y: number } {
    // Implementación existente
    return { x: 0, y: 0 };
  }
  
  /**
   * Obtiene las coordenadas del evento del ratón
   */
  private getEventCoordinates(event: any): { x: number, y: number } {
    // Implementación existente
    return { x: 0, y: 0 };
  }
  
  /**
   * Obtiene la transformación actual del mapa
   */
  private getTransform(): { k: number, x: number, y: number } {
    // Implementación existente
    return { k: 1, x: 0, y: 0 };
  }
  
  /**
   * Muestra un marcador temporal en la posición seleccionada
   */
  private showTemporaryMarker(x: number, y: number): void {
    // Implementación existente
  }

  /**
   * Establece la capa base del mapa
   */
  setBaseLayer(layerKey: string): boolean {
    // Implementación existente
    return false;
  }
  
  /**
   * Verifica si un archivo existe
   */
  private fileExists(url: string): boolean {
    // Implementación existente
    return false;
  }
  
  /**
   * Muestra una notificación de error de carga de tiles
   */
  private showTileErrorNotification(): void {
    // Implementación existente
  }
  
  /**
   * Oculta la notificación de error de tiles
   */
  private hideTileErrorNotification(): void {
    // Implementación existente
  }
  
  /**
   * Muestra un indicador de carga
   */
  private showLoadingIndicator(): void {
    // Implementación existente
  }
  
  /**
   * Oculta el indicador de carga
   */
  private hideLoadingIndicator(): void {
    // Implementación existente
  }

  /**
   * Obtiene las capas base disponibles
   */
  getAvailableBaseLayers(): Record<string, MapLayer> {
    return {...this.baseLayers};
  }

  /**
   * Obtiene la capa base actual
   */
  getCurrentBaseLayer(): string {
    return this.currentBaseLayer;
  }

  /**
   * Procesa las solicitudes pendientes de cambio de capa base
   */
  private processPendingBaseLayerRequests(): void {
    // Implementación existente
  }
  
  /**
   * Muestra un mensaje de error crítico
   */
  private mostrarErrorCritico(mensaje: string): void {
    // Implementación existente
  }

  /**
   * Reinicia completamente el estado del mapa
   */
  resetMapState(): void {
    // Implementación existente
  }
  
  /**
   * Limpia cualquier elemento visual de Leaflet
   */
  private clearLeafletVisuals(): void {
    // Implementación existente
  }

  /**
   * Elimina las notificaciones de error del DOM
   */
  private hideErrorNotifications(): void {
    // Implementación existente
  }

  /**
   * Obtiene la última posición conocida del mapa
   */
  getLastPosition(): any {
    // Implementación existente
    return null;
  }

  /**
   * Obtiene la referencia directa al mapa de Leaflet
   */
  getMap(): any {
    return this.map;
  }

  /**
   * Verifica el estado del mapa
   */
  verificarEstadoMapa(): Observable<boolean> {
    // Implementación existente
    return of(false);
  }

  /**
   * Obtiene el observable de cambios en el viewport
   */
  getViewportChanges$(): Observable<MapViewport> {
    return this._viewport.asObservable();
  }
  
  /**
   * Actualiza la posición del mapa
   */
  updatePosition(x: number, y: number): void {
    const current = this._viewport.getValue();
    this._viewport.next({
      ...current,
      x,
      y
    });
    
    this.logger.debug(`Posición del mapa actualizada: x=${x}, y=${y}`);
  }
  
  /**
   * Actualiza las dimensiones del viewport
   */
  updateViewportSize(width: number, height: number): void {
    const current = this._viewport.getValue();
    this._viewport.next({
      ...current,
      width,
      height
    });
  }
  
  /**
   * Centra el mapa en coordenadas específicas
   */
  centerAt(x: number, y: number): void {
    const current = this._viewport.getValue();
    this._viewport.next({
      ...current,
      x,
      y
    });
    
    this.logger.debug(`Mapa centrado en: x=${x}, y=${y}`);
  }
  
  /**
   * Centra el mapa en un elemento
   */
  centerOnElement(elementPosition: number[]): void {
    if (!elementPosition || elementPosition.length < 2) {
      this.logger.warn('No se puede centrar: posición de elemento inválida');
      return;
    }
    
    this.centerAt(elementPosition[0], elementPosition[1]);
  }
  
  /**
   * Obtiene información del estado actual del viewport
   */
  getCurrentViewport(): MapViewport {
    return this._viewport.getValue();
  }
} 