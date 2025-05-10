import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subscription } from 'rxjs';

import { DashboardService } from '../../services/dashboard.service';
import { FiberActivity, ActivityType, FiberDeviceType } from '../../models/dashboard.models';

@Component({
  selector: 'app-recent-activities',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatDividerModule,
    MatTooltipModule
  ],
  template: `
    <div class="activities-container">
      <div class="activities-header">
        <h3>Actividades Recientes</h3>
        <button mat-button color="primary" (click)="refreshActivities()">
          <mat-icon>refresh</mat-icon>
          Actualizar
        </button>
      </div>

      <div class="activities-list">
        <div class="activity-item" *ngFor="let activity of activities">
          <div class="activity-icon" [ngClass]="activity.type">
            <mat-icon>{{getActivityIcon(activity.type)}}</mat-icon>
          </div>
          <div class="activity-content">
            <div class="activity-header">
              <span class="activity-action">{{activity.action}}</span>
              <span class="activity-time">{{activity.timestamp | date:'short'}}</span>
            </div>
            <div class="activity-details">
              <span class="activity-user">{{activity.user}}</span>
              <span class="activity-type" [matTooltip]="getActivityTypeTooltip(activity.type)">
                {{getActivityTypeLabel(activity.type)}}
              </span>
            </div>
            <p class="activity-description" *ngIf="activity.details">
              {{activity.details}}
            </p>
            <div class="activity-info" *ngIf="activity.deviceId || activity.location || activity.fiberSegment">
              <div class="info-item" *ngIf="activity.deviceId">
                <span class="info-label">Dispositivo:</span>
                <span class="info-value">{{activity.deviceId}}</span>
                <span class="info-type" *ngIf="activity.deviceType">({{activity.deviceType}})</span>
              </div>
              <div class="info-item" *ngIf="activity.location">
                <span class="info-label">Ubicación:</span>
                <span class="info-value">{{activity.location}}</span>
              </div>
              <div class="info-item" *ngIf="activity.fiberSegment">
                <span class="info-label">Segmento:</span>
                <span class="info-value">{{activity.fiberSegment}}</span>
              </div>
              <div class="info-item" *ngIf="activity.maintenanceType">
                <span class="info-label">Tipo de mantenimiento:</span>
                <span class="info-value">{{activity.maintenanceType === 'preventive' ? 'Preventivo' : 'Correctivo'}}</span>
              </div>
              <div class="info-item" *ngIf="activity.affectedUsers">
                <span class="info-label">Usuarios afectados:</span>
                <span class="info-value">{{activity.affectedUsers}}</span>
              </div>
              <div class="info-item" *ngIf="activity.workOrderId">
                <span class="info-label">Orden de trabajo:</span>
                <span class="info-value">{{activity.workOrderId}}</span>
              </div>
              <div class="info-item" *ngIf="activity.technician">
                <span class="info-label">Técnico:</span>
                <span class="info-value">{{activity.technician}}</span>
              </div>
              <div class="info-item" *ngIf="activity.estimatedDuration">
                <span class="info-label">Duración estimada:</span>
                <span class="info-value">{{activity.estimatedDuration}} minutos</span>
              </div>
              <div class="info-item" *ngIf="activity.completionStatus">
                <span class="info-label">Estado:</span>
                <span class="info-value">{{getCompletionStatusLabel(activity.completionStatus)}}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="no-activities" *ngIf="activities.length === 0">
        <mat-icon>history</mat-icon>
        <p>No hay actividades recientes</p>
      </div>
    </div>
  `,
  styles: [`
    .activities-container {
      padding: 16px;
    }

    .activities-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .activities-header h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 500;
    }

    .activities-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .activity-item {
      display: flex;
      gap: 12px;
      padding: 12px;
      background-color: #f5f5f5;
      border-radius: 8px;
    }

    .activity-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: 50%;
    }

    .activity-icon.config {
      background-color: #e3f2fd;
      color: #1976d2;
    }

    .activity-icon.monitor {
      background-color: #e8f5e9;
      color: #2e7d32;
    }

    .activity-icon.alert {
      background-color: #fff3e0;
      color: #f57c00;
    }

    .activity-icon.system {
      background-color: #f3e5f5;
      color: #7b1fa2;
    }

    .activity-icon.maintenance {
      background-color: #fce4ec;
      color: #c2185b;
    }

    .activity-content {
      flex: 1;
    }

    .activity-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;
    }

    .activity-action {
      font-weight: 500;
    }

    .activity-time {
      font-size: 12px;
      color: #757575;
    }

    .activity-details {
      display: flex;
      gap: 16px;
      font-size: 12px;
      color: #757575;
      margin-bottom: 4px;
    }

    .activity-description {
      margin: 0;
      font-size: 14px;
      color: #424242;
      margin-bottom: 8px;
    }

    .activity-info {
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

    .no-activities {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 32px;
      color: #757575;
      text-align: center;
    }

    .no-activities mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 16px;
      opacity: 0.5;
    }

    @media (max-width: 600px) {
      .activity-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 4px;
      }

      .activity-details {
        flex-direction: column;
        gap: 4px;
      }
    }
  `]
})
export class RecentActivitiesComponent implements OnInit, OnDestroy {
  activities: FiberActivity[] = [];
  private subscription = new Subscription();

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.subscription.add(
      this.dashboardService.getActivities().subscribe(activities => {
        this.activities = activities;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  getActivityIcon(type: ActivityType): string {
    switch (type) {
      case ActivityType.CONFIG:
        return 'settings';
      case ActivityType.MONITOR:
        return 'monitor';
      case ActivityType.ALERT:
        return 'warning';
      case ActivityType.SYSTEM:
        return 'computer';
      case ActivityType.MAINTENANCE:
        return 'build';
      default:
        return 'info';
    }
  }

  getActivityTypeLabel(type: ActivityType): string {
    switch (type) {
      case ActivityType.CONFIG:
        return 'Configuración';
      case ActivityType.MONITOR:
        return 'Monitoreo';
      case ActivityType.ALERT:
        return 'Alerta';
      case ActivityType.SYSTEM:
        return 'Sistema';
      case ActivityType.MAINTENANCE:
        return 'Mantenimiento';
      default:
        return type;
    }
  }

  getActivityTypeTooltip(type: ActivityType): string {
    switch (type) {
      case ActivityType.CONFIG:
        return 'Cambios en la configuración del sistema';
      case ActivityType.MONITOR:
        return 'Eventos de monitoreo de red';
      case ActivityType.ALERT:
        return 'Alertas y notificaciones';
      case ActivityType.SYSTEM:
        return 'Eventos del sistema';
      case ActivityType.MAINTENANCE:
        return 'Actividades de mantenimiento';
      default:
        return '';
    }
  }

  getCompletionStatusLabel(status: string): string {
    switch (status) {
      case 'pending':
        return 'Pendiente';
      case 'in-progress':
        return 'En progreso';
      case 'completed':
        return 'Completado';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  }

  refreshActivities(): void {
    this.dashboardService.refreshActivities().subscribe(activities => {
      this.activities = activities;
    });
  }
} 