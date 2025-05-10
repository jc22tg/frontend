import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatRippleModule } from '@angular/material/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// Importar servicios
import { MetricsService, MetricData, MetricSummary } from '../../services/metrics.service';
import { ElementManagementService } from '../../services/element-management.service';
import { WidgetDataService } from '../../services/widget-data.service';
import { NetworkStateService } from '../../services/network-state.service';

// Importar tipos
import { NetworkElement, ElementType, ElementStatus, NetworkConnection } from '../../../../shared/types/network.types';

// Importar widgets compartidos
import {
  NetworkHealthWidgetComponent,
  MetricsWidgetComponent,
  SystemAlertsWidgetComponent,
  MiniMapWidgetComponent
} from '../../../../shared/components/widgets';

import { MonitoringDashboardFacade } from '../../facades/monitoring-dashboard.facade';
import { ErrorDisplayComponent } from '../../../../shared/components/error-display/error-display.component';
import { ConnectionStatusWidgetComponent } from '../../components/widgets/connectivity/connection-status-widget/connection-status-widget.component';
import { ElementPropertiesWidgetComponent } from '../../components/widgets/element-related/element-properties-widget/element-properties-widget.component';
import { WidgetEvent, WidgetActionEvent, WidgetErrorEvent, WidgetUpdateEvent } from '../../components/widgets/container/map-widgets-container/map-widgets-container.component';

/**
 * Componente principal del dashboard de monitoreo
 * Utiliza la fachada para gestionar el estado y las operaciones
 */
@Component({
  selector: 'app-monitoring-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatRippleModule,
    MatProgressBarModule,
    MatSlideToggleModule,
    ErrorDisplayComponent,
    NetworkHealthWidgetComponent,
    ConnectionStatusWidgetComponent,
    ElementPropertiesWidgetComponent
  ],
  template: `
    <div class="dashboard-container">
      <div class="dashboard-header">
        <h1>Dashboard de Monitoreo</h1>
        <div class="dashboard-controls">
          <mat-slide-toggle 
            [(ngModel)]="autoRefreshEnabled" 
            (change)="toggleAutoRefresh()" 
            color="primary">
            Auto-actualizar
          </mat-slide-toggle>
          
          <mat-select 
            [(ngModel)]="refreshInterval" 
            (selectionChange)="updateRefreshInterval()"
            [disabled]="!autoRefreshEnabled"
            class="refresh-interval">
            <mat-option [value]="30000">30 segundos</mat-option>
            <mat-option [value]="60000">1 minuto</mat-option>
            <mat-option [value]="300000">5 minutos</mat-option>
          </mat-select>
          
          <button mat-flat-button color="primary" (click)="refreshDashboard()" [disabled]="isLoading">
            <mat-icon>refresh</mat-icon> Actualizar
          </button>
        </div>
      </div>
      
      <!-- Indicador de carga -->
      <mat-progress-bar *ngIf="isLoading" mode="indeterminate" color="primary"></mat-progress-bar>
      
      <!-- Error general del dashboard -->
      <app-error-display
        *ngIf="hasError"
        [message]="errorMessage"
        [title]="'Error en el Dashboard'"
        (retry)="refreshDashboard()">
      </app-error-display>
      
      <!-- Contenido del dashboard -->
      <div class="dashboard-content" *ngIf="!hasError">
        <div class="widget-grid">
          <!-- Widget de salud de red -->
          <div class="widget-container">
            <app-network-health-widget
              [elementStats]="elementStats"
              (widgetAction)="onWidgetAction($event)"
              (widgetError)="onWidgetError($event)"
              (widgetUpdate)="onWidgetUpdate($event)">
            </app-network-health-widget>
          </div>
          
          <!-- Widget de estado de conexiones -->
          <div class="widget-container">
            <app-connection-status-widget
              [connectionStats]="connectionStats"
              (widgetAction)="onWidgetAction($event)"
              (widgetError)="onWidgetError($event)"
              (widgetUpdate)="onWidgetUpdate($event)">
            </app-connection-status-widget>
          </div>
          
          <!-- Otros widgets según sea necesario -->
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      padding: 16px;
    }
    
    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    
    .dashboard-header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 500;
    }
    
    .dashboard-controls {
      display: flex;
      gap: 16px;
      align-items: center;
    }
    
    .refresh-interval {
      width: 150px;
    }
    
    .dashboard-content {
      flex-grow: 1;
      overflow: auto;
    }
    
    .widget-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 16px;
      padding: 16px 0;
    }
    
    .widget-container {
      background-color: #ffffff;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      overflow: hidden;
      transition: all 0.3s ease;
    }
    
    .widget-container:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
  `]
})
export class MonitoringDashboardComponent implements OnInit, OnDestroy {
  // Configuración de auto-refresh
  autoRefreshEnabled = false;
  refreshInterval = 60000; // 1 minuto por defecto
  
  // Estado de la UI
  isLoading = false;
  hasError = false;
  errorMessage = '';
  
  // Datos para los widgets
  elementStats = { total: 0, active: 0, warning: 0, error: 0 };
  connectionStats = { total: 0, active: 0, warning: 0, error: 0 };
  
  // Inyectar la fachada
  private dashboardFacade = inject(MonitoringDashboardFacade);
  
  ngOnInit(): void {
    // Suscribirse a los cambios de estado de la fachada
    this.dashboardFacade.loading$
      .pipe(takeUntilDestroyed())
      .subscribe(loading => {
        this.isLoading = loading;
      });
    
    this.dashboardFacade.error$
      .pipe(takeUntilDestroyed())
      .subscribe(error => {
        this.hasError = error.hasError;
        this.errorMessage = error.errorMessage || '';
      });
    
    // Inicializar el dashboard
    this.initializeDashboard();
  }
  
  /**
   * Inicializa el dashboard a través de la fachada
   */
  initializeDashboard(): void {
    this.dashboardFacade.initializeDashboard().subscribe();
  }
  
  /**
   * Actualiza el dashboard a través de la fachada
   */
  refreshDashboard(): void {
    this.dashboardFacade.refreshDashboard().subscribe();
  }
  
  /**
   * Activa/desactiva el auto-refresh
   */
  toggleAutoRefresh(): void {
    this.dashboardFacade.toggleAutoRefresh(this.autoRefreshEnabled, this.refreshInterval);
  }
  
  /**
   * Actualiza el intervalo de auto-refresh
   */
  updateRefreshInterval(): void {
    if (this.autoRefreshEnabled) {
      this.dashboardFacade.toggleAutoRefresh(false);
      this.dashboardFacade.toggleAutoRefresh(true, this.refreshInterval);
    }
  }
  
  /**
   * Maneja acciones de widgets
   */
  onWidgetAction(event: WidgetActionEvent): void {
    console.log(`Acción de widget recibida: ${event.action} desde ${event.source}`);
    
    // Manejar acciones específicas según sea necesario
  }
  
  /**
   * Maneja errores de widgets
   */
  onWidgetError(event: WidgetErrorEvent): void {
    console.error(`Error en widget ${event.source}: ${event.error.message}`);
    
    // Posibilidad de mostrar notificación o tomar acción específica
  }
  
  /**
   * Maneja actualizaciones de widgets
   */
  onWidgetUpdate(event: WidgetUpdateEvent): void {
    console.log(`Actualización de widget ${event.source}: ${event.updateType}`);
    
    // Actualizar datos compartidos si es necesario
  }
  
  /**
   * Limpieza al destruir el componente
   */
  ngOnDestroy(): void {
    // Limpiar recursos a través de la fachada
    this.dashboardFacade.destroy();
  }
} 