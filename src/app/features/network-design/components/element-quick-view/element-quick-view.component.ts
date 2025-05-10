import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { trigger, transition, style, animate, state, query, stagger } from '@angular/animations';

import { ElementManagementService } from '../../services/element-management.service';
import { NetworkStateService } from '../../services/network-state.service';
import { ElementHistoryService } from '../../services/element-history.service';
import { NetworkElement, ElementType, ElementStatus, NetworkConnection, PONStandard } from '../../../../shared/types/network.types';
import { ConfirmDialogComponent } from '../../../../shared/confirm-dialog/confirm-dialog.component';

/**
 * Interfaz extendida para mostrar los detalles de varios tipos de elementos
 * en la vista rápida. Incluye propiedades que pueden venir de diferentes
 * tipos específicos como OLT, ONT, Splitter, etc.
 */
interface ElementDetailView extends NetworkElement {
  // Propiedades generales
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  installationDate?: Date;
  
  // Propiedades específicas de OLT
  portCount?: number;
  ponPorts?: number;
  distributionPorts?: number;
  uplinkPorts?: number;
  odfIds?: string[];
  
  // Propiedades específicas de ONT
  ponStandard?: PONStandard;
  signalStrength?: number;
  oltId?: string;
  
  // Propiedades específicas de Splitter
  splitRatio?: string;
  outputPorts?: number;
  
  // Propiedades específicas de ODF/FDP
  totalPortCapacity?: number;
  usedPorts?: number;
}

/**
 * Interfaz extendida para conexiones con información adicional de destino
 */
interface ExtendedNetworkConnection extends NetworkConnection {
  targetId: string;
  targetName?: string;
  targetType?: ElementType;
  targetStatus?: ElementStatus;
  connectionStatus?: string;
}

/**
 * Interfaz para respuestas de error de APIs
 */
interface ApiError {
  message: string;
  statusCode?: number;
  error?: string;
}

@Component({
  selector: 'app-element-quick-view',
  templateUrl: './element-quick-view.component.html',
  styleUrls: ['./element-quick-view.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  animations: [
    trigger('slideInOut', [
      state('void', style({
        transform: 'translateX(30px)',
        opacity: 0
      })),
      transition('void => *', [
        animate('300ms cubic-bezier(0.25, 0.8, 0.25, 1)', style({
          transform: 'translateX(0)',
          opacity: 1
        }))
      ]),
      transition('* => void', [
        animate('250ms cubic-bezier(0.25, 0.8, 0.25, 1)', style({
          transform: 'translateX(30px)',
          opacity: 0
        }))
      ])
    ]),
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('400ms ease-out', style({ opacity: 1 }))
      ])
    ]),
    trigger('staggerItems', [
      transition(':enter', [
        query('.info-row, .specific-info, .related-elements', [
          style({ opacity: 0, transform: 'translateY(10px)' }),
          stagger(80, [
            animate('300ms cubic-bezier(0.25, 0.8, 0.25, 1)', 
              style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ])
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ElementQuickViewComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  element: ElementDetailView | null = null;
  loading = false;
  loadingRelated = false;

  // Inyección de dependencias modernas
  private elementManagementService = inject(ElementManagementService);
  private networkStateService = inject(NetworkStateService);
  private dialog = inject(MatDialog);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private cdr = inject(ChangeDetectorRef);
  
  // Inyección tradicional para el servicio de historial
  constructor(private elementHistoryService: ElementHistoryService) {}

  get hasRelatedElements(): boolean {
    if (!this.element) return false;
    
    // Verificamos conexiones genéricas primero
    if (this.element.connections?.length) return true;
    
    // Verificamos propiedades específicas por tipo
    return !!(
      // Propiedades conocidas de OLT
      (this.element.type === ElementType.OLT && this.element.odfIds?.length) ||
      // Propiedades conocidas de ONT
      (this.element.type === ElementType.ONT && this.element.oltId)
    );
  }

  ngOnInit(): void {
    this.subscribeToSelectedElement();
    this.subscribeToNetworkState();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private subscribeToSelectedElement(): void {
    this.elementManagementService.getSelectedElement()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (element) => {
          this.startLoadingElement(element);
        },
        error: (error) => {
          this.handleElementLoadError(error);
        }
      });
  }

  /**
   * Inicia el proceso de carga del elemento con una breve animación
   */
  private startLoadingElement(element: NetworkElement | null): void {
          // Simulamos una carga breve para mostrar el skeleton
          this.loading = true;
          this.cdr.markForCheck();

          setTimeout(() => {
            this.element = element as ElementDetailView;
            this.loading = false;
            this.cdr.markForCheck();
          }, 300);
  }

  /**
   * Maneja errores al cargar el elemento
   */
  private handleElementLoadError(error: unknown): void {
          console.error('Error obteniendo elemento seleccionado:', error);
          this.loading = false;
          this.snackBar.open('Error al cargar datos del elemento', 'Cerrar', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
          this.cdr.markForCheck();
  }

  private subscribeToNetworkState(): void {
    // Observar cambios en el elemento seleccionado desde el estado global
    this.networkStateService.getSelectedElementAsObservable()
      .pipe(takeUntil(this.destroy$))
      .subscribe(element => {
        if (element) {
          // Si hay un elemento seleccionado en el estado global, 
          // actualizarlo también en el servicio de gestión de elementos
          this.elementManagementService.selectElement(element);
          this.cdr.markForCheck();
        }
      });
  }

  /**
   * Obtiene el nombre descriptivo del tipo de elemento
   */
  getElementTypeName(type: ElementType): string {
    // Obtener nombre más descriptivo del tipo
    const typeNames: Record<ElementType, string> = {
      [ElementType.OLT]: 'Terminal de Línea Óptica',
      [ElementType.ONT]: 'Terminal de Red Óptica',
      [ElementType.FDP]: 'Punto de Distribución de Fibra',
      [ElementType.ODF]: 'Marco de Distribución Óptica',
      [ElementType.EDFA]: 'Amplificador de Fibra',
      [ElementType.SPLITTER]: 'Divisor Óptico',
      [ElementType.MANGA]: 'Manga',
      [ElementType.TERMINAL_BOX]: 'Caja Terminal',
      [ElementType.FIBER_THREAD]: 'Hilo de Fibra',
      [ElementType.FIBER_CONNECTION]: 'Conexión de Fibra',
      [ElementType.FIBER_SPLICE]: 'Empalme de Fibra',
      [ElementType.FIBER_CABLE]: 'Cable de Fibra',
      [ElementType.FIBER_STRAND]: 'Hilo de Fibra',
      [ElementType.DROP_CABLE]: 'Cable de Acometida',
      [ElementType.DISTRIBUTION_CABLE]: 'Cable de Distribución',
      [ElementType.FEEDER_CABLE]: 'Cable Alimentador',
      [ElementType.BACKBONE_CABLE]: 'Cable Troncal',
      [ElementType.ROUTER]: 'Router',
      [ElementType.RACK]: 'Rack',
      [ElementType.MSAN]: 'Nodo de Acceso Multi-Servicio',
      [ElementType.NETWORK_GRAPH]: 'Grafo de Red',
      [ElementType.WDM_FILTER]: 'Filtro WDM',
      [ElementType.COHERENT_TRANSPONDER]: 'Transpondedor Coherente',
      [ElementType.WAVELENGTH_ROUTER]: 'Enrutador de Longitudes de Onda',
      [ElementType.OPTICAL_SWITCH]: 'Conmutador Óptico',
      [ElementType.ROADM]: 'Multiplexor Óptico Reconfigurable',
      [ElementType.OPTICAL_AMPLIFIER]: 'Amplificador Óptico'
    };
    
    return typeNames[type] || type.toString();
  }

  /**
   * Obtiene la clase CSS para el estado del elemento
   */
  getElementStatusClass(status: ElementStatus): string {
    return `status-${status.toLowerCase()}`;
  }

  /**
   * Obtiene el nombre del icono según el estado del elemento
   */
  getStatusIconName(status: ElementStatus): string {
    // Definir como registro parcial ya que no necesitamos todas las claves
    const iconMap: Partial<Record<ElementStatus, string>> = {
      [ElementStatus.ACTIVE]: 'check_circle',
      [ElementStatus.INACTIVE]: 'cancel',
      [ElementStatus.FAULT]: 'error',
      [ElementStatus.MAINTENANCE]: 'build',
      [ElementStatus.PLANNED]: 'schedule',
      [ElementStatus.BUILDING]: 'construction',
      [ElementStatus.RESERVED]: 'bookmark',
      [ElementStatus.DECOMMISSIONED]: 'delete'
    };
    
    return iconMap[status] || 'help';
    }

  /**
   * Obtiene el icono para el tipo de elemento
   */
  getElementTypeIcon(type: ElementType): string {
    const iconMap: Record<ElementType, string> = {
      [ElementType.OLT]: 'router',
      [ElementType.ONT]: 'device_hub',
      [ElementType.FDP]: 'apps',
      [ElementType.ODF]: 'grid_view',
      [ElementType.EDFA]: 'amp_stories',
      [ElementType.SPLITTER]: 'call_split',
      [ElementType.MANGA]: 'category',
      [ElementType.TERMINAL_BOX]: 'inbox',
      [ElementType.FIBER_THREAD]: 'timeline',
      [ElementType.FIBER_CONNECTION]: 'compare_arrows',
      [ElementType.FIBER_SPLICE]: 'link',
      [ElementType.FIBER_CABLE]: 'cable',
      [ElementType.FIBER_STRAND]: 'linear_scale',
      [ElementType.DROP_CABLE]: 'trending_down',
      [ElementType.DISTRIBUTION_CABLE]: 'share',
      [ElementType.FEEDER_CABLE]: 'alt_route',
      [ElementType.BACKBONE_CABLE]: 'architecture',
      [ElementType.ROUTER]: 'router',
      [ElementType.RACK]: 'layers',
      [ElementType.MSAN]: 'hub',
      [ElementType.NETWORK_GRAPH]: 'transit_enterexit',
      [ElementType.WDM_FILTER]: 'filter_list',
      [ElementType.COHERENT_TRANSPONDER]: 'settings_input_component',
      [ElementType.WAVELENGTH_ROUTER]: 'swap_horiz',
      [ElementType.OPTICAL_SWITCH]: 'switch_access',
      [ElementType.ROADM]: 'shuffle',
      [ElementType.OPTICAL_AMPLIFIER]: 'amp_stories'
    };
    
    return iconMap[type] || 'settings_input_component';
  }

  /**
   * Calcula el número de puertos de salida a partir del ratio
   */
  getOutputPortCount(splitRatio: string | undefined): number {
    if (!splitRatio) return 0;
    
    // Ejemplo de formato: "1:8", "1:16", "1:32", etc.
    const match = splitRatio.match(/\d+:(\d+)/);
    if (match && match[1]) {
      return parseInt(match[1], 10);
    }
    
    return 0;
  }

  /**
   * Navega al detalle completo del elemento
   */
  navigateToElement(elementId: string): void {
    if (!elementId) return;
    
    // Navegar a la vista detallada del elemento
    this.router.navigate(['network', 'elements', elementId]);
          }

  /**
   * Inicia la edición del elemento
   */
  onEdit(): void {
    if (!this.element?.id) return;
    
    this.router.navigate(['network', 'elements', this.element.id, 'edit']);
    }

  /**
   * Muestra diálogo de confirmación y elimina el elemento si se confirma
   */
  onDelete(): void {
    if (!this.element?.id) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Eliminar elemento',
        message: `¿Está seguro que desea eliminar el elemento "${this.element.name}"?`,
        confirmText: 'Eliminar',
        cancelText: 'Cancelar'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed && this.element?.id) {
        // Intentar eliminar el elemento y manejar el resultado
        try {
          // Usar ID localmente para evitar posibles cambios
          const elementId = this.element.id;
          // Llamar al servicio para eliminar
          this.elementManagementService.deleteElement(elementId);
          // Manejar éxito directamente
        this.handleDeleteSuccess();
        } catch (error) {
          // Manejar error
          this.handleDeleteError(error as ApiError);
        } finally {
          this.cdr.markForCheck();
        }
      }
    });
  }

  /**
   * Maneja la eliminación exitosa de un elemento
   */
  private handleDeleteSuccess(): void {
    this.snackBar.open('Elemento eliminado con éxito', 'Cerrar', {
      duration: 3000
    });
    this.onClose();
  }

  /**
   * Maneja errores al eliminar un elemento
   */
  private handleDeleteError(error: ApiError): void {
    const errorMessage = error.message || 'Error al eliminar el elemento';
    this.snackBar.open(errorMessage, 'Cerrar', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  /**
   * Cierra la vista rápida
   */
  onClose(): void {
    // Desseleccionar el elemento
    this.element = null;
    // Intentar usar el servicio de gestión de elementos
    if (this.elementManagementService) {
      try {
        this.elementManagementService.selectElement(null);
      } catch (error) {
        console.error('Error al limpiar selección:', error);
      }
    }
    
    // Actualizar la vista
    this.cdr.markForCheck();
  }

  /**
   * Muestra el historial del elemento
   */
  onViewHistory(): void {
    if (!this.element?.id) return;
    
    // Indicar carga en proceso
    const loadingSnackRef = this.snackBar.open('Cargando historial...', '', {
      duration: 0, // No se cierra automáticamente
      panelClass: 'info-snackbar'
    });
    
    // Importar el componente de diálogo directamente sin precargar datos
    import('../element-history-dialog/element-history-dialog.component').then(({ ElementHistoryDialogComponent }) => {
      // Abrir el diálogo de historial
      const dialogRef = this.dialog.open(ElementHistoryDialogComponent, {
        width: '600px',
        maxWidth: '90vw',
        maxHeight: '90vh',
        data: {
          element: this.element
          // No precargamos history aquí, dejamos que el diálogo lo haga
        },
        panelClass: 'history-dialog'
      });
      
      // Cerrar el indicador de carga
      loadingSnackRef.dismiss();
    }).catch(error => {
      console.error('Error al cargar el componente de historial:', error);
      // Cerrar el indicador de carga en caso de error
      loadingSnackRef.dismiss();
      
      this.snackBar.open('Error al cargar la interfaz de historial', 'Cerrar', {
        duration: 5000,
        panelClass: ['error-snackbar']
      });
    });
  }

  /**
   * Obtiene el nombre del elemento destino de una conexión
   */
  getConnectionTargetName(connection: ExtendedNetworkConnection): string {
    return connection.targetName || 'Elemento desconocido';
  }

  /**
   * Obtiene el tipo del elemento destino de una conexión
   */
  getConnectionTargetType(connection: ExtendedNetworkConnection): ElementType {
    return connection.targetType || ElementType.NETWORK_GRAPH;
  }

  /**
   * Obtiene el estado del elemento destino de una conexión
   */
  getConnectionTargetStatus(connection: ExtendedNetworkConnection): ElementStatus {
    return connection.targetStatus || ElementStatus.INACTIVE;
  }

  /**
   * Verifica si la conexión tiene un estado definido
   */
  hasConnectionStatus(connection: ExtendedNetworkConnection): boolean {
    return !!connection.connectionStatus;
  }

  /**
   * Obtiene el estado de una conexión
   */
  getConnectionStatus(connection: ExtendedNetworkConnection): string {
    return connection.connectionStatus || 'unknown';
  }

  /**
   * Verifica si el elemento tiene puertos PON activos
   */
  isPonPortActive(element: ElementDetailView | null): boolean {
    return !!element?.ponPorts && element.ponPorts > 0;
  }

  /**
   * Verifica si el elemento tiene puertos de distribución activos
   */
  isDistributionPortActive(element: ElementDetailView | null): boolean {
    return !!element?.distributionPorts && element.distributionPorts > 0;
  }

  /**
   * Verifica si el elemento tiene puertos uplink activos
   */
  isUplinkPortActive(element: ElementDetailView | null): boolean {
    return !!element?.uplinkPorts && element.uplinkPorts > 0;
  }

  /**
   * Calcula el porcentaje de puertos utilizados
   */
  getPortUsagePercentage(element: ElementDetailView | null): number {
    const ratio = this.getPortUsageRatio(element);
    if (ratio < 0) return 0;
    return Math.min(Math.round(ratio * 100), 100);
  }

  /**
   * Verifica si el uso de puertos es crítico (>90%)
   */
  isPortUsageCritical(element: ElementDetailView | null): boolean {
    const ratio = this.getPortUsageRatio(element);
    return ratio > 0.9;
  }

  /**
   * Verifica si el uso de puertos está en nivel de advertencia (>75%)
   */
  isPortUsageWarning(element: ElementDetailView | null): boolean {
    const ratio = this.getPortUsageRatio(element);
    return ratio > 0.75 && ratio <= 0.9;
  }

  /**
   * Calcula la proporción de puertos utilizados
   */
  private getPortUsageRatio(element: ElementDetailView | null): number {
    if (!element || !element.totalPortCapacity || element.totalPortCapacity <= 0) {
      return -1;
    }
    
    const usedPorts = element.usedPorts || 0;
    return usedPorts / element.totalPortCapacity;
  }
} 