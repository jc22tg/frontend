/**
 * @description Componente principal del módulo de diseño de red
 * @author Tu Nombre
 * @version 1.0.0
 */
import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, RouterOutlet, ActivatedRoute, NavigationEnd } from '@angular/router';
import { NetworkDesignService } from './services/network-design.service';
import { NetworkStateService } from './services/network-state.service';
import { MapService } from './services/map.service';
import { ElementType, NetworkElement, NetworkConnection, GeographicPosition } from '../../shared/types/network.types';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { catchError, finalize, take, filter, map, takeUntil, tap } from 'rxjs/operators';
import { of, Subject, Observable } from 'rxjs';
import { LoggerService } from '../../core/services/logger.service';
import { trigger, transition, style, animate, query, group } from '@angular/animations';
import { ElementQuickViewComponent } from './components/element-quick-view/element-quick-view.component';
import { HelpDialogService } from './services/help-dialog.service';
import { NetworkMapDialogService } from './services/network-map-dialog.service';
import { NetworkEventBusService, NetworkEventType } from './services/network-event-bus.service';

/**
 * Componente principal para el diseño de la red de fibra óptica.
 *
 * Este componente proporciona una interfaz para visualizar y editar la red de fibra óptica,
 * incluyendo un mapa interactivo y un editor de elementos.
 *
 * @example
 * ```html
 * <app-network-design></app-network-design>
 * ```
 *
 * @remarks
 * El componente maneja las animaciones de transición entre diferentes vistas.
 */
@Component({
  selector: 'app-network-design',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    ElementQuickViewComponent
  ],
  templateUrl: './network-design.component.html',
  styleUrls: ['./network-design.component.scss'],
  animations: [
    trigger('routeAnimations', [
      transition('map <=> editor', [
        style({ position: 'relative' }),
        query(':enter, :leave', [
          style({
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%'
          })
        ], { optional: true }),
        query(':enter', [style({ opacity: 0 })], { optional: true }),
        group([
          query(':leave', [animate('300ms ease-out', style({ opacity: 0 }))], { optional: true }),
          query(':enter', [animate('300ms ease-in', style({ opacity: 1 }))], { optional: true })
        ])
      ]),
      transition('* <=> *', [
        style({ position: 'relative' }),
        query(':enter, :leave', [
          style({
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%'
          })
        ], { optional: true }),
        query(':enter', [style({ transform: 'translateY(20px)', opacity: 0 })], { optional: true }),
        group([
          query(':leave', [animate('200ms ease-out', style({ transform: 'translateY(-20px)', opacity: 0 }))], { optional: true }),
          query(':enter', [animate('300ms ease-in', style({ transform: 'translateY(0)', opacity: 1 }))], { optional: true })
        ])
      ])
    ])
  ]
})
export class NetworkDesignComponent implements OnInit, OnDestroy {
  @ViewChild(RouterOutlet) routerOutlet!: RouterOutlet;
  
  animationState = 'map';
  isLoading = false;
  mapVisible = true;
  selectedElement: NetworkElement | null = null;
  private destroy$ = new Subject<void>();
  showSearchWidget = true; // Control de visibilidad del widget de búsqueda
  showElementsPanel = true; // Control de visibilidad del panel de elementos

  /**
   * Constructor del componente
   * @param networkDesignService Servicio para gestionar el diseño de red
   * @param networkStateService Servicio para gestionar el estado de la red
   * @param mapService Servicio para gestionar el mapa
   * @param networkMapDialogService Servicio para gestionar el diálogo de selección de posición
   * @param router Servicio para gestionar las rutas
   * @param route Servicio para gestionar las rutas activas
   * @param snackBar Servicio para mostrar notificaciones
   * @param logger Servicio para registrar eventos y errores
   * @param eventBus Servicio para gestionar el bus de eventos de red
   */
  constructor(
    private networkDesignService: NetworkDesignService,
    private networkStateService: NetworkStateService,
    private mapService: MapService,
    private networkMapDialogService: NetworkMapDialogService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    private logger: LoggerService,
    private helpDialogService: HelpDialogService,
    private eventBus: NetworkEventBusService
  ) {
    // Detectar errores de carga y tomar medidas para recuperarse
    this.eventBus.on(NetworkEventType.MAP_ERROR).pipe(
      takeUntil(this.destroy$)
    ).subscribe(event => {
      if (event.payload?.source === 'network-data-load') {
        this.logger.error('Error detectado en carga de datos de red:', event.payload);
        // Si estamos cargando demasiado tiempo, liberar la interfaz
        if (this.isLoading) {
          this.isLoading = false;
          this.snackBar.open('Datos parciales cargados. Algunas funciones pueden estar limitadas.', 'Entendido', {
            duration: 10000,
            panelClass: ['warning-snackbar']
          });
        }
      }
    });
  }

  /**
   * Inicializa el componente y carga los datos de la red
   */
  ngOnInit(): void {
    this.logger.debug('Inicializando componente de diseño de red');
    
    // Agregar un timeout para evitar congelamiento indefinido
    const initTimeout = setTimeout(() => {
      if (this.isLoading) {
        this.isLoading = false;
        this.logger.warn('Tiempo de carga excedido. Mostrando interfaz parcial.');
        this.snackBar.open('La carga está tardando más de lo esperado. Intente refrescar la página.', 'Cerrar', {
          duration: 10000,
          panelClass: ['warning-snackbar']
        });
        
        // Notificar el timeout al event bus
        this.eventBus.emit({
          type: NetworkEventType.MAP_ERROR,
          timestamp: new Date(),
          payload: {
            source: 'network-design-component',
            error: 'timeout',
            message: 'Tiempo de carga excedido'
          }
        });
      }
    }, 15000); // 15 segundos como máximo para cargar

    try {
      // Inicializar el diseño con manejo de errores mejorado
      this.initializeDesignSafely();
      
      // Setup listener de rutas
      this.setupRouteListener();
      
      // Suscribirse a cambios de estado
      this.subscribeToStateChanges();
    } catch (error) {
      clearTimeout(initTimeout);
      this.isLoading = false;
      this.logger.error('Error crítico al inicializar el diseño de red:', error);
      this.snackBar.open('Error al cargar el diseño de red. Por favor, refresque la página.', 'Reintentar', {
        duration: 0,
        panelClass: ['error-snackbar']
      }).onAction().subscribe(() => {
        window.location.reload();
      });
      
      // Notificar el error al event bus
      this.eventBus.emit({
        type: NetworkEventType.MAP_ERROR,
        timestamp: new Date(),
        payload: {
          source: 'network-design-component',
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        }
      });
    }
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  /**
   * Escucha cambios en la ruta para actualizar el estado de animación
   */
  private setupRouteListener(): void {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      const currentRoute = this.route.firstChild;
      if (currentRoute) {
        this.animationState = currentRoute.snapshot.data['animation'] || 'map';
        this.logger.debug(`Estado de animación actualizado: ${this.animationState}`);
      }
    });
  }
  
  /**
   * Se suscribe a los cambios de estado compartido
   */
  private subscribeToStateChanges(): void {
    // Suscribirse a cambios en el elemento seleccionado
    this.networkStateService.getEditingElement()
      .pipe(takeUntil(this.destroy$))
      .subscribe(element => {
        this.selectedElement = element;
        if (element) {
          this.logger.debug(`Elemento seleccionado: ${element.name} (${element.id})`);
        }
      });
    
    // Suscribirse a cambios en la visibilidad del mapa
    this.networkStateService.getMapVisibility()
      .pipe(takeUntil(this.destroy$))
      .subscribe(visible => {
        this.mapVisible = visible;
        this.logger.debug(`Visibilidad del mapa: ${visible ? 'visible' : 'oculto'}`);
      });
    
    // Suscribirse a cambios en el modo de vista
    this.networkStateService.getCurrentViewMode()
      .pipe(takeUntil(this.destroy$))
      .subscribe(mode => {
        this.animationState = mode;
        // Sincronizar el estado con el router si es necesario
        const currentUrl = this.router.url;
        const shouldBeInEditor = mode === 'editor' && !currentUrl.includes('/editor');
        const shouldBeInMap = mode === 'map' && !currentUrl.includes('/map');
        
        if (shouldBeInEditor) {
          this.router.navigate(['editor'], { relativeTo: this.route });
        } else if (shouldBeInMap) {
          this.router.navigate(['map'], { relativeTo: this.route });
        }
      });
    
    // Suscribirse a cambios sin guardar
    this.networkStateService.getIsDirty()
      .pipe(takeUntil(this.destroy$))
      .subscribe(isDirty => {
        if (isDirty) {
          // Opcional: Mostrar algún indicador visual de cambios sin guardar
          this.logger.debug('Hay cambios sin guardar en el editor');
        }
      });
    
    // Actualizar el estado de visibilidad en el servicio
    this.networkStateService.setShowSearchWidget(this.showSearchWidget);
    this.networkStateService.setShowElementsPanel(this.showElementsPanel);
  }

  /**
   * Inicializa el diseño de red cargando los tipos de elementos principales
   * y sus conexiones desde el servidor
   * @private
   */
  private initializeDesignSafely(): void {
    this.isLoading = true;
    
    // Marcar el estado del servicio como cargando (usando NetworkState en memoria)
    const currentState = this.networkStateService.getCurrentState();
    // No podemos usar setState directamente, así que actualizamos elementos individuales
    this.networkStateService.updateCurrentTool('loading');
    
    // Tipos de elementos principales en la red
    const elementTypes = [
      ElementType.OLT, 
      ElementType.ONT,
      ElementType.ODF, // Usando ODF en lugar de FDT
      ElementType.FDP,
      ElementType.SPLITTER,
      ElementType.EDFA
    ];
    
    // MEJORA: Cargar elementos de forma progresiva por prioridad
    // Primero cargar solo los elementos críticos (OLT y SPLITTER)
    const criticalTypes = [ElementType.OLT, ElementType.SPLITTER];
    const secondaryTypes = elementTypes.filter(type => !criticalTypes.includes(type));
    
    const loadingCounter = { count: 0, total: criticalTypes.length + secondaryTypes.length + 1 }; // +1 para las conexiones
    
    // 1. Cargar conexiones con un límite de tiempo
    const connectionTimeoutId = setTimeout(() => {
      this.logger.warn('Tiempo límite excedido cargando conexiones, continuando con carga parcial');
      loadingCounter.count++;
      this.checkLoadingComplete(loadingCounter);
    }, 5000); // 5 segundos máximo para las conexiones
    
    this.networkDesignService.getConnections()
      .pipe(
        take(1),
        finalize(() => {
          clearTimeout(connectionTimeoutId);
          loadingCounter.count++;
          this.checkLoadingComplete(loadingCounter);
        }),
        catchError(error => {
          this.logger.error('Error al cargar conexiones:', error);
          this.snackBar.open('Error al cargar las conexiones de red', 'Cerrar', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
          return of([]);
        })
      )
      .subscribe(connections => {
        this.logger.info(`Conexiones cargadas: ${connections.length}`);
      });
    
    // 2. Cargar primero los elementos críticos
    this.loadElementsByTypes(criticalTypes, loadingCounter);
    
    // 3. Después cargar el resto de elementos con un retraso
    setTimeout(() => {
      this.loadElementsByTypes(secondaryTypes, loadingCounter);
    }, 3000); // 3 segundos después de iniciar, comenzar a cargar elementos secundarios
  }
  
  /**
   * Carga elementos por tipos de forma eficiente, con límites de tiempo
   */
  private loadElementsByTypes(types: ElementType[], loadingCounter: {count: number, total: number}): void {
    types.forEach(type => {
      // Establecer un límite de tiempo para cada tipo de elemento
      const timeoutId = setTimeout(() => {
        this.logger.warn(`Tiempo límite excedido cargando elementos de tipo ${type}, continuando con carga parcial`);
        loadingCounter.count++;
        this.checkLoadingComplete(loadingCounter);
      }, 4000); // 4 segundos máximo para cada tipo
      
      this.networkDesignService.getElementsByType(type)
        .pipe(
          take(1),
          finalize(() => {
            clearTimeout(timeoutId);
            loadingCounter.count++;
            this.checkLoadingComplete(loadingCounter);
          }),
          catchError(error => {
            this.logger.error(`Error al cargar elementos de tipo ${type}:`, error);
            this.snackBar.open(`Error al cargar elementos de tipo ${type}`, 'Cerrar', {
              duration: 3000,
              panelClass: ['error-snackbar']
            });
            return of([]);
          })
        )
        .subscribe(elements => {
          this.logger.info(`Elementos de tipo ${type} cargados: ${elements.length}`);
        });
    });
  }
  
  /**
   * Verifica si la carga está completa y actualiza el estado
   */
  private checkLoadingComplete(counter: {count: number, total: number}): void {
    // Si hemos cargado todos los tipos planificados, completar la carga
    if (counter.count >= counter.total) {
      this.isLoading = false;
      // Restaurar herramienta a la predeterminada
      this.networkStateService.setCurrentTool('pan');
      this.logger.info('Carga de red completada');
      
      // Notificar al event bus que la carga se completó
      this.eventBus.emit({
        type: NetworkEventType.MAP_READY,
        timestamp: new Date(),
        payload: { message: 'Carga de red completada' }
      });
    }
  }

  /**
   * Obtiene el estado actual para la animación de rutas
   */
  prepareRoute(outlet: RouterOutlet): string {
    return outlet && outlet.activatedRouteData && outlet.activatedRouteData['animation']
      ? outlet.activatedRouteData['animation']
      : 'map';
  }

  /**
   * Crea un nuevo elemento desde la vista principal
   * @param type Tipo de elemento a crear
   */
  createNewElement(type?: ElementType): void {
    const navigateParams = type ? ['editor', { type }] : ['editor'];
    this.router.navigate(navigateParams, { relativeTo: this.route });
    this.networkStateService.setCurrentViewMode('editor');
  }
  
  /**
   * Navega a la edición de un elemento existente
   * @param elementId ID del elemento a editar
   */
  editElement(elementId: string): void {
    if (!elementId) return;
    
    this.router.navigate(['editor', elementId], { relativeTo: this.route });
    this.networkStateService.setCurrentViewMode('editor');
  }
  
  /**
   * Navega a la vista de historial de un elemento
   * @param elementId ID del elemento para ver su historial
   */
  viewElementHistory(elementId: string): void {
    if (!elementId) return;
    
    this.router.navigate(['history', elementId], { relativeTo: this.route });
    this.logger.debug(`Navegando al historial del elemento: ${elementId}`);
    this.networkStateService.setCurrentViewMode('details');
  }

  /**
   * Alterna la visibilidad del widget de búsqueda
   * Función mantenida para compatibilidad aunque el botón
   * visual ha sido eliminado de la interfaz
   */
  toggleSearchWidget(): void {
    this.showSearchWidget = !this.showSearchWidget;
    this.logger.debug(`Widget de búsqueda: ${this.showSearchWidget ? 'visible' : 'oculto'}`);
    
    // Almacenar preferencia del usuario
    localStorage.setItem('searchWidgetVisible', String(this.showSearchWidget));
  }

  /**
   * Alterna la visibilidad del panel de elementos
   */
  toggleElementsPanel(): void {
    this.showElementsPanel = !this.showElementsPanel;
    this.networkStateService.setShowElementsPanel(this.showElementsPanel);
    this.logger.debug(`Panel de elementos: ${this.showElementsPanel ? 'visible' : 'oculto'}`);
  }

  /**
   * Abre el diálogo de ayuda contextual según el tipo de elemento
   * @param elementType Tipo de elemento para mostrar ayuda específica
   * @param isNewElement Indica si se está creando un nuevo elemento o editando uno existente
   */
  openHelpDialog(elementType?: ElementType, isNewElement = true): void {
    if (elementType) {
      this.helpDialogService.openHelpDialog(elementType, isNewElement);
      this.logger.debug(`Mostrando ayuda para: ${elementType}`);
    } else {
      this.helpDialogService.openGeneralHelp();
      this.logger.debug('Mostrando ayuda general de diseño de red');
    }
  }

  /**
   * Maneja el evento cuando se selecciona un elemento en el mapa
   * Este método es utilizado por MapContainerComponent
   * @param element Elemento seleccionado
   */
  handleElementSelected(element: NetworkElement): void {
    this.selectedElement = element;
    this.networkStateService.setSelectedElement(element);
    this.logger.debug(`Elemento seleccionado desde el mapa: ${element.name} (${element.id})`);
  }

  /**
   * Maneja el evento cuando se selecciona una conexión en el mapa
   * Este método es utilizado por MapContainerComponent
   * @param connection Conexión seleccionada
   */
  handleConnectionSelected(connection: NetworkConnection): void {
    this.networkStateService.setSelectedConnection(connection);
    this.logger.debug(`Conexión seleccionada desde el mapa con ID: ${connection.id}`);
  }

  /**
   * Maneja la solicitud de editar un elemento desde el mapa
   * Este método es utilizado por MapContainerComponent
   * @param element Elemento a editar
   */
  handleEditElementRequest(element: NetworkElement): void {
    this.editElement(element.id);
  }

  /**
   * Maneja la solicitud de eliminar un elemento desde el mapa
   * Este método es utilizado por MapContainerComponent
   * @param element Elemento a eliminar
   */
  handleDeleteElementRequest(element: NetworkElement): void {
    if (!element) return;

    const confirmDelete = window.confirm(`¿Está seguro de eliminar el elemento "${element.name}"?`);
    if (confirmDelete) {
      this.networkDesignService.deleteElement(element.id).subscribe({
        next: () => {
          this.snackBar.open(`Elemento "${element.name}" eliminado correctamente`, 'Cerrar', {
            duration: 3000
          });
          // Actualizar el estado para reflejar los cambios
          this.networkStateService.setHasUnsavedChanges(true);
          if (this.selectedElement?.id === element.id) {
            this.selectedElement = null;
          }
        },
        error: (error) => {
          this.logger.error('Error al eliminar elemento:', error);
          this.snackBar.open(`Error al eliminar el elemento: ${error.message || 'Error desconocido'}`, 'Cerrar', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        }
      });
    }
  }

  /**
   * Maneja cambios de estado desde el mapa
   * Este método es utilizado por MapContainerComponent
   * @param event Evento de cambio de estado
   */
  handleMapStateChanged(event: {type: string, data: any}): void {
    this.logger.debug(`Cambio de estado en el mapa: ${event.type}`, event.data);
    
    switch (event.type) {
      case 'mapReady':
        // El mapa está listo, podemos realizar operaciones adicionales si es necesario
        break;
      case 'zoomChanged':
        // Actualizar el zoom en el servicio compartido
        this.networkStateService.setZoomLevel(event.data);
        break;
      case 'layerToggled':
        // Actualizar la visibilidad de las capas
        this.networkStateService.setLayerActive(event.data.layer, event.data.active);
        break;
      // Otros casos según sea necesario
    }
  }

  /**
   * Navega a la página de diagnóstico del mapa
   */
  navigateToDiagnostic(): void {
    this.router.navigate(['diagnostic'], { relativeTo: this.route });
    this.logger.debug('Navegando a diagnóstico del mapa');
  }

  /**
   * Abre el diálogo para seleccionar una posición en el mapa
   * @param initialPosition Posición inicial opcional
   * @param options Opciones de configuración
   * @returns Observable con la posición seleccionada
   */
  openMapPositionSelector(
    initialPosition?: GeographicPosition,
    options?: {
      title?: string;
      description?: string;
      elementType?: string;
    }
  ): Observable<GeographicPosition> {
    this.logger.debug('Abriendo selector de posición en el mapa');
    
    try {
      const dialogRef = this.networkMapDialogService.openMapPositionDialog(
        initialPosition,
        options
      );
      
      return dialogRef.afterClosed().pipe(
        filter(result => !!result), // Solo continuar si hay resultado
        tap(position => {
          if (position) {
            this.logger.debug(`Posición seleccionada: [${position.coordinates[1]}, ${position.coordinates[0]}]`);
            try {
              // Actualizar estado global si es necesario
              this.networkStateService.setSelectedPosition(position);
            } catch (error) {
              this.logger.error('Error al actualizar la posición seleccionada:', error);
            }
          }
        })
      );
    } catch (error) {
      this.logger.error('Error al abrir el selector de posición:', error);
      this.snackBar.open('Error al abrir el selector de posición', 'Cerrar', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      // Devolver un observable vacío en caso de error
      return of().pipe(
        map(() => {
          throw new Error('Error al abrir el selector de posición');
        })
      );
    }
  }
}
