import { Component, OnInit, Input, Output, EventEmitter, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
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
import { ElementType, CustomLayer } from '../../../../../shared/types/network.types';
import { trigger, state, transition, style, animate } from '@angular/animations';
import { Subject, takeUntil } from 'rxjs';
import { NetworkStateService } from '../../../services/network-state.service';
import { LoggerService } from '../../../../../core/services/logger.service';
import { ElementService } from '../../../services/element.service';

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
  template: `
    <div class="layer-manager" [@fadeInOut]>
      <h3 class="section-title">Gestión de Capas</h3>
      
      <div class="layer-groups">
        <div class="layer-group">
          <h4 class="group-title">Elementos Principales</h4>
          <div class="layer-buttons">
            <button 
              mat-raised-button 
              [color]="isLayerActive(ElementType.OLT) ? 'primary' : ''" 
              (click)="toggleLayer(ElementType.OLT)"
              matTooltip="Mostrar/ocultar OLTs"
              class="layer-button">
              <mat-icon>hub</mat-icon>
              <span>OLTs</span>
            </button>
            
            <button 
              mat-raised-button 
              [color]="isLayerActive(ElementType.ONT) ? 'primary' : ''" 
              (click)="toggleLayer(ElementType.ONT)"
              matTooltip="Mostrar/ocultar ONTs"
              class="layer-button">
              <mat-icon>devices</mat-icon>
              <span>ONTs</span>
            </button>
            
            <button 
              mat-raised-button 
              [color]="isLayerActive(ElementType.FDP) ? 'primary' : ''" 
              (click)="toggleLayer(ElementType.FDP)"
              matTooltip="Mostrar/ocultar FDPs"
              class="layer-button">
              <mat-icon>router</mat-icon>
              <span>FDPs</span>
            </button>
          </div>
        </div>
        
        <div class="layer-group">
          <h4 class="group-title">Componentes de Red</h4>
          <div class="layer-buttons">
            <button 
              mat-raised-button 
              [color]="isLayerActive(ElementType.SPLITTER) ? 'primary' : ''" 
              (click)="toggleLayer(ElementType.SPLITTER)"
              matTooltip="Mostrar/ocultar Splitters"
              class="layer-button">
              <mat-icon>call_split</mat-icon>
              <span>Splitters</span>
            </button>
            
            <button 
              mat-raised-button 
              [color]="isLayerActive(ElementType.EDFA) ? 'primary' : ''" 
              (click)="toggleLayer(ElementType.EDFA)"
              matTooltip="Mostrar/ocultar EDFAs"
              class="layer-button">
              <mat-icon>electrical_services</mat-icon>
              <span>EDFAs</span>
            </button>
            
            <button 
              mat-raised-button 
              [color]="isLayerActive(ElementType.MANGA) ? 'primary' : ''" 
              (click)="toggleLayer(ElementType.MANGA)"
              matTooltip="Mostrar/ocultar Mangas"
              class="layer-button">
              <mat-icon>cable</mat-icon>
              <span>Mangas</span>
            </button>
          </div>
        </div>
        
        <div class="layer-group">
          <h4 class="group-title">Otros Elementos</h4>
          <div class="layer-buttons">
            <button 
              mat-raised-button 
              [color]="isLayerActive(ElementType.MSAN) ? 'primary' : ''" 
              (click)="toggleLayer(ElementType.MSAN)"
              matTooltip="Mostrar/ocultar MSANs"
              class="layer-button">
              <mat-icon>device_hub</mat-icon>
              <span>MSANs</span>
            </button>
            
            <button 
              mat-raised-button 
              [color]="isLayerActive(ElementType.TERMINAL_BOX) ? 'primary' : ''" 
              (click)="toggleLayer(ElementType.TERMINAL_BOX)"
              matTooltip="Mostrar/ocultar Cajas Terminales"
              class="layer-button">
              <mat-icon>unarchive</mat-icon>
              <span>Cajas Terminales</span>
            </button>
            
            <button 
              mat-raised-button 
              [color]="isLayerActive(ElementType.ODF) ? 'primary' : ''" 
              (click)="toggleLayer(ElementType.ODF)"
              matTooltip="Mostrar/ocultar ODFs"
              class="layer-button">
              <mat-icon>dashboard</mat-icon>
              <span>ODFs</span>
            </button>
          </div>
        </div>
        
        <div class="layer-group">
          <h4 class="group-title">Conexiones</h4>
          <div class="layer-buttons">
            <button 
              mat-raised-button 
              [color]="isLayerActive(ElementType.FIBER_CONNECTION) ? 'primary' : ''" 
              (click)="toggleLayer(ElementType.FIBER_CONNECTION)"
              matTooltip="Mostrar/ocultar Conexiones de Fibra"
              class="layer-button">
              <mat-icon>timeline</mat-icon>
              <span>Fibra Óptica</span>
            </button>
            
            <button 
              mat-raised-button 
              [color]="isLayerActive(ElementType.BACKBONE_CABLE) ? 'primary' : ''" 
              (click)="toggleLayer(ElementType.BACKBONE_CABLE)"
              matTooltip="Mostrar/ocultar Backbone"
              class="layer-button">
              <mat-icon>linear_scale</mat-icon>
              <span>Backbone</span>
            </button>
          </div>
        </div>
        
        <!-- Nueva sección para capas personalizadas -->
        <div class="layer-group custom-layers" *ngIf="customLayers.length > 0">
          <div class="group-header">
            <h4 class="group-title">Capas Personalizadas</h4>
            <button mat-icon-button color="primary" matTooltip="Gestionar capas personalizadas" 
                    (click)="openLayerManagement()">
              <mat-icon>settings</mat-icon>
            </button>
          </div>
          
          <div class="layer-buttons custom-layer-list">
            <button 
              *ngFor="let layer of customLayers"
              mat-raised-button 
              [style.background-color]="isCustomLayerActive(layer.id) ? layer.color : ''"
              [style.color]="isCustomLayerActive(layer.id) ? 'white' : ''"
              (click)="toggleCustomLayer(layer.id)"
              [matTooltip]="layer.description || 'Sin descripción'"
              class="layer-button custom-layer-button">
              <mat-icon *ngIf="layer.icon">{{ layer.icon }}</mat-icon>
              <mat-icon *ngIf="!layer.icon">layers</mat-icon>
              <span>{{ layer.name }}</span>
            </button>
          </div>
        </div>
      </div>
      
      <mat-divider></mat-divider>
      
      <div class="layer-actions">
        <button mat-raised-button color="primary" (click)="showAllLayers()" matTooltip="Mostrar todas las capas">
          <mat-icon>visibility</mat-icon>
          <span>Mostrar Todo</span>
        </button>
        
        <button mat-raised-button color="warn" (click)="hideAllLayers()" matTooltip="Ocultar todas las capas">
          <mat-icon>visibility_off</mat-icon>
          <span>Ocultar Todo</span>
        </button>
        
        <button mat-raised-button (click)="createNewLayer()" matTooltip="Crear una nueva capa personalizada">
          <mat-icon>add_circle</mat-icon>
          <span>Nueva Capa</span>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .layer-manager {
      background-color: white;
      border-radius: var(--border-radius-md);
      box-shadow: var(--shadow-md);
      padding: var(--spacing-md);
      margin-bottom: var(--spacing-md);
    }
    
    .section-title {
      font-size: var(--font-size-lg);
      margin-top: 0;
      margin-bottom: var(--spacing-md);
      color: var(--primary-color);
      font-weight: 500;
      border-bottom: 1px solid #e0e0e0;
      padding-bottom: var(--spacing-sm);
    }
    
    .layer-groups {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
    }
    
    .layer-group {
      background-color: var(--background-color);
      border-radius: var(--border-radius-sm);
      padding: var(--spacing-md);
    }
    
    .group-title {
      font-size: var(--font-size-sm);
      margin-top: 0;
      margin-bottom: var(--spacing-md);
      color: var(--primary-color);
      font-weight: 500;
    }
    
    .layer-buttons {
      display: flex;
      flex-wrap: wrap;
      gap: var(--spacing-sm);
    }
    
    .layer-button {
      flex: 1 1 calc(33.33% - var(--spacing-sm));
      min-width: 100px;
      display: flex;
      align-items: center;
      justify-content: flex-start;
    }
    
    .layer-button mat-icon {
      margin-right: var(--spacing-sm);
    }
    
    .custom-layer-button {
      border-left: 4px solid;
      transition: background-color var(--transition-fast);
    }
    
    .custom-layers .group-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--spacing-md);
    }
    
    .custom-layers .group-title {
      margin-bottom: 0;
    }
    
    .custom-layer-list {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-sm);
    }
    
    .custom-layer-list .layer-button {
      flex: 1 1 100%;
    }
    
    .layer-actions {
      display: flex;
      justify-content: space-between;
      margin-top: var(--spacing-lg);
      gap: var(--spacing-sm);
    }
    
    mat-divider {
      margin: var(--spacing-md) 0;
    }
    
    @media (max-width: 768px) {
      .layer-button {
        flex: 1 1 calc(50% - var(--spacing-sm));
      }
      
      .layer-actions {
        flex-direction: column;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LayerManagerComponent implements OnInit, OnDestroy {
  @Input() activeLayers: ElementType[] = [];
  @Output() onToggleLayer = new EventEmitter<ElementType>();
  @Output() onToggleCustomLayer = new EventEmitter<string>();
  @Output() onCreateLayer = new EventEmitter<void>();
  
  readonly ElementType = ElementType;
  customLayers: CustomLayer[] = [];
  activeCustomLayers = new Set<string>();
  
  private destroy$ = new Subject<void>();
  
  constructor(
    private networkStateService: NetworkStateService,
    private logger: LoggerService,
    private dialog: MatDialog,
    private elementService: ElementService
  ) {}

  ngOnInit(): void {
    // Obtener las capas personalizadas del estado
    this.customLayers = this.networkStateService.getCustomLayers();
    this.activeCustomLayers = this.networkStateService.getCurrentState().activeCustomLayers;
    
    // Suscribirse a cambios en el estado
    this.networkStateService.state$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        this.customLayers = state.customLayers;
        this.activeCustomLayers = state.activeCustomLayers;
      });
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  isLayerActive(type: ElementType): boolean {
    return this.activeLayers.includes(type);
  }
  
  isCustomLayerActive(id: string): boolean {
    return this.activeCustomLayers.has(id);
  }

  toggleLayer(type: ElementType): void {
    this.onToggleLayer.emit(type);
  }
  
  toggleCustomLayer(id: string): void {
    this.networkStateService.toggleCustomLayer(id);
    this.onToggleCustomLayer.emit(id);
  }

  showAllLayers(): void {
    // Activar todas las capas estándar
    Object.values(ElementType).forEach(type => {
      if (!this.activeLayers.includes(type)) {
        this.onToggleLayer.emit(type);
      }
    });
    
    // Activar todas las capas personalizadas
    this.customLayers.forEach(layer => {
      if (!this.activeCustomLayers.has(layer.id)) {
        this.toggleCustomLayer(layer.id);
      }
    });
  }

  hideAllLayers(): void {
    // Desactivar todas las capas estándar
    [...this.activeLayers].forEach(type => {
      this.onToggleLayer.emit(type);
    });
    
    // Desactivar todas las capas personalizadas
    [...this.activeCustomLayers].forEach(id => {
      this.toggleCustomLayer(id);
    });
  }

  createNewLayer(): void {
    this.onCreateLayer.emit();
  }
  
  openLayerManagement(): void {
    // Aquí podríamos abrir un diálogo para gestionar (listar, editar, eliminar) las capas personalizadas
    this.logger.debug('Abriendo gestor de capas personalizadas');
    
    // Implementación simplificada - en una versión más completa, usaríamos un diálogo
    this.networkStateService.showSnackbar(
      'Gestor de capas personalizadas disponible próximamente', 
      'info'
    );
  }
} 