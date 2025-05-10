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
import { Observable, from } from 'rxjs';
import { map, mergeMap, toArray } from 'rxjs/operators';
import {
  NetworkElement,
  ElementType,
  ElementStatus,
  GeographicPosition,
  MonitoringData,
  NetworkAlert,
  MaintenanceSchedule,
  Attachment,
  NetworkConnection
} from '../../../shared/types/network.types';
import { NetworkService } from '../../../core/services/network.service';
import { NetworkMonitoringService } from './network-monitoring.service';
import { AttachmentService } from './attachment.service';
import { ProjectService } from '@core/services/project.service';
import { Project, ProjectStatus } from '../../../interfaces/project.interface';
import { Client, ClientType } from '../../../shared/types/network.types';

@Injectable({
  providedIn: 'root'
})
export class NetworkDesignService {
  private networkService = inject(NetworkService);
  private monitoringService = inject(NetworkMonitoringService);
  private attachmentService = inject(AttachmentService);
  private projectService = inject(ProjectService);

  /**
   * Obtiene todos los elementos de red de un tipo específico
   * 
   * @param type Tipo de elemento a obtener (ODF, OLT, ONT, etc.)
   * @returns Observable con los elementos encontrados
   * @throws Error si el tipo de elemento no es válido
   *
   * @example
   * ```typescript
   * this.networkDesignService.getElementsByType(ElementType.ODF)
   *   .subscribe(elements => this.odfs = elements);
   * ```
   */
  getElementsByType(type: ElementType): Observable<NetworkElement[]> {
    return this.networkService.getElementsByType(type);
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
  validatePosition(position: any): boolean {
    if (!position || !position.coordinates || position.coordinates.length !== 2) {
      return false;
    }
    
    // Si tiene lat/lng (ExtendedPosition), usamos esos valores
    if ('lat' in position && 'lng' in position) {
      return (
        position.lat >= 17.5 &&
        position.lat <= 19.9 &&
        position.lng >= -72.0 &&
        position.lng <= -68.3
      );
    }
    
    // Para GeographicPosition estándar
    // Validar que las coordenadas estén dentro de los límites de la República Dominicana
    return (
      position.coordinates[1] >= 17.5 &&
      position.coordinates[1] <= 19.9 &&
      position.coordinates[0] >= -72.0 &&
      position.coordinates[0] <= -68.3
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
    const dLat = this.toRad(
      element2.position.coordinates[1] - element1.position.coordinates[1]
    );
    const dLon = this.toRad(
      element2.position.coordinates[0] - element1.position.coordinates[0]
    );
    const lat1 = this.toRad(element1.position.coordinates[1]);
    const lat2 = this.toRad(element2.position.coordinates[1]);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
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
    return this.monitoringService.getMaintenanceSchedules(status);
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
    return this.projectService.getProjects(); // El ProjectService global no filtra por estado, así que ignora el argumento
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
    return this.networkService.getConnections();
  }

  /**
   * Crea una nueva conexión de red
   * 
   * @param connection Datos de la conexión a crear
   * @returns Observable con la conexión creada
   */
  createConnection(connection: Omit<NetworkConnection, 'id'>): Observable<NetworkConnection> {
    return this.networkService.createConnection(connection);
  }

  /**
   * Actualiza una conexión existente
   * 
   * @param connectionId ID de la conexión
   * @param updates Cambios a aplicar a la conexión
   * @returns Observable con la conexión actualizada
   */
  updateConnection(connectionId: string, updates: Partial<NetworkConnection>): Observable<NetworkConnection> {
    return this.networkService.updateConnection(connectionId, updates);
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
}
