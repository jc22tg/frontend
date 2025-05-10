import { Component, OnInit, Input, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';
import { takeUntil, catchError, tap } from 'rxjs/operators';

import { NetworkElement } from '../../../../shared/models/network.model';
import { NetworkDesignService } from '../../services/network-design.service';
import { NetworkStateService } from '../../services/network-state.service';
import { LoggerService } from '../../../../core/services/logger.service';
import { ErrorHandlingService } from '../../services/error-handling.service';
import { BaseViewComponent } from '../base-view.component';
import { 
  MockHistoryService, 
  ElementChange, 
  FieldChange, 
  MaintenanceEvent, 
  ChangeType, 
  MaintenanceType 
} from '../../services/mock-history.service';

@Component({
  selector: 'app-element-history',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatListModule,
    MatDividerModule,
    MatExpansionModule,
    MatChipsModule,
    MatDialogModule,
    MatTabsModule,
    MatTooltipModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './element-history.component.html',
  styleUrls: ['./element-history.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ElementHistoryComponent extends BaseViewComponent {
  @Input() elementId?: string;
  
  element: NetworkElement | null = null;
  changes: ElementChange[] = [];
  maintenanceEvents: MaintenanceEvent[] = [];
  refreshing = false;
  activeTabIndex = 0;
  
  readonly ChangeType = ChangeType;
  readonly MaintenanceType = MaintenanceType;
  
  constructor(
    private networkDesignService: NetworkDesignService,
    private networkStateService: NetworkStateService,
    private logger: LoggerService,
    private route: ActivatedRoute,
    private router: Router,
    private dialog: MatDialog,
    private mockHistoryService: MockHistoryService,
    private errorHandlingService: ErrorHandlingService,
    protected override cdr: ChangeDetectorRef
  ) {
    super(cdr);
  }
  
  // Implementar métodos abstractos de BaseViewComponent
  protected override initializeState(): void {
    // Intentar obtener el ID del elemento desde la ruta
    this.route.paramMap.pipe(
      takeUntil(this.destroy$)
    ).subscribe(params => {
      const idFromRoute = params.get('id');
      
      if (idFromRoute) {
        this.elementId = idFromRoute;
        this.loadData();
      } else if (!this.elementId) {
        // Si no hay ID en la ruta ni como entrada, mostrar error
        this.error$.next('No se especificó un ID de elemento');
        this.setLoading(false);
      } else {
        // Usar el ID proporcionado como entrada
        this.loadData();
      }
      
      // Notificar al estado compartido que estamos en modo detalles
      this.networkStateService.setCurrentViewMode('details');
    });
  }
  
  protected override subscribeToChanges(): void {
    // No hay suscripciones adicionales necesarias en este componente
  }
  
  protected override cleanupResources(): void {
    // Limpieza específica para este componente (si es necesaria)
    
    // Siempre llamar a la implementación base
    super.cleanupResources();
  }

  loadData(): void {
    if (!this.elementId) {
      this.error$.next('No se especificó un ID de elemento');
      this.setLoading(false);
      return;
    }
    
    this.setLoading(true);
    this.error$.next(null);
    this.logger.info(`Cargando historial para el elemento: ${this.elementId}`);
    
    // Carga el elemento y su historial simultáneamente
    forkJoin({
      element: this.loadElement(),
      changes: this.mockHistoryService.getElementChanges(this.elementId),
      maintenance: this.mockHistoryService.getMaintenanceEvents(this.elementId)
    })
    .pipe(
      takeUntil(this.destroy$),
      finalize(() => {
        this.setLoading(false);
        this.refreshing = false;
        this.cdr.markForCheck();
        this.logger.info('Finalizada carga de datos de historial');
      })
    )
    .subscribe({
      next: (data) => {
        this.changes = data.changes;
        this.maintenanceEvents = data.maintenance;
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.handleError('Error al cargar los datos', error);
        this.logger.error('Error al cargar historial:', error);
      }
    });
  }
  
  loadElement() {
    return this.networkDesignService.getElementsById(this.elementId!)
      .pipe(
        tap(element => {
          this.element = element;
          
          // Notificar al estado sobre el elemento seleccionado
          this.networkStateService.setSelectedElement(element);
        }),
        catchError(error => {
          this.handleError('Error al cargar el elemento', error);
          throw error;
        }),
        takeUntil(this.destroy$)
      );
  }
  
  refreshData(): void {
    this.refreshing = true;
    this.loadData();
  }
  
  handleError(context: string, error: any): void {
    this.errorHandlingService.handleError(context, error);
    this.error$.next(this.errorHandlingService.getLastErrorMessage());
    this.cdr.markForCheck();
  }
  
  getChangeTypeIcon(changeType: ChangeType): string {
    switch (changeType) {
      case ChangeType.CREATED: return 'add_circle';
      case ChangeType.UPDATED: return 'edit';
      case ChangeType.DELETED: return 'delete';
      case ChangeType.MAINTENANCE: return 'build';
      case ChangeType.STATUS_CHANGE: return 'sync';
      default: return 'info';
    }
  }
  
  getChangeTypeColor(changeType: ChangeType): string {
    switch (changeType) {
      case ChangeType.CREATED: return 'primary';
      case ChangeType.UPDATED: return 'accent';
      case ChangeType.DELETED: return 'warn';
      case ChangeType.MAINTENANCE: return 'primary';
      case ChangeType.STATUS_CHANGE: return 'accent';
      default: return '';
    }
  }
  
  getChangeTypeLabel(changeType: ChangeType): string {
    switch (changeType) {
      case ChangeType.CREATED: return 'Creado';
      case ChangeType.UPDATED: return 'Actualizado';
      case ChangeType.DELETED: return 'Eliminado';
      case ChangeType.MAINTENANCE: return 'Mantenimiento';
      case ChangeType.STATUS_CHANGE: return 'Cambio de estado';
      default: return 'Desconocido';
    }
  }
  
  getMaintenanceTypeIcon(type: MaintenanceType): string {
    switch (type) {
      case MaintenanceType.PREVENTIVE: return 'check_circle';
      case MaintenanceType.CORRECTIVE: return 'healing';
      case MaintenanceType.INSTALLATION: return 'fiber_new';
      case MaintenanceType.UPGRADE: return 'upgrade';
      default: return 'build';
    }
  }
  
  getMaintenanceTypeLabel(type: MaintenanceType): string {
    switch (type) {
      case MaintenanceType.PREVENTIVE: return 'Preventivo';
      case MaintenanceType.CORRECTIVE: return 'Correctivo';
      case MaintenanceType.INSTALLATION: return 'Instalación';
      case MaintenanceType.UPGRADE: return 'Actualización';
      default: return 'Desconocido';
    }
  }
  
  getMaintenanceStatusColor(event: MaintenanceEvent): string {
    return event.completed ? 'primary' : 'accent';
  }
  
  formatValue(value: any): string {
    if (value === null || value === undefined) {
      return 'No definido';
    }
    
    if (typeof value === 'boolean') {
      return value ? 'Sí' : 'No';
    }
    
    if (Array.isArray(value)) {
      if (value.length === 0) {
        return 'Lista vacía';
      }
      
      if (typeof value[0] === 'object') {
        return `[${value.length} elementos]`;
      }
      
      return value.join(', ');
    }
    
    if (typeof value === 'object') {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toLocaleString();
      }
      
      return JSON.stringify(value);
    }
    
    return String(value);
  }
  
  showFieldChangeType(change: FieldChange): string {
    if (change.oldValue === null || change.oldValue === undefined) {
      return 'added';
    }
    
    if (change.newValue === null || change.newValue === undefined) {
      return 'removed';
    }
    
    return 'changed';
  }
  
  onTabChange(event: any): void {
    this.activeTabIndex = event.index;
    this.cdr.markForCheck();
  }
  
  getTimeDifference(date: Date): string {
    const now = new Date();
    const diffInMs = now.getTime() - new Date(date).getTime();
    
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInMinutes < 1) {
      return 'hace unos segundos';
    }
    
    if (diffInMinutes < 60) {
      return `hace ${diffInMinutes} ${diffInMinutes === 1 ? 'minuto' : 'minutos'}`;
    }
    
    if (diffInHours < 24) {
      return `hace ${diffInHours} ${diffInHours === 1 ? 'hora' : 'horas'}`;
    }
    
    return `hace ${diffInDays} ${diffInDays === 1 ? 'día' : 'días'}`;
  }
  
  // Método para ir a la vista de detalles del elemento
  navigateToElementDetails(): void {
    if (this.element && this.element.id && this.element.type) {
      this.router.navigate(['/network-design/elements', this.element.type, this.element.id]);
    }
  }
  
  // Método para ir a la vista del mapa centrado en el elemento
  navigateToMapView(): void {
    if (this.element && this.element.id) {
      // Guardar el elemento seleccionado en el estado global para que el mapa lo resalte
      this.networkStateService.setSelectedElement(this.element);
      this.router.navigate(['/network-design/map'], { 
        queryParams: { 
          highlight: this.element.id
        }
      });
    }
  }
  
  // Método para imprimir el historial
  printHistory(): void {
    window.print();
  }
} 