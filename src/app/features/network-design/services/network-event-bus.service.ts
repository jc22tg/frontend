import { Injectable } from '@angular/core';
import { Subject, Observable, filter } from 'rxjs';
import { NetworkElement, NetworkConnection } from '../../../shared/types/network.types';
import { LoggerService } from '../../../core/services/logger.service';

/**
 * Tipos de eventos de red
 */
export enum NetworkEventType {
  MAP_READY = 'MAP_READY',
  MAP_ERROR = 'MAP_ERROR',
  ELEMENT_SELECTED = 'ELEMENT_SELECTED',
  ELEMENT_CREATED = 'ELEMENT_CREATED',
  ELEMENT_UPDATED = 'ELEMENT_UPDATED',
  ELEMENT_DELETED = 'ELEMENT_DELETED',
  CONNECTION_SELECTED = 'CONNECTION_SELECTED',
  CONNECTION_CREATED = 'CONNECTION_CREATED',
  CONNECTION_UPDATED = 'CONNECTION_UPDATED',
  CONNECTION_DELETED = 'CONNECTION_DELETED',
  LAYER_TOGGLED = 'LAYER_TOGGLED',
  ZOOM_CHANGED = 'ZOOM_CHANGED',
  VIEW_MODE_CHANGED = 'VIEW_MODE_CHANGED',
  WIDGET_LOADED = 'WIDGET_LOADED',
  WIDGET_ERROR = 'WIDGET_ERROR',
  WIDGET_ACTION = 'WIDGET_ACTION'
}

/**
 * Interfaz para eventos de red
 */
export interface NetworkEvent {
  type: NetworkEventType;
  timestamp: Date;
  payload?: any;
  source?: string;
}

/**
 * Servicio de bus de eventos para comunicación entre componentes de red
 */
@Injectable({
  providedIn: 'root'
})
export class NetworkEventBusService {
  private eventSubject = new Subject<NetworkEvent>();

  constructor(private logger: LoggerService) {}

  /**
   * Emite un evento en el bus
   * @param event Evento a emitir
   */
  emit(event: NetworkEvent): void {
    if (!event.timestamp) {
      event.timestamp = new Date();
    }
    this.logger.debug(`[EventBus] Emitiendo evento: ${event.type}`, event);
    this.eventSubject.next(event);
  }

  /**
   * Se suscribe a eventos de un tipo específico
   * @param eventType Tipo de evento
   * @returns Observable con eventos del tipo especificado
   */
  on(eventType: NetworkEventType): Observable<NetworkEvent> {
    return this.eventSubject.asObservable().pipe(
      filter(event => event.type === eventType)
    );
  }

  /**
   * Emite un evento de error del mapa
   * @param error Error ocurrido
   * @param source Fuente del error
   */
  emitMapError(error: any, source: string): void {
    this.emit({
      type: NetworkEventType.MAP_ERROR,
      timestamp: new Date(),
      payload: {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        source
      },
      source
    });
  }
  
  /**
   * Emite un evento de elemento seleccionado
   * @param element Elemento seleccionado
   */
  emitElementSelected(element: NetworkElement): void {
    this.emit({
      type: NetworkEventType.ELEMENT_SELECTED,
      timestamp: new Date(),
      payload: { element },
      source: element?.id
    });
  }
  
  /**
   * Emite un evento de conexión seleccionada
   * @param connection Conexión seleccionada
   */
  emitConnectionSelected(connection: NetworkConnection): void {
    this.emit({
      type: NetworkEventType.CONNECTION_SELECTED,
      timestamp: new Date(),
      payload: { connection },
      source: connection?.id
    });
  }
  
  /**
   * Emite un evento de capa activada/desactivada
   * @param layerId ID de la capa
   * @param visible Estado de visibilidad
   */
  emitLayerToggled(layerId: string, visible: boolean): void {
    this.emit({
      type: NetworkEventType.LAYER_TOGGLED,
      timestamp: new Date(),
      payload: { layerId, visible },
      source: layerId
    });
  }
  
  /**
   * Emite un evento de widget cargado
   * @param widgetId ID del widget
   * @param success Estado de carga
   */
  emitWidgetLoaded(widgetId: string, success: boolean): void {
    this.emit({
      type: NetworkEventType.WIDGET_LOADED,
      timestamp: new Date(),
      payload: { widgetId, success },
      source: widgetId
    });
  }
  
  /**
   * Emite un evento de error de widget
   * @param widgetId ID del widget
   * @param error Error ocurrido
   */
  emitWidgetError(widgetId: string, error: any): void {
    this.emit({
      type: NetworkEventType.WIDGET_ERROR,
      timestamp: new Date(),
      payload: {
        widgetId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      },
      source: widgetId
    });
  }
}
