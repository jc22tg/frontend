import { Injectable, OnDestroy } from '@angular/core';
import { Observable, of, BehaviorSubject, timer, ReplaySubject } from 'rxjs';
import { catchError, map, shareReplay, tap, switchMap, takeUntil } from 'rxjs/operators';

import { ElementService } from './element.service';
import { ConnectionService } from './connection.service';
import { MonitoringService } from './monitoring.service';
import { NetworkStateService } from './network-state.service';
import { LoggerService } from '../../../core/services/logger.service';

import { NetworkElement, ElementType, NetworkConnection } from '../../../shared/types/network.types';

interface CachedData<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

/**
 * Servicio centralizado para proporcionar datos a todos los widgets
 * Actúa como intermediario entre los servicios del sistema y los componentes de widgets
 */
@Injectable({
  providedIn: 'root'
})
export class WidgetDataService implements OnDestroy {
  // Sistema de caché para reducir llamadas duplicadas
  private cacheLifetime = 30000; // 30 segundos de vida útil del caché por defecto
  private cacheMap = new Map<string, CachedData<any>>();
  
  // Streams compartidos para datos comunes
  private networkMetricsSubject = new ReplaySubject<any>(1);
  public networkMetrics$ = this.networkMetricsSubject.asObservable();
  
  private connectionStatusSubject = new ReplaySubject<any>(1);
  public connectionStatus$ = this.connectionStatusSubject.asObservable();
  
  private recentAlertsSubject = new ReplaySubject<any[]>(1);
  public recentAlerts$ = this.recentAlertsSubject.asObservable();
  
  // Control de actualización automática
  private autoRefreshTrigger = new BehaviorSubject<boolean>(false);
  private destroy$ = new ReplaySubject<void>(1);
  
  constructor(
    private elementService: ElementService,
    private connectionService: ConnectionService,
    private monitoringService: MonitoringService,
    private networkStateService: NetworkStateService,
    private logger: LoggerService
  ) {
    // Iniciar los flujos de datos compartidos
    this.initializeSharedDataStreams();
  }
  
  /**
   * Inicializa los streams de datos compartidos para reducir llamadas duplicadas
   */
  private initializeSharedDataStreams(): void {
    // Actualización periódica de métricas
    this.autoRefreshTrigger.pipe(
      switchMap(shouldRefresh => shouldRefresh ? timer(0, this.cacheLifetime) : of(null)),
      takeUntil(this.destroy$)
    ).subscribe(tick => {
      if (tick !== null) {
        this.refreshSharedData();
      }
    });
  }
  
  /**
   * Configura la actualización automática de datos compartidos
   */
  setAutoRefresh(enabled: boolean): void {
    this.autoRefreshTrigger.next(enabled);
  }
  
  /**
   * Actualiza todos los datos compartidos
   */
  refreshSharedData(): void {
    this.fetchNetworkMetrics().subscribe();
    this.fetchConnectionStatus().subscribe();
    this.fetchRecentAlerts().subscribe();
  }
  
  /**
   * Busca elementos por término
   */
  searchElements(term: string): Observable<NetworkElement[]> {
    // Usar método adecuado del ElementService para búsqueda
    return this.elementService.searchByTerm(term).pipe(
      catchError(error => {
        this.logger.error('Error al buscar elementos:', error);
        return of([]);
      })
    );
  }

  /**
   * Obtiene estadísticas de conexiones
   */
  fetchConnectionStatus(): Observable<any> {
    const cacheKey = 'connectionStatus';
    
    // Comprobar si hay datos en caché válidos
    const cached = this.getCachedData<any>(cacheKey);
    if (cached) {
      // Actualizar el subject compartido y devolver resultado en caché
      this.connectionStatusSubject.next(cached);
      return of(cached);
    }
    
    // Usar método adecuado del ConnectionService para estadísticas
    return this.connectionService.getConnectionsStats().pipe(
      map(stats => ({
        total: stats.total || 0,
        active: stats.active || 0,
        inactive: stats.inactive || 0,
        warning: stats.warning || 0,
        error: stats.error || 0
      })),
      tap(stats => {
        // Guardar en caché y actualizar el subject compartido
        this.setCachedData(cacheKey, stats);
        this.connectionStatusSubject.next(stats);
      }),
      catchError(error => {
        this.logger.error('Error al obtener estadísticas de conexiones:', error);
        const fallback = {
          total: 0,
          active: 0,
          inactive: 0,
          warning: 0,
          error: 0
        };
        this.connectionStatusSubject.next(fallback);
        return of(fallback);
      }),
      // Compartir la misma respuesta entre múltiples suscriptores
      shareReplay(1)
    );
  }

  /**
   * Obtiene propiedades de un elemento por ID
   */
  fetchElementProperties(elementId: string): Observable<NetworkElement | null> {
    const cacheKey = `element_${elementId}`;
    
    // Comprobar si hay datos en caché válidos
    const cached = this.getCachedData<NetworkElement | null>(cacheKey);
    if (cached) {
      return of(cached);
    }
    
    return this.elementService.getElementById(elementId).pipe(
      tap(element => {
        if (element) {
          // Guardar en caché con duración más larga (elemento cambia menos)
          this.setCachedData(cacheKey, element, 60000);
        }
      }),
      catchError(error => {
        this.logger.error(`Error al obtener propiedades del elemento ${elementId}:`, error);
        return of(null);
      }),
      shareReplay(1)
    );
  }

  /**
   * Obtiene alertas recientes
   */
  fetchRecentAlerts(limit = 5): Observable<any[]> {
    const cacheKey = `recentAlerts_${limit}`;
    
    // Comprobar si hay datos en caché válidos
    const cached = this.getCachedData<any[]>(cacheKey);
    if (cached) {
      this.recentAlertsSubject.next(cached);
      return of(cached);
    }
    
    // Usar método adecuado del MonitoringService para alertas
    return this.monitoringService.getAlerts(limit).pipe(
      tap(alerts => {
        this.setCachedData(cacheKey, alerts);
        this.recentAlertsSubject.next(alerts);
      }),
      catchError(error => {
        this.logger.error('Error al obtener alertas recientes:', error);
        this.recentAlertsSubject.next([]);
        return of([]);
      }),
      shareReplay(1)
    );
  }

  /**
   * Obtiene métricas de red
   */
  fetchNetworkMetrics(): Observable<any> {
    const cacheKey = 'networkMetrics';
    
    // Comprobar si hay datos en caché válidos
    const cached = this.getCachedData<any>(cacheKey);
    if (cached) {
      this.networkMetricsSubject.next(cached);
      return of(cached);
    }
    
    // Usar método adecuado del MonitoringService para métricas
    return this.monitoringService.getMetrics().pipe(
      tap(metrics => {
        // Añadir timestamp al objeto para mostrar última actualización
        const metricsWithTimestamp = {
          ...metrics,
          lastUpdated: new Date()
        };
        this.setCachedData(cacheKey, metricsWithTimestamp);
        this.networkMetricsSubject.next(metricsWithTimestamp);
      }),
      catchError(error => {
        this.logger.error('Error al obtener métricas de red:', error);
        const fallback = {
          elementCount: 0,
          connectionCount: 0,
          utilization: 0,
          health: 0,
          lastUpdated: new Date()
        };
        this.networkMetricsSubject.next(fallback);
        return of(fallback);
      }),
      shareReplay(1)
    );
  }

  /**
   * Obtiene el estado actual de la red
   */
  fetchNetworkState(): Observable<any> {
    return of(this.networkStateService.getCurrentState()).pipe(
      catchError(error => {
        this.logger.error('Error al obtener estado de red:', error);
        return of({});
      }),
      shareReplay(1)
    );
  }

  /**
   * Obtiene elementos por tipo
   */
  fetchElementsByType(elementType: ElementType): Observable<NetworkElement[]> {
    const cacheKey = `elementsByType_${elementType}`;
    
    // Comprobar si hay datos en caché válidos
    const cached = this.getCachedData<NetworkElement[]>(cacheKey);
    if (cached) {
      return of(cached);
    }
    
    return this.elementService.getElementsByType(elementType).pipe(
      tap(elements => {
        this.setCachedData(cacheKey, elements);
      }),
      catchError(error => {
        this.logger.error(`Error al obtener elementos de tipo ${elementType}:`, error);
        return of([]);
      }),
      shareReplay(1)
    );
  }

  /**
   * Obtiene todas las conexiones
   */
  fetchAllConnections(): Observable<NetworkConnection[]> {
    const cacheKey = 'allConnections';
    
    // Comprobar si hay datos en caché válidos
    const cached = this.getCachedData<NetworkConnection[]>(cacheKey);
    if (cached) {
      return of(cached);
    }
    
    return this.connectionService.getConnections().pipe(
      tap(connections => {
        this.setCachedData(cacheKey, connections);
      }),
      catchError(error => {
        this.logger.error('Error al obtener todas las conexiones:', error);
        return of([]);
      }),
      shareReplay(1)
    );
  }
  
  /**
   * Actualiza la configuración de caché
   */
  setCacheLifetime(milliseconds: number): void {
    this.cacheLifetime = milliseconds;
  }
  
  /**
   * Invalida una entrada específica del caché
   */
  invalidateCacheEntry(key: string): void {
    this.cacheMap.delete(key);
  }
  
  /**
   * Invalida todo el caché
   */
  invalidateCache(): void {
    this.cacheMap.clear();
  }
  
  /**
   * Obtiene datos de caché si son válidos
   */
  private getCachedData<T>(key: string): T | null {
    const now = Date.now();
    const cached = this.cacheMap.get(key);
    
    if (cached && cached.expiresAt > now) {
      return cached.data as T;
    }
    
    // Eliminar entrada caducada
    if (cached) {
      this.cacheMap.delete(key);
    }
    
    return null;
  }
  
  /**
   * Guarda datos en caché
   */
  private setCachedData<T>(key: string, data: T, lifetime: number = this.cacheLifetime): void {
    const now = Date.now();
    this.cacheMap.set(key, {
      data,
      timestamp: now,
      expiresAt: now + lifetime
    });
  }
  
  /**
   * Limpia recursos al destruir el servicio
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
} 