import { Injectable } from '@angular/core';
import { LoggerService } from '../../../core/services/logger.service';
import { NetworkElement, NetworkConnection } from '../../../shared/types/network.types';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { debounceTime, tap, switchMap } from 'rxjs/operators';

export interface ViewportBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface LoadingMetrics {
  total: number;
  loaded: number;
  visible: number;
  chunksLoaded: number;
  chunksTotal: number;
  isLoading: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class MapLoaderService {
  // Configuración
  private chunkSize = 200; // Número de elementos por carga
  private viewportMargin = 0.5; // Margen adicional alrededor del viewport (50%)
  private debounceTime = 300; // ms para debounce de eventos de navegación
  
  // Estado de carga
  private allElements: NetworkElement[] = [];
  private allConnections: NetworkConnection[] = [];
  private visibleElements: NetworkElement[] = [];
  private visibleConnections: NetworkConnection[] = [];
  
  // Métricas para UI
  private metricsSubject = new BehaviorSubject<LoadingMetrics>({
    total: 0,
    loaded: 0,
    visible: 0,
    chunksLoaded: 0,
    chunksTotal: 0,
    isLoading: false
  });
  
  // Disparador para actualizar elementos visibles
  private updateViewportSubject = new BehaviorSubject<ViewportBounds | null>(null);
  
  // Observables públicos
  public metrics$ = this.metricsSubject.asObservable();
  public visibleElements$ = new BehaviorSubject<NetworkElement[]>([]);
  public visibleConnections$ = new BehaviorSubject<NetworkConnection[]>([]);
  
  constructor(private logger: LoggerService) {
    // Suscribirse a cambios en el viewport con debounce
    this.updateViewportSubject.pipe(
      debounceTime(this.debounceTime),
      tap(() => this.setLoading(true)),
      switchMap(viewport => this.updateVisibleElements(viewport))
    ).subscribe(() => {
      this.setLoading(false);
    });
  }
  
  /**
   * Configura los elementos completos del mapa
   */
  setElements(elements: NetworkElement[]): void {
    this.allElements = [...elements];
    this.updateMetrics();
    this.logger.debug(`Configurados ${elements.length} elementos en el cargador de mapa`);
  }
  
  /**
   * Configura las conexiones completas del mapa
   */
  setConnections(connections: NetworkConnection[]): void {
    this.allConnections = [...connections];
    this.logger.debug(`Configuradas ${connections.length} conexiones en el cargador de mapa`);
  }
  
  /**
   * Notifica al servicio sobre un cambio en el viewport (zoom o desplazamiento)
   */
  updateViewport(viewport: ViewportBounds): void {
    // Expandir viewport con margen para precargar elementos cercanos
    const expandedViewport = this.expandViewport(viewport, this.viewportMargin);
    this.updateViewportSubject.next(expandedViewport);
  }
  
  /**
   * Configura el tamaño de fragmento para la carga progresiva
   */
  setChunkSize(size: number): void {
    if (size > 0) {
      this.chunkSize = size;
      this.logger.debug(`Tamaño de fragmento de carga configurado a ${size} elementos`);
    }
  }
  
  /**
   * Configura el margen del viewport para precargar elementos
   */
  setViewportMargin(margin: number): void {
    if (margin >= 0) {
      this.viewportMargin = margin;
      this.logger.debug(`Margen de viewport configurado a ${margin * 100}%`);
    }
  }
  
  /**
   * Resetea el estado del cargador
   */
  reset(): void {
    this.visibleElements = [];
    this.visibleConnections = [];
    this.visibleElements$.next([]);
    this.visibleConnections$.next([]);
    this.updateMetrics();
  }
  
  /**
   * Expande un viewport con un margen dado
   */
  private expandViewport(viewport: ViewportBounds, margin: number): ViewportBounds {
    const width = viewport.maxX - viewport.minX;
    const height = viewport.maxY - viewport.minY;
    const marginX = width * margin;
    const marginY = height * margin;
    
    return {
      minX: viewport.minX - marginX,
      minY: viewport.minY - marginY,
      maxX: viewport.maxX + marginX,
      maxY: viewport.maxY + marginY
    };
  }
  
  /**
   * Actualiza los elementos visibles basados en el viewport actual
   */
  private updateVisibleElements(viewport: ViewportBounds | null): Observable<void> {
    if (!viewport) {
      return of(undefined);
    }
    
    // Filtrar elementos que están dentro del viewport
    this.visibleElements = this.allElements.filter(element => {
      // Verificar si el elemento tiene coordenadas y está dentro del viewport
      if (element.position && element.position.coordinates && 
          element.position.coordinates.length >= 2) {
        const x = element.position.coordinates[0];
        const y = element.position.coordinates[1];
        return x >= viewport.minX && x <= viewport.maxX && 
               y >= viewport.minY && y <= viewport.maxY;
      }
      return false;
    });
    
    // Limitar a elementos que se pueden mostrar eficientemente
    const elementsToShow = this.visibleElements.slice(0, this.chunkSize * 5);
    
    // Crear un mapa de IDs de elementos visibles para búsqueda rápida
    const visibleElementIds = new Set(elementsToShow.map(element => element.id).filter(Boolean));
    
    // Filtrar conexiones que conectan elementos visibles
    this.visibleConnections = this.allConnections.filter(connection => 
      visibleElementIds.has(connection.sourceElementId) && visibleElementIds.has(connection.targetElementId)
    );
    
    // Notificar a los suscriptores
    this.visibleElements$.next(elementsToShow);
    this.visibleConnections$.next(this.visibleConnections);
    
    // Actualizar métricas
    this.updateMetrics();
    
    return of(undefined);
  }
  
  /**
   * Actualiza las métricas de carga
   */
  private updateMetrics(): void {
    const totalElements = this.allElements.length;
    const visibleElements = this.visibleElements.length;
    const chunksTotal = Math.ceil(totalElements / this.chunkSize);
    const chunksLoaded = Math.ceil(visibleElements / this.chunkSize);
    
    this.metricsSubject.next({
      total: totalElements,
      loaded: Math.min(totalElements, chunksLoaded * this.chunkSize),
      visible: visibleElements,
      chunksLoaded,
      chunksTotal,
      isLoading: false
    });
  }
  
  /**
   * Actualiza el estado de carga
   */
  private setLoading(isLoading: boolean): void {
    const currentMetrics = this.metricsSubject.value;
    this.metricsSubject.next({
      ...currentMetrics,
      isLoading
    });
  }
  
  /**
   * Verifica si un elemento está dentro del viewport
   */
  isElementInViewport(element: NetworkElement, viewport: ViewportBounds): boolean {
    if (!element.position || !element.position.coordinates || 
        element.position.coordinates.length < 2) {
      return false;
    }
    
    const x = element.position.coordinates[0];
    const y = element.position.coordinates[1];
    
    return x >= viewport.minX && x <= viewport.maxX && 
           y >= viewport.minY && y <= viewport.maxY;
  }
  
  /**
   * Carga forzada de todos los elementos (útil para exportaciones)
   */
  loadAllElements(): void {
    this.visibleElements = [...this.allElements];
    this.visibleConnections = [...this.allConnections];
    this.visibleElements$.next(this.visibleElements);
    this.visibleConnections$.next(this.visibleConnections);
    this.updateMetrics();
  }
  
  /**
   * Busca elementos específicos por ID
   */
  findElementsById(ids: string[]): NetworkElement[] {
    const idSet = new Set(ids);
    return this.allElements.filter(element => element.id && idSet.has(element.id));
  }
} 
