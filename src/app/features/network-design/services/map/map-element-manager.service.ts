import { Injectable, NgZone } from '@angular/core';
import { Observable, Subject, of } from 'rxjs';
import { take, catchError, takeUntil } from 'rxjs/operators';
import { ElementService } from '../../services/element.service';
import { NetworkElement, ElementType, NetworkConnection } from '../../../../shared/types/network.types';
import { LoggerService } from '../../../../core/services/logger.service';
import { ElementFilterDto } from './map-element-filter.dto';
import { HttpClient } from '@angular/common/http';
import * as L from 'leaflet';

/**
 * Interfaz para la respuesta de carga de elementos
 */
export interface ElementLoadResult {
  loadedElements: number;
  totalElements: number;
  success: boolean;
  error?: any;
}

/**
 * Opciones para la carga de elementos
 */
export interface ElementLoadOptions {
  batchSize: number;
  maxElements: number;
  elementsCallback?: (elements: NetworkElement[]) => void;
  progressCallback?: (progress: number) => void;
}

/**
 * Servicio para gestionar la carga y manipulación de elementos del mapa
 * 
 * Este servicio abstrae la lógica de carga progresiva y gestión de elementos,
 * permitiendo una carga eficiente sin bloquear la interfaz de usuario.
 */
@Injectable({
  providedIn: 'root'
})
export class MapElementManagerService {
  /** Subject para gestionar desuscripciones */
  private destroy$ = new Subject<void>();
  
  /** Elementos actualmente cargados */
  private loadedElements: NetworkElement[] = [];
  
  /** Mapa de elementos por ID para acceso rápido */
  private elementsById = new Map<string, NetworkElement>();
  
  /** Mapa de elementos por tipo para filtrado rápido */
  private elementsByType = new Map<ElementType, NetworkElement[]>();

  /** Subject para notificar cambios en elementos */
  private elementsChanged$ = new Subject<void>();
  
  /** Subject para notificar cambios en conexiones */
  private connectionsChanged$ = new Subject<void>();
  
  /** Subject para notificar selección de elemento */
  private elementSelected$ = new Subject<NetworkElement>();
  
  /** Conexiones actualmente cargadas */
  private loadedConnections: NetworkConnection[] = [];
  
  constructor(
    private elementService: ElementService,
    private logger: LoggerService,
    private zone: NgZone,
    private http: HttpClient
  ) {}
  
  /**
   * Carga elementos de forma progresiva
   * @param options Opciones de carga
   * @returns Observable con el resultado de la carga
   */
  loadElementsProgressively(options: ElementLoadOptions): Observable<ElementLoadResult> {
    // Valores por defecto
    const defaultOptions: ElementLoadOptions = {
      batchSize: 50,
      maxElements: 1000
    };
    
    // Combinar opciones
    const opts = { ...defaultOptions, ...options };
    
    // Crear subject para resultado
    const result = new Subject<ElementLoadResult>();
    
    // Limpiar elementos existentes
    this.clear();
    
    // Ejecutar fuera de Angular para mejor rendimiento
    this.zone.runOutsideAngular(() => {
      this.elementService.getAllElements()
        .pipe(
          take(1),
          catchError(error => {
            this.logger.error('Error al cargar elementos:', error);
            result.next({
              loadedElements: 0,
              totalElements: 0,
              success: false,
              error
            });
            result.complete();
            return of([]);
          }),
          takeUntil(this.destroy$)
        )
        .subscribe(elements => {
          const totalElements = elements.length;
          let loadedCount = 0;
          
          const loadBatch = (index: number) => {
            // Calcular índices del lote actual
            const endIndex = Math.min(index + opts.batchSize, Math.min(totalElements, opts.maxElements));
            
            // Obtener elementos del lote
            const batch = elements.slice(index, endIndex);
            
            // Procesar elementos del lote
            this.processElements(batch);
            
            // Actualizar contador
            loadedCount = endIndex;
            
            // Notificar progreso
            if (opts.progressCallback) {
              const progress = Math.round((loadedCount / Math.min(totalElements, opts.maxElements)) * 100);
              // Ejecutar callback en zona de Angular
              this.zone.run(() => opts.progressCallback?.(progress));
            }
            
            // Notificar elementos cargados
            if (opts.elementsCallback) {
              this.zone.run(() => opts.elementsCallback?.(batch));
            }
            
            // Si no hemos terminado, programar el siguiente lote
            if (endIndex < Math.min(totalElements, opts.maxElements)) {
              setTimeout(() => loadBatch(endIndex), 100);
            } else {
              // Hemos terminado, notificar resultado
              this.zone.run(() => {
                result.next({
                  loadedElements: loadedCount,
                  totalElements,
                  success: true
                });
                result.complete();
                
                // Notificar cambio de elementos
                this.elementsChanged$.next();
              });
            }
          };
          
          // Iniciar la carga por lotes
          loadBatch(0);
        });
    });
    
    return result.asObservable();
  }
  
  /**
   * Procesa elementos para organizarlos y almacenarlos internamente
   * @param elements Elementos a procesar
   */
  private processElements(elements: NetworkElement[]): void {
    for (const element of elements) {
      // Añadir a la lista principal
      this.loadedElements.push(element);
      
      // Solo añadir al mapa por ID si tiene un ID válido
      if (element.id) {
        this.elementsById.set(element.id, element);
      } else {
        this.logger.warn('Elemento sin ID ignorado para mapeo ID:', element);
      }
      
      // Añadir al mapa por tipo
      if (!this.elementsByType.has(element.type)) {
        this.elementsByType.set(element.type, []);
      }
      this.elementsByType.get(element.type)?.push(element);
    }
  }
  
  /**
   * Obtiene un elemento por su ID
   * @param id ID del elemento
   * @returns El elemento o undefined si no existe
   */
  getElementById(id: string): NetworkElement | undefined {
    return this.elementsById.get(id);
  }
  
  /**
   * Obtiene todos los elementos de un tipo específico
   * @param type Tipo de elemento
   * @returns Array de elementos del tipo especificado
   */
  getElementsByType(type: ElementType): NetworkElement[] {
    return this.elementsByType.get(type) || [];
  }
  
  /**
   * Obtiene todos los elementos cargados
   * @returns Array con todos los elementos
   */
  getAllElements(): NetworkElement[] {
    this.logger.debug('[MapElementManagerService] getAllElements solicitados');
    return [...this.loadedElements];
  }
  
  /**
   * Obtiene elementos filtrados por una función
   * @param filterFn Función de filtrado
   * @returns Array de elementos filtrados
   */
  getFilteredElements(filterFn: (element: NetworkElement) => boolean): NetworkElement[] {
    return this.loadedElements.filter(filterFn);
  }
  
  /**
   * Filtra elementos por una cadena de búsqueda
   * @param searchText Texto de búsqueda
   * @returns Array de elementos que coinciden con la búsqueda
   */
  searchElements(searchText: string): NetworkElement[] {
    if (!searchText || searchText.trim() === '') {
      return [];
    }
    
    const search = searchText.toLowerCase();
    return this.loadedElements.filter(element => {
      // Buscar en ID
      if (element.id && element.id.toLowerCase().includes(search)) {
        return true;
      }
      
      // Buscar en nombre (si existe)
      if (element.name && element.name.toLowerCase().includes(search)) {
        return true;
      }
      
      // Buscar en descripción (si existe)
      if (element.description && element.description.toLowerCase().includes(search)) {
        return true;
      }
      
      // No se encontró coincidencia
      return false;
    });
  }
  
  /**
   * Limpia todos los elementos almacenados
   */
  clear(): void {
    this.loadedElements = [];
    this.elementsById.clear();
    this.elementsByType.clear();
  }
  
  /**
   * Actualiza un elemento existente
   * @param updatedElement Elemento actualizado
   * @returns Booleano indicando si se actualizó correctamente
   */
  updateElement(updatedElement: NetworkElement): boolean {
    // Verificar si el elemento tiene ID
    if (!updatedElement.id) {
      this.logger.warn('No se puede actualizar un elemento sin ID:', updatedElement);
      return false;
    }

    // Verificar si el elemento existe
    if (!this.elementsById.has(updatedElement.id)) {
      this.logger.warn(`Elemento con ID ${updatedElement.id} no existe para actualizar`);
      return false;
    }
    
    // Obtener elemento original
    const originalElement = this.elementsById.get(updatedElement.id)!;
    
    // Fusionar con el elemento actualizado, manteniendo algunas propiedades originales
    const mergedElement = {
      ...originalElement,
      ...updatedElement,
      // Mantener timestamp de creación original
      createdAt: originalElement.createdAt || new Date(),
      // Actualizar timestamp de modificación
      updatedAt: new Date()
    };
    
    // Actualizar en el mapa y en el arreglo
    this.elementsById.set(updatedElement.id, mergedElement);
    
    // Encontrar y reemplazar en el arreglo
    const index = this.loadedElements.findIndex(el => el.id === updatedElement.id);
    if (index !== -1) {
      this.loadedElements[index] = mergedElement;
    } else {
      this.logger.warn(`Elemento ${updatedElement.id} no encontrado en el arreglo para actualizar`);
    }
    
    // Notificar cambio
    this.elementsChanged$.next();
    
    this.logger.debug(`Elemento actualizado: ${updatedElement.id}`);
    return true;
  }
  
  /**
   * Añade un elemento a la colección
   */
  addElement(element: NetworkElement): void {
    // Asegurarse de que el elemento tiene un ID
    if (!element.id) {
      this.logger.warn('Elemento sin ID no puede ser añadido:', element);
      // Generar un ID si no tiene
      element.id = `element-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      this.logger.debug('ID generado para el elemento:', element.id);
    }

    // Almacenar por ID para rápida referencia
    this.elementsById.set(element.id, element);
    
    // Añadir al arreglo para iteraciones
    this.loadedElements.push(element);
    
    // Emitir evento de elementos actualizados
    this.elementsChanged$.next();
    
    this.logger.debug(`Elemento añadido: ${element.id}, total: ${this.loadedElements.length}`);
  }
  
  /**
   * Elimina un elemento
   * @param elementId ID del elemento a eliminar
   * @returns Booleano indicando si se eliminó correctamente
   */
  removeElement(elementId: string): boolean {
    // Verificar que existe
    if (!this.elementsById.has(elementId)) {
      return false;
    }
    
    try {
      // Obtener el elemento
      const element = this.elementsById.get(elementId)!;
      
      // Eliminar de la colección por tipo
      const typeElements = this.elementsByType.get(element.type);
      if (typeElements) {
        const index = typeElements.findIndex(e => e.id === elementId);
        if (index >= 0) {
          typeElements.splice(index, 1);
        }
      }
      
      // Eliminar de la lista principal
      const mainIndex = this.loadedElements.findIndex(e => e.id === elementId);
      if (mainIndex >= 0) {
        this.loadedElements.splice(mainIndex, 1);
      }
      
      // Eliminar del mapa por ID
      this.elementsById.delete(elementId);
      
      // Notificar cambio
      this.elementsChanged$.next();
      
      return true;
    } catch (error) {
      this.logger.error('Error al eliminar elemento:', error);
      return false;
    }
  }
  
  /**
   * Selecciona un elemento
   * @param elementId ID del elemento a seleccionar
   */
  selectElement(elementId: string): void {
    const element = this.elementsById.get(elementId);
    if (element) {
      this.zone.run(() => {
        this.elementSelected$.next(element);
      });
    }
  }
  
  /**
   * Observable para cambios en elementos
   */
  get elementsChanged(): Observable<void> {
    return this.elementsChanged$.asObservable();
  }
  
  /**
   * Observable para cambios en conexiones
   */
  get connectionsChanged(): Observable<void> {
    return this.connectionsChanged$.asObservable();
  }
  
  /**
   * Observable para selección de elementos
   */
  get elementSelected(): Observable<NetworkElement> {
    return this.elementSelected$.asObservable();
  }
  
  /**
   * Limpia recursos al destruir el servicio
   */
  destroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.clear();
  }
  
  /**
   * Obtiene elementos filtrados desde el backend usando filtros avanzados
   */
  getElementsByFilters(filters: ElementFilterDto) {
    // Reemplaza la URL por la del endpoint real de tu backend
    return this.http.post<NetworkElement[]>('/api/elements/filter', filters);
  }

  getElementsInBounds(bounds: L.LatLngBounds): NetworkElement[] {
    return this.loadedElements.filter(element => {
      if (!element.position) return false;
      const latLng = L.latLng(element.position.lat, element.position.lng);
      return bounds.contains(latLng);
    });
  }

  /**
   * Obtiene todas las conexiones cargadas
   * @returns Array con todas las conexiones
   */
  getAllConnections(): NetworkConnection[] {
    this.logger.debug('[MapElementManagerService] getAllConnections solicitados');
    return [...this.loadedConnections];
  }

  /**
   * Añade una conexión a la colección
   * (Método simplificado para pruebas iniciales)
   */
  addConnection(connection: NetworkConnection): void {
    // TODO: Añadir validación, asegurar que no exista, etc.
    this.loadedConnections.push(connection);
    this.logger.debug(`[MapElementManagerService] Conexión añadida entre ${connection.sourceElementId} y ${connection.targetElementId}. Total: ${this.loadedConnections.length}`);
    this.connectionsChanged$.next(); // Notificar que las conexiones han cambiado
  }

  /**
   * Actualiza una conexión existente.
   * @param updatedConnection La conexión con los datos actualizados.
   * @returns boolean Verdadero si la conexión fue encontrada y actualizada, falso en caso contrario.
   */
  updateConnection(updatedConnection: NetworkConnection): boolean {
    if (!updatedConnection.id) {
      this.logger.warn('[MapElementManagerService] No se puede actualizar una conexión sin ID:', updatedConnection);
      return false;
    }
    const index = this.loadedConnections.findIndex(conn => conn.id === updatedConnection.id);
    if (index !== -1) {
      // Conservar createdAt si no se proporciona en updatedConnection
      const originalConnection = this.loadedConnections[index];
      this.loadedConnections[index] = {
        ...originalConnection, // Mantener propiedades originales como createdAt
        ...updatedConnection,   // Sobrescribir con las actualizadas
        updatedAt: new Date() // Establecer siempre la fecha de actualización
      };
      this.logger.debug(`[MapElementManagerService] Conexión actualizada: ${updatedConnection.id}`);
      this.connectionsChanged$.next();
      return true;
    } else {
      this.logger.warn(`[MapElementManagerService] Conexión con ID ${updatedConnection.id} no encontrada para actualizar.`);
      return false;
    }
  }
} 
