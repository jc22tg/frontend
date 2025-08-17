import { Component, OnInit, inject, Input, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, tap, catchError, switchMap } from 'rxjs/operators';
import { of, timer } from 'rxjs';

import { BaseWidgetComponent } from '../../base/base-widget.component';
import { MonitoringService } from '../../../../services/monitoring.service';
import { ElementService } from '../../../../services/element.service';
import { LoggerService } from '../../../../../../core/services/logger.service';
import { fadeAnimation, slideInUpAnimation } from '../../../../../../shared/animations/common.animations';
import { ErrorDisplayComponent } from '../../../../../../shared/components/error-display/error-display.component';

interface BandwidthUsage {
  time: Date;
  download: number;
  upload: number;
}

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  status: 'good' | 'warning' | 'critical';
}

interface ElementsPerformance {
  type: string;
  count: number;
  avgLatency: number;
  avgUtilization: number;
  status: 'good' | 'warning' | 'critical';
}

/**
 * Widget para visualizar métricas de rendimiento en tiempo real
 * 
 * Muestra información sobre:
 * - Utilización de ancho de banda en tiempo real
 * - Tendencias de tráfico
 * - Latencia y pérdida de paquetes
 * - Métricas de rendimiento por tipo de elemento
 */
@Component({
  selector: 'app-network-metrics-widget',
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
    <div class="widget-container network-metrics-widget" *ngIf="(widgetState$ | async)?.isVisible">
      <div class="widget-header">
        <h3>
          <mat-icon>bar_chart</mat-icon>
          <span>{{ title }}</span>
        </h3>
        <div class="widget-controls">
          <button mat-icon-button (click)="refreshData()" matTooltip="Actualizar datos" [disabled]="isLoading">
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
        <div *ngIf="!isLoading" class="metrics-content">
          <!-- Componente de Error -->
          <app-error-display 
            *ngIf="(widgetState$ | async)?.hasError"
            [message]="(widgetState$ | async)?.errorInfo?.message || 'Error desconocido'"
            [title]="'Error al cargar métricas'"
            (retry)="refreshData()">
          </app-error-display>
          
          <!-- Uso de ancho de banda -->
          <div class="metric-section">
            <h4 class="section-title">
              <mat-icon>network_check</mat-icon>
              <span>Ancho de Banda</span>
            </h4>
            
            <div class="bandwidth-chart">
              <!-- Aquí irá el gráfico en tiempo real -->
              <div class="bandwidth-bars">
                <div *ngFor="let usage of bandwidthHistory" class="bandwidth-bar">
                  <div class="download-bar" [style.height.%]="usage.download"></div>
                  <div class="upload-bar" [style.height.%]="usage.upload"></div>
                </div>
              </div>
              
              <div class="bandwidth-legend">
                <div class="legend-item">
                  <div class="color-box download"></div>
                  <span>Descarga: {{ currentBandwidth.download }} Mbps</span>
                </div>
                <div class="legend-item">
                  <div class="color-box upload"></div>
                  <span>Subida: {{ currentBandwidth.upload }} Mbps</span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Métricas de rendimiento -->
          <div class="metric-section">
            <h4 class="section-title">
              <mat-icon>speed</mat-icon>
              <span>Métricas Clave</span>
            </h4>
            
            <div class="performance-metrics">
              <div *ngFor="let metric of performanceMetrics" class="metric-item" [ngClass]="'status-' + metric.status">
                <div class="metric-header">
                  <span>{{ metric.name }}</span>
                  <mat-icon *ngIf="metric.trend === 'up'" class="trend-icon trend-up">trending_up</mat-icon>
                  <mat-icon *ngIf="metric.trend === 'down'" class="trend-icon trend-down">trending_down</mat-icon>
                  <mat-icon *ngIf="metric.trend === 'stable'" class="trend-icon trend-stable">trending_flat</mat-icon>
                </div>
                <div class="metric-value">
                  {{ metric.value }} <span class="metric-unit">{{ metric.unit }}</span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Rendimiento por tipo de elemento -->
          <div class="metric-section">
            <h4 class="section-title">
              <mat-icon>device_hub</mat-icon>
              <span>Rendimiento por Elemento</span>
            </h4>
            
            <div class="element-metrics">
              <div *ngFor="let element of elementsPerformance" class="element-metric-item" [ngClass]="'status-' + element.status">
                <div class="element-metric-header">
                  <span>{{ element.type }}</span>
                  <span class="element-count">{{ element.count }}</span>
                </div>
                <div class="element-metric-details">
                  <div class="detail-item">
                    <span class="detail-label">Latencia</span>
                    <span class="detail-value">{{ element.avgLatency }} ms</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Utilización</span>
                    <span class="detail-value">{{ element.avgUtilization }}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Información de última actualización -->
          <div class="last-updated">
            <mat-icon>update</mat-icon>
            Actualizado: {{ formatTime(lastUpdated) }}
            <button mat-button color="primary" class="auto-refresh-button" (click)="toggleAutoRefresh()">
              <mat-icon>{{ autoRefreshEnabled ? 'pause' : 'play_arrow' }}</mat-icon>
              {{ autoRefreshEnabled ? 'Pausar' : 'Auto-actualizar' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .network-metrics-widget {
      min-width: 300px;
      max-width: 400px;
    }
    
    .loading-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 200px;
    }
    
    .metrics-content {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    
    .metric-section {
      padding: 12px;
      background: rgba(0, 0, 0, 0.02);
      border-radius: 8px;
      margin-bottom: 8px;
    }
    
    .section-title {
      display: flex;
      align-items: center;
      margin: 0 0 12px 0;
      font-size: 14px;
      font-weight: 500;
      color: rgba(0, 0, 0, 0.7);
      
      mat-icon {
        margin-right: 8px;
        font-size: 16px;
        height: 16px;
        width: 16px;
      }
    }
    
    /* Estilos para el gráfico de ancho de banda */
    .bandwidth-chart {
      height: 120px;
      display: flex;
      flex-direction: column;
    }
    
    .bandwidth-bars {
      flex: 1;
      display: flex;
      align-items: flex-end;
      gap: 2px;
      height: 100px;
      padding: 8px 0;
    }
    
    .bandwidth-bar {
      flex: 1;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      position: relative;
    }
    
    .download-bar, .upload-bar {
      width: 100%;
      background-color: #2196f3;
      border-top-left-radius: 2px;
      border-top-right-radius: 2px;
    }
    
    .upload-bar {
      position: absolute;
      bottom: 0;
      left: 0;
      background-color: #ff4081;
      z-index: 2;
      max-width: 50%;
      border-top-right-radius: 0;
    }
    
    .bandwidth-legend {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      font-size: 12px;
    }
    
    .legend-item {
      display: flex;
      align-items: center;
    }
    
    .color-box {
      width: 12px;
      height: 12px;
      margin-right: 6px;
      border-radius: 2px;
    }
    
    .color-box.download {
      background-color: #2196f3;
    }
    
    .color-box.upload {
      background-color: #ff4081;
    }
    
    /* Estilos para métricas de rendimiento */
    .performance-metrics {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }
    
    .metric-item {
      background-color: rgba(255, 255, 255, 0.6);
      border-radius: 4px;
      padding: 8px;
      border-left: 3px solid #9e9e9e;
    }
    
    .metric-item.status-good {
      border-left-color: #4caf50;
    }
    
    .metric-item.status-warning {
      border-left-color: #ff9800;
    }
    
    .metric-item.status-critical {
      border-left-color: #f44336;
    }
    
    .metric-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;
      color: rgba(0, 0, 0, 0.6);
    }
    
    .trend-icon {
      font-size: 14px;
      height: 14px;
      width: 14px;
    }
    
    .trend-up {
      color: #4caf50;
    }
    
    .trend-down {
      color: #f44336;
    }
    
    .trend-stable {
      color: #9e9e9e;
    }
    
    .metric-value {
      font-size: 16px;
      font-weight: 500;
      margin-top: 4px;
    }
    
    .metric-unit {
      font-size: 10px;
      color: rgba(0, 0, 0, 0.5);
    }
    
    /* Estilos para métricas por elemento */
    .element-metrics {
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-height: 180px;
      overflow-y: auto;
    }
    
    .element-metric-item {
      display: flex;
      flex-direction: column;
      padding: 8px;
      background-color: rgba(255, 255, 255, 0.6);
      border-radius: 4px;
      border-left: 3px solid #9e9e9e;
    }
    
    .element-metric-item.status-good {
      border-left-color: #4caf50;
    }
    
    .element-metric-item.status-warning {
      border-left-color: #ff9800;
    }
    
    .element-metric-item.status-critical {
      border-left-color: #f44336;
    }
    
    .element-metric-header {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      font-weight: 500;
    }
    
    .element-count {
      font-weight: normal;
      background-color: rgba(0, 0, 0, 0.1);
      padding: 2px 6px;
      border-radius: 10px;
      font-size: 10px;
    }
    
    .element-metric-details {
      display: flex;
      gap: 8px;
      margin-top: 6px;
    }
    
    .detail-item {
      flex: 1;
      display: flex;
      flex-direction: column;
    }
    
    .detail-label {
      font-size: 10px;
      color: rgba(0, 0, 0, 0.5);
    }
    
    .detail-value {
      font-size: 12px;
    }
    
    /* Información de última actualización */
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
    
    .auto-refresh-button {
      margin-left: auto;
      font-size: 11px;
      line-height: 24px;
      padding: 0 8px;
      
      mat-icon {
        font-size: 14px;
        height: 14px;
        width: 14px;
        margin-right: 4px;
      }
    }
  `],
  animations: [fadeAnimation, slideInUpAnimation]
})
export class NetworkMetricsWidgetComponent extends BaseWidgetComponent implements OnInit {
  // Controles de UI
  isLoading = false;
  autoRefreshEnabled = true;
  lastUpdated = new Date();
  
  // Datos de métricas
  currentBandwidth = { download: 0, upload: 0 };
  bandwidthHistory: BandwidthUsage[] = [];
  performanceMetrics: PerformanceMetric[] = [];
  elementsPerformance: ElementsPerformance[] = [];
  
  // Servicios inyectados
  private monitoringService = inject(MonitoringService);
  private elementService = inject(ElementService);
  private logger = inject(LoggerService);
  
  constructor() {
    super();
    this.widgetId = 'network-metrics-widget';
    this.title = 'Métricas de Red';
    this.position = 'top-right';
  }
  
  override ngOnInit(): void {
    super.ngOnInit();
    this.loadData();
    
    // Configurar actualización automática
    if (this.autoRefreshEnabled) {
      this.startAutoRefresh();
    }
  }
  
  /**
   * Inicia medición de rendimiento para una operación
   * @param operation Nombre de la operación
   * @returns Función para finalizar la medición
   */
  protected startPerformanceMeasurement(operation: string): () => void {
    // Delegamos al método del componente base
    return super.startPerformanceMeasurement('load', { operation });
  }
  
  /**
   * Carga todos los datos necesarios para el widget
   */
  private loadData(): void {
    this.isLoading = true;
    
    // Inicializar medición de rendimiento para carga de datos
    const endLoadMeasurement = this.startPerformanceMeasurement('load');
    
    // Carga de métricas generales de red
    this.monitoringService.getMetrics()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(error => {
          this.handleError('loadMetrics', error);
          return of({
            elementCount: 0,
            connectionCount: 0,
            utilization: 0,
            health: 0
          });
        })
      )
      .subscribe({
        next: (metrics) => {
          // Actualizar ancho de banda actual (simulado)
          this.updateBandwidthData(metrics);
          
          // Actualizar métricas de rendimiento
          this.updatePerformanceMetrics(metrics);
          
          // Cargar datos de elementos
          this.loadElementsPerformance();
          
          this.lastUpdated = new Date();
          this.isLoading = false;
          
          // Finalizar medición de rendimiento
          endLoadMeasurement();
        },
        error: (error) => {
          this.handleError('loadMetrics', error);
          this.isLoading = false;
          endLoadMeasurement();
        }
      });
  }
  
  /**
   * Carga datos de rendimiento por tipo de elemento
   */
  private loadElementsPerformance(): void {
    this.elementService.getAllElements()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(error => {
          this.handleError('loadElementsPerformance', error);
          return of([]);
        })
      )
      .subscribe({
        next: (elements) => {
          // Procesar elementos para obtener estadísticas
          const stats = this.calculateElementStats(elements);
          // Generar datos de rendimiento por tipo de elemento (datos simulados)
          this.updateElementsPerformance(stats);
        },
        error: (error) => {
          this.handleError('loadElementsPerformance', error);
        }
      });
  }
  
  /**
   * Calcula estadísticas por tipo de elemento
   */
  private calculateElementStats(elements: any[]): any {
    // Inicializar contador para cada tipo
    const stats: Record<string, number> = {
      olt: 0,
      ont: 0,
      splitter: 0,
      fdp: 0
    };
    
    // Contar elementos por tipo
    elements.forEach(element => {
      const type = element.type?.toLowerCase();
      if (type === 'olt') stats.olt++;
      else if (type === 'ont') stats.ont++;
      else if (type === 'splitter') stats.splitter++;
      else if (type === 'fdp') stats.fdp++;
    });
    
    return stats;
  }
  
  /**
   * Actualiza los datos de ancho de banda
   */
  private updateBandwidthData(metrics: any): void {
    // En producción, estos datos vendrían de la API
    // Aquí simulamos datos realistas
    
    // Generar valores basados en la utilización de red 
    const baseDownload = 100; // Mbps 
    const baseUpload = 40; // Mbps
    const utilization = metrics.utilization || Math.random() * 100;
    
    // Crear datos de ancho de banda con algo de variación
    const variationFactor = Math.random() * 0.2 + 0.9; // entre 0.9 y 1.1
    this.currentBandwidth = {
      download: Math.round((baseDownload * (utilization / 100) * variationFactor) * 10) / 10,
      upload: Math.round((baseUpload * (utilization / 100) * variationFactor) * 10) / 10
    };
    
    // Actualizar historial para el gráfico
    this.updateBandwidthHistory();
  }
  
  /**
   * Actualiza el historial de ancho de banda para el gráfico
   */
  private updateBandwidthHistory(): void {
    // Mantener solo los últimos 20 puntos
    if (this.bandwidthHistory.length >= 20) {
      this.bandwidthHistory.shift();
    }
    
    // Convertir valores a porcentajes para el gráfico (relativo a 200 Mbps max)
    const maxBandwidth = 200; // Mbps
    const downloadPercentage = (this.currentBandwidth.download / maxBandwidth) * 100;
    const uploadPercentage = (this.currentBandwidth.upload / maxBandwidth) * 100;
    
    // Añadir nuevo punto
    this.bandwidthHistory.push({
      time: new Date(),
      download: downloadPercentage,
      upload: uploadPercentage
    });
  }
  
  /**
   * Actualiza las métricas de rendimiento
   */
  private updatePerformanceMetrics(metrics: any): void {
    // En producción, estos datos vendrían de APIs
    // Aquí generamos datos simulados basados en métricas reales
    
    // Determinar tendencias (simuladas)
    const randomTrend = (): 'up' | 'down' | 'stable' => {
      const r = Math.random();
      if (r < 0.33) return 'up';
      if (r < 0.66) return 'down';
      return 'stable';
    };
    
    // Determinar estado basado en valor y umbrales
    const getStatus = (value: number, warning: number, critical: number, isLower = false): 'good' | 'warning' | 'critical' => {
      if (isLower) {
        if (value <= critical) return 'critical';
        if (value <= warning) return 'warning';
        return 'good';
      } else {
        if (value >= critical) return 'critical';
        if (value >= warning) return 'warning';
        return 'good';
      }
    };
    
    // Simular latencia basada en salud general
    const latency = Math.round((100 - metrics.health) * 0.5 + 5);
    
    // Métricas de rendimiento
    this.performanceMetrics = [
      {
        name: 'Latencia',
        value: latency,
        unit: 'ms',
        trend: randomTrend(),
        status: getStatus(latency, 25, 50)
      },
      {
        name: 'Pérdida Paquetes',
        value: Math.max(0, Math.round((100 - metrics.health) * 0.1 * 10) / 10),
        unit: '%',
        trend: randomTrend(),
        status: getStatus(Math.max(0, Math.round((100 - metrics.health) * 0.1 * 10) / 10), 1, 3)
      },
      {
        name: 'Utilización',
        value: Math.round(metrics.utilization || 0),
        unit: '%',
        trend: randomTrend(),
        status: getStatus(Math.round(metrics.utilization || 0), 80, 95)
      },
      {
        name: 'Disponibilidad',
        value: metrics.health ? Math.min(99.99, Math.round(metrics.health * 0.99 * 100) / 100) : 99.5,
        unit: '%',
        trend: randomTrend(),
        status: getStatus(metrics.health ? Math.min(99.99, metrics.health * 0.99) : 99.5, 99, 95, true)
      }
    ];
  }
  
  /**
   * Actualiza los datos de rendimiento por tipo de elemento
   */
  private updateElementsPerformance(stats: any): void {
    // En producción, estos datos vendrían de APIs
    // Aquí simulamos datos basados en tipos de elementos comunes
    
    // Función auxiliar para generar latencia simulada
    const randomLatency = (base: number): number => {
      return Math.round((base + (Math.random() * 10 - 5)) * 10) / 10;
    };
    
    // Función auxiliar para generar utilización simulada
    const randomUtilization = (base: number): number => {
      return Math.round((base + (Math.random() * 20 - 10)) * 10) / 10;
    };
    
    // Determinar estado basado en utilización
    const getStatus = (utilization: number): 'good' | 'warning' | 'critical' => {
      if (utilization >= 90) return 'critical';
      if (utilization >= 70) return 'warning';
      return 'good';
    };
    
    // Datos simulados por tipo de elemento
    this.elementsPerformance = [
      {
        type: 'OLT',
        count: stats.olt || 3,
        avgLatency: randomLatency(15),
        avgUtilization: randomUtilization(75),
        status: getStatus(randomUtilization(75))
      },
      {
        type: 'ONT',
        count: stats.ont || 24,
        avgLatency: randomLatency(30),
        avgUtilization: randomUtilization(60),
        status: getStatus(randomUtilization(60))
      },
      {
        type: 'Splitter',
        count: stats.splitter || 8,
        avgLatency: randomLatency(8),
        avgUtilization: randomUtilization(50),
        status: getStatus(randomUtilization(50))
      },
      {
        type: 'FDP',
        count: stats.fdp || 12,
        avgLatency: randomLatency(10),
        avgUtilization: randomUtilization(45),
        status: getStatus(randomUtilization(45))
      }
    ];
  }
  
  /**
   * Inicia la actualización automática de datos
   */
  private startAutoRefresh(): void {
    timer(10000, 10000) // Iniciar después de 10s, repetir cada 10s
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap(() => {
          if (!this.autoRefreshEnabled) {
            return of(null);
          }
          return of(true);
        }),
        filter(Boolean)
      )
      .subscribe(() => {
        if (!this.isLoading) {
          this.refreshData();
        }
      });
  }
  
  /**
   * Alterna la actualización automática
   */
  toggleAutoRefresh(): void {
    this.autoRefreshEnabled = !this.autoRefreshEnabled;
    if (this.autoRefreshEnabled) {
      this.startAutoRefresh();
    }
  }
  
  /**
   * Formatea una hora para mostrar
   */
  formatTime(date?: Date): string {
    if (!date) return '';
    return date.toLocaleTimeString();
  }
  
  /**
   * Refresca los datos manualmente
   */
  override refreshData(): void {
    if (!this.isLoading) {
      this.loadData();
    }
  }
}
