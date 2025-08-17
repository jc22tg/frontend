import { Observable } from 'rxjs';
import { ElementStatus, ElementType, NetworkConnection } from '../../../shared/types/network.types';
import { FiberConnection as DetailedFiberConnection } from '../../../shared/models/fiber-connection.model';

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

  /**
   * Obtiene los detalles completos de una conexión de fibra por su ID de detalle.
   * (Este ID sería el detailedFiberConnectionId de NetworkConnection)
   */
  getDetailedFiberConnectionById(detailedFiberId: string): Observable<DetailedFiberConnection | null>;

  /**
   * Actualiza los detalles de una conexión de fibra existente.
   * @param details Los detalles completos de la conexión de fibra a actualizar.
   * @returns Un Observable con la conexión de fibra actualizada o null si no se encontró.
   */
  updateDetailedFiberConnection(details: DetailedFiberConnection): Observable<DetailedFiberConnection | null>;

  /**
   * Crea una nueva entrada de detalles para una conexión de fibra.
   * @param details Los detalles completos de la conexión de fibra a crear.
   * @returns Un Observable con la conexión de fibra detallada creada o null si falla.
   */
  createDetailedFiberConnection(details: DetailedFiberConnection): Observable<DetailedFiberConnection | null>;
} 
