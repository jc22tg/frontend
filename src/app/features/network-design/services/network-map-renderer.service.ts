/// <reference types="leaflet.markercluster" />
import { Injectable, NgZone } from '@angular/core';
import { ElementType, NetworkElement, NetworkConnection, ConnectionStatus } from '../../../shared/types/network.types';
import { createGeographicPosition, GeographicPosition } from '../../../shared/types/geo-position';
import { LoggerService } from '../../../core/services/logger.service';
import { Observable, of, BehaviorSubject, Subject } from 'rxjs';
import { VirtualizationService } from './virtualization.service';
import { MapStateManagerService } from './map/map-state-manager.service';
import { MapElementManagerAdapter } from './map/standalone-adapters/map-element-manager-adapter';

// L importado modularmente.
import L from 'leaflet';

// Importar leaflet.markercluster DESPUÉS de L y PARA EFECTOS SECUNDARIOS (adjuntar a L)
import 'leaflet.markercluster';

// Aumentamos tipos de Leaflet SOLO para nuestras propiedades personalizadas,
// confiando en los paquetes @types/* para las extensiones de plugins.
declare module 'leaflet' {
  // Extensiones personalizadas para nuestros datos de aplicación
  interface Marker<P = any> {
    element?: NetworkElement;
  }
  
  interface Polyline {
    connection?: NetworkConnection;
    // Si leaflet-editable añade .editor y otros, @types/leaflet-editable debería manejarlo.
    // Si no, se podrían añadir aquí selectivamente:
    // editor?: any; // o un tipo más específico si se conoce
    // enableEdit(map?: L.Map): void;
    // disableEdit(): void;
  }

  // Ya no redeclaramos MarkerClusterGroup aquí para evitar conflictos.
  // Confiamos en que @types/leaflet.markercluster lo haga correctamente.
  // Si L.markerClusterGroup sigue sin tiparse correctamente, es un problema con la configuración de @types/leaflet.markercluster
  // o cómo TypeScript lo está resolviendo.
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
  private connectionVertexMarkers = new Map<string, L.Marker[]>(); // Caché para los marcadores de vértices de conexión
  
  // Mapa y capas
  private map: L.Map | null = null;
  private elementsLayer: L.LayerGroup = L.layerGroup();
  private connectionsLayer: L.LayerGroup = L.layerGroup();
  // Usar 'any' o L.LayerGroup temporalmente para clustersLayer debido a problemas de tipo con MarkerClusterGroup
  private clustersLayer: any | null = null;
  private labelsLayer: L.LayerGroup = L.layerGroup();
  
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
  // Usar 'any' o L.LayerGroup temporalmente para clusterGroup
  private clusterGroup: any | null = null;
  
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
  
  // private defaultIcon = L.icon({ /* ... */ }); // Comentado - Reemplazado por getMarkerIcon
  // private highlightedIcon = L.icon({ /* ... */ }); // Comentado - Reemplazado por getMarkerIcon

  private isVirtualizationEnabled = true;
  private currentBounds: L.LatLngBounds | null = null;
  
  // Propiedad para rastrear la conexión que se está editando actualmente
  private currentEditingConnection: { polyline: L.Polyline, connection: NetworkConnection } | null = null;
  
  constructor(
    private zone: NgZone,
    private logger: LoggerService,
    private virtualizationService: VirtualizationService,
    private mapStateManagerService: MapStateManagerService,
    private elementManagerAdapter: MapElementManagerAdapter
  ) {
    // Iniciar medición de FPS
    this.startFPSMeasurement();
    this.logger.debug('[NetworkMapRendererService] Constructor');
    
    // Agregar manejador de teclado para Enter y Delete
    document.addEventListener('keydown', this.handleKeyDown);
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
    this.labelsLayer.addTo(map);
    
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
    if (!this.map) {
      this.logger.warn('[Renderer] Mapa no inicializado, no se puede inicializar clustering.');
      this.options.clusteringEnabled = false;
      return;
    }

    let clusterLayerInitialized = false;

    // Volver a usar el L importado, ahora que leaflet.markercluster se importa modularmente.
    // Los (L as any) siguen siendo útiles si los tipos de @types/leaflet.markercluster no se fusionan bien.

    // Intento 1: Usar L.markerClusterGroup (función camelCase)
    if (typeof (L as any).markerClusterGroup === 'function') {
      try {
        this.clustersLayer = (L as any).markerClusterGroup({
          maxClusterRadius: 50,
          spiderfyOnMaxZoom: true,
          showCoverageOnHover: false,
          zoomToBoundsOnClick: true,
        });

        if (this.map && this.clustersLayer) {
          this.map.addLayer(this.clustersLayer);
          this.logger.info('[Renderer] Clustering inicializado exitosamente con L.markerClusterGroup().');
          clusterLayerInitialized = true;
        }
      } catch (error: any) {
        this.logger.warn(`[Renderer] Falló L.markerClusterGroup(): ${error.message}. Se intentarán alternativas.`, error);
        // Fallback a L.MarkerClusterGroup si L.markerClusterGroup no está disponible o falla
        if (this.clustersLayer && this.map && this.map.hasLayer(this.clustersLayer)) {
            this.map.removeLayer(this.clustersLayer);
        }
        this.clustersLayer = null; 
      }
    } else {
      this.logger.debug('[Renderer] L.markerClusterGroup no es una función.');
    }

    // Intento 2: Usar new L.MarkerClusterGroup (constructor PascalCase)
    if (!clusterLayerInitialized) {
      // Puede que necesitemos castear L a any si MarkerClusterGroup no está en los tipos de L directamente
      const MarkerClusterGroupConstructor = (L as any).MarkerClusterGroup;
      if (typeof MarkerClusterGroupConstructor === 'function') {
        try {
          this.clustersLayer = new MarkerClusterGroupConstructor({
            maxClusterRadius: 50,
            spiderfyOnMaxZoom: true,
            showCoverageOnHover: false,
            zoomToBoundsOnClick: true,
          });
          if (this.map && this.clustersLayer) {
            this.map.addLayer(this.clustersLayer);
            this.logger.info('[Renderer] Clustering inicializado exitosamente con new L.MarkerClusterGroup().');
            clusterLayerInitialized = true;
          }
        } catch (err: any) {
          this.logger.warn(`[Renderer] Falló new L.MarkerClusterGroup(): ${err.message}`);
          console.error('[Renderer] Error object new L.MarkerClusterGroup:', err);
          if (this.clustersLayer && this.map && this.map.hasLayer(this.clustersLayer)) {
              this.map.removeLayer(this.clustersLayer);
          }
          this.clustersLayer = null;
        }
      } else {
        this.logger.debug('[Renderer] L.MarkerClusterGroup (PascalCase) no es una función.');
      }
    }
    
    if (clusterLayerInitialized) {
      this.options.clusteringEnabled = true;
      this.clusterGroup = this.clustersLayer;
    } else {
      this.logger.error('[Renderer] No se pudo inicializar el clustering. Clustering deshabilitado.');
      this.options.clusteringEnabled = false;
      this.clustersLayer = null;
      this.clusterGroup = null;
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
    if (!element.id) {
      this.logger.warn('[Renderer] Elemento sin ID no puede ser renderizado', element);
      return;
    }
    if (!element.position) {
      this.logger.warn(`[Renderer] Elemento ${element.id} sin posición no puede ser renderizado.`);
      return;
    }

    const latLng = L.latLng(element.position.lat, element.position.lng);
    
    const existingMarker = this.elementMarkers.get(element.id);
    let markerToUse: L.Marker;

    if (existingMarker) {
      const currentLatLng = existingMarker.getLatLng();
      if (currentLatLng.lat !== latLng.lat || currentLatLng.lng !== latLng.lng) {
        existingMarker.setLatLng(latLng);
      }
      const newIcon = this.getMarkerIcon(element);
      existingMarker.setIcon(newIcon);
      markerToUse = existingMarker;
    } else {
      const icon = this.getMarkerIcon(element);
      const newMarker = L.marker(latLng, {
        icon,
        draggable: false,
        title: element.name || `${element.type} ${element.id}`,
        riseOnHover: true
      });
      
      // Almacenar referencia al elemento en el marcador
      newMarker.element = element;
      
      // Añadir eventos del marcador
      this.addMarkerEvents(newMarker, element);
      
      // Guardar en el mapa de marcadores
      this.elementMarkers.set(element.id, newMarker);
      markerToUse = newMarker;
      
      // Añadir a la capa apropiada
      if (this.options.clusteringEnabled && this.clustersLayer) {
        this.clustersLayer.addLayer(newMarker);
        // Log de verificación
        this.logger.debug(`[Renderer] Marcador para elemento ${element.id} (${element.type}) añadido al clúster.`);
      } else {
        this.elementsLayer.addLayer(newMarker);
        // Log de verificación
        this.logger.debug(`[Renderer] Marcador para elemento ${element.id} (${element.type}) añadido a la capa normal.`);
      }
    }
    
    // Verificación adicional
    if (element.type === ElementType.MANGA) {
      this.logger.info(`[Renderer] Elemento MANGA procesado: ${element.id} en posición [${latLng.lat}, ${latLng.lng}]`);
    }
  }
  
  /**
   * Añade los eventos necesarios al marcador
   */
  private addMarkerEvents(marker: L.Marker, element: NetworkElement): void {
    // Evento de clic - seleccionar el elemento
    marker.on('click', (e: L.LeafletMouseEvent) => {
      // Notificar al servicio de estado sobre la selección
      this.mapStateManagerService.setSelectedElements([element]);
      
      // Log de confirmación
      this.logger.debug(`[Renderer] Elemento seleccionado por clic en marcador: ${element.id} (${element.type})`);
      
      // Evitar que el evento se propague al mapa
      L.DomEvent.stopPropagation(e);
    });
    
    // Evento de doble clic - editar el elemento
    marker.on('dblclick', (e: L.LeafletMouseEvent) => {
      // Seleccionamos el elemento primero para asegurar que está seleccionado
      this.mapStateManagerService.setSelectedElements([element]);
      
      // Emitir evento de doble clic que será capturado por MapContainer
      this.logger.debug(`[Renderer] Doble clic en marcador: ${element.id} (${element.type})`);
      
      // Detener propagación para evitar que el mapa también reciba el evento
      L.DomEvent.stopPropagation(e);
    });
    
    // Evento de mouseover - mostrar tooltip
    marker.on('mouseover', () => {
      marker.openTooltip();
    });
    
    // Evento de mouseout - ocultar tooltip
    marker.on('mouseout', () => {
      marker.closeTooltip();
    });
  }
  
  /**
   * Renderiza las conexiones entre elementos
   */
  renderConnections(connections: NetworkConnection[]): void {
    if (!this.map) {
      this.logger.warn('[Renderer] Mapa no inicializado, no se pueden renderizar conexiones.');
      return;
    }
    this.logger.info(`[Renderer] Renderizando ${connections.length} conexiones.`);
    
    const newConnectionIds = new Set(connections.filter(c => c.id).map(c => c.id!));

    // Eliminar conexiones antiguas del mapa y de la caché connectionLines
    this.connectionLines.forEach((line, id) => {
      if (!newConnectionIds.has(id)) {
        this.connectionsLayer.removeLayer(line);
        if (typeof (line as any).disableEdit === 'function') {
          (line as any).disableEdit(); // Deshabilitar edición antes de remover
        }
        this.connectionLines.delete(id);
        this.logger.debug(`[Renderer] Conexión eliminada del mapa: ${id}`);
      }
    });

    connections.forEach(connection => {
      if (!connection.id) {
        this.logger.warn('[Renderer] Se intentó renderizar una conexión sin ID.', connection);
        return;
      }
      this.createOrUpdateConnection(connection);
    });
  }
  
  /**
   * Crea o actualiza una línea para una conexión
   */
  private createOrUpdateConnection(connection: NetworkConnection): void {
    if (!this.map) return;

    // Asegurar que connection.id exista antes de proceder
    if (!connection.id) {
      this.logger.error('[Renderer] Intento de crear/actualizar conexión sin ID.');
      return;
    }

    const sourceMarker = this.elementMarkers.get(connection.sourceElementId);
    const targetMarker = this.elementMarkers.get(connection.targetElementId);

    this.logger.info(`[Renderer] createOrUpdateConnection for ${connection.id}: ` +
                     `Source ID: ${connection.sourceElementId} -> Marker found: ${!!sourceMarker}, ` +
                     `Target ID: ${connection.targetElementId} -> Marker found: ${!!targetMarker}`);

    if (!sourceMarker || !targetMarker) {
      this.logger.warn(`[Renderer] No se encontraron marcadores de origen o destino para la conexión ${connection.id}. No se puede renderizar.`);
      const existingLine = this.connectionLines.get(connection.id); // connection.id aquí es seguro por la guarda anterior
      if (existingLine) {
        this.connectionsLayer.removeLayer(existingLine);
        if (typeof (existingLine as any).disableEdit === 'function') {
          (existingLine as any).disableEdit();
        }
        this.connectionLines.delete(connection.id); // connection.id aquí es seguro
      }
      return;
    }

    const latlngs: L.LatLngExpression[] = [
      sourceMarker.getLatLng(),
      ...(connection.vertices?.map(v => L.latLng(v.lat, v.lng)) || []),
      targetMarker.getLatLng()
    ];

    let polyline = this.connectionLines.get(connection.id); // connection.id aquí es seguro

    if (polyline) {
      polyline.setLatLngs(latlngs);
      this.logger.debug(`[Renderer] Conexión actualizada: ${connection.id}`);
    } else {
      polyline = L.polyline(latlngs, {
        color: (connection.metadata as any)?.color || '#3388ff', // Type assertion
        weight: (connection.metadata as any)?.weight || 3,   // Type assertion
        opacity: (connection.metadata as any)?.opacity || 0.7 // Type assertion
      }).addTo(this.connectionsLayer);
      
      this.connectionLines.set(connection.id, polyline); // connection.id aquí es seguro
      this.logger.debug(`[Renderer] Conexión creada: ${connection.id}`);
      
      // Habilitar Leaflet.Editable para la nueva polilínea
      if (this.map) { // Asegurarse de que this.map exista
        (polyline as any).enableEdit(this.map);
      } else {
        this.logger.warn(`[Renderer] No se pudo habilitar la edición para ${connection.id} porque this.map es null.`);
      }

      this.setupPolylineEditEvents(polyline, connection);
    }
  }

  private setupPolylineEditEvents(polyline: L.Polyline, connection: NetworkConnection): void {
    if (!this.map) return;

    // Escuchar eventos de edición de Leaflet.Editable
    // 'editable:vertex:dragend' - un vértice existente fue arrastrado
    // 'editable:vertex:new' - un nuevo vértice fue añadido (ej. desde un marcador intermedio)
    // 'editable:vertex:deleted' - un vértice fue eliminado
    // 'editable:editing' - cualquier cambio en la geometría (podría ser demasiado frecuente)
    // (polyline as any).on('editable:vertex:dragend editable:vertex:new editable:vertex:deleted', (e: any) => {
    //   this.logger.info(`[Renderer] Evento de edición de vértice para conexión ${connection.id}:`, e.type);
    //   this.handlePolylineEdit(polyline, connection);
    // });
    // Leaflet.Editable puede no tener un evento específico 'editable:vertex:new'.    
    // A menudo, la adición de un nuevo vértice se produce al arrastrar un "middle marker".
    // El evento 'editable:editing' se dispara con cada cambio, incluyendo la adición/eliminación de vértices.
    // O podemos usar 'editable:vertex:rawclick' y verificar si es un middle marker.
    // Por simplicidad, usar 'editable:editing' y actualizar puede ser suficiente si no es muy costoso.
    // O usar eventos más específicos si están disponibles y son fiables.
    (polyline as any).on('editable:editing', (e: any) => {
      // Este evento puede dispararse muy frecuentemente durante un arrastre.
      // Considera usar un debounce si actualizas el backend en cada evento.
      // O usar eventos más específicos como dragend, vertexdeleted.
      this.logger.debug(`[Renderer] Evento 'editable:editing' para conexión ${connection.id}. Datos del evento:`, e);
      // e.vertex (el vértice que se está editando), e.latlngs (todos los latlngs de la línea)
      // e.layer (la polilínea misma)
      this.handlePolylineEdit(e.layer as L.Polyline, connection);        
      // Establecer esta conexión como la que está siendo editada actualmente
      this.currentEditingConnection = { polyline, connection };
    });
    (polyline as any).on('editable:vertex:deleted', (e: any) => {
      this.logger.info(`[Renderer] Evento 'editable:vertex:deleted' para conexión ${connection.id}. Datos del evento:`, e);
      this.handlePolylineEdit(e.layer as L.Polyline, connection);
      this.currentEditingConnection = { polyline, connection };
    });
    // Puedes añadir más listeners si es necesario, como para 'editable:vertex:dragstart' o 'editable:vertex:dragend'
    (polyline as any).on('editable:vertex:dragend', (e: any) => {
      this.logger.info(`[Renderer] Evento 'editable:vertex:dragend' para conexión ${connection.id}. Datos del evento:`, e);
      this.handlePolylineEdit(e.layer as L.Polyline, connection);
      this.currentEditingConnection = { polyline, connection };
    });

    (polyline as any).on('click', (e: any) => {
      // Cuando se hace clic en una conexión, establecerla como la actual y activar edición
      L.DomEvent.stopPropagation(e.originalEvent);
      this.logger.debug(`[Renderer] Conexión seleccionada: ${connection.id}`);
      
      // Primero desactivamos cualquier editor activo
      if (this.currentEditingConnection && this.currentEditingConnection.polyline !== polyline) {
        if ((this.currentEditingConnection.polyline as any).editor) {
          (this.currentEditingConnection.polyline as any).disableEdit();
        }
      }
      
      // Establecer como conexión actual
      this.currentEditingConnection = { polyline, connection };
      
      // Activar el editor si no está ya activo
      if (!(polyline as any).editEnabled) {
        (polyline as any).enableEdit(this.map);
        (polyline as any).editEnabled = true;
        
        // Añadir clase visual para indicar que está en modo edición
        polyline.getElement()?.classList.add('connection-editing');
        
        this.logger.debug(`[Renderer] Editor de vértices activado para conexión: ${connection.id}`);
      }
    });

    // Añadir evento de doble clic para editar propiedades adicionales
    (polyline as any).on('dblclick', (e: any) => {
      L.DomEvent.stopPropagation(e.originalEvent);
      this.logger.debug(`[Renderer] Solicitando edición de propiedades para conexión: ${connection.id}`);
      
      // Establecer como conexión actual si no lo estaba ya
      this.currentEditingConnection = { polyline, connection };
      
      // Emitir evento para abrir diálogo de edición de propiedades
      this.mapStateManagerService.openConnectionPropertiesDialog(connection);
    });

    this.logger.debug(`[Renderer] Eventos de edición configurados para conexión: ${connection.id}`);
  }

  private handlePolylineEdit(polyline: L.Polyline, connection: NetworkConnection): void {
    if (!this.map) return;

    const newLatLngs = polyline.getLatLngs() as L.LatLng[];

    // Los vértices son todos los puntos excepto el primero (sourceMarker) y el último (targetMarker)
    // Leaflet.Editable mantiene los puntos finales de la polilínea correspondiendo a los marcadores de origen/destino
    // si la polilínea se creó entre ellos. 
    // Sin embargo, al obtener getLatLngs(), obtenemos toda la secuencia.
    // Debemos asegurarnos de no incluir los puntos finales como vértices si estos representan los elementos conectados.
    let vertices: GeographicPosition[] = [];
    if (newLatLngs.length > 2) { // Solo hay vértices intermedios si hay más de 2 puntos en total
        vertices = newLatLngs.slice(1, newLatLngs.length - 1).map(latlng => 
          createGeographicPosition(latlng.lat, latlng.lng)
        );
    }

    const updatedConnection: NetworkConnection = {
      ...connection,
      vertices: vertices
    };

    this.logger.info(`[Renderer] Actualizando conexión ${connection.id} con nuevos vértices:`, updatedConnection.vertices);
    
    this.elementManagerAdapter.updateConnection(updatedConnection).subscribe({
      next: (success) => {
        if (success) {
          this.logger.info(`[Renderer] Conexión ${connection.id} actualizada en backend tras edición.`);
          // La polilínea ya está actualizada visualmente por Leaflet.Editable.
          // Si MapElementManagerService emite un evento connectionsChanged$, MapService lo recogerá y refrescará.
          // No es necesario llamar a this.mapElementManagerService.refreshConnections() explícitamente aquí
          // si el flujo de datos ya está configurado para ello.
        } else {
          this.logger.warn(`[Renderer] Falló la actualización en backend de la conexión ${connection.id} tras edición. Revirtiendo cambios visuales.`);
          // Revertir la polilínea a su estado anterior (desde la 'connection' original)
          const originalLatLngs: L.LatLngExpression[] = [
            this.elementMarkers.get(connection.sourceElementId)!.getLatLng(),
            ...(connection.vertices?.map(v => L.latLng(v.lat, v.lng)) || []),
            this.elementMarkers.get(connection.targetElementId)!.getLatLng()
          ];
          polyline.setLatLngs(originalLatLngs);
          // Puede que necesites forzar una reactualización de los editores de la polilínea si Leaflet.Editable no lo hace automáticamente.
          (polyline as any).editor?.reset(); 
        }
      },
      error: (err) => {
        this.logger.error(`[Renderer] Error al actualizar conexión ${connection.id} en backend tras edición:`, err);
        const originalLatLngs: L.LatLngExpression[] = [
            this.elementMarkers.get(connection.sourceElementId)!.getLatLng(),
            ...(connection.vertices?.map(v => L.latLng(v.lat, v.lng)) || []),
            this.elementMarkers.get(connection.targetElementId)!.getLatLng()
          ];
        polyline.setLatLngs(originalLatLngs);
        (polyline as any).editor?.reset();
      }
    });
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
   * Limpia todos los elementos renderizados
   */
  clearAll(): void {
    if (!this.map) return;
    this.logger.debug('[Renderer] Limpiando todas las capas del renderer.');
    this.connectionsLayer.clearLayers();
    this.elementsLayer.clearLayers();
    this.labelsLayer.clearLayers();
    this.elementMarkers.clear();
    // Asegúrate de deshabilitar la edición en todas las líneas antes de limpiar
    this.connectionLines.forEach(line => (line as any).disableEdit());
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
    
    // Eliminar el event listener del teclado
    document.removeEventListener('keydown', this.handleKeyDown);
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

  private getMarkerIcon(element: NetworkElement): L.Icon {
    // Implementación básica de getMarkerIcon
    // Deberás ajustar las rutas y la lógica según tus necesidades
    let iconUrl = 'assets/leaflet/map-icons/default.svg'; // Un icono por defecto
    const iconSize: L.PointExpression = [28, 28]; // Tamaño estándar
    const iconAnchor: L.PointExpression = [14, 14]; // Ancla al centro
    let className = 'network-element-marker';

    if (element.type) {
      iconUrl = `assets/leaflet/map-icons/${element.type.toLowerCase()}.svg`;
    }

    if (element.status) {
      className += ` status-${element.status.toLowerCase()}`;
    }
    
    // Ejemplo de cómo podrías diferenciar si está seleccionado (necesitarías acceso a ese estado)
    // if (this.mapStateManagerService.isElementSelected(element.id)) {
    //   className += ' selected';
    //   iconSize: [32, 32]; // Más grande si está seleccionado
    //   iconAnchor: [16, 16];
    // }

    return L.icon({
      iconUrl: iconUrl,
      iconSize: iconSize,
      iconAnchor: iconAnchor,
      className: className,
      // shadowUrl: 'assets/leaflet/map-icons/marker-shadow.png', // Opcional: sombra
      // shadowSize: [41, 41],
      // shadowAnchor: [12, 41]
    });
  }

  /**
   * Manejador para eventos de teclado (Enter y Delete)
   */
  private handleKeyDown = (event: KeyboardEvent): void => {
    // Enter para finalizar edición
    if (event.key === 'Enter' && this.currentEditingConnection) {
      this.logger.debug('[Renderer] Tecla Enter presionada, finalizando edición de conexión.');
      this.finishConnectionEditing();
    }
    
    // Delete para eliminar conexión seleccionada
    if ((event.key === 'Delete' || event.key === 'Del') && this.currentEditingConnection) {
      this.logger.debug('[Renderer] Tecla Delete presionada, eliminando conexión seleccionada.');
      this.deleteSelectedConnection();
    }
  }
  
  /**
   * Finaliza la edición de la conexión actual
   */
  private finishConnectionEditing(): void {
    if (!this.currentEditingConnection) return;
    
    this.logger.info(`[Renderer] Finalizando edición de conexión: ${this.currentEditingConnection.connection.id}`);
    
    // Deshabilitar el editor de la polilínea
    if (this.currentEditingConnection.polyline && (this.currentEditingConnection.polyline as any).editor) {
      (this.currentEditingConnection.polyline as any).disableEdit();
      (this.currentEditingConnection.polyline as any).editEnabled = false;
      
      // Quitar clase visual de modo edición
      this.currentEditingConnection.polyline.getElement()?.classList.remove('connection-editing');
    }
    
    // Guardar los cambios al finalizar
    this.handlePolylineEdit(
      this.currentEditingConnection.polyline,
      this.currentEditingConnection.connection
    );
    
    // Limpiar la referencia a la conexión actual
    this.currentEditingConnection = null;
    
    this.logger.debug('[Renderer] Edición de conexión finalizada y cambios guardados.');
  }
  
  /**
   * Elimina la conexión seleccionada actualmente
   */
  private deleteSelectedConnection(): void {
    if (!this.currentEditingConnection || !this.currentEditingConnection.connection.id) return;
    
    const connectionId = this.currentEditingConnection.connection.id;
    this.logger.info(`[Renderer] Eliminando conexión seleccionada: ${connectionId}`);
    
    // Eliminar del mapa
    if (this.currentEditingConnection.polyline) {
      if (typeof (this.currentEditingConnection.polyline as any).disableEdit === 'function') {
        (this.currentEditingConnection.polyline as any).disableEdit();
        (this.currentEditingConnection.polyline as any).editEnabled = false;
      }
      
      // Quitar clase visual si existe
      this.currentEditingConnection.polyline.getElement()?.classList.remove('connection-editing');
      
      this.connectionsLayer.removeLayer(this.currentEditingConnection.polyline);
    }
    
    // Eliminar de la caché
    if (connectionId) {
      this.connectionLines.delete(connectionId);
    }
    
    // Eliminar en el backend utilizando updateConnection con una propiedad en metadata
    const deleteRequest: NetworkConnection = {
      ...this.currentEditingConnection.connection,
      metadata: {
        ...((this.currentEditingConnection.connection.metadata as any) || {}),
        isDeleted: true
      }
    };
    
    this.elementManagerAdapter.updateConnection(deleteRequest).subscribe({
      next: (success) => {
        if (success) {
          this.logger.info(`[Renderer] Conexión ${connectionId} marcada como eliminada correctamente`);
        } else {
          this.logger.warn(`[Renderer] No se pudo marcar como eliminada la conexión ${connectionId}`);
        }
      },
      error: (err) => {
        this.logger.error(`[Renderer] Error al marcar como eliminada la conexión ${connectionId}:`, err);
      }
    });
    
    // Limpiar la referencia actual
    this.currentEditingConnection = null;
  }
} 
