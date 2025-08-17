import { Component, OnInit, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { FormsModule } from '@angular/forms';
import { ElementType, CustomLayer } from '../../../../shared/types/network.types';
import { trigger, state, transition, style, animate } from '@angular/animations';
import { Subject, takeUntil, filter, Observable } from 'rxjs';
import { NetworkStateService } from '../../services/network-state.service';
import { LoggerService } from '../../../../core/services/logger.service';
import { LayerService } from '../../services/layer.service';
import { LayerManagerService } from '../../services/layer-manager.service';

@Component({
  selector: 'app-layer-manager',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatExpansionModule,
    MatTooltipModule,
    MatMenuModule,
    MatSlideToggleModule,
    MatDialogModule,
    MatDividerModule,
    FormsModule
  ],
  animations: [
    trigger('fadeInOut', [
      state('void', style({ opacity: 0, transform: 'translateY(10px)' })),
      transition(':enter', [
        animate('200ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('150ms ease-in', style({ opacity: 0, transform: 'translateY(10px)' }))
      ])
    ])
  ],
  templateUrl: './layer-manager.component.html',
  styleUrls: ['./layer-manager.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LayerManagerComponent implements OnInit, OnDestroy {
  readonly ElementType = ElementType;
  
  activeElementTypeLayers: ElementType[] = [];
  
  customLayers: CustomLayer[] = [];
  activeCustomLayers = new Set<string>();
  
  private destroy$ = new Subject<void>();
  
  constructor(
    private networkStateService: NetworkStateService,
    private logger: LoggerService,
    private dialog: MatDialog,
    private layerService: LayerService,
    private layerManagerService: LayerManagerService
  ) {}

  ngOnInit(): void {
    this.layerManagerService.getActiveLayers()
      .pipe(takeUntil(this.destroy$))
      .subscribe(activeLayers => {
        this.activeElementTypeLayers = activeLayers;
        this.logger.debug('LayerManagerComponent: ElementType layers updated.', activeLayers);
      });

    this.networkStateService.state$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        this.customLayers = state.customLayers;
        this.activeCustomLayers = state.activeCustomLayers;
        this.logger.debug('LayerManagerComponent: Custom layers and active custom layers updated from state.', 
                        { count: this.customLayers.length, activeCount: this.activeCustomLayers.size });
      });
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  isLayerActive(type: ElementType): boolean {
    return this.activeElementTypeLayers.includes(type);
  }
  
  isCustomLayerActive(id: string): boolean {
    return this.activeCustomLayers.has(id);
  }

  toggleLayer(type: ElementType): void {
    this.layerManagerService.toggleLayer(type);
  }
  
  toggleCustomLayer(id: string): void {
    this.networkStateService.toggleCustomLayer(id);
  }

  showAllLayers(): void {
    Object.values(ElementType).filter(v => typeof v === 'number').forEach((typeValue) => {
      const type = typeValue as ElementType;
      if (!this.isLayerActive(type)) {
        this.layerManagerService.toggleLayer(type);
      }
    });
    
    this.customLayers.forEach(layer => {
      if (!this.isCustomLayerActive(layer.id)) {
        this.toggleCustomLayer(layer.id);
      }
    });
  }

  hideAllLayers(): void {
    [...this.activeElementTypeLayers].forEach(type => {
      this.layerManagerService.toggleLayer(type);
    });
    
    [...this.activeCustomLayers].forEach(id => {
      this.toggleCustomLayer(id);
    });
  }

  createNewLayer(): void {
    this.layerService.openLayerDialog().pipe(
      takeUntil(this.destroy$),
      filter(result => !!result)
    ).subscribe({
      next: (layerDataFromDialog) => {
        if (layerDataFromDialog) {
          this.layerService.createLayer(layerDataFromDialog as Omit<CustomLayer, 'id'|'createdAt'|'updatedAt'>)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: newLayer => {
                this.logger.info('LayerManagerComponent: Nueva capa personalizada creada.', newLayer);
                this.networkStateService.showSnackbar('Nueva capa personalizada creada.', 'success');
              },
              error: err => {
                this.logger.error('LayerManagerComponent: Error al crear capa personalizada.', err);
                this.networkStateService.showSnackbar('Error al crear capa: ' + (err.message || 'Error desconocido'), 'error');
              }
            });
        }
      },
      error: (dialogError) => {
        this.logger.error('LayerManagerComponent: Error con diálogo de creación de capa.', dialogError);
        this.networkStateService.showSnackbar('Error al abrir formulario de capa.', 'error');
      }
    });
  }
  
  openLayerManagement(): void {
    this.logger.debug('Abriendo gestor de capas personalizadas (funcionalidad futura)');
    this.networkStateService.showSnackbar(
      'La gestión detallada de capas personalizadas estará disponible próximamente.', 
      'info'
    );
  }
} 
