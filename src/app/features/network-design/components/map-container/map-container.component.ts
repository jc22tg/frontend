import { Component, OnInit, OnDestroy, ViewChild, ElementRef, Input, ChangeDetectionStrategy, inject, AfterViewInit, ChangeDetectorRef, NgZone, Injector } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { LoggerService } from '../../../../core/services/logger.service';
import { MapService } from '../../services/map.service';
import { MapToolsService } from '../../services/map/map-tools.service';
import { MapStateService } from '../../services/map/state/map-state.service';
import { MapPerformanceService } from '../../services/map/map-performance.service';
import { StandaloneAdapterService } from '../../services/map/standalone-adapter.service';
import { MapElementManagerAdapter } from '../../services/map/standalone-adapters/map-element-manager-adapter';
import { MapViewComponent } from './components/map-view/map-view.component';
import { LayerControlComponent, LayerEntry } from '../layer-control/layer-control.component';
import { ElementsPanelComponent } from './components/elements-panel/elements-panel.component';
import { NetworkElement, ElementType, ElementStatus, NetworkConnection, ConnectionStatus, ConnectionType } from '../../../../shared/types/network.types';
import { ActivatedRoute, Router } from '@angular/router';
import { MapStateManagerService, ToolType } from '../../services/map/map-state-manager.service';
import { BaseMapComponent } from '../base/base-map.component';
import { PerformanceWidgetComponent } from './components/map-widgets/performance-widget/performance-widget.component';
import { NetworkToolbarComponent } from '../network-toolbar/network-toolbar.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { MapEventsService } from '../../services/map-events.service';
// Comentar import estático para usar lazy loading
// import html2canvas from 'html2canvas';
import { ELEMENT_LABELS } from '../../services/map.constants'; // Importar ELEMENT_LABELS
import * as L from 'leaflet';
import { ElementEditorComponent } from '../elements/element-editor/element-editor.component';

/**
 * Componente contenedor principal para el mapa
 * 
 * Este componente actúa como punto de entrada único para la visualización del mapa
 * y orquesta todos los componentes y servicios relacionados con el mapa.
 */
@Component({
  selector: 'app-map-container',
  templateUrl: './map-container.component.html',
  styleUrls: ['./map-container.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ElementsPanelComponent,
    LayerControlComponent,
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonModule,
    MapViewComponent,
    PerformanceWidgetComponent,
    NetworkToolbarComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MapContainerComponent extends BaseMapComponent implements OnInit, OnDestroy, AfterViewInit {
  // Referencia al contenedor del mapa
  @ViewChild('mapContainer', { static: true }) mapContainerRef!: ElementRef;
  @ViewChild(MapViewComponent) mapViewComponent!: MapViewComponent;
  
  // Configuración personalizada
  @Input() initialZoom = 16;
  @Input() initialCenter: [number, number] = [19.783750, -70.676666];
  @Input() darkMode = false;
  @Input() showControls = true;
  @Input() showMiniMap = true;
  @Input() showLayerControl = true;
  
  // Estado interno
  isMapReady = false;
  showElementsPanel = true;
  showWidgets = true;
  showSearchWidget = true;
  isDebugMode = true; // Modo debug para mostrar información de rendimiento
  
  // Alias para darkMode para mantener compatibilidad con el template
  get isDarkTheme(): boolean {
    return this.darkMode;
  }
  
  // Métricas de rendimiento
  performanceMetrics = {
    fps: 0,
    elementCount: 0,
    memoryUsage: 0,
    memoryUsageFormatted: '0 MB'
  };
  
  // Variable para simular un active tool
  public activeTool: ToolType = 'pan';
  private elementTypeToPlace: ElementType | null = null;
  private firstElementForConnection: NetworkElement | null = null;
  
  // Acceso a console para usar en el template
  public console = console;
  
  // Servicios
  public mapService = inject(MapService);
  public mapToolsService = inject(MapToolsService);
  public mapStateService = inject(MapStateService);
  public mapPerformanceService = inject(MapPerformanceService);
  public standaloneAdapter = inject(StandaloneAdapterService);
  public elementManagerAdapter = inject(MapElementManagerAdapter);
  private route = inject(ActivatedRoute);
  public stateManager = inject(MapStateManagerService);
  private router = inject(Router);
  protected snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  public cdr = inject(ChangeDetectorRef);
  public mapEventsService = inject(MapEventsService);
  
  // Banderas para usar adaptadores standalones
  useStandaloneComponents = false;
  
  constructor(injector: Injector) {
    super(injector);
    
    this.logDebug('MapContainerComponent inicializado');
    
    // Verificar que la inyección de dependencias fue exitosa
    if (!this.mapService || !this.mapStateService || !this.stateManager) {
      this.logger.error('MapContainerComponent: Falló la inyección de servicios críticos');
      return;
    }
    
    this.validateComponentConsistency();
    
    // Forzar el uso de componentes standalone para asegurar que se renderice el mapa
    // (Puede desactivarse cuando todo funcione correctamente)
    // this.useStandaloneComponents = true; // Comentado para probar mapa geográfico
    this.useStandaloneComponents = false; // Forzar mapa legacy/geográfico
    
    // También obtener la configuración del servicio si está disponible
    try {
      const standaloneFlag = this.standaloneAdapter.getFeatureFlag('enableStandaloneMode');
      this.logDebug(`Bandera enableStandaloneMode desde servicio: ${standaloneFlag}`);
      // Si la bandera del servicio es true, podría ser necesario respetarla, pero por ahora forzamos false.
      // if (standaloneFlag) this.useStandaloneComponents = true;
    } catch (error) {
      this.logDebug('Error al obtener la bandera enableStandaloneMode', error);
    }
  }

  /**
   * Carga dinámicamente html2canvas para reducir el bundle inicial
   */
  private async loadHtml2Canvas(): Promise<any> {
    const html2canvas = await import('html2canvas');
    return html2canvas.default;
  }
  
  /**
   * Implementación del método abstracto requerido por BaseMapComponent
   */
  protected initializeComponent(): void {
    this.logDebug('Inicializando componente MapContainer');
    this.setupSubscriptions();
  }
  
  /**
   * Configura las suscripciones necesarias
   */
  private setupSubscriptions(): void {
    // Obtener configuración desde los datos de la ruta si están disponibles
    this.route.data.subscribe(data => {
      if (data && data['mapConfig']) {
        const mapConfig = data['mapConfig'];
        if (mapConfig.initialZoom) {
          this.initialZoom = mapConfig.initialZoom;
        }
        if (mapConfig.initialCenter) {
          this.initialCenter = mapConfig.initialCenter;
        }
        this.logDebug('Configuración de mapa cargada desde ruta:', mapConfig);
      }
    });
    
    // Inicializar servicios de rendimiento
    this.mapPerformanceService.initialize({
      enableFPSMonitoring: true,
      autoOptimize: true
    });
    
    // Suscribirse a cambios de estado
    this.mapStateService.mapState$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        // Actualizar componente según el estado
        this.logDebug('Estado del mapa actualizado', state);
      });
    
    // Suscribirse a cambios de herramienta usando stateManager
    this.stateManager.currentTool
      .pipe(takeUntil(this.destroy$))
      .subscribe(tool => {
        this.activeTool = tool;
        this.logDebug(`Herramienta activa: ${tool}`);
      });
      
    // Suscribirse a cambios en elementos (usando adaptador)
    this.elementManagerAdapter.elementsChanged
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.logDebug('Elementos actualizados a través del adaptador standalone. Forzando detección de cambios y refresco del mapa.');
        this.cdr.detectChanges(); // Forzar detección de cambios en este componente
        
        if (this.mapService) {
          this.mapService.refreshElementsDisplay(); // Llamar al refresco en MapService
        }
      });
      
    // Suscribirse a cambios en banderas de características
    this.standaloneAdapter.featureFlags
      .pipe(takeUntil(this.destroy$))
      .subscribe(flags => {
        // Si no estamos forzando el modo legacy, actualizar con la bandera del servicio.
        if (this.useStandaloneComponents !== false) { 
          this.useStandaloneComponents = flags.enableStandaloneMode;
        }
        this.logDebug(`Modo standalone evaluado a: ${this.useStandaloneComponents} (Bandera servicio: ${flags.enableStandaloneMode})`);
      });

    // Suscripción al elemento individual seleccionado desde MapStateManagerService
    this.stateManager.singleSelectedElement$
      .pipe(takeUntil(this.destroy$))
      .subscribe(element => {
        if (!element || !element.id) { // Si el elemento es null/undefined o no tiene ID, no hacer nada.
          // Si estamos en modo connect y se hace clic en el mapa (no en un elemento), singleSelectedElement$ podría emitir null.
          // Si firstElementForConnection existe, y se hace clic en el vacío, podríamos querer cancelar la conexión.
          if (this.activeTool === 'connect' && this.firstElementForConnection) {
            // Opcional: Cancelar selección del primer elemento si se hace clic en vacío.
            // this.firstElementForConnection = null;
            // this.snackBar.open('Selección de conexión cancelada.', 'Cerrar', { duration: 2000 });
            // this.setTool('select'); // Volver a la herramienta de selección
          }
          return;
        }

        if (this.activeTool === 'select') {
          this.logDebug(`Elemento individual seleccionado: ${element.id}, tipo: ${element.type}. Navegando a editor.`);
          this.router.navigate(['elements/edit', element.id], { relativeTo: this.route.parent });
        } else if (this.activeTool === 'connect') {
          this.handleElementSelectionForConnection(element);
        }
      });
      
    // Simular actualización de métricas de rendimiento en intervalos regulares
    setInterval(() => {
      this.performanceMetrics = {
        fps: Math.round(Math.random() * 60),
        elementCount: Math.round(Math.random() * 1000),
        memoryUsage: Math.random() * 100,
        memoryUsageFormatted: `${Math.round(Math.random() * 100)} MB`
      };
    }, 1000);
  }
  
  ngAfterViewInit(): void {
    this.logger.debug('MapContainer ngAfterViewInit: Verificando estado de visibilidad de paneles.');
    this.logger.debug(`Current panel visibility - isMapReady: ${this.isMapReady}, showElementsPanel: ${this.showElementsPanel}, showLayerControl: ${this.showLayerControl}`);
    
    // Verificar que mapContainerRef esté disponible
    if (!this.mapContainerRef) {
      this.logger.error('MapContainer ngAfterViewInit: mapContainerRef no está disponible. No se puede inicializar el mapa.');
      this.handleError(new Error('Referencia al contenedor del mapa no disponible'), 'No se pudo acceder al contenedor del mapa');
      return;
    }
    
    // Inicializar el mapa cuando la vista está lista
    this.initializeMap();

    // --- INICIO CÓDIGO DE PRUEBA PARA CONEXIONES ---
    // Esto es solo para PRUEBAS. En la implementación final, las conexiones se crearán desde la UI.
    // Reemplaza 'ID_ELEMENTO_1_REAL' e 'ID_ELEMENTO_2_REAL' con IDs válidos de elementos existentes en tu mapa.
    const idElementoOrigen = 'ID_ELEMENTO_1_REAL'; 
    const idElementoDestino = 'ID_ELEMENTO_2_REAL';

    // Añadir una conexión de prueba después de un breve retardo para dar tiempo a que el mapa y los elementos se inicialicen.
    setTimeout(() => {
      if (idElementoOrigen !== 'ID_ELEMENTO_1_REAL' && idElementoDestino !== 'ID_ELEMENTO_2_REAL') { // Solo si los IDs placeholder fueron cambiados
        const testConnection: NetworkConnection = {
          id: `conn-${idElementoOrigen}-${idElementoDestino}-${Date.now()}`,
          sourceElementId: idElementoOrigen,
          targetElementId: idElementoDestino,
          type: ConnectionType.FIBER, // Usar ConnectionType.FIBER
          status: ConnectionStatus.ACTIVE,
          name: `Conexión ${idElementoOrigen} <-> ${idElementoDestino}`,
          // otras propiedades como capacity, utilization, etc., pueden ser opcionales
          // Asegúrate de que el objeto NetworkConnection cumple con la interfaz.
        };

    this.elementManagerAdapter.addConnection(testConnection).subscribe({
      next: (conn: NetworkConnection) => this.logger.info('[MapContainerPrueba] Conexión de prueba añadida vía adaptador:', conn),
      error: (err: any) => this.logger.error('[MapContainerPrueba] Error añadiendo conexión de prueba:', err)
    });
      } else {
        this.logger.warn('[MapContainerPrueba] Los IDs de los elementos para la conexión de prueba no fueron reemplazados. No se añadirá la conexión de prueba.');
      }
    }, 7000); // Aumentado el delay a 7 segundos
    // --- FIN CÓDIGO DE PRUEBA PARA CONEXIONES ---
  }
  
  /**
   * Manejador para cuando se selecciona un elemento
   */
  onElementSelected(element: NetworkElement | null): void {
    this.logDebug('Elemento seleccionado en MapContainer:', element);
    
    // Utilizar el método heredado de BaseMapComponent para notificar a otros componentes
    this.handleElementSelected(element);
    
    // Si no hay elemento seleccionado, solo deseleccionar
    if (!element || !element.id) {
      this.elementManagerAdapter.deselectElement();
      return;
    }
    
    // Notificar al adaptador que este elemento está seleccionado
    this.elementManagerAdapter.selectElement(element.id);
    
    // Si la herramienta activa es 'moveElement', preparar el elemento para arrastre
    if (this.activeTool === 'moveElement' as ToolType) {
      // Mostrar mensaje al usuario indicando que puede arrastrar el elemento
      this.snackBar.open(
        `Elemento "${element.name}" seleccionado. ${element.type === ElementType.MANGA ? '(MANGA)' : ''} Arrástralo en el mapa para moverlo.`, 
        'Entendido', 
        { duration: 3000 }
      );
      
      // El arrastre efectivo se inicia en onMapMouseDown cuando el usuario hace clic en el elemento
    }
    
    // Opcionalmente destacar visualmente el elemento seleccionado
    // (esto podría hacerse a través de un servicio que maneja la visualización)
    if (element.type === ElementType.MANGA) {
      this.logger.debug('Elemento MANGA seleccionado:', element);
      // Si necesitamos un tratamiento especial para MANGA aquí
    }
  }
  
  /**
   * Maneja el evento cuando el mapa ha terminado de cargar
   */
  onMapLoaded(): void {
    this.isMapReady = true;
    this.logger.debug('Mapa cargado correctamente en el componente standalone');
    this.logger.debug(`Panel visibility after map loaded - isMapReady: ${this.isMapReady}, showElementsPanel: ${this.showElementsPanel}, showLayerControl: ${this.showLayerControl}`);
    
    // Ejecutar inicializaciones que dependan del mapa cargado
    if (this.useStandaloneComponents) {
      // Configuraciones específicas para componentes standalone
      this.stateManager.setTool('pan');
    }
    
    // Marcar la carga como completa usando método heredado
    this.completeLoading();
  }
  
  /**
   * Inicializa el mapa con la configuración proporcionada
   */
  private initializeMap(): void {
    // Verificar que mapContainerRef existe y está definido
    if (!this.mapContainerRef) {
      this.logger.error('MapContainer: mapContainerRef no está definido. No se puede inicializar el mapa.');
      this.handleError(new Error('Referencia al contenedor del mapa no disponible'), 'No se pudo acceder al contenedor del mapa');
      return;
    }
    
    // Asegurarse de que el contenedor tiene dimensiones válidas
    if (!this.validateContainerDimensions(this.mapContainerRef.nativeElement)) {
      this.handleError(new Error('Contenedor de mapa inválido'), 'El contenedor del mapa no tiene dimensiones válidas');
      return;
    }
    
    // Si estamos usando componentes standalone, inicializar el componente de vista de mapa
    if (this.useStandaloneComponents) {
      this.logDebug('Usando implementación de mapa con componentes standalone');
      
      // Establecer un tiempo mínimo para la carga del mapa (mejor experiencia del usuario)
      setTimeout(() => {
        // Forzar isMapReady a true después de un breve retraso para asegurar que la UI responda
        this.isMapReady = true;
        this.cdr.detectChanges();
        this.logDebug('Mapa marcado como listo (forzado)');
      }, 1000);
      
      return;
    }
    
    // Verificar que el elemento nativo existe antes de usarlo
    if (!this.mapContainerRef.nativeElement) {
      this.logger.error('MapContainer: mapContainerRef.nativeElement no está disponible');
      this.handleError(new Error('Elemento nativo del contenedor no disponible'), 'No se pudo acceder al elemento DOM del mapa');
      return;
    }
    
    // Configurar el mapa legacy
    const mapConfig = {
      container: this.mapContainerRef.nativeElement,
      initialZoom: this.initialZoom,
      initialCenter: this.initialCenter,
      isDarkMode: this.darkMode
    };
    
    // Inicializar el mapa
    this.mapService.initialize(mapConfig);
    
    // Suscribirse al evento de mapa listo
    this.mapService.isReady$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isReady => {
        this.isMapReady = isReady;
        this.logDebug(`Mapa legacy ${isReady ? 'listo' : 'no listo'}`);
        
        if (isReady) {
          // Configurar estado inicial para el mapa legacy
          this.mapStateService.setZoom(this.initialZoom);
          this.mapStateService.setCenter(this.initialCenter);
          this.mapStateService.setActiveTool('pan' as any); // Forzar tipo para evitar error
          
          // No llamar a this.stateManager.setTool('pan') aquí si es legacy,
          // se maneja en onMapLoaded para el modo standalone
        }
      });
  }
  
  /**
   * Cambia la herramienta activa
   * @param tool Herramienta a activar
   */
  setTool(tool: ToolType): void {
    console.log('MapContainer: Cambiando herramienta a', tool);
    this.logger.info(`[MapContainer] setTool CALLED WITH: ${tool}`);
    this.stateManager.setTool(tool as ToolType);
  }
  
  /**
   * Manejador para el evento mousedown en el mapa
   */
  onMapMouseDown(event: MouseEvent): void {
    console.log('MapContainer: Evento mousedown en mapa');
    
    // Si la herramienta es 'moveElement', comprobar si hay un elemento seleccionado
    if (this.activeTool === 'moveElement' as ToolType) {
      const selectedElement = this.getSelectedElement();
      if (selectedElement) {
        // Verificar si el clic fue sobre un elemento (comprobar si el target es un marcador o elemento SVG)
        const target = event.target as HTMLElement;
        
        // Verificar si el elemento clickeado es un marcador de mapa o un elemento SVG de un elemento de red
        if (target.closest('.leaflet-marker-icon') || 
            target.closest('.network-element') || 
            target.classList.contains('network-element') ||
            target.classList.contains('leaflet-marker-icon')) {
          
          // Iniciar el arrastre del elemento seleccionado
          this.startDraggingElement(selectedElement, event);
          return; // Evitar que continúe la propagación del evento
        }
      }
    }
    
    // Implementación básica, se puede extender según las necesidades
  }
  
  onMapMouseMove(event: MouseEvent): void {
    // Implementación básica, se puede extender según las necesidades
  }
  
  onMapMouseUp(event: MouseEvent): void {
    console.log('MapContainer: Evento mouseup en mapa');
    // Implementación básica, se puede extender según las necesidades
  }
  
  async onMapClick(event: MouseEvent): Promise<void> {
    this.logger.debug(`MapContainer: Map clicked. Active tool: ${this.activeTool}`, event);

    if (this.activeTool === 'placeElement' && this.elementTypeToPlace) {
      event.stopPropagation(); 
      const leafletMapInstance = this.mapService.getMap();
      let mapPoint: L.LatLng | undefined;
      if (leafletMapInstance) {
        mapPoint = leafletMapInstance.mouseEventToLatLng(event);
      }
      if (mapPoint) {
        const coordinates = { lat: mapPoint.lat, lng: mapPoint.lng };
        this.logger.info(`Placing element of type ${this.elementTypeToPlace} at`, coordinates);
        // Abrir el editor de elementos como modal
        const dialogRef = this.dialog.open(ElementEditorComponent, {
          width: '700px',
          maxHeight: '90vh',
          data: {
            type: this.elementTypeToPlace,
            position: {
              lat: coordinates.lat,
              lng: coordinates.lng,
              coordinates: [coordinates.lng, coordinates.lat],
              type: 'Point'
            },
            isNewElement: true
          },
          panelClass: 'element-editor-dialog',
          disableClose: true
        });
        dialogRef.afterClosed().subscribe(result => {
          if (result) {
            // Crear el elemento real usando el adaptador
            // Verificar cómo viene el elemento desde el diálogo
            console.log('Resultado del diálogo:', result);
            
            // Asegurarnos de pasar el elemento correcto al adaptador
            const newElement = result.element || result;
            
            this.elementManagerAdapter.addElement(newElement);
            this.snackBar.open(`Elemento ${newElement.name} añadido.`, 'Cerrar', { duration: 3000 });
            
            // Refrescar la visualización del mapa
            setTimeout(() => {
              this.mapService.refreshElementsDisplay();
            }, 500);
          }
          this.elementTypeToPlace = null;
          this.setTool('select');
        });
      } else {
        this.logger.warn('No se pudieron obtener coordenadas del clic del mapa para colocar elemento (MapService.getMap() o mouseEventToLatLng falló).');
        this.snackBar.open('No se pudo determinar la ubicación. Intente de nuevo.', 'Cerrar', { duration: 3000 });
        this.setTool('select'); 
        this.elementTypeToPlace = null;
      }
    } else if (this.activeTool === 'connect') {
      // La lógica de conexión ahora se maneja en la suscripción de singleSelectedElement$.
      // Si se hace clic en el mapa (no en un elemento), singleSelectedElement$ emitirá null
      // y la suscripción lo manejará (potencialmente cancelando la conexión si ya hay un primer elemento).
      // No es necesario hacer nada aquí explícitamente a menos que queramos un comportamiento específico para clic en mapa vacío.
      this.logger.debug('Clic en mapa mientras la herramienta es connect. La selección de elementos la maneja singleSelectedElement$.');
    } else if (this.activeTool === 'select') {
      // Lógica existente para la herramienta de selección (o ninguna si el clic es en el mapa vacío y singleSelectedElement$ emitirá null).
      // Si se hace clic en el mapa vacío y no en un elemento, singleSelectedElement$ emitirá null, y
      // el servicio MapStateManagerService podría encargarse de deseleccionar elementos.
      // El MapService tiene un listener handleMapSelectionClick que llama a mapStateManagerService.clearSelectedElements().
    }
    // Implementar otros manejadores de click basados en activeTool si es necesario
  }
  
  private handleElementSelectionForConnection(selectedElement: NetworkElement): void {
    // Aseguramos que selectedElement y selectedElement.id existen por la guarda en la suscripción.
    // TypeScript podría no inferirlo aquí, así que una comprobación no está de más, o usar aserción no nula si estamos seguros.
    if (!selectedElement || !selectedElement.id) {
        this.logger.error('handleElementSelectionForConnection llamado con elemento inválido.');
        return;
    }

    if (!this.firstElementForConnection) {
      this.firstElementForConnection = selectedElement;
      this.logger.info(`Primer elemento para conexión seleccionado: ${selectedElement.name} (ID: ${selectedElement.id})`);
      this.snackBar.open(`Elemento origen: ${selectedElement.name}. Selecciona el elemento destino.`, 'Entendido', { duration: 3500 });
      // No es necesario llamar a this.elementManagerAdapter.selectElement(selectedElement.id) explícitamente aquí,
      // ya que singleSelectedElement$ implica que el MapStateManagerService ya lo considera seleccionado.
    } else {
      if (this.firstElementForConnection.id === selectedElement.id) {
        this.logger.warn('Se ha seleccionado el mismo elemento como origen y destino.');
        this.snackBar.open('No puedes conectar un elemento consigo mismo.', 'Cerrar', { duration: 3000 });
        // No reseteamos firstElementForConnection aquí, permitimos que el usuario elija otro segundo elemento.
        return;
      }

      const secondElementForConnection = selectedElement;
      this.logger.info(`Segundo elemento para conexión seleccionado: ${secondElementForConnection.name} (ID: ${secondElementForConnection.id})`);

      // Ahora sabemos que firstElementForConnection no es null y tiene un id.
      // Y secondElementForConnection tiene un id.
      const newConnection: NetworkConnection = {
        id: `conn-${this.firstElementForConnection.id}-${secondElementForConnection.id}-${Date.now()}`,
        sourceElementId: this.firstElementForConnection.id!, 
        targetElementId: secondElementForConnection.id!,   
        type: ConnectionType.FIBER, 
        status: ConnectionStatus.PLANNED,
        name: `Conexión ${this.firstElementForConnection.name} - ${secondElementForConnection.name}`,
        vertices: [] // Inicializar vértices como un array vacío
      };

      this.elementManagerAdapter.addConnection(newConnection).subscribe({
        next: (conn) => {
          this.logger.info('Conexión creada exitosamente:', conn);
          this.snackBar.open(`Conexión creada: ${conn.name}`, 'Cerrar', { duration: 3000 });
          this.mapService.refreshElementsDisplay(); // Usar el método existente en MapService
        },
        error: (err) => {
          this.logger.error('Error al crear la conexión:', err);
          this.snackBar.open('Error al crear la conexión.', 'Cerrar', { duration: 3000, panelClass: 'error-snackbar' });
        },
        complete: () => {
          this.firstElementForConnection = null;
          this.setTool('select'); // Volver a la herramienta de selección por defecto
          // MapStateManagerService debería manejar la deselección del último elemento clickeado si es necesario.
        }
      });
    }
  }
  
  onMapDoubleClick(event: MouseEvent): void {
    console.log('MapContainer: Evento dblclick en mapa');
    
    // Solo procesar el doble clic si la herramienta activa es 'select'
    if (this.activeTool !== 'select') {
      return;
    }
    
    // Obtener el elemento del DOM que recibió el clic
    const target = event.target as HTMLElement;
    
    // Verificar si el doble clic fue sobre un elemento de red
    const isNetworkElement = target.closest('.network-element') || 
                            target.classList.contains('network-element') ||
                            target.closest('.leaflet-marker-icon') ||
                            target.classList.contains('leaflet-marker-icon');
    
    if (isNetworkElement) {
      // Obtener el elemento seleccionado actualmente
      const selectedElement = this.getSelectedElement();
      
      if (selectedElement) {
        this.logger.info(`Elemento seleccionado para edición mediante doble clic: ${selectedElement.id} (${selectedElement.type})`);
        
        // Abrir el editor de elementos en modo de edición
        const dialogRef = this.dialog.open(ElementEditorComponent, {
          width: '700px',
          maxHeight: '90vh',
          data: {
            element: selectedElement,
            isNewElement: false
          },
          panelClass: 'element-editor-dialog',
          disableClose: false
        });
        
        dialogRef.afterClosed().subscribe(result => {
          if (result) {
            // Actualizar el elemento a través del adaptador
            const updatedElement = result.element || result;
            const success = this.elementManagerAdapter.updateElement(updatedElement);
            
            if (success) {
              this.snackBar.open(`Elemento ${updatedElement.name} actualizado.`, 'Cerrar', { duration: 3000 });
              // Refrescar la visualización del mapa
              this.mapService.refreshElementsDisplay();
            } else {
              this.snackBar.open('Error al actualizar el elemento.', 'Cerrar', { 
                duration: 3000,
                panelClass: 'error-snackbar'
              });
            }
          }
        });
      } else {
        this.logger.warn('Doble clic sobre elemento pero no hay elemento seleccionado actualmente.');
      }
    }
  }
  
  /**
   * Centra el mapa en las coordenadas especificadas
   * @param coordinates Coordenadas [lng, lat]
   */
  centerMap(coordinates: [number, number] | undefined): void {
    console.log('MapContainer: Solicitud para centrar mapa en', coordinates);
    if (coordinates) {
      if (this.useStandaloneComponents) {
        if (this.mapViewComponent) {
          this.mapViewComponent.centerMap(coordinates);
          this.logger.debug('Centering map via MapViewComponent', coordinates);
        } else {
          this.logger.warn('MapViewComponent not available to center map.');
        }
      } else {
        this.mapStateService.setCenter(coordinates);
      }
    }
  }
  
  /**
   * Cambia el nivel de zoom
   * @param value Valor de cambio de zoom (positivo: aumentar, negativo: disminuir)
   */
  setZoom(value: number): void {
    console.log('MapContainer: Cambiando zoom en', value);
    if (this.useStandaloneComponents) {
      if (this.mapViewComponent) {
        if (value > 0) {
          this.mapViewComponent.zoomIn();
        } else if (value < 0) {
          this.mapViewComponent.zoomOut();
        }
      } else {
        this.logger.warn('MapViewComponent not available to set zoom.');
      }
    } else {
      // Usar directamente el valor de cambio con el servicio legacy
      const currentLegacyZoom = this.mapStateService.getState().zoom || this.initialZoom;
      let newLegacyZoom = currentLegacyZoom;
      if (value > 0) {
        newLegacyZoom = currentLegacyZoom + 1;
      } else if (value < 0) {
        newLegacyZoom = Math.max(1, currentLegacyZoom - 1);
      }
      this.mapStateService.setZoom(newLegacyZoom);
    }
  }
  
  /**
   * Selecciona un elemento por su ID
   * @param elementId ID del elemento a seleccionar
   */
  selectElement(elementId: string): void {
    this.elementManagerAdapter.selectElement(elementId);
  }
  
  /**
   * Deselecciona el elemento actual
   */
  deselectElement(): void {
    this.elementManagerAdapter.deselectElement();
  }
  
  /**
   * Obtiene el elemento seleccionado actualmente
   */
  getSelectedElement(): NetworkElement | null {
    return this.elementManagerAdapter.getSelectedElement();
  }
  
  /**
   * Verifica la consistencia de la implementación del componente
   * Detecta posibles problemas con herencia de componentes base
   */
  private validateComponentConsistency(): void {
    // Verificar que los componentes hijo implementen correctamente BaseMapComponent
    this.zone.runOutsideAngular(() => {
      setTimeout(() => {
        this.logDebug('Verificación de consistencia completada: MapContainerComponent ahora extiende de BaseMapComponent');
      }, 0);
    });
  }
  
  // Viewport actual para el minimapa
  get currentViewport(): { minX: number; minY: number; maxX: number; maxY: number } | null {
    const bounds = this.mapStateService.getState().bounds;
    if (!bounds) return null;
    
    // Convertir los límites de Leaflet [[minLng, minLat], [maxLng, maxLat]] a formato MiniMapViewport
    return {
      minX: bounds[0][0], // minLng
      minY: bounds[0][1], // minLat
      maxX: bounds[1][0], // maxLng
      maxY: bounds[1][1]  // maxLat
    };
  }

  // Métodos para manejar eventos de la barra de herramientas
  onAddElement(elementType: ElementType): void {
    this.logger.debug(`MapContainer: Solicitud para iniciar la colocación del elemento tipo: ${elementType}`);
    if (elementType) {
      this.elementTypeToPlace = elementType;
      this.setTool('placeElement' as ToolType); 
      this.snackBar.open(`Modo "Colocar ${ELEMENT_LABELS[elementType] || elementType}" activado. Haz clic en el mapa.`, 'Entendido', { duration: 3500 });
    } else {
      this.logger.warn('onAddElement llamado sin elementType');
    }
  }

  onToggleLayer(layerType: ElementType): void {
    console.log('MapContainer: Procesando solicitud para alternar capa', layerType, new Date().toISOString());
    this.logDebug('MapContainer: Procesando solicitud para alternar capa', layerType);
    
    try {
      // Usar el servicio de eventos para notificar el cambio de capa
      this.mapEventsService.toggleLayer(layerType, true);
      
      // Actualizar UI si es necesario
      this.cdr.detectChanges();
    } catch (error) {
      this.logger.error('Error al alternar capa', error);
    }
  }

  onExportMap(): void {
    console.log('MapContainer: Procesando solicitud para exportar mapa', new Date().toISOString());
    this.logDebug('MapContainer: Procesando solicitud para exportar mapa');
    
    try {
      // Mostrar indicador de carga
      this.snackBar.open('Preparando exportación del mapa...', '', { 
        duration: 2000 
      });
      
      // Obtener el elemento DOM que contiene el mapa (simplificado)
      const mapElement = document.querySelector('.map-container') || document.getElementById('map');
      
      if (!mapElement) {
        throw new Error('No se pudo encontrar el elemento del mapa para exportar');
      }
      
      // Configuración de html2canvas
      const options = {
        useCORS: true, // Permitir imágenes de otros dominios
        allowTaint: true, // Permitir imágenes que pueden "contaminar" el canvas
        backgroundColor: this.darkMode ? '#303030' : '#f5f5f5',
        scale: 2, // Mejor calidad (2x)
        logging: false, // Desactivar logs en producción
      };
      
      // Generar canvas desde el elemento del mapa
      // Asegurarse de que el elemento es un HTMLElement como requiere html2canvas
      if (mapElement instanceof HTMLElement) {
        // Cargar html2canvas dinámicamente
        this.loadHtml2Canvas().then(html2canvas => {
          html2canvas(mapElement, options).then(canvas => {
          // Añadir metadatos
          this.addMapMetadata(canvas);
          
          // Mostrar diálogo para guardar/compartir la imagen
          this.showExportDialog(canvas);
        }).catch(error => {
          this.logger.error('Error al generar imagen del mapa', error);
          this.snackBar.open('Error al exportar el mapa: ' + error.message, 'Cerrar', {
            duration: 5000,
            panelClass: 'error-snackbar'
          });
        });
        }).catch(loadError => {
          this.logger.error('Error al cargar html2canvas', loadError);
          this.snackBar.open('Error al cargar la librería de exportación', 'Cerrar', {
            duration: 5000,
            panelClass: 'error-snackbar'
          });
        });
      }
    } catch (error) {
      this.logger.error('Error al iniciar exportación del mapa', error);
      this.snackBar.open('Error al iniciar exportación del mapa', 'Cerrar', {
        duration: 5000,
        panelClass: 'error-snackbar'
      });
    }
  }
  
  /**
   * Añade metadatos al canvas exportado (escala, coordenadas, etc.)
   */
  private addMapMetadata(canvas: HTMLCanvasElement): void {
    try {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      // Guardar estado actual del contexto
      ctx.save();
      
      // Configurar estilo para metadatos
      ctx.fillStyle = this.darkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.7)';
      ctx.font = 'bold 14px Arial';
      
      // Obtener datos actuales del mapa
      const currentZoom = this.mapStateService.getState().zoom || this.initialZoom;
      const currentCenter = this.mapStateService.getState().center || this.initialCenter;
      
      // Añadir fecha y hora
      const dateStr = new Date().toLocaleString();
      ctx.fillText(`Exportado: ${dateStr}`, 10, canvas.height - 60);
      
      // Añadir escala/zoom
      ctx.fillText(`Zoom: ${currentZoom}`, 10, canvas.height - 40);
      
      // Añadir coordenadas centrales
      if (currentCenter && currentCenter.length === 2) {
        const lat = currentCenter[0].toFixed(6);
        const lng = currentCenter[1].toFixed(6);
        ctx.fillText(`Centro: ${lat}, ${lng}`, 10, canvas.height - 20);
      }
      
      // Restaurar estado del contexto
      ctx.restore();
    } catch (error) {
      this.logger.error('Error al añadir metadatos a la exportación', error);
    }
  }
  
  /**
   * Muestra un diálogo para guardar/compartir la imagen exportada
   */
  private showExportDialog(canvas: HTMLCanvasElement): void {
    try {
      // Convertir canvas a blob
      canvas.toBlob((blob) => {
        if (!blob) {
          throw new Error('No se pudo convertir la imagen para exportar');
        }
        
        // Crear URL para la imagen
        const imageUrl = URL.createObjectURL(blob);
        
        // Opciones disponibles para el usuario
        const options = [
          { label: 'Descargar PNG', action: () => this.downloadImage(imageUrl, 'mapa-de-red.png') },
          { label: 'Copiar al portapapeles', action: () => this.copyToClipboard(canvas) },
          { label: 'Compartir...', action: () => this.shareImage(blob) }
        ];
        
        // Mostrar opciones al usuario (aquí se debería mostrar un diálogo real)
        // Por ahora, simplemente descargamos la imagen directamente
        this.downloadImage(imageUrl, 'mapa-de-red.png');
        
        this.snackBar.open('Mapa exportado con éxito', 'Cerrar', {
          duration: 3000
        });
      }, 'image/png');
    } catch (error) {
      this.logger.error('Error al mostrar diálogo de exportación', error);
      this.snackBar.open('Error al finalizar la exportación del mapa', 'Cerrar', {
        duration: 5000,
        panelClass: 'error-snackbar'
      });
    }
  }
  
  /**
   * Descarga la imagen como archivo
   */
  private downloadImage(imageUrl: string, filename: string): void {
    try {
      // Crear enlace para descargar
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = filename;
      link.style.display = 'none';
      
      // Añadir al DOM, hacer clic y eliminar
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Liberar URL
      setTimeout(() => URL.revokeObjectURL(imageUrl), 100);
    } catch (error) {
      this.logger.error('Error al descargar imagen', error);
      this.snackBar.open('Error al descargar imagen', 'Cerrar', {
        duration: 3000
      });
    }
  }
  
  /**
   * Copia la imagen al portapapeles
   */
  private copyToClipboard(canvas: HTMLCanvasElement): void {
    try {
      canvas.toBlob(async (blob) => {
        if (!blob) {
          throw new Error('No se pudo convertir la imagen para copiar');
        }
        
        // Intentar copiar al portapapeles usando la API de Clipboard
        if (navigator.clipboard && navigator.clipboard.write) {
          const item = new ClipboardItem({
            [blob.type]: blob
          });
          await navigator.clipboard.write([item]);
          this.snackBar.open('Imagen copiada al portapapeles', 'Cerrar', {
            duration: 2000
          });
        } else {
          // Fallback para navegadores que no soportan la API de Clipboard
          const img = document.createElement('img');
          img.src = canvas.toDataURL();
          document.body.appendChild(img);
          const selection = window.getSelection();
          const range = document.createRange();
          range.selectNode(img);
          selection?.removeAllRanges();
          selection?.addRange(range);
          document.execCommand('copy');
          document.body.removeChild(img);
          
          this.snackBar.open('Imagen copiada al portapapeles (modo compatible)', 'Cerrar', {
            duration: 2000
          });
        }
      });
    } catch (error) {
      this.logger.error('Error al copiar al portapapeles', error);
      this.snackBar.open('No se pudo copiar la imagen al portapapeles', 'Cerrar', {
        duration: 3000
      });
    }
  }
  
  /**
   * Comparte la imagen usando la API Web Share si está disponible
   */
  private shareImage(blob: Blob): void {
    try {
      // Verificar si la API Web Share está disponible
      if (navigator.share) {
        const file = new File([blob], 'mapa-de-red.png', { type: 'image/png' });
        
        navigator.share({
          title: 'Mapa de Red',
          text: 'Mapa de Red exportado desde la aplicación',
          files: [file]
        }).then(() => {
          this.snackBar.open('Mapa compartido con éxito', 'Cerrar', {
            duration: 2000
          });
        }).catch((error) => {
          // El usuario puede cancelar la acción de compartir
          if (error.name !== 'AbortError') {
            this.logger.error('Error al compartir', error);
            this.snackBar.open('Error al compartir: ' + error.message, 'Cerrar', {
              duration: 3000
            });
          }
        });
      } else {
        this.snackBar.open('Tu navegador no admite compartir imágenes directamente', 'Cerrar', {
          duration: 3000
        });
      }
    } catch (error) {
      this.logger.error('Error al compartir imagen', error);
      this.snackBar.open('Error al compartir imagen', 'Cerrar', {
        duration: 3000
      });
    }
  }

  onOpenSettings(): void {
    console.log('MapContainer: Procesando solicitud para abrir configuración', new Date().toISOString());
    this.logDebug('MapContainer: Procesando solicitud para abrir configuración');
    // Implementar lógica para abrir configuración
    // Por ejemplo, navegar a la ruta de configuración o abrir un diálogo
    this.router.navigate(['network-design', 'settings'], { 
      relativeTo: this.route,
      queryParams: { returnUrl: this.router.url } 
    });
  }

  onToggleSearchWidget(): void {
    console.log('MapContainer: Procesando solicitud para alternar widget de búsqueda', new Date().toISOString());
    this.logDebug('MapContainer: Procesando solicitud para alternar widget de búsqueda');
    this.showSearchWidget = !this.showSearchWidget;
    this.cdr.detectChanges();
  }

  onToggleElementsPanel(): void {
    console.log('MapContainer: Procesando solicitud para alternar panel de elementos', new Date().toISOString());
    this.logDebug('MapContainer: Procesando solicitud para alternar panel de elementos');
    this.showElementsPanel = !this.showElementsPanel;
    this.cdr.detectChanges();
  }

  onDiagnosticClick(): void {
    console.log('MapContainer: Procesando solicitud para diagnóstico', new Date().toISOString());
    this.logDebug('MapContainer: Procesando solicitud para diagnóstico');
    // Implementar lógica para diagnóstico
    this.router.navigate(['network-design', 'diagnostic'], { 
      relativeTo: this.route 
    });
  }

  onHelpClick(): void {
    console.log('MapContainer: Procesando solicitud para ayuda', new Date().toISOString());
    this.logDebug('MapContainer: Procesando solicitud para ayuda');
    // Implementar lógica para mostrar ayuda
    // Por ejemplo, abrir un diálogo de ayuda
    const dialogConfig = {
      width: '80%',
      maxWidth: '800px',
      maxHeight: '80vh',
      data: { 
        section: 'map',
        context: this.activeTool
      }
    };
    
    // Aquí iría el código para abrir un diálogo, por ejemplo:
    // this.dialog.open(HelpDialogComponent, dialogConfig);
    
    // O simplemente navegar a la página de ayuda
    this.router.navigate(['help', 'map'], { 
      queryParams: { tool: this.activeTool } 
    });
  }

  /**
   * Método auxiliar para obtener elementos seleccionados de manera segura
   * para evitar errores de tipo con valores nulos
   */
  getSelectedElementsForToolbar(): NetworkElement[] {
    const selectedElement = this.elementManagerAdapter.getSelectedElement();
    return selectedElement ? [selectedElement] : [];
  }

  /**
   * Maneja el cambio de la capa base desde LayerControlComponent.
   * @param layer La capa base seleccionada.
   */
  onBaseLayerChanged(layer: LayerEntry): void {
    if (this.useStandaloneComponents) {
      this.logger.warn('El cambio de capa base no está implementado para el modo standalone en MapContainerComponent.');
      // Aquí se podría interactuar con mapViewComponent si tuviera una API para cambiar su "fondo" o "capa base".
      return;
    }

    if (layer && layer.id) {
      this.logger.debug(`MapContainer: Solicitud para cambiar capa base a: ${layer.id} (${layer.name})`);
      this.mapService.setBaseLayer(layer.id);
    } else {
      this.logger.warn('MapContainer: Se recibió un evento baseLayerChanged sin un ID de capa válido.', layer);
    }
  }

  /**
   * Maneja la solicitud para preparar el modo offline.
   * @param requested Indica si se solicita activar (true) o desactivar (false) el modo offline.
   */
  onPrepareOfflineModeRequest(requested: boolean): void {
    console.log(`MapContainer: Solicitud para modo offline: ${requested}`, new Date().toISOString());
    this.logDebug(`MapContainer: Solicitud para modo offline: ${requested}`);
    // Aquí iría la lógica para manejar la preparación del modo offline,
    // por ejemplo, interactuar con OfflineService o MapService para descargar tiles/datos.
    if (requested) {
      this.snackBar.open('Iniciando preparación para modo offline...', 'Entendido', { duration: 3000 });
      // this.offlineService.prepareDataForOfflineUse(); // Ejemplo
    } else {
      this.snackBar.open('Cancelando preparación para modo offline / Volviendo a modo online.', 'Entendido', { duration: 3000 });
      // this.offlineService.switchToOnlineMode(); // Ejemplo
    }
    this.cdr.detectChanges(); // Notificar cambios si es necesario
  }

  /**
   * Maneja el evento de inicio de arrastre de un elemento seleccionado
   * @param element Elemento seleccionado
   * @param event Evento del mouse
   */
  startDraggingElement(element: NetworkElement, event: MouseEvent): void {
    // Solo permitir arrastrar si la herramienta es 'moveElement'
    if (this.activeTool !== 'moveElement' as ToolType || !element || !element.id) {
      return;
    }

    const elementId = element.id;
    if (!elementId) {
      this.logger.warn('No se puede iniciar el arrastre: el elemento no tiene ID');
      return;
    }

    this.logger.debug(`Iniciando arrastre del elemento: ${elementId}`);
    
    // Obtener la posición inicial del mouse en coordenadas del mapa
    const leafletMapInstance = this.mapService.getMap();
    if (!leafletMapInstance) return;
    
    const startPosition = leafletMapInstance.mouseEventToLatLng(event);
    this.mapEventsService.dragStarted(elementId, { 
      x: startPosition.lng, 
      y: startPosition.lat 
    });
    
    // Crear manejadores de eventos para seguir el movimiento y finalizar el arrastre
    const moveHandler = (moveEvent: MouseEvent) => {
      if (!leafletMapInstance) return;
      
      const newPosition = leafletMapInstance.mouseEventToLatLng(moveEvent);
      this.updateElementPositionDuringDrag(elementId, newPosition.lng, newPosition.lat);
    };
    
    const upHandler = (upEvent: MouseEvent) => {
      if (!leafletMapInstance) return;
      
      const endPosition = leafletMapInstance.mouseEventToLatLng(upEvent);
      this.finalizeElementDrag(elementId, endPosition.lng, endPosition.lat);
      
      // Eliminar los manejadores de eventos
      document.removeEventListener('mousemove', moveHandler);
      document.removeEventListener('mouseup', upHandler);
    };
    
    // Añadir los manejadores al documento
    document.addEventListener('mousemove', moveHandler);
    document.addEventListener('mouseup', upHandler);
    
    // Prevenir comportamiento predeterminado del navegador
    event.preventDefault();
    event.stopPropagation();
  }
  
  /**
   * Actualiza la posición del elemento durante el arrastre
   * @param elementId ID del elemento
   * @param lng Longitud (coordenada X)
   * @param lat Latitud (coordenada Y)
   */
  updateElementPositionDuringDrag(elementId: string, lng: number, lat: number): void {
    // Actualizar la posición visual del elemento en el mapa
    // Esto es solo visual, no se guarda en la base de datos hasta que termine el arrastre
    this.mapService.updateElementPreviewPosition(elementId, lng, lat);
  }
  
  /**
   * Finaliza el arrastre de un elemento y guarda su nueva posición
   * @param elementId ID del elemento
   * @param lng Longitud (coordenada X)
   * @param lat Latitud (coordenada Y)
   */
  finalizeElementDrag(elementId: string, lng: number, lat: number): void {
    this.logger.debug(`Finalizando arrastre del elemento: ${elementId} en posición [${lat}, ${lng}]`);
    
    // Emitir evento de fin de arrastre
    this.mapEventsService.dragEnded(elementId, { x: lng, y: lat });
    
    // Actualizar la posición del elemento a través del adaptador
    this.elementManagerAdapter.updateElementPosition(elementId, lng, lat);
    
    // Mostrar mensaje de confirmación
    this.snackBar.open('Posición del elemento actualizada', 'Cerrar', { duration: 2000 });
    
    // Refrescar la visualización del mapa
    setTimeout(() => {
      this.mapService.refreshElementsDisplay();
    }, 100);
  }
}
