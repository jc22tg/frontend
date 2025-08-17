import { Component, OnInit, OnDestroy, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { BaseWidgetComponent } from '../../../widgets/base/base-widget.component';
import { MonitoringService } from '../../../../services/monitoring.service';
import { LoggerService } from '../../../../../../core/services/logger.service';
import { NetworkElement, ElementType, NetworkAlert } from '../../../../../../shared/types/network.types';
import { ExtendedElementType } from '../../../../../../shared/types/network-elements';
import { fadeAnimation, slideInUpAnimation } from '../../../../../../shared/animations/common.animations';

/**
 * Widget para gestión y monitoreo de alertas del sistema
 * 
 * Permite visualizar, filtrar, reconocer y resolver alertas de la red.
 * Se integra con el servicio de monitoreo para obtener y gestionar alertas en tiempo real.
 */
@Component({
  selector: 'app-alert-management-widget',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatBadgeModule,
    MatTooltipModule,
    MatButtonToggleModule,
    MatSlideToggleModule,
    MatPaginatorModule,
    MatDividerModule,
    MatMenuModule,
    MatChipsModule,
    MatSnackBarModule
  ],
  template: `
    <div class="widget-container alert-management-widget" 
         *ngIf="(widgetState$ | async)?.isVisible">
      <div class="widget-header">
        <h3>
          <mat-icon [matBadge]="criticalCount" 
                   [matBadgeHidden]="criticalCount === 0"
                   matBadgeColor="warn"
                   matBadgeSize="small">notification_important</mat-icon>
          <span>{{ title }}</span>
        </h3>
        <div class="widget-controls">
          <button mat-icon-button (click)="refreshAlerts()" matTooltip="Actualizar alertas">
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
        <!-- Resumen de alertas -->
        <div class="alert-summary">
          <div class="stat-card critical" [class.empty]="criticalCount === 0" (click)="severityFilter = 'CRITICAL'; applyFilters()">
            <div class="stat-icon">
              <mat-icon>error</mat-icon>
            </div>
            <div class="stat-content">
              <span class="stat-count">{{ criticalCount }}</span>
              <span class="stat-label">Críticas</span>
            </div>
          </div>
          <div class="stat-card warning" [class.empty]="warningCount === 0" (click)="severityFilter = 'HIGH'; applyFilters()">
            <div class="stat-icon">
              <mat-icon>warning</mat-icon>
            </div>
            <div class="stat-content">
              <span class="stat-count">{{ warningCount }}</span>
              <span class="stat-label">Advertencias</span>
            </div>
          </div>
          <div class="stat-card info" [class.empty]="infoCount === 0" (click)="severityFilter = 'LOW'; applyFilters()">
            <div class="stat-icon">
              <mat-icon>info</mat-icon>
            </div>
            <div class="stat-content">
              <span class="stat-count">{{ infoCount }}</span>
              <span class="stat-label">Información</span>
            </div>
          </div>
        </div>

        <!-- Filtros -->
        <div class="alert-filters">
          <mat-button-toggle-group [value]="severityFilter" (change)="severityFilter = $event.value; applyFilters()">
            <mat-button-toggle value="all" matTooltip="Todas las alertas">
              Todas
            </mat-button-toggle>
            <mat-button-toggle value="CRITICAL" matTooltip="Solo alertas críticas">
              <mat-icon class="severity-critical">error</mat-icon>
            </mat-button-toggle>
            <mat-button-toggle value="HIGH" matTooltip="Solo alertas de alta prioridad">
              <mat-icon class="severity-high">warning</mat-icon>
            </mat-button-toggle>
            <mat-button-toggle value="LOW" matTooltip="Solo alertas de baja prioridad">
              <mat-icon class="severity-low">info</mat-icon>
            </mat-button-toggle>
          </mat-button-toggle-group>
          
          <mat-slide-toggle
            [checked]="showResolved"
            (change)="showResolved = $event.checked; applyFilters()"
            color="primary">
            Mostrar resueltas
          </mat-slide-toggle>
        </div>

        <mat-divider></mat-divider>

        <!-- Lista de alertas -->
        <div *ngIf="alerts.length > 0" class="alert-list">
          <div *ngIf="hasFiltersApplied()" class="filter-info">
            {{ getFilterDescription() }}
            <button mat-button color="primary" (click)="resetFilters()">
              <mat-icon>clear</mat-icon> Limpiar filtros
            </button>
          </div>

          <div *ngIf="filteredAlerts.length === 0" class="no-alerts-message">
            <mat-icon>filter_alt</mat-icon>
            <p>No hay alertas que coincidan con los filtros actuales</p>
          </div>

          <div *ngFor="let alert of filteredAlerts" 
               class="alert-item"
               [ngClass]="'severity-' + alert.severity"
               [class.resolved]="alert.resolved">
            <div class="alert-icon">
              <mat-icon *ngIf="alert.severity === 'CRITICAL'">error</mat-icon>
              <mat-icon *ngIf="alert.severity === 'HIGH'">warning</mat-icon>
              <mat-icon *ngIf="alert.severity === 'LOW'">info</mat-icon>
            </div>
            <div class="alert-content">
              <div class="alert-header">
                <span class="alert-title">{{ alert.title }}</span>
                <span class="alert-timestamp">{{ formatTime(alert.timestamp) }}</span>
              </div>
              <div class="alert-message">{{ alert.message }}</div>
              <div class="alert-element">
                <mat-icon class="element-icon">{{ getElementTypeIcon(alert.elementType) }}</mat-icon>
                <span>{{ alert.elementId }}</span>
              </div>
              <div class="alert-status" *ngIf="alert.resolved">
                <mat-chip color="primary" selected>Resuelta</mat-chip>
              </div>
            </div>
            <div class="alert-actions">
              <button mat-icon-button [matMenuTriggerFor]="menu" aria-label="Opciones">
                <mat-icon>more_vert</mat-icon>
              </button>
              <mat-menu #menu="matMenu">
                <button mat-menu-item (click)="toggleResolved(alert)">
                  <mat-icon>{{ alert.resolved ? 'restore' : 'done' }}</mat-icon>
                  <span>{{ alert.resolved ? 'Reabrir' : 'Resolver' }}</span>
                </button>
                <button mat-menu-item (click)="deleteAlert(alert)">
                  <mat-icon>delete</mat-icon>
                  <span>Eliminar</span>
                </button>
              </mat-menu>
            </div>
          </div>
        </div>

        <!-- Cuando no hay alertas -->
        <div *ngIf="alerts.length === 0" class="empty-state">
          <mat-icon>notifications_off</mat-icon>
          <p>No hay alertas activas en el sistema</p>
        </div>

        <!-- Paginación -->
        <mat-paginator 
          *ngIf="alerts.length > pageSize"
          [length]="totalFilteredAlerts"
          [pageSize]="pageSize"
          [pageIndex]="currentPage"
          [pageSizeOptions]="[5, 10, 25, 50]"
          (page)="onPageChange($event)">
        </mat-paginator>

        <!-- Acciones globales -->
        <div class="alert-global-actions" *ngIf="alerts.length > 0">
          <button mat-button color="warn" [disabled]="!hasResolved()" (click)="clearResolvedAlerts()">
            <mat-icon>delete_sweep</mat-icon>
            Eliminar resueltas
          </button>
          <button mat-button color="primary" (click)="exportAlerts()">
            <mat-icon>download</mat-icon>
            Exportar
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .alert-management-widget {
      width: 100%;
      max-width: 400px;
      min-width: 320px;
    }
    
    .alert-summary {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      margin-bottom: 16px;
    }
    
    .stat-card {
      padding: 8px;
      border-radius: 4px;
      display: flex;
      flex-direction: column;
      align-items: center;
      cursor: pointer;
      transition: transform 0.2s;
    }
    
    .stat-card:hover {
      transform: translateY(-2px);
    }
    
    .stat-card.critical {
      background-color: rgba(244, 67, 54, 0.1);
      color: #f44336;
    }
    
    .stat-card.warning {
      background-color: rgba(255, 152, 0, 0.1);
      color: #ff9800;
    }
    
    .stat-card.info {
      background-color: rgba(33, 150, 243, 0.1);
      color: #2196f3;
    }
    
    .stat-card.empty {
      opacity: 0.5;
    }
    
    .stat-content {
      text-align: center;
    }
    
    .stat-count {
      font-size: 18px;
      font-weight: 700;
    }
    
    .stat-label {
      font-size: 12px;
    }
    
    .alert-filters {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    
    .alert-list {
      margin-top: 16px;
      max-height: 350px;
      overflow-y: auto;
    }
    
    .alert-item {
      display: flex;
      padding: 12px;
      margin-bottom: 8px;
      border-radius: 4px;
      background-color: #f9f9f9;
      border-left: 4px solid #999;
    }
    
    .alert-item.severity-critical {
      border-left-color: #f44336;
      background-color: rgba(244, 67, 54, 0.05);
    }
    
    .alert-item.severity-warning {
      border-left-color: #ff9800;
      background-color: rgba(255, 152, 0, 0.05);
    }
    
    .alert-item.severity-info {
      border-left-color: #2196f3;
      background-color: rgba(33, 150, 243, 0.05);
    }
    
    .alert-item.resolved {
      opacity: 0.7;
      border-left-color: #4caf50;
      background-color: rgba(76, 175, 80, 0.05);
    }
    
    .alert-icon {
      margin-right: 12px;
      display: flex;
      align-items: flex-start;
    }
    
    .alert-icon .mat-icon {
      width: 24px;
      height: 24px;
    }
    
    .severity-critical .alert-icon .mat-icon {
      color: #f44336;
    }
    
    .severity-warning .alert-icon .mat-icon {
      color: #ff9800;
    }
    
    .severity-info .alert-icon .mat-icon {
      color: #2196f3;
    }
    
    .alert-content {
      flex: 1;
    }
    
    .alert-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 4px;
    }
    
    .alert-title {
      font-weight: 500;
      font-size: 14px;
    }
    
    .alert-timestamp {
      font-size: 12px;
      color: #757575;
    }
    
    .alert-message {
      font-size: 13px;
      margin-bottom: 8px;
      color: #333;
    }
    
    .alert-element {
      display: flex;
      align-items: center;
      font-size: 12px;
      color: #555;
    }
    
    .element-icon {
      font-size: 16px;
      height: 16px;
      width: 16px;
      margin-right: 4px;
    }
    
    .alert-status {
      margin-top: 8px;
    }
    
    .empty-state {
      text-align: center;
      padding: 48px 16px;
      color: #757575;
    }
    
    .empty-state mat-icon {
      font-size: 48px;
      height: 48px;
      width: 48px;
      opacity: 0.5;
      margin-bottom: 16px;
    }
    
    .filter-info {
      font-size: 12px;
      color: #757575;
      margin-bottom: 12px;
      padding: 8px;
      background-color: #f5f5f5;
      border-radius: 4px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .no-alerts-message {
      text-align: center;
      padding: 24px;
      color: #757575;
    }
    
    .no-alerts-message mat-icon {
      font-size: 36px;
      height: 36px;
      width: 36px;
      opacity: 0.5;
      margin-bottom: 8px;
    }
    
    .alert-global-actions {
      display: flex;
      justify-content: space-between;
      margin-top: 16px;
    }
    
    .severity-critical {
      color: #f44336;
    }
    
    .severity-warning {
      color: #ff9800;
    }
    
    .severity-info {
      color: #2196f3;
    }
  `],
  animations: [fadeAnimation, slideInUpAnimation]
})
export class AlertManagementWidgetComponent extends BaseWidgetComponent implements OnInit, OnDestroy {
  /** Lista de todas las alertas */
  alerts: NetworkAlert[] = [];
  
  /** Lista de alertas filtradas */
  filteredAlerts: NetworkAlert[] = [];
  
  /** Filtro de severidad */
  severityFilter: 'all' | 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' = 'all';
  
  /** Mostrar alertas resueltas */
  showResolved = false;
  
  /** Paginación */
  pageSize = 10;
  currentPage = 0;
  totalFilteredAlerts = 0;
  
  /** Indica si se están cargando datos */
  isLoading = false;
  
  // Servicios inyectados
  private monitoringService = inject(MonitoringService);
  private snackBar = inject(MatSnackBar);
  private logger = inject(LoggerService);
  
  constructor() {
    super();
    this.widgetId = 'alert-management-widget';
    this.title = 'Gestión de Alertas';
    this.position = 'top-right';
  }
  
  override ngOnInit(): void {
    super.ngOnInit();
    this.loadAlerts();
  }
  
  /**
   * Carga las alertas desde el servicio de monitoreo
   */
  private loadAlerts(): void {
    this.isLoading = true;
    
    this.monitoringService.getAlerts()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(error => {
          this.handleError('loadAlerts', error);
          return of([]);
        })
      )
      .subscribe({
        next: (alerts) => {
          this.alerts = alerts;
          this.applyFilters();
          this.isLoading = false;
        },
        error: (error) => {
          this.handleError('loadAlerts', error);
          this.isLoading = false;
        }
      });
  }
  
  /**
   * Aplica los filtros actuales a la lista de alertas
   */
  applyFilters(): void {
    let filtered = [...this.alerts];
    
    // Filtrar por severidad
    if (this.severityFilter !== 'all') {
      filtered = filtered.filter(alert => alert.severity === this.severityFilter);
    }
    
    // Filtrar por estado resuelto/no resuelto
    if (!this.showResolved) {
      filtered = filtered.filter(alert => !alert.resolved);
    }
    
    // Ordenar por timestamp (más recientes primero)
    filtered.sort((a, b) => {
      const timeA = a.timestamp instanceof Date ? a.timestamp.getTime() : a.timestamp as number;
      const timeB = b.timestamp instanceof Date ? b.timestamp.getTime() : b.timestamp as number;
      return timeB - timeA;
    });
    
    this.totalFilteredAlerts = filtered.length;
    
    // Aplicar paginación
    const startIndex = this.currentPage * this.pageSize;
    this.filteredAlerts = filtered.slice(startIndex, startIndex + this.pageSize);
  }
  
  /**
   * Gestiona el cambio de página
   */
  onPageChange(event: PageEvent): void {
    this.pageSize = event.pageSize;
    this.currentPage = event.pageIndex;
    this.applyFilters();
  }
  
  /**
   * Resetea todos los filtros
   */
  resetFilters(): void {
    this.severityFilter = 'all';
    this.showResolved = false;
    this.currentPage = 0;
    this.applyFilters();
  }
  
  /**
   * Determina si hay filtros aplicados
   */
  hasFiltersApplied(): boolean {
    return this.severityFilter !== 'all' || this.showResolved;
  }
  
  /**
   * Obtiene una descripción de los filtros aplicados
   */
  getFilterDescription(): string {
    const parts: string[] = [];
    if (this.severityFilter !== 'all') {
      parts.push(`Severidad: ${this.getSeverityName(this.severityFilter)}`);
    }
    if (this.showResolved) {
      parts.push('Incluyendo resueltas');
    }
    return parts.length ? `Filtros: ${parts.join(', ')}` : '';
  }
  
  /**
   * Obtiene nombre legible para una severidad
   */
  getSeverityName(severity: string): string {
    switch (severity) {
      case 'CRITICAL':
      case 'HIGH':
        return 'Crítica';
      case 'MEDIUM':
        return 'Advertencia';
      case 'LOW':
        return 'Información';
      default: return 'Todas';
    }
  }
  
  /**
   * Verifica si hay alertas resueltas
   */
  hasResolved(): boolean {
    return this.alerts.some(alert => alert.resolved);
  }
  
  /**
   * Obtiene el número de alertas críticas
   */
  get criticalCount(): number {
    return this.alerts.filter(alert => (alert.severity === 'CRITICAL' || alert.severity === 'HIGH') && !alert.resolved).length;
  }
  
  /**
   * Obtiene el número de alertas de advertencia
   */
  get warningCount(): number {
    return this.alerts.filter(alert => alert.severity === 'MEDIUM' && !alert.resolved).length;
  }
  
  /**
   * Obtiene el número de alertas informativas
   */
  get infoCount(): number {
    return this.alerts.filter(alert => alert.severity === 'LOW' && !alert.resolved).length;
  }
  
  /**
   * Actualiza las alertas desde el servicio
   */
  refreshAlerts(): void {
    this.loadAlerts();
  }
  
  /**
   * Cambia el estado resuelto de una alerta
   */
  toggleResolved(alert: NetworkAlert): void {
    if (alert.resolved) {
      this.monitoringService.reopenAlert(alert.id);
      this.showNotification('Alerta reabierta');
    } else {
      this.monitoringService.resolveAlert(alert.id);
      this.showNotification('Alerta marcada como resuelta');
    }
    
    // Actualizar la lista local
    const index = this.alerts.findIndex(a => a.id === alert.id);
    if (index >= 0) {
      this.alerts[index] = { ...alert, resolved: !alert.resolved };
      this.applyFilters();
    }
  }
  
  /**
   * Elimina una alerta
   */
  deleteAlert(alert: NetworkAlert): void {
    this.monitoringService.removeAlert(alert.id);
    
    // Actualizar lista local
    this.alerts = this.alerts.filter(a => a.id !== alert.id);
    this.applyFilters();
    
    this.showNotification('Alerta eliminada');
  }
  
  /**
   * Elimina todas las alertas resueltas
   */
  clearResolvedAlerts(): void {
    const resolvedAlerts = this.alerts.filter(alert => alert.resolved);
    
    if (resolvedAlerts.length === 0) {
      this.showNotification('No hay alertas resueltas para eliminar', 'warning');
      return;
    }
    
    // Eliminar cada alerta resuelta
    resolvedAlerts.forEach(alert => {
      this.monitoringService.removeAlert(alert.id);
    });
    
    // Actualizar lista local
    this.alerts = this.alerts.filter(alert => !alert.resolved);
    this.applyFilters();
    
    this.showNotification(`${resolvedAlerts.length} alertas resueltas eliminadas`);
  }
  
  /**
   * Exporta las alertas a JSON
   */
  exportAlerts(): void {
    try {
      const alertsToExport = this.filteredAlerts.length > 0 ? this.filteredAlerts : this.alerts;
      const dataStr = JSON.stringify(alertsToExport, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
      
      const exportFileName = `network-alerts-${new Date().toISOString().slice(0, 10)}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileName);
      linkElement.click();
      
      this.showNotification('Alertas exportadas con éxito');
    } catch (error) {
      this.logger.error('Error al exportar alertas', error);
      this.showNotification('Error al exportar alertas', 'error');
    }
  }
  
  /**
   * Muestra una notificación
   */
  private showNotification(message: string, type: 'success' | 'error' | 'warning' = 'success'): void {
    const panelClass = `${type}-snackbar`;
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      panelClass
    });
  }
  
  /**
   * Formatea una fecha/hora para mostrar
   */
  formatTime(timestamp: Date | number): string {
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    return date.toLocaleString();
  }
  
  /**
   * Obtiene el icono correspondiente a un tipo de elemento
   */
  getElementTypeIcon(elementType: ElementType): string {
    switch (elementType) {
      case ElementType.OLT:
        return 'router';
      case ElementType.ONT:
        return 'devices';
      case ElementType.ODF:
        return 'hub';
      case ElementType.SPLITTER:
        return 'call_split';
      case ElementType.EDFA:
        return 'power';
      case ElementType.MANGA:
        return 'cable';
      case ElementType.FIBER_CONNECTION:
        return 'swap_horiz';
      default:
        return 'device_hub';
    }
  }
  
  /**
   * Refresca los datos
   */
  override refreshData(): void {
    this.refreshAlerts();
  }
} 
