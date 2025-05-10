import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { map, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { ElementType } from '../../../shared/types/network.types';
import { LoggerService } from '../../../core/services/logger.service';
import { NetworkEventBusService, NetworkEventType, LayerToggledEvent } from './network-event-bus.service';
import { NetworkStateService } from './network-state.service';

// Clave para almacenar configuración en localStorage
const USER_LAYERS_STORAGE_KEY = 'network-map:user-layer-settings';

/**
 * Interfaz para la configuración de capas guardada
 */
export interface LayerSettings {
  activeLayers: ElementType[];
  lastUpdated: number; // timestamp
}

/**
 * Servicio para gestionar las capas del mapa de forma centralizada
 * Proporciona métodos para activar/desactivar capas y consultar su estado
 * Modificado para usar el bus de eventos para reducir dependencias circulares
 */
@Injectable({
  providedIn: 'root'
})
export class LayerManagerService implements OnDestroy {
  // Estado interno de las capas activas
  private activeLayers$ = new BehaviorSubject<Set<ElementType>>(new Set());
  
  // Subject para controlar la finalización de suscripciones
  private destroy$ = new Subject<void>();
  
  // Definiciones para los iconos de cada tipo de elemento
  private readonly layerIcons: Record<ElementType, string> = {
    [ElementType.OLT]: 'router',
    [ElementType.ONT]: 'device_hub',
    [ElementType.FDP]: 'cable',
    [ElementType.SPLITTER]: 'call_split',
    [ElementType.EDFA]: 'electrical_services',
    [ElementType.MANGA]: 'cable',
    [ElementType.TERMINAL_BOX]: 'inbox',
    [ElementType.MSAN]: 'device_hub',
    [ElementType.ODF]: 'settings_input_hdmi',
    [ElementType.ROUTER]: 'wifi_tethering',
    [ElementType.RACK]: 'dns',
    [ElementType.FIBER_CONNECTION]: 'timeline',
    [ElementType.FIBER_THREAD]: 'linear_scale',
    [ElementType.FIBER_CABLE]: 'cable',
    [ElementType.FIBER_SPLICE]: 'settings_input_component',
    [ElementType.FIBER_STRAND]: 'linear_scale',
    [ElementType.DROP_CABLE]: 'settings_ethernet',
    [ElementType.DISTRIBUTION_CABLE]: 'settings_ethernet',
    [ElementType.FEEDER_CABLE]: 'settings_ethernet',
    [ElementType.BACKBONE_CABLE]: 'settings_ethernet',
    [ElementType.NETWORK_GRAPH]: 'bubble_chart',
    [ElementType.WDM_FILTER]: 'filter_alt',
    [ElementType.OPTICAL_SWITCH]: 'swap_horiz',
    [ElementType.ROADM]: 'swap_calls',
    [ElementType.COHERENT_TRANSPONDER]: 'multiline_chart',
    [ElementType.WAVELENGTH_ROUTER]: 'waves',
    [ElementType.OPTICAL_AMPLIFIER]: 'trending_up'
  };

  constructor(
    private logger: LoggerService,
    private eventBus: NetworkEventBusService,
    private networkStateService: NetworkStateService
  ) {
    // Inicializar desde la configuración guardada o el estado de la aplicación
    this.initializeFromStoredSettings();
    
    // Suscribirse a eventos de cambio de capa
    this.subscribeToLayerEvents();
  }

  /**
   * Inicializa el servicio con la configuración guardada o el estado actual de la aplicación
   */
  private initializeFromStoredSettings(): void {
    try {
      // Intentar recuperar la configuración guardada
      const savedSettings = this.loadUserSettings();
      
      if (savedSettings) {
        // Si hay configuración guardada, usarla
        const layersSet = new Set(savedSettings.activeLayers);
        this.activeLayers$.next(layersSet);
        this.logger.debug('LayerManagerService inicializado desde configuración guardada con capas: ', 
                      Array.from(layersSet).map(layer => this.getLayerName(layer)));
                      
        // Sincronizar con el estado global de la aplicación
        savedSettings.activeLayers.forEach(layerType => {
          this.networkStateService.toggleLayer(layerType);
        });
      } else {
        // Si no hay configuración guardada, usar el estado actual
        this.initializeFromState();
      }
    } catch (error) {
      this.logger.error('Error al inicializar las capas desde configuración guardada', error);
      // En caso de error, inicializar desde el estado
      this.initializeFromState();
    }
  }

  /**
   * Inicializa el servicio con el estado actual de la aplicación
   */
  private initializeFromState(): void {
    try {
      const state = this.networkStateService.getCurrentState();
      this.activeLayers$.next(new Set(state.activeLayers));
      this.logger.debug('LayerManagerService inicializado con capas: ', 
                    Array.from(state.activeLayers).map(layer => this.getLayerName(layer)));
    } catch (error) {
      this.logger.error('Error al inicializar las capas desde el estado', error);
      // En caso de error, inicializar con capas predeterminadas
      this.resetToDefaultLayers();
    }
  }

  /**
   * Se suscribe a eventos relacionados con capas
   */
  private subscribeToLayerEvents(): void {
    this.eventBus.ofType<LayerToggledEvent>(NetworkEventType.LAYER_TOGGLED).pipe(
      takeUntil(this.destroy$)
    ).subscribe(event => {
      try {
        const currentLayers = new Set(this.activeLayers$.getValue());
        const layerType = event.payload.layer;
        const active = event.payload.active;
        
        // Validar que el tipo de elemento existe
        if (typeof layerType === 'string' && this.isValidElementType(layerType as ElementType)) {
          if (active) {
            currentLayers.add(layerType as ElementType);
          } else {
            currentLayers.delete(layerType as ElementType);
          }
          
          this.activeLayers$.next(currentLayers);
          this.logger.debug(`Capa ${this.getLayerName(layerType as ElementType)} ${active ? 'activada' : 'desactivada'}`);
          
          // Guardar la configuración actualizada
          this.saveUserSettings();
        } else {
          this.logger.warn(`Tipo de elemento no válido: ${layerType}`);
        }
      } catch (error) {
        this.logger.error('Error al procesar evento de cambio de capa', error);
      }
    });
  }

  /**
   * Obtiene todas las capas activas como Observable
   */
  getActiveLayers(): Observable<ElementType[]> {
    return this.activeLayers$.pipe(
      map(layerSet => Array.from(layerSet)),
      distinctUntilChanged((prev, curr) => 
        prev.length === curr.length && 
        prev.every((layer, i) => layer === curr[i])
      )
    );
  }

  /**
   * Verifica si una capa está activa
   * @param layerType Tipo de elemento de la capa
   */
  isLayerActive(layerType: ElementType): Observable<boolean> {
    return this.activeLayers$.pipe(
      map(layers => layers.has(layerType)),
      distinctUntilChanged()
    );
  }

  /**
   * Obtiene el valor actual sincrónico de si una capa está activa
   * @param layerType Tipo de elemento de la capa
   */
  isLayerActiveSync(layerType: ElementType): boolean {
    try {
      if (!this.isValidElementType(layerType)) {
        this.logger.warn(`Verificación de capa activa para tipo no válido: ${layerType}`);
        return false;
      }
      return this.activeLayers$.getValue().has(layerType);
    } catch (error) {
      this.logger.error(`Error al verificar si la capa ${this.getLayerName(layerType)} está activa`, error);
      return false;
    }
  }

  /**
   * Activa o desactiva una capa
   * @param layerType Tipo de elemento de la capa
   * @param active Estado de activación (opcional, si no se proporciona, alterna el estado actual)
   */
  toggleLayer(layerType: ElementType, active?: boolean): void {
    try {
      if (!this.isValidElementType(layerType)) {
        this.logger.warn(`Intento de alternar tipo de elemento no válido: ${layerType}`);
        return;
      }
      
      const currentLayers = new Set(this.activeLayers$.getValue());
      const isCurrentlyActive = currentLayers.has(layerType);
      
      // Si no se proporciona un estado, alternar el actual
      const shouldBeActive = active !== undefined ? active : !isCurrentlyActive;
      
      // Si el estado no cambia, no hacer nada
      if (isCurrentlyActive === shouldBeActive) {
        return;
      }
      
      // Actualizar el estado local
      if (shouldBeActive) {
        currentLayers.add(layerType);
      } else {
        currentLayers.delete(layerType);
      }
      
      this.activeLayers$.next(currentLayers);
      
      // Emitir evento de cambio de capa
      this.eventBus.emitLayerToggled(layerType, shouldBeActive);
      
      // Guardar la configuración actualizada
      this.saveUserSettings();
      
      this.logger.debug(`Capa ${this.getLayerName(layerType)} ${shouldBeActive ? 'activada' : 'desactivada'}`);
    } catch (error) {
      this.logger.error(`Error al alternar la capa ${this.getLayerName(layerType)}`, error);
    }
  }

  /**
   * Activa múltiples capas a la vez
   * @param layerTypes Tipos de elemento de las capas a activar
   */
  activateLayers(layerTypes: ElementType[]): void {
    try {
      const currentLayers = new Set(this.activeLayers$.getValue());
      let changed = false;
      
      // Filtrar tipos de elemento no válidos
      const validLayerTypes = layerTypes.filter(type => {
        const isValid = this.isValidElementType(type);
        if (!isValid) {
          this.logger.warn(`Tipo de elemento no válido: ${type}`);
        }
        return isValid;
      });
      
      validLayerTypes.forEach(type => {
        if (!currentLayers.has(type)) {
          currentLayers.add(type);
          changed = true;
          // Emitir evento individual para cada capa
          this.eventBus.emitLayerToggled(type, true);
          // Sincronizar con el estado global
          this.networkStateService.toggleLayer(type);
        }
      });
      
      if (changed) {
        this.activeLayers$.next(currentLayers);
        this.logger.debug('Múltiples capas activadas:', validLayerTypes.map(t => this.getLayerName(t)));
        // Guardar la configuración actualizada
        this.saveUserSettings();
      }
    } catch (error) {
      this.logger.error('Error al activar múltiples capas', error);
    }
  }

  /**
   * Desactiva múltiples capas a la vez
   * @param layerTypes Tipos de elemento de las capas a desactivar
   */
  deactivateLayers(layerTypes: ElementType[]): void {
    try {
      const currentLayers = new Set(this.activeLayers$.getValue());
      let changed = false;
      
      // Filtrar tipos de elemento no válidos
      const validLayerTypes = layerTypes.filter(type => {
        const isValid = this.isValidElementType(type);
        if (!isValid) {
          this.logger.warn(`Tipo de elemento no válido: ${type}`);
        }
        return isValid;
      });
      
      validLayerTypes.forEach(type => {
        if (currentLayers.has(type)) {
          currentLayers.delete(type);
          changed = true;
          // Emitir evento individual para cada capa
          this.eventBus.emitLayerToggled(type, false);
          // Sincronizar con el estado global
          this.networkStateService.toggleLayer(type);
        }
      });
      
      if (changed) {
        this.activeLayers$.next(currentLayers);
        this.logger.debug('Múltiples capas desactivadas:', validLayerTypes.map(t => this.getLayerName(t)));
        // Guardar la configuración actualizada
        this.saveUserSettings();
      }
    } catch (error) {
      this.logger.error('Error al desactivar múltiples capas', error);
    }
  }

  /**
   * Obtiene el icono para un tipo de elemento
   * @param type Tipo de elemento 
   */
  getLayerIcon(type: ElementType): string {
    try {
      if (!this.isValidElementType(type)) {
        this.logger.warn(`Solicitando icono para tipo no válido: ${type}`);
        return 'warning';
      }
      return this.layerIcons[type] || 'layers';
    } catch (error) {
      this.logger.error(`Error al obtener icono para la capa ${this.getLayerName(type)}`, error);
      return 'error';
    }
  }

  /**
   * Restablece las capas a un conjunto predeterminado
   */
  resetToDefaultLayers(): void {
    try {
      const defaultLayers = new Set<ElementType>([
        ElementType.OLT,
        ElementType.ONT,
        ElementType.FDP,
        ElementType.SPLITTER,
        ElementType.ODF
      ]);
      
      // Desactivar las capas que están activas pero no en las predeterminadas
      const currentLayers = this.activeLayers$.getValue();
      currentLayers.forEach(layer => {
        if (!defaultLayers.has(layer)) {
          this.eventBus.emitLayerToggled(layer, false);
          this.networkStateService.toggleLayer(layer);
        }
      });
      
      // Activar las capas predeterminadas que no están activas
      defaultLayers.forEach(layer => {
        if (!currentLayers.has(layer)) {
          this.eventBus.emitLayerToggled(layer, true);
          this.networkStateService.toggleLayer(layer);
        }
      });
      
      this.activeLayers$.next(defaultLayers);
      this.logger.debug('Capas restablecidas a valores predeterminados');
      
      // Guardar la configuración actualizada
      this.saveUserSettings();
    } catch (error) {
      this.logger.error('Error al restablecer capas predeterminadas', error);
    }
  }
  
  /**
   * Guarda la configuración actual de capas en localStorage
   */
  private saveUserSettings(): void {
    try {
      const settings: LayerSettings = {
        activeLayers: Array.from(this.activeLayers$.getValue()),
        lastUpdated: Date.now()
      };
      
      localStorage.setItem(USER_LAYERS_STORAGE_KEY, JSON.stringify(settings));
      this.logger.debug('Configuración de capas guardada');
    } catch (error) {
      this.logger.error('Error al guardar configuración de capas', error);
    }
  }
  
  /**
   * Carga la configuración de capas desde localStorage
   * @returns La configuración guardada o null si no existe
   */
  private loadUserSettings(): LayerSettings | null {
    try {
      const storedSettings = localStorage.getItem(USER_LAYERS_STORAGE_KEY);
      
      if (!storedSettings) {
        return null;
      }
      
      const settings: LayerSettings = JSON.parse(storedSettings);
      
      // Validar que los tipos de elemento son válidos
      settings.activeLayers = settings.activeLayers.filter(type => this.isValidElementType(type));
      
      return settings;
    } catch (error) {
      this.logger.error('Error al cargar configuración de capas', error);
      return null;
    }
  }
  
  /**
   * Verifica si un tipo de elemento es válido
   * @param type Tipo de elemento a verificar
   * @returns true si el tipo es válido, false en caso contrario
   */
  private isValidElementType(type: any): boolean {
    return (
      type !== undefined && 
      type !== null && 
      Object.values(ElementType).includes(type) && 
      typeof type === 'number'
    );
  }
  
  /**
   * Obtiene el nombre legible de un tipo de elemento
   * @param type Tipo de elemento
   * @returns Nombre del tipo o 'Desconocido' si no es válido
   */
  private getLayerName(type: ElementType): string {
    try {
      if (!this.isValidElementType(type)) {
        return `Tipo desconocido (${type})`;
      }
      return ElementType[type] || `Tipo ${type}`;
    } catch (error) {
      return `Error (${type})`;
    }
  }
  
  /**
   * Limpia las suscripciones al destruir el servicio
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.logger.debug('LayerManagerService destruido');
  }
} 