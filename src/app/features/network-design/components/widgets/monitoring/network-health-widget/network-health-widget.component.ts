import { Component, OnInit, inject, Input, OnChanges, SimpleChanges, DestroyRef, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, of } from 'rxjs';
import { filter, tap, catchError } from 'rxjs/operators';

import { BaseWidgetComponent } from '../../base/base-widget.component';
import { WidgetDataService } from '../../../../services/widget-data.service';
import { MonitoringService } from '../../../../services/monitoring.service';
import { ElementService } from '../../../../services/element.service';
import { LoggerService } from '../../../../../../core/services/logger.service';
import { fadeAnimation, slideInUpAnimation } from '../../../../../../shared/animations/common.animations';
import { WidgetStateService } from '../../../../services/widget-state.service';
import { ErrorDisplayComponent } from '../../../../../../shared/components/error-display/error-display.component';
import { NetworkElement } from '../../../../../../shared/types/network.types';
import { ElementStatus } from 'src/app/shared/types/network.types';
import { ElementType } from 'src/app/shared/types/network.types';
import { WidgetActionEvent, WidgetErrorEvent, WidgetUpdateEvent } from '../../container/map-widgets-container/map-widgets-container.component';

interface NetworkMetrics {
  elementCount: number;
  connectionCount: number;
  utilization: number;
  health: number;
  lastUpdated?: Date;
}

interface ElementStats {
  total: number;
  active: number;
  warning: number;
  error: number;
  maintenance: number;
  inactive: number;
}

interface StatusItem {
  status: ElementStatus;
  label: string;
  count: number;
  color: string;
}

/**
 * Widget para visualizar el estado de salud de la red
 * 
 * Muestra métricas generales del estado de la red, incluyendo:
 * - Indicador de salud general
 * - Estadísticas de elementos y conexiones
 * - Distribución de elementos por estado
 * - Indicadores de elementos críticos
 */
@Component({
  selector: 'app-network-health-widget',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatChipsModule,
    ErrorDisplayComponent
  ],
  template: `
    <div class="widget-container network-health-widget" *ngIf="(widgetState$ | async)?.isVisible">
      <div class="widget-header">
        <h3>
          <mat-icon>health_and_safety</mat-icon>
          <span>{{ title }}</span>
        </h3>
        <div class="widget-controls">
          <button mat-icon-button (click)="refreshData()" matTooltip="Actualizar datos">
            <mat-icon>refresh</mat-icon>
          </button>
          <button mat-icon-button (click)="toggleCollapse()" *ngIf="collapsible" matTooltip="Colapsar">
            <mat-icon>{{ (widgetState$ | async)?.isCollapsed ? 'expand_more' : 'expand_less' }}</mat-icon>
          </button>
          <button mat-icon-button (click)="closeWidget()" *ngIf="closable" matTooltip="Cerrar">
            <mat-icon>close</mat-icon>
          </button>
        </div>
      </div>
      
      <div class="widget-content" *ngIf="!(widgetState$ | async)?.isCollapsed" [@slideInUp]>
        <!-- Indicador de carga -->
        <div *ngIf="isLoading" class="loading-container">
          <mat-spinner diameter="30"></mat-spinner>
        </div>
        
        <!-- Contenido principal -->
        <div *ngIf="!isLoading" class="health-stats-container">
          <!-- Componente de Error -->
          <app-error-display 
            *ngIf="(widgetState$ | async)?.hasError"
            [message]="(widgetState$ | async)?.errorInfo?.message || 'Error desconocido'"
            [title]="'Error en Salud de Red'"
            (retry)="refreshData()">
          </app-error-display>
          
          <!-- Métrica principal de salud -->
          <div class="health-primary">
            <div class="health-indicator" [ngClass]="getHealthColor(networkMetrics?.health || 0)">
              {{ networkMetrics?.health || 0 }}%
            </div>
            <div class="health-label">Salud General</div>
          </div>
          
          <!-- Resumen de estados -->
          <div class="status-summary">
            <div class="status-circle" 
                *ngFor="let status of statusDistribution" 
                [style.background-color]="status.color"
                [style.width.px]="calculateStatusCircleSize(status.count)"
                [style.height.px]="calculateStatusCircleSize(status.count)"
                [matTooltip]="status.label + ': ' + status.count">
            </div>
          </div>
          
          <!-- Métricas secundarias -->
          <div class="secondary-stats">
            <div class="stat-item">
              <div class="stat-value">{{ elementStats.total || 0 }}</div>
              <div class="stat-label">Elementos</div>
              <div class="stat-breakdown" *ngIf="elementStats">
                <span class="active-count">{{ elementStats.active }} activos</span>
                <span *ngIf="elementStats.warning > 0" class="warning-count">
                  {{ elementStats.warning }} alerta{{ elementStats.warning !== 1 ? 's' : '' }}
                </span>
                <span *ngIf="elementStats.error > 0" class="error-count">
                  {{ elementStats.error }} error{{ elementStats.error !== 1 ? 'es' : '' }}
                </span>
              </div>
            </div>
            
            <div class="stat-item">
              <div class="stat-value">{{ networkMetrics?.connectionCount || 0 }}</div>
              <div class="stat-label">Conexiones</div>
            </div>
            
            <div class="stat-item">
              <div class="stat-value">{{ networkMetrics?.utilization || 0 }}%</div>
              <div class="stat-label">Utilización</div>
            </div>
          </div>
          
          <!-- Elementos críticos -->
          <mat-divider></mat-divider>
          
          <div class="critical-elements" *ngIf="criticalElements.length > 0">
            <h4>Elementos críticos</h4>
            <div class="critical-list">
              <div *ngFor="let element of criticalElements" class="critical-item" [ngClass]="getStatusClass(element.status)">
                <mat-icon class="element-type-icon">{{ getElementTypeIcon(element.type) }}</mat-icon>
                <div class="element-details">
                  <div class="element-name">{{ element.name }}</div>
                  <div class="element-status">{{ getStatusLabel(element.status) }}</div>
                </div>
                <mat-icon class="status-icon">{{ getStatusIcon(element.status) }}</mat-icon>
              </div>
            </div>
          </div>
          
          <!-- Información de última actualización -->
          <div class="last-updated" *ngIf="networkMetrics?.lastUpdated">
            <mat-icon>update</mat-icon>
            Actualizado: {{ formatTime(networkMetrics?.lastUpdated) }}
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .network-health-widget {
      min-width: 280px;
      max-width: 350px;
    }
    
    .loading-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 200px;
    }
    
    .health-stats-container {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    
    .health-primary {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 16px 0;
    }
    
    .health-indicator {
      font-size: 32px;
      font-weight: 700;
      border-radius: 50%;
      width: 90px;
      height: 90px;
      display: flex;
      justify-content: center;
      align-items: center;
      margin-bottom: 12px;
      color: white;
    }
    
    .health-indicator.excellent {
      background-color: #4caf50;
    }
    
    .health-indicator.good {
      background-color: #8bc34a;
    }
    
    .health-indicator.fair {
      background-color: #ffc107;
    }
    
    .health-indicator.warning {
      background-color: #ff9800;
    }
    
    .health-indicator.critical {
      background-color: #f44336;
    }
    
    .health-label {
      font-size: 14px;
      font-weight: 500;
      color: rgba(0, 0, 0, 0.6);
    }
    
    .status-summary {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
      padding: 8px;
    }
    
    .status-circle {
      border-radius: 50%;
      min-width: 12px;
      min-height: 12px;
    }
    
    .secondary-stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
    }
    
    .stat-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 12px 4px;
      border-radius: 4px;
      background-color: rgba(0, 0, 0, 0.03);
    }
    
    .stat-value {
      font-size: 20px;
      font-weight: 700;
      color: #2196f3;
    }
    
    .stat-label {
      font-size: 12px;
      color: rgba(0, 0, 0, 0.6);
      margin-top: 4px;
    }
    
    .stat-breakdown {
      font-size: 10px;
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 4px;
      margin-top: 4px;
    }
    
    .active-count {
      color: #4caf50;
    }
    
    .warning-count {
      color: #ff9800;
    }
    
    .error-count {
      color: #f44336;
    }
    
    .critical-elements {
      margin-top: 12px;
    }
    
    .critical-elements h4 {
      font-size: 14px;
      font-weight: 500;
      margin: 0 0 8px 0;
      color: rgba(0, 0, 0, 0.7);
    }
    
    .critical-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-height: 180px;
      overflow-y: auto;
    }
    
    .critical-item {
      display: flex;
      align-items: center;
      padding: 8px;
      border-radius: 4px;
      background-color: rgba(0, 0, 0, 0.03);
    }
    
    .critical-item.status-fault {
      border-left: 3px solid #f44336;
      background-color: rgba(244, 67, 54, 0.05);
    }
    
    .critical-item.status-warning {
      border-left: 3px solid #ff9800;
      background-color: rgba(255, 152, 0, 0.05);
    }
    
    .critical-item.status-critical {
      border-left: 3px solid #f44336;
      background-color: rgba(244, 67, 54, 0.05);
    }
    
    .element-type-icon {
      margin-right: 8px;
      font-size: 20px;
    }
    
    .element-details {
      flex: 1;
    }
    
    .element-name {
      font-size: 12px;
      font-weight: 500;
    }
    
    .element-status {
      font-size: 11px;
      color: rgba(0, 0, 0, 0.6);
    }
    
    .status-icon {
      font-size: 18px;
    }
    
    .status-fault .status-icon {
      color: #f44336;
    }
    
    .status-warning .status-icon {
      color: #ff9800;
    }
    
    .status-critical .status-icon {
      color: #f44336;
    }
    
    .last-updated {
      display: flex;
      align-items: center;
      font-size: 11px;
      color: rgba(0, 0, 0, 0.5);
      margin-top: 12px;
    }
    
    .last-updated mat-icon {
      font-size: 14px;
      height: 14px;
      width: 14px;
      margin-right: 4px;
    }
  `],
  animations: [fadeAnimation, slideInUpAnimation]
})
export class NetworkHealthWidgetComponent extends BaseWidgetComponent implements OnInit, OnChanges {
  @Input() elementStats: { total: number, active: number, warning: number, error: number, maintenance: number, inactive: number } = { total: 0, active: 0, warning: 0, error: 0, maintenance: 0, inactive: 0 };

  @Output() widgetAction = new EventEmitter<WidgetActionEvent>();
  @Output() widgetError = new EventEmitter<WidgetErrorEvent>();
  @Output() widgetUpdate = new EventEmitter<WidgetUpdateEvent>();
  
  /** Datos de métricas de la red */
  networkMetrics: NetworkMetrics | null = null;
  
  /** Distribución de estados de los elementos */
  statusDistribution: StatusItem[] = [];
  
  /** Lista de elementos críticos */
  criticalElements: NetworkElement[] = [];
  
  /** Indicador de carga */
  isLoading = false;
  
  // Servicios inyectados
  private monitoringService = inject(MonitoringService);
  private elementService = inject(ElementService);
  private logger = inject(LoggerService);
  
  constructor() {
    super();
    this.widgetId = 'network-health-widget';
    this.title = 'Salud de la Red';
    this.position = 'top-left';
  }
  
  override ngOnInit(): void {
    super.ngOnInit();
    this.loadData();
  }
  
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['elementStats'] && this.elementStats) {
      // Actualizar la distribución de estado cuando cambian las estadísticas
      this.updateStatusDistribution();
    }
  }
  
  /**
   * Carga todos los datos necesarios para el widget
   */
  private loadData(): void {
    this.isLoading = true;
    
    // Cargar métricas generales
    this.monitoringService.getMetrics()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(error => {
          this.handleError('loadMetrics', error);
          return of({
            elementCount: 0,
            connectionCount: 0,
            utilization: 0,
            health: 0,
            lastUpdated: new Date()
          });
        })
      )
      .subscribe({
        next: (metrics) => {
          this.networkMetrics = {
            ...metrics,
            lastUpdated: new Date()
          };
          
          // Una vez que tenemos las métricas, cargar los elementos
          this.loadElements();
        },
        error: (error) => {
          this.handleError('loadMetrics', error);
          this.isLoading = false;
        }
      });
  }
  
  /**
   * Carga los elementos para obtener estadísticas y elementos críticos
   */
  private loadElements(): void {
    this.elementService.getAllElements()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(error => {
          this.handleError('loadElements', error);
          return of([]);
        })
      )
      .subscribe({
        next: (elements) => {
          this.calculateElementStats(elements);
          this.updateStatusDistribution();
          this.findCriticalElements(elements);
          this.isLoading = false;
        },
        error: (error) => {
          this.handleError('loadElements', error);
          this.isLoading = false;
        }
      });
  }
  
  /**
   * Calcula las estadísticas de elementos
   */
  private calculateElementStats(elements: NetworkElement[]): void {
    // Inicializar contadores
    const stats: ElementStats = {
      total: elements.length,
      active: 0,
      warning: 0,
      error: 0,
      maintenance: 0,
      inactive: 0
    };
    
    // Contar elementos por estado
    elements.forEach(element => {
      // Convertir el estado del network.types.ElementStatus a models.element-status.model.ElementStatus
      const status = element.status as unknown as ElementStatus;
      
      switch (status) {
        case ElementStatus.ACTIVE:
          stats.active++;
          break;
        case ElementStatus.WARNING:
          stats.warning++;
          break;
        case ElementStatus.FAULT:
          stats.error++;
          break;
        case ElementStatus.MAINTENANCE:
          stats.maintenance++;
          break;
        case ElementStatus.INACTIVE:
        case ElementStatus.PLANNED:
        case ElementStatus.UNKNOWN:
          stats.inactive++;
          break;
      }
    });
    
    this.elementStats = stats;
  }
  
  /**
   * Actualiza la distribución de estados para la visualización
   */
  private updateStatusDistribution(): void {
    this.statusDistribution = [
      {
        status: ElementStatus.ACTIVE,
        label: 'Activos',
        count: this.elementStats.active,
        color: '#4caf50'
      },
      {
        status: ElementStatus.WARNING,
        label: 'Advertencia',
        count: this.elementStats.warning,
        color: '#ff9800'
      },
      {
        status: ElementStatus.FAULT,
        label: 'Fallo',
        count: this.elementStats.error,
        color: '#f44336'
      },
      {
        status: ElementStatus.MAINTENANCE,
        label: 'Mantenimiento',
        count: this.elementStats.maintenance,
        color: '#9c27b0'
      },
      {
        status: ElementStatus.INACTIVE,
        label: 'Inactivos',
        count: this.elementStats.inactive,
        color: '#9e9e9e'
      }
    ].filter(item => item.count > 0);
  }
  
  /**
   * Identifica los elementos críticos para mostrar
   */
  private findCriticalElements(elements: NetworkElement[]): void {
    // Identificar elementos en estado fallo o advertencia
    const criticalStatuses = [ElementStatus.FAULT, ElementStatus.WARNING];
    
    this.criticalElements = elements
      .filter(element => {
        // Convertir el status a nuestro enum local
        const status = element.status as unknown as ElementStatus;
        return criticalStatuses.includes(status);
      })
      .sort((a, b) => {
        // Ordenar por severidad (fallo > advertencia)
        const severityOrder = {
          [ElementStatus.FAULT]: 0,
          [ElementStatus.WARNING]: 1
        };
        const statusA = a.status as unknown as ElementStatus;
        const statusB = b.status as unknown as ElementStatus;
        return severityOrder[statusA] - severityOrder[statusB];
      })
      .slice(0, 5); // Limitar a los 5 elementos más críticos
  }
  
  /**
   * Calcula el tamaño de los círculos de estado basado en la cantidad
   */
  calculateStatusCircleSize(count: number): number {
    const minSize = 12;
    const maxSize = 36;
    const totalItems = this.elementStats.total || 1;
    const percentage = Math.min(1, count / totalItems);
    
    return Math.max(minSize, Math.round(minSize + (maxSize - minSize) * percentage));
  }
  
  /**
   * Determina el color para el indicador de salud
   */
  getHealthColor(health: number): string {
    if (health >= 90) return 'excellent';
    if (health >= 75) return 'good';
    if (health >= 60) return 'fair';
    if (health >= 40) return 'warning';
    return 'critical';
  }
  
  /**
   * Obtiene la clase CSS para un estado
   */
  getStatusClass(status: ElementStatus): string {
    switch (status) {
      case ElementStatus.WARNING:
        return 'status-warning';
      case ElementStatus.FAULT:
        return 'status-fault';
      case ElementStatus.MAINTENANCE:
        return 'status-maintenance';
      default:
        return '';
    }
  }
  
  /**
   * Obtiene el icono para un tipo de elemento
   */
  getElementTypeIcon(type: ElementType): string {
    switch (type) {
      case ElementType.OLT:
        return 'router';
      case ElementType.ONT:
        return 'devices';
      case ElementType.FDP:
        return 'hub';
      case ElementType.SPLITTER:
        return 'call_split';
      // Manejar tipos que podrían no estar definidos en nuestra enumeración
      default:
        // Tratar tipo como any para comparaciones seguras
        const typeAny = type as any;
        if (typeAny === 'EDFA') return 'power';
        if (typeAny === 'MANGA') return 'cable';
        return 'device_hub';
    }
  }
  
  /**
   * Obtiene el icono para un estado de elemento
   */
  getStatusIcon(status: ElementStatus): string {
    switch (status) {
      case ElementStatus.WARNING:
        return 'warning';
      case ElementStatus.FAULT:
        return 'error';
      case ElementStatus.MAINTENANCE:
        return 'build';
      case ElementStatus.ACTIVE:
        return 'check_circle';
      default:
        return 'help';
    }
  }
  
  /**
   * Obtiene la etiqueta para un estado
   */
  getStatusLabel(status: ElementStatus): string {
    switch (status) {
      case ElementStatus.ACTIVE:
        return 'Activo';
      case ElementStatus.INACTIVE:
        return 'Inactivo';
      case ElementStatus.WARNING:
        return 'Advertencia';
      case ElementStatus.FAULT:
        return 'Fallo';
      case ElementStatus.MAINTENANCE:
        return 'Mantenimiento';
      case ElementStatus.PLANNED:
        return 'Planificado';
      case ElementStatus.UNKNOWN:
        return 'Desconocido';
      default:
        return status;
    }
  }
  
  /**
   * Formatea una fecha/hora para mostrar
   */
  formatTime(date?: Date): string {
    if (!date) return '';
    return date.toLocaleTimeString();
  }
  
  /**
   * Refresca los datos
   */
  override refreshData(): void {
    this.loadData();
  }
} 
