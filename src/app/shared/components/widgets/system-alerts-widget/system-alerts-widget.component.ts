import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterModule } from '@angular/router';

interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  message: string;
  timestamp: string;
  elementId?: string;
  elementName?: string;
  acknowledged: boolean;
}

@Component({
  selector: 'app-system-alerts-widget',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatBadgeModule,
    MatTabsModule,
    MatDividerModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    RouterModule
  ],
  template: `
    <mat-card class="alerts-widget">
      <mat-card-header>
        <mat-card-title>
          Alertas del Sistema
          <span class="alert-badge" *ngIf="criticalCount > 0" [matBadge]="criticalCount" matBadgeColor="warn"></span>
        </mat-card-title>
        <button mat-icon-button (click)="refreshAlerts()">
          <mat-icon>refresh</mat-icon>
        </button>
      </mat-card-header>
      <mat-card-content>
        <div *ngIf="loading" class="loading-indicator">
          <mat-spinner diameter="30"></mat-spinner>
        </div>
        
        <div *ngIf="error" class="error-message">
          <mat-icon color="warn">error</mat-icon>
          <span>{{ errorMessage }}</span>
          <button mat-button color="primary" (click)="refreshAlerts()">Reintentar</button>
        </div>
        
        <mat-tab-group *ngIf="!error">
          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon class="critical-icon">error</mat-icon>
              Críticas ({{ criticalAlerts.length }})
            </ng-template>
            <div class="alerts-list">
              <div class="alert-item critical" *ngFor="let alert of criticalAlerts">
                <div class="alert-content">
                  <div class="alert-header">
                    <mat-icon>error</mat-icon>
                    <span class="alert-timestamp">{{ alert.timestamp | date:'short' }}</span>
                  </div>
                  <div class="alert-message">{{ alert.message }}</div>
                  <div class="alert-element" *ngIf="alert.elementName">
                    Elemento: {{ alert.elementName }}
                  </div>
                </div>
                <div class="alert-actions">
                  <button mat-icon-button [matTooltip]="alert.acknowledged ? 'Reabrir' : 'Reconocer'"
                          (click)="toggleAcknowledge(alert)">
                    <mat-icon>{{ alert.acknowledged ? 'check_circle' : 'check_circle_outline' }}</mat-icon>
                  </button>
                  <button mat-icon-button matTooltip="Ver detalles" [routerLink]="['/monitoring', alert.id]">
                    <mat-icon>visibility</mat-icon>
                  </button>
                </div>
              </div>
              <div class="no-alerts" *ngIf="criticalAlerts.length === 0">
                No hay alertas críticas
              </div>
            </div>
          </mat-tab>
          
          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon class="warning-icon">warning</mat-icon>
              Advertencias ({{ warningAlerts.length }})
            </ng-template>
            <div class="alerts-list">
              <div class="alert-item warning" *ngFor="let alert of warningAlerts">
                <div class="alert-content">
                  <div class="alert-header">
                    <mat-icon>warning</mat-icon>
                    <span class="alert-timestamp">{{ alert.timestamp | date:'short' }}</span>
                  </div>
                  <div class="alert-message">{{ alert.message }}</div>
                  <div class="alert-element" *ngIf="alert.elementName">
                    Elemento: {{ alert.elementName }}
                  </div>
                </div>
                <div class="alert-actions">
                  <button mat-icon-button [matTooltip]="alert.acknowledged ? 'Reabrir' : 'Reconocer'"
                          (click)="toggleAcknowledge(alert)">
                    <mat-icon>{{ alert.acknowledged ? 'check_circle' : 'check_circle_outline' }}</mat-icon>
                  </button>
                  <button mat-icon-button matTooltip="Ver detalles" [routerLink]="['/monitoring', alert.id]">
                    <mat-icon>visibility</mat-icon>
                  </button>
                </div>
              </div>
              <div class="no-alerts" *ngIf="warningAlerts.length === 0">
                No hay alertas de advertencia
              </div>
            </div>
          </mat-tab>
          
          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon class="info-icon">info</mat-icon>
              Informativas ({{ infoAlerts.length }})
            </ng-template>
            <div class="alerts-list">
              <div class="alert-item info" *ngFor="let alert of infoAlerts">
                <div class="alert-content">
                  <div class="alert-header">
                    <mat-icon>info</mat-icon>
                    <span class="alert-timestamp">{{ alert.timestamp | date:'short' }}</span>
                  </div>
                  <div class="alert-message">{{ alert.message }}</div>
                  <div class="alert-element" *ngIf="alert.elementName">
                    Elemento: {{ alert.elementName }}
                  </div>
                </div>
                <div class="alert-actions">
                  <button mat-icon-button [matTooltip]="alert.acknowledged ? 'Reabrir' : 'Reconocer'"
                          (click)="toggleAcknowledge(alert)">
                    <mat-icon>{{ alert.acknowledged ? 'check_circle' : 'check_circle_outline' }}</mat-icon>
                  </button>
                  <button mat-icon-button matTooltip="Ver detalles" [routerLink]="['/monitoring', alert.id]">
                    <mat-icon>visibility</mat-icon>
                  </button>
                </div>
              </div>
              <div class="no-alerts" *ngIf="infoAlerts.length === 0">
                No hay alertas informativas
              </div>
            </div>
          </mat-tab>
        </mat-tab-group>
        
        <div class="view-all-alerts" *ngIf="alerts.length > 0 && !error">
          <a mat-button color="primary" routerLink="/monitoring/alerts">
            Ver todas las alertas
          </a>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .alerts-widget {
      height: 100%;
    }
    
    .alert-badge {
      margin-left: 8px;
    }
    
    .critical-icon {
      color: #f44336;
    }
    
    .warning-icon {
      color: #ff9800;
    }
    
    .info-icon {
      color: #2196f3;
    }
    
    .alerts-list {
      max-height: 300px;
      overflow-y: auto;
      padding: 8px 0;
    }
    
    .alert-item {
      display: flex;
      justify-content: space-between;
      padding: 12px;
      border-radius: 4px;
      margin-bottom: 8px;
    }
    
    .alert-item.critical {
      background-color: rgba(244, 67, 54, 0.08);
      border-left: 4px solid #f44336;
    }
    
    .alert-item.warning {
      background-color: rgba(255, 152, 0, 0.08);
      border-left: 4px solid #ff9800;
    }
    
    .alert-item.info {
      background-color: rgba(33, 150, 243, 0.08);
      border-left: 4px solid #2196f3;
    }
    
    .alert-header {
      display: flex;
      align-items: center;
      margin-bottom: 4px;
    }
    
    .alert-header mat-icon {
      margin-right: 8px;
    }
    
    .alert-timestamp {
      color: rgba(0, 0, 0, 0.54);
      font-size: 12px;
    }
    
    .alert-message {
      font-weight: 500;
      margin-bottom: 4px;
    }
    
    .alert-element {
      font-size: 12px;
      color: rgba(0, 0, 0, 0.6);
    }
    
    .alert-actions {
      display: flex;
      align-items: center;
    }
    
    .no-alerts {
      text-align: center;
      color: rgba(0, 0, 0, 0.54);
      padding: 16px;
    }
    
    .view-all-alerts {
      text-align: center;
      margin-top: 16px;
    }
    
    .loading-indicator {
      display: flex;
      justify-content: center;
      padding: 20px;
    }
    
    .error-message {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      color: #f44336;
      gap: 8px;
    }
  `]
})
export class SystemAlertsWidgetComponent implements OnInit {
  @Input() maxAlerts = 5;
  @Input() showViewAllButton = true;
  @Input() elementId?: string;
  
  @Output() dataLoaded = new EventEmitter<boolean>();
  @Output() errorOccurred = new EventEmitter<Error>();
  @Output() alertAcknowledged = new EventEmitter<string>();
  @Output() criticalAlertsCountChanged = new EventEmitter<number>();
  
  alerts: Alert[] = [];
  loading = false;
  error = false;
  errorMessage = 'Error al cargar las alertas.';
  
  get criticalAlerts(): Alert[] {
    return this.alerts.filter(alert => alert.type === 'critical')
      .slice(0, this.maxAlerts);
  }
  
  get warningAlerts(): Alert[] {
    return this.alerts.filter(alert => alert.type === 'warning')
      .slice(0, this.maxAlerts);
  }
  
  get infoAlerts(): Alert[] {
    return this.alerts.filter(alert => alert.type === 'info')
      .slice(0, this.maxAlerts);
  }
  
  get criticalCount(): number {
    return this.alerts.filter(alert => alert.type === 'critical' && !alert.acknowledged).length;
  }
  
  constructor() {}
  
  ngOnInit(): void {
    this.refreshAlerts();
  }
  
  refreshAlerts(): void {
    this.loading = true;
    this.error = false;
    
    // Simulate API call
    setTimeout(() => {
      try {
        // Simulated API data
        this.alerts = [
          {
            id: 'a1',
            type: 'critical',
            message: 'OLT-01 fuera de línea',
            timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
            elementId: 'olt-01',
            elementName: 'OLT Principal',
            acknowledged: false
          },
          {
            id: 'a2',
            type: 'warning',
            message: 'Alta temperatura en ONT-24',
            timestamp: new Date(Date.now() - 120 * 60000).toISOString(),
            elementId: 'ont-24',
            elementName: 'ONT Cliente Residencial',
            acknowledged: true
          },
          {
            id: 'a3',
            type: 'warning',
            message: 'Señal baja en fibra troncal norte',
            timestamp: new Date(Date.now() - 240 * 60000).toISOString(),
            elementId: 'fiber-101',
            elementName: 'Fibra Troncal Norte',
            acknowledged: false
          },
          {
            id: 'a4',
            type: 'info',
            message: 'Mantenimiento programado en 2 horas',
            timestamp: new Date(Date.now() - 360 * 60000).toISOString(),
            acknowledged: false
          },
          {
            id: 'a5',
            type: 'critical',
            message: 'Pérdida de potencia en Splitter-03',
            timestamp: new Date(Date.now() - 45 * 60000).toISOString(),
            elementId: 'splitter-03',
            elementName: 'Splitter Zona Este',
            acknowledged: false
          }
        ];
        
        // If elementId is provided, filter alerts for that element
        if (this.elementId) {
          this.alerts = this.alerts.filter(alert => alert.elementId === this.elementId);
        }
        
        this.loading = false;
        this.dataLoaded.emit(true);
        this.criticalAlertsCountChanged.emit(this.criticalCount);
      } catch (error) {
        this.handleError(error);
      }
    }, 1000);
  }
  
  toggleAcknowledge(alert: Alert): void {
    alert.acknowledged = !alert.acknowledged;
    this.alertAcknowledged.emit(alert.id);
    this.criticalAlertsCountChanged.emit(this.criticalCount);
  }
  
  private handleError(error: any): void {
    this.loading = false;
    this.error = true;
    this.errorMessage = error.message || 'Error al cargar las alertas.';
    this.errorOccurred.emit(error);
  }
} 