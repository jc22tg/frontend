import { Component, OnInit, inject, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, tap } from 'rxjs/operators';

import { BaseWidgetComponent } from '../../base/base-widget.component';
import { WidgetDataService } from '../../../../services/widget-data.service';
import { fadeAnimation, slideInUpAnimation } from '../../../../../../shared/animations/common.animations';
import { WidgetStateService } from '../../../../services/widget-state.service';
import { ErrorDisplayComponent } from '../../../../../../shared/components/error-display/error-display.component';
import { NetworkElement, ElementStatus } from '../../../../../../shared/types/network.types';

interface NetworkMetrics {
  elementCount: number;
  connectionCount: number;
  utilization: number;
  health: number;
  lastUpdated?: Date;
}

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
    ErrorDisplayComponent
  ],
  template: `
    <div class="widget-container network-health-widget" *ngIf="(widgetState$ | async)?.isVisible">
      <div class="widget-header">
        <h3>{{ title }}</h3>
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
      
      <div class="widget-content" *ngIf="!(widgetState$ | async)?.isCollapsed" [@fadeAnimation]="'in'">
        <!-- Componente de Error -->
        <app-error-display 
          *ngIf="(widgetState$ | async)?.hasError"
          [message]="(widgetState$ | async)?.errorInfo?.message || 'Error desconocido'"
          [title]="'Error en Salud de Red'"
          (retry)="refreshData()">
        </app-error-display>
        
        <!-- Contenido principal -->
        <div *ngIf="!((widgetState$ | async)?.hasError)" class="health-stats-container">
          <!-- Indicador de carga -->
          <div *ngIf="isLoading" class="loading-container">
            <mat-spinner diameter="30"></mat-spinner>
          </div>
          
          <!-- Métrica principal de salud -->
          <div class="health-primary">
            <div class="health-indicator" [ngClass]="getHealthColor(networkMetrics?.health || 0)">
              {{ networkMetrics?.health || 0 }}%
            </div>
            <div class="health-label">Salud General</div>
          </div>
          
          <!-- Métricas secundarias -->
          <div class="secondary-stats">
            <div class="stat-item">
              <div class="stat-value">{{ networkMetrics?.elementCount || 0 }}</div>
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
          
          <div class="status-summary">
            <div class="status-circle" 
                *ngFor="let status of statusDistribution" 
                [style.background-color]="status.color"
                [style.width.px]="calculateStatusCircleSize(status.count)"
                [style.height.px]="calculateStatusCircleSize(status.count)"
                [matTooltip]="status.label + ': ' + status.count">
            </div>
          </div>
          
          <!-- Información de última actualización -->
          <div class="last-updated" *ngIf="networkMetrics?.lastUpdated">
            <mat-icon>update</mat-icon>
            Actualizado: {{ networkMetrics?.lastUpdated | date:'HH:mm:ss' }}
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
    
    .network-health-widget {
      min-width: 230px;
    }
    
    .widget-content {
      padding: 12px;
    }
    
    .health-stats-container {
      position: relative;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    
    .loading-container {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      background-color: rgba(255, 255, 255, 0.7);
      z-index: 10;
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
      width: 80px;
      height: 80px;
      display: flex;
      justify-content: center;
      align-items: center;
      margin-bottom: 12px;
      color: white;
    }
    
    .health-indicator.primary {
      background-color: #2196f3;
    }
    
    .health-indicator.accent {
      background-color: #ff9800;
    }
    
    .health-indicator.warn {
      background-color: #f44336;
    }
    
    .health-label {
      font-size: 14px;
      font-weight: 500;
      color: rgba(0, 0, 0, 0.6);
    }
    
    .secondary-stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
    }
    
    .stat-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 8px 4px;
      border-radius: 4px;
      background-color: rgba(0, 0, 0, 0.03);
    }
    
    .stat-value {
      font-size: 24px;
      font-weight: 500;
      color: #2196f3;
      line-height: 1;
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
    
    .status-summary {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-top: 8px;
    }
    
    .status-circle {
      border-radius: 50%;
      transition: all 0.3s ease;
    }
    
    .last-updated {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      font-size: 11px;
      color: rgba(0, 0, 0, 0.5);
      margin-top: 8px;
    }
    
    .last-updated mat-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
      margin-right: 4px;
    }
    
    :host-context(.dark-theme) .loading-container {
      background-color: rgba(48, 48, 48, 0.7);
    }
    
    :host-context(.dark-theme) .stat-item {
      background-color: rgba(255, 255, 255, 0.05);
    }
    
    :host-context(.dark-theme) .health-label,
    :host-context(.dark-theme) .stat-label {
      color: rgba(255, 255, 255, 0.7);
    }
    
    :host-context(.dark-theme) .last-updated {
      color: rgba(255, 255, 255, 0.5);
    }
  `],
  animations: [fadeAnimation, slideInUpAnimation]
})
export class NetworkHealthWidgetComponent extends BaseWidgetComponent implements OnInit, OnChanges {
  @Input() elementStats: { total: number, active: number, warning: number, error: number } | null = null;
  
  // Estado interno
  isLoading = false;
  networkMetrics: NetworkMetrics | null = null;
  statusDistribution: {label: string, count: number, color: string}[] = [];
  
  // Servicio adicional para datos
  private widgetDataService = inject(WidgetDataService);
  
  constructor() {
    super();
    this.widgetId = 'network-health-widget';
    this.title = 'Salud de Red';
    this.position = 'top-right';
  }
  
  override ngOnInit(): void {
    super.ngOnInit();
    
    // Suscribirse a actualizaciones de datos compartidos
    this.widgetDataService.networkMetrics$.pipe(
      takeUntilDestroyed(this.destroyRef),
      filter(metrics => !!metrics)
    ).subscribe(metrics => {
      this.networkMetrics = metrics;
      
      // Si no tenemos estadísticas de elementos, calcular aproximadamente
      if (!this.elementStats && this.networkMetrics) {
        this.calculateApproximateElementStats();
      }
      
      // Actualizar la visualización de distribución de estado
      this.updateStatusDistribution();
      
      // Notificar actualización
      this.emitUpdateEvent('data', { metrics: this.networkMetrics });
      
      this.isLoading = false;
    });
    
    // Reaccionar a solicitudes de actualización
    this.widgetStateService.refreshWidgetsRequest$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(request => {
      this.refreshData();
    });
    
    // Cargar datos iniciales
    this.refreshData();
  }
  
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['elementStats'] && this.elementStats) {
      // Actualizar la distribución de estado cuando cambian las estadísticas
      this.updateStatusDistribution();
    }
  }
  
  /**
   * Actualiza la distribución de estado para visualización
   */
  private updateStatusDistribution(): void {
    if (!this.elementStats) return;
    
    this.statusDistribution = [
      { label: 'Activo', count: this.elementStats.active || 0, color: '#4caf50' },
      { label: 'Advertencia', count: this.elementStats.warning || 0, color: '#ff9800' },
      { label: 'Error', count: this.elementStats.error || 0, color: '#f44336' }
    ];
  }
  
  /**
   * Calcula estadísticas aproximadas basadas en métricas generales
   */
  private calculateApproximateElementStats(): void {
    if (!this.networkMetrics) return;
    
    const total = this.networkMetrics.elementCount;
    const healthPercentage = this.networkMetrics.health / 100;
    
    // Aproximación basada en la salud de la red
    const active = Math.round(total * healthPercentage);
    const warning = Math.round(total * (1 - healthPercentage) * 0.7);
    const error = total - active - warning;
    
    this.elementStats = {
      total,
      active: Math.max(0, active),
      warning: Math.max(0, warning),
      error: Math.max(0, error)
    };
  }
  
  /**
   * Calcular el tamaño de los círculos de estado en función de la proporción
   */
  calculateStatusCircleSize(count: number): number {
    if (!this.elementStats || this.elementStats.total === 0) return 16;
    
    // Proteger contra valores inválidos
    const safeCount = count || 0;
    const total = this.elementStats.total || 1; // Evitar división por cero
    
    // Tamaño mínimo de 16px, máximo de 40px
    const minSize = 16;
    const maxSize = 40;
    
    const proportion = safeCount / total;
    return Math.max(minSize, Math.min(maxSize, minSize + Math.round(proportion * 40)));
  }
  
  /**
   * Devuelve el color según el valor de salud
   */
  getHealthColor(health: number): string {
    // Asegurar que health sea un número
    const safeHealth = Number(health) || 0;
    
    if (safeHealth < 40) return 'warn';
    if (safeHealth < 70) return 'accent';
    return 'primary';
  }
  
  /**
   * Actualiza los datos de la red
   */
  override refreshData(): void {
    // Limpiar errores previos
    this.widgetStateService.clearWidgetError(this.widgetId);
    
    // Indicar que estamos cargando
    this.isLoading = true;
    
    // Utilizar el servicio de datos compartidos para obtener métricas
    this.widgetDataService.fetchNetworkMetrics().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (metrics) => {
        this.networkMetrics = metrics;
        
        // Si no tenemos estadísticas de elementos, calcular aproximadamente
        if (!this.elementStats) {
          this.calculateApproximateElementStats();
        }
        
        // Actualizar distribución visualización de estado
        this.updateStatusDistribution();
        
        // Notificar actualización
        this.emitUpdateEvent('data', { metrics: this.networkMetrics });
        
        this.isLoading = false;
      },
      error: (error) => {
        // Manejar el error
        this.handleError('fetchNetworkMetrics', error);
        
        // Registrar error en el estado del widget
        this.widgetStateService.registerWidgetError(this.widgetId, {
          code: 'FETCH_METRICS_ERROR',
          message: 'Error al cargar métricas de red',
          details: error
        });
        
        // Usar estadísticas elementales si están disponibles para estimar métricas
        if (this.elementStats) {
          this.networkMetrics = {
            elementCount: this.elementStats.total,
            connectionCount: 0, // No podemos estimar esto
            utilization: 0, // No podemos estimar esto
            health: Math.round((this.elementStats.active / this.elementStats.total) * 100),
            lastUpdated: new Date()
          };
        }
        
        this.isLoading = false;
      }
    });
  }
} 