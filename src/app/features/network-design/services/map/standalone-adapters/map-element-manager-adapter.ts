import { Injectable } from '@angular/core';
import { Observable, Subject, of } from 'rxjs';
import { NetworkElement, ElementType, NetworkConnection } from '../../../../../shared/types/network.types';
import { MapElementManagerService } from '../map-element-manager.service';
import { LoggerService } from '../../../../../core/services/logger.service';

/**
 * Adaptador para MapElementManagerService compatible con componentes standalone
 * 
 * Este adaptador proporciona una interfaz moderna y consistente para acceder
 * a las funcionalidades del gestor de elementos del mapa desde componentes standalone.
 */
@Injectable({
  providedIn: 'root'
})
export class MapElementManagerAdapter {
  /** Subject para cambios en elementos */
  private elementsChangedSubject = new Subject<void>();
  
  /** Elemento seleccionado actualmente */
  private selectedElement: NetworkElement | null = null;
  
  constructor(
    private elementManager: MapElementManagerService,
    private logger: LoggerService
  ) {
    // Suscribirse a cambios del servicio original
    this.elementManager.elementsChanged.subscribe(() => {
      this.elementsChangedSubject.next();
    });
  }
  
  /**
   * Observable para cambios en elementos
   */
  get elementsChanged(): Observable<void> {
    return this.elementsChangedSubject.asObservable();
  }
  
  /**
   * Obtiene todos los elementos
   */
  getAllElements(): NetworkElement[] {
    try {
      return this.elementManager.getAllElements();
    } catch (error) {
      this.logger.error('Error al obtener elementos en el adaptador', error);
      return [];
    }
  }
  
  /**
   * Obtiene un elemento por su ID
   * @param id ID del elemento
   */
  getElementById(id: string): NetworkElement | undefined {
    try {
      return this.elementManager.getElementById(id);
    } catch (error) {
      this.logger.error(`Error al obtener elemento con ID ${id} en el adaptador`, error);
      return undefined;
    }
  }
  
  /**
   * Obtiene elementos por tipo
   * @param type Tipo de elemento a buscar
   */
  getElementsByType(type: ElementType): NetworkElement[] {
    try {
      return this.elementManager.getElementsByType(type);
    } catch (error) {
      this.logger.error(`Error al obtener elementos de tipo ${type} en el adaptador`, error);
      return [];
    }
  }
  
  /**
   * Selecciona un elemento por su ID
   * @param id ID del elemento a seleccionar
   */
  selectElement(id: string): void {
    try {
      this.elementManager.selectElement(id);
      this.selectedElement = this.getElementById(id) || null;
    } catch (error) {
      this.logger.error(`Error al seleccionar elemento con ID ${id} en el adaptador`, error);
    }
  }
  
  /**
   * Deselecciona el elemento actualmente seleccionado
   */
  deselectElement(): void {
    try {
      // El servicio original no tiene este método, lo manejamos internamente
      this.selectedElement = null;
    } catch (error) {
      this.logger.error('Error al deseleccionar elemento en el adaptador', error);
    }
  }
  
  /**
   * Obtiene el elemento seleccionado actualmente
   */
  getSelectedElement(): NetworkElement | null {
    return this.selectedElement;
  }
  
  /**
   * Busca elementos por texto
   * @param searchText Texto a buscar
   */
  searchElements(searchText: string): NetworkElement[] {
    try {
      return this.elementManager.searchElements(searchText);
    } catch (error) {
      this.logger.error(`Error al buscar elementos con texto "${searchText}" en el adaptador`, error);
      return [];
    }
  }
  
  /**
   * Añade un nuevo elemento
   * @param element Elemento a añadir
   */
  addElement(element: NetworkElement): void {
    try {
      console.log('MapElementManagerAdapter: Añadiendo elemento', element);
      
      // Verificar que el elemento tiene todos los campos necesarios
      if (!element || !element.type) {
        this.logger.error('Elemento inválido para añadir', element);
        return;
      }
      
      // Asegurar que el elemento tiene una posición válida
      if (!element.position || typeof element.position.lat !== 'number' || typeof element.position.lng !== 'number') {
        this.logger.error('Posición inválida para añadir elemento', element);
        return;
      }
      
      // Añadir el elemento al gestor
      this.elementManager.addElement(element);
      this.logger.debug(`Elemento añadido correctamente: ${element.id}, tipo: ${element.type}`);
      
      // Notificar a los observadores
      this.elementsChangedSubject.next();
    } catch (error) {
      this.logger.error('Error al añadir elemento en el adaptador', error);
    }
  }
  
  /**
   * Actualiza un elemento existente
   * @param element Elemento a actualizar
   */
  updateElement(element: NetworkElement): boolean {
    try {
      return this.elementManager.updateElement(element);
    } catch (error) {
      this.logger.error(`Error al actualizar elemento con ID ${element.id} en el adaptador`, error);
      return false;
    }
  }
  
  /**
   * Elimina un elemento por su ID
   * @param id ID del elemento a eliminar
   */
  removeElement(id: string): boolean {
    try {
      return this.elementManager.removeElement(id);
    } catch (error) {
      this.logger.error(`Error al eliminar elemento con ID ${id} en el adaptador`, error);
      return false;
    }
  }

  /**
   * Añade una nueva conexión
   * @param connection Conexión a añadir
   */
  addConnection(connection: NetworkConnection): Observable<NetworkConnection> {
    try {
      // Delegar al servicio subyacente MapElementManagerService
      this.elementManager.addConnection(connection);
      this.logger.info('[MapElementManagerAdapter] addConnection llamada a elementManager', connection);
      return of(connection);
    } catch (error) {
      this.logger.error('[MapElementManagerAdapter] Error al intentar añadir conexión vía elementManager', error);
      throw error;
    }
  }

  /**
   * Actualiza una conexión existente a través del servicio subyacente.
   * @param connection Conexión a actualizar.
   * @returns Observable<boolean> indicando si la actualización fue exitosa.
   */
  updateConnection(connection: NetworkConnection): Observable<boolean> {
    try {
      const success = this.elementManager.updateConnection(connection);
      this.logger.info('[MapElementManagerAdapter] updateConnection llamada a elementManager', connection, `Success: ${success}`);
      return of(success);
    } catch (error) {
      this.logger.error('[MapElementManagerAdapter] Error al intentar actualizar conexión vía elementManager', error);
      // Podríamos devolver of(false) o lanzar el error dependiendo de cómo se quiera manejar.
      return of(false); 
    }
  }

  /**
   * Actualiza la posición de un elemento
   * @param elementId ID del elemento
   * @param lng Longitud (coordenada X)
   * @param lat Latitud (coordenada Y)
   * @returns Booleano indicando si la actualización fue exitosa
   */
  updateElementPosition(elementId: string, lng: number, lat: number): boolean {
    try {
      console.log(`MapElementManagerAdapter: Actualizando posición del elemento ${elementId} a [${lat}, ${lng}]`);
      
      // Obtener el elemento actual
      const element = this.getElementById(elementId);
      if (!element) {
        this.logger.error(`No se encontró el elemento con ID ${elementId} para actualizar posición`);
        return false;
      }
      
      // Crear una copia actualizada del elemento con la nueva posición
      const updatedElement: NetworkElement = {
        ...element,
        position: {
          lat: lat,
          lng: lng,
          coordinates: [lng, lat],
          type: 'Point'
        }
      };
      
      // Actualizar el elemento usando el método existente
      const success = this.updateElement(updatedElement);
      
      if (success) {
        this.logger.debug(`Posición del elemento ${elementId} actualizada correctamente`);
        // Notificar a los observadores sobre el cambio
        this.elementsChangedSubject.next();
      }
      
      return success;
    } catch (error) {
      this.logger.error(`Error al actualizar posición del elemento ${elementId}:`, error);
      return false;
    }
  }
} 
