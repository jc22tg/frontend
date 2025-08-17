import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { ConnectionService } from '../../services/connection.service';
import { ElementManagementService } from '../../services/element-management.service';
import { NetworkElement, ElementType, ElementStatus, FiberConnection } from '../../../../shared/types/network.types';

@Component({
  selector: 'app-connection-management',
  templateUrl: './connection-management.component.html',
  styleUrls: ['./connection-management.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule
  ]
})
export class ConnectionManagementComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  connections: FiberConnection[] = [];
  selectedConnection: FiberConnection | null = null;
  elements: NetworkElement[] = [];
  searchQuery = '';
  selectedStatus: ElementStatus | null = null;
  selectedSourceType: ElementType | null = null;
  selectedTargetType: ElementType | null = null;

  displayedColumns: string[] = ['id', 'source', 'target', 'status', 'length', 'actions'];

  constructor(
    private connectionService: ConnectionService,
    private elementManagementService: ElementManagementService
  ) {}

  ngOnInit(): void {
    this.subscribeToConnections();
    this.subscribeToElements();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private subscribeToConnections(): void {
    // Suscribirse a las conexiones
    this.connectionService.getConnections()
      .pipe(takeUntil(this.destroy$))
      .subscribe(connections => {
        this.connections = connections;
      });

    // Suscribirse a la conexión seleccionada
    this.connectionService.getSelectedConnection()
      .pipe(takeUntil(this.destroy$))
      .subscribe(connection => {
        this.selectedConnection = connection;
      });
  }

  private subscribeToElements(): void {
    this.elementManagementService.getElements()
      .pipe(takeUntil(this.destroy$))
      .subscribe(elements => {
        this.elements = elements;
      });
  }

  onSearch(): void {
    if (this.searchQuery) {
      this.connectionService.filterConnections({ search: this.searchQuery })
        .pipe(takeUntil(this.destroy$))
        .subscribe(connections => {
          this.connections = connections;
        });
    } else {
      this.connectionService.getConnections()
        .pipe(takeUntil(this.destroy$))
        .subscribe(connections => {
          this.connections = connections;
        });
    }
  }

  onFilter(): void {
    this.connectionService.filterConnections({
      status: this.selectedStatus || undefined,
      sourceType: this.selectedSourceType || undefined,
      targetType: this.selectedTargetType || undefined,
      search: this.searchQuery || undefined
    })
    .pipe(takeUntil(this.destroy$))
    .subscribe(connections => {
      this.connections = connections;
    });
  }

  onSelectConnection(connection: FiberConnection): void {
    this.connectionService.selectConnection(connection);
  }

  onDeleteConnection(connection: FiberConnection): void {
    if (connection.id && confirm(`¿Está seguro de eliminar la conexión ${connection.id}?`)) {
      this.connectionService.deleteConnection(connection.id);
    }
  }

  onExportConnections(): void {
    this.connectionService.exportConnections();
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.selectedStatus = null;
    this.selectedSourceType = null;
    this.selectedTargetType = null;
    this.onFilter();
  }

  getElementName(elementId: string): string {
    const element = this.elements.find(e => e.id === elementId);
    return element ? element.name : 'Desconocido';
  }

  getConnectionStatusClass(status: ElementStatus): string {
    return `status-${status.toLowerCase()}`;
  }

  getConnectionStatusIcon(status: ElementStatus): string {
    switch (status) {
      case ElementStatus.ACTIVE:
        return 'check_circle';
      case ElementStatus.INACTIVE:
        return 'cancel';
      case ElementStatus.MAINTENANCE:
        return 'build';
      default:
        return 'help';
    }
  }
} 
