import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, map, tap, delay, shareReplay } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { 
  NetworkElement, 
  ElementType, 
  ElementStatus,
  ElementDetailView,
  ClosureType,
  SealingType
} from '../../../shared/types/network.types';
import { GeoPosition, createGeographicPosition } from '../../../shared/types/geo-position';

// Importamos las interfaces específicas desde element.interface.ts en lugar de network.types.ts
import { 
  IElementService,
  OLT,
  ONT,
  ODF,
  Splitter,
  TerminalBox,
  FiberThread,
  SlackFiber,
  Rack
} from '../interfaces/element.interface';

// AÑADIR NUEVA IMPORTACIÓN PARA EL MODELO EDFA CORRECTO
import { EDFA } from '../../../shared/models/edfa.model';
import { Manga as SharedManga } from '../../../shared/models/manga.model';
import { WavelengthConfig } from '../../../shared/models/wavelength-config.model';

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
      // Usar datos mock si está habilitado el featureFlag correspondiente
      if (environment.featureFlags.enableMockData) {
        this.loggerService.info('Usando datos mock para elementos de red');
        return of(this.getMockElements()).pipe(
          delay(500),
          tap(elements => {
            this.loggerService.debug('Elementos mock cargados:', elements.length);
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
          return of(this.getMockElements()).pipe(delay(500));
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
    // Usar datos mock si está habilitado el featureFlag correspondiente
    if (environment.featureFlags.enableMockData || environment.useMocks) {
      this.loggerService.info('Usando datos mock para crear elemento');
      // Simular respuesta del servidor con delay
      const newElement = {
        ...element,
        id: element.id || this.generateTemporaryId(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Guardar en caché
      const cacheKey = `element-${newElement.id}`;
      this.cacheService.set(cacheKey, newElement, { useLocalStorage: true });
      
      // Actualizar caché de listado completo
      const cachedElements = this.cacheService.get<NetworkElement[]>(this.ELEMENTS_CACHE_KEY, { useLocalStorage: true }) || [];
      cachedElements.push(newElement);
      this.cacheService.set(this.ELEMENTS_CACHE_KEY, cachedElements, { useLocalStorage: true });
      
      this.notifyElementsChanged();
      return of(newElement).pipe(delay(500));
    }
    
    // Si no está habilitado el modo mock, usar API
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
    if (element.type !== ElementType.OLT) return false;
    
    // Verificar si tiene las propiedades requeridas según element.interface.ts
    const e = element as any;
    return (
      typeof e.manufacturer === 'string' && 
      typeof e.model === 'string' && 
      typeof e.portCount === 'number' &&
      typeof e.ponPorts === 'number'
    );
  }

  /**
   * Verifica si un elemento es de tipo ONT
   * @param element Elemento a verificar
   * @returns true si es ONT, false en caso contrario
   */
  isONT(element: NetworkElement): element is (NetworkElement & ONT) {
    if (element.type !== ElementType.ONT) return false;
    
    // Verificar si tiene las propiedades requeridas según element.interface.ts
    const e = element as any;
    return (
      typeof e.manufacturer === 'string' && 
      typeof e.model === 'string' && 
      typeof e.serialNumber === 'string'
    );
  }

  /**
   * Verifica si un elemento es de tipo ODF
   * @param element Elemento a verificar
   * @returns true si es ODF, false en caso contrario
   */
  isODF(element: NetworkElement): element is (NetworkElement & ODF) {
    if (element.type !== ElementType.ODF) return false;
    
    // Verificar si tiene las propiedades requeridas según element.interface.ts
    const e = element as any;
    return (
      typeof e.manufacturer === 'string' && 
      typeof e.model === 'string' && 
      typeof e.totalPortCapacity === 'number' &&
      typeof e.usedPorts === 'number'
    );
  }

  /**
   * Verifica si un elemento es de tipo EDFA
   * @param element Elemento a verificar
   * @returns true si es EDFA, false en caso contrario
   */
  isEDFA(element: NetworkElement): element is NetworkElement & EDFA {
    // Esta implementación asume que `element` puede ser casteado a la `EDFA` importada de shared/models
    // si `element.type` es `ElementType.EDFA`.
    // La definición original de isEDFA en IElementService usa `(NetworkElement & EDFA_local)`
    // donde EDFA_local es la de element.interface.ts
    return element.type === ElementType.EDFA;
  }

  /**
   * Verifica si un elemento es de tipo Splitter
   * @param element Elemento a verificar
   * @returns true si es Splitter, false en caso contrario
   */
  isSplitter(element: NetworkElement): element is (NetworkElement & Splitter) {
    if (element.type !== ElementType.SPLITTER) return false;
    
    // Verificar si tiene las propiedades requeridas según element.interface.ts
    const e = element as any;
    return typeof e.splitRatio === 'string';
  }

  /**
   * Verifica si un elemento es de tipo Manga
   * @param element Elemento a verificar
   * @returns true si es Manga, false en caso contrario
   */
  isManga(element: NetworkElement): element is (NetworkElement & SharedManga) {
    if (element.type !== ElementType.MANGA) return false;
    
    // Verificar si tiene las propiedades requeridas según element.interface.ts
    const e = element as any;
    return (
      typeof e.capacity === 'number' &&
      typeof e.usedCapacity === 'number'
    );
  }

  /**
   * Verifica si un elemento es de tipo TerminalBox
   * @param element Elemento a verificar
   * @returns true si es TerminalBox, false en caso contrario
   */
  isTerminalBox(element: NetworkElement): element is TerminalBox {
    if (element.type !== ElementType.TERMINAL_BOX) return false;
    
    // Verificar si tiene las propiedades requeridas según element.interface.ts
    const e = element as any;
    return (
      typeof e.portCapacity === 'number' &&
      typeof e.usedPorts === 'number'
    );
  }

  /**
   * Verifica si un elemento es de tipo FiberThread (Hilo de Fibra)
   * @param element Elemento a verificar
   * @returns true si es FiberThread, false en caso contrario
   */
  isFiberThread(element: NetworkElement): element is FiberThread {
    if (element.type !== ElementType.FIBER_THREAD) return false;
    
    // Verificar si tiene las propiedades requeridas según element.interface.ts
    const e = element as any;
    return typeof e.length === 'number';
  }

  /**
   * Verifica si un elemento es de tipo SlackFiber
   */
  isSlackFiber(element: NetworkElement): element is SlackFiber {
    return element.type === ElementType.SLACK_FIBER;
  }

  /**
   * Verifica si un elemento es de tipo Rack
   * @param element Elemento a verificar
   * @returns true si es Rack, false en caso contrario
   */
  isRack(element: NetworkElement): element is Rack {
    return element.type === ElementType.RACK;
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
    const baseElement: NetworkElement = {
      id: this.generateTemporaryId(),
      name: `Nuevo ${this.getElementTypeName(type)}`,
      type,
      status: ElementStatus.INACTIVE,
      position: createGeographicPosition(0, 0),
      description: '',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    switch (type) {
      case ElementType.OLT:
        return {
          ...baseElement,
          type: ElementType.OLT,
          manufacturer: 'Proveedor Genérico',
          model: 'Modelo OLT Genérico',
          portCount: 16,
          ponPorts: 4,
          serialNumber: `OLT-${Date.now().toString(36)}`,
          ipAddress: '192.168.1.100',
          macAddress: '00:11:22:33:44:55',
          firmwareVersion: '1.0.0'
        } as OLT;
      case ElementType.ONT:
        return {
          ...baseElement,
          type: ElementType.ONT,
          manufacturer: 'Proveedor Genérico',
          model: 'Modelo ONT Genérico',
          serialNumber: `ONT-${Date.now().toString(36)}`,
          ipAddress: '192.168.1.200',
          macAddress: '00:11:22:33:44:66',
          installationDate: new Date(),
          clientId: undefined
        } as ONT;
      case ElementType.ODF:
        return {
          ...baseElement,
          type: ElementType.ODF,
          manufacturer: 'Proveedor Genérico',
          model: 'Modelo ODF Genérico',
          totalPortCapacity: 48,
          usedPorts: 0,
          installationDate: new Date()
        } as ODF;
      case ElementType.SPLITTER:
        return {
          ...baseElement,
          type: ElementType.SPLITTER,
          manufacturer: 'Proveedor Genérico',
          model: 'Modelo Splitter Genérico',
          splitRatio: '1:8',
          insertionLoss: 10.5,
          serialNumber: `SPL-${Date.now().toString(36)}`,
          installationDate: new Date()
        } as Splitter;
      case ElementType.MANGA:
        return {
          ...baseElement,
          type: ElementType.MANGA,
          manufacturer: 'Proveedor Genérico',
          model: 'Modelo Manga Genérico',
          serialNumber: `MNG-${Date.now().toString(36)}`,
          closureType: ClosureType.UNDERGROUND,
          maxCableEntries: 24,
          maxSpliceCapacity: 48,
          isAerial: false,
          ipRating: 'IP65',
          sealingType: SealingType.MECHANICAL,
          hasSplitter: false,
          usedSplices: 0,
          usedCableEntries: 0,
          installationDate: new Date()
        } as SharedManga;
      case ElementType.TERMINAL_BOX:
        return {
          ...baseElement,
          type: ElementType.TERMINAL_BOX,
          manufacturer: 'Proveedor Genérico',
          model: 'Modelo Terminal Box Genérico',
          portCapacity: 12,
          usedPorts: 0,
          mountingType: 'wall',
          serialNumber: `TB-${Date.now().toString(36)}`,
          installationDate: new Date()
        } as TerminalBox;
      case ElementType.SLACK_FIBER:
        return {
          ...baseElement,
          type: ElementType.SLACK_FIBER,
          length: 30,
          fiberType: undefined
        } as SlackFiber;
      case ElementType.FIBER_THREAD:
        return {
          ...baseElement,
          type: ElementType.FIBER_THREAD,
          length: 100,
          color: 'Azul',
          coreNumber: 1,
          cableId: `CBL-${Date.now().toString(36)}`,
          fiberType: undefined
        } as FiberThread;
      case ElementType.RACK:
        return {
          ...baseElement,
          type: ElementType.RACK,
          manufacturer: 'Fabricante Genérico',
          model: 'Modelo Rack Genérico',
          serialNumber: `RACK-${Date.now().toString(36)}`,
          installationDate: new Date(),
          heightUnits: 42,
          width: 600,
          depth: 1000,
          totalU: 42,
          usedU: 0,
          roomName: 'Sala Principal'
        } as Rack;
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
    if (!element.position || typeof element.position.lat !== 'number' || typeof element.position.lng !== 'number') {
      return 'La posición del elemento es obligatoria y debe tener coordenadas válidas';
    }
    // Validaciones específicas por tipo
    switch (element.type) {
      case ElementType.OLT:
        if (!('portCount' in element) || (element as any).portCount === undefined) {
          return 'El número de puertos es obligatorio para OLT';
        }
        break;
      case ElementType.ODF:
        if (!('totalPortCapacity' in element) || (element as any).totalPortCapacity === undefined) {
          return 'La capacidad total de puertos es obligatoria para ODF';
        }
        break;
      case ElementType.SPLITTER:
        if (!('splitRatio' in element) || !(element as any).splitRatio) {
          return 'La relación de división es obligatoria para Splitter';
        }
        break;
      case ElementType.SLACK_FIBER:
        if (!('length' in element) || (element as any).length === undefined) {
          return 'La longitud es obligatoria para Flojo de Fibra';
        }
        break;
      case ElementType.FIBER_THREAD:
        if (!('length' in element) || (element as any).length === undefined) {
          return 'La longitud es obligatoria para Hilo de Fibra';
        }
        break;
      case ElementType.RACK:
        if (!('heightUnits' in element) || (element as any).heightUnits === undefined) {
          return 'La altura (U) es obligatoria para Rack';
        }
        if (!('width' in element) || (element as any).width === undefined) {
          return 'El ancho es obligatorio para Rack';
        }
        if (!('depth' in element) || (element as any).depth === undefined) {
          return 'La profundidad es obligatoria para Rack';
        }
        if (!('totalU' in element) || (element as any).totalU === undefined) {
          return 'El total de unidades U es obligatorio para Rack';
        }
        if (!('usedU' in element) || (element as any).usedU === undefined) {
          return 'Las unidades U utilizadas son obligatorias para Rack';
        }
        if (!('roomName' in element) || !(element as any).roomName) {
          return 'El nombre de la sala es obligatorio para Rack';
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
  private handleError = (error: HttpErrorResponse): Observable<never> => {
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
        name: 'OLT Central Norte',
        type: ElementType.OLT,
        status: ElementStatus.ACTIVE,
        position: createGeographicPosition(18.4821, -69.9312),
        description: 'OLT principal del sector norte'
      },
      {
        id: 'odf-001',
        name: 'ODF Zona Norte 1',
        type: ElementType.ODF,
        status: ElementStatus.ACTIVE,
        position: createGeographicPosition(18.4835, -69.9287),
        description: 'Distribuidor de fibra óptica para la zona norte'
      },
      {
        id: 'splitter-001',
        name: 'Splitter 1:8 Zona Norte',
        type: ElementType.SPLITTER,
        status: ElementStatus.ACTIVE,
        position: createGeographicPosition(18.4845, -69.9276),
        description: 'Splitter principal para distribución residencial'
      },
      {
        id: 'ont-001',
        name: 'ONT Cliente Residencial',
        type: ElementType.ONT,
        status: ElementStatus.ACTIVE,
        position: createGeographicPosition(18.4842, -69.9265),
        description: 'ONT instalada en cliente residencial'
      },
      {
        id: 'edfa-001',
        name: 'Amplificador Troncal',
        type: ElementType.EDFA,
        status: ElementStatus.ACTIVE,
        position: createGeographicPosition(18.4815, -69.9340),
        description: 'Amplificador para enlace de larga distancia'
      },
      {
        id: 'manga-001',
        name: 'Manga Av. Principal',
        type: ElementType.MANGA,
        status: ElementStatus.ACTIVE,
        position: createGeographicPosition(18.4827, -69.9299),
        description: 'Manga para empalmes de fibra en avenida principal'
      },
      {
        id: 'slack-001',
        name: 'Flojo de Fibra Principal',
        type: ElementType.SLACK_FIBER,
        status: ElementStatus.ACTIVE,
        position: createGeographicPosition(18.4850, -69.9300),
        description: 'Reserva de cable de fibra óptica',
        properties: { length: 30 }
      },
      {
        id: 'fiber-001',
        name: 'Hilo de Fibra Azul',
        type: ElementType.FIBER_THREAD,
        status: ElementStatus.ACTIVE,
        position: createGeographicPosition(18.4860, -69.9310),
        description: 'Hilo de fibra individual para pruebas',
        properties: { length: 100, color: 'Azul' }
      }
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
          return (
            element.name?.toLowerCase().includes(searchTerm) ||
            element.description?.toLowerCase().includes(searchTerm) ||
            (element.id && element.id.toLowerCase().includes(searchTerm))
          );
        });
      })
    );
  }
} 
