import { Injectable } from '@angular/core';
import { ElementType } from '../../../shared/types/network.types';
import { NetworkMapRendererService } from './network-map-renderer.service';
import { NetworkMapStateService } from './network-map-state.service';
import { MapService } from './map.service';
import { LoggerService } from '../../../core/services/logger.service';

/**
 * Servicio para centralizar la configuración del mapa
 * y delegar las operaciones a los servicios correspondientes
 */
@Injectable({
  providedIn: 'root'
})
export class MapConfigService {
  constructor(
    private mapRenderer: NetworkMapRendererService,
    private mapStateService: NetworkMapStateService,
    private mapService: MapService,
    private logger: LoggerService
  ) {}

  /**
   * Establece los tipos de elementos visibles en el mapa
   */
  setVisibleLayers(layers: ElementType[]): void {
    this.logger.debug('Actualizando capas visibles:', layers);
    this.mapStateService.updateVisibleElementTypes(layers);
  }

  /**
   * Establece el modo oscuro
   */
  setDarkMode(enabled: boolean): void {
    this.logger.debug(`Estableciendo modo oscuro: ${enabled}`);
    this.mapService.setDarkMode(enabled);
    this.mapRenderer.updateOptions({ darkMode: enabled });
  }

  /**
   * Establece la herramienta activa
   */
  setActiveTool(tool: string): void {
    this.logger.debug(`Estableciendo herramienta activa: ${tool}`);
    this.mapStateService.setCurrentTool(tool);
    this.mapService.setTool(tool);
  }

  /**
   * Establece el nivel de zoom
   */
  setZoomLevel(level: number): void {
    this.logger.debug(`Estableciendo nivel de zoom: ${level}`);
    this.mapService.setZoom(level);
    this.mapStateService.updateZoomLevel(level);
  }

  /**
   * Ajusta el mapa para mostrar todos los elementos
   */
  fitToScreen(): void {
    this.logger.debug('Ajustando vista para mostrar todos los elementos');
    this.mapService.fitToScreen();
  }

  /**
   * Optimiza la configuración según nivel de hardware
   */
  optimizeForHardware(level: 'low' | 'medium' | 'high'): void {
    this.logger.debug(`Optimizando para nivel de hardware: ${level}`);
    
    const map = this.mapService.getMap();
    if (!map) return;
    
    this.mapRenderer.optimizeForHardware(map, level);
  }

  /**
   * Cambia entre WebGL y Canvas para rendering
   */
  toggleWebGL(enabled?: boolean): void {
    const useWebGL = enabled !== undefined ? enabled : !this.mapRenderer.getUseWebGL();
    
    this.logger.debug(`Configurando WebGL: ${useWebGL}`);
    
    // Actualizar opciones del renderizador
    this.mapRenderer.updateOptions({ useWebGL });
    
    // Renderizar de nuevo
    this.mapRenderer.renderElements(this.mapStateService.filteredElements());
  }

  /**
   * Cambia la carga progresiva
   */
  toggleProgressiveLoading(enabled?: boolean): void {
    const progressiveLoading = enabled !== undefined ? enabled : !this.mapRenderer.getProgressiveLoading();
    
    this.logger.debug(`Configurando carga progresiva: ${progressiveLoading}`);
    
    // Actualizar opciones del renderizador
    this.mapRenderer.updateOptions({ progressiveLoading });
    
    // Renderizar de nuevo
    this.mapRenderer.renderElements(this.mapStateService.filteredElements());
  }

  /**
   * Cambia el clustering de elementos
   */
  toggleClustering(enabled?: boolean): void {
    const clusteringEnabled = enabled !== undefined ? enabled : !this.mapRenderer.getClusteringEnabled();
    
    this.logger.debug(`Configurando clustering: ${clusteringEnabled}`);
    
    // Actualizar opciones del renderizador
    this.mapRenderer.updateOptions({ clusteringEnabled });
    
    // Renderizar de nuevo
    this.mapRenderer.renderElements(this.mapStateService.filteredElements());
  }
} 
