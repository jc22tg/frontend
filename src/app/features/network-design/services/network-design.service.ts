/**
 * Servicio para el diseño y gestión de la red de fibra óptica
 * 
 * Este servicio proporciona funcionalidades específicas para el diseño de red,
 * incluyendo la gestión de elementos, validación de posiciones y cálculos de distancias.
 *
 * @example
 * ```typescript
 * // Obtener elementos por tipo
 * this.networkDesignService.getElementsByType(ElementType.ODF)
 *   .subscribe(elements => console.log(elements));
 *
 * // Validar posición
 * const isValid = this.networkDesignService.validatePosition({ lat: 19.5, lng: -70.5 });
 * ```
 */
import { Injectable, inject } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { map, mergeMap, toArray, catchError } from 'rxjs/operators';
import {
  NetworkElement,
  CustomLayer,
  ElementType,
  ElementStatus,
  MonitoringData,
  NetworkAlert,
  MaintenanceSchedule,
  Attachment,
  NetworkConnection,
  ElementHistoryEntry
} from '../../../shared/types/network.types';
import { NetworkService } from '../../../core/services/network.service';
import { NetworkMonitoringService } from './network-monitoring.service';
import { AttachmentService } from './attachment.service';
import { ProjectService } from '@core/services/project.service';
import { Project, ProjectStatus } from '../../../interfaces/project.interface';
import { Client, ClientType } from '../../../shared/types/network.types';
import { HttpClient } from '@angular/common/http';
import { LoggerService } from '../../../core/services/logger.service';
import { environment } from '../../../../environments/environment';
import { GeographicPosition } from '../../../shared/types/geo-position';
import { 
  ConnectionType,
  ConnectionStatus
} from '../../../shared/types/network.types';
import { 
  FiberConnection as FiberConnectionModel,
  FiberUsageType as FiberConnectionModelUsageType,
  FiberType as FiberConnectionModelFiberType,
  ConnectorType as FiberConnectionModelConnectorType,
  PolishingType as FiberConnectionModelPolishingType,
  FiberStandard as FiberConnectionModelFiberStandard 
} from '../../../shared/models/fiber-connection.model';
import { PaginatedResponse, QueryParams } from '../../../shared/types/api.types';

@Injectable({
  providedIn: 'root'
})
export class NetworkDesignService {
  private readonly apiUrl = environment.apiUrl;

  private networkService = inject(NetworkService);
  private monitoringService = inject(NetworkMonitoringService);
  private attachmentService = inject(AttachmentService);
  private projectService = inject(ProjectService);
  private http = inject(HttpClient);
  private logger = inject(LoggerService);

  /**
   * Obtiene todos los elementos de red de un tipo específico
   * 
   * @param type Tipo de elemento a obtener (ODF, OLT, ONT, etc.)
   * @param params QueryParams para filtrar y paginar los resultados
   * @returns Observable con los elementos encontrados
   * @throws Error si el tipo de elemento no es válido
   *
   * @example
   * ```typescript
   * this.networkDesignService.getElementsByType(ElementType.ODF)
   *   .subscribe(elements => this.odfs = elements);
   * ```
   */
  getElementsByType(
    type: ElementType,
    params?: QueryParams
  ): Observable<PaginatedResponse<NetworkElement>> {
    return this.networkService.getElementsByType(type, params);
  }

  /**
   * Actualiza el estado de un elemento de red
   * 
   * @param elementId ID del elemento a actualizar
   * @param status Nuevo estado del elemento (ACTIVE, MAINTENANCE, FAILURE)
   * @returns Observable con el elemento actualizado
   * @throws Error si el elemento no existe o el estado no es válido
   *
   * @example
   * ```typescript
   * this.networkDesignService.updateElementStatus(123, ElementStatus.ACTIVE)
   *   .subscribe(updatedElement => console.log(updatedElement));
   * ```
   */
  updateElementStatus(
    elementId: string | undefined,
    status: ElementStatus
  ): Observable<NetworkElement> {
    if (!elementId) {
      throw new Error('ID de elemento no definido');
    }
    return this.networkService.updateElementStatus(elementId, status);
  }

  /**
   * Valida la posición de un elemento en el mapa
   * 
   * @param position Objeto con coordenadas a validar (GeographicPosition o ExtendedPosition)
   * @returns true si la posición está dentro de los límites de RD, false en caso contrario
   *
   * @example
   * ```typescript
   * const position = { lat: 19.5, lng: -70.5 };
   * if (this.networkDesignService.validatePosition(position)) {
   *   // Posición válida
   * }
   * ```
   */
  validatePosition(position: GeographicPosition): boolean {
    if (!position || !position.coordinates || position.coordinates.length !== 2) {
      return false;
    }
    
    // Para GeographicPosition estándar
    // Validar que las coordenadas estén dentro de los límites de la República Dominicana
    const longitude = position.coordinates[0];
    const latitude = position.coordinates[1];

    return (
      latitude >= 17.5 &&
      latitude <= 19.9 &&
      longitude >= -72.0 &&
      longitude <= -68.3
    );
  }

  /**
   * Calcula la distancia entre dos elementos en kilómetros
   * 
   * @param element1 Primer elemento de red
   * @param element2 Segundo elemento de red
   * @returns Distancia en kilómetros usando la fórmula de Haversine
   *
   * @example
   * ```typescript
   * const distance = this.networkDesignService.calculateDistance(element1, element2);
   * console.log(`Distancia: ${distance} km`);
   * ```
   */
  calculateDistance(
    element1: NetworkElement,
    element2: NetworkElement
  ): number {
    const R = 6371; // Radio de la Tierra en km
    
    // Acceder directamente a las coordenadas
    const lat1 = element1.position.coordinates[1];
    const lng1 = element1.position.coordinates[0];
    const lat2 = element2.position.coordinates[1];
    const lng2 = element2.position.coordinates[0];
    
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lng2 - lng1);
    
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2));
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Convierte grados a radianes
   * 
   * @param degrees Ángulo en grados
   * @returns Ángulo en radianes
   * @private
   */
  private toRad(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }

  /**
   * Obtiene datos de monitoreo para un elemento específico
   * 
   * @param elementId ID del elemento
   * @param elementType Tipo del elemento
   * @returns Observable con los datos de monitoreo
   * @throws Error si el ID de elemento no está definido
   */
  getMonitoringData(elementId: string | undefined, elementType: ElementType): Observable<MonitoringData> {
    if (!elementId) {
      throw new Error('ID de elemento no definido');
    }
    return this.monitoringService.getMonitoringData(elementId, elementType);
  }

  /**
   * Obtiene alertas de la red filtradas por criterios
   * 
   * @param severity Nivel de severidad de las alertas (crítica, advertencia, informativa)
   * @param resolved Indica si las alertas están resueltas
   * @returns Observable con las alertas de red
   */
  getNetworkAlerts(
    severity?: 'critical' | 'warning' | 'info',
    resolved?: boolean
  ): Observable<NetworkAlert[]> {
    return this.monitoringService.getNetworkAlerts(severity, resolved);
  }

  /**
   * Marca una alerta como resuelta
   * 
   * @param alertId ID de la alerta a resolver
   * @returns Observable con la alerta actualizada
   */
  resolveAlert(alertId: string): Observable<NetworkAlert> {
    return this.monitoringService.resolveAlert(alertId);
  }

  /**
   * Obtiene programaciones de mantenimiento filtradas por estado
   * 
   * @param status Estado de las tareas de mantenimiento
   * @returns Observable con las programaciones
   */
  getMaintenanceSchedules(
    status?: MaintenanceSchedule['status']
  ): Observable<MaintenanceSchedule[]> {
    // Convertir a minúsculas si es string
    const statusParam = typeof status === 'string' ? status.toLowerCase() as any : status;
    return this.monitoringService.getMaintenanceSchedules(statusParam);
  }

  /**
   * Programa una nueva tarea de mantenimiento
   * 
   * @param task Datos de la tarea a programar
   * @returns Observable con la tarea programada
   */
  scheduleMaintenanceTask(task: Omit<MaintenanceSchedule, 'id'>): Observable<MaintenanceSchedule> {
    return this.monitoringService.scheduleMaintenanceTask(task);
  }

  /**
   * Obtiene los adjuntos asociados a una entidad
   * 
   * @param entityType Tipo de entidad (elemento, proyecto, etc.)
   * @param entityId ID de la entidad
   * @returns Observable con los adjuntos
   */
  getAttachments(entityType: string, entityId: string): Observable<Attachment[]> {
    return this.attachmentService.getAttachments(entityType, entityId);
  }

  /**
   * Sube un archivo adjunto asociado a una entidad
   * 
   * @param file Archivo a subir
   * @param entityType Tipo de entidad
   * @param entityId ID de la entidad
   * @param description Descripción del adjunto
   * @returns Observable con el adjunto creado
   */
  uploadAttachment(
    file: File,
    entityType: string,
    entityId: string,
    description: string
  ): Observable<Attachment> {
    return this.attachmentService.uploadAttachment(file, entityType, entityId, description).pipe(
      map(event => {
        if (event.type === 4) { // HttpEventType.Response
          return event.body as Attachment;
        }
        throw new Error('Error en la subida del archivo');
      })
    );
  }

  /**
   * Obtiene los clientes filtrados por tipo
   * 
   * @param type Tipo de cliente
   * @returns Observable con los clientes
   */
  getClients(type?: ClientType): Observable<Client[]> {
    return this.projectService.getClients(type);
  }

  /**
   * Obtiene un cliente por su ID
   * 
   * @param clientId ID del cliente
   * @returns Observable con los datos del cliente
   */
  getClientById(clientId: string): Observable<Client> {
    return this.projectService.getClientById(clientId);
  }

  /**
   * Obtiene proyectos filtrados por estado
   * 
   * @param estado Estado de los proyectos
   * @returns Observable con los proyectos
   */
  getProjects(estado?: ProjectStatus): Observable<Project[]> {
    return this.projectService.getProjects();
  }

  /**
   * Crea un nuevo proyecto
   * 
   * @param project Datos del proyecto a crear
   * @returns Observable con el proyecto creado
   */
  createProject(project: Omit<Project, 'id'>): Observable<Project> {
    return this.projectService.createProject(project);
  }

  /**
   * Actualiza un proyecto existente
   * 
   * @param projectId ID del proyecto
   * @param updates Cambios a aplicar al proyecto
   * @returns Observable con el proyecto actualizado
   */
  updateProject(projectId: number, updates: Partial<Project>): Observable<Project> {
    return this.projectService.updateProject(projectId, updates);
  }

  /**
   * Obtiene todas las conexiones de la red
   * 
   * @returns Observable con las conexiones de red
   */
  getConnections(): Observable<NetworkConnection[]> {
    this.logger.info('NetworkDesignService: Fetching connections.');
    return this.networkService.getConnections().pipe(
      map(fiberConnections => {
        if (!Array.isArray(fiberConnections)) {
          this.logger.error('NetworkDesignService: getConnections response is not an array.', fiberConnections);
          return [];
        }
        return fiberConnections.map(fc => this.mapFiberConnectionModelToNetworkConnection(fc));
      }),
      catchError(err => {
        this.logger.error('Error fetching connections in NetworkDesignService', err);
        return throwError(() => new Error('Failed to fetch connections'));
      })
    );
  }

  /**
   * Crea una nueva conexión de red
   * 
   * @param connection Datos de la conexión a crear
   * @returns Observable con la conexión creada
   */
  createConnection(connection: Omit<NetworkConnection, 'id'>): Observable<NetworkConnection> {
    this.logger.info('NetworkDesignService: Creating connection.', connection);
    const payload = this.mapNetworkConnectionToFiberConnectionPayload(connection);
    this.logger.debug('NetworkDesignService: createConnection payload for networkService:', payload);
    return this.networkService.createConnection(payload).pipe(
      map(createdFiberConnection => {
        this.logger.info('NetworkDesignService: Connection created by networkService, mapping response.', createdFiberConnection);
        return this.mapFiberConnectionModelToNetworkConnection(createdFiberConnection);
      }),
      catchError(err => {
        this.logger.error('Error creating connection in NetworkDesignService', err, { originalInput: connection, mappedPayload: payload });
        return throwError(() => new Error('Failed to create connection'));
      })
    );
  }

  /**
   * Actualiza una conexión existente
   * 
   * @param connectionId ID de la conexión
   * @param updates Cambios a aplicar a la conexión
   * @returns Observable con la conexión actualizada
   */
  updateConnection(connectionId: string, updates: Partial<NetworkConnection>): Observable<NetworkConnection> {
    this.logger.info(`NetworkDesignService: Updating connection ${connectionId}.`, updates);
    const payload = this.mapNetworkConnectionToFiberConnectionPayload(updates);
    this.logger.debug(`NetworkDesignService: updateConnection payload for networkService (id: ${connectionId}):`, payload);
    return this.networkService.updateConnection(connectionId, payload).pipe(
      map(updatedFiberConnection => {
        this.logger.info(`NetworkDesignService: Connection ${connectionId} updated by networkService, mapping response.`, updatedFiberConnection);
        return this.mapFiberConnectionModelToNetworkConnection(updatedFiberConnection);
      }),
      catchError(err => {
        this.logger.error(`Error updating connection ${connectionId} in NetworkDesignService`, err, { originalInput: updates, mappedPayload: payload });
        return throwError(() => new Error('Failed to update connection'));
      })
    );
  }

  /**
   * Obtiene un elemento por su ID
   * 
   * @param elementId ID del elemento
   * @returns Observable con el elemento
   */
  getElementsById(elementId: string): Observable<NetworkElement> {
    return this.networkService.getElementById(elementId);
  }

  /**
   * Elimina un elemento de red
   * 
   * @param elementId ID del elemento a eliminar
   * @returns Observable vacío que completa cuando se elimina
   */
  deleteElement(elementId: string): Observable<void> {
    return this.networkService.deleteElement(elementId);
  }

  /**
   * Crea un nuevo elemento de red
   * 
   * @param element Datos del elemento a crear
   * @returns Observable con el elemento creado
   */
  createElement(element: Partial<NetworkElement>): Observable<NetworkElement> {
    return this.networkService.createElement(element);
  }

  /**
   * Actualiza un elemento existente
   * 
   * @param elementId ID del elemento
   * @param updates Cambios a aplicar al elemento
   * @returns Observable con el elemento actualizado
   */
  updateElement(elementId: string, updates: Partial<NetworkElement>): Observable<NetworkElement> {
    return this.networkService.updateElement(elementId, updates);
  }

  /**
   * Crea múltiples elementos de red
   * 
   * @param elements Array de elementos a crear
   * @returns Observable con los elementos creados
   */
  createNetworkElements(elements: Partial<NetworkElement>[]): Observable<NetworkElement[]> {
    return from(elements).pipe(
      mergeMap(element => this.createElement(element)),
      toArray()
    );
  }

  /**
   * Servicio para gestionar el historial de elementos
   * @param elementId ID del elemento del que obtener el historial
   * @returns Observable con el historial del elemento
   */
  getElementHistory(elementId: string): Observable<ElementHistoryEntry[]> {
    return this.http.get<ElementHistoryEntry[]>(`${this.apiUrl}/elements/${elementId}/history`).pipe(
      catchError(error => {
        this.logger.error('Error al obtener historial del elemento:', error);
        return throwError(() => new Error(`Error al obtener historial: ${error.message}`));
      }),
      map(history => history.map(entry => ({
        ...entry,
        timestamp: new Date(entry.timestamp)
      })))
    );
  }

  // --- START HELPER MAPPING FUNCTIONS ---

  private mapFiberConnectionModelToNetworkConnection(fc: any): NetworkConnection {
    if (!fc) {
      this.logger.error('mapFiberConnectionModelToNetworkConnection: input FiberConnectionModel is null or undefined.');
      return {
        id: 'ERROR_NULL_INPUT',
        sourceElementId: 'UNKNOWN_SOURCE',
        targetElementId: 'UNKNOWN_TARGET',
        type: ConnectionType.FIBER,
        status: ConnectionStatus.INACTIVE,
        name: 'Error: Null Input Connection',
      };
    }
    
    const sourceId = fc.sourceId || fc.properties?.sourceId;
    const targetId = fc.targetId || fc.properties?.targetId;
    const connectionType = fc.connectionType || fc.properties?.connectionType;
    const connectionStatus = fc.status || fc.properties?.status;

    if (!sourceId || !targetId || !connectionType || !connectionStatus) {
      this.logger.warn(
        `FiberConnectionModel (id: ${fc.id}) is missing one or more required fields (sourceId, targetId, type, status) for full NetworkConnection mapping. Using defaults. Original object:`,
        fc
      );
    }

    return {
      id: fc.id,
      name: fc.name || `Connection ${fc.id}`,
      description: fc.description,
      sourceElementId: sourceId || 'UNKNOWN_SOURCE',
      targetElementId: targetId || 'UNKNOWN_TARGET',
      type: connectionType || ConnectionType.FIBER,
      status: connectionStatus || ConnectionStatus.INACTIVE,
      capacity: fc.capacity || (typeof fc.bandwidth === 'number' ? fc.bandwidth : undefined), // Example: take bandwidth as capacity if capacity is missing
      utilization: fc.utilization,
      latency: fc.latency,
      properties: {
        // Transfer other specific FiberConnectionModel fields to properties
        usageType: fc.usageType,
        fiberType: fc.fiberType, // This is FiberConnectionModelFiberType
        connectorType: fc.connectorType,
        polishingType: fc.polishingType,
        standard: fc.standard,
        insertionLoss: fc.insertionLoss,
        returnLoss: fc.returnLoss,
        wavelength: fc.wavelength,
        bandwidthMhzKm: fc.bandwidth, 
        coreDiameter: fc.coreDiameter,
        claddingDiameter: fc.claddingDiameter,
        outerDiameter: fc.outerDiameter,
        operatingTemperature: fc.operatingTemperature,
        tensileStrength: fc.tensileStrength,
        manufacturer: fc.manufacturer,
        modelNumber: fc.modelNumber,
        manufacturingDate: fc.manufacturingDate,
        certifications: fc.certifications,
        strands: fc.strands,
        strandConfiguration: fc.strandConfiguration,
        networkInfo: fc.networkInfo,
        installation: fc.installation,
        maintenance: fc.maintenance,
        emergency: fc.emergency,
        // Keep original non-mapped properties if any
        ...(fc.properties || {}), 
      },
      metadata: fc.metadata,
      fiberDetails: fc, // Store the original full object for reference
      createdAt: fc.createdAt || fc.manufacturingDate,
      updatedAt: fc.updatedAt,
      // Vertices and points might be part of fc.metadata or fc.networkInfo.points
      // If they are directly on fc, map them here.
      points: fc.points || fc.networkInfo?.points, 
      vertices: fc.vertices 
    };
  }

  private mapNetworkConnectionToFiberConnectionPayload(
    nc: Partial<NetworkConnection> | Omit<NetworkConnection, 'id'>
  ): any {
    const fiberDetailsSource = (nc as NetworkConnection).fiberDetails;
    const propertiesSource = nc.properties || {};

    const payload: Partial<FiberConnectionModel> = {
      name: nc.name || `Connection`,
      description: nc.description,
      
      usageType: propertiesSource.usageType || fiberDetailsSource?.usageType || FiberConnectionModelUsageType.DISTRIBUTION,
      fiberType: propertiesSource.fiberType || fiberDetailsSource?.fiberType || FiberConnectionModelFiberType.SINGLE_MODE,
      connectorType: propertiesSource.connectorType || fiberDetailsSource?.connectorType || FiberConnectionModelConnectorType.SC,
      polishingType: propertiesSource.polishingType || fiberDetailsSource?.polishingType || FiberConnectionModelPolishingType.APC,
      standard: propertiesSource.standard || fiberDetailsSource?.standard || FiberConnectionModelFiberStandard.ITU_T_G_652,
      
      insertionLoss: typeof (propertiesSource.insertionLoss ?? fiberDetailsSource?.insertionLoss) === 'number' ? (propertiesSource.insertionLoss ?? fiberDetailsSource?.insertionLoss) : 0,
      returnLoss: typeof (propertiesSource.returnLoss ?? fiberDetailsSource?.returnLoss) === 'number' ? (propertiesSource.returnLoss ?? fiberDetailsSource?.returnLoss) : 0,
      wavelength: typeof (propertiesSource.wavelength ?? fiberDetailsSource?.wavelength) === 'number' ? (propertiesSource.wavelength ?? fiberDetailsSource?.wavelength) : 1310,
      bandwidth: typeof (propertiesSource.bandwidthMhzKm ?? fiberDetailsSource?.bandwidth) === 'number' ? (propertiesSource.bandwidthMhzKm ?? fiberDetailsSource?.bandwidth) : 0,
      
      coreDiameter: propertiesSource.coreDiameter ?? fiberDetailsSource?.coreDiameter,
      claddingDiameter: propertiesSource.claddingDiameter ?? fiberDetailsSource?.claddingDiameter,
      outerDiameter: propertiesSource.outerDiameter ?? fiberDetailsSource?.outerDiameter,
      
      operatingTemperature: propertiesSource.operatingTemperature ?? fiberDetailsSource?.operatingTemperature,
      tensileStrength: propertiesSource.tensileStrength ?? fiberDetailsSource?.tensileStrength,
      
      manufacturer: propertiesSource.manufacturer ?? fiberDetailsSource?.manufacturer,
      modelNumber: propertiesSource.modelNumber ?? fiberDetailsSource?.modelNumber,
      manufacturingDate: propertiesSource.manufacturingDate ?? fiberDetailsSource?.manufacturingDate,
      
      certifications: propertiesSource.certifications ?? fiberDetailsSource?.certifications,
      strands: propertiesSource.strands ?? fiberDetailsSource?.strands,
      strandConfiguration: propertiesSource.strandConfiguration ?? fiberDetailsSource?.strandConfiguration,
      
      networkInfo: propertiesSource.networkInfo ?? fiberDetailsSource?.networkInfo,
      installation: propertiesSource.installation ?? fiberDetailsSource?.installation,
      maintenance: propertiesSource.maintenance ?? fiberDetailsSource?.maintenance,
      emergency: propertiesSource.emergency ?? fiberDetailsSource?.emergency,
      metadata: nc.metadata || propertiesSource.metadata || fiberDetailsSource?.metadata,
    };
    
    // Clean undefined values from payload, as some backends might not like null/undefined for non-nullable fields
    Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);
    
    // IMPORTANT: The FiberConnectionModel does not include sourceId, targetId, type, status of the connection instance.
    // If networkService expects these AT THE SAME LEVEL as FiberConnectionModel properties, they should be added here.
    // e.g., if payload should be { ...payload, sourceId: nc.sourceId, targetId: nc.targetId }
    // This depends on the actual API contract of this.networkService.create/updateConnection
    // For now, strictly adhering to mapping to FiberConnectionModel structure.
    // We also add sourceId, targetId etc. directly to the payload, as networkService might expect a hybrid object
    if ('sourceId' in nc && nc.sourceId) payload['sourceId'] = nc.sourceId;
    if ('targetId' in nc && nc.targetId) payload['targetId'] = nc.targetId;
    if ('type' in nc && nc.type) payload['type'] = nc.type; // ConnectionType
    if ('status' in nc && nc.status) payload['status'] = nc.status; // ConnectionStatus

    return payload;
  }

  // --- END HELPER MAPPING FUNCTIONS ---
}
