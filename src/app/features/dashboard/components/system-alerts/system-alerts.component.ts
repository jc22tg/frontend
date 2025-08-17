import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subscription } from 'rxjs';

import { DashboardService } from '../../services/dashboard.service';
import { FiberAlert, AlertSeverity, FiberDeviceType } from '../../models/dashboard.models';

@Component({
  selector: 'app-system-alerts',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatTooltipModule
  ],
  template: `
    <div class="alerts-container">
      <div class="alerts-header">
        <div class="alerts-summary">
          <div class="alert-count error">
            <mat-icon>error</mat-icon>
            <span>{{getAlertCount(AlertSeverity.ERROR)}}</span>
          </div>
          <div class="alert-count warning">
            <mat-icon>warning</mat-icon>
            <span>{{getAlertCount(AlertSeverity.WARNING)}}</span>
          </div>
          <div class="alert-count info">
            <mat-icon>info</mat-icon>
            <span>{{getAlertCount(AlertSeverity.INFO)}}</span>
          </div>
        </div>
        <button mat-button color="primary" (click)="refreshAlerts()">
          <mat-icon>refresh</mat-icon>
          Actualizar
        </button>
      </div>

      <div class="alerts-list">
        <div class="alert-item" *ngFor="let alert of alerts" [class.resolved]="alert.status === 'resolved'">
          <div class="alert-icon" [ngClass]="alert.type">
            <mat-icon>{{getAlertIcon(alert.type)}}</mat-icon>
          </div>
          <div class="alert-content">
            <div class="alert-header">
              <span class="alert-message">{{alert.message}}</span>
              <mat-chip-listbox>
                <mat-chip [color]="alert.status === 'active' ? 'warn' : 'primary'" selected>
                  {{alert.status === 'active' ? 'Activa' : 'Resuelta'}}
                </mat-chip>
              </mat-chip-listbox>
            </div>
            <div class="alert-details">
              <span class="alert-source">{{alert.source}}</span>
              <span class="alert-time">{{alert.timestamp | date:'short'}}</span>
            </div>
            <div class="alert-info" *ngIf="alert.deviceId || alert.location">
              <div class="info-item" *ngIf="alert.deviceId">
                <span class="info-label">Dispositivo:</span>
                <span class="info-value">{{alert.deviceId}}</span>
                <span class="info-type" *ngIf="alert.deviceType">({{alert.deviceType}})</span>
              </div>
              <div class="info-item" *ngIf="alert.location">
                <span class="info-label">Ubicación:</span>
                <span class="info-value">{{alert.location}}</span>
              </div>
              <div class="info-item" *ngIf="alert.fiberSegment">
                <span class="info-label">Segmento:</span>
                <span class="info-value">{{alert.fiberSegment}}</span>
              </div>
              <div class="info-item" *ngIf="alert.opticalPower">
                <span class="info-label">Potencia óptica:</span>
                <span class="info-value">{{alert.opticalPower}} dBm</span>
              </div>
              <div class="info-item" *ngIf="alert.priority">
                <span class="info-label">Prioridad:</span>
                <span class="info-value">{{alert.priority}}</span>
              </div>
              <div class="info-item" *ngIf="alert.maintenanceSchedule">
                <span class="info-label">Mantenimiento programado:</span>
                <span class="info-value">{{alert.maintenanceSchedule | date:'short'}}</span>
              </div>
            </div>
          </div>
          <div class="alert-actions">
            <button mat-icon-button [matTooltip]="alert.status === 'active' ? 'Resolver alerta' : 'Reactivar alerta'"
                    (click)="toggleAlertStatus(alert)">
              <mat-icon>{{alert.status === 'active' ? 'check_circle' : 'refresh'}}</mat-icon>
            </button>
          </div>
        </div>
      </div>

      <div class="no-alerts" *ngIf="alerts.length === 0">
        <mat-icon>notifications_off</mat-icon>
        <p>No hay alertas activas</p>
      </div>
    </div>
  `,
  styles: [`
    .alerts-container {
      padding: 16px;
    }

    .alerts-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .alerts-summary {
      display: flex;
      gap: 16px;
    }

    .alert-count {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px 8px;
      border-radius: 16px;
      font-weight: 500;
    }

    .alert-count.error {
      background-color: #ffebee;
      color: #d32f2f;
    }

    .alert-count.warning {
      background-color: #fff3e0;
      color: #f57c00;
    }

    .alert-count.info {
      background-color: #e3f2fd;
      color: #1976d2;
    }

    .alerts-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .alert-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px;
      background-color: #f5f5f5;
      border-radius: 8px;
      transition: all 0.3s ease;
    }

    .alert-item.resolved {
      opacity: 0.7;
    }

    .alert-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: 50%;
    }

    .alert-icon.error {
      background-color: #ffebee;
      color: #d32f2f;
    }

    .alert-icon.warning {
      background-color: #fff3e0;
      color: #f57c00;
    }

    .alert-icon.info {
      background-color: #e3f2fd;
      color: #1976d2;
    }

    .alert-content {
      flex: 1;
    }

    .alert-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;
    }

    .alert-message {
      font-weight: 500;
    }

    .alert-details {
      display: flex;
      gap: 16px;
      font-size: 12px;
      color: #757575;
      margin-bottom: 8px;
    }

    .alert-info {
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px solid #e0e0e0;
    }

    .info-item {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 4px;
      font-size: 12px;
    }

    .info-label {
      color: #757575;
    }

    .info-value {
      font-weight: 500;
    }

    .info-type {
      color: #757575;
      font-size: 11px;
    }

    .no-alerts {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 32px;
      color: #757575;
      text-align: center;
    }

    .no-alerts mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 16px;
      opacity: 0.5;
    }

    @media (max-width: 600px) {
      .alerts-header {
        flex-direction: column;
        gap: 12px;
      }

      .alerts-summary {
        width: 100%;
        justify-content: space-between;
      }

      .alert-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
      }
    }
  `]
})
export class SystemAlertsComponent implements OnInit, OnDestroy {
  alerts: FiberAlert[] = [];
  private subscription = new Subscription();
  AlertSeverity = AlertSeverity; // Para usar en el template

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.subscription.add(
      this.dashboardService.getAlerts().subscribe(alerts => {
        this.alerts = alerts;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  getAlertCount(type: AlertSeverity): number {
    return this.alerts.filter(alert => alert.type === type).length;
  }

  getAlertIcon(type: AlertSeverity): string {
    switch (type) {
      case AlertSeverity.ERROR:
        return 'error';
      case AlertSeverity.WARNING:
        return 'warning';
      case AlertSeverity.INFO:
        return 'info';
      case AlertSeverity.CRITICAL:
        return 'dangerous';
      default:
        return 'notifications';
    }
  }

  refreshAlerts(): void {
    this.dashboardService.refreshAlerts().subscribe(alerts => {
      this.alerts = alerts;
    });
  }

  toggleAlertStatus(alert: FiberAlert): void {
    this.dashboardService.toggleAlertStatus(alert.id).subscribe();
  }
} 
