import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, map, tap, delay, shareReplay } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { 
  NetworkElement, 
  ElementType, 
  ElementStatus, 
  OLT, 
  ONT, 
  ODF, 
  EDFA, 
  Splitter, 
  Manga, 
  MSAN, 
  TerminalBox,
  FiberThread,
  GeographicPosition,
  Accessibility,
  ODFType,
  NetworkConnection,
  createPosition
} from '../../../shared/types/network.types';
import { IElementService } from '../interfaces/element.interface';
import { LoggerService } from '../../../core/services/logger.service';
import { ELEMENT_TYPE_NAMES, ELEMENT_STATUS_CLASSES } from '../../../shared/constants/network.constants';
import { CacheService, CacheOptions } from '../../../shared/services/cache.service';
import { UtilsService } from '../../../shared/services/utils.service';

/**
 * Servicio para manejar la lógica relacionada con los elementos de red
 * Implementa la interfaz IElementService
 */
@Injectable({
  providedIn: 'root'
})
export class ElementService implements IElementService {
  private apiUrl = `${environment.apiUrl}/elements`;
  private ELEMENTS_CACHE_KEY = 'network-elements';
  
  // Subject para notificar cambios en los elementos
  private elementsChangedSubject = new BehaviorSubject<boolean>(false);
  public elementsChanged$ = this.elementsChangedSubject.asObservable();

  constructor(
    private http: HttpClient,
    private loggerService: LoggerService,
    private cacheService: CacheService,
    private utilsService: UtilsService
  ) {}

  /**
   * Obtiene todos los elementos de red
   * Implementa caché para mejorar rendimiento
   */
  getAllElements(): Observable<NetworkElement[]> {
    try {
      // Si useMocks está habilitado en environment, devolver elementos simulados
      if (environment.useMocks) {
        this.loggerService.info('Usando datos mock para elementos de red');
        return of(this.getMockElements()).pipe(
          delay(environment.mockDelay),
          tap(elements => {
            this.loggerService.debug('Elementos mock cargados:', elements.length);
            // Guardar elementos en caché
            this.cacheService.set(this.ELEMENTS_CACHE_KEY, elements, { useLocalStorage: true });
            this.notifyElementsChanged();
          })
        );
      }

      // Intentar obtener elementos del API
      return this.http.get<NetworkElement[]>(this.apiUrl).pipe(
        tap(elements => {
          this.loggerService.debug('Elementos obtenidos:', elements?.length);
          // Guardar elementos en caché
          this.cacheService.set(this.ELEMENTS_CACHE_KEY, elements, { useLocalStorage: true });
        }),
        catchError(error => {
          this.loggerService.error('Error al obtener elementos:', error);
          
          // Si hay error de conexión, intentar usar la caché
          const cachedElements = this.cacheService.get<NetworkElement[]>(this.ELEMENTS_CACHE_KEY, { useLocalStorage: true });
          if (cachedElements && cachedElements.length > 0) {
            this.loggerService.info('Usando elementos en caché:', cachedElements.length);
            return of(cachedElements);
          }
          
          // Si no hay caché, devolver datos mock
          this.loggerService.info('Sin caché disponible, usando elementos mock');
          return of(this.getMockElements()).pipe(
            delay(environment.mockDelay || 500)
          );
        }),
        // Compartir la respuesta entre múltiples suscriptores
        shareReplay(1)
      );
    } catch (error) {
      this.loggerService.error('Error inesperado en getAllElements:', error);
      return of(this.getMockElements());
    }
  }

  /**
   * Obtiene un elemento por su ID
   * Primero busca en caché, luego en API
   */
  getElementById(id: string): Observable<NetworkElement> {
    // Comprobar si existe en caché
    const cacheKey = `element-${id}`;
    const cachedElement = this.cacheService.get<NetworkElement>(cacheKey);
    
    if (cachedElement) {
      return of(cachedElement);
    }
    
    // Si no está en caché, obtener de la API
    return this.http.get<NetworkElement>(`${this.apiUrl}/${id}`).pipe(
      tap(element => {
        // Guardar en caché
        this.cacheService.set(cacheKey, element, { useLocalStorage: true });
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Crea un nuevo elemento
   */
  createElement(element: NetworkElement): Observable<NetworkElement> {
    return this.http.post<NetworkElement>(this.apiUrl, element).pipe(
      tap(newElement => {
        if (newElement.id) {
          // Actualizar caché individual
          const cacheKey = `element-${newElement.id}`;
          this.cacheService.set(cacheKey, newElement, { useLocalStorage: true });
          
          // Actualizar caché de listado completo
          this.invalidateElementsCache();
          this.notifyElementsChanged();
        }
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Actualiza un elemento existente
   */
  updateElement(id: string, element: NetworkElement): Observable<NetworkElement> {
    return this.http.put<NetworkElement>(`${this.apiUrl}/${id}`, element).pipe(
      tap(updatedElement => {
        // Actualizar caché individual
        const cacheKey = `element-${id}`;
        this.cacheService.set(cacheKey, updatedElement, { useLocalStorage: true });
        
        // Actualizar caché de listado completo
        this.invalidateElementsCache();
        this.notifyElementsChanged();
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Elimina un elemento
   */
  deleteElement(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        // Eliminar de caché
        const cacheKey = `element-${id}`;
        this.cacheService.remove(cacheKey, { useLocalStorage: true });
        
        // Actualizar caché de listado completo
        this.invalidateElementsCache();
        this.notifyElementsChanged();
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Obtiene el nombre del tipo de elemento en formato legible
   * @param type Tipo de elemento
   * @returns Nombre del tipo en formato legible
   */
  getElementTypeName(type: ElementType): string {
    return ElementType[type] || 'Desconocido';
  }

  /**
   * Obtiene la clase CSS para el estado del elemento
   * @param status Estado del elemento
   * @returns Clase CSS correspondiente
   */
  getElementStatusClass(status: ElementStatus): string {
    return ElementStatus[status] || '';
  }

  /**
   * Obtiene una propiedad específica de un elemento según su tipo
   * @param element Elemento de red
   * @param property Nombre de la propiedad a obtener
   * @returns Valor de la propiedad o null si no existe
   */
  getElementProperty<T extends NetworkElement, K extends keyof T>(element: T, property: K): T[K] {
    return element[property];
  }

  /**
   * Verifica si un elemento es de tipo OLT
   * @param element Elemento a verificar
   * @returns true si es OLT, false en caso contrario
   */
  isOLT(element: NetworkElement): element is (NetworkElement & OLT) {
    const isOlt = element.type === ElementType.OLT;
    if (!isOlt) return false;

    // Verificación de campos requeridos en interfaces/element.interface.ts
    const oltElement = element as any;
    return (
      typeof oltElement.manufacturer === 'string' &&
      typeof oltElement.model === 'string' &&
      typeof oltElement.portCount === 'number' &&
      typeof oltElement.ponPorts === 'number'
    );
  }

  /**
   * Verifica si un elemento es de tipo ONT
   * @param element Elemento a verificar
   * @returns true si es ONT, false en caso contrario
   */
  isONT(element: NetworkElement): element is (NetworkElement & ONT) {
    const isOnt = element.type === ElementType.ONT;
    if (!isOnt) return false;

    // Verificación de campos requeridos en interfaces/element.interface.ts
    const ontElement = element as any;
    return (
      typeof ontElement.manufacturer === 'string' &&
      typeof ontElement.model === 'string' &&
      typeof ontElement.serialNumber === 'string'
    );
  }

  /**
   * Verifica si un elemento es de tipo ODF
   * @param element Elemento a verificar
   * @returns true si es ODF, false en caso contrario
   */
  isODF(element: NetworkElement): element is (NetworkElement & ODF) {
    const isOdf = element.type === ElementType.ODF;
    if (!isOdf) return false;

    // Verificación de campos requeridos en interfaces/element.interface.ts
    const odfElement = element as any;
    return (
      typeof odfElement.manufacturer === 'string' &&
      typeof odfElement.model === 'string' &&
      typeof odfElement.totalPortCapacity === 'number' &&
      typeof odfElement.usedPorts === 'number'
    );
  }

  /**
   * Verifica si un elemento es de tipo EDFA
   * @param element Elemento a verificar
   * @returns true si es EDFA, false en caso contrario
   */
  isEDFA(element: NetworkElement): element is (NetworkElement & EDFA) {
    const isEdfa = element.type === ElementType.EDFA;
    if (!isEdfa) return false;

    // Verificación de campos requeridos en interfaces/element.interface.ts
    const edfaElement = element as any;
    return (
      typeof edfaElement.manufacturer === 'string' &&
      typeof edfaElement.model === 'string' &&
      typeof edfaElement.gainDb === 'number' &&
      edfaElement.inputPowerRange !== undefined
    );
  }

  /**
   * Verifica si un elemento es de tipo Splitter
   * @param element Elemento a verificar
   * @returns true si es Splitter, false en caso contrario
   */
  isSplitter(element: NetworkElement): element is (NetworkElement & Splitter) {
    const isSplitter = element.type === ElementType.SPLITTER;
    if (!isSplitter) return false;

    // Verificación de campos requeridos en interfaces/element.interface.ts
    const splitterElement = element as any;
    return (
      typeof splitterElement.splitRatio === 'string'
    );
  }

  /**
   * Verifica si un elemento es de tipo Manga
   * @param element Elemento a verificar
   * @returns true si es Manga, false en caso contrario
   */
  isManga(element: NetworkElement): element is (NetworkElement & Manga) {
    const isManga = element.type === ElementType.MANGA;
    if (!isManga) return false;

    // Verificación de campos requeridos en interfaces/element.interface.ts
    const mangaElement = element as any;
    return (
      typeof mangaElement.capacity === 'number' &&
      typeof mangaElement.usedCapacity === 'number'
    );
  }

  /**
   * Verifica si un elemento es de tipo MSAN
   * @param element Elemento a verificar
   * @returns true si es MSAN, false en caso contrario
   */
  isMSAN(element: NetworkElement): element is MSAN {
    return element && element.type === ElementType.MSAN;
  }

  /**
   * Verifica si un elemento es de tipo TerminalBox
   * @param element Elemento a verificar
   * @returns true si es TerminalBox, false en caso contrario
   */
  isTerminalBox(element: NetworkElement): element is TerminalBox {
    const isTerminalBox = element.type === ElementType.TERMINAL_BOX;
    if (!isTerminalBox) return false;

    // Verificación de campos requeridos en interfaces/element.interface.ts
    const terminalElement = element as any;
    return (
      typeof terminalElement.portCapacity === 'number' &&
      typeof terminalElement.usedPorts === 'number'
    );
  }

  /**
   * Verifica si un elemento es de tipo FiberThread (Hilo de Fibra)
   * @param element Elemento a verificar
   * @returns true si es FiberThread, false en caso contrario
   */
  isFiberThread(element: NetworkElement): element is FiberThread {
    const isFiberThread = element.type === ElementType.FIBER_THREAD;
    if (!isFiberThread) return false;

    // Verificación de campos requeridos en interfaces/element.interface.ts
    const fiberElement = element as any;
    return (
      typeof fiberElement.length === 'number'
    );
  }

  /**
   * Formatea el tamaño del archivo para mostrar en pantalla
   * NOTA: Ahora usa el UtilsService centralizado
   */
  formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }

  /**
   * Crea un elemento con propiedades por defecto según su tipo
   */
  createDefaultElement(type: ElementType): NetworkElement {
    const defaultAccessibility: Accessibility = {
      needsPermission: false,
      isLocked: false,
      hasRestrictedAccess: false
    };
    
    const baseElement: NetworkElement = {
      id: this.generateTemporaryId(),
      code: `NEW-${type}-${Date.now().toString(36)}`,
      name: `Nuevo ${this.getElementTypeName(type)}`,
      type,
      status: ElementStatus.INACTIVE,
      position: createPosition([0, 0]),
      description: '',
      accessibility: defaultAccessibility,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Añadir propiedades específicas según el tipo
    switch (type) {
      case ElementType.OLT:
        return {
          ...baseElement,
          type: ElementType.OLT,
          model: 'Modelo OLT Genérico',
          manufacturer: 'Proveedor Genérico',
          portCount: 16,
          slotCount: 4
        } as OLT;
      case ElementType.ONT:
        return {
          ...baseElement,
          type: ElementType.ONT,
          serialNumber: `ONT-${Date.now().toString(36)}`,
          model: 'Modelo ONT Genérico',
          manufacturer: 'Proveedor Genérico',
          clientId: undefined
        } as ONT;
      case ElementType.ODF:
        return {
          ...baseElement,
          type: ElementType.ODF,
          odfType: ODFType.PRIMARY,
          totalPortCapacity: 16,
          usedPorts: 0,
          manufacturer: 'Proveedor Genérico',
          model: 'Modelo ODF Genérico',
          installationDate: new Date(),
          mountingType: 'wall'
        } as ODF;
      case ElementType.SPLITTER:
        return {
          ...baseElement,
          type: ElementType.SPLITTER,
          splitRatio: '1:8',
          insertionLossDb: 10.5,
          level: 1,
          totalPorts: 8,
          usedPorts: 0
        } as Splitter;
      default:
        return baseElement;
    }
  }

  /**
   * Genera un ID único temporal para nuevos elementos
   * NOTA: Ahora usa el UtilsService centralizado
   */
  generateTemporaryId(): string {
    return this.utilsService.generateUniqueId('temp-element');
  }

  /**
   * Valida un elemento antes de guardarlo
   * @returns true si es válido, mensaje de error si no lo es
   */
  validateElement(element: NetworkElement): true | string {
    // Validaciones básicas
    if (!element.name || element.name.trim() === '') {
      return 'El nombre del elemento es obligatorio';
    }

    if (!element.type) {
      return 'El tipo de elemento es obligatorio';
    }

    if (!element.position || !element.position.coordinates || 
        element.position.coordinates.length < 2) {
      return 'La posición del elemento es obligatoria y debe tener coordenadas válidas';
    }

    // Validar posición geográfica
    if (element.position.coordinates.length >= 2) {
      const [lon, lat] = element.position.coordinates;
      if (!this.utilsService.validateCoordinates(lat, lon)) {
        return 'Las coordenadas geográficas no son válidas';
      }
    }

    // Validaciones específicas por tipo
    switch (element.type) {
      case ElementType.OLT:
        if (!('ports' in element) || element.ports === undefined) {
          return 'El número de puertos es obligatorio para OLT';
        }
        break;
      case ElementType.ODF:
        if (!('totalPortCapacity' in element) || element.totalPortCapacity === undefined) {
          return 'La capacidad total de puertos es obligatoria para ODF';
        }
        break;
      case ElementType.SPLITTER:
        if (!('ratio' in element) || !element.ratio) {
          return 'La relación de división es obligatoria para Splitter';
        }
        break;
    }

    return true;
  }

  /**
   * Notifica que los elementos han cambiado
   */
  private notifyElementsChanged(): void {
    this.elementsChangedSubject.next(true);
  }

  /**
   * Maneja errores HTTP
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Error desconocido';
    
    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Error del lado del servidor
      errorMessage = `Código: ${error.status}, Mensaje: ${error.message}`;
    }
    
    this.loggerService.error(errorMessage, error);
    return throwError(() => new Error(errorMessage));
  }

  /**
   * Invalida la caché de listado de elementos
   */
  private invalidateElementsCache(): void {
    this.cacheService.remove(this.ELEMENTS_CACHE_KEY, { useLocalStorage: true });
  }

  /**
   * Limpia la caché completa
   */
  clearCache(): void {
    // Eliminar la caché de elementos
    this.cacheService.remove(this.ELEMENTS_CACHE_KEY, { useLocalStorage: true });
    
    // Eliminar todas las entradas de caché relacionadas con elementos individuales
    this.cacheService.cleanExpired(0); // Usando 0 para forzar la limpieza de todas las entradas
    
    this.notifyElementsChanged();
  }

  /**
   * Invalida una entrada específica de la caché
   */
  invalidateCacheEntry(id: string): void {
    const cacheKey = `element-${id}`;
    this.cacheService.remove(cacheKey, { useLocalStorage: true });
  }

  /**
   * Genera elementos de red simulados para desarrollo y pruebas
   * @returns Array de elementos simulados
   */
  private getMockElements(): NetworkElement[] {
    return [
      {
        id: 'olt-001',
        code: 'OLT-CENTRAL-001',
        name: 'OLT Central Norte',
        type: ElementType.OLT,
        status: ElementStatus.ACTIVE,
        position: {
          coordinates: [-69.9312, 18.4821]
        },
        description: 'OLT principal del sector norte'
      } as NetworkElement,
      {
        id: 'odf-001',
        code: 'ODF-N-001',
        name: 'ODF Zona Norte 1',
        type: ElementType.ODF,
        status: ElementStatus.ACTIVE,
        position: {
          coordinates: [-69.9287, 18.4835]
        },
        description: 'Distribuidor de fibra óptica para la zona norte'
      } as NetworkElement,
      {
        id: 'splitter-001',
        code: 'SPL-N1-001',
        name: 'Splitter 1:8 Zona Norte',
        type: ElementType.SPLITTER,
        status: ElementStatus.ACTIVE,
        position: {
          coordinates: [-69.9276, 18.4845]
        },
        description: 'Splitter principal para distribución residencial'
      } as NetworkElement,
      {
        id: 'ont-001',
        code: 'ONT-N1-001',
        name: 'ONT Cliente Residencial',
        type: ElementType.ONT,
        status: ElementStatus.ACTIVE,
        position: {
          coordinates: [-69.9265, 18.4842]
        },
        description: 'ONT instalada en cliente residencial'
      } as NetworkElement,
      {
        id: 'ont-002',
        code: 'ONT-N1-002',
        name: 'ONT Cliente Comercial',
        type: ElementType.ONT,
        status: ElementStatus.MAINTENANCE,
        position: {
          coordinates: [-69.9277, 18.4857]
        },
        description: 'ONT instalada en cliente comercial - en mantenimiento'
      } as NetworkElement,
      {
        id: 'edfa-001',
        code: 'EDFA-TR-001',
        name: 'Amplificador Troncal',
        type: ElementType.EDFA,
        status: ElementStatus.ACTIVE,
        position: {
          coordinates: [-69.9340, 18.4815]
        },
        description: 'Amplificador para enlace de larga distancia'
      } as NetworkElement,
      {
        id: 'manga-001',
        code: 'MNG-N1-001',
        name: 'Manga Av. Principal',
        type: ElementType.MANGA,
        status: ElementStatus.ACTIVE,
        position: {
          coordinates: [-69.9299, 18.4827]
        },
        description: 'Manga para empalmes de fibra en avenida principal'
      } as NetworkElement,
      {
        id: 'odf-002',
        code: 'ODF-E-001',
        name: 'ODF Zona Este',
        type: ElementType.ODF,
        status: ElementStatus.FAULT,
        position: {
          coordinates: [-69.9257, 18.4812]
        },
        description: 'Distribuidor de fibra óptica para la zona este - con falla'
      } as NetworkElement,
      {
        id: 'msan-001',
        code: 'MSAN-N1-001',
        name: 'MSAN Sector Comercial',
        type: ElementType.MSAN,
        status: ElementStatus.ACTIVE,
        position: {
          coordinates: [-69.9302, 18.4848]
        },
        description: 'MSAN para servicios múltiples en sector comercial'
      } as NetworkElement
    ];
  }

  /**
   * Obtiene elementos por tipo
   * @param type Tipo de elemento a filtrar
   * @returns Observable con elementos filtrados por tipo
   */
  getElementsByType(type: ElementType): Observable<NetworkElement[]> {
    return this.getAllElements().pipe(
      map(elements => elements.filter(element => element.type === type))
    );
  }

  /**
   * Busca elementos por término de búsqueda
   * @param term Término de búsqueda
   * @returns Observable con los elementos que coinciden con el término
   */
  searchByTerm(term: string): Observable<NetworkElement[]> {
    return this.getAllElements().pipe(
      map(elements => {
        if (!term || term.trim() === '') {
          return elements;
        }
        
        const searchTerm = term.toLowerCase().trim();
        return elements.filter(element => {
          // Buscar en diferentes propiedades del elemento
          return (
            element.name?.toLowerCase().includes(searchTerm) ||
            element.code?.toLowerCase().includes(searchTerm) ||
            element.description?.toLowerCase().includes(searchTerm) ||
            (element.id && element.id.toLowerCase().includes(searchTerm))
          );
        });
      })
    );
  }
} 