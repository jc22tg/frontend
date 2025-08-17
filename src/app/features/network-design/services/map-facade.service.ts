import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { takeUntil, map, distinctUntilChanged } from 'rxjs/operators';
import { ElementType, NetworkElement, NetworkConnection, ElementStatus } from '../../../shared/types/network.types';
import { NetworkStateService } from './network-state.service';
import { NetworkEventBusService, NetworkEventType, NetworkEvent } from './network-event-bus.service';
import { LayerManagerService } from './layer-manager.service';
import { ElementService } from './element.service';
import { LoggerService } from '../../../core/services/logger.service';
import { MatDialog } from '@angular/material/dialog';

/**
 * Servicio de fachada para centralizar la lógica relacionada con el mapa de red
 * Elimina la duplicación de código entre NetworkMapPageComponent y MapContainerComponent
 * Usa el NetworkEventBusService para evitar dependencias circulares
 */
@Injectable({
  providedIn: 'root'
})
export class MapFacadeService {
  // Observables públicos para suscribirse desde componentes
  readonly zoomLevel$: Observable<number>;
  readonly isDarkMode$: Observable<boolean>;
  readonly currentTool$: Observable<string>;
  readonly activeLayers$: BehaviorSubject<ElementType[]>;
  readonly selectedElement$: Observable<NetworkElement | null>;
  readonly selectedConnection$: Observable<NetworkConnection | null>;
  readonly showSearchWidget$: Observable<boolean>;
  readonly showElementsPanel$: Observable<boolean>;
  
  // Subject para limpiar suscripciones
  private destroy$ = new Subject<void>();
  
  constructor(
    private networkStateService: NetworkStateService,
    private eventBus: NetworkEventBusService,
    private layerManager: LayerManagerService,
    private elementService: ElementService,
    private dialog: MatDialog,
    private logger: LoggerService
  ) {
    // Inicializar estado
    const initialState = this.networkStateService.getCurrentState();
    
    // Configurar observables
    this.zoomLevel$ = this.networkStateService.state$.pipe(
      map(state => state.zoomLevel),
      distinctUntilChanged()
    );
    
    this.isDarkMode$ = this.networkStateService.state$.pipe(
      map(state => state.isDarkMode),
      distinctUntilChanged()
    );
    
    this.currentTool$ = this.networkStateService.state$.pipe(
      map(state => state.currentTool),
      distinctUntilChanged()
    );
    
    this.selectedElement$ = this.networkStateService.state$.pipe(
      map(state => state.selectedElement),
      distinctUntilChanged()
    );
    
    this.selectedConnection$ = this.networkStateService.state$.pipe(
      map(state => state.selectedConnection),
      distinctUntilChanged()
    );
    
    // Observables adicionales
    this.showSearchWidget$ = this.networkStateService.showSearchWidget;
    this.showElementsPanel$ = this.networkStateService.showElementsPanel;
    
    // Inicializar capas activas
    this.activeLayers$ = new BehaviorSubject<ElementType[]>(Array.from(initialState.activeLayers));
    
    // Suscribirse a cambios en las capas activas
    this.layerManager.getActiveLayers().pipe(
      takeUntil(this.destroy$)
    ).subscribe(layers => {
      this.activeLayers$.next(layers);
    });

    // Suscribirse a eventos relevantes del bus de eventos
    this.subscribeToEvents();
  }

  /**
   * Suscribirse a eventos relevantes del bus de eventos
   */
  private subscribeToEvents(): void {
    // Suscribirnos al evento de selección de elemento
    this.eventBus.on(NetworkEventType.ELEMENT_SELECTED).pipe(
      takeUntil(this.destroy$)
    ).subscribe((event: NetworkEvent) => {
      // Notificar a los observadores sobre el elemento seleccionado
      this.networkStateService.updateSelectedElement(event.payload?.element);
    });

    // Suscribirnos al evento de selección de conexión
    this.eventBus.on(NetworkEventType.CONNECTION_SELECTED).pipe(
      takeUntil(this.destroy$)
    ).subscribe((event: NetworkEvent) => {
      // Notificar a los observadores sobre la conexión seleccionada
      this.networkStateService.setSelectedConnection(event.payload?.connection);
    });

    // Suscribirnos al evento de cambio de zoom
    this.eventBus.on(NetworkEventType.ZOOM_CHANGED).pipe(
      takeUntil(this.destroy$)
    ).subscribe((event: NetworkEvent) => {
      // Actualizar el nivel de zoom actual
      this.networkStateService.setZoomLevel(event.payload?.level);
    });
  }
  
  /**
   * Cambia el nivel de zoom
   */
  setZoomLevel(level: number): void {
    this.networkStateService.setZoomLevel(level);
    this.eventBus.emit({
      type: NetworkEventType.ZOOM_CHANGED,
      timestamp: new Date(),
      payload: { level }
    });
  }
  
  /**
   * Selecciona un elemento
   */
  selectElement(element: NetworkElement | null): void {
    // Emitir evento al bus en lugar de llamar directamente a NetworkStateService y MapEventsService
    if (element) {
      this.eventBus.emitElementSelected(element);
    } else {
      this.networkStateService.updateSelectedElement(null);
    }
  }
  
  /**
   * Selecciona una conexión
   */
  selectConnection(connection: NetworkConnection | null): void {
    // Emitir evento al bus en lugar de llamar directamente a NetworkStateService y MapEventsService
    if (connection) {
      this.eventBus.emitConnectionSelected(connection);
    } else {
      this.networkStateService.setSelectedConnection(null);
    }
  }
  
  /**
   * Alterna una capa
   */
  toggleLayer(layerType: ElementType): void {
    this.layerManager.toggleLayer(layerType);
  }
  
  /**
   * Alterna una capa personalizada
   */
  toggleCustomLayer(layerId: string): void {
    this.networkStateService.toggleCustomLayer(layerId);
  }
  
  /**
   * Establece la herramienta actual
   */
  setCurrentTool(tool: string): void {
    const previousTool = this.networkStateService.getCurrentState().currentTool;
    this.networkStateService.setCurrentTool(tool);
    this.eventBus.emit({
      type: NetworkEventType.VIEW_MODE_CHANGED,
      timestamp: new Date(),
      payload: { tool, previousTool }
    });
  }
  
  /**
   * Registra la finalización de una medición
   */
  completeMeasurement(data: {sourceElement: NetworkElement, targetElement: NetworkElement, distance: number}): void {
    // Emitir evento de medición completada
    this.eventBus.emit({
      type: NetworkEventType.WIDGET_ACTION,
      timestamp: new Date(),
      payload: {
        action: 'measurement_completed',
        sourceElement: data.sourceElement,
        targetElement: data.targetElement,
        distance: data.distance
      }
    });
    
    this.networkStateService.addToHistory({
      action: `Medición: ${data.sourceElement.name} → ${data.targetElement.name}: ${data.distance.toFixed(2)}m`,
      timestamp: new Date()
    });
  }
  
  /**
   * Crea una conexión entre elementos
   */
  createConnection(connection: NetworkConnection): void {
    this.networkStateService.setIsDirty(true);
    this.eventBus.emit({
      type: NetworkEventType.CONNECTION_CREATED,
      timestamp: new Date(),
      payload: { connection }
    });
    this.networkStateService.addToHistory({
      action: `Conexión creada: ${connection.sourceElementId} → ${connection.targetElementId}`,
      timestamp: new Date()
    });
  }
  
  /**
   * Alterna la visibilidad del widget de búsqueda
   */
  toggleSearchWidget(state?: boolean): void {
    // Usar la API del servicio y emitir evento para notificar a otros componentes
    this.networkStateService.showSearchWidget.pipe(takeUntil(this.destroy$)).subscribe(currentState => {
      const newState = state !== undefined ? state : !currentState;
      this.networkStateService.setShowSearchWidget(newState);
      
      // Emitir evento de cambio de componente UI
      this.eventBus.emit({
        type: NetworkEventType.WIDGET_ACTION,
        timestamp: new Date(),
        payload: { component: 'searchWidget', visible: newState }
      });
    });
  }
  
  /**
   * Alterna la visibilidad del panel de elementos
   */
  toggleElementsPanel(state?: boolean): void {
    // Usar la API del servicio y emitir evento para notificar a otros componentes
    this.networkStateService.showElementsPanel.pipe(takeUntil(this.destroy$)).subscribe(currentState => {
      const newState = state !== undefined ? state : !currentState;
      this.networkStateService.setShowElementsPanel(newState);
      
      // Emitir evento de cambio de componente UI
      this.eventBus.emit({
        type: NetworkEventType.WIDGET_ACTION,
        timestamp: new Date(),
        payload: { component: 'elementsPanel', visible: newState }
      });
    });
  }
  
  /**
   * Limpia recursos al destruir
   */
  destroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.logger.debug('MapFacadeService destruido');
  }
} 
