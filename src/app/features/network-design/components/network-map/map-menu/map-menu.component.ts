import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatBadgeModule } from '@angular/material/badge';
import { MatRippleModule } from '@angular/material/core';
import { ElementType, NetworkElement } from '../../../../../shared/types/network.types';
import { Router } from '@angular/router';
import { trigger, transition, style, animate, state } from '@angular/animations';
import { MapEventsService } from '../../../services/map-events.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { LayerManagerService } from '../../../services/layer-manager.service';

@Component({
  selector: 'app-map-menu',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
    MatDividerModule,
    MatExpansionModule,
    MatBadgeModule,
    MatRippleModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('fadeInOut', [
      state('void', style({ opacity: 0, transform: 'translateY(10px)' })),
      transition(':enter', [
        animate('200ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('150ms ease-in', style({ opacity: 0, transform: 'translateY(10px)' }))
      ])
    ]),
    trigger('expandPanel', [
      state('void', style({ height: '0', opacity: 0 })),
      transition(':enter', [
        animate('250ms cubic-bezier(0.4, 0.0, 0.2, 1)', 
          style({ height: '*', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms cubic-bezier(0.4, 0.0, 0.2, 1)', 
          style({ height: '0', opacity: 0 }))
      ])
    ])
  ],
  template: `
    <div class="map-menu" role="complementary" aria-label="Controles del mapa">
      <mat-expansion-panel expanded class="panel-theme" [@fadeInOut]>
        <mat-expansion-panel-header>
          <mat-panel-title class="panel-title">
            <mat-icon aria-hidden="true" class="panel-icon">navigation</mat-icon>
            <span>Navegación</span>
          </mat-panel-title>
        </mat-expansion-panel-header>
        
        <div class="map-controls" [@expandPanel]>
          <button mat-raised-button color="accent" 
            (click)="onCenterMap.emit()"
            matTooltip="Centrar la vista del mapa en la región principal"
            matTooltipPosition="above"
            class="control-button">
            <mat-icon aria-hidden="true">center_focus_strong</mat-icon>
            <span>Centrar</span>
          </button>
          
          <button mat-raised-button 
            (click)="onZoomIn.emit()"
            matTooltip="Acercar vista del mapa"
            matTooltipPosition="above"
            class="control-button">
            <mat-icon aria-hidden="true">zoom_in</mat-icon>
            <span>Acercar</span>
          </button>
          
          <button mat-raised-button 
            (click)="onZoomOut.emit()"
            matTooltip="Alejar vista del mapa"
            matTooltipPosition="above"
            class="control-button">
            <mat-icon aria-hidden="true">zoom_out</mat-icon>
            <span>Alejar</span>
          </button>
        </div>
      </mat-expansion-panel>
      
      <mat-expansion-panel *ngIf="selectedElement" class="panel-theme selected-element-panel" [@fadeInOut]>
        <mat-expansion-panel-header>
          <mat-panel-title class="panel-title">
            <mat-icon aria-hidden="true" class="panel-icon">settings</mat-icon>
            <span>Elemento Seleccionado</span>
          </mat-panel-title>
        </mat-expansion-panel-header>
        
        <div class="element-details-section" [@expandPanel]>
          <h4 class="element-name">{{ selectedElement.name }}</h4>
          <div class="element-actions">
            <button mat-stroked-button color="primary" (click)="editElement()"
              matTooltip="Editar elemento seleccionado"
              matTooltipPosition="above"
              class="action-button">
              <mat-icon>edit</mat-icon>
              <span>Editar</span>
            </button>
            
            <button mat-stroked-button color="accent" (click)="showElementHistory()"
              matTooltip="Ver historial de cambios"
              matTooltipPosition="above"
              class="action-button">
              <mat-icon>history</mat-icon>
              <span>Historial</span>
            </button>
            
            <button mat-stroked-button color="warn" (click)="onDeleteElement.emit(selectedElement)"
              matTooltip="Eliminar elemento seleccionado"
              matTooltipPosition="above"
              class="action-button">
              <mat-icon>delete</mat-icon>
              <span>Eliminar</span>
            </button>
          </div>
        </div>
      </mat-expansion-panel>
      
      <mat-expansion-panel class="panel-theme legend-panel" [@fadeInOut]>
        <mat-expansion-panel-header>
          <mat-panel-title class="panel-title">
            <mat-icon aria-hidden="true" class="panel-icon">info</mat-icon>
            <span>Información</span>
          </mat-panel-title>
        </mat-expansion-panel-header>
        
        <div class="info-section" [@expandPanel]>
          <div class="info-item">
            <mat-icon class="info-icon" [style.color]="'#4CAF50'">fiber_manual_record</mat-icon>
            <span>Activo</span>
          </div>
          <div class="info-item">
            <mat-icon class="info-icon" [style.color]="'#FFC107'">fiber_manual_record</mat-icon>
            <span>Advertencia</span>
          </div>
          <div class="info-item">
            <mat-icon class="info-icon" [style.color]="'#F44336'">fiber_manual_record</mat-icon>
            <span>Crítico</span>
          </div>
          <div class="info-item">
            <mat-icon class="info-icon" [style.color]="'#9E9E9E'">fiber_manual_record</mat-icon>
            <span>Inactivo</span>
          </div>
        </div>
      </mat-expansion-panel>
    </div>
  `,
  styles: [`
    .map-menu {
      background-color: rgba(255, 255, 255, 0.95);
      border-radius: var(--border-radius-md);
      box-shadow: var(--shadow-md);
      width: 100%;
      overflow: hidden;
    }
    
    .panel-theme {
      margin-bottom: var(--spacing-sm);
      border-radius: 0;
      box-shadow: none;
    }
    
    .panel-title {
      display: flex;
      align-items: center;
      font-size: var(--font-size-md);
    }
    
    .panel-icon {
      margin-right: var(--spacing-sm);
      color: var(--primary-color);
    }
    
    .map-controls {
      display: flex;
      flex-wrap: wrap;
      gap: var(--spacing-sm);
      padding: var(--spacing-sm);
    }
    
    .control-button {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .element-details-section {
      padding: var(--spacing-sm);
    }
    
    .element-name {
      font-size: var(--font-size-md);
      margin: 0 0 var(--spacing-sm) 0;
      color: var(--primary-color);
      font-weight: 500;
    }
    
    .element-actions {
      display: flex;
      flex-wrap: wrap;
      gap: var(--spacing-sm);
    }
    
    .action-button {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .info-section {
      padding: var(--spacing-sm);
    }
    
    .info-item {
      display: flex;
      align-items: center;
      margin-bottom: var(--spacing-xs);
    }
    
    .info-icon {
      margin-right: var(--spacing-sm);
    }
    
    .selected-element-panel {
      border-left: 3px solid #3f51b5;
    }
    
    /* Estilos para modo oscuro */
    :host-context(.dark-mode) .map-menu {
      background-color: rgba(48, 48, 48, 0.95);
    }
    
    :host-context(.dark-mode) .panel-title,
    :host-context(.dark-mode) .element-name {
      color: var(--dark-text-primary);
    }
    
    :host-context(.dark-mode) .panel-icon {
      color: var(--primary-color);
    }
  `]
})
export class MapMenuComponent implements OnInit, OnDestroy {
  @Input() selectedElement: NetworkElement | null = null;
  @Input() activeLayers: ElementType[] = [
    ElementType.FDP,
    ElementType.OLT,
    ElementType.ONT,
    ElementType.EDFA,
    ElementType.SPLITTER,
    ElementType.MANGA,
    ElementType.MSAN,
    ElementType.TERMINAL_BOX,
    ElementType.FIBER_CONNECTION
  ];
  
  @Output() onToggleLayer = new EventEmitter<ElementType>();
  @Output() onCenterMap = new EventEmitter<void>();
  @Output() onZoomIn = new EventEmitter<void>();
  @Output() onZoomOut = new EventEmitter<void>();
  @Output() onViewDetails = new EventEmitter<NetworkElement>();
  @Output() onDeleteElement = new EventEmitter<NetworkElement>();
  @Output() onClearSelection = new EventEmitter<void>();
  @Output() onAddElement = new EventEmitter<{type: ElementType, batch: boolean}>();
  @Output() onEditElement = new EventEmitter<NetworkElement>();
  @Output() onShowElementHistory = new EventEmitter<NetworkElement>();
  
  readonly ElementType = ElementType;
  
  private destroy$ = new Subject<void>();
  
  constructor(
    private router: Router,
    private mapEventsService: MapEventsService,
    private layerManager: LayerManagerService
  ) {}
  
  ngOnInit(): void {
    // Podemos escuchar eventos específicos si es necesario
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  isLayerActive(type: ElementType): boolean {
    return this.layerManager.isLayerActiveSync(type);
  }
  
  addElement(type: ElementType): void {
    this.onAddElement.emit({type, batch: false});
  }
  
  addElementBatch(type: ElementType): void {
    this.onAddElement.emit({type, batch: true});
  }
  
  editElement(): void {
    if (this.selectedElement) {
      this.onEditElement.emit(this.selectedElement);
      
      // Notificar el servicio centralizado de eventos
      this.mapEventsService.changeTool('edit', 'select');
    }
  }
  
  showElementHistory(): void {
    if (this.selectedElement) {
      this.onShowElementHistory.emit(this.selectedElement);
    }
  }
  
  /**
   * Maneja el zoom in en el mapa
   */
  handleZoomIn(): void {
    this.onZoomIn.emit();
  }
  
  /**
   * Maneja el zoom out en el mapa
   */
  handleZoomOut(): void {
    this.onZoomOut.emit();
  }
  
  /**
   * Maneja el centrado del mapa
   */
  handleCenterMap(): void {
    this.onCenterMap.emit();
  }
  
  /**
   * Maneja el cambio de capa
   */
  handleLayerToggle(type: ElementType): void {
    // Utilizar el servicio de gestión de capas
    this.layerManager.toggleLayer(type);
    
    // Mantener compatibilidad con eventos existentes
    this.onToggleLayer.emit(type);
  }
  
  /**
   * Maneja la visualización de detalles de un elemento
   */
  handleViewDetails(element: NetworkElement): void {
    this.onViewDetails.emit(element);
    
    // Notificar al servicio de eventos sobre la selección
    this.mapEventsService.selectElement(element);
  }
  
  /**
   * Maneja la eliminación de un elemento
   */
  handleDeleteElement(element: NetworkElement): void {
    if (confirm(`¿Está seguro de eliminar el elemento "${element.name}"?`)) {
      this.onDeleteElement.emit(element);
      
      // Notificar al servicio de eventos sobre la eliminación
      this.mapEventsService.deleteElement(element.id, element.name);
    }
  }
  
  /**
   * Maneja la limpieza de selección
   */
  handleClearSelection(): void {
    this.onClearSelection.emit();
    
    // Notificar al servicio de eventos sobre la deselección
    this.mapEventsService.selectElement(null);
    this.mapEventsService.selectConnection(null);
  }
  
  /**
   * Obtiene el icono para un tipo de elemento utilizando el servicio centralizado
   */
  getElementTypeIcon(type: ElementType): string {
    return this.layerManager.getLayerIcon(type);
  }
} 