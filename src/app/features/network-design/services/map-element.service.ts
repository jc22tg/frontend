import { Injectable, Inject, Optional, inject } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { take, map, catchError, filter } from 'rxjs/operators';
import { NetworkElement, ElementType, ElementStatus } from '../../../shared/types/network.types';
import { GeographicPosition, createPosition } from '../../../shared/types/geo-position';
import { NetworkEventBusService, NetworkEventType, NetworkEvent } from './network-event-bus.service';
import { LoggerService } from '../../../core/services/logger.service';
import { MAP_SERVICE_TOKEN, NETWORK_STATE_SERVICE_TOKEN, NETWORK_DESIGN_SERVICE_TOKEN, IMapService, INetworkStateService, INetworkDesignService, IMapElementService } from './event-tokens';

@Injectable({
  providedIn: 'root'
})
export class MapElementService implements IMapElementService {
  // Propiedades observables para elementos y selección
  private elementsSubject = new BehaviorSubject<NetworkElement[]>([]);
  elements$ = this.elementsSubject.asObservable();

  private selectedElementSubject = new BehaviorSubject<NetworkElement | null>(null);
  selectedElement$ = this.selectedElementSubject.asObservable();

  // Usando inject para resolver los servicios
  private logger = inject(LoggerService);
  private eventBus = inject(NetworkEventBusService);
  private mapService = inject(MAP_SERVICE_TOKEN, { optional: true });
  private stateService = inject(NETWORK_STATE_SERVICE_TOKEN, { optional: true });
  private networkDesignService = inject(NETWORK_DESIGN_SERVICE_TOKEN, { optional: true });

  constructor() {
    // Suscribirse a eventos relevantes
    this.subscribeToEvents();
  }

  /**
   * Suscribirse a eventos relevantes
   */
  private subscribeToEvents(): void {
    // Escuchar eventos de selección de elementos
    this.eventBus.on(NetworkEventType.ELEMENT_SELECTED).pipe(
      filter(event => !!event.payload?.element)
    ).subscribe((event: NetworkEvent) => {
      if (event.payload?.element) {
        this.updateSelectedElement(event.payload.element);
      }
    });

    // Escuchar eventos de creación de elementos
    this.eventBus.on(NetworkEventType.ELEMENT_CREATED).pipe(
      filter(event => !!event.payload?.element)
    ).subscribe((event: NetworkEvent) => {
      if (event.payload?.element) {
        this.addElementToCollection(event.payload.element);
      }
    });

    // Escuchar eventos de actualización de elementos
    this.eventBus.on(NetworkEventType.ELEMENT_UPDATED).pipe(
      filter(event => !!event.payload?.element && !!event.payload.element.id)
    ).subscribe((event: NetworkEvent) => {
      if (event.payload?.element && event.payload.element.id) {
        this.updateElementInCollection(event.payload.element);
      }
    });

    // Escuchar eventos de eliminación de elementos
    this.eventBus.on(NetworkEventType.ELEMENT_DELETED).pipe(
      filter(event => !!event.payload?.element?.id)
    ).subscribe((event: NetworkEvent) => {
      if (event.payload?.element?.id) {
        this.removeElementFromCollection(event.payload.element.id);
      }
    });
  }

  /**
   * Añade un elemento a la colección local
   */
  private addElementToCollection(element: NetworkElement): void {
    const currentElements = this.elementsSubject.value;
    if (!currentElements.find(e => e.id === element.id)) {
      this.elementsSubject.next([...currentElements, element]);
    }
  }

  /**
   * Actualiza un elemento en la colección local
   */
  private updateElementInCollection(element: NetworkElement): void {
    const currentElements = this.elementsSubject.value;
    const index = currentElements.findIndex(e => e.id === element.id);
    
    if (index !== -1) {
      const updatedElements = [...currentElements];
      updatedElements[index] = element;
      this.elementsSubject.next(updatedElements);
    }
  }

  /**
   * Elimina un elemento de la colección local
   */
  private removeElementFromCollection(elementId: string): void {
    const currentElements = this.elementsSubject.value;
    this.elementsSubject.next(currentElements.filter(e => e.id !== elementId));
  }

  /**
   * Actualiza el elemento seleccionado localmente
   */
  private updateSelectedElement(element: NetworkElement | null): void {
    this.selectedElementSubject.next(element);
  }

  /**
   * Carga los elementos de red
   */
  loadElements(): Observable<NetworkElement[]> {
    // Implementación simulada - en un caso real, cargaría desde el backend
    this.logger.debug('Cargando elementos de red');
    
    // Crear datos mock para tener elementos visibles en el mapa
    const mockElements: NetworkElement[] = [
      {
        id: 'olt-001',
        code: 'OLT-001',
        name: 'OLT Principal',
        type: ElementType.OLT,
        status: ElementStatus.ACTIVE,
        position: {
          lat: 19.4546,
          lng: -70.6845,
          coordinates: [-70.6845, 19.4546],
          type: 'Point'
        },
        description: 'OLT principal del sistema'
      },
      {
        id: 'fdp-001',
        code: 'FDP-001',
        name: 'FDP Zona Norte',
        type: ElementType.FDP,
        status: ElementStatus.ACTIVE,
        position: {
          lat: 19.4650,
          lng: -70.6740,
          coordinates: [-70.6740, 19.4650],
          type: 'Point'
        },
        description: 'FDP de distribución zona norte'
      },
      {
        id: 'splitter-001',
        code: 'SPL-001',
        name: 'Splitter 1:8',
        type: ElementType.SPLITTER,
        status: ElementStatus.ACTIVE,
        position: {
          lat: 19.4600,
          lng: -70.6640,
          coordinates: [-70.6640, 19.4600],
          type: 'Point'
        },
        description: 'Splitter principal 1:8'
      },
      {
        id: 'ont-001',
        code: 'ONT-001',
        name: 'ONT Cliente 1',
        type: ElementType.ONT,
        status: ElementStatus.ACTIVE,
        position: {
          lat: 19.4700,
          lng: -70.6660,
          coordinates: [-70.6660, 19.4700],
          type: 'Point'
        },
        description: 'ONT del cliente residencial 1'
      },
      {
        id: 'edfa-001',
        code: 'EDFA-001',
        name: 'Amplificador EDFA',
        type: ElementType.EDFA,
        status: ElementStatus.ACTIVE,
        position: {
          lat: 19.4500,
          lng: -70.6940,
          coordinates: [-70.6940, 19.4500],
          type: 'Point'
        },
        description: 'Amplificador EDFA para zona extendida'
      }
    ];
    
    this.elementsSubject.next(mockElements);
    return of(mockElements);
  }

  /**
   * Busca elementos por texto
   */
  searchElements(query: string): void {
    // Implementación simulada de búsqueda
    this.logger.debug(`Buscando elementos con: ${query}`);
    // En un caso real, filtrarías los elementos
  }

  /**
   * Limpia la búsqueda actual
   */
  clearSearch(): void {
    this.logger.debug('Limpiando búsqueda');
    // Implementación para limpiar búsqueda
  }

  /**
   * Selecciona un elemento
   */
  selectElement(element: NetworkElement): void {
    this.selectedElementSubject.next(element);
    this.handleElementSelection(element);
  }

  /**
   * Limpia la selección actual
   */
  clearSelection(): void {
    this.selectedElementSubject.next(null);
    
    // Notificar a través del bus de eventos
    if (this.eventBus) {
      this.eventBus.emit({
        type: NetworkEventType.ELEMENT_SELECTED,
        timestamp: new Date(),
        payload: { element: null }
      });
    }
    
    // Si existe el servicio de estado, actualizar también allí
    if (this.stateService) {
      this.stateService.setSelectedElement(null);
    }
  }

  /**
   * Elimina un elemento
   */
  deleteElement(elementId: string | undefined): Observable<boolean> {
    if (!elementId) {
      this.logger.error('No se puede eliminar un elemento sin ID');
      return of(false);
    }
    
    this.logger.debug(`Eliminando elemento con ID: ${elementId}`);
    
    // Eliminar de la colección local
    this.removeElementFromCollection(elementId);
    
    // Crear elemento con solo el ID para la eliminación
    const elementToDelete: NetworkElement = { id: elementId } as NetworkElement;
    
    // Notificar a través del bus de eventos
    if (this.eventBus) {
      this.eventBus.emit({
        type: NetworkEventType.ELEMENT_DELETED,
        timestamp: new Date(),
        payload: { element: elementToDelete },
        source: elementId
      });
    }
    
    // Implementación simulada
    return of(true);
  }

  /**
   * Aplica filtros a los elementos
   */
  applyFilters(filters: any): void {
    this.logger.debug('Aplicando filtros: ', filters);
    // Implementación para aplicar filtros
  }

  /**
   * Limpia todos los filtros
   */
  clearFilters(): void {
    this.logger.debug('Limpiando filtros');
    // Implementación para limpiar filtros
  }

  /**
   * Establece la visibilidad de una capa
   */
  setLayerVisibility(layerType: ElementType, isVisible: boolean): void {
    this.logger.debug(`Estableciendo visibilidad de ${layerType} a ${isVisible}`);
    
    // Notificar a través del bus de eventos
    this.eventBus.emitLayerToggled(layerType.toString(), isVisible);
    
    // Si existe el servicio de estado, actualizar también allí
    if (this.stateService) {
      this.stateService.setLayerActive(layerType, isVisible);
    }
  }

  /**
   * Maneja la selección de un elemento en el mapa
   */
  handleElementSelection(element: NetworkElement): void {
    if (!element) return;
    
    // Notificar a través del bus de eventos
    this.eventBus.emitElementSelected(element);
    
    // Si existe el servicio de estado, actualizar también allí
    if (this.stateService) {
      this.stateService.setSelectedElement(element);
    }
    
    // Cargar datos de monitoreo
    this.loadElementMonitoringData(element);
    
    // Notificar al servicio del mapa sobre el elemento seleccionado
    if (this.mapService) {
      this.mapService.selectElement(element);
    }
  }

  /**
   * Maneja la visualización de un elemento en el mapa
   */
  handleElementDisplay(element: NetworkElement): void {
    if (!element || !element.id) return;
    
    if (this.stateService && this.stateService.isLayerActive(element.type)) {
      // Obtener coordenadas del elemento
      const x = element.position?.coordinates?.[0] || 0;
      const y = element.position?.coordinates?.[1] || 0;
      
      // Usar el método apropiado de MapService si está disponible
      if (this.mapService) {
        this.mapService.addElementAtPosition(element, x, y);
      }
    }
  }

  /**
   * Maneja la interacción con un elemento en el mapa
   */
  handleElementInteraction(element: NetworkElement): void {
    if (!element) return;
    
    let currentState = ElementStatus.UNKNOWN;
    if (this.stateService) {
      currentState = this.stateService.getElementState(element);
    } else {
      currentState = element.status || ElementStatus.UNKNOWN;
    }
    
    this.showElementDetails(element);
    this.updateElementStatus(element, currentState);
  }

  /**
   * Muestra los detalles de un elemento
   */
  private showElementDetails(element: NetworkElement): void {
    // Implementar lógica para mostrar detalles
    this.logger.debug('Mostrando detalles del elemento:', element);
  }

  /**
   * Actualiza el estado de un elemento
   */
  private updateElementStatus(element: NetworkElement, newStatus: ElementStatus): void {
    if (!element || !element.id) {
      this.logger.error('Elemento inválido o sin ID para actualizar estado');
      return;
    }
    
    // Si no tenemos acceso al servicio de diseño, no podemos proceder
    if (!this.networkDesignService) {
      this.logger.warn('NetworkDesignService no está disponible');
      return;
    }
    
    this.networkDesignService.updateElementStatus(element.id, newStatus)
      .pipe(take(1), catchError(error => {
        this.logger.error('Error actualizando estado:', error);
        return of(null as any);
      }))
      .subscribe(updatedElement => {
        if (!updatedElement) return;
        
        // Actualizar estado en el servicio de estado si está disponible
        if (this.stateService) {
          this.stateService.updateElementState(updatedElement, newStatus);
        }
        
        // Actualizar el elemento localmente
        this.updateElementInCollection(updatedElement);
        
        // Actualizar el elemento en el mapa
        this.refreshElementOnMap(updatedElement);
        
        // Notificar la actualización a través del bus de eventos
        if (this.eventBus) {
          this.eventBus.emit({
            type: NetworkEventType.ELEMENT_UPDATED,
            timestamp: new Date(),
            payload: { element: updatedElement },
            source: updatedElement.id
          });
        }
      });
  }
  
  /**
   * Actualiza la visualización de un elemento en el mapa
   */
  private refreshElementOnMap(element: NetworkElement): void {
    if (!element) return;
    
    // Si tenemos acceso al servicio del mapa, actualizamos la visualización
    if (this.mapService) {
      // Quitar y volver a agregar el elemento para refrescar su visualización
      this.mapService.clearMap();
      this.renderElements();
    }
  }

  /**
   * Carga los datos de monitoreo de un elemento
   */
  private loadElementMonitoringData(element: NetworkElement): void {
    if (!element || !element.id) {
      this.logger.error('Elemento inválido o sin ID para cargar datos de monitoreo');
      return;
    }
    
    // Si no tenemos acceso al servicio de diseño, no podemos proceder
    if (!this.networkDesignService) {
      this.logger.warn('NetworkDesignService no está disponible');
      return;
    }
    
    this.networkDesignService.getMonitoringData(element.id, element.type)
      .pipe(take(1), catchError(error => {
        this.logger.error('Error cargando datos de monitoreo:', error);
        return of(null as any);
      }))
      .subscribe(data => {
        if (!data) return;
        
        // Actualizar datos de monitoreo en el servicio de estado si está disponible
        if (this.stateService) {
          this.stateService.updateMonitoringData(element.id!, data);
        }
      });
  }

  /**
   * Renderiza todos los elementos en el mapa
   */
  renderElements(): void {
    // Obtener los elementos actuales
    const elements = this.elementsSubject.value;
    let connections: any[] = [];
    
    // Obtener conexiones del estado si está disponible
    if (this.stateService) {
      connections = this.stateService.getCurrentState().connections || [];
    }
    
    // Actualizar el mapa con los elementos y conexiones si el servicio está disponible
    if (this.mapService) {
      this.mapService.updateMapElements(elements, connections);
    }
  }

  /**
   * Conecta dos elementos de red
   */
  connectElements(source: NetworkElement, target: NetworkElement, status = ElementStatus.ACTIVE): void {
    if (!source || !target) {
      this.logger.error('Elementos inválidos para conexión - fuente o destino nulos');
      return;
    }
    
    if (!source.id || !target.id) {
      this.logger.error('Elementos inválidos para conexión - ID de fuente o destino indefinido');
      return;
    }

    // Usar el método correcto del MapService si está disponible
    if (this.mapService) {
      this.mapService.handleConnection(source, target, status);
    }
  }

  /**
   * Agrega un elemento al mapa
   */
  displayElement(element: NetworkElement): void {
    if (!element || !element.position) {
      this.logger.error('Elemento inválido o incompleto para mostrar en el mapa', element);
      return;
    }

    try {
      // Usar el método correcto para agregar elementos si el servicio está disponible
      if (this.mapService) {
        const x = element.position.coordinates?.[0] || 0;
        const y = element.position.coordinates?.[1] || 0;
        this.mapService.addElementAtPosition(element, x, y);
      }
    } catch (error) {
      this.logger.error('Error al mostrar elemento en el mapa:', error);
    }
  }

  /**
   * Crea un nuevo elemento en el mapa
   * @param element Datos del elemento a crear
   * @returns Observable con el elemento creado
   */
  createElement(element: Partial<NetworkElement>): Observable<NetworkElement> {
    // Si no tenemos acceso al servicio de diseño, no podemos proceder
    if (!this.networkDesignService) {
      this.logger.warn('NetworkDesignService no está disponible');
      return throwError(() => new Error('NetworkDesignService no disponible'));
    }
    
    return this.networkDesignService.createElement(element).pipe(
      take(1),
      map(createdElement => {
        // Añadir a la colección local
        this.addElementToCollection(createdElement);
        
        // Notificar a través del bus de eventos
        if (this.eventBus) {
          this.eventBus.emit({
            type: NetworkEventType.ELEMENT_CREATED,
            timestamp: new Date(),
            payload: { element: createdElement },
            source: createdElement.id
          });
        }
        
        return createdElement;
      }),
      catchError(error => {
        this.logger.error('Error creando elemento:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Limpia la caché del servicio, eliminando todos los elementos en memoria
   */
  clearCache(): void {
    this.elementsSubject.next([]);
    this.clearSelection();
    
    // Limpiar el mapa si el servicio está disponible
    if (this.mapService) {
      this.mapService.clearMap();
    }
  }

  /**
   * Actualiza las propiedades de un elemento
   * @param elementId ID del elemento a actualizar
   * @param properties Propiedades a actualizar
   */
  updateElementProperties(elementId: string, properties: Partial<NetworkElement>): Observable<NetworkElement> {
    if (!elementId) {
      this.logger.error('No se puede actualizar un elemento sin ID');
      return of(null as any);
    }
    
    // Obtener el elemento actual del subject
    const currentElements = this.elementsSubject.value;
    const elementIndex = currentElements.findIndex(e => e.id === elementId);
    
    if (elementIndex === -1) {
      this.logger.error(`No se encontró el elemento con ID: ${elementId}`);
      return of(null as any);
    }
    
    // Crear el elemento actualizado
    const updatedElement = {
      ...currentElements[elementIndex],
      ...properties,
      id: elementId // Aseguramos que el ID no cambie
    } as NetworkElement;
    
    // Si no tenemos acceso al servicio de diseño, actualizamos localmente
    if (!this.networkDesignService) {
      this.logger.warn('NetworkDesignService no está disponible, actualizando solo localmente');
      
      // Actualizar el elemento en el subject local
      const newElements = [...currentElements];
      newElements[elementIndex] = updatedElement;
      this.elementsSubject.next(newElements);
      
      // Notificar la actualización a través del bus de eventos
      if (this.eventBus) {
        this.eventBus.emit({
          type: NetworkEventType.ELEMENT_UPDATED,
          timestamp: new Date(),
          payload: { element: updatedElement },
          source: updatedElement.id
        });
      }
      
      return of(updatedElement);
    }
    
    // Actualizar el elemento en el backend
    return this.networkDesignService.updateElement(elementId, updatedElement).pipe(
      take(1),
      map(response => {
        // Actualizar el elemento en el subject local
        const newElements = [...currentElements];
        newElements[elementIndex] = response;
        this.elementsSubject.next(newElements);

        // Actualizar el estado si es necesario y el servicio está disponible
        if (properties.status && this.stateService) {
          this.stateService.updateElementState(response, properties.status);
        }

        // Actualizar la visualización en el mapa
        this.refreshElementOnMap(response);

        // Si el elemento está seleccionado, actualizar la selección
        if (this.selectedElementSubject.value?.id === elementId) {
          this.selectElement(response);
        }

        // Notificar la actualización a través del bus de eventos
        if (this.eventBus) {
          this.eventBus.emit({
            type: NetworkEventType.ELEMENT_UPDATED,
            timestamp: new Date(),
            payload: { element: response },
            source: response.id
          });
        }

        return response;
      }),
      catchError(error => {
        this.logger.error('Error actualizando elemento:', error);
        return of(null as any);
      })
    );
  }

  /**
   * Actualiza la posición de un elemento en el mapa
   * @param elementId ID del elemento a mover
   * @param x Nueva coordenada X
   * @param y Nueva coordenada Y
   */
  updateElementPosition(elementId: string, x: number, y: number): void {
    const element = this.elementsSubject.value.find(e => e.id === elementId);
    if (!element) {
      this.logger.error(`No se encontró el elemento con ID: ${elementId}`);
      return;
    }

    const updatedPosition: GeographicPosition = {
      lat: y,
      lng: x,
      coordinates: [x, y] as [number, number],
      type: element.position?.type || 'Point'
    };

    this.updateElementProperties(elementId, { position: updatedPosition });
  }

  /**
   * Actualiza el estado visual de un elemento
   * @param elementId ID del elemento a actualizar
   * @param status Nuevo estado del elemento
   */
  updateElementVisualState(elementId: string, status: ElementStatus): void {
    const element = this.elementsSubject.value.find(e => e.id === elementId);
    if (!element) {
      this.logger.error(`No se encontró el elemento con ID: ${elementId}`);
      return;
    }

    this.updateElementProperties(elementId, { status });
  }
} 
