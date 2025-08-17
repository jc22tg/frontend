import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, of, EMPTY } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { NetworkElement, ElementType } from '../../../../shared/types/network.types';
import { LoggerService } from '../../../../core/services/logger.service';
import { MapElementManagerAdapter } from './standalone-adapters/map-element-manager-adapter';
import { MapStateManagerAdapter } from './standalone-adapters/map-state-manager-adapter';

/**
 * Servicio adaptador para facilitar la migración a componentes standalone
 * 
 * Este servicio proporciona una interfaz compatible con componentes standalone
 * y actúa como intermediario entre los antiguos servicios y los nuevos componentes.
 */
@Injectable({
  providedIn: 'root'
})
export class StandaloneAdapterService {
  // Cache de adaptadores
  private adaptersCache = new Map<string, any>();
  
  // Flags para compatibilidad
  private featureFlags$ = new BehaviorSubject<Record<string, boolean>>({
    useNewMapImplementation: true,
    enableStandaloneMode: true,
    useMapContainerInsteadOfNetworkMap: true
  });
  
  constructor(
    private logger: LoggerService,
    private mapElementManagerAdapter: MapElementManagerAdapter,
    private mapStateManagerAdapter: MapStateManagerAdapter
  ) {
    this.logger.info('StandaloneAdapterService inicializado');
  }
  
  /**
   * Obtiene un adaptador para el servicio especificado
   * @param serviceName Nombre del servicio
   * @returns Adaptador para el servicio
   */
  getAdapter<T>(serviceName: string): T {
    if (this.adaptersCache.has(serviceName)) {
      return this.adaptersCache.get(serviceName) as T;
    }
    
    // Crear nuevo adaptador
    const adapter = this.createAdapter<T>(serviceName);
    this.adaptersCache.set(serviceName, adapter);
    
    return adapter;
  }
  
  /**
   * Crea un adaptador para el servicio especificado
   * @param serviceName Nombre del servicio
   * @returns Adaptador para el servicio
   */
  private createAdapter<T>(serviceName: string): T {
    switch (serviceName) {
      case 'MapElementManagerService':
        return this.mapElementManagerAdapter as unknown as T;
      case 'MapStateManagerService':
        return this.mapStateManagerAdapter as unknown as T;
      default:
        this.logger.warn(`No se encontró adaptador para ${serviceName}, devolviendo proxy genérico`);
        return this.createGenericAdapter<T>();
    }
  }
  
  /**
   * Crea un adaptador genérico que registra llamadas a métodos
   * @returns Adaptador genérico
   */
  private createGenericAdapter<T>(): T {
    // Utilizamos "any" para evitar errores de tipo con el proxy genérico
    return new Proxy({} as any, {
      get: (target, prop) => {
        if (typeof prop === 'string') {
          return (...args: any[]) => {
            this.logger.debug(`Llamada a método no implementado: ${String(prop)}`, args);
            return EMPTY;
          };
        }
        return undefined;
      }
    }) as T;
  }
  
  /**
   * Establece el valor de una bandera de características
   * @param flag Nombre de la bandera
   * @param value Valor a establecer
   */
  setFeatureFlag(flag: string, value: boolean): void {
    const currentFlags = this.featureFlags$.value;
    this.featureFlags$.next({
      ...currentFlags,
      [flag]: value
    });
  }
  
  /**
   * Obtiene el valor de una bandera de características
   * @param flag Nombre de la bandera
   * @returns Valor de la bandera
   */
  getFeatureFlag(flag: string): boolean {
    return this.featureFlags$.value[flag] || false;
  }
  
  /**
   * Observable para cambios en las banderas de características
   */
  get featureFlags(): Observable<Record<string, boolean>> {
    return this.featureFlags$.asObservable();
  }
  
  /**
   * Observable para una bandera específica
   * @param flag Nombre de la bandera
   */
  getFeatureFlagStream(flag: string): Observable<boolean> {
    return this.featureFlags.pipe(
      map(flags => flags[flag] || false)
    );
  }
} 
