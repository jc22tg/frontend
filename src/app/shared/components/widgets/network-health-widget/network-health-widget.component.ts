import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { NetworkMonitoringService } from '../../../services/network-monitoring.service';

@Component({
  selector: 'app-network-health-widget',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressBarModule
  ],
  template: `
    <mat-card class="health-widget">
      <mat-card-header>
        <mat-card-title>Salud de la Red</mat-card-title>
        <button mat-icon-button (click)="refreshData()">
          <mat-icon>refresh</mat-icon>
        </button>
      </mat-card-header>
      <mat-card-content>
        <div class="health-summary">
          <div class="health-indicator" [ngClass]="networkHealthClass">
            <span class="health-score">{{ networkHealth }}%</span>
            <span class="health-label">{{ networkHealthLabel }}</span>
          </div>
          <mat-progress-bar
            [color]="networkHealthColor"
            [value]="networkHealth"
            mode="determinate">
          </mat-progress-bar>
        </div>
        <div class="status-summary">
          <div class="status-item">
            <div class="status-icon active">
              <mat-icon>check_circle</mat-icon>
            </div>
            <div class="status-details">
              <span class="status-value">{{ activeCount }}</span>
              <span class="status-label">Activos</span>
            </div>
          </div>
          <div class="status-item">
            <div class="status-icon warning">
              <mat-icon>warning</mat-icon>
            </div>
            <div class="status-details">
              <span class="status-value">{{ warningCount }}</span>
              <span class="status-label">Advertencias</span>
            </div>
          </div>
          <div class="status-item">
            <div class="status-icon critical">
              <mat-icon>error</mat-icon>
            </div>
            <div class="status-details">
              <span class="status-value">{{ criticalCount }}</span>
              <span class="status-label">Críticos</span>
            </div>
          </div>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .health-widget {
      height: 100%;
    }
    .health-summary {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-bottom: 20px;
    }
    .health-indicator {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-bottom: 10px;
    }
    .health-score {
      font-size: 2.5rem;
      font-weight: bold;
    }
    .health-label {
      font-size: 1rem;
    }
    .health-indicator.good {
      color: #4caf50;
    }
    .health-indicator.warning {
      color: #ff9800;
    }
    .health-indicator.critical {
      color: #f44336;
    }
    .status-summary {
      display: flex;
      justify-content: space-around;
      margin-top: 20px;
    }
    .status-item {
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .status-icon {
      margin-bottom: 5px;
    }
    .status-icon.active {
      color: #4caf50;
    }
    .status-icon.warning {
      color: #ff9800;
    }
    .status-icon.critical {
      color: #f44336;
    }
    .status-value {
      font-size: 1.5rem;
      font-weight: bold;
    }
    .status-label {
      font-size: 0.8rem;
    }
  `]
})
export class NetworkHealthWidgetComponent implements OnInit {
  @Input() refreshInterval = 60000; // 1 minuto por defecto
  
  networkHealth = 0;
  networkHealthLabel = '';
  networkHealthClass = '';
  networkHealthColor = 'primary';
  
  activeCount = 0;
  warningCount = 0;
  criticalCount = 0;
  
  constructor(private networkMonitoringService: NetworkMonitoringService) {}
  
  ngOnInit(): void {
    this.refreshData();
  }
  
  refreshData(): void {
    this.networkMonitoringService.getNetworkHealth().subscribe(data => {
      this.networkHealth = data.healthPercentage;
      this.activeCount = data.activeElementsCount;
      this.warningCount = data.warningElementsCount;
      this.criticalCount = data.criticalElementsCount;
      
      this.updateHealthStatus();
    });
  }
  
  private updateHealthStatus(): void {
    if (this.networkHealth >= 90) {
      this.networkHealthLabel = 'Buena';
      this.networkHealthClass = 'good';
      this.networkHealthColor = 'primary';
    } else if (this.networkHealth >= 70) {
      this.networkHealthLabel = 'Regular';
      this.networkHealthClass = 'warning';
      this.networkHealthColor = 'accent';
    } else {
      this.networkHealthLabel = 'Crítica';
      this.networkHealthClass = 'critical';
      this.networkHealthColor = 'warn';
    }
  }
} 