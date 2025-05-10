import { Observable } from 'rxjs';
import { ElementStatus, ElementType, NetworkConnection } from '../../../shared/types/network.types';

/**
 * Interfaz para el servicio de conexiones de red
 */
export interface IConnectionService {
  /**
   * Obtiene todas las conexiones
   */
  getConnections(): Observable<NetworkConnection[]>;

  /**
   * Obtiene una conexión por su ID
   */
  getConnectionById(id: string): Observable<NetworkConnection | null>;

  /**
   * Obtiene las conexiones relacionadas con un elemento específico
   */
  getConnectionsByElementId(elementId: string): Observable<NetworkConnection[]>;

  /**
   * Obtiene la conexión seleccionada actualmente
   */
  getSelectedConnection(): Observable<NetworkConnection | null>;

  /**
   * Selecciona una conexión
   */
  selectConnection(connection: NetworkConnection | null): void;

  /**
   * Añade una nueva conexión
   */
  addConnection(connection: NetworkConnection): Observable<NetworkConnection>;

  /**
   * Actualiza una conexión existente
   */
  updateConnection(connection: NetworkConnection): Observable<NetworkConnection>;

  /**
   * Elimina una conexión por su ID
   */
  removeConnection(connectionId: string): Observable<boolean>;

  /**
   * Filtra conexiones según criterios específicos
   */
  filterConnections(criteria: any): Observable<NetworkConnection[]>;
} 