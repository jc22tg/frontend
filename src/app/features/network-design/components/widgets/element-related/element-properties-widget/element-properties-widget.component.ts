import { Component, Input, OnChanges, SimpleChanges, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { NetworkElement, ElementStatus, ElementType } from '../../../../../../shared/types/network.types';
import { BaseWidgetComponent } from '../../base/base-widget.component';
import { WidgetDataService } from '../../../../services/widget-data.service';
import { fadeAnimation, slideInUpAnimation } from '../../../../../../shared/animations/common.animations';

/**
 * Widget para mostrar propiedades básicas de un elemento de red
 */
@Component({
  selector: 'app-element-properties-widget',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatDividerModule,
    MatIconModule,
    MatButtonModule
  ],
  template: `
    <div class="widget-container element-properties-widget"
         *ngIf="(widgetState$ | async)?.isVisible"
         @fadeIn>
      <div class="widget-header">
        <h3>
          <mat-icon>settings</mat-icon>
          <span>{{ title }}</span>
        </h3>
        <div class="widget-controls">
          <button mat-icon-button (click)="toggleCollapse()" *ngIf="collapsible">
            <mat-icon>{{ (widgetState$ | async)?.isCollapsed ? 'expand_more' : 'expand_less' }}</mat-icon>
          </button>
          <button mat-icon-button (click)="closeWidget()" *ngIf="closable">
            <mat-icon>close</mat-icon>
          </button>
        </div>
      </div>
      
      <div class="widget-content" *ngIf="!(widgetState$ | async)?.isCollapsed" @slideInUp>
        <div *ngIf="selectedElement; else noElement">
          <div class="element-header">
            <h4>{{ selectedElement.name }}</h4>
            <span class="element-status" [ngClass]="getStatusClass()">
              {{ getStatusLabel() }}
            </span>
          </div>
          
          <mat-divider></mat-divider>
          
          <div class="element-details">
            <div class="property-row">
              <span class="property-label">Tipo:</span>
              <span class="property-value">{{ getTypeName() }}</span>
            </div>
            <div class="property-row">
              <span class="property-label">ID:</span>
              <span class="property-value">{{ selectedElement.id }}</span>
            </div>
            <div class="property-row" *ngIf="selectedElement.description">
              <span class="property-label">Descripción:</span>
              <span class="property-value">{{ selectedElement.description }}</span>
            </div>
            <div class="property-row" *ngIf="selectedElement.position">
              <span class="property-label">Posición:</span>
              <span class="property-value">
                {{ selectedElement.position.coordinates[1] | number:'1.6-6' }}, 
                {{ selectedElement.position.coordinates[0] | number:'1.6-6' }}
              </span>
            </div>
          </div>
          
          <div class="element-actions">
            <button mat-button color="primary" (click)="onEdit()">
              <mat-icon>edit</mat-icon> Editar
            </button>
            <button mat-button color="accent" (click)="onShowDetails()">
              <mat-icon>visibility</mat-icon> Detalles
            </button>
          </div>
        </div>
        
        <ng-template #noElement>
          <div class="no-element-message">
            <mat-icon>info</mat-icon>
            <p>Seleccione un elemento para ver sus propiedades</p>
          </div>
        </ng-template>
      </div>
    </div>
  `,
  styles: [`
    @use '../../base/widget' as widget;
    
    .element-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    
    .element-header h4 {
      margin: 0;
      font-weight: 500;
    }
    
    .element-status {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
    }
    
    .status-active { background-color: #e8f5e9; color: #2e7d32; }
    .status-inactive { background-color: #f5f5f5; color: #757575; }
    .status-fault { background-color: #ffebee; color: #c62828; }
    .status-warning { background-color: #fff8e1; color: #ff8f00; }
    .status-maintenance { background-color: #e3f2fd; color: #1565c0; }
    
    .element-details {
      margin: 16px 0;
    }
    
    .property-row {
      display: flex;
      margin-bottom: 8px;
    }
    
    .property-label {
      font-weight: 500;
      width: 30%;
      color: #616161;
    }
    
    .property-value {
      flex-grow: 1;
    }
    
    .element-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-top: 16px;
    }
    
    .no-element-message {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px 16px;
      color: #9e9e9e;
    }
    
    .no-element-message mat-icon {
      margin-bottom: 12px;
      font-size: 36px;
      height: 36px;
      width: 36px;
    }
  `],
  animations: [fadeAnimation, slideInUpAnimation]
})
export class ElementPropertiesWidgetComponent extends BaseWidgetComponent implements OnInit, OnChanges {
  @Input() selectedElement: NetworkElement | null = null;
  
  // Inyectar el servicio de datos para widgets
  private widgetDataService = inject(WidgetDataService);
  
  constructor() {
    super();
    this.widgetId = 'element-properties-widget';
    this.title = 'Propiedades del Elemento';
    this.position = 'top-right';
  }
  
  ngOnInit(): void {
    super.ngOnInit();
  }
  
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedElement'] && this.selectedElement) {
      // Expandir el widget automáticamente cuando se selecciona un elemento
      if (this.isCollapsed) {
        this.widgetStateService.updateWidgetState(this.widgetId, { isCollapsed: false });
      }
      
      // Cargar datos adicionales del elemento desde el servicio si es necesario
      this.loadElementDetails();
    }
  }
  
  /**
   * Carga detalles adicionales del elemento
   */
  private loadElementDetails(): void {
    if (!this.selectedElement?.id) return;
    
    // Utilizar el servicio de datos centralizado
    this.widgetDataService.fetchElementProperties(this.selectedElement.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (elementData) => {
          // Actualizar datos si es necesario
          console.log('Datos adicionales cargados:', elementData);
        },
        error: (error) => {
          console.error('Error al cargar detalles:', error);
        }
      });
  }
  
  /**
   * Obtiene la clase CSS para el estado del elemento
   */
  getStatusClass(): string {
    if (!this.selectedElement) return '';
    
    switch (this.selectedElement.status) {
      case ElementStatus.ACTIVE:
        return 'status-active';
      case ElementStatus.INACTIVE:
        return 'status-inactive';
      case ElementStatus.FAULT:
        return 'status-fault';
      case ElementStatus.WARNING:
        return 'status-warning';
      case ElementStatus.MAINTENANCE:
        return 'status-maintenance';
      default:
        return '';
    }
  }
  
  /**
   * Obtiene la etiqueta legible del estado
   */
  getStatusLabel(): string {
    if (!this.selectedElement) return '';
    
    switch (this.selectedElement.status) {
      case ElementStatus.ACTIVE:
        return 'Activo';
      case ElementStatus.INACTIVE:
        return 'Inactivo';
      case ElementStatus.FAULT:
        return 'Fallo';
      case ElementStatus.WARNING:
        return 'Advertencia';
      case ElementStatus.MAINTENANCE:
        return 'Mantenimiento';
      case ElementStatus.PLANNED:
        return 'Planificado';
      default:
        return 'Desconocido';
    }
  }
  
  /**
   * Obtiene el nombre legible del tipo
   */
  getTypeName(): string {
    if (!this.selectedElement) return '';
    
    const typeNames: Partial<Record<ElementType, string>> = {
      [ElementType.OLT]: 'OLT',
      [ElementType.ONT]: 'ONT',
      [ElementType.SPLITTER]: 'Splitter',
      [ElementType.FDP]: 'FDP',
      [ElementType.ODF]: 'ODF',
      [ElementType.EDFA]: 'EDFA',
      [ElementType.MANGA]: 'Manga',
      [ElementType.TERMINAL_BOX]: 'Terminal Box',
      [ElementType.MSAN]: 'MSAN',
      [ElementType.FIBER_THREAD]: 'Fibra',
      [ElementType.DROP_CABLE]: 'Cable Drop',
      [ElementType.DISTRIBUTION_CABLE]: 'Cable Distribución',
      [ElementType.FEEDER_CABLE]: 'Cable Feeder',
      [ElementType.BACKBONE_CABLE]: 'Cable Backbone'
    };
    
    return typeNames[this.selectedElement.type] || String(this.selectedElement.type);
  }
  
  /**
   * Maneja el evento de edición
   */
  onEdit(): void {
    if (!this.selectedElement) return;
    
    // Emitir evento de edición (implementar en componente real)
    console.log('Editar elemento:', this.selectedElement.id);
  }
  
  /**
   * Maneja el evento de mostrar detalles
   */
  onShowDetails(): void {
    if (!this.selectedElement) return;
    
    // Emitir evento para mostrar detalles (implementar en componente real)
    console.log('Mostrar detalles de elemento:', this.selectedElement.id);
  }
} 