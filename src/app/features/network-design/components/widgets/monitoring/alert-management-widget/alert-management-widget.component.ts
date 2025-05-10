import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
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
import { trigger, transition, style, animate, query, stagger, keyframes } from '@angular/animations';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';

import { MonitoringService } from '../../../../services/monitoring.service';
import { NetworkAlert, ElementType } from '../../../../../../shared/types/network.types';

/**
 * Componente de gestión de alertas de red
 *
 * @description
 * Este componente muestra y permite gestionar alertas de red, proporcionando
 * funcionalidades para filtrar alertas por severidad, marcarlas como resueltas,
 * eliminarlas y exportarlas. Incluye visualización de estadísticas y facilita
 * la interacción con el sistema de monitoreo.
 */
@Component({
  selector: 'app-alert-management-widget',
  templateUrl: './alert-management-widget.component.html',
  styleUrls: ['./alert-management-widget.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('cardAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('300ms var(--animation-timing-normal)', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('200ms var(--animation-timing-normal)', style({ opacity: 0, transform: 'translateY(10px)' }))
      ])
    ]),
    trigger('listAnimation', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(10px)' }),
          stagger('60ms', [
            animate('300ms var(--animation-timing-normal)', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ]),
    trigger('fadeAnimation', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms var(--animation-timing-normal)', style({ opacity: 1 }))
      ])
    ]),
    trigger('pulseAnimation', [
      transition('* => *', [
        animate('2s ease-in-out', keyframes([
          style({ opacity: 1, offset: 0 }),
          style({ opacity: 0.6, offset: 0.5 }),
          style({ opacity: 1, offset: 1 })
        ]))
      ])
    ])
  ],
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
    MatPaginatorModule
  ]
})
export class AlertManagementWidgetComponent implements OnInit, OnDestroy {
  /** Lista de alertas de red */
  alerts: NetworkAlert[] = [];
  
  /** Filtro de severidad actual */
  severityFilter: 'all' | 'critical' | 'warning' | 'info' = 'all';
  
  /** Indica si se muestran alertas resueltas */
  showResolved = false;
  
  /** Tamaño de página para la paginación */
  pageSize = 10;
  
  /** Página actual para la paginación */
  currentPage = 0;
  
  /** Subject para gestionar la limpieza de suscripciones */
  private destroyed$ = new Subject<void>();

  /**
   * Constructor del componente
   * 
   * @param monitoringService Servicio para acceder a datos de monitoreo
   * @param snackBar Servicio para mostrar notificaciones
   * @param cdr Referencia del detector de cambios
   */
  constructor(
    private monitoringService: MonitoringService, 
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  /**
   * Inicializa el componente y suscribe a las alertas
   */
  ngOnInit(): void {
    // Suscripción al servicio de monitoreo para obtener alertas
    this.monitoringService.getAlerts()
      .pipe(takeUntil(this.destroyed$))
      .subscribe(alerts => {
        this.alerts = alerts;
        this.cdr.markForCheck();
      });
  }

  /**
   * Limpia las suscripciones al destruir el componente
   */
  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  /**
   * Obtiene el número de alertas críticas activas
   */
  get criticalCount(): number {
    return this.alerts.filter(alert => alert.severity === 'critical' && !alert.resolved).length;
  }

  /**
   * Obtiene el número de alertas de advertencia activas
   */
  get warningCount(): number {
    return this.alerts.filter(alert => alert.severity === 'warning' && !alert.resolved).length;
  }

  /**
   * Obtiene el número de alertas informativas activas
   */
  get infoCount(): number {
    return this.alerts.filter(alert => alert.severity === 'info' && !alert.resolved).length;
  }

  /**
   * Obtiene las alertas filtradas según los criterios actuales
   * y aplica paginación
   */
  get filteredAlerts(): NetworkAlert[] {
    // Filtrar por severidad y estado resuelto
    let filtered = this.alerts;
    
    if (this.severityFilter !== 'all') {
      filtered = filtered.filter(alert => alert.severity === this.severityFilter);
    }
    
    if (!this.showResolved) {
      filtered = filtered.filter(alert => !alert.resolved);
    }
    
    // Aplicar paginación
    const startIndex = this.currentPage * this.pageSize;
    return filtered.slice(startIndex, startIndex + this.pageSize);
  }
  
  /**
   * Actualiza las alertas desde el servicio de monitoreo
   */
  refreshAlerts(): void {
    // Implementamos utilizando métodos existentes del servicio
    // Cargamos todas las alertas disponibles de nuevo
    this.monitoringService.getAlerts()
      .pipe(takeUntil(this.destroyed$))
      .subscribe(alerts => {
        this.alerts = alerts;
        this.cdr.markForCheck();
        
        this.snackBar.open('Alertas actualizadas', 'Cerrar', {
          duration: 2000,
          panelClass: 'success-snackbar'
        });
      });
  }

  /**
   * Cambia el estado de resolución de una alerta
   * 
   * @param alert Alerta a modificar
   */
  toggleResolved(alert: NetworkAlert): void {
    if (alert.resolved) {
      this.monitoringService.reopenAlert(alert.id);
      this.snackBar.open('Alerta marcada como activa', 'Cerrar', {
        duration: 3000,
        panelClass: 'info-snackbar'
      });
    } else {
      this.monitoringService.resolveAlert(alert.id);
      this.snackBar.open('Alerta marcada como resuelta', 'Cerrar', {
        duration: 3000,
        panelClass: 'success-snackbar'
      });
    }
    this.cdr.markForCheck();
  }

  /**
   * Elimina una alerta
   * 
   * @param alertToDelete Alerta a eliminar
   */
  deleteAlert(alertToDelete: NetworkAlert): void {
    this.monitoringService.removeAlert(alertToDelete.id);
    this.snackBar.open('Alerta eliminada', 'Cerrar', {
      duration: 3000,
      panelClass: 'info-snackbar'
    });
    this.cdr.markForCheck();
  }

  /**
   * Elimina todas las alertas resueltas
   */
  clearResolvedAlerts(): void {
    const resolvedAlerts = this.alerts.filter(alert => alert.resolved);
    if (resolvedAlerts.length === 0) {
      this.snackBar.open('No hay alertas resueltas para eliminar', 'Cerrar', {
        duration: 3000,
        panelClass: 'warning-snackbar'
      });
      return;
    }
    
    resolvedAlerts.forEach(alert => {
      this.monitoringService.removeAlert(alert.id);
    });
    
    this.snackBar.open(`${resolvedAlerts.length} alertas resueltas eliminadas`, 'Cerrar', {
      duration: 3000,
      panelClass: 'success-snackbar'
    });
    this.cdr.markForCheck();
  }

  /**
   * Exporta las alertas filtradas a un archivo JSON
   */
  exportAlerts(): void {
    const filteredAlerts = this.severityFilter === 'all' 
      ? this.alerts 
      : this.alerts.filter(alert => alert.severity === this.severityFilter);
      
    const alertsToExport = this.showResolved 
      ? filteredAlerts 
      : filteredAlerts.filter(alert => !alert.resolved);
      
    if (alertsToExport.length === 0) {
      this.snackBar.open('No hay alertas para exportar', 'Cerrar', {
        duration: 3000,
        panelClass: 'warning-snackbar'
      });
      return;
    }
    
    const alertsJson = JSON.stringify(alertsToExport, null, 2);
    const blob = new Blob([alertsJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `alertas-red-${this.severityFilter !== 'all' ? this.severityFilter + '-' : ''}${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    this.snackBar.open('Alertas exportadas', 'Cerrar', {
      duration: 3000,
      panelClass: 'success-snackbar'
    });
  }
  
  /**
   * Maneja el cambio de página
   * 
   * @param event Evento de cambio de página
   */
  onPageChange(event: PageEvent): void {
    this.pageSize = event.pageSize;
    this.currentPage = event.pageIndex;
    this.cdr.markForCheck();
  }
  
  /**
   * Restablece los filtros aplicados
   */
  resetFilters(): void {
    this.severityFilter = 'all';
    this.showResolved = false;
    this.currentPage = 0;
    this.cdr.markForCheck();
  }
  
  /**
   * Verifica si hay filtros aplicados
   */
  hasFiltersApplied(): boolean {
    return this.severityFilter !== 'all' || this.showResolved;
  }
  
  /**
   * Obtiene la descripción de los filtros aplicados
   */
  getFilterDescription(): string {
    let description = 'para mostrar';
    
    if (this.severityFilter !== 'all') {
      if (this.severityFilter === 'critical') description = 'críticas';
      if (this.severityFilter === 'warning') description = 'de advertencia';
      if (this.severityFilter === 'info') description = 'informativas';
    }
    
    if (!this.showResolved) {
      description += ' activas';
    }
    
    return description;
  }

  /**
   * Obtiene el ícono correspondiente a un tipo de elemento
   * 
   * @param elementType Tipo de elemento
   * @returns Nombre del ícono de Material
   */
  getElementTypeIcon(elementType: ElementType): string {
    switch (elementType) {
      case ElementType.OLT:
        return 'router';
      case ElementType.ONT:
        return 'device_hub';
      case ElementType.FDP:
      case ElementType.ODF:
        return 'cable';
      case ElementType.SPLITTER:
        return 'call_split';
      case ElementType.EDFA:
        return 'settings_input_hdmi';
      case ElementType.MANGA:
        return 'settings_input_component';
      case ElementType.TERMINAL_BOX:
        return 'inbox';
      case ElementType.FIBER_THREAD:
      case ElementType.FIBER_STRAND:
        return 'timeline';
      case ElementType.DROP_CABLE:
      case ElementType.DISTRIBUTION_CABLE:
      case ElementType.FEEDER_CABLE:
      case ElementType.BACKBONE_CABLE:
      case ElementType.FIBER_CABLE:
        return 'power_input';
      case ElementType.FIBER_CONNECTION:
      case ElementType.FIBER_SPLICE:
        return 'swap_horiz';
      default:
        return 'device_unknown';
    }
  }
} 