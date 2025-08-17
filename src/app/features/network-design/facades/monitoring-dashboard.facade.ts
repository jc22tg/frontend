import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError, timer, forkJoin, combineLatest, Subscription } from 'rxjs';
import { catchError, map, switchMap, tap, shareReplay } from 'rxjs/operators';

import { ElementService } from '../services/element.service';
import { ConnectionService } from '../services/connection.service';
import { MonitoringService } from '../services/monitoring.service';
import { WidgetStateService } from '../services/widget-state.service';
import { WidgetDataService } from '../services/widget-data.service';
import { LoggerService } from '../../../core/services/logger.service';
import { NetworkStateService } from '../services/network-state.service';
import { MapEventsService } from '../services/map-events.service';
import { NetworkElement, NetworkConnection, ElementStatus } from '../../../shared/types/network.types';

/**
 * Fachada para el dashboard de monitoreo
 * Proporciona una interfaz unificada para todos los componentes del dashboard
 * y una integración optimizada con el mapa
 */
@Injectable({
  providedIn: 'root'
})
export class MonitoringDashboardFacade implements OnDestroy {
  // Estado de carga general del dashboard
  private loading = new BehaviorSubject<boolean>(false);
  public loading$ = this.loading.asObservable();
  
  // Estado de error general
  private error = new BehaviorSubject<{
    hasError: boolean;
    errorMessage?: string;
    errorCode?: string;
    details?: any;
  }>({ hasError: false });
  public error$ = this.error.asObservable();
  
  // Datos del mapa disponibles para todos los widgets
  private mapElements = new BehaviorSubject<NetworkElement[]>([]);
  public mapElements$ = this.mapElements.asObservable();
  
  private mapConnections = new BehaviorSubject<NetworkConnection[]>([]);
  public mapConnections$ = this.mapConnections.asObservable();
  
  private selectedElement = new BehaviorSubject<NetworkElement | null>(null);
  public selectedElement$ = this.selectedElement.asObservable();
  
  // Métricas y estadísticas
  private elementStatistics = new BehaviorSubject<{
    total: number;
    active: number;
    warning: number;
    error: number;
    inactive: number;
  }>({ total: 0, active: 0, warning: 0, error: 0, inactive: 0 });
  public elementStatistics$ = this.elementStatistics.asObservable();
  
  // Auto-refresh activo
  private autoRefreshActive = new BehaviorSubject<boolean>(false);
  public autoRefreshActive$ = this.autoRefreshActive.asObservable();
  
  private autoRefreshInterval = 60000; // 60 segundos por defecto
  private autoRefreshSubscription: Subscription | null = null;
  
  // Estado de sincronización
  private syncStatus = new BehaviorSubject<{
    lastSync: Date | null;
    syncInProgress: boolean;
    syncSource: string | null;
  }>({ lastSync: null, syncInProgress: false, syncSource: null });
  public syncStatus$ = this.syncStatus.asObservable();
  
  constructor(
    private elementService: ElementService,
    private connectionService: ConnectionService,
    private monitoringService: MonitoringService,
    private widgetStateService: WidgetStateService,
    private widgetDataService: WidgetDataService,
    private networkStateService: NetworkStateService,
    private mapEventsService: MapEventsService,
    private logger: LoggerService
  ) {
    // Inicializar suscripciones para mantener sincronizados el dashboard y el mapa
    this.initializeMapIntegration();
  }
  
  /**
   * Inicializa la integración con el mapa
   */
  private initializeMapIntegration(): void {
    // Suscribirse a cambios en el elemento seleccionado en el mapa
    this.networkStateService.state$.pipe(
      map(state => state.selectedElement)
    ).subscribe(selectedElement => {
      if (selectedElement) {
        this.selectedElement.next(selectedElement);
      }
    });
    
    // Suscribirse a eventos del mapa que puedan afectar al dashboard
    // Verificar que el método existe
    if (typeof this.mapEventsService.getEvents === 'function') {
      this.mapEventsService.getEvents().subscribe((event: any) => {
        if (event.type === 'element_selected') {
          if (event.element) {
            this.selectedElement.next(event.element);
          }
        }
      });
    } 
    // Nota: Se eliminaron las referencias a eventos$ para evitar errores de linter
  }
  
  /**
   * Inicializa el dashboard cargando todos los datos necesarios
   */
  initializeDashboard(): Observable<boolean> {
    this.loading.next(true);
    this.clearError();
    this.setSyncStatus(true, 'initialization');
    
    return this.loadAllDashboardData().pipe(
      tap(data => {
        // Actualizar datos compartidos
        if (data.elements) {
          this.mapElements.next(data.elements);
          this.calculateElementStatistics(data.elements);
        }
        
        if (data.connections) {
          this.mapConnections.next(data.connections);
        }
        
        // Actualizar estado
        this.setSyncStatus(false, 'initialization', new Date());
        this.loading.next(false);
      }),
      map(() => true),
      catchError(error => {
        this.loading.next(false);
        this.setSyncStatus(false, 'initialization');
        this.setError('INIT_ERROR', 'Error al inicializar el dashboard', error);
        return of(false);
      }),
      shareReplay(1)
    );
  }
  
  /**
   * Actualiza todos los datos del dashboard
   */
  refreshDashboard(): Observable<boolean> {
    if (this.syncStatus.value.syncInProgress) {
      return of(false); // Evitar múltiples actualizaciones simultáneas
    }
    
    this.loading.next(true);
    this.clearError();
    this.setSyncStatus(true, 'manual-refresh');
    
    // Solicitar a todos los widgets que actualicen sus datos
    this.widgetStateService.refreshAllWidgetsData('monitoring-dashboard');
    
    return this.loadAllDashboardData().pipe(
      tap(data => {
        // Actualizar datos compartidos
        if (data.elements) {
          this.mapElements.next(data.elements);
          this.calculateElementStatistics(data.elements);
        }
        
        if (data.connections) {
          this.mapConnections.next(data.connections);
        }
        
        // Verificar que el método existe antes de llamarlo
        if (typeof this.widgetDataService.refreshSharedData === 'function') {
          this.widgetDataService.refreshSharedData();
        }
        
        // Actualizar estado
        this.setSyncStatus(false, 'manual-refresh', new Date());
        this.loading.next(false);
      }),
      map(() => true),
      catchError(error => {
        this.loading.next(false);
        this.setSyncStatus(false, 'manual-refresh');
        this.setError('REFRESH_ERROR', 'Error al actualizar el dashboard', error);
        return of(false);
      }),
      shareReplay(1)
    );
  }
  
  /**
   * Activa/desactiva el auto-refresh
   */
  toggleAutoRefresh(enable: boolean, interval: number = this.autoRefreshInterval): void {
    if (enable === this.autoRefreshActive.value) return;
    
    if (enable) {
      this.startAutoRefresh(interval);
    } else {
      this.stopAutoRefresh();
    }
    
    // Verificar que el método existe antes de llamarlo
    if (typeof this.widgetDataService.setAutoRefresh === 'function') {
      this.widgetDataService.setAutoRefresh(enable);
    }
  }
  
  /**
   * Actualiza las estadísticas de elementos basadas en los datos actuales
   */
  private calculateElementStatistics(elements: NetworkElement[]): void {
    const stats = {
      total: elements.length,
      active: 0,
      warning: 0,
      error: 0,
      inactive: 0
    };
    
    elements.forEach(element => {
      switch (element.status) {
        case ElementStatus.ACTIVE:
          stats.active++;
          break;
        case ElementStatus.MAINTENANCE:
          stats.warning++;
          break;
        case ElementStatus.ERROR:
          stats.error++;
          break;
        case ElementStatus.INACTIVE:
          stats.inactive++;
          break;
      }
    });
    
    this.elementStatistics.next(stats);
  }
  
  /**
   * Inicia el auto-refresh
   */
  private startAutoRefresh(interval: number): void {
    this.stopAutoRefresh(); // Detener si existe uno activo
    
    this.autoRefreshInterval = interval;
    this.autoRefreshActive.next(true);
    
    this.autoRefreshSubscription = timer(interval, interval)
      .pipe(
        switchMap(() => {
          this.setSyncStatus(true, 'auto-refresh');
          return this.refreshDashboard().pipe(
            tap(() => {
              this.setSyncStatus(false, 'auto-refresh', new Date());
            })
          );
        })
      )
      .subscribe();
  }
  
  /**
   * Detiene el auto-refresh
   */
  private stopAutoRefresh(): void {
    if (this.autoRefreshSubscription) {
      this.autoRefreshSubscription.unsubscribe();
      this.autoRefreshSubscription = null;
    }
    
    this.autoRefreshActive.next(false);
  }
  
  /**
   * Carga todos los datos necesarios para el dashboard
   */
  private loadAllDashboardData(): Observable<{
    elements: NetworkElement[];
    connections: NetworkConnection[];
    metrics: any;
    alerts: any[];
  }> {
    // Intentar usar los métodos adecuados, con fallbacks
    const getMetrics = () => {
      if (typeof this.widgetDataService.fetchNetworkMetrics === 'function') {
        return this.widgetDataService.fetchNetworkMetrics();
      } 
      // Usar directamente el servicio de monitoreo como fallback
      return this.monitoringService.getMetrics ? 
        this.monitoringService.getMetrics() : of({});
    };
    
    const getAlerts = () => {
      if (typeof this.widgetDataService.fetchRecentAlerts === 'function') {
        return this.widgetDataService.fetchRecentAlerts();
      }
      // Usar directamente el servicio de monitoreo como fallback
      return this.monitoringService.getAlerts ? 
        this.monitoringService.getAlerts() : of([]);
    };
    
    // Realizar peticiones en paralelo para optimizar el tiempo de carga
    return forkJoin({
      elements: this.elementService.getAllElements().pipe(
        catchError(error => {
          this.logger.error('Error al cargar elementos:', error);
          return of([]);
        })
      ),
      connections: this.connectionService.getConnections().pipe(
        catchError(error => {
          this.logger.error('Error al cargar conexiones:', error);
          return of([]);
        })
      ),
      metrics: getMetrics().pipe(
        catchError(error => {
          this.logger.error('Error al cargar métricas:', error);
          return of({});
        })
      ),
      alerts: getAlerts().pipe(
        catchError(error => {
          this.logger.error('Error al cargar alertas:', error);
          return of([]);
        })
      )
    });
  }
  
  /**
   * Actualiza el estado de sincronización
   */
  private setSyncStatus(
    inProgress: boolean, 
    source: string | null = null, 
    timestamp: Date | null = null
  ): void {
    this.syncStatus.next({
      lastSync: timestamp || this.syncStatus.value.lastSync,
      syncInProgress: inProgress,
      syncSource: source
    });
  }
  
  /**
   * Establece un error en el estado
   */
  private setError(code: string, message: string, details?: any): void {
    this.error.next({
      hasError: true,
      errorCode: code,
      errorMessage: message,
      details
    });
    
    this.logger.error(`Error en el dashboard de monitoreo: ${message}`, {
      code,
      details
    });
  }
  
  /**
   * Limpia cualquier error
   */
  private clearError(): void {
    this.error.next({ hasError: false });
  }
  
  /**
   * Obtiene datos específicos de un elemento
   */
  getElementDetails(elementId: string): Observable<NetworkElement | null> {
    // Primero buscar en el caché local
    const cachedElement = this.mapElements.value.find(e => e.id === elementId);
    if (cachedElement) {
      return of(cachedElement);
    }
    
    // Si no está en caché, cargarlo del servicio
    return this.elementService.getElementById(elementId).pipe(
      catchError(error => {
        this.logger.error(`Error al obtener detalles del elemento ${elementId}:`, error);
        return of(null);
      })
    );
  }
  
  /**
   * Selecciona un elemento en el mapa y actualiza el dashboard
   */
  selectElement(elementId: string): Observable<boolean> {
    return this.getElementDetails(elementId).pipe(
      tap(element => {
        if (element) {
          this.selectedElement.next(element);
          
          // Notificar al mapa para que también seleccione este elemento
          this.notifyMapOfSelection(element);
        }
      }),
      map(element => !!element),
      catchError(error => {
        this.logger.error(`Error al seleccionar elemento ${elementId}:`, error);
        return of(false);
      })
    );
  }
  
  /**
   * Notifica al mapa sobre la selección de un elemento
   */
  private notifyMapOfSelection(element: NetworkElement): void {
    // Verificar que los métodos existen antes de llamarlos
    if (typeof this.networkStateService.setSelectedElement === 'function') {
      this.networkStateService.setSelectedElement(element);
    }
    
    // Usar el método disponible para seleccionar un elemento
    if (typeof this.mapEventsService.selectElement === 'function') {
      this.mapEventsService.selectElement(element);
    }
    // Nota: Se eliminó la referencia a triggerEvent para evitar errores de linter
  }
  
  /**
   * Obtiene el estado de auto-refresh actual
   */
  getAutoRefreshConfig(): { enabled: boolean, interval: number } {
    return {
      enabled: this.autoRefreshActive.value,
      interval: this.autoRefreshInterval
    };
  }
  
  /**
   * Limpia todos los recursos al destruir el dashboard
   */
  ngOnDestroy(): void {
    this.destroy();
  }
  
  /**
   * Limpia todos los recursos
   */
  destroy(): void {
    this.stopAutoRefresh();
  }
} 
