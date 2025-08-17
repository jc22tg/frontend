import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { map, distinctUntilChanged, takeUntil, filter, tap } from 'rxjs/operators';
import { ElementType } from '../../../shared/types/network.types';
import { LoggerService } from '../../../core/services/logger.service';
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
 * Servicio para gestionar la persistencia y metadatos de las capas de ElementType.
 * El estado de las capas activas es manejado por NetworkStateService.
 */
@Injectable({
  providedIn: 'root'
})
export class LayerManagerService implements OnDestroy {
  private destroy$ = new Subject<void>();
  
  private readonly layerIcons: Partial<Record<ElementType, string>> = {
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
    [ElementType.OPTICAL_AMPLIFIER]: 'trending_up',
    [ElementType.SLACK_FIBER]: 'waves'
  };

  constructor(
    private logger: LoggerService,
    private networkStateService: NetworkStateService
  ) {
    this.initializeLayerPersistence();
    this.subscribeToActiveLayerChangesForPersistence();
  }

  /**
   * Inicializa el estado de las capas activas en NetworkStateService
   * desde localStorage si existe, o NetworkStateService usa sus defaults.
   */
  private initializeLayerPersistence(): void {
    try {
      const savedSettings = this.loadUserSettings();
      
      if (savedSettings && savedSettings.activeLayers) {
        const layersToActivate = new Set(savedSettings.activeLayers.filter(type => this.isValidElementType(type)));
        this.networkStateService.updateActiveLayers(layersToActivate);
        this.logger.debug('LayerManagerService: NetworkStateService.activeLayers inicializado desde localStorage con capas: ', 
                      Array.from(layersToActivate).map(layer => this.getLayerName(layer)));
      } else {
        // NetworkStateService ya tiene sus valores predeterminados o se inicializará con un conjunto vacío.
        // Simplemente guardamos el estado actual de NetworkStateService para asegurar consistencia en localStorage.
        this.saveUserSettings(this.networkStateService.getCurrentState().activeLayers);
        this.logger.debug('LayerManagerService: No hay configuración guardada o es inválida. Usando estado de NetworkStateService y persistiendo.');
      }
    } catch (error) {
      this.logger.error('Error al inicializar la persistencia de capas', error);
      // En caso de error, intentar persistir el estado actual de NetworkStateService
      this.saveUserSettings(this.networkStateService.getCurrentState().activeLayers);
    }
  }

  /**
   * Se suscribe a los cambios en activeLayers de NetworkStateService para persistirlos.
   */
  private subscribeToActiveLayerChangesForPersistence(): void {
    this.networkStateService.state$.pipe(
      map(state => state.activeLayers),
      distinctUntilChanged((prev, curr) => {
        if (prev.size !== curr.size) return false;
        for (const item of prev) if (!curr.has(item)) return false;
        return true;
      }),
      takeUntil(this.destroy$),
      // tap(activeLayersSet => this.logger.debug('LayerManagerService: Detectado cambio en activeLayers de NetworkStateService', Array.from(activeLayersSet))) // Para depuración
    ).subscribe(activeLayersSet => {
      try {
        this.saveUserSettings(activeLayersSet);
      } catch (error) {
        this.logger.error('Error al persistir cambios de activeLayers desde NetworkStateService', error);
      }
    });
  }


  /**
   * Obtiene todas las capas activas como Observable desde NetworkStateService
   */
  getActiveLayers(): Observable<ElementType[]> {
    return this.networkStateService.state$.pipe(
      map(state => Array.from(state.activeLayers)),
      distinctUntilChanged((prev, curr) => 
        prev.length === curr.length && 
        prev.every((layer, i) => layer === curr[i])
      )
    );
  }

  /**
   * Verifica si una capa está activa consultando NetworkStateService
   * @param layerType Tipo de elemento de la capa
   */
  isLayerActive(layerType: ElementType): Observable<boolean> {
    return this.networkStateService.state$.pipe(
      map(state => state.activeLayers.has(layerType)),
      distinctUntilChanged()
    );
  }

  /**
   * Obtiene el valor actual sincrónico de si una capa está activa desde NetworkStateService
   * @param layerType Tipo de elemento de la capa
   */
  isLayerActiveSync(layerType: ElementType): boolean {
    try {
      if (!this.isValidElementType(layerType)) {
        this.logger.warn(`Verificación de capa activa para tipo no válido: ${layerType}`);
        return false;
      }
      return this.networkStateService.getCurrentState().activeLayers.has(layerType);
    } catch (error) {
      this.logger.error(`Error al verificar si la capa ${this.getLayerName(layerType)} está activa`, error);
      return false;
    }
  }

  /**
   * Activa o desactiva una capa a través de NetworkStateService.
   * La persistencia se manejará por la suscripción.
   * @param layerType Tipo de elemento de la capa
   * @param active Estado de activación (opcional, si no se proporciona, alterna el estado actual)
   */
  toggleLayer(layerType: ElementType, active?: boolean): void {
    try {
      if (!this.isValidElementType(layerType)) {
        this.logger.warn(`Intento de alternar tipo de elemento no válido: ${layerType}`);
        return;
      }
      
      const isCurrentlyActive = this.networkStateService.getCurrentState().activeLayers.has(layerType);
      const shouldBeActive = active !== undefined ? active : !isCurrentlyActive;
      
      if (isCurrentlyActive === shouldBeActive) {
        return;
      }
      
      this.networkStateService.toggleLayer(layerType); // NetworkStateService se encarga de la lógica de añadir/quitar
      // El logger ya está en NetworkStateService.toggleLayer
      // La persistencia la maneja la suscripción
      
    } catch (error) {
      this.logger.error(`Error al alternar la capa ${this.getLayerName(layerType)} en LayerManagerService`, error);
    }
  }

  /**
   * Activa múltiples capas a la vez a través de NetworkStateService
   * @param layerTypes Tipos de elemento de las capas a activar
   */
  activateLayers(layerTypes: ElementType[]): void {
    try {
      const validLayerTypes = layerTypes.filter(type => {
        const isValid = this.isValidElementType(type);
        if (!isValid) {
          this.logger.warn(`Tipo de elemento no válido al activar: ${type}`);
        }
        return isValid;
      });
      
      if (validLayerTypes.length === 0) return;

      const currentActiveLayers = this.networkStateService.getCurrentState().activeLayers;
      const layersToActivate = validLayerTypes.filter(type => !currentActiveLayers.has(type));

      if (layersToActivate.length > 0) {
        const newActiveLayers = new Set([...currentActiveLayers, ...layersToActivate]);
        this.networkStateService.updateActiveLayers(newActiveLayers);
        this.logger.debug('LayerManagerService: Múltiples capas activadas vía NetworkStateService:', layersToActivate.map(t => this.getLayerName(t)));
        // La persistencia la maneja la suscripción
      }
    } catch (error) {
      this.logger.error('Error al activar múltiples capas en LayerManagerService', error);
    }
  }

  /**
   * Desactiva múltiples capas a la vez a través de NetworkStateService
   * @param layerTypes Tipos de elemento de las capas a desactivar
   */
  deactivateLayers(layerTypes: ElementType[]): void {
    try {
      const validLayerTypes = layerTypes.filter(type => {
        const isValid = this.isValidElementType(type);
        if (!isValid) {
          this.logger.warn(`Tipo de elemento no válido al desactivar: ${type}`);
        }
        return isValid;
      });

      if (validLayerTypes.length === 0) return;

      const currentActiveLayers = this.networkStateService.getCurrentState().activeLayers;
      const layersToDeactivate = validLayerTypes.filter(type => currentActiveLayers.has(type));

      if (layersToDeactivate.length > 0) {
        const newActiveLayers = new Set(currentActiveLayers);
        layersToDeactivate.forEach(type => newActiveLayers.delete(type));
        this.networkStateService.updateActiveLayers(newActiveLayers);
        this.logger.debug('LayerManagerService: Múltiples capas desactivadas vía NetworkStateService:', layersToDeactivate.map(t => this.getLayerName(t)));
        // La persistencia la maneja la suscripción
      }
    } catch (error) {
      this.logger.error('Error al desactivar múltiples capas en LayerManagerService', error);
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
        return 'warning'; // Icono de advertencia genérico
      }
      return this.layerIcons[type] || 'layers'; // Icono por defecto
    } catch (error) {
      this.logger.error(`Error al obtener icono para la capa ${this.getLayerName(type)}`, error);
      return 'error'; // Icono de error genérico
    }
  }

  /**
   * Restablece las capas a un conjunto predeterminado, actualizando NetworkStateService
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
      
      this.networkStateService.updateActiveLayers(defaultLayers);
      this.logger.debug('LayerManagerService: Capas restablecidas a valores predeterminados en NetworkStateService');
      // La persistencia la maneja la suscripción
    } catch (error) {
      this.logger.error('Error al restablecer capas predeterminadas en LayerManagerService', error);
    }
  }
  
  /**
   * Guarda la configuración de capas activas en localStorage
   * @param activeLayersSet El conjunto de capas ElementType activas.
   */
  private saveUserSettings(activeLayersSet: Set<ElementType>): void {
    try {
      const settings: LayerSettings = {
        activeLayers: Array.from(activeLayersSet),
        lastUpdated: Date.now()
      };
      
      localStorage.setItem(USER_LAYERS_STORAGE_KEY, JSON.stringify(settings));
      this.logger.debug('LayerManagerService: Configuración de capas guardada en localStorage', settings.activeLayers);
    } catch (error) {
      this.logger.error('Error al guardar configuración de capas en localStorage', error);
    }
  }
  
  /**
   * Carga la configuración de capas desde localStorage
   * @returns La configuración guardada o null si no existe o es inválida
   */
  private loadUserSettings(): LayerSettings | null {
    try {
      const storedSettings = localStorage.getItem(USER_LAYERS_STORAGE_KEY);
      
      if (!storedSettings) {
        this.logger.debug('LayerManagerService: No hay configuración de capas guardada en localStorage.');
        return null;
      }
      
      const settings: LayerSettings = JSON.parse(storedSettings);
      
      if (!settings || !Array.isArray(settings.activeLayers)) {
        this.logger.warn('LayerManagerService: Configuración de capas en localStorage es inválida o corrupta.');
        localStorage.removeItem(USER_LAYERS_STORAGE_KEY); // Limpiar configuración corrupta
        return null;
      }
      
      // Validar que los tipos de elemento son válidos
      settings.activeLayers = settings.activeLayers.filter(type => this.isValidElementType(type));
      
      this.logger.debug('LayerManagerService: Configuración de capas cargada desde localStorage:', settings.activeLayers);
      return settings;
    } catch (error) {
      this.logger.error('Error al cargar configuración de capas desde localStorage', error);
      // En caso de error de parseo, podría ser útil limpiar la entrada corrupta
      localStorage.removeItem(USER_LAYERS_STORAGE_KEY);
      return null;
    }
  }
  
  /**
   * Verifica si un tipo de elemento es válido
   * @param type Tipo de elemento a verificar
   * @returns true si el tipo es válido, false en caso contrario
   */
  private isValidElementType(type: any): type is ElementType { 
    // Verifica simplemente si el valor está presente en los valores del enum ElementType
    if (typeof type === 'string') {
      // Verificamos si el string existe como valor (no como clave) en ElementType
      return Object.values(ElementType).includes(type as ElementType);
    }
    return false;
  }
  
  /**
   * Obtiene el nombre legible de un tipo de elemento
   * @param type Tipo de elemento
   * @returns Nombre del tipo o 'Desconocido' si no es válido
   */
  public getLayerName(type: ElementType): string {
    try {
      const name = ElementType[type]; 
      if (name !== undefined) {
        return name;
      }
      return `Tipo desconocido (${type})`;
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
