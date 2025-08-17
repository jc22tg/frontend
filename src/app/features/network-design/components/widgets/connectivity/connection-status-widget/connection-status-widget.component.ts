import { Component, OnInit, OnDestroy, inject, DestroyRef, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, BehaviorSubject, Observable, of } from 'rxjs';
import { takeUntil, switchMap, map, catchError } from 'rxjs/operators';

import { BaseWidgetComponent } from '../../base/base-widget.component';
import { ConnectionService } from '../../../../services/connection.service';
import { MapStateService } from '../../../../services/map/state/map-state.service';
import { LoggerService } from '../../../../../../core/services/logger.service';
import { ElementService } from '../../../../services/element.service';
import { NetworkElement, NetworkConnection, ElementStatus, ElementType, ConnectionStatus } from '../../../../../../shared/types/network.types';
import { fadeAnimation, slideInUpAnimation } from '../../../../../../shared/animations/common.animations';
import { ExtendedElementType } from '../../../../../../shared/types/network-elements';
import { WidgetActionEvent, WidgetErrorEvent, WidgetUpdateEvent } from '../../container/map-widgets-container/map-widgets-container.component';

/**
 * Interfaz para estadísticas de conexiones
 */
interface ConnectionStats {
  total: number;
  active: number;
  inactive: number;
  warning: number;
  fault: number;
  maintenance: number;
}

// Añadir la propiedad label al tipo NetworkConnection
interface EnhancedNetworkConnection extends NetworkConnection {
  label?: string;
}

/**
 * Widget que muestra el estado de las conexiones y permite filtrarlas por estado
 * 
 * Proporciona información sobre el estado de las conexiones de la red y
 * permite al usuario visualizar el estado actual de conectividad entre elementos.
 */
@Component({
  selector: 'app-connection-status-widget',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatIconModule,
    MatDividerModule,
    MatButtonModule,
    MatProgressBarModule,
    MatTooltipModule,
    MatButtonToggleModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="widget-container connection-status-widget" 
         *ngIf="(widgetState$ | async)?.isVisible">
      <div class="widget-header">
        <h3>
          <mat-icon>settings_ethernet</mat-icon>
          <span>{{ title }}</span>
        </h3>
        <div class="widget-controls">
          <button mat-icon-button (click)="toggleCollapse()" *ngIf="collapsible" matTooltip="Colapsar">
            <mat-icon>{{ (widgetState$ | async)?.isCollapsed ? 'expand_more' : 'expand_less' }}</mat-icon>
          </button>
          <button mat-icon-button (click)="closeWidget()" *ngIf="closable" matTooltip="Cerrar">
            <mat-icon>close</mat-icon>
          </button>
        </div>
      </div>

      <div class="widget-content" *ngIf="!(widgetState$ | async)?.isCollapsed" [@slideInUp]>
        <!-- Selector de elemento -->
        <div class="element-selector" *ngIf="selectedElement">
          <div class="element-info">
            <div class="element-icon" [ngClass]="selectedElement.type.toLowerCase()">
              <mat-icon>{{ getElementTypeIcon(selectedElement.type) }}</mat-icon>
            </div>
            <div class="element-details">
              <span class="element-name">{{ selectedElement.name }}</span>
              <span class="element-type">{{ selectedElement.type }}</span>
            </div>
          </div>
          <button mat-icon-button matTooltip="Actualizar" (click)="refreshData()" [disabled]="isLoading">
            <mat-icon [class.spin]="isLoading">refresh</mat-icon>
          </button>
        </div>

        <div *ngIf="!selectedElement" class="no-element-message" [@fadeAnimation]>
          <mat-icon>touch_app</mat-icon>
          <p>Seleccione un elemento para ver sus conexiones</p>
        </div>

        <!-- Estadísticas de conexiones -->
        <ng-container *ngIf="selectedElement && !isLoading">
          <div class="connection-stats" *ngIf="connections.length > 0">
            <div class="stat-card active" [class.empty]="activeConnections === 0"
                 matTooltip="Conexiones activas" (click)="filterByStatus('ACTIVE')">
              <div class="stat-icon">
                <mat-icon>check_circle</mat-icon>
              </div>
              <div class="stat-content">
                <span class="stat-count">{{ activeConnections }}</span>
                <span class="stat-label">Activas</span>
              </div>
            </div>
            <div class="stat-card warning" [class.empty]="warningConnections === 0"
                 matTooltip="Conexiones con advertencia" (click)="filterByStatus('DEGRADED')">
              <div class="stat-icon">
                <mat-icon>warning</mat-icon>
              </div>
              <div class="stat-content">
                <span class="stat-count">{{ warningConnections }}</span>
                <span class="stat-label">Advertencia</span>
              </div>
            </div>
            <div class="stat-card fault" [class.empty]="faultConnections === 0"
                 matTooltip="Conexiones con falla" (click)="filterByStatus('FAILED')">
              <div class="stat-icon">
                <mat-icon>error</mat-icon>
              </div>
              <div class="stat-content">
                <span class="stat-count">{{ faultConnections }}</span>
                <span class="stat-label">Falla</span>
              </div>
            </div>
            <div class="stat-card maintenance" [class.empty]="maintenanceConnections === 0"
                 matTooltip="Conexiones en mantenimiento" (click)="filterByStatus('PLANNED')">
              <div class="stat-icon">
                <mat-icon>build</mat-icon>
              </div>
              <div class="stat-content">
                <span class="stat-count">{{ maintenanceConnections }}</span>
                <span class="stat-label">Mant.</span>
              </div>
            </div>
            <div class="stat-card inactive" [class.empty]="inactiveConnections === 0"
                 matTooltip="Conexiones inactivas" (click)="filterByStatus('INACTIVE')">
              <div class="stat-icon">
                <mat-icon>cancel</mat-icon>
              </div>
              <div class="stat-content">
                <span class="stat-count">{{ inactiveConnections }}</span>
                <span class="stat-label">Inactivas</span>
              </div>
            </div>
          </div>

          <!-- Filtros -->
          <div class="connection-filters" *ngIf="connections.length > 0">
            <mat-button-toggle-group [value]="statusFilter" (change)="filterByStatus($event.value)">
              <mat-button-toggle value="ALL" matTooltip="Mostrar todas las conexiones">
                Todas
              </mat-button-toggle>
              <mat-button-toggle value="ACTIVE" matTooltip="Solo conexiones activas">
                <mat-icon class="status-active">check_circle</mat-icon>
              </mat-button-toggle>
              <mat-button-toggle value="DEGRADED" matTooltip="Solo conexiones con advertencia">
                <mat-icon class="status-warning">warning</mat-icon>
              </mat-button-toggle>
              <mat-button-toggle value="FAILED" matTooltip="Solo conexiones con falla">
                <mat-icon class="status-fault">error</mat-icon>
              </mat-button-toggle>
              <mat-button-toggle value="PLANNED" matTooltip="Solo conexiones en mantenimiento">
                <mat-icon class="status-maintenance">build</mat-icon>
              </mat-button-toggle>
              <mat-button-toggle value="INACTIVE" matTooltip="Solo conexiones inactivas">
                <mat-icon class="status-inactive">cancel</mat-icon>
              </mat-button-toggle>
            </mat-button-toggle-group>
          </div>

          <!-- Lista de conexiones -->
          <div class="connection-list" *ngIf="filteredConnections.length > 0">
            <div class="connection-item" *ngFor="let connection of filteredConnections"
                 [ngClass]="getConnectionStatusClass(connection.status)"
                 (click)="selectConnection(connection)">
              <div class="connection-status-icon">
                <mat-icon>{{ getConnectionStatusIcon(connection.status) }}</mat-icon>
              </div>
              <div class="connection-details">
                <div class="connection-title">
                  <span class="connection-id">{{ getConnectionLabel(connection) }}</span>
                  <span class="connection-type" *ngIf="connection.capacity">{{ connection.capacity }} Gbps</span>
                </div>
                <div class="connection-endpoint">
                  <span>{{ getConnectionDescription(connection) }}</span>
                </div>
              </div>
              <div class="connection-actions">
                <button mat-icon-button (click)="viewConnectionDetails(connection); $event.stopPropagation()">
                  <mat-icon>visibility</mat-icon>
                </button>
              </div>
            </div>
          </div>

          <!-- Mensaje cuando no hay conexiones -->
          <div class="no-connections-message" *ngIf="connections.length === 0">
            <mat-icon>link_off</mat-icon>
            <p>No hay conexiones para este elemento</p>
            <button mat-stroked-button color="primary" (click)="createNewConnection()">
              <mat-icon>add_link</mat-icon>
              Crear Conexión
            </button>
          </div>

          <!-- Mensaje cuando el filtro no encuentra resultados -->
          <div class="filtered-empty-message" *ngIf="connections.length > 0 && filteredConnections.length === 0">
            <mat-icon>filter_alt</mat-icon>
            <p>No hay conexiones que coincidan con el filtro</p>
            <button mat-stroked-button color="primary" (click)="resetFilter()">
              <mat-icon>clear</mat-icon>
              Limpiar filtros
            </button>
          </div>
        </ng-container>

        <!-- Indicador de carga -->
        <div class="loading-container" *ngIf="isLoading">
          <mat-spinner diameter="40"></mat-spinner>
          <p class="loading-text">Cargando conexiones...</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* Estilos para el contenedor del widget */
    .connection-status-widget {
      min-width: 300px;
      max-width: 400px;
      min-height: 200px;
    }
    
    /* Estilos para el selector de elemento */
    .element-selector {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid #eee;
    }
    
    :host-context(.dark-mode) .element-selector {
      border-bottom-color: #444;
    }
    
    .element-info {
      display: flex;
      align-items: center;
    }
    
    .element-icon {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background-color: #eee;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 8px;
    }
    
    :host-context(.dark-mode) .element-icon {
      background-color: #444;
    }
    
    .element-icon.olt {
      background-color: rgba(76, 175, 80, 0.2);
      color: #4caf50;
    }
    
    .element-icon.fdp {
      background-color: rgba(255, 152, 0, 0.2);
      color: #ff9800;
    }
    
    .element-icon.splitter {
      background-color: rgba(156, 39, 176, 0.2);
      color: #9c27b0;
    }
    
    .element-icon.ont {
      background-color: rgba(33, 150, 243, 0.2);
      color: #2196f3;
    }
    
    .element-details {
      display: flex;
      flex-direction: column;
    }
    
    .element-name {
      font-size: 14px;
      font-weight: 500;
    }
    
    .element-type {
      font-size: 12px;
      color: #757575;
    }
    
    :host-context(.dark-mode) .element-type {
      color: #aaa;
    }
    
    /* Estilos para estadísticas de conexiones */
    .connection-stats {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
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
    
    .stat-card.active {
      background-color: rgba(76, 175, 80, 0.1);
      color: #4caf50;
    }
    
    .stat-card.warning {
      background-color: rgba(255, 193, 7, 0.1);
      color: #ffc107;
    }
    
    .stat-card.fault {
      background-color: rgba(244, 67, 54, 0.1);
      color: #f44336;
    }
    
    .stat-card.maintenance {
      background-color: rgba(156, 39, 176, 0.1);
      color: #9c27b0;
    }
    
    .stat-card.inactive {
      background-color: rgba(158, 158, 158, 0.1);
      color: #9e9e9e;
    }
    
    .stat-card.empty {
      opacity: 0.5;
    }
    
    .stat-content {
      text-align: center;
    }
    
    .stat-count {
      font-size: 16px;
      font-weight: 700;
    }
    
    .stat-label {
      font-size: 10px;
    }
    
    /* Estilos para filtros */
    .connection-filters {
      margin-bottom: 16px;
      display: flex;
      justify-content: center;
    }
    
    /* Estilos para lista de conexiones */
    .connection-list {
      max-height: 300px;
      overflow-y: auto;
      border: 1px solid #eee;
      border-radius: 4px;
    }
    
    :host-context(.dark-mode) .connection-list {
      border-color: #444;
    }
    
    .connection-item {
      display: flex;
      align-items: center;
      padding: 8px;
      border-bottom: 1px solid #f0f0f0;
      cursor: pointer;
    }
    
    :host-context(.dark-mode) .connection-item {
      border-bottom-color: #333;
    }
    
    .connection-item:last-child {
      border-bottom: none;
    }
    
    .connection-item:hover {
      background-color: #f5f5f5;
    }
    
    :host-context(.dark-mode) .connection-item:hover {
      background-color: #333;
    }
    
    .connection-item.active {
      border-left: 3px solid #4caf50;
    }
    
    .connection-item.warning {
      border-left: 3px solid #ffc107;
    }
    
    .connection-item.fault {
      border-left: 3px solid #f44336;
    }
    
    .connection-item.maintenance {
      border-left: 3px solid #9c27b0;
    }
    
    .connection-item.inactive {
      border-left: 3px solid #9e9e9e;
    }
    
    .connection-status-icon {
      margin-right: 8px;
    }
    
    .connection-details {
      flex: 1;
    }
    
    .connection-title {
      display: flex;
      justify-content: space-between;
    }
    
    .connection-id {
      font-weight: 500;
      font-size: 13px;
    }
    
    .connection-endpoint {
      font-size: 12px;
      color: #757575;
    }
    
    :host-context(.dark-mode) .connection-endpoint {
      color: #aaa;
    }
    
    .connection-type {
      font-size: 12px;
      color: #757575;
      white-space: nowrap;
    }
    
    :host-context(.dark-mode) .connection-type {
      color: #aaa;
    }
    
    /* Estilos para estados */
    .status-active {
      color: #4caf50;
    }
    
    .status-warning {
      color: #ffc107;
    }
    
    .status-fault {
      color: #f44336;
    }
    
    .status-maintenance {
      color: #9c27b0;
    }
    
    .status-inactive {
      color: #9e9e9e;
    }
    
    /* Estilos para mensajes informativos */
    .no-element-message,
    .no-connections-message,
    .filtered-empty-message {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 24px 16px;
      color: #757575;
    }
    
    :host-context(.dark-mode) .no-element-message,
    :host-context(.dark-mode) .no-connections-message,
    :host-context(.dark-mode) .filtered-empty-message {
      color: #aaa;
    }
    
    .no-element-message mat-icon,
    .no-connections-message mat-icon,
    .filtered-empty-message mat-icon {
      font-size: 48px;
      height: 48px;
      width: 48px;
      margin-bottom: 16px;
      opacity: 0.5;
    }
    
    /* Estilos para carga */
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    
    .loading-text {
      margin-top: 16px;
      color: #757575;
      font-size: 14px;
    }
    
    :host-context(.dark-mode) .loading-text {
      color: #aaa;
    }
    
    /* Animación para icono de carga */
    .spin {
      animation: spin 1.5s linear infinite;
    }
    
    @keyframes spin {
      100% {
        transform: rotate(360deg);
      }
    }
  `],
  animations: [fadeAnimation, slideInUpAnimation]
})
export class ConnectionStatusWidgetComponent extends BaseWidgetComponent implements OnInit, OnDestroy {
  // Estado y datos del widget
  connections: EnhancedNetworkConnection[] = [];
  filteredConnections: EnhancedNetworkConnection[] = [];
  @Input() selectedElement: NetworkElement | null = null;
  isLoading = false;
  statusFilter = 'ALL';
  
  // Contadores de conexiones por estado
  activeConnections = 0;
  inactiveConnections = 0;
  warningConnections = 0;
  faultConnections = 0;
  maintenanceConnections = 0;
  
  // Servicios inyectados
  private connectionService = inject(ConnectionService);
  private elementService = inject(ElementService);
  private mapStateService = inject(MapStateService);
  private logger = inject(LoggerService);
  
  // Observable para suscripción a elementos seleccionados
  private destroy$ = new Subject<void>();

  @Input() connectionStats: { total: number, active: number, warning: number, error: number, maintenance: number, inactive: number, fault: number } = { total: 0, active: 0, warning: 0, error: 0, maintenance: 0, inactive: 0, fault: 0 };

  @Output() widgetAction = new EventEmitter<WidgetActionEvent>();
  @Output() widgetError = new EventEmitter<WidgetErrorEvent>();
  @Output() widgetUpdate = new EventEmitter<WidgetUpdateEvent>();
  
  constructor() {
    super();
    this.widgetId = 'connection-status-widget';
    this.title = 'Estado de Conexiones';
    this.position = 'top-right';
  }
  
  override ngOnInit(): void {
    super.ngOnInit();
    
    // Suscribirse a cambios en la selección de elementos
    this.mapStateService.selectedElementIds$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(selectedIds => {
        if (selectedIds.length > 0) {
          this.loadSelectedElement(selectedIds[0]);
        } else {
          this.selectedElement = null;
          this.connections = [];
          this.filteredConnections = [];
          this.resetCounters();
        }
      });
  }
  
  /**
   * Carga información del elemento seleccionado
   */
  private loadSelectedElement(elementId: string): void {
    this.isLoading = true;
    
    this.elementService.getElementById(elementId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap(element => {
          if (element) {
            this.selectedElement = element;
            return this.connectionService.getConnectionsByElementId(elementId);
          } else {
            this.selectedElement = null;
            return of([]);
          }
        }),
        catchError(error => {
          this.handleError('loadSelectedElement', error);
          return of([]);
        })
      )
      .subscribe({
        next: (connections) => {
          this.connections = connections as EnhancedNetworkConnection[];
          this.applyFilter();
          this.updateConnectionCounters();
          this.isLoading = false;
        },
        error: (error) => {
          this.handleError('loadSelectedElement', error);
          this.isLoading = false;
        }
      });
  }
  
  /**
   * Aplica el filtro actual a las conexiones
   */
  private applyFilter(): void {
    if (this.statusFilter === 'ALL') {
      this.filteredConnections = [...this.connections];
      return;
    }
    
    this.filteredConnections = this.connections.filter(
      conn => conn.status === this.statusFilter
    );
  }
  
  /**
   * Filtra conexiones por estado
   */
  filterByStatus(status: string): void {
    this.statusFilter = status;
    this.applyFilter();
  }
  
  /**
   * Resetea el filtro a mostrar todas las conexiones
   */
  resetFilter(): void {
    this.statusFilter = 'ALL';
    this.applyFilter();
  }
  
  /**
   * Actualiza los contadores de conexiones por estado
   */
  private updateConnectionCounters(): void {
    this.resetCounters();
    
    this.connections.forEach(conn => {
      switch (conn.status) {
        case ConnectionStatus.ACTIVE:
          this.activeConnections++;
          break;
        case ConnectionStatus.INACTIVE:
          this.inactiveConnections++;
          break;
        case ConnectionStatus.DEGRADED:
          this.warningConnections++;
          break;
        case ConnectionStatus.FAILED:
          this.faultConnections++;
          break;
        case ConnectionStatus.PLANNED:
          this.maintenanceConnections++;
          break;
      }
    });
  }
  
  /**
   * Resetea los contadores de conexiones
   */
  private resetCounters(): void {
    this.activeConnections = 0;
    this.inactiveConnections = 0;
    this.warningConnections = 0;
    this.faultConnections = 0;
    this.maintenanceConnections = 0;
  }
  
  /**
   * Obtiene el icono para un tipo de elemento
   */
  getElementTypeIcon(type: string): string {
    switch (type) {
      case ElementType.OLT:
        return 'router';
      case ElementType.ONT:
        return 'devices';
      case ElementType.FDP:
        return 'hub';
      case ElementType.SPLITTER:
        return 'call_split';
      case ElementType.EDFA:
        return 'power';
      case ElementType.MANGA:
        return 'cable';
      default:
        return 'device_hub';
    }
  }
  
  /**
   * Obtiene el icono para un estado de conexión
   */
  getConnectionStatusIcon(status: string): string {
    switch (status) {
      case ConnectionStatus.ACTIVE:
        return 'check_circle';
      case ConnectionStatus.INACTIVE:
        return 'cancel';
      case ConnectionStatus.DEGRADED:
        return 'warning';
      case ConnectionStatus.FAILED:
        return 'error';
      case ConnectionStatus.PLANNED:
        return 'build';
      default:
        return 'help';
    }
  }
  
  /**
   * Obtiene la clase CSS para un estado de conexión
   */
  getConnectionStatusClass(status: string): string {
    switch (status) {
      case ConnectionStatus.ACTIVE:
        return 'active';
      case ConnectionStatus.INACTIVE:
        return 'inactive';
      case ConnectionStatus.DEGRADED:
        return 'warning';
      case ConnectionStatus.FAILED:
        return 'fault';
      case ConnectionStatus.PLANNED:
        return 'maintenance';
      default:
        return '';
    }
  }
  
  /**
   * Obtiene una etiqueta descriptiva para la conexión
   */
  getConnectionLabel(connection: EnhancedNetworkConnection): string {
    return connection.label || connection.name || connection.id || 'Conexión';
  }
  
  /**
   * Obtiene una descripción para la conexión
   */
  getConnectionDescription(connection: NetworkConnection): string {
    if (!this.selectedElement) return '';
    
    const isSource = connection.sourceElementId === this.selectedElement.id;
    const otherEndId = isSource ? connection.targetElementId : connection.sourceElementId;
    
    return isSource 
      ? `Hacia: ${otherEndId}` 
      : `Desde: ${otherEndId}`;
  }
  
  /**
   * Selecciona una conexión
   */
  selectConnection(connection: NetworkConnection): void {
    this.connectionService.selectConnection(connection);
  }
  
  /**
   * Muestra detalles de una conexión
   */
  viewConnectionDetails(connection: NetworkConnection): void {
    // Mostrar detalles de la conexión (podría abrir un diálogo)
    this.logger.debug(`Ver detalles de conexión: ${connection.id}`);
    this.connectionService.selectConnection(connection);
  }
  
  /**
   * Crea una nueva conexión
   */
  createNewConnection(): void {
    // Aquí se podría abrir un diálogo para crear conexión
    this.logger.debug('Crear nueva conexión');
  }
  
  /**
   * Refresca los datos del widget
   */
  override refreshData(): void {
    if (!this.selectedElement || !this.selectedElement.id) return;
    
    this.isLoading = true;
    
    this.connectionService.getConnectionsByElementId(this.selectedElement.id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(error => {
          this.handleError('refreshData', error);
          return of([]);
        })
      )
      .subscribe({
        next: (connections) => {
          this.connections = connections as EnhancedNetworkConnection[];
          this.applyFilter();
          this.updateConnectionCounters();
          this.isLoading = false;
        },
        error: (error) => {
          this.handleError('refreshData', error);
          this.isLoading = false;
        }
      });
  }
  
  override ngOnDestroy(): void {
    super.ngOnDestroy();
  }

  // Ejemplo de emisión de evento (ajusta según la lógica real):
  someActionMethod() {
    this.widgetAction.emit({
      source: 'connection-status-widget',
      type: 'action',
      timestamp: new Date(),
      action: 'some-action',
      // ...otros datos...
    });
  }
} 
