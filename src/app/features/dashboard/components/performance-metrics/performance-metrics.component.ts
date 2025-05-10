import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { Subscription } from 'rxjs';

import { DashboardService } from '../../services/dashboard.service';
import { FiberMetric, MetricStatus, FiberMetricType } from '../../models/dashboard.models';

@Component({
  selector: 'app-performance-metrics',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatProgressBarModule,
    MatTooltipModule,
    MatButtonModule
  ],
  template: `
    <div class="metrics-container">
      <div class="metrics-header">
        <h3>Métricas de Rendimiento</h3>
        <button mat-button color="primary" (click)="refreshMetrics()">
          <mat-icon>refresh</mat-icon>
          Actualizar
        </button>
      </div>

      <div class="metrics-grid">
        <div class="metric-item" *ngFor="let metric of metrics">
          <div class="metric-header">
            <mat-icon [color]="getMetricColor(metric.status)">{{getMetricIcon(metric.type)}}</mat-icon>
            <span>{{metric.name}}</span>
          </div>
          <div class="metric-value">{{metric.value}}{{getMetricUnit(metric.type)}}</div>
          <mat-progress-bar 
            [mode]="'determinate'" 
            [value]="getProgressValue(metric)" 
            [color]="getMetricColor(metric.status)">
          </mat-progress-bar>
          <div class="metric-footer">
            <span class="trend" [ngClass]="getTrendClass(metric.trend)">
              <mat-icon>{{getTrendIcon(metric.trend)}}</mat-icon>
              {{metric.trend}}{{getMetricUnit(metric.type)}}
            </span>
            <span class="period">vs. hora anterior</span>
          </div>
          <div class="metric-details" *ngIf="metric.wavelength || metric.powerLevel || metric.attenuation">
            <div class="detail-item" *ngIf="metric.wavelength">
              <span class="detail-label">Longitud de onda:</span>
              <span class="detail-value">{{metric.wavelength}} nm</span>
            </div>
            <div class="detail-item" *ngIf="metric.powerLevel">
              <span class="detail-label">Nivel de potencia:</span>
              <span class="detail-value">{{metric.powerLevel}} dBm</span>
            </div>
            <div class="detail-item" *ngIf="metric.attenuation">
              <span class="detail-label">Atenuación:</span>
              <span class="detail-value">{{metric.attenuation}} dB/km</span>
            </div>
            <div class="detail-item" *ngIf="metric.signalQuality">
              <span class="detail-label">Calidad de señal:</span>
              <span class="detail-value">{{metric.signalQuality}}%</span>
            </div>
            <div class="detail-item" *ngIf="metric.bitErrorRate">
              <span class="detail-label">BER:</span>
              <span class="detail-value">{{metric.bitErrorRate | number:'1.0-9'}}</span>
            </div>
          </div>
          <div class="metric-location" *ngIf="metric.location">
            <mat-icon>location_on</mat-icon>
            <span>{{metric.location}}</span>
          </div>
        </div>
      </div>

      <div class="no-metrics" *ngIf="metrics.length === 0">
        <mat-icon>assessment</mat-icon>
        <p>No hay métricas disponibles</p>
      </div>
    </div>
  `,
  styles: [`
    .metrics-container {
      padding: 16px;
    }

    .metrics-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .metrics-header h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 500;
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
    }

    .metric-item {
      background-color: #f5f5f5;
      border-radius: 8px;
      padding: 16px;
    }

    .metric-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
    }

    .metric-value {
      font-size: 24px;
      font-weight: 500;
      margin-bottom: 8px;
    }

    .metric-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 8px;
      font-size: 14px;
    }

    .trend {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .trend.positive {
      color: #4caf50;
    }

    .trend.negative {
      color: #f44336;
    }

    .trend.neutral {
      color: #9e9e9e;
    }

    .period {
      color: #757575;
    }

    .metric-details {
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid #e0e0e0;
    }

    .detail-item {
      display: flex;
      justify-content: space-between;
      margin-bottom: 4px;
      font-size: 12px;
    }

    .detail-label {
      color: #757575;
    }

    .detail-value {
      font-weight: 500;
    }

    .metric-location {
      display: flex;
      align-items: center;
      gap: 4px;
      margin-top: 8px;
      font-size: 12px;
      color: #757575;
    }

    .metric-location mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .no-metrics {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 32px;
      color: #757575;
      text-align: center;
    }

    .no-metrics mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 16px;
      opacity: 0.5;
    }

    @media (max-width: 600px) {
      .metrics-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class PerformanceMetricsComponent implements OnInit, OnDestroy {
  metrics: FiberMetric[] = [];
  private subscription = new Subscription();

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.subscription.add(
      this.dashboardService.getMetrics().subscribe(metrics => {
        this.metrics = metrics;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  refreshMetrics(): void {
    this.dashboardService.refreshMetrics().subscribe(metrics => {
      this.metrics = metrics;
    });
  }

  getMetricIcon(type: FiberMetricType): string {
    switch (type) {
      case FiberMetricType.OPTICAL_POWER:
        return 'power';
      case FiberMetricType.ATTENUATION:
        return 'trending_down';
      case FiberMetricType.SIGNAL_STRENGTH:
        return 'signal_cellular_alt';
      case FiberMetricType.BANDWIDTH:
        return 'speed';
      case FiberMetricType.LATENCY:
        return 'timer';
      case FiberMetricType.PACKET_LOSS:
        return 'error_outline';
      case FiberMetricType.ERROR_RATE:
        return 'warning';
      case FiberMetricType.SIGNAL_QUALITY:
        return 'network_check';
      default:
        return 'assessment';
    }
  }

  getMetricUnit(type: FiberMetricType): string {
    switch (type) {
      case FiberMetricType.OPTICAL_POWER:
        return 'dBm';
      case FiberMetricType.ATTENUATION:
        return 'dB/km';
      case FiberMetricType.SIGNAL_STRENGTH:
        return 'dBm';
      case FiberMetricType.BANDWIDTH:
        return 'Mbps';
      case FiberMetricType.LATENCY:
        return 'ms';
      case FiberMetricType.PACKET_LOSS:
        return '%';
      case FiberMetricType.ERROR_RATE:
        return '%';
      case FiberMetricType.SIGNAL_QUALITY:
        return '%';
      default:
        return '';
    }
  }

  getMetricColor(status: MetricStatus): string {
    switch (status) {
      case MetricStatus.NORMAL:
        return 'primary';
      case MetricStatus.WARNING:
        return 'accent';
      case MetricStatus.CRITICAL:
        return 'warn';
      case MetricStatus.MAINTENANCE:
        return 'accent';
      case MetricStatus.INACTIVE:
      case MetricStatus.PLANNED:
      case MetricStatus.UNKNOWN:
      default:
        return 'primary';
    }
  }

  getProgressValue(metric: FiberMetric): number {
    // Normalizar valores para la barra de progreso
    switch (metric.type) {
      case FiberMetricType.OPTICAL_POWER:
        // Normalizar entre -30 dBm (0%) y -10 dBm (100%)
        return Math.min(100, Math.max(0, ((metric.value + 30) / 20) * 100));
      case FiberMetricType.ATTENUATION:
        // Normalizar entre 0 dB/km (100%) y 1 dB/km (0%)
        return Math.min(100, Math.max(0, (1 - metric.value) * 100));
      case FiberMetricType.BANDWIDTH:
        // Normalizar entre 0 Mbps (0%) y 1000 Mbps (100%)
        return Math.min(100, (metric.value / 1000) * 100);
      case FiberMetricType.LATENCY:
        // Normalizar entre 0ms (100%) y 100ms (0%)
        return Math.min(100, Math.max(0, (1 - metric.value / 100) * 100));
      case FiberMetricType.PACKET_LOSS:
        // Normalizar entre 0% (100%) y 5% (0%)
        return Math.min(100, Math.max(0, (1 - metric.value / 5) * 100));
      case FiberMetricType.SIGNAL_QUALITY:
        // Ya está en porcentaje
        return metric.value;
      default:
        return 50;
    }
  }

  getTrendIcon(trend: number): string {
    if (trend > 0) return 'trending_up';
    if (trend < 0) return 'trending_down';
    return 'trending_flat';
  }

  getTrendClass(trend: number): string {
    if (trend > 0) return 'positive';
    if (trend < 0) return 'negative';
    return 'neutral';
  }
} 