import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { NetworkStateService } from '../../services/network-state.service';
import { ElementType } from '../../../../shared/types/network.types';
import { LoggerService } from '../../../../core/services/logger.service';

/**
 * Tipo para las herramientas disponibles en el mapa
 */
export type ToolType = 'pan' | 'select' | 'measure' | 'areaSelect' | 'connect' | 'zoomIn' | 'zoomOut' | 'fitToScreen' | 'resetZoom';

/**
 * Estado del mapa que se gestiona centralizadamente
 */
export interface MapState {
  currentTool: ToolType;
  zoomLevel: number;
  isDarkMode: boolean;
  showMiniMap: boolean;
  activeLayers: ElementType[];
  historyCount: number;
  hasUnsavedChanges: boolean;
}

/**
 * Servicio para gestionar el estado del mapa de forma centralizada
 * 
 * Este servicio permite abstraer toda la gestión de estado del mapa
 * para que los componentes no tengan que preocuparse por ello.
 */
@Injectable({
  providedIn: 'root'
})
export class MapStateManagerService {
  /** Subject para gestionar desuscripciones */
  private destroy$ = new Subject<void>();
  
  /** Estado del mapa */
  private _mapState: MapState = {
    currentTool: 'pan',
    zoomLevel: 100,
    isDarkMode: false,
    showMiniMap: true,
    activeLayers: [
      ElementType.OLT,
      ElementType.ONT,
      ElementType.FDP,
      ElementType.SPLITTER,
      ElementType.EDFA,
      ElementType.MANGA
    ],
    historyCount: 0,
    hasUnsavedChanges: false
  };
  
  /** Subjects para observables del estado */
  private currentToolSubject = new BehaviorSubject<ToolType>(this._mapState.currentTool);
  private zoomLevelSubject = new BehaviorSubject<number>(this._mapState.zoomLevel);
  private isDarkModeSubject = new BehaviorSubject<boolean>(this._mapState.isDarkMode);
  private showMiniMapSubject = new BehaviorSubject<boolean>(this._mapState.showMiniMap);
  private activeLayersSubject = new BehaviorSubject<ElementType[]>(this._mapState.activeLayers);
  private historyCountSubject = new BehaviorSubject<number>(this._mapState.historyCount);
  private hasUnsavedChangesSubject = new BehaviorSubject<boolean>(this._mapState.hasUnsavedChanges);
  
  /** Observables públicos */
  readonly currentTool: Observable<ToolType> = this.currentToolSubject.asObservable();
  readonly zoomLevel: Observable<number> = this.zoomLevelSubject.asObservable();
  readonly isDarkMode: Observable<boolean> = this.isDarkModeSubject.asObservable();
  readonly miniMapVisible: Observable<boolean> = this.showMiniMapSubject.asObservable();
  readonly activeLayers: Observable<ElementType[]> = this.activeLayersSubject.asObservable();
  readonly historyCount: Observable<number> = this.historyCountSubject.asObservable();
  readonly hasUnsavedChanges: Observable<boolean> = this.hasUnsavedChangesSubject.asObservable();
  
  constructor(
    private networkStateService: NetworkStateService,
    private logger: LoggerService
  ) {
    this.setupStateSubscriptions();
  }
  
  /**
   * Configura suscripciones al estado global de la red
   */
  private setupStateSubscriptions(): void {
    // Suscribirse a cambios en el estado global
    this.networkStateService.state$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(state => {
      // Actualizar estado local
      this._mapState = {
        ...this._mapState,
        isDarkMode: state.isDarkMode,
        showMiniMap: state.showMiniMap || this._mapState.showMiniMap,
        currentTool: (state.currentTool as ToolType) || this._mapState.currentTool,
        activeLayers: [...(state.activeLayers ? Array.from(state.activeLayers) : this._mapState.activeLayers)] as ElementType[]
      };
      
      // Actualizar subjects
      this.isDarkModeSubject.next(this._mapState.isDarkMode);
      this.showMiniMapSubject.next(this._mapState.showMiniMap);
      this.currentToolSubject.next(this._mapState.currentTool);
      this.activeLayersSubject.next(this._mapState.activeLayers);
    });
  }
  
  /**
   * Cambia la herramienta actual
   * @param tool Nueva herramienta a utilizar
   */
  setTool(tool: ToolType): void {
    // Validar herramienta
    if (!this.isValidTool(tool)) {
      this.logger.warn(`Herramienta no válida: ${tool}`);
      return;
    }
    
    // Actualizar estado local
    this._mapState.currentTool = tool;
    this.currentToolSubject.next(tool);
    
    // Sincronizar con estado global
    this.networkStateService.updateCurrentTool(tool);
  }
  
  /**
   * Verifica si una herramienta es válida
   * @param tool Herramienta a verificar
   * @returns true si la herramienta es válida
   */
  private isValidTool(tool: string): tool is ToolType {
    const validTools: ToolType[] = [
      'pan', 'select', 'measure', 'areaSelect', 
      'connect', 'zoomIn', 'zoomOut', 'fitToScreen', 'resetZoom'
    ];
    return validTools.includes(tool as ToolType);
  }
  
  /**
   * Actualiza el nivel de zoom
   * @param level Nuevo nivel de zoom
   */
  setZoomLevel(level: number): void {
    // Restringir el zoom entre valores razonables
    const newLevel = Math.max(10, Math.min(200, level));
    
    // Actualizar estado local
    this._mapState.zoomLevel = newLevel;
    this.zoomLevelSubject.next(newLevel);
  }
  
  /**
   * Alterna el modo oscuro
   */
  toggleDarkMode(): void {
    const newValue = !this._mapState.isDarkMode;
    
    // Actualizar estado local
    this._mapState.isDarkMode = newValue;
    this.isDarkModeSubject.next(newValue);
    
    // Sincronizar con estado global
    this.networkStateService.updateDarkMode(newValue);
  }
  
  /**
   * Alterna la visualización del minimapa
   */
  toggleMiniMap(): void {
    const newValue = !this._mapState.showMiniMap;
    
    // Actualizar estado local
    this._mapState.showMiniMap = newValue;
    this.showMiniMapSubject.next(newValue);
    
    // Intentar sincronizar con estado global si existe el método
    try {
      // Si existe propiedad similar en NetworkStateService, intentar usarla
      if (typeof this.networkStateService['setMiniMapVisibility'] === 'function') {
        (this.networkStateService['setMiniMapVisibility'] as Function)(newValue);
      } else {
        // Fallback: no hacer nada, simplemente registrar
        this.logger.debug('No se encontró método para actualizar minimapa en NetworkStateService');
      }
    } catch (error) {
      this.logger.warn('No se pudo actualizar visibilidad del minimapa en el estado global');
    }
  }
  
  /**
   * Actualiza las capas activas
   * @param layers Nuevas capas activas
   */
  setActiveLayers(layers: ElementType[]): void {
    // Actualizar estado local
    this._mapState.activeLayers = [...layers];
    this.activeLayersSubject.next([...layers]);
    
    // Sincronizar con estado global
    this.networkStateService.updateActiveLayers(new Set(layers));
  }
  
  /**
   * Alterna una capa específica
   * @param layer Capa a alternar
   */
  toggleLayer(layer: ElementType): void {
    const currentLayers = [...this._mapState.activeLayers];
    const isActive = currentLayers.includes(layer);
    
    let newLayers: ElementType[];
    if (isActive) {
      // Remover la capa si ya está activa
      newLayers = currentLayers.filter(l => l !== layer);
    } else {
      // Añadir la capa si no está activa
      newLayers = [...currentLayers, layer];
    }
    
    // Actualizar capas activas
    this.setActiveLayers(newLayers);
  }
  
  /**
   * Establece si hay cambios sin guardar
   * @param hasChanges Indica si hay cambios sin guardar
   */
  setUnsavedChanges(hasChanges: boolean): void {
    // Actualizar estado local
    this._mapState.hasUnsavedChanges = hasChanges;
    this.hasUnsavedChangesSubject.next(hasChanges);
    
    // Sincronizar con estado global
    this.networkStateService.updateUnsavedChanges(hasChanges);
  }
  
  /**
   * Obtiene si el minimapa está visible
   * @returns true si el minimapa está visible
   */
  isMiniMapVisible(): boolean {
    return this._mapState.showMiniMap;
  }
  
  /**
   * Limpia recursos al destruir el servicio
   */
  destroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
} 