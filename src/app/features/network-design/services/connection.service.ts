import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { map, catchError, tap, delay } from 'rxjs/operators';
import { NetworkElement, ElementType, ElementStatus, NetworkConnection, ConnectionStatus, ConnectionType } from '../../../shared/types/network.types';
import {
  FiberConnection as DetailedFiberConnection,
  FiberType,
  FiberUsageType,
  ConnectorType,
  PolishingType,
  FiberStandard
} from '../../../shared/models/fiber-connection.model';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { IConnectionService } from '../interfaces';
import { LocalStorageService } from '../../../core/services/local-storage.service';

/**
 * Servicio para gestionar las conexiones de red
 */
@Injectable({
  providedIn: 'root'
})
export class ConnectionService implements IConnectionService {
  private connectionsSubject = new BehaviorSubject<NetworkConnection[]>([]);
  public connections$ = this.connectionsSubject.asObservable();
  private selectedConnectionSubject = new BehaviorSubject<NetworkConnection | null>(null);

  // URL base para las API de conexiones
  private apiUrl = `${environment.apiUrl}/connections`;

  // Lista mock para DetailedFiberConnection, ahora como propiedad de clase
  private mockDetailedFiberConnections: DetailedFiberConnection[] = [
    {
      id: 'dfc-001',
      name: 'Fibra Detallada OLT-001 a FDP-001',
      description: 'Detalles específicos de la fibra entre OLT Principal y FDP Primario.',
      usageType: FiberUsageType.BACKBONE,
      fiberType: FiberType.SINGLE_MODE,
      connectorType: ConnectorType.SC,
      polishingType: PolishingType.APC,
      standard: FiberStandard.ITU_T_G_652,
      insertionLoss: 0.5,
      returnLoss: 50,
      wavelength: 1310,
      bandwidth: 1000,
      coreDiameter: 9,
      claddingDiameter: 125,
      outerDiameter: 3,
      operatingTemperature: { min: -40, max: 85 },
      tensileStrength: 100,
      manufacturer: 'Corning',
      modelNumber: 'SMF-28e+',
      manufacturingDate: new Date('2022-01-15'),
      certifications: ['ISO 9001', 'RoHS'],
      strands: { total: 12, available: 8, inUse: 4, reserved: 0, damaged: 0 },
      strandConfiguration: {
        totalStrands: 12,
        strandsPerTube: 6,
        tubesPerCable: 2,
        bufferTubes: 2,
        centralStrengthMember: true
      },
      networkInfo: {
        networkSegment: 'Core Ring A',
        networkLevel: 'Backbone',
        redundancy: true,
        backupPath: 'dfc-001-backup',
        maxDistance: 20000, // 20km
        distanceMetrics: {
          totalLength: 150.5, // en metros
          splicePoints: 2,
          maxSpliceLoss: 0.1,
          totalLoss: 0.7
        }
      }
    },
    {
      id: 'dfc-002',
      name: 'Fibra Detallada FDP-001 a SPL-001',
      description: 'Segmento de fibra desde FDP Primario hasta el primer nivel de splitters.',
      usageType: FiberUsageType.DISTRIBUTION,
      fiberType: FiberType.SINGLE_MODE,
      connectorType: ConnectorType.LC,
      polishingType: PolishingType.UPC,
      standard: FiberStandard.ITU_T_G_657,
      insertionLoss: 0.3,
      returnLoss: 45,
      wavelength: 1550,
      bandwidth: 2000,
      coreDiameter: 9,
      claddingDiameter: 125,
      outerDiameter: 2,
      operatingTemperature: { min: -20, max: 70 },
      tensileStrength: 80,
      manufacturer: 'Prysmian',
      modelNumber: 'Draka UC CONQUEROR',
      manufacturingDate: new Date('2022-05-20'),
      certifications: ['ISO 9001'],
      strands: { total: 24, available: 20, inUse: 4, reserved: 0, damaged: 0 },
      strandConfiguration: {
        totalStrands: 24,
        strandsPerTube: 12,
        tubesPerCable: 2,
        bufferTubes: 2,
        centralStrengthMember: true
      },
      networkInfo: {
        networkSegment: 'Distribution Area 1',
        networkLevel: 'Distribution',
        redundancy: false,
        maxDistance: 5000, // 5km
        distanceMetrics: {
          totalLength: 80.0, // en metros
          splicePoints: 1,
          maxSpliceLoss: 0.05,
          totalLoss: 0.35
        }
      }
    }
  ];

  constructor(
    private http: HttpClient,
    private localStorageService: LocalStorageService
  ) {
    this.loadInitialConnections();
  }

  /**
   * Carga las conexiones iniciales del servicio
   */
  private loadInitialConnections(): void {
    if (environment.featureFlags.enableMockData) {
      // Usar datos mock si está habilitado en environment
      console.log('Usando datos mock para conexiones');
      setTimeout(() => {
        this.connectionsSubject.next(this.getMockConnections());
      }, 500);
      return;
    }

    // Intentar obtener desde API
    console.log('Obteniendo conexiones desde API');
    this.http.get<NetworkConnection[]>(this.apiUrl).pipe(
      catchError(error => {
        console.error('Error al cargar conexiones desde API:', error);
        // Fallback a datos mock
        console.log('Usando datos mock por error de conexión');
        return of(this.getMockConnections());
      })
    ).subscribe({
      next: (connections) => {
        console.log(`Conexiones cargadas: ${connections.length}`);
        this.connectionsSubject.next(connections);
      },
      error: (error) => {
        console.error('Error en la suscripción:', error);
        // Último recurso si hay error en la suscripción
        this.connectionsSubject.next(this.getMockConnections());
      }
    });
  }

  /**
   * Obtiene todas las conexiones
   * @returns Observable con todas las conexiones
   */
  getConnections(): Observable<NetworkConnection[]> {
    return this.connectionsSubject.asObservable();
  }

  /**
   * Obtiene la conexión seleccionada actualmente
   * @returns Observable con la conexión seleccionada o null
   */
  getSelectedConnection(): Observable<NetworkConnection | null> {
    return this.selectedConnectionSubject.asObservable();
  }

  /**
   * Selecciona una conexión
   * @param connection La conexión a seleccionar, o null para deseleccionar
   */
  selectConnection(connection: NetworkConnection | null): void {
    this.selectedConnectionSubject.next(connection);
  }

  /**
   * Busca una conexión por su ID
   * @param id ID de la conexión
   * @returns Observable con la conexión encontrada o null
   */
  getConnectionById(id: string): Observable<NetworkConnection | null> {
    return this.connectionsSubject.pipe(
      map(connections => connections.find(conn => conn.id === id) || null)
    );
  }

  /**
   * Obtiene las conexiones de un elemento específico
   * @param elementId ID del elemento
   * @returns Observable con las conexiones del elemento
   */
  getConnectionsByElementId(elementId: string): Observable<NetworkConnection[]> {
    return this.connectionsSubject.pipe(
      map(connections => connections.filter(
        conn => conn.sourceElementId === elementId || conn.targetElementId === elementId
      ))
    );
  }

  /**
   * Añade una nueva conexión
   * @param connection La conexión a añadir
   * @returns Observable con la conexión añadida
   */
  addConnection(connection: NetworkConnection): Observable<NetworkConnection> {
    // En producción, llamaríamos a la API
    // return this.http.post<NetworkConnection>(this.apiUrl, connection);
    
    // Para desarrollo, simulamos la respuesta
    const newConnection = {
      ...connection,
      id: connection.id || `conn-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const currentConnections = this.connectionsSubject.value;
    this.connectionsSubject.next([...currentConnections, newConnection]);
    
    return of(newConnection);
  }

  /**
   * Crea una nueva conexión (alias para addConnection para mantener consistencia con la nomenclatura)
   * @param connection La conexión a crear
   * @returns Observable con la conexión creada
   */
  createConnection(connection: NetworkConnection): Observable<NetworkConnection> {
    return this.addConnection(connection);
  }

  /**
   * Actualiza una conexión existente
   * @param connection La conexión con los datos actualizados
   * @returns Observable con la conexión actualizada
   */
  updateConnection(connection: NetworkConnection): Observable<NetworkConnection> {
    // En producción, llamaríamos a la API
    // return this.http.put<NetworkConnection>(`${this.apiUrl}/${connection.id}`, connection);
    
    // Para desarrollo, simulamos la respuesta
    const updatedConnection = {
      ...connection,
      updatedAt: new Date()
    };
    
    const currentConnections = this.connectionsSubject.value;
    const index = currentConnections.findIndex(c => c.id === connection.id);
    
    if (index !== -1) {
      const updatedConnections = [...currentConnections];
      updatedConnections[index] = updatedConnection;
      this.connectionsSubject.next(updatedConnections);
    }
    
    return of(updatedConnection);
  }

  /**
   * Elimina una conexión
   * @param connectionId ID de la conexión a eliminar
   * @returns Observable que indica si se completó la eliminación
   */
  removeConnection(connectionId: string): Observable<boolean> {
    // En producción, llamaríamos a la API
    // return this.http.delete<boolean>(`${this.apiUrl}/${connectionId}`);
    
    // Para desarrollo, simulamos la respuesta
    const currentConnections = this.connectionsSubject.value;
    const connectionExists = currentConnections.some(c => c.id === connectionId);
    
    if (connectionExists) {
      this.connectionsSubject.next(
        currentConnections.filter(c => c.id !== connectionId)
      );
      
      // Si la conexión eliminada estaba seleccionada, deseleccionamos
      const selectedConnection = this.selectedConnectionSubject.value;
      if (selectedConnection && selectedConnection.id === connectionId) {
        this.selectedConnectionSubject.next(null);
      }
      
      return of(true);
    }
    
    return of(false);
  }

  /**
   * Filtra las conexiones por criterios
   * @param criteria Criterios de filtrado
   * @returns Observable con las conexiones filtradas
   */
  filterConnections(criteria: any): Observable<NetworkConnection[]> {
    return this.connectionsSubject.pipe(
      map(connections => {
        return connections.filter(conn => {
          let match = true;
          
          if (criteria.status && conn.status !== criteria.status) {
            match = false;
          }
          
          if (criteria.search && !this.matchesSearch(conn, criteria.search)) {
            match = false;
          }
          
          return match;
        });
      })
    );
  }

  /**
   * Verifica si una conexión coincide con un término de búsqueda
   * @param connection La conexión a verificar
   * @param searchTerm El término de búsqueda
   * @returns true si la conexión coincide con el término de búsqueda
   */
  private matchesSearch(connection: NetworkConnection, searchTerm: string): boolean {
    if (!connection) return false;
    const term = searchTerm.toLowerCase();
    const sourceIdMatch = connection.sourceElementId?.toLowerCase().includes(term) || false;
    const targetIdMatch = connection.targetElementId?.toLowerCase().includes(term) || false;
    const idMatch = connection.id?.toLowerCase().includes(term) || false;
    return idMatch || sourceIdMatch || targetIdMatch;
  }

  /**
   * Obtiene los detalles completos de una conexión de fibra por su ID de detalle.
   * (Este ID sería el detailedFiberConnectionId de NetworkConnection)
   * TODO: Implementar la llamada HTTP real al backend.
   */
  getDetailedFiberConnectionById(detailedFiberId: string): Observable<DetailedFiberConnection | null> {
    const foundDetail = this.mockDetailedFiberConnections.find(detail => detail.id === detailedFiberId);
    if (foundDetail) {
      return of(foundDetail).pipe(delay(300)); // Simular delay de API
    }
    return of(null).pipe(delay(300));
  }

  updateDetailedFiberConnection(details: DetailedFiberConnection): Observable<DetailedFiberConnection | null> {
    const index = this.mockDetailedFiberConnections.findIndex(dfc => dfc.id === details.id);
    if (index !== -1) {
      this.mockDetailedFiberConnections[index] = {
        ...this.mockDetailedFiberConnections[index],
        ...details,
      };
      return of(this.mockDetailedFiberConnections[index]).pipe(delay(300));
    }
    return of(null).pipe(delay(300));
  }

  createDetailedFiberConnection(details: DetailedFiberConnection): Observable<DetailedFiberConnection | null> {
    // En una implementación real, aseguraríamos que el ID no colisione o que el backend lo genere.
    // Por ahora, asumimos que el ID ya viene en 'details'.
    const existing = this.mockDetailedFiberConnections.find(dfc => dfc.id === details.id);
    if (existing) {
      console.warn(`DetailedFiberConnection con ID ${details.id} ya existe. No se creará uno nuevo.`);
      return of(null).pipe(delay(100)); // Simular fallo o conflicto
    }

    // Clonar el objeto para evitar mutaciones no deseadas del objeto original pasado como argumento
    const newDetailedConnection = { ...details };
    // Podríamos añadir createdAt/updatedAt si el modelo los tuviera.
    // newDetailedConnection.createdAt = new Date();
    // newDetailedConnection.updatedAt = new Date();

    this.mockDetailedFiberConnections.push(newDetailedConnection);
    console.log('[ConnectionService] Mock DetailedFiberConnection creado:', newDetailedConnection);
    return of(newDetailedConnection).pipe(delay(300)); // Simular delay de API
  }

  /**
   * Genera conexiones simuladas para desarrollo
   * @returns Array de conexiones simuladas
   */
  private getMockConnections(): NetworkConnection[] {
    return [
      {
        id: 'conn-001',
        name: 'Conexión OLT-FDP Principal',
        sourceElementId: 'olt-001',
        targetElementId: 'fdp-001',
        status: ConnectionStatus.ACTIVE,
        type: ConnectionType.FIBER,
        detailedFiberConnectionId: 'dfc-001'
      },
      {
        id: 'conn-002',
        name: 'Conexión FDP-Splitter',
        sourceElementId: 'fdp-001',
        targetElementId: 'splitter-001',
        status: ConnectionStatus.ACTIVE,
        type: ConnectionType.FIBER,
        detailedFiberConnectionId: 'dfc-002'
      },
      {
        id: 'conn-003',
        name: 'Conexión Splitter-ONT',
        sourceElementId: 'splitter-001',
        targetElementId: 'ont-001',
        status: ConnectionStatus.ACTIVE,
        type: ConnectionType.FIBER,
        detailedFiberConnectionId: 'dfc-003'
      },
      {
        id: 'conn-004',
        name: 'Conexión Lógica RouterA-RouterB',
        sourceElementId: 'router-A',
        targetElementId: 'router-B',
        status: ConnectionStatus.ACTIVE,
        type: ConnectionType.LOGICAL
      }
    ];
  }

  /**
   * Valida una conexión
   * @param connection Conexión a validar
   * @returns true si la conexión es válida
   */
  validateConnection(connection: NetworkConnection): boolean {
    if (!connection) return false;
    
    const sourceId = connection.sourceElementId;
    const targetId = connection.targetElementId;
    
    // Validación básica de IDs
    if (!sourceId || !targetId) {
      return false;
    }
    
    // Evitar conexiones a sí mismo
    if (sourceId === targetId) {
      return false;
    }
    
    return true;
  }
  
  /**
   * Elimina una conexión (alias para removeConnection, mantenido por compatibilidad)
   * @param connectionId ID de la conexión a eliminar
   */
  deleteConnection(connectionId: string): void {
    this.removeConnection(connectionId).subscribe();
  }
  
  /**
   * Exporta las conexiones (mantenido por compatibilidad)
   */
  exportConnections(): void {
    console.log('Exportación de conexiones no implementada');
  }
  
  /**
   * Limpia todas las conexiones (mantenido por compatibilidad)
   */
  clearConnections(): void {
    this.connectionsSubject.next([]);
    this.selectedConnectionSubject.next(null);
  }

  /**
   * Obtiene estadísticas de las conexiones
   * @returns Observable con estadísticas de las conexiones
   */
  getConnectionsStats(): Observable<any> {
    return this.connectionsSubject.pipe(
      map(connections => {
        const stats = {
          total: connections.length,
          active: connections.filter(c => c.status === 'ACTIVE').length,
          inactive: connections.filter(c => c.status === 'INACTIVE').length,
          degraded: connections.filter(c => c.status === 'DEGRADED').length,
          failed: connections.filter(c => c.status === 'FAILED').length,
          planned: connections.filter(c => c.status === 'PLANNED').length
        };
        return stats;
      })
    );
  }
} 
