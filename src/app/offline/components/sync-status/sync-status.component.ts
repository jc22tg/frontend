import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { CommonModule } from '@angular/common';
import { SyncService } from '../../services/sync.service';
import { OfflineStorageService } from '../../services/offline-storage.service';
import { ConnectionService } from '../../services/connection.service';
import { SyncStatus } from '../../models/sync-status.enum';
import { Subscription, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-sync-status',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatTooltipModule,
    MatButtonModule,
    MatBadgeModule
  ],
  template: `
    <div class="sync-status-container">
      <button 
        mat-icon-button
        [matTooltip]="tooltipMessage"
        [color]="getStatusColor()"
        [matBadge]="operationsCount > 0 ? operationsCount : null"
        matBadgeColor="warn"
        matBadgeSize="small"
        (click)="triggerSync()">
        <mat-icon>{{ getStatusIcon() }}</mat-icon>
      </button>
    </div>
  `,
  styles: [`
    .sync-status-container {
      display: inline-block;
    }
    
    button[matBadge] {
      margin-right: 8px;
    }
  `]
})
export class SyncStatusComponent implements OnInit, OnDestroy {
  statusMessage = '';
  tooltipMessage = '';
  operationsCount = 0;
  isOnline: boolean = navigator.onLine;
  currentStatus: SyncStatus = SyncStatus.SYNCED;
  
  private subscriptions = new Subscription();
  
  constructor(
    private syncService: SyncService,
    private offlineStorage: OfflineStorageService,
    private connectionService: ConnectionService
  ) {}
  
  ngOnInit(): void {
    // Combinar observables de estado de conexión, sincronización y operaciones pendientes
    const statusSubscription = combineLatest([
      this.connectionService.online$,
      this.syncService.syncStatus$,
      this.offlineStorage.operationsCount$
    ]).pipe(
      map(([isOnline, syncStatus, operationsCount]) => {
        this.isOnline = isOnline;
        this.currentStatus = syncStatus;
        this.operationsCount = operationsCount;
        
        // Actualizar mensajes basados en el estado
        this.updateStatusMessages();
        
        return { isOnline, syncStatus, operationsCount };
      })
    ).subscribe();
    
    this.subscriptions.add(statusSubscription);
  }
  
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
  
  /**
   * Actualiza los mensajes de estado y tooltip basados en la condición actual
   */
  private updateStatusMessages(): void {
    if (!this.isOnline) {
      this.statusMessage = 'Sin conexión';
      this.tooltipMessage = 'No hay conexión a internet. Los cambios se sincronizarán cuando estés online.';
      return;
    }
    
    // Determinar mensaje basado en estado de sincronización
    switch (this.currentStatus) {
      case SyncStatus.SYNCED:
        this.statusMessage = 'Sincronizado';
        this.tooltipMessage = 'Todos los cambios están sincronizados con el servidor.';
        break;
      case SyncStatus.SYNCING:
        this.statusMessage = 'Sincronizando...';
        this.tooltipMessage = 'Sincronizando cambios con el servidor...';
        break;
      case SyncStatus.PENDING:
        const count = this.operationsCount;
        this.statusMessage = `Pendiente (${count})`;
        this.tooltipMessage = `${count} ${count === 1 ? 'cambio pendiente' : 'cambios pendientes'} de sincronización. Haz clic para sincronizar ahora.`;
        break;
      case SyncStatus.ERROR:
        this.statusMessage = 'Error de sincronización';
        this.tooltipMessage = 'Error al sincronizar cambios. Haz clic para reintentar.';
        break;
      case SyncStatus.OFFLINE:
        this.statusMessage = 'Modo offline';
        this.tooltipMessage = 'Trabajando en modo offline. Los cambios se sincronizarán cuando vuelvas online.';
        break;
      default:
        this.statusMessage = 'Desconocido';
        this.tooltipMessage = 'Estado de sincronización desconocido.';
    }
  }
  
  /**
   * Determina el icono a mostrar según el estado actual
   */
  getStatusIcon(): string {
    if (!this.isOnline) {
      return 'cloud_off';
    }
    
    switch (this.currentStatus) {
      case SyncStatus.SYNCED:
        return 'cloud_done';
      case SyncStatus.SYNCING:
        return 'sync';
      case SyncStatus.PENDING:
        return 'cloud_queue';
      case SyncStatus.ERROR:
        return 'cloud_off';
      case SyncStatus.OFFLINE:
        return 'cloud_off';
      default:
        return 'help';
    }
  }
  
  /**
   * Determina el color del icono según el estado actual
   */
  getStatusColor(): string {
    if (!this.isOnline) {
      return 'warn';
    }
    
    switch (this.currentStatus) {
      case SyncStatus.SYNCED:
        return 'primary';
      case SyncStatus.SYNCING:
        return 'accent';
      case SyncStatus.PENDING:
        return 'accent';
      case SyncStatus.ERROR:
        return 'warn';
      case SyncStatus.OFFLINE:
        return 'warn';
      default:
        return '';
    }
  }
  
  /**
   * Trigger manual de sincronización
   */
  triggerSync(): void {
    if (this.isOnline && 
        (this.currentStatus === SyncStatus.PENDING || 
         this.currentStatus === SyncStatus.ERROR)) {
      this.syncService.forceSync();
    }
  }
} 
