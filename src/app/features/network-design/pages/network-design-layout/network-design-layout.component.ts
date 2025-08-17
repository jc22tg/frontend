import { Component, OnInit, OnDestroy, ViewChild, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, RouterOutlet, ActivatedRoute, NavigationEnd } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule, MatMenu } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { trigger, transition, style, animate, query, group } from '@angular/animations';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';

import { ElementQuickViewComponent } from '../../components/elements/element-quick-view/element-quick-view.component';
import { NetworkStateService } from '../../services/network-state.service';
import { LoggerService } from '../../../../core/services/logger.service';
import { ElementType, NetworkElement, NetworkConnection } from '../../../../shared/types/network.types';
import { ConnectionEditorComponent } from '../../components/connection-editor/connection-editor.component';
import { MapStateManagerService } from '../../services/map/map-state-manager.service';
import { ElementConnectionsViewComponent } from '../../components/elements/element-editor/element-connections-view.component';

@Component({
  selector: 'app-network-design-layout',
  templateUrl: './network-design-layout.component.html',
  styleUrls: ['./network-design-layout.component.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatMenuModule,
    MatDividerModule,
    ElementQuickViewComponent,
    ElementConnectionsViewComponent
  ],
  animations: [
    trigger('routeAnimations', [
      // Transición específica para el mapa
      transition('map <=> editor', [
        style({ position: 'relative' }),
        query(':enter, :leave', [
          style({
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
          })
        ], { optional: true }),
        query(':enter', [style({ opacity: 0 })], { optional: true }),
        group([
          query(':leave', [animate('200ms ease-out', style({ opacity: 0 }))], { optional: true }),
          query(':enter', [animate('200ms ease-in', style({ opacity: 1 }))], { optional: true })
        ])
      ]),
      // Transición para el resto de páginas
      transition('* <=> *', [
        style({ position: 'relative' }),
        query(':enter, :leave', [
          style({
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
          })
        ], { optional: true }),
        query(':enter', [style({ opacity: 0 })], { optional: true }),
        group([
          query(':leave', [animate('200ms ease-out', style({ opacity: 0 }))], { optional: true }),
          query(':enter', [animate('300ms ease-in', style({ opacity: 1 }))], { optional: true })
        ])
      ])
    ])
  ]
})
export class NetworkDesignLayoutComponent implements OnInit, OnDestroy {
  @ViewChild(RouterOutlet) routerOutlet!: RouterOutlet;
  @ViewChild('createMenu') createMenu!: MatMenu;
  
  // Tipos de elementos que pueden ser creados
  elementTypes = [
    { id: 'fdp', name: 'Punto de Distribución (FDP)' },
    { id: 'olt', name: 'Terminal de Línea Óptica (OLT)' },
    { id: 'ont', name: 'Terminal de Red Óptica (ONT)' },
    { id: 'edfa', name: 'Amplificador Óptico (EDFA)' },
    { id: 'splitter', name: 'Divisor Óptico (Splitter)' },
    { id: 'manga', name: 'Caja de Empalme (Manga)' },
    { id: 'fiber_connection', name: 'Conexión de Fibra' }
  ];
  
  // Variables para la gestión de la interfaz
  animationState = 'map';
  isLoading = false;
  mapVisible = true;
  selectedElement: NetworkElement | null = null;
  showElementsPanel = true;
  showConnectionsView = false;
  connectionsElementId: string | null = null;
  
  // Subject para gestionar desuscripciones
  private destroy$ = new Subject<void>();
  
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private networkStateService: NetworkStateService,
    private logger: LoggerService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private mapStateManager: MapStateManagerService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}
  
  ngOnInit(): void {
    this.setupRouteListener();
    this.subscribeToStateChanges();
    this.setupConnectionEditorSubscription();
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
        const newAnimationState = currentRoute.snapshot.data['animation'] || 'map';
        
        // Solo actualizar si hay un cambio real
        if (this.animationState !== newAnimationState) {
          // Si el nuevo estado es 'error', necesitamos manejarlo de forma especial para evitar
          // el ExpressionChangedAfterItHasBeenCheckedError
          if (newAnimationState === 'error') {
            this.ngZone.runOutsideAngular(() => {
              setTimeout(() => {
                this.animationState = newAnimationState;
                this.logger.debug(`Estado de animación actualizado: ${this.animationState}`);
                this.cdr.detectChanges();
              });
            });
          } else {
            this.animationState = newAnimationState;
            this.logger.debug(`Estado de animación actualizado: ${this.animationState}`);
          }
        }
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
    
    // También nos suscribimos a los cambios de visibilidad del panel de elementos
    this.networkStateService.getShowElementsPanel()
      .pipe(takeUntil(this.destroy$))
      .subscribe(show => {
        this.showElementsPanel = show;
      });
    
    // Inicializamos el estado
    this.networkStateService.setShowElementsPanel(true);
  }

  /**
   * Configura la suscripción para abrir el editor de conexiones
   */
  private setupConnectionEditorSubscription(): void {
    this.mapStateManager.connectionToEdit$
      .pipe(takeUntil(this.destroy$))
      .subscribe(connection => {
        this.logger.debug(`Recibido evento connectionToEdit$: ${connection ? connection.id : 'null'}`);
        if (connection) {
          this.logger.debug(`Abriendo diálogo para editar conexión: ${connection.id}`);
          this.openConnectionPropertiesDialog(connection);
          
          // Limpiar la referencia después de abrir el diálogo
          this.mapStateManager.clearConnectionToEdit();
        }
      });
  }

  /**
   * Abre el diálogo de propiedades de conexión
   */
  private openConnectionPropertiesDialog(connection: NetworkConnection): void {
    this.logger.debug(`Intentando abrir diálogo de conexión para: ${connection.id}`, connection);
    
    try {
      // Asegurar que el constructor del componente tenga data no nula
      const connectionData = {
        connection: connection || null,
        mode: 'edit' as const  // 'as const' asegura que TypeScript entienda esto como literal 'edit'
      };
      
      this.logger.debug('Datos para el diálogo:', connectionData);
      
      // Abrir el diálogo asegurándose de que todos los datos son pasados correctamente
      const dialogRef = this.dialog.open(ConnectionEditorComponent, {
        width: '600px',
        maxWidth: '95vw',
        maxHeight: '90vh',
        panelClass: 'connection-editor-dialog',
        disableClose: false,
        autoFocus: true,
        data: connectionData
      });
      
      this.logger.debug('Diálogo de conexión abierto correctamente');
      
      dialogRef.afterClosed()
        .pipe(takeUntil(this.destroy$))
        .subscribe(result => {
          this.logger.debug('Diálogo de conexión cerrado', result);
          if (result) {
            this.logger.debug('Conexión actualizada:', result);
            this.snackBar.open('Propiedades de conexión actualizadas', 'OK', {
              duration: 3000,
              panelClass: 'success-snackbar'
            });
          }
        });
    } catch (error) {
      this.logger.error('Error al abrir el diálogo de conexión:', error);
    }
  }
  
  /**
   * Determina el estado de la animación de ruta
   */
  prepareRoute(outlet: RouterOutlet): string {
    if (!outlet || !outlet.activatedRouteData) {
      return 'map';
    }
    
    // Usar setTimeout para evitar ExpressionChangedAfterItHasBeenCheckedError
    // capturando el valor actual para estabilizarlo
    const animation = outlet.activatedRouteData['animation'] || 'map';
    
    // Cuando la animación cambia a 'error', necesitamos hacerlo de forma segura
    if (animation === 'error' && this.animationState !== 'error') {
      this.ngZone.runOutsideAngular(() => {
        setTimeout(() => {
          this.animationState = animation;
          this.cdr.detectChanges();
        });
      });
    }
    
    return animation;
  }
  
  /**
   * Navega a la página de creación de un nuevo elemento del tipo especificado
   * @param typeId ID del tipo de elemento a crear
   */
  createNewElement(typeId: string): void {
    this.router.navigate(['/network-design/element', typeId, 'new']);
    this.logger.debug(`Navegando a creación de nuevo elemento: ${typeId}`);
  }

  /**
   * Método para mostrar el visor de conexiones de un elemento
   */
  openConnectionsView(elementId: string): void {
    this.connectionsElementId = elementId;
    this.showConnectionsView = true;
  }

  /**
   * Método para cerrar el visor de conexiones
   */
  closeConnectionsView(): void {
    this.showConnectionsView = false;
    this.connectionsElementId = null;
  }
} 
