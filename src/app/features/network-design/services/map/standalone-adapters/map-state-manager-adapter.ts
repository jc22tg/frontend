import { Injectable } from '@angular/core';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MapStateManagerService, ToolType } from '../map-state-manager.service';
import { LoggerService } from '../../../../../core/services/logger.service';
import { ElementType } from '../../../../../shared/types/network.types';
import { NetworkStateService } from '../../network-state.service';

/**
 * Interfaz para capa del mapa
 */
interface MapLayer {
  id: string;
  name: string;
  visible: boolean;
  type: 'base' | 'overlay';
  icon?: string;
  description?: string;
  order: number;
}

/**
 * Adaptador para MapStateManagerService compatible con componentes standalone
 * 
 * Este adaptador proporciona una interfaz moderna y consistente para acceder
 * a las funcionalidades del gestor de estado del mapa desde componentes standalone.
 */
@Injectable({
  providedIn: 'root'
})
export class MapStateManagerAdapter {
  // Subjects para cambios en el estado
  private layerChangesSubject = new Subject<void>();
  private activeToolSubject = new BehaviorSubject<ToolType>('pan');
  private activeLayersSubject = new BehaviorSubject<ElementType[]>([]);
  private mapReadySubject = new BehaviorSubject<boolean>(false);
  private darkModeSubject = new BehaviorSubject<boolean>(false);
  
  // Cleanup
  private destroy$ = new Subject<void>();
  
  constructor(
    private stateManager: MapStateManagerService,
    private logger: LoggerService,
    private networkStateService: NetworkStateService
  ) {
    // Suscribirse a cambios del servicio original
    this.stateManager.layerChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.layerChangesSubject.next();
      });
      
    // Suscribirse a otros cambios relevantes
    this.stateManager.activeTool$
      .pipe(takeUntil(this.destroy$))
      .subscribe(tool => {
        this.activeToolSubject.next(tool);
      });

    // Suscribirse a activeLayers desde MapStateManagerService (que ya obtiene de NetworkStateService)
    this.stateManager.activeLayers
      .pipe(takeUntil(this.destroy$))
      .subscribe(layers => {
        this.activeLayersSubject.next(layers);
      });

    // Suscribirse a isDarkMode desde MapStateManagerService
    this.stateManager.isDarkMode
      .pipe(takeUntil(this.destroy$))
      .subscribe(isDark => {
        this.darkModeSubject.next(isDark);
      });
  }
  
  /**
   * Observable para cambios en capas
   */
  get layerChanges(): Observable<void> {
    return this.layerChangesSubject.asObservable();
  }
  
  /**
   * Observable para herramienta activa
   */
  get activeTool$(): Observable<ToolType> {
    return this.activeToolSubject.asObservable();
  }
  
  /**
   * Observable para capas activas
   */
  get activeLayers$(): Observable<ElementType[]> {
    return this.activeLayersSubject.asObservable();
  }
  
  /**
   * Observable para estado de preparación del mapa
   */
  get mapReady$(): Observable<boolean> {
    return this.mapReadySubject.asObservable();
  }
  
  /**
   * Observable para modo oscuro
   */
  get darkMode$(): Observable<boolean> {
    return this.darkModeSubject.asObservable();
  }
  
  /**
   * Obtiene todas las capas del mapa
   */
  getAllLayers(): MapLayer[] {
    try {
      return this.stateManager.getAllLayers();
    } catch (error) {
      this.logger.error('Error al obtener capas en el adaptador', error);
      return [];
    }
  }
  
  /**
   * Cambia la visibilidad de una capa
   * @param layerId ID de la capa
   */
  toggleLayerVisibility(layerId: string): void {
    try {
      this.stateManager.toggleLayerVisibility(layerId);
    } catch (error) {
      this.logger.error(`Error al cambiar visibilidad de capa ${layerId} en el adaptador`, error);
    }
  }
  
  /**
   * Establece la herramienta activa
   * @param tool Herramienta a activar
   */
  setActiveTool(tool: ToolType): void {
    try {
      this.stateManager.setActiveTool(tool);
      this.activeToolSubject.next(tool);
    } catch (error) {
      this.logger.error(`Error al establecer herramienta ${tool} en el adaptador`, error);
    }
  }
  
  /**
   * Establece las capas activas
   * @param layers Tipos de elemento a mostrar
   */
  setActiveLayers(layers: ElementType[]): void {
    try {
      // Delegar a NetworkStateService
      // TODO: NetworkStateService necesita un método para establecer las capas activas (ej. setActiveLayers).
      // Comentado temporalmente para corregir error de compilación.
      // this.networkStateService.setActiveLayers(layers);
      // El activeLayersSubject del adaptador se actualizará a través de la suscripción 
      // a this.stateManager.activeLayers
    } catch (error) {
      this.logger.error('Error al establecer capas activas en el adaptador', error);
    }
  }
  
  /**
   * Establece el modo oscuro
   * @param isDark Indicador de modo oscuro
   */
  setDarkMode(isDark: boolean): void {
    try {
      this.stateManager.setDarkMode(isDark);
      this.darkModeSubject.next(isDark);
    } catch (error) {
      this.logger.error(`Error al establecer modo oscuro en el adaptador`, error);
    }
  }
  
  /**
   * Limpia recursos al destruir el servicio
   */
  destroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.layerChangesSubject.complete();
    this.activeToolSubject.complete();
    this.activeLayersSubject.complete();
    this.mapReadySubject.complete();
    this.darkModeSubject.complete();
  }
} 
