import { Component, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { MapContainerComponent } from '../../components/map-container/map-container.component';
import { NetworkStateService } from '../../services/network-state.service';
import { ElementType, NetworkElement, NetworkConnection, ElementStatus } from '../../../../shared/types/network.types';
import { createPosition } from '../../../../shared/types/geo-position';
import { LoggerService } from '../../../../core/services/logger.service';
import { BehaviorSubject, Observable, Subject, combineLatest, of } from 'rxjs';
import { map, takeUntil, distinctUntilChanged, startWith, take } from 'rxjs/operators';
import { MapEventsService, MapEventType, ActionCancelledEvent, MapClickedEvent, ToolChangedEvent, DragStartedEvent, DragEndedEvent, LayerToggledEvent, ElementSelectedEvent, ConnectionSelectedEvent, MapCenterChangedEvent, MapErrorEvent, MapReadyEvent, ZoomChangedEvent, MapBoundsChangedEvent } from '../../services/map-events.service';
import { LayerManagerService } from '../../services/layer-manager.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ElementService } from '../../services/element.service';
import { MapPositionService } from '../../services/map-position.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NgZone, ChangeDetectorRef } from '@angular/core';

// Lazy load el componente de diálogo para evitar circular dependencies
const ElementPropertiesDialogComponent = () => import('../../components/elements/element-properties-dialog/element-properties-dialog.component')
  .then(m => m.ElementPropertiesDialogComponent);

@Component({
  selector: 'app-network-map-page',
  standalone: true,
  imports: [
    CommonModule,
    MapContainerComponent,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule
  ],
  template: `
    <div class="network-map-container">
      <div class="loading-overlay" *ngIf="loading">
        <mat-spinner></mat-spinner>
        <p>Cargando datos del mapa...</p>
        <button 
          *ngIf="loadingTooLong" 
          mat-button 
          class="minimal-button"
          (click)="loadMinimalMode()">
          <mat-icon>speed</mat-icon>
          Cargar en modo mínimo
        </button>
      </div>
      
      <app-map-container
        #mapContainer
        [darkMode]="false"
        [showControls]="true"
        [showMiniMap]="true"
        [showLayerControl]="true"
        [initialZoom]="16"
        [initialCenter]="[19.783750, -70.676666]">
      </app-map-container>
    </div>
  `,
  styles: [`
    .network-map-container {
      height: 100%;
      width: 100%;
      position: relative;
      overflow: hidden;
    }
    
    .loading-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background-color: rgba(255, 255, 255, 0.8);
      z-index: 1000;
    }
    
    .loading-overlay p {
      margin-top: 16px;
      font-size: 18px;
      color: #333;
    }
    
    .minimal-button {
      margin-top: 20px;
      background-color: #f5f5f5;
      border: 1px solid #ccc;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NetworkMapPageComponent implements OnInit, OnDestroy {
  loading = true;
  mapReady = false;
  loadingTooLong = false;
  isMinimalMode = false;
  
  private loadingTimeout: any;
  private loadingLongTimeout: any;
  private destroy$ = new Subject<void>();
  
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private mapEventsService: MapEventsService,
    private layerManagerService: LayerManagerService,
    private logger: LoggerService,
    private elementService: ElementService,
    private positionService: MapPositionService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef,
    private networkStateService: NetworkStateService
  ) {}
  
  ngOnInit(): void {
    // Detectar si venimos de una navegación de precarga
    this.route.queryParams.pipe(take(1)).subscribe(params => {
      this.isMinimalMode = params['mode'] === 'minimal';
      const wasPreloaded = params['preloaded'] === 'true';
      
      if (wasPreloaded) {
        this.logger.info('Mapa precargado detectado, optimizando carga inicial');
      }
      
      if (this.isMinimalMode) {
        this.logger.info('Iniciando en modo mínimo para mejorar rendimiento');
      }
      
      // Si venimos de una precarga, acortar el tiempo de espera inicial
      const initialLoadTime = wasPreloaded ? 100 : 1000;
      
      // Iniciar temporizadores para la interfaz de usuario
      this.setupLoadingTimers(initialLoadTime);
      
      // Inicializar capa de eventos y escuchar cambios
      this.setupEventListeners();
    });
  }
  
  ngOnDestroy(): void {
    // Limpiar temporizadores
    clearTimeout(this.loadingTimeout);
    clearTimeout(this.loadingLongTimeout);
    
    // Limpiar suscripciones
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  /**
   * Configura los temporizadores para la interfaz de carga
   */
  private setupLoadingTimers(initialDelay: number): void {
    // Temporizador para ocultar pantalla de carga
    this.loadingTimeout = setTimeout(() => {
      this.updateLoadingState(false);
    }, initialDelay + 15000); // 15 segundos + retraso inicial
    
    // Temporizador para mostrar opción de modo mínimo
    this.loadingLongTimeout = setTimeout(() => {
      this.ngZone.run(() => {
        this.loadingTooLong = true;
        this.cdr.markForCheck();
        
        // Mostrar mensaje de sugerencia
        this.snackBar.open('La carga está tomando más tiempo de lo esperado. Considere usar el modo mínimo.', 'Entendido', {
          duration: 8000,
          panelClass: ['warning-snackbar']
        });
      });
    }, initialDelay + 8000); // 8 segundos + retraso inicial
  }
  
  /**
   * Configura los escuchadores de eventos para el mapa
   */
  private setupEventListeners(): void {
    // Escuchar evento de mapa listo
    this.mapEventsService.getEventsByType<MapReadyEvent>(MapEventType.MAP_READY).pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.updateLoadingState(false);
      this.mapReady = true;
      this.cdr.markForCheck();
    });
    
    // Escuchar evento de error en el mapa
    this.mapEventsService.getEventsByType<MapErrorEvent>(MapEventType.MAP_ERROR).pipe(
      takeUntil(this.destroy$)
    ).subscribe((event: MapErrorEvent) => {
      this.logger.error('Error en el mapa:', event.error);
      
      // Si hay un error crítico, sugerir el modo mínimo
      this.ngZone.run(() => {
        this.loadingTooLong = true;
        this.cdr.markForCheck();
        
        this.snackBar.open('Error al cargar el mapa. ¿Desea intentar en modo mínimo?', 'Cargar', {
          duration: 10000
        }).onAction().subscribe(() => this.loadMinimalMode());
      });
    });
  }
  
  /**
   * Actualiza el estado de carga
   */
  private updateLoadingState(isLoading: boolean): void {
    this.ngZone.run(() => {
      this.loading = isLoading;
      this.cdr.markForCheck();
      
      // Limpiar temporizadores si ya no estamos cargando
      if (!isLoading) {
        clearTimeout(this.loadingTimeout);
        clearTimeout(this.loadingLongTimeout);
      }
    });
  }
  
  /**
   * Carga el mapa en modo mínimo
   */
  loadMinimalMode(): void {
    // Limpiar estado actual
    this.networkStateService.resetState();
    
    // Recargar la página con parámetro de modo mínimo
    this.router.navigate(['/network-design/map'], {
      queryParams: { mode: 'minimal' },
      replaceUrl: true
    });
  }
  
  /**
   * Maneja cambios en el estado del mapa
   */
  handleMapStateChange(event: any): void {
    this.logger.debug(`Cambio en estado del mapa: ${event.type}`);
    
    if (event.type === 'mapReady') {
      this.updateLoadingState(false);
      this.mapReady = true;
    }
  }
  
  /**
   * Maneja la selección de un elemento
   */
  handleElementSelected(element: NetworkElement): void {
    if (!element) return;
    
    this.logger.debug(`Elemento seleccionado: ${element.name} (${element.id})`);
    
    // Puedes abrir un diálogo para mostrar detalles del elemento
    if (element && element.id) {
      // Usar inyección dinámica para evitar dependencias circulares
      import('../../components/elements/element-properties-dialog/element-properties-dialog.component').then(module => {
        this.dialog.open(module.ElementPropertiesDialogComponent, {
          data: { elementId: element.id },
          width: '500px',
          autoFocus: false
        });
      });
    }
  }
  
  /**
   * Maneja la selección de una conexión
   */
  handleConnectionSelected(connection: NetworkConnection): void {
    if (!connection) return;
    
    this.logger.debug(`Conexión seleccionada: ${connection.id}`);
    
    // Mostrar notificación sobre la conexión seleccionada
    this.snackBar.open(`Conexión entre ${connection.sourceElementId} y ${connection.targetElementId}`, 'Cerrar', {
      duration: 3000
    });
  }
}
