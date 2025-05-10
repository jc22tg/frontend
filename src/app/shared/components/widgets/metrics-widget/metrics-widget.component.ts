import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { NetworkMonitoringService, NetworkMetric } from '../../../services/network-monitoring.service';

@Component({
  selector: 'app-metrics-widget',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatSelectModule,
    MatFormFieldModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule
  ],
  template: `
    <mat-card class="metrics-widget">
      <mat-card-header>
        <mat-card-title>Métricas de Red</mat-card-title>
        <button mat-icon-button (click)="refreshData()">
          <mat-icon>refresh</mat-icon>
        </button>
      </mat-card-header>
      <mat-card-content>
        <div class="filter-bar">
          <mat-form-field appearance="outline">
            <mat-label>Tipo de Métrica</mat-label>
            <mat-select [(value)]="selectedMetricType" (selectionChange)="onMetricTypeChange($event.value)">
              <mat-option value="bandwidth">Ancho de Banda</mat-option>
              <mat-option value="latency">Latencia</mat-option>
              <mat-option value="packetLoss">Pérdida de Paquetes</mat-option>
              <mat-option value="temperature">Temperatura</mat-option>
              <mat-option value="power">Potencia</mat-option>
              <mat-option value="signal">Señal</mat-option>
            </mat-select>
          </mat-form-field>
          
          <mat-form-field appearance="outline" *ngIf="showElementSelector">
            <mat-label>Elemento</mat-label>
            <mat-select [(value)]="selectedElementId" (selectionChange)="loadElementMetrics()">
              <mat-option value="">Todos los elementos</mat-option>
              <mat-option *ngFor="let element of elements" [value]="element.id">
                {{ element.name }}
              </mat-option>
            </mat-select>
          </mat-form-field>
        </div>
        
        <table mat-table [dataSource]="metrics" matSort class="metrics-table" *ngIf="metrics.length > 0">
          <!-- Columna de Elemento -->
          <ng-container matColumnDef="element" *ngIf="showElementColumn">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Elemento</th>
            <td mat-cell *matCellDef="let metric">{{ getElementName(metric.elementId) }}</td>
          </ng-container>
          
          <!-- Columna de Fecha/Hora -->
          <ng-container matColumnDef="timestamp">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Fecha/Hora</th>
            <td mat-cell *matCellDef="let metric">{{ metric.timestamp | date:'short' }}</td>
          </ng-container>
          
          <!-- Columna de Valor -->
          <ng-container matColumnDef="value">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Valor</th>
            <td mat-cell *matCellDef="let metric">{{ formatMetricValue(metric.value) }}</td>
          </ng-container>
          
          <!-- Columna de Tendencia -->
          <ng-container matColumnDef="trend">
            <th mat-header-cell *matHeaderCellDef>Tendencia</th>
            <td mat-cell *matCellDef="let metric">
              <mat-icon [ngClass]="getTrendClass(metric.trend)">{{ getTrendIcon(metric.trend) }}</mat-icon>
            </td>
          </ng-container>
          
          <tr mat-header-row *matHeaderRowDef="getDisplayedColumns()"></tr>
          <tr mat-row *matRowDef="let row; columns: getDisplayedColumns();"></tr>
        </table>
        
        <div class="no-data-message" *ngIf="metrics.length === 0">
          <mat-icon>info</mat-icon>
          <span>No hay datos disponibles para los filtros seleccionados</span>
        </div>
        
        <mat-paginator 
          [pageSizeOptions]="[5, 10, 20]" 
          showFirstLastButtons
          *ngIf="metrics.length > 0">
        </mat-paginator>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .metrics-widget {
      height: 100%;
    }
    .filter-bar {
      display: flex;
      gap: 16px;
      margin-bottom: 16px;
    }
    .metrics-table {
      width: 100%;
    }
    .no-data-message {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      color: #666;
    }
    .no-data-message mat-icon {
      margin-right: 8px;
    }
    mat-icon.trend-up {
      color: #4caf50;
    }
    mat-icon.trend-down {
      color: #f44336;
    }
    mat-icon.trend-stable {
      color: #ff9800;
    }
  `]
})
export class MetricsWidgetComponent implements OnInit {
  @Input() showElementSelector = true;
  @Input() selectedElementId = '';
  @Input() maxRows = 10;
  
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  
  metrics: NetworkMetric[] = [];
  elements: any[] = [];
  selectedMetricType = 'bandwidth';
  showElementColumn = true;
  
  constructor(private networkMonitoringService: NetworkMonitoringService) {}
  
  ngOnInit(): void {
    this.loadElements();
    this.refreshData();
  }
  
  refreshData(): void {
    if (this.selectedElementId) {
      this.loadElementMetrics();
    } else {
      this.loadNetworkMetrics();
    }
  }
  
  onMetricTypeChange(metricType: string): void {
    this.selectedMetricType = metricType;
    this.refreshData();
  }
  
  loadElementMetrics(): void {
    if (!this.selectedElementId) return;
    
    this.showElementColumn = false;
    this.networkMonitoringService.getElementMetrics(
      this.selectedElementId, 
      this.selectedMetricType,
      this.maxRows
    ).subscribe(data => {
      this.metrics = data;
    });
  }
  
  loadNetworkMetrics(): void {
    this.showElementColumn = true;
    this.networkMonitoringService.getNetworkMetrics(
      this.selectedMetricType,
      'day'
    ).subscribe({
      next: (data) => {
        if (data && Array.isArray(data.metrics)) {
          // Añadir tendencia a las métricas para visualización
          this.metrics = data.metrics.map((metric: any, index: number, array: any[]) => {
            return {
              ...metric,
              trend: this.calculateTrend(metric, index > 0 ? array[index - 1] : null)
            };
          });
        } else {
          console.warn('Formato de datos inesperado:', data);
          this.metrics = [];
        }
      },
      error: (error) => {
        console.error('Error al cargar métricas de red:', error);
        this.metrics = [];
      }
    });
  }
  
  // Calcular tendencia comparando con el valor anterior
  private calculateTrend(currentMetric: any, previousMetric: any): 'up' | 'down' | 'stable' {
    if (!previousMetric || previousMetric.value === undefined) {
      return 'stable';
    }
    
    const diff = currentMetric.value - previousMetric.value;
    if (Math.abs(diff) < 0.001) {
      return 'stable';
    }
    
    return diff > 0 ? 'up' : 'down';
  }
  
  loadElements(): void {
    // Aquí se cargaría la lista de elementos desde un servicio
    // Por ahora usamos datos de muestra
    this.elements = [
      { id: 'olt1', name: 'OLT Principal' },
      { id: 'ont1', name: 'ONT Cliente 1' },
      { id: 'splitter1', name: 'Splitter Zona Norte' }
    ];
  }
  
  getElementName(elementId: string): string {
    const element = this.elements.find(e => e.id === elementId);
    return element ? element.name : elementId;
  }
  
  getDisplayedColumns(): string[] {
    return this.showElementColumn 
      ? ['element', 'timestamp', 'value', 'trend'] 
      : ['timestamp', 'value', 'trend'];
  }
  
  formatMetricValue(value: number): string {
    switch (this.selectedMetricType) {
      case 'bandwidth': return `${value} Mbps`;
      case 'latency': return `${value} ms`;
      case 'packetLoss': return `${value}%`;
      case 'temperature': return `${value}°C`;
      case 'power': return `${value} dBm`;
      case 'signal': return `${value} dB`;
      default: return `${value}`;
    }
  }
  
  getTrendIcon(trend: string): string {
    switch (trend) {
      case 'up': return 'trending_up';
      case 'down': return 'trending_down';
      case 'stable': return 'trending_flat';
      default: return 'trending_flat';
    }
  }
  
  getTrendClass(trend: string): string {
    switch (trend) {
      case 'up': return 'trend-up';
      case 'down': return 'trend-down';
      case 'stable': return 'trend-stable';
      default: return '';
    }
  }
} 