import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { BaseWidgetComponent } from '../../base/base-widget.component';
import { WidgetDataService } from '../../../../services/widget-data.service';
import { fadeAnimation, slideInUpAnimation } from '../../../../../../shared/animations/common.animations';

interface ConnectionStats {
  total: number;
  active: number;
  inactive: number;
  warning: number;
  error: number;
}

/**
 * Componente widget que muestra el estado de las conexiones de red
 * 
 * Proporciona información visual sobre el estado de las conexiones en la red,
 * permitiendo al usuario tener una visión rápida de la salud de las conexiones.
 */
@Component({
  selector: 'app-connection-status-widget',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatDividerModule,
    MatButtonModule,
    MatProgressBarModule
  ],
  template: `
    <div class="widget-container connection-status-widget"
         *ngIf="(widgetState$ | async)?.isVisible"
         @fadeIn>
      <div class="widget-header">
        <h3>
          <mat-icon>swap_horiz</mat-icon>
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
        <div *ngIf="connectionStats; else loading">
          <div class="stats-header">
            <h4>Resumen de Conexiones</h4>
            <div class="total-connections">
              <span class="total-count">{{ connectionStats.total }}</span>
              <span class="total-label">Total</span>
            </div>
          </div>
          
          <mat-divider></mat-divider>
          
          <div class="stats-container">
            <div class="stat-item">
              <div class="stat-header">
                <span class="stat-label">Activas</span>
                <span class="stat-count status-active">{{ connectionStats.active }}</span>
              </div>
              <mat-progress-bar 
                mode="determinate" 
                [value]="getPercentage(connectionStats.active, connectionStats.total)"
                color="primary">
              </mat-progress-bar>
            </div>
            
            <div class="stat-item">
              <div class="stat-header">
                <span class="stat-label">Inactivas</span>
                <span class="stat-count status-inactive">{{ connectionStats.inactive }}</span>
              </div>
              <mat-progress-bar 
                mode="determinate" 
                [value]="getPercentage(connectionStats.inactive, connectionStats.total)"
                color="accent">
              </mat-progress-bar>
            </div>
            
            <div class="stat-item">
              <div class="stat-header">
                <span class="stat-label">Advertencias</span>
                <span class="stat-count status-warning">{{ connectionStats.warning }}</span>
              </div>
              <mat-progress-bar 
                mode="determinate" 
                [value]="getPercentage(connectionStats.warning, connectionStats.total)"
                color="warn">
              </mat-progress-bar>
            </div>
            
            <div class="stat-item">
              <div class="stat-header">
                <span class="stat-label">Errores</span>
                <span class="stat-count status-fault">{{ connectionStats.error }}</span>
              </div>
              <mat-progress-bar 
                mode="determinate" 
                [value]="getPercentage(connectionStats.error, connectionStats.total)"
                color="warn">
              </mat-progress-bar>
            </div>
          </div>
          
          <div class="actions-container">
            <button mat-button color="primary" (click)="refreshStats()">
              <mat-icon>refresh</mat-icon> Actualizar
            </button>
            <button mat-button color="accent" (click)="viewConnectionDetails()">
              <mat-icon>launch</mat-icon> Ver Detalles
            </button>
          </div>
        </div>
        
        <ng-template #loading>
          <div class="loading-container">
            <mat-progress-bar mode="indeterminate"></mat-progress-bar>
            <p class="loading-text">Cargando estadísticas de conexiones...</p>
          </div>
        </ng-template>
      </div>
    </div>
  `,
  styles: [`
    @use '../../base/widget' as widget;
    
    .stats-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    
    .stats-header h4 {
      margin: 0;
      font-weight: 500;
    }
    
    .total-connections {
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    
    .total-count {
      font-size: 20px;
      font-weight: 700;
      color: #2e7d32;
    }
    
    .total-label {
      font-size: 12px;
      color: #616161;
    }
    
    .stats-container {
      margin: 16px 0;
    }
    
    .stat-item {
      margin-bottom: 16px;
    }
    
    .stat-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;
    }
    
    .stat-label {
      font-size: 13px;
      font-weight: 500;
      color: #616161;
    }
    
    .stat-count {
      padding: 2px 8px;
      border-radius: 10px;
      font-size: 12px;
      font-weight: 700;
    }
    
    .actions-container {
      display: flex;
      justify-content: space-between;
      margin-top: 16px;
    }
    
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 24px 16px;
    }
    
    .loading-text {
      margin-top: 16px;
      color: #616161;
      font-size: 14px;
    }
  `],
  animations: [fadeAnimation, slideInUpAnimation]
})
export class ConnectionStatusWidgetComponent extends BaseWidgetComponent implements OnInit {
  connectionStats: ConnectionStats | null = null;
  
  // Inyectar servicio de datos
  private widgetDataService = inject(WidgetDataService);
  
  constructor() {
    super();
    this.widgetId = 'connection-status-widget';
    this.title = 'Estado de Conexiones';
    this.position = 'top-right';
  }
  
  ngOnInit(): void {
    super.ngOnInit();
    this.loadConnectionStats();
  }
  
  /**
   * Carga las estadísticas de conexiones desde el servicio
   */
  loadConnectionStats(): void {
    this.connectionStats = null; // Resetear para mostrar loading
    
    this.widgetDataService.fetchConnectionStatus()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (stats) => {
          this.connectionStats = stats;
        },
        error: (error) => {
          console.error('Error al cargar estadísticas de conexiones:', error);
          // Mostrar datos de fallback
          this.connectionStats = {
            total: 0,
            active: 0,
            inactive: 0,
            warning: 0,
            error: 0
          };
        }
      });
  }
  
  /**
   * Calcula el porcentaje para las barras de progreso
   */
  getPercentage(value: number, total: number): number {
    if (!total) return 0;
    return (value / total) * 100;
  }
  
  /**
   * Refresca las estadísticas de conexiones
   */
  refreshStats(): void {
    this.loadConnectionStats();
  }
  
  /**
   * Navega a los detalles de conexiones
   */
  viewConnectionDetails(): void {
    // Implementación de navegación a detalles (según la aplicación)
    console.log('Navegar a detalles de conexiones');
  }
} 