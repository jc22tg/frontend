import { Injectable } from '@angular/core';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { NetworkElement, NetworkConnection } from '../../../../shared/types/network.types';
import { LoggerService } from '../../../../core/services/logger.service';
import { NetworkStateService } from '../network-state.service';

/**
 * Interfaz para un resultado de medición entre elementos
 */
export interface MeasurementResult {
  sourceElement: NetworkElement;
  targetElement: NetworkElement;
  distance: number;
  unit: string;
  timestamp: number;
}

/**
 * Interfaz para una solicitud de conexión entre elementos
 */
export interface ConnectionRequest {
  sourceElement: NetworkElement;
  targetElement: NetworkElement;
  type?: string;
  properties?: Record<string, any>;
}

/**
 * Servicio para gestionar las interacciones del usuario con el mapa
 * 
 * Este servicio abstrae la lógica de selección de elementos, creación de 
 * conexiones, mediciones y otras interacciones entre el usuario y los
 * elementos del mapa.
 */
@Injectable({
  providedIn: 'root'
})
export class MapInteractionService {
  /** Subject para elemento seleccionado */
  private selectedElement$ = new BehaviorSubject<NetworkElement | null>(null);
  
  /** Subject para conexión seleccionada */
  private selectedConnection$ = new BehaviorSubject<NetworkConnection | null>(null);
  
  /** Subject para elementos seleccionados múltiples */
  private selectedElements$ = new BehaviorSubject<NetworkElement[]>([]);
  
  /** Subject para resultados de medición */
  private measurement$ = new Subject<MeasurementResult>();
  
  /** Subject para solicitudes de creación de conexiones */
  private connectionRequest$ = new Subject<ConnectionRequest>();
  
  /** Elemento origen para conexión */
  private connectionSource: NetworkElement | null = null;
  
  /** Cuenta de elementos seleccionados */
  private selectedCount = 0;
  
  constructor(
    private networkStateService: NetworkStateService,
    private logger: LoggerService
  ) {}
  
  /**
   * Selecciona un elemento
   * @param element Elemento a seleccionar o null para deseleccionar
   * @param multiSelect Si es true, añade a la selección actual en lugar de reemplazarla
   */
  selectElement(element: NetworkElement | null, multiSelect = false): void {
    if (!multiSelect) {
      // Modo selección única
      this.selectedElement$.next(element);
      
      // Actualizar estado global
      this.networkStateService.updateSelectedElement(element);
      
      // Limpiar selección múltiple
      this.selectedElements$.next(element ? [element] : []);
      this.selectedCount = element ? 1 : 0;
    } else {
      // Modo selección múltiple
      const currentElements = this.selectedElements$.value;
      
      if (!element) {
        // Deseleccionar todo
        this.selectedElements$.next([]);
        this.selectedElement$.next(null);
        this.selectedCount = 0;
        return;
      }
      
      // Verificar si ya está seleccionado
      const isSelected = currentElements.some(e => e.id === element.id);
      
      if (isSelected) {
        // Quitar de la selección
        const newElements = currentElements.filter(e => e.id !== element.id);
        this.selectedElements$.next(newElements);
        this.selectedCount = newElements.length;
        
        // Actualizar elemento seleccionado principal
        this.selectedElement$.next(newElements.length > 0 ? newElements[0] : null);
      } else {
        // Añadir a la selección
        const newElements = [...currentElements, element];
        this.selectedElements$.next(newElements);
        this.selectedCount = newElements.length;
        
        // Actualizar elemento seleccionado principal
        this.selectedElement$.next(element);
      }
      
      // Actualizar estado global
      this.networkStateService.updateSelectedElement(this.selectedElement$.value);
    }
    
    this.logger.debug(`Elemento seleccionado: ${element?.id || 'ninguno'}. Total seleccionados: ${this.selectedCount}`);
  }
  
  /**
   * Selecciona una conexión
   * @param connection Conexión a seleccionar o null para deseleccionar
   */
  selectConnection(connection: NetworkConnection | null): void {
    this.selectedConnection$.next(connection);
    
    // Actualizar estado global
    try {
      // Verificar si existe el método en el servicio
      if (typeof this.networkStateService['setSelectedConnection'] === 'function') {
        (this.networkStateService['setSelectedConnection'] as Function)(connection);
      } else {
        // Fallback para compatibilidad
        this.logger.debug('Método setSelectedConnection no disponible en NetworkStateService');
      }
    } catch (error) {
      this.logger.warn('Error al actualizar conexión seleccionada en el estado global', error);
    }
    
    this.logger.debug(`Conexión seleccionada: ${connection?.id || 'ninguna'}`);
  }
  
  /**
   * Inicia el proceso de creación de conexión
   * @param source Elemento origen de la conexión
   */
  startConnection(source: NetworkElement): void {
    this.connectionSource = source;
    this.logger.debug(`Iniciando conexión desde: ${source.id}`);
  }
  
  /**
   * Completa la creación de conexión
   * @param target Elemento destino de la conexión
   * @param properties Propiedades adicionales para la conexión
   * @returns true si la conexión se creó correctamente
   */
  completeConnection(target: NetworkElement, properties?: Record<string, any>): boolean {
    if (!this.connectionSource) {
      this.logger.warn('No hay elemento origen para la conexión');
      return false;
    }
    
    // Validar que los elementos son diferentes
    if (this.connectionSource.id === target.id) {
      this.logger.warn('No se puede conectar un elemento consigo mismo');
      return false;
    }
    
    // Crear solicitud de conexión
    const request: ConnectionRequest = {
      sourceElement: this.connectionSource,
      targetElement: target,
      properties
    };
    
    // Notificar solicitud
    this.connectionRequest$.next(request);
    
    // Limpiar estado
    this.connectionSource = null;
    
    return true;
  }
  
  /**
   * Cancela la creación de conexión en curso
   */
  cancelConnection(): void {
    this.connectionSource = null;
    this.logger.debug('Creación de conexión cancelada');
  }
  
  /**
   * Registra una medición entre elementos
   * @param source Elemento origen
   * @param target Elemento destino
   * @param distance Distancia calculada
   * @param unit Unidad de medida (por defecto metros)
   */
  registerMeasurement(source: NetworkElement, target: NetworkElement, distance: number, unit = 'm'): void {
    const measurement: MeasurementResult = {
      sourceElement: source,
      targetElement: target,
      distance,
      unit,
      timestamp: Date.now()
    };
    
    this.measurement$.next(measurement);
    this.logger.debug(`Medición registrada: ${distance} ${unit} entre ${source.id} y ${target.id}`);
  }
  
  /**
   * Verifica si hay elementos seleccionados
   * @returns true si hay al menos un elemento seleccionado
   */
  hasSelection(): boolean {
    return this.selectedCount > 0;
  }
  
  /**
   * Verifica si se puede crear una conexión
   * @returns true si hay un elemento origen seleccionado
   */
  canCreateConnection(): boolean {
    return this.connectionSource !== null;
  }
  
  /**
   * Obtiene el número de elementos seleccionados
   * @returns Número de elementos seleccionados
   */
  getSelectionCount(): number {
    return this.selectedCount;
  }
  
  /**
   * Observable para el elemento seleccionado
   */
  get selectedElement(): Observable<NetworkElement | null> {
    return this.selectedElement$.asObservable();
  }
  
  /**
   * Observable para la conexión seleccionada
   */
  get selectedConnection(): Observable<NetworkConnection | null> {
    return this.selectedConnection$.asObservable();
  }
  
  /**
   * Observable para elementos seleccionados múltiples
   */
  get selectedElements(): Observable<NetworkElement[]> {
    return this.selectedElements$.asObservable();
  }
  
  /**
   * Observable para mediciones
   */
  get measurements(): Observable<MeasurementResult> {
    return this.measurement$.asObservable();
  }
  
  /**
   * Observable para solicitudes de conexión
   */
  get connectionRequests(): Observable<ConnectionRequest> {
    return this.connectionRequest$.asObservable();
  }
} 