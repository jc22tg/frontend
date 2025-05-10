import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { map, catchError, tap, delay } from 'rxjs/operators';
import { NetworkElement, ElementType, ElementStatus, NetworkConnection, FiberType } from '../../../shared/types/network.types';
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
    if (environment.useMocks) {
      // Usar datos mock si está habilitado en environment
      console.log('Usando datos mock para conexiones');
      setTimeout(() => {
        this.connectionsSubject.next(this.getMockConnections());
      }, environment.mockDelay || 500);
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
        conn => conn.sourceId === elementId || conn.targetId === elementId
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
    const sourceIdMatch = connection.sourceId?.toLowerCase().includes(term) || false;
    const targetIdMatch = connection.targetId?.toLowerCase().includes(term) || false;
    const idMatch = connection.id?.toLowerCase().includes(term) || false;
    const labelMatch = connection.label?.toLowerCase().includes(term) || false;
    const descMatch = connection.description?.toLowerCase().includes(term) || false;
    
    return idMatch || sourceIdMatch || targetIdMatch || labelMatch || descMatch;
  }

  /**
   * Genera conexiones simuladas para desarrollo
   * @returns Array de conexiones simuladas
   */
  private getMockConnections(): NetworkConnection[] {
    return [
      {
        id: 'conn-001',
        sourceId: 'olt-001',
        targetId: 'fdp-001',
        status: ElementStatus.ACTIVE,
        type: 'fiber',
        length: 1200,
        capacity: 10,
        label: 'Conexión OLT-FDP Principal'
      },
      {
        id: 'conn-002',
        sourceId: 'fdp-001',
        targetId: 'splitter-001',
        status: ElementStatus.ACTIVE,
        type: 'fiber',
        length: 300,
        capacity: 10,
        label: 'Conexión FDP-Splitter'
      },
      {
        id: 'conn-003',
        sourceId: 'splitter-001',
        targetId: 'ont-001',
        status: ElementStatus.ACTIVE,
        type: 'fiber',
        length: 150,
        capacity: 1,
        label: 'Conexión Splitter-ONT'
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
    
    const sourceId = connection.sourceId;
    const targetId = connection.targetId;
    
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
          active: connections.filter(c => c.status === ElementStatus.ACTIVE).length,
          inactive: connections.filter(c => c.status === ElementStatus.INACTIVE).length,
          warning: connections.filter(c => c.status === ElementStatus.WARNING).length,
          error: connections.filter(c => c.status === ElementStatus.CRITICAL).length
        };
        return stats;
      })
    );
  }
} 