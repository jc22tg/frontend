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
import { ElementType, NetworkElement, NetworkConnection } from '../../shared/types/network.types';
import { GeographicPosition } from '../../shared/types/geo-position';
import { 
  MapViewMode, 
  ElementEditMode, 
  MapActionType,
  NetworkDesignState
} from './types/network-design.types';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { catchError, finalize, take, filter, map, takeUntil, tap, timeout } from 'rxjs/operators';
import { of, Subject, Observable, forkJoin } from 'rxjs';
import { LoggerService } from '../../core/services/logger.service';
import { trigger, transition, style, animate, query, group } from '@angular/animations';
import { ElementQuickViewComponent } from './components/elements/element-quick-view/element-quick-view.component';
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
  mapViewMode: MapViewMode = MapViewMode.DEFAULT;
  elementEditMode: ElementEditMode = ElementEditMode.VIEW;

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
    this.networkStateService.getMapViewMode()
      .pipe(takeUntil(this.destroy$))
      .subscribe(mode => {
        this.mapViewMode = mode;
        this.logger.debug(`Modo de vista del mapa actualizado: ${mode}`);
      });
  }

  /**
   * Inicializa el diseño de red cargando los tipos de elementos principales
   * y sus conexiones desde el servidor
   * @private
   */
  private initializeDesignSafely(): void {
    this.isLoading = true;
    this.networkStateService.updateCurrentTool('loading'); // Informar estado de carga

    const criticalElementTypes = [ElementType.OLT, ElementType.SPLITTER];
    const secondaryElementTypes = [
      ElementType.ODF, // Usando ODF en lugar de FDT
      ElementType.FDP,
      ElementType.ONT,
      ElementType.EDFA
    ];

    const initTimeoutOverall = setTimeout(() => {
      if (this.isLoading) {
        this.isLoading = false;
        this.networkStateService.setCurrentTool('pan'); // Restaurar herramienta
        this.logger.warn('Tiempo de carga general excedido. Mostrando interfaz parcial.');
        this.snackBar.open('La carga de datos está tardando más de lo esperado. Algunas funciones pueden estar limitadas.', 'Cerrar', {
          duration: 10000,
          panelClass: ['warning-snackbar']
        });
        this.eventBus.emit({
          type: NetworkEventType.MAP_ERROR,
          timestamp: new Date(),
          payload: { source: 'network-design-init', error: 'overall-timeout', message: 'Tiempo de carga general excedido' }
        });
      }
    }, 20000); // Timeout global de 20 segundos para toda la inicialización

    // 1. Observable para cargar conexiones
    const connections$ = this.networkDesignService.getConnections().pipe(
      take(1),
      timeout(5000), // Timeout específico para conexiones
      catchError(error => {
        this.logger.error('Error o timeout al cargar conexiones:', error);
        this.snackBar.open('Error al cargar las conexiones de red. Podrían no visualizarse correctamente.', 'Cerrar', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
        return of([]); // Continuar con un array vacío
      }),
      tap(connections => this.logger.info(`Conexiones cargadas: ${connections.length}`))
    );

    // 2. Función para crear observables de carga de elementos por tipo
    const createElementTypeLoadObservable = (type: ElementType, typeTimeout = 4000) => {
      return this.networkDesignService.getElementsByType(type).pipe(
        take(1),
        timeout(typeTimeout),
        catchError(error => {
          this.logger.error(`Error o timeout al cargar elementos de tipo ${type}:`, error);
          this.snackBar.open(`Error al cargar elementos de tipo ${type}.`, 'Cerrar', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
          return of([]); // Continuar con un array vacío
        }),
        tap(elements => this.logger.info(`Elementos de tipo ${type} cargados: ${elements.length}`))
      );
    };

    // 3. Crear observables para tipos de elementos críticos
    const criticalElementsLoadObservables = criticalElementTypes.map(type =>
      createElementTypeLoadObservable(type, 5000) // Un poco más de tiempo para críticos
    );

    // 4. Cargar conexiones y elementos críticos en paralelo
    forkJoin([connections$, ...criticalElementsLoadObservables]).pipe(
      takeUntil(this.destroy$) // Asegurar desuscripción si el componente se destruye
    ).subscribe({
      next: (results) => {
        // results[0] son las conexiones, results[1]... son los elementos críticos
        this.logger.info('Conexiones y elementos críticos cargados.');

        // 5. Crear observables para tipos de elementos secundarios y cargarlos
        const secondaryElementsLoadObservables = secondaryElementTypes.map(type =>
          createElementTypeLoadObservable(type)
        );

        if (secondaryElementsLoadObservables.length > 0) {
          forkJoin(secondaryElementsLoadObservables).pipe(
            takeUntil(this.destroy$)
          ).subscribe({
            next: () => {
              this.logger.info('Elementos secundarios cargados.');
              this.finalizeLoading(initTimeoutOverall);
            },
            error: (err) => { // Error en forkJoin de secundarios
              this.logger.error('Error en el bloque de carga de elementos secundarios:', err);
              this.finalizeLoading(initTimeoutOverall); // Finalizar incluso si hay errores parciales
            }
          });
        } else {
          this.finalizeLoading(initTimeoutOverall); // No hay secundarios, finalizar directamente
        }
      },
      error: (err) => { // Error en el primer forkJoin (conexiones o críticos)
        this.logger.error('Error crítico durante la carga inicial (conexiones o elementos críticos):', err);
        this.finalizeLoading(initTimeoutOverall); // Finalizar incluso si hay errores críticos
      }
    });
  }
  
  /**
   * Finaliza el proceso de carga, actualiza el estado y limpia los timeouts.
   * @param initTimeoutOverall ID del timeout global de inicialización.
   */
  private finalizeLoading(initTimeoutOverall: NodeJS.Timeout): void {
    clearTimeout(initTimeoutOverall); // Limpiar el timeout global
    if (this.isLoading) { // Solo actuar si todavía estábamos en estado de carga
      this.isLoading = false;
      this.networkStateService.setCurrentTool('pan'); // Restaurar herramienta a la predeterminada
      this.logger.info('Carga de red completada (o finalizada con errores parciales).');
      this.eventBus.emit({
        type: NetworkEventType.MAP_READY,
        timestamp: new Date(),
        payload: { message: 'Carga de red y elementos completada.' }
      });
      // Podrías querer emitir un evento diferente si hubo errores parciales
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
    this.elementEditMode = ElementEditMode.CREATE;
    if (type) {
      this.router.navigate(['element', 'new', type.toLowerCase()], { relativeTo: this.route });
    } else {
      this.router.navigate(['element', 'new'], { relativeTo: this.route });
    }
  }
  
  /**
   * Navega a la edición de un elemento existente
   * @param elementId ID del elemento a editar
   */
  editElement(elementId: string): void {
    this.elementEditMode = ElementEditMode.UPDATE;
    if (elementId) {
      this.router.navigate(['element', 'edit', elementId], { relativeTo: this.route });
    }
  }
  
  /**
   * Navega a la vista de historial de un elemento
   * @param elementId ID del elemento para ver su historial
   */
  viewElementHistory(elementId: string): void {
    if (!elementId) return;
    
    this.networkDesignService.getElementHistory(elementId)
      .pipe(
        take(1),
        catchError(error => {
          this.logger.error('Error al cargar historial de elemento:', error);
          this.snackBar.open('No se pudo cargar el historial del elemento', 'Cerrar', {
            duration: 5000
          });
          return of([]);
        })
      )
      .subscribe(history => {
        // Implementación específica para mostrar historial...
      });
  }

  /**
   * Alterna la visibilidad del widget de búsqueda
   * Función mantenida para compatibilidad aunque el botón
   * visual ha sido eliminado de la interfaz
   */
  toggleSearchWidget(): void {
    this.showSearchWidget = !this.showSearchWidget;
    this.logger.debug(`Widget de búsqueda: ${this.showSearchWidget ? 'visible' : 'oculto'}`);
    
    // Notificar al estado compartido
    this.networkStateService.updateWidgetVisibility('search', this.showSearchWidget);
  }

  /**
   * Alterna la visibilidad del panel de elementos
   */
  toggleElementsPanel(): void {
    this.showElementsPanel = !this.showElementsPanel;
    this.logger.debug(`Panel de elementos: ${this.showElementsPanel ? 'visible' : 'oculto'}`);
    
    // Notificar al estado compartido
    this.networkStateService.updateWidgetVisibility('elements-panel', this.showElementsPanel);
  }

  /**
   * Abre el diálogo de ayuda contextual según el tipo de elemento
   * @param elementType Tipo de elemento para mostrar ayuda específica
   * @param isNewElement Indica si se está creando un nuevo elemento o editando uno existente
   */
  openHelpDialog(elementType?: ElementType, isNewElement = true): void {
    (this.helpDialogService.openHelpDialog as any)({
      context: isNewElement ? 'new-element' : 'edit-element',
      elementType: elementType,
      title: `Ayuda: ${isNewElement ? 'Crear nuevo' : 'Editar'} ${elementType || 'elemento'}`,
      width: '600px'
    }).afterClosed().subscribe(result => {
      // Manejar resultado del diálogo si es necesario
    });
  }

  /**
   * Maneja el evento cuando se selecciona un elemento en el mapa
   * Este método es utilizado por MapContainerComponent
   * @param element Elemento seleccionado
   */
  handleElementSelected(element: NetworkElement): void {
    this.selectedElement = element;
    this.networkStateService.setEditingElement(element);
    this.logger.debug(`Elemento seleccionado por usuario: ${element.name} (${element.id})`);
    
    // Actualizar la URL para reflejar el elemento seleccionado sin navegar
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { elementId: element.id },
      queryParamsHandling: 'merge'
    });
  }

  /**
   * Maneja el evento cuando se selecciona una conexión en el mapa
   * Este método es utilizado por MapContainerComponent
   * @param connection Conexión seleccionada
   */
  handleConnectionSelected(connection: NetworkConnection): void {
    this.logger.debug(`Conexión seleccionada: ${connection.name} (${connection.id})`);
    
    // Mostrar detalles de la conexión o navegar a su vista detallada
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { connectionId: connection.id },
      queryParamsHandling: 'merge'
    });
  }

  /**
   * Maneja la solicitud de editar un elemento desde el mapa
   * Este método es utilizado por MapContainerComponent
   * @param element Elemento a editar
   */
  handleEditElementRequest(element: NetworkElement): void {
    if (element && element.id) {
      this.editElement(element.id);
    }
  }

  /**
   * Maneja la solicitud de eliminar un elemento desde el mapa
   * Este método es utilizado por MapContainerComponent
   * @param element Elemento a eliminar
   */
  handleDeleteElementRequest(element: NetworkElement): void {
    if (!element || !element.id) return;
    
    // Confirmar la eliminación y proceder si el usuario confirma
    const dialogRef = this.networkMapDialogService.openConfirmDialog({
      title: 'Confirmar eliminación',
      message: `¿Está seguro de eliminar el elemento "${element.name}"? Esta acción no se puede deshacer.`,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: 'warn'
    });
    
    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        if (element.id) {
          this.networkDesignService.deleteElement(element.id).pipe(
            take(1),
            catchError(error => {
              this.logger.error('Error al eliminar elemento:', error);
              this.snackBar.open('Error al eliminar el elemento. Intente nuevamente.', 'Cerrar', {
                duration: 5000,
                panelClass: ['error-snackbar']
              });
              return of(null);
            })
          ).subscribe(result => {
            if (result !== null) {
              this.snackBar.open(`Elemento "${element.name}" eliminado correctamente.`, 'Cerrar', {
                duration: 3000
              });
              // Actualizar vista o estado si es necesario
            }
          });
        }
      }
    });
  }

  /**
   * Maneja cambios de estado desde el mapa
   * Este método es utilizado por MapContainerComponent
   * @param event Evento de cambio de estado
   */
  handleMapStateChanged(event: {type: string, data: any}): void {
    switch (event.type) {
      case 'zoom':
        this.logger.debug(`Zoom del mapa cambiado a: ${event.data}`);
        break;
      
      case 'center':
        this.logger.debug(`Centro del mapa cambiado a: ${JSON.stringify(event.data)}`);
        break;
      
      case 'bounds':
        // Límites del mapa cambiados, actualizar estado si es necesario
        break;
      
      case 'layer-visibility':
        // Visibilidad de capa cambiada
        this.logger.debug(`Visibilidad de capa cambiada: ${event.data.layerId} = ${event.data.visible}`);
        break;
      
      default:
        // Otros eventos del mapa
        break;
    }
  }

  /**
   * Navega a la página de diagnóstico del mapa
   */
  navigateToDiagnostic(): void {
    this.mapViewMode = MapViewMode.DIAGNOSTIC;
    this.networkStateService.setMapViewMode(MapViewMode.DIAGNOSTIC);
    
    this.router.navigate(['diagnostic'], { 
      relativeTo: this.route,
      queryParamsHandling: 'preserve'
    });
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
    return this.networkMapDialogService.openMapPositionSelector({
      initialPosition,
      title: options?.title || 'Seleccionar ubicación',
      description: options?.description || 'Haga clic en el mapa para seleccionar la ubicación del elemento.',
      elementType: options?.elementType,
      width: '800px',
      height: '600px'
    }).afterClosed().pipe(
      filter(result => !!result),
      map(result => result as GeographicPosition)
    );
  }
}
