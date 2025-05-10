import { Injectable, NgZone } from '@angular/core';
import { ElementType, NetworkElement, NetworkConnection, ElementStatus } from '../../../shared/types/network.types';
import { LoggerService } from '../../../core/services/logger.service';
import { Observable, of, BehaviorSubject, Subject } from 'rxjs';
import { VirtualizationService } from './virtualization.service';
import * as L from 'leaflet';
import 'leaflet.markercluster';

// Aumentamos tipos de Leaflet para incluir nuestras propiedades extendidas
declare module 'leaflet' {
  interface Marker<P = any> {
    element?: NetworkElement;
  }
  
  interface Polyline {
    connection?: NetworkConnection;
  }
}

/**
 * Interfaz para las opciones de renderizado
 */
export interface RenderOptions {
  darkMode?: boolean;
  useWebGL?: boolean;
  clusteringEnabled?: boolean;
  progressiveLoading?: boolean;
  showConnections?: boolean;
}

/**
 * Servicio para gestionar el renderizado eficiente del mapa de red
 * Extrae la lógica de renderizado del componente principal
 */
@Injectable({
  providedIn: 'root'
})
export class NetworkMapRendererService {
  // Caché de marcadores y líneas para evitar recreación
  private elementMarkers = new Map<string, L.Marker>();
  private connectionLines = new Map<string, L.Polyline>();
  
  // Mapa y capas
  private map: L.Map | null = null;
  private elementsLayer: L.LayerGroup = L.layerGroup();
  private connectionsLayer: L.LayerGroup = L.layerGroup();
  private clustersLayer: L.MarkerClusterGroup | null = null;
  
  // Opciones de renderizado
  private options: RenderOptions = {
    darkMode: false,
    useWebGL: true,
    clusteringEnabled: true,
    progressiveLoading: true,
    showConnections: true
  };
  
  // Métricas de rendimiento
  private _fps = 0;
  private _renderedElements = 0;
  private _visibleElements = 0;
  private lastFrameTime = 0;
  private frameCount = 0;
  
  // Capa de agrupamiento para mejorar rendimiento
  private clusterGroup: L.MarkerClusterGroup | null = null;
  
  // Configuración de rendimiento (ahora pública)
  public performanceConfig = {
    enableClustering: true,
    clusterRadius: 80,
    maxClusterRadius: 80,
    animationDuration: 300,
    disableClusteringAtZoom: 18,
    maxZoom: 19,
    useWebGL: true,
    progressiveLoading: true,
    useDisplayBuffers: true,
    showCoverageOnHover: false
  };
  
  // Observables para comunicación entre componentes
  private elementsCountSubject = new BehaviorSubject<number>(0);
  public elementsCountChange$ = this.elementsCountSubject.asObservable();
  
  private renderCompleteSubject = new Subject<void>();
  public renderComplete$ = this.renderCompleteSubject.asObservable();
  
  // Añadir opciones de emergencia para rendimiento extremo
  private emergencyMode = false;
  
  // Control de carga progresiva
  private renderQueue: NetworkElement[] = [];
  private renderTimer: any = null;
  private maxElementsPerFrame = 10; // Procesar máximo 10 elementos por cuadro de animación
  
  constructor(
    private zone: NgZone,
    private logger: LoggerService,
    private virtualizationService: VirtualizationService
  ) {
    // Iniciar medición de FPS
    this.startFPSMeasurement();
  }
  
  /**
   * Inicializa el renderizador con un mapa Leaflet
   */
  initialize(map: L.Map, options?: Partial<RenderOptions>): void {
    this.map = map;
    
    // Aplicar opciones
    if (options) {
      this.options = { ...this.options, ...options };
    }
    
    // Inicializar capas
    this.elementsLayer.addTo(map);
    this.connectionsLayer.addTo(map);
    
    // Inicializar clustering si está habilitado
    if (this.options.clusteringEnabled) {
      this.initClustering();
    }
    
    // Comenzar a medir FPS
    this.startFPSMeasurement();
    
    this.logger.debug('NetworkMapRenderer inicializado');
  }
  
  /**
   * Inicializa clustering para elementos
   */
  private initClustering(): void {
    try {
      // Se asume que MarkerClusterGroup se ha cargado como extensión
      if (L.markerClusterGroup) {
        this.clustersLayer = L.markerClusterGroup({
          maxClusterRadius: 50,
          spiderfyOnMaxZoom: true,
          showCoverageOnHover: false,
          zoomToBoundsOnClick: true
        });
        
        if (this.map && this.clustersLayer) {
          this.map.addLayer(this.clustersLayer);
        }
      } else {
        this.logger.error('Error: MarkerClusterGroup no está disponible');
        this.options.clusteringEnabled = false;
      }
    } catch (err) {
      this.logger.error('Error al inicializar clustering:', err);
      this.options.clusteringEnabled = false;
    }
  }
  
  /**
   * Renderiza los elementos de red de forma optimizada
   * 
   * @param elements Lista de elementos a renderizar
   * @param visibleBounds Límites visibles del mapa
   */
  renderElements(
    elements: NetworkElement[],
    visibleBounds: L.LatLngBounds | null = null
  ): void {
    if (!this.map) return;
    
    // Si está en modo emergencia, limitar número máximo de elementos
    if (this.emergencyMode) {
      elements = this.limitElementsForEmergencyMode(elements);
    }
    
    // Si no hay límites visibles, usar los del mapa
    if (!visibleBounds && this.map) {
      visibleBounds = this.map.getBounds();
    }
    
    // Ejecutar fuera de la zona de Angular para mejor rendimiento
    this.zone.runOutsideAngular(() => {
      // Cancelar renderizado previo en progreso
      this.cancelPendingRenders();
      
      // Limpiar marcadores que ya no existen
      this.cleanupInvisibleMarkers(elements);
      
      // Dividir elementos en visibles e invisibles
      const { visibleElements, offscreenElements } = this.splitElementsByVisibility(elements, visibleBounds);
      
      // Actualizar contador de elementos visibles
      this._visibleElements = visibleElements.length;
      
      // Encolar para renderizado progresivo
      this.renderQueue = [...visibleElements];
      
      // Iniciar renderizado progresivo controlado por frames
      this.processRenderQueue();
      
      // Programar renderizado de elementos restantes con retraso
      if (offscreenElements.length > 0) {
        setTimeout(() => {
          // Solo si no estamos en modo emergencia
          if (!this.emergencyMode) {
            // Añadir al final de la cola
            this.renderQueue = [...this.renderQueue, ...offscreenElements];
          }
        }, 2000);
      }
    });
  }
  
  /**
   * Limita elementos en función del modo de emergencia
   */
  private limitElementsForEmergencyMode(elements: NetworkElement[]): NetworkElement[] {
    const MAX_EMERGENCY_ELEMENTS = 50;
    
    if (elements.length <= MAX_EMERGENCY_ELEMENTS) {
      return elements;
    }
    
    // Priorizar elementos importantes (OLT, FDP, etc.)
    const priorityElements = elements.filter(e => 
      e.type === ElementType.OLT || 
      e.type === ElementType.FDP ||
      e.type === ElementType.SPLITTER
    ).slice(0, MAX_EMERGENCY_ELEMENTS);
    
    // Si no hay suficientes prioritarios, añadir otros hasta el límite
    if (priorityElements.length < MAX_EMERGENCY_ELEMENTS) {
      const otherElements = elements
        .filter(e => 
          e.type !== ElementType.OLT && 
          e.type !== ElementType.FDP && 
          e.type !== ElementType.SPLITTER
        )
        .slice(0, MAX_EMERGENCY_ELEMENTS - priorityElements.length);
      
      return [...priorityElements, ...otherElements];
    }
    
    return priorityElements;
  }
  
  /**
   * Divide los elementos en visibles y fuera de pantalla
   */
  private splitElementsByVisibility(
    elements: NetworkElement[],
    visibleBounds: L.LatLngBounds | null
  ): { visibleElements: NetworkElement[], offscreenElements: NetworkElement[] } {
    if (!visibleBounds) {
      // Si no hay bounds, considerar todo visible
      return {
        visibleElements: elements.slice(0, 100), // Límite de seguridad
        offscreenElements: elements.slice(100)
      };
    }
    
    const visibleElements: NetworkElement[] = [];
    const offscreenElements: NetworkElement[] = [];
    
    // Límites de seguridad
    const MAX_VISIBLE = 100;
    
    // Clasificar elementos
    for (const element of elements) {
      if (!element.position) {
        offscreenElements.push(element);
        continue;
      }
      
      // Verificar si está en pantalla
      const latLng = new L.LatLng(element.position.lat, element.position.lng);
      if (visibleBounds.contains(latLng) && visibleElements.length < MAX_VISIBLE) {
        visibleElements.push(element);
      } else {
        offscreenElements.push(element);
      }
    }
    
    return { visibleElements, offscreenElements };
  }
  
  /**
   * Cancela renderizados pendientes
   */
  private cancelPendingRenders(): void {
    if (this.renderTimer) {
      cancelAnimationFrame(this.renderTimer);
      this.renderTimer = null;
    }
    
    // Limpiar cola
    this.renderQueue = [];
  }
  
  /**
   * Procesa la cola de renderizado de forma eficiente usando requestAnimationFrame
   */
  private processRenderQueue(): void {
    if (this.renderQueue.length === 0) {
      this._renderedElements = this.elementMarkers.size;
      this.renderCompleteSubject.next();
      return;
    }
    
    // Procesar solo un número limitado por frame
    const batch = this.renderQueue.splice(0, this.maxElementsPerFrame);
    
    // Procesar este lote
    batch.forEach(element => {
      this.createOrUpdateMarker(element);
    });
    
    // Actualizar contador
    this._renderedElements = this.elementMarkers.size;
    
    // Programar siguiente lote en el próximo frame
    this.renderTimer = requestAnimationFrame(() => {
      this.processRenderQueue();
    });
  }
  
  /**
   * Crea o actualiza un marcador para un elemento
   */
  private createOrUpdateMarker(element: NetworkElement): void {
    if (!element.position || !this.map) return;
    
    const latLng = new L.LatLng(element.position.lat, element.position.lng);
    
    // Verificar si ya existe el marcador
    let marker = this.elementMarkers.get(element.id);
    
    if (marker) {
      // Actualizar posición si cambió
      const currentLatLng = marker.getLatLng();
      if (currentLatLng.lat !== latLng.lat || currentLatLng.lng !== latLng.lng) {
        marker.setLatLng(latLng);
      }
      
      // Actualizar icono si es necesario
      const newIcon = this.getMarkerIcon(element);
      marker.setIcon(newIcon);
    } else {
      // Crear nuevo marcador
      const icon = this.getMarkerIcon(element);
      marker = L.marker(latLng, {
        icon,
        draggable: false,
        title: element.name || `${element.type} ${element.id}`,
        riseOnHover: true
      });
      
      // Almacenar en caché
      this.elementMarkers.set(element.id, marker);
      
      // Añadir a la capa adecuada
      if (this.options.clusteringEnabled && this.clustersLayer) {
        this.clustersLayer.addLayer(marker);
      } else {
        this.elementsLayer.addLayer(marker);
      }
      
      // Añadir datos para referencia
      marker.element = element;
    }
  }
  
  /**
   * Renderiza las conexiones entre elementos
   */
  renderConnections(connections: NetworkConnection[]): void {
    if (!this.map || !this.options.showConnections) return;
    
    // En modo emergencia, limitar las conexiones
    if (this.emergencyMode) {
      connections = connections.slice(0, 30); // Mostrar solo hasta 30 conexiones
    }
    
    this.zone.runOutsideAngular(() => {
      // Limpiar líneas que ya no existen
      this.cleanupInvisibleConnections(connections);
      
      // Proceso ligero - no más de 5 conexiones por frame
      const BATCH_SIZE = this.emergencyMode ? 3 : 5;
      let processed = 0;
      
      const processNextBatch = () => {
        const batch = connections.slice(processed, processed + BATCH_SIZE);
        
        if (batch.length === 0) return;
        
        batch.forEach(connection => {
          this.createOrUpdateConnection(connection);
        });
        
        processed += batch.length;
        
        if (processed < connections.length) {
          setTimeout(processNextBatch, this.emergencyMode ? 50 : 0);
        }
      };
      
      // Iniciar procesamiento por lotes
      processNextBatch();
    });
  }
  
  /**
   * Crea o actualiza una línea para una conexión
   */
  private createOrUpdateConnection(connection: NetworkConnection): void {
    // Verificar que existen los elementos origen y destino
    const sourceMarker = this.elementMarkers.get(connection.sourceId);
    const targetMarker = this.elementMarkers.get(connection.targetId);
    
    if (!sourceMarker || !targetMarker) return;
    
    const connectionId = `${connection.sourceId}-${connection.targetId}`;
    const sourceLatLng = sourceMarker.getLatLng();
    const targetLatLng = targetMarker.getLatLng();
    
    // Verificar si ya existe la línea
    let line = this.connectionLines.get(connectionId);
    
    if (line) {
      // Actualizar puntos de la línea
      line.setLatLngs([sourceLatLng, targetLatLng]);
      
      // Actualizar estilo si es necesario
      const newOptions = this.getConnectionStyle(connection);
      line.setStyle(newOptions);
    } else {
      // Crear nueva línea
      const options = this.getConnectionStyle(connection);
      line = L.polyline([sourceLatLng, targetLatLng], options);
      
      // Almacenar en caché
      this.connectionLines.set(connectionId, line);
      
      // Añadir a la capa
      this.connectionsLayer.addLayer(line);
      
      // Añadir datos para referencia
      line.connection = connection;
    }
  }
  
  /**
   * Limpia marcadores que ya no existen
   */
  private cleanupInvisibleMarkers(currentElements: NetworkElement[]): void {
    const currentIds = new Set(currentElements.map(e => e.id));
    
    // Eliminar marcadores que ya no están en la lista
    this.elementMarkers.forEach((marker, id) => {
      if (!currentIds.has(id)) {
        if (this.options.clusteringEnabled && this.clustersLayer) {
          this.clustersLayer.removeLayer(marker);
        } else {
          this.elementsLayer.removeLayer(marker);
        }
        this.elementMarkers.delete(id);
      }
    });
  }
  
  /**
   * Limpia líneas que ya no existen
   */
  private cleanupInvisibleConnections(currentConnections: NetworkConnection[]): void {
    const currentIds = new Set(
      currentConnections.map(c => `${c.sourceId}-${c.targetId}`)
    );
    
    // Eliminar líneas que ya no están en la lista
    this.connectionLines.forEach((line, id) => {
      if (!currentIds.has(id)) {
        this.connectionsLayer.removeLayer(line);
        this.connectionLines.delete(id);
      }
    });
  }
  
  /**
   * Obtiene el icono para un marcador basado en el tipo de elemento
   */
  private getMarkerIcon(element: NetworkElement): L.Icon {
    // Determinar color basado en tipo
    let color = '#999999';
    let iconName = 'location_on';
    
    switch (element.type) {
      case ElementType.OLT:
        color = '#4caf50';
        iconName = 'router';
        break;
      case ElementType.ONT:
        color = '#ff9800';
        iconName = 'settings_input_hdmi';
        break;
      case ElementType.FDP:
        color = '#2196f3';
        iconName = 'dns';
        break;
      case ElementType.SPLITTER:
        color = '#9c27b0';
        iconName = 'call_split';
        break;
      case ElementType.EDFA:
        color = '#f44336';
        iconName = 'amp_stories';
        break;
      case ElementType.MANGA:
        color = '#795548';
        iconName = 'input';
        break;
      default:
        color = '#999999';
        iconName = 'fiber_manual_record';
    }
    
    // TODO: Implementar creación de icono personalizado
    // Para este ejemplo, usamos un icono simple
    return L.icon({
      iconUrl: `assets/leaflet/map-icons/${element.type.toLowerCase()}.svg`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
      popupAnchor: [0, -12],
    });
  }
  
  /**
   * Obtiene el estilo para una conexión
   */
  private getConnectionStyle(connection: NetworkConnection): L.PolylineOptions {
    // Color basado en estado, ancho, etc.
    let color = '#2196f3';
    let weight = 2;
    let opacity = 0.8;
    let dashArray: string | number[] | undefined = undefined;
    
    // Personalizar basado en tipo/estado
    if (connection.status === ElementStatus.FAULT) {
      color = '#f44336';
      weight = 3;
    } else if (connection.status === ElementStatus.WARNING) {
      color = '#ff9800';
      weight = 2;
    } else if (connection.status === ElementStatus.INACTIVE) {
      color = '#757575';
      opacity = 0.6;
      dashArray = '4';
    }
    
    return {
      color,
      weight,
      opacity,
      dashArray
    };
  }
  
  /**
   * Limpia todos los elementos renderizados
   */
  clearAll(): void {
    this.elementsLayer.clearLayers();
    this.connectionsLayer.clearLayers();
    
    if (this.clustersLayer) {
      this.clustersLayer.clearLayers();
    }
    
    this.elementMarkers.clear();
    this.connectionLines.clear();
  }
  
  /**
   * Actualiza las opciones de renderizado
   */
  updateOptions(options: Partial<RenderOptions>): void {
    const prevOptions = { ...this.options };
    this.options = { ...this.options, ...options };
    
    // Si cambia la opción de clustering, reiniciar capas
    if (prevOptions.clusteringEnabled !== this.options.clusteringEnabled) {
      this.handleClusteringChange();
    }
  }
  
  /**
   * Maneja cambios en la configuración de clustering
   */
  private handleClusteringChange(): void {
    if (!this.map) return;
    
    const elements: NetworkElement[] = [];
    
    // Guardar elementos actuales
    this.elementMarkers.forEach((marker, id) => {
      if (marker.element) {
        elements.push(marker.element);
      }
    });
    
    // Limpiar todas las capas
    this.clearAll();
    
    // Reinicializar clustering si está habilitado
    if (this.options.clusteringEnabled) {
      this.initClustering();
    }
    
    // Volver a renderizar elementos
    this.renderElements(elements);
  }
  
  /**
   * Inicia medición de FPS
   */
  private startFPSMeasurement(): void {
    this.lastFrameTime = performance.now();
    this.frameCount = 0;
    
    const measureFPS = () => {
      this.frameCount++;
      const now = performance.now();
      const elapsed = now - this.lastFrameTime;
      
      if (elapsed >= 1000) {
        this._fps = Math.round((this.frameCount * 1000) / elapsed);
        this.frameCount = 0;
        this.lastFrameTime = now;
      }
      
      requestAnimationFrame(measureFPS);
    };
    
    requestAnimationFrame(measureFPS);
  }
  
  /**
   * Devuelve las métricas de rendimiento actuales
   */
  get performanceMetrics(): { fps: number; rendered: number; visible: number } {
    return {
      fps: this._fps,
      rendered: this._renderedElements,
      visible: this._visibleElements
    };
  }
  
  /**
   * Destruye el renderizador y libera recursos
   */
  destroy(): void {
    this.clearAll();
    this.map = null;
  }
  
  /**
   * Obtiene el estado actual de WebGL
   */
  getUseWebGL(): boolean {
    return this.performanceConfig.useWebGL;
  }
  
  /**
   * Obtiene el estado actual de carga progresiva
   */
  getProgressiveLoading(): boolean {
    return this.performanceConfig.progressiveLoading;
  }
  
  /**
   * Obtiene el estado actual de clustering
   */
  getClusteringEnabled(): boolean {
    return this.performanceConfig.enableClustering;
  }
  
  /**
   * Actualiza la capa base del mapa
   * @param map Instancia del mapa Leaflet
   * @param layerId Identificador de la capa base a usar
   */
  updateBaseLayer(map: L.Map, layerId: string): void {
    if (!map) return;
    
    // Remover capas base actuales
    map.eachLayer(layer => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer);
      }
    });
    
    // Configurar opciones comunes para reducir carga de red
    const tileOptions = {
      crossOrigin: true,
      updateWhenIdle: true,
      updateWhenZooming: false,
      keepBuffer: 2,
      maxZoom: this.performanceConfig.maxZoom,
      // Implementar cacheo de tiles para soporte offline
      useCache: true,
      useOnlyCache: false
    };
    
    // Añadir nueva capa base según el ID
    switch (layerId) {
      case 'dark':
        // Capa oscura
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          ...tileOptions,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: 'abcd',
        }).addTo(map);
        break;
        
      case 'satellite':
        // Capa satélite
        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
          ...tileOptions,
          attribution: 'Tiles &copy; Esri',
        }).addTo(map);
        break;
        
      case 'hybrid':
        // Capa híbrida
        L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
          ...tileOptions,
          attribution: 'Map data &copy; Google',
        }).addTo(map);
        break;
        
      case 'light':
        // Capa clara
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
          ...tileOptions,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: 'abcd',
        }).addTo(map);
        break;
        
      case 'offline':
        // Capa para modo sin conexión
        L.tileLayer('assets/leaflet/offline-tiles/{z}/{x}/{y}.png', {
          ...tileOptions,
          errorTileUrl: 'assets/leaflet/error-tiles/error-tile.png',
          maxZoom: 18,
          minZoom: 10,
        }).addTo(map);
        break;
        
      case 'osm':
      default:
        // OpenStreetMap (predeterminado)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          ...tileOptions,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map);
        break;
    }
  }
  
  /**
   * Optimiza el rendimiento del mapa según el nivel de hardware
   * @param map Instancia del mapa
   * @param hardwareLevel Nivel de capacidad del hardware (low, medium, high)
   */
  optimizeForHardware(map: L.Map, hardwareLevel: 'low' | 'medium' | 'high'): void {
    if (!map) return;
    
    switch (hardwareLevel) {
      case 'low':
        // Optimizaciones para hardware de baja potencia
        this.performanceConfig.enableClustering = true;
        this.performanceConfig.clusterRadius = 100;
        this.performanceConfig.animationDuration = 0;
        
        if (this.clusterGroup) {
          // Debido a limitaciones en los tipos de Leaflet, necesitamos usar any
          const clusterOptions = this.clusterGroup as any;
          if (clusterOptions && clusterOptions.options) {
            clusterOptions.options.maxClusterRadius = 100;
            clusterOptions.options.animate = false;
            clusterOptions.options.animateAddingMarkers = false;
          }
        }
        
        // Reducir framerate
        (L as any).Util.requestAnimFrame = function(callback: Function, context: any, immediate: boolean) {
          return setTimeout(callback.bind(context), 100);
        };
        break;
        
      case 'medium':
        // Configuración equilibrada
        this.performanceConfig.enableClustering = true;
        this.performanceConfig.clusterRadius = 80;
        this.performanceConfig.animationDuration = 200;
        
        if (this.clusterGroup) {
          // Debido a limitaciones en los tipos de Leaflet, necesitamos usar any
          const clusterOptions = this.clusterGroup as any;
          if (clusterOptions && clusterOptions.options) {
            clusterOptions.options.maxClusterRadius = 80;
            clusterOptions.options.animate = true;
            clusterOptions.options.animateAddingMarkers = false;
          }
        }
        break;
        
      case 'high':
        // Configuración para rendimiento completo
        this.performanceConfig.enableClustering = true;
        this.performanceConfig.clusterRadius = 60;
        this.performanceConfig.animationDuration = 300;
        
        if (this.clusterGroup) {
          // Debido a limitaciones en los tipos de Leaflet, necesitamos usar any
          const clusterOptions = this.clusterGroup as any;
          if (clusterOptions && clusterOptions.options) {
            clusterOptions.options.maxClusterRadius = 60;
            clusterOptions.options.animate = true;
            clusterOptions.options.animateAddingMarkers = true;
          }
        }
        break;
    }
    
    // Aplicar cambios y refrescar el mapa
    if (map) {
      map.invalidateSize();
    }
  }
  
  /**
   * Limpia la memoria y recursos al destruir el componente
   */
  cleanup(): void {
    this.clusterGroup = null;
  }
  
  /**
   * Activa el modo de emergencia para mejorar rendimiento
   */
  enableEmergencyMode(): void {
    this.emergencyMode = true;
    
    // Reducir número máximo de elementos por frame
    this.maxElementsPerFrame = 5;
    
    // Actualizar opciones para rendimiento extremo
    this.updateOptions({
      useWebGL: false,
      progressiveLoading: true,
      clusteringEnabled: true
    });
    
    // Limpiar todo para empezar fresco
    this.clearAll();
    
    this.logger.warn('Modo de emergencia activado para rendimiento');
  }
  
  /**
   * Desactiva el modo de emergencia
   */
  disableEmergencyMode(): void {
    this.emergencyMode = false;
    this.maxElementsPerFrame = 10;
    this.logger.info('Modo de emergencia desactivado');
  }
} 