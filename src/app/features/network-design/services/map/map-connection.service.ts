import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, firstValueFrom, of, throwError } from 'rxjs';
import { delay, tap } from 'rxjs/operators';
import { LoggerService } from '../../../../core/services/logger.service';
import { NetworkElement, NetworkConnection, ElementType, ElementStatus, ConnectionStatus, ConnectionType } from '../../../../shared/types/network.types';

// Definición manual del environment para evitar errores de importación
const environment = {
  useMocks: true,
  apiUrl: 'http://localhost:3000/api',
  featureFlags: {
    enableMockData: true
  }
};

/**
 * Estado de creación de una conexión
 */
export enum ConnectionCreationState {
  IDLE = 'IDLE',
  SOURCE_SELECTED = 'SOURCE_SELECTED',
  TARGET_SELECTED = 'TARGET_SELECTED',
  FAILED = 'FAILED'
}

/**
 * Interfaz para el estado de la conexión en creación
 */
export interface ConnectionInProgress {
  sourceElement?: NetworkElement;
  targetElement?: NetworkElement;
  state: ConnectionCreationState;
  error?: string;
}

/**
 * Interfaz para el estado durante la creación de conexión
 */
export interface ConnectionState {
  sourceElement?: NetworkElement;
  targetElement?: NetworkElement;
  name?: string;
  waypoints?: any[];
}

/**
 * Servicio para gestionar las conexiones entre elementos del mapa
 * 
 * Este servicio proporciona funcionalidades para:
 * - Crear/editar/eliminar conexiones entre elementos
 * - Validar si una conexión es posible
 * - Proporcionar visual feedback durante la creación de conexiones
 */
@Injectable({
  providedIn: 'root'
})
export class MapConnectionService {
  // Dependencias
  private logger = inject(LoggerService);
  
  // Subjects para el estado de las conexiones
  private connectionsSubject = new BehaviorSubject<NetworkConnection[]>([]);
  private connectionInProgressSubject = new BehaviorSubject<ConnectionInProgress>({
    state: ConnectionCreationState.IDLE
  });
  
  // Observables públicos
  readonly connections$ = this.connectionsSubject.asObservable();
  readonly connectionInProgress$ = this.connectionInProgressSubject.asObservable();
  
  // Almacenamiento local de conexiones para uso interno
  private connections: NetworkConnection[] = [];
  
  constructor() {
    this.logger.debug('MapConnectionService inicializado');
  }
  
  /**
   * Establece las conexiones iniciales
   * @param connections Lista de conexiones
   */
  setConnections(connections: NetworkConnection[]): void {
    this.connections = [...connections];
    this.connectionsSubject.next(this.connections);
    this.logger.debug(`Cargadas ${connections.length} conexiones`);
  }
  
  /**
   * Obtiene todas las conexiones actuales
   */
  getConnections(): NetworkConnection[] {
    return [...this.connections];
  }
  
  /**
   * Obtiene una conexión por su ID
   * @param id ID de la conexión
   */
  getConnectionById(id: string): NetworkConnection | undefined {
    return this.connections.find(conn => conn.id === id);
  }
  
  /**
   * Obtiene las conexiones para un elemento específico
   * @param elementId ID del elemento
   */
  getConnectionsForElement(elementId: string): NetworkConnection[] {
    return this.connections.filter(
      conn => conn.sourceElementId === elementId || conn.targetElementId === elementId
    );
  }
  
  /**
   * Obtiene la conexión entre dos elementos si existe
   * @param sourceId ID del elemento origen
   * @param targetId ID del elemento destino
   */
  getConnectionBetweenElements(sourceId: string, targetId: string): NetworkConnection | undefined {
    return this.connections.find(
      conn => 
        (conn.sourceElementId === sourceId && conn.targetElementId === targetId) ||
        (conn.sourceElementId === targetId && conn.targetElementId === sourceId)
    );
  }
  
  /**
   * Inicia el proceso de creación de una conexión
   */
  startConnectionCreation(): void {
    this.connectionInProgressSubject.next({
      state: ConnectionCreationState.IDLE
    });
    this.logger.debug('Iniciando creación de conexión');
  }
  
  /**
   * Selecciona el elemento origen para la conexión
   * @param element Elemento origen
   */
  selectSourceElement(element: NetworkElement): void {
    if (!this.isValidConnectionEndpoint(element)) {
      this.setConnectionError('El elemento seleccionado no puede ser usado como origen de conexión');
      return;
    }
    
    this.connectionInProgressSubject.next({
      sourceElement: element,
      state: ConnectionCreationState.SOURCE_SELECTED
    });
    this.logger.debug(`Elemento origen seleccionado: ${element.id}`);
  }
  
  /**
   * Selecciona el elemento destino para la conexión
   * @param element Elemento destino
   */
  selectTargetElement(element: NetworkElement): void {
    const currentState = this.connectionInProgressSubject.value;
    
    if (currentState.state !== ConnectionCreationState.SOURCE_SELECTED || !currentState.sourceElement) {
      this.setConnectionError('Debe seleccionar primero un elemento origen');
      return;
    }
    
    if (currentState.sourceElement.id === element.id) {
      this.setConnectionError('El origen y destino no pueden ser el mismo elemento');
      return;
    }
    
    if (!this.isValidConnectionEndpoint(element)) {
      this.setConnectionError('El elemento seleccionado no puede ser usado como destino de conexión');
      return;
    }
    
    if (!this.areElementsCompatible(currentState.sourceElement, element)) {
      this.setConnectionError('Los elementos seleccionados no son compatibles para conexión');
      return;
    }
    
    this.connectionInProgressSubject.next({
      ...currentState,
      targetElement: element,
      state: ConnectionCreationState.TARGET_SELECTED
    });
    this.logger.debug(`Elemento destino seleccionado: ${element.id}`);
  }
  
  /**
   * Finaliza y crea la conexión actual
   * @returns La conexión creada o undefined si hubo un error
   */
  async finishConnection(): Promise<NetworkConnection | undefined> {
    const currentState = this.connectionInProgressSubject.value;
    
    if (
      currentState.state !== ConnectionCreationState.TARGET_SELECTED || 
      !currentState.sourceElement || 
      !currentState.targetElement
    ) {
      this.setConnectionError('No hay una conexión válida en progreso');
      return undefined;
    }
    
    try {
      // Verificar que los elementos tienen IDs
      const sourceId = currentState.sourceElement.id;
      const targetId = currentState.targetElement.id;
      
      if (!sourceId || !targetId) {
        this.setConnectionError('Los elementos de origen o destino no tienen IDs');
        return undefined;
      }
      
      // Crear la nueva conexión
      const newConnection: NetworkConnection = {
        id: `conn-${Date.now()}`,
        name: `Conexión ${sourceId}-${targetId}`,
        sourceElementId: sourceId,
        targetElementId: targetId,
        status: ConnectionStatus.ACTIVE,
        type: this.determineConnectionType(currentState.sourceElement, currentState.targetElement) as ConnectionType
      };
      
      // Añadir información adicional si está disponible
      if (currentState.sourceElement.type === ElementType.OLT && currentState.targetElement.type === ElementType.ONT) {
        newConnection.name = `OLT-ONT-${Date.now()}`;
        newConnection.description = `Conexión entre ${currentState.sourceElement.name} y ${currentState.targetElement.name}`;
      }
      
      // Añadir la conexión al estado local
      this.connections = [...this.connections, newConnection];
      this.connectionsSubject.next(this.connections);
      
      // Limpiar el estado de creación
      this.resetConnectionCreation();
      
      this.logger.debug(`Conexión creada: ${newConnection.id}`);
      return newConnection;
      
    } catch (error) {
      this.logger.error('Error al crear la conexión', error);
      this.setConnectionError('Error al crear la conexión');
      return undefined;
    }
  }
  
  /**
   * Cancela la creación de conexión actual
   */
  cancelConnectionCreation(): void {
    this.resetConnectionCreation();
    this.logger.debug('Creación de conexión cancelada');
  }
  
  /**
   * Actualiza una conexión existente
   * @param connectionId ID de la conexión a actualizar
   * @param updates Cambios a aplicar
   */
  updateConnection(connectionId: string, updates: Partial<NetworkConnection>): void {
    const connectionIndex = this.connections.findIndex(conn => conn.id === connectionId);
    
    if (connectionIndex === -1) {
      this.logger.warn(`Conexión no encontrada: ${connectionId}`);
      return;
    }
    
    // Actualizar la conexión
    this.connections = [
      ...this.connections.slice(0, connectionIndex),
      { ...this.connections[connectionIndex], ...updates },
      ...this.connections.slice(connectionIndex + 1)
    ];
    
    this.connectionsSubject.next(this.connections);
    this.logger.debug(`Conexión actualizada: ${connectionId}`);
  }
  
  /**
   * Elimina una conexión
   * @param connectionId ID de la conexión a eliminar
   */
  deleteConnection(connectionId: string): void {
    const connectionIndex = this.connections.findIndex(conn => conn.id === connectionId);
    
    if (connectionIndex === -1) {
      this.logger.warn(`Conexión no encontrada: ${connectionId}`);
      return;
    }
    
    // Eliminar la conexión
    this.connections = [
      ...this.connections.slice(0, connectionIndex),
      ...this.connections.slice(connectionIndex + 1)
    ];
    
    this.connectionsSubject.next(this.connections);
    this.logger.debug(`Conexión eliminada: ${connectionId}`);
  }
  
  /**
   * Verifica si un elemento puede ser un extremo de conexión
   * @param element Elemento a verificar
   */
  private isValidConnectionEndpoint(element: NetworkElement): boolean {
    // Verificar si el elemento es válido para conexiones
    const validTypes = [
      ElementType.OLT,
      ElementType.ONT,
      ElementType.ODF,
      ElementType.SPLITTER,
      ElementType.MANGA,
      ElementType.FDP,
      ElementType.TERMINAL_BOX
    ];
    
    return validTypes.includes(element.type);
  }
  
  /**
   * Verifica si dos elementos son compatibles para una conexión
   * @param source Elemento origen
   * @param target Elemento destino
   */
  private areElementsCompatible(source: NetworkElement, target: NetworkElement): boolean {
    // Reglas de compatibilidad para conexiones
    const compatibilityRules: Record<string, ElementType[]> = {
      [ElementType.OLT]: [ElementType.ODF, ElementType.SPLITTER],
      [ElementType.ODF]: [ElementType.OLT, ElementType.SPLITTER, ElementType.MANGA, ElementType.FDP],
      [ElementType.SPLITTER]: [ElementType.OLT, ElementType.ODF, ElementType.FDP, ElementType.TERMINAL_BOX, ElementType.SPLITTER],
      [ElementType.MANGA]: [ElementType.ODF, ElementType.FDP, ElementType.TERMINAL_BOX],
      [ElementType.FDP]: [ElementType.ODF, ElementType.SPLITTER, ElementType.MANGA, ElementType.TERMINAL_BOX],
      [ElementType.TERMINAL_BOX]: [ElementType.SPLITTER, ElementType.MANGA, ElementType.FDP, ElementType.ONT],
      [ElementType.ONT]: [ElementType.TERMINAL_BOX]
    };
    
    // Verificar compatibilidad
    return compatibilityRules[source.type]?.includes(target.type) || 
           compatibilityRules[target.type]?.includes(source.type) || 
           false;
  }
  
  /**
   * Determina el tipo de conexión basado en los elementos conectados
   * @param source Elemento origen
   * @param target Elemento destino
   */
  private determineConnectionType(source: NetworkElement, target: NetworkElement): string {
    // Determinar el tipo de conexión según los elementos
    if (
      (source.type === ElementType.OLT && target.type === ElementType.ODF) ||
      (target.type === ElementType.OLT && source.type === ElementType.ODF)
    ) {
      return 'OLT-ODF';
    }
    
    if (
      (source.type === ElementType.ODF && target.type === ElementType.SPLITTER) ||
      (target.type === ElementType.ODF && source.type === ElementType.SPLITTER)
    ) {
      return 'ODF-SPLITTER';
    }
    
    if (
      (source.type === ElementType.SPLITTER && target.type === ElementType.TERMINAL_BOX) ||
      (target.type === ElementType.SPLITTER && source.type === ElementType.TERMINAL_BOX)
    ) {
      return 'SPLITTER-TERMINAL';
    }
    
    if (
      (source.type === ElementType.TERMINAL_BOX && target.type === ElementType.ONT) ||
      (target.type === ElementType.TERMINAL_BOX && source.type === ElementType.ONT)
    ) {
      return 'TERMINAL-ONT';
    }
    
    // Para otros casos, usar un tipo genérico
    return 'FIBER';
  }
  
  /**
   * Establece un error en el estado de creación de conexión
   * @param errorMessage Mensaje de error
   */
  private setConnectionError(errorMessage: string): void {
    this.connectionInProgressSubject.next({
      state: ConnectionCreationState.FAILED,
      error: errorMessage
    });
    this.logger.warn(`Error en creación de conexión: ${errorMessage}`);
    
    // Resetear después de un tiempo
    setTimeout(() => this.resetConnectionCreation(), 3000);
  }
  
  /**
   * Resetea el estado de creación de conexión
   */
  private resetConnectionCreation(): void {
    this.connectionInProgressSubject.next({
      state: ConnectionCreationState.IDLE
    });
  }

  /**
   * Crea una nueva conexión entre elementos
   */
  createConnection(currentState: ConnectionState): Observable<NetworkConnection> {
    // Validar que los elementos origen y destino existen
    if (!currentState.sourceElement || !currentState.targetElement) {
      return throwError(() => new Error('Elementos de origen o destino no definidos'));
    }

    // Validar que los elementos tienen IDs
    if (!currentState.sourceElement.id || !currentState.targetElement.id) {
      return throwError(() => new Error('Los elementos de origen o destino no tienen IDs'));
    }
    
    // Crear el objeto de conexión
    const newConnection: NetworkConnection = {
      id: `conn-${Date.now()}`,
      name: currentState.name || `Conexión ${currentState.sourceElement.name} a ${currentState.targetElement.name}`,
      sourceElementId: currentState.sourceElement.id,
      targetElementId: currentState.targetElement.id,
      status: ConnectionStatus.ACTIVE,
      type: this.determineConnectionType(currentState.sourceElement, currentState.targetElement) as ConnectionType,
      properties: {}
    };
    
    // Si hay puntos de ruta, añadirlos
    if (currentState.waypoints && currentState.waypoints.length > 0) {
      newConnection.points = currentState.waypoints;
    }
    
    // Guardar la conexión
    this.logger.debug('Creando nueva conexión:', newConnection);
    
    // Si estamos en modo mock (useMocks es true), crear localmente
    if (environment.useMocks) {
      // Generar un ID único
      newConnection.id = `conn-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      newConnection.createdAt = new Date();
      
      // Añadir la conexión a la lista local
      this.addConnectionToLocalList(newConnection);
      
      // Devolver un observable con la conexión
      return of(newConnection).pipe(
        delay(300), // Simular latencia de red
        tap(() => this.logger.debug('Conexión creada localmente:', newConnection))
      );
    }
    
    // Si no estamos en modo mock, pero no hay implementación para API, usar modo mock
    return of(newConnection).pipe(
      delay(300),
      tap(() => this.logger.debug('Conexión simulada:', newConnection))
    );
  }
  
  /**
   * Añade una conexión a la lista local
   */
  private addConnectionToLocalList(connection: NetworkConnection): void {
    // Añadir la conexión a la lista local
    this.connections = [...this.connections, connection];
    
    // Notificar el cambio
    this.connectionsSubject.next(this.connections);
  }
} 
