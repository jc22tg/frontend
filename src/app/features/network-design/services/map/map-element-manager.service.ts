import { Injectable, NgZone } from '@angular/core';
import { Observable, Subject, of } from 'rxjs';
import { take, catchError, takeUntil } from 'rxjs/operators';
import { ElementService } from '../../services/element.service';
import { NetworkElement, ElementType } from '../../../../shared/types/network.types';
import { LoggerService } from '../../../../core/services/logger.service';

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
  
  constructor(
    private elementService: ElementService,
    private logger: LoggerService,
    private zone: NgZone
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
      
      // Añadir al mapa por ID
      this.elementsById.set(element.id, element);
      
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
      if (element.id.toLowerCase().includes(search)) {
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
   * Limpia recursos al destruir el servicio
   */
  destroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.clear();
  }
} 