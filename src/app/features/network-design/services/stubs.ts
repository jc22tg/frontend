/**
 * Este archivo contiene stubs de servicios para propósitos de desarrollo y testing
 * Ayuda a resolver dependencias en componentes que aún no tienen implementaciones concretas
 */

import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

/**
 * Stub para el servicio de conexiones
 */
@Injectable({
  providedIn: 'root'
})
export class ConnectionService {
  getConnections(): Observable<any[]> {
    return of([]);
  }
  
  createConnection(sourceId: string, targetId: string, type: string, options?: any): Observable<any> {
    return of({ id: 'stub-id', sourceId, targetId, type, ...options });
  }
}

/**
 * Stub para el servicio de monitorización
 */
@Injectable({
  providedIn: 'root'
})
export class MonitoringService {
  getAlerts(): Observable<any[]> {
    return of([]);
  }
  
  getNetworkHealth(): Observable<any> {
    return of({ status: 'healthy', score: 95 });
  }
}

/**
 * Stub para el servicio de elementos
 */
@Injectable({
  providedIn: 'root'
})
export class ElementService {
  getElements(): Observable<any[]> {
    return of([]);
  }
  
  createElement(element: any): Observable<any> {
    return of({ id: 'stub-id', ...element });
  }
}

/**
 * Stub para el servicio de gestión de elementos
 */
@Injectable({
  providedIn: 'root'
})
export class ElementManagementService {
  getElementDetails(id: string): Observable<any> {
    return of({ id });
  }
}

/**
 * Stub para el servicio de estado de red
 */
@Injectable({
  providedIn: 'root'
})
export class NetworkStateService {
  getCurrentState(): any {
    return { activeCustomLayers: new Set() };
  }
  
  getActiveCustomLayers(): any[] {
    return [];
  }
  
  getCustomLayers(): any[] {
    return [];
  }
}

/**
 * Stub para el servicio de gestión de paneles
 */
@Injectable({
  providedIn: 'root'
})
export class PanelManagerService {
  layerManager$ = of(false);
  elementCreator$ = of(false);
  connectionCreator$ = of(false);
  
  isPanelVisible(panel: string): boolean {
    return false;
  }
  
  togglePanel(panel: string, visible?: boolean): void {
    // No-op
  }
}

/**
 * Enum para los tipos de paneles
 */
export enum PanelType {
  LAYER_MANAGER = 'layerManager',
  ELEMENT_CREATOR = 'elementCreator',
  CONNECTION_CREATOR = 'connectionCreator',
  MAP_MENU = 'mapMenu',
}

/**
 * Stub para el servicio de logging
 */
@Injectable({
  providedIn: 'root'
})
export class LoggerService {
  debug(message: string, ...args: any[]): void {
    console.log(`[DEBUG] ${message}`, ...args);
  }
  
  info(message: string, ...args: any[]): void {
    console.log(`[INFO] ${message}`, ...args);
  }
  
  warn(message: string, ...args: any[]): void {
    console.warn(`[WARN] ${message}`, ...args);
  }
  
  error(message: string, ...args: any[]): void {
    console.error(`[ERROR] ${message}`, ...args);
  }
} 
