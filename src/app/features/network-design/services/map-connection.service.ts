import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, take, tap, catchError } from 'rxjs/operators';
import { NetworkConnection, ElementStatus, ConnectionType, ConnectionStatus } from '../../../shared/types/network.types';
import { LoggerService } from '../../../core/services/logger.service';
import { NetworkDesignService } from '../../../features/network-design/services/network-design.service';
import { NetworkStateService } from '../../../features/network-design/services/network-state.service';

/**
 * @deprecated Use NetworkConnection instead
 */
export interface D3Link {
  id: string;
  sourceElementId: string;
  targetElementId: string;
  source: string | { id: string; x?: number; y?: number };
  target: string | { id: string; x?: number; y?: number };
  type?: string;
  status: ElementStatus;
  value?: number;
}

/**
 * @description Servicio para gestionar las conexiones entre elementos en el mapa
 */
@Injectable({
  providedIn: 'root'
})
export class MapConnectionService {
  private connectionsSubject = new BehaviorSubject<NetworkConnection[]>([]);
  connections$ = this.connectionsSubject.asObservable();
  private selectedLinkSubject = new BehaviorSubject<NetworkConnection | null>(null);
  selectedLink$ = this.selectedLinkSubject.asObservable();

  constructor(
    private logger: LoggerService, 
    private networkDesignService: NetworkDesignService,
    private stateService: NetworkStateService
  ) {}

  /**
   * Carga las conexiones de red
   * @returns Observable con las conexiones cargadas
   */
  loadConnections(): Observable<NetworkConnection[]> {
    this.logger.debug('Cargando conexiones de red');
    
    // Usar directamente los datos mock de MOCK_CONNECTIONS para pruebas
    const mockConnections: NetworkConnection[] = [
      {
        id: 'conn-001',
        name: 'OLT-Splitter 1',
        sourceElementId: 'olt-001',
        targetElementId: 'splitter-001',
        type: ConnectionType.FIBER,
        status: ConnectionStatus.ACTIVE,
        capacity: 10,
        utilizationPercentage: 20,
        description: 'Conexión OLT a Splitter'
      },
      {
        id: 'conn-002',
        name: 'Splitter-FDP 1',
        sourceElementId: 'splitter-001',
        targetElementId: 'fdp-001',
        type: ConnectionType.FIBER,
        status: ConnectionStatus.ACTIVE,
        capacity: 10,
        utilizationPercentage: 20,
        description: 'Conexión Splitter a FDP'
      },
      {
        id: 'conn-003',
        name: 'FDP-ONT 1',
        sourceElementId: 'fdp-001',
        targetElementId: 'ont-001',
        type: ConnectionType.FIBER,
        status: ConnectionStatus.ACTIVE,
        capacity: 1,
        utilizationPercentage: 10,
        description: 'Conexión FDP a ONT'
      },
      {
        id: 'conn-004',
        name: 'OLT-EDFA 1',
        sourceElementId: 'olt-001',
        targetElementId: 'edfa-001',
        type: ConnectionType.FIBER,
        status: ConnectionStatus.ACTIVE,
        capacity: 40,
        utilizationPercentage: 30,
        description: 'Conexión OLT a EDFA'
      }
    ];
    
    // Actualizar el subject con los datos mock
    this.connectionsSubject.next(mockConnections);
    
    // Actualizar también el estado centralizado
    this.stateService.updateConnections(mockConnections);
    
    this.logger.debug(`${mockConnections.length} conexiones cargadas`);
    
    return of(mockConnections);
  }

  /**
   * Obtiene todas las conexiones
   * @returns Observable con las conexiones
   */
  getConnections(): Observable<NetworkConnection[]> {
    return this.connections$;
  }

  /**
   * Obtiene las conexiones en formato D3Link para visualización en el mapa
   * @returns Observable con las conexiones en formato D3Link
   */
  getD3Links(): Observable<NetworkConnection[]> {
    return this.connections$;
  }

  /**
   * Añade una nueva conexión entre elementos
   * @param connection La conexión a añadir
   */
  addConnection(connection: NetworkConnection): Observable<NetworkConnection> {
    const currentConnections = this.connectionsSubject.value;
    this.connectionsSubject.next([...currentConnections, connection]);
    return of(connection);
  }

  /**
   * Actualiza una conexión existente
   * @param connection La conexión con los datos actualizados
   */
  updateConnection(connection: NetworkConnection): Observable<NetworkConnection> {
    const currentConnections = this.connectionsSubject.value;
    const index = currentConnections.findIndex(c => c.id === connection.id);
    
    if (index !== -1) {
      const updatedConnections = [...currentConnections];
      updatedConnections[index] = connection;
      this.connectionsSubject.next(updatedConnections);
    }
    return of(connection);
  }

  /**
   * Elimina una conexión
   * @param connectionId ID de la conexión a eliminar
   */
  removeConnection(connectionId: string): Observable<boolean> {
    const currentConnections = this.connectionsSubject.value;
    const filteredConnections = currentConnections.filter(conn => conn.id !== connectionId);
    this.connectionsSubject.next(filteredConnections);
    return of(true);
  }

  /**
   * Obtiene las conexiones para un elemento específico
   * @param elementId ID del elemento
   * @returns Observable con las conexiones del elemento
   */
  getConnectionsForElement(elementId: string): Observable<NetworkConnection[]> {
    return this.connections$.pipe(
      map(connections => 
        connections.filter(
          conn => conn.sourceElementId === elementId || conn.targetElementId === elementId
        )
      )
    );
  }

  /**
   * Obtiene una conexión por su ID
   * @param connectionId ID de la conexión
   * @returns Observable con la conexión encontrada o null
   */
  getConnectionById(connectionId: string): Observable<NetworkConnection | null> {
    return this.connections$.pipe(
      map(connections => 
        connections.find(conn => conn.id === connectionId) || null
      )
    );
  }

  /**
   * Verifica si existe una conexión entre dos elementos
   * @param sourceId ID del elemento origen
   * @param targetId ID del elemento destino
   * @returns Observable con la conexión encontrada o null
   */
  connectionExists(sourceId: string, targetId: string): Observable<NetworkConnection | null> {
    return this.connections$.pipe(
      map(connections => {
        const connection = connections.find(
          conn => 
            (conn.sourceElementId === sourceId && conn.targetElementId === targetId) ||
            (conn.sourceElementId === targetId && conn.targetElementId === sourceId)
        );
        return connection || null;
      })
    );
  }

  /**
   * Crea una conexión entre dos elementos
   * @param sourceId ID del elemento origen
   * @param targetId ID del elemento destino
   * @param type Tipo de conexión
   * @param properties Propiedades adicionales para la conexión
   * @returns Observable con la conexión creada
   */
  createConnection(
    sourceId: string, 
    targetId: string, 
    type: ConnectionType = ConnectionType.FIBER, 
    properties?: Partial<NetworkConnection>
  ): Observable<NetworkConnection> {
    const newConnection: NetworkConnection = {
      id: `conn-${Date.now()}`,
      name: `Conexión ${sourceId}-${targetId}`,
      sourceElementId: sourceId,
      targetElementId: targetId,
      status: ConnectionStatus.ACTIVE,
      type,
      ...(properties || {})
    };
    
    return this.addConnection(newConnection);
  }

  /**
   * Selecciona una conexión
   * @param connection La conexión a seleccionar
   */
  selectLink(connection: NetworkConnection): void {
    this.selectedLinkSubject.next(connection);
  }

  /**
   * Obtiene color para la línea según el estado (compatibilidad)
   */
  getLinkColor(status: ConnectionStatus): string {
    switch (status) {
      case ConnectionStatus.ACTIVE:
        return '#4CAF50';
      case ConnectionStatus.DEGRADED:
        return '#FF9800';
      case ConnectionStatus.FAILED:
        return '#F44336';
      case ConnectionStatus.INACTIVE:
        return '#9E9E9E';
      case ConnectionStatus.PLANNED:
        return '#2196F3';
      default:
        return '#999999';
    }
  }

  /**
   * Obtiene el ancho de línea según el tipo (compatibilidad)
   */
  getLinkWidth(type: string): number {
    switch (type) {
      case 'main-fiber':
        return 4;
      case 'fiber':
        return 3;
      case 'amplified-fiber':
        return 3.5;
      case 'distribution-fiber':
        return 2;
      case 'split-fiber':
        return 2;
      default:
        return 2;
    }
  }

  /**
   * Obtiene el patrón de línea según el tipo (compatibilidad)
   */
  getLinkDashArray(type: string): string {
    switch (type) {
      case 'wireless':
        return '5,5';
      case 'copper':
        return '10,3';
      case 'maintenance':
        return '8,3,2,3';
      default:
        return 'none';
    }
  }

  /**
   * Actualiza la posición de los enlaces cuando se mueven los nodos (compatibilidad)
   */
  updateLinkPositions(nodesById: Map<string, { x: number; y: number }>): void {
    // Implementation needed
  }

  clearCache(): void {
    this.logger.debug('Limpiando caché de conexiones');
    this.connectionsSubject.next([]);
    this.selectedLinkSubject.next(null);
  }
} 
