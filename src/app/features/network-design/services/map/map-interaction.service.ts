import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { LoggerService } from '../../../../core/services/logger.service';
import { MapStateService } from './state/map-state.service';
import { MapService } from '../map.service';
import { MapToolType } from './map-tools.service';
import { NetworkElement, NetworkConnection } from '../../../../shared/types/network.types';

/**
 * Servicio para gestionar las interacciones con el mapa
 * 
 * Este servicio actúa como intermediario entre el MapToolsService y el MapService,
 * proporcionando métodos específicos para habilitar/deshabilitar distintos tipos de interacción.
 */
@Injectable({
  providedIn: 'root'
})
export class MapInteractionService {
  // Dependencias
  private logger = inject(LoggerService);
  private mapService = inject(MapService);
  private mapStateService = inject(MapStateService);
  
  // Estado interno
  private isInteractionEnabledSubject = new BehaviorSubject<boolean>(true);
  
  // Observables públicos
  readonly isInteractionEnabled$ = this.isInteractionEnabledSubject.asObservable();
  
  constructor() {
    this.logger.debug('MapInteractionService inicializado');
  }
  
  /**
   * Deshabilita todas las interacciones con el mapa
   */
  disableInteraction(): void {
    this.isInteractionEnabledSubject.next(false);
    this.logger.debug('Interacciones del mapa deshabilitadas');
    
    // Desactivar interacciones específicas en el MapService
    const map = this.mapService.getMap();
    if (map) {
      map.dragging.disable();
      map.touchZoom.disable();
      map.doubleClickZoom.disable();
      map.scrollWheelZoom.disable();
      map.boxZoom.disable();
      map.keyboard.disable();
    }
  }
  
  /**
   * Habilita todas las interacciones con el mapa
   */
  enableInteraction(): void {
    this.isInteractionEnabledSubject.next(true);
    this.logger.debug('Interacciones del mapa habilitadas');
    
    // Activar interacciones específicas en el MapService
    const map = this.mapService.getMap();
    if (map) {
      map.dragging.enable();
      map.touchZoom.enable();
      map.doubleClickZoom.enable();
      map.scrollWheelZoom.enable();
      map.boxZoom.enable();
      map.keyboard.enable();
    }
  }
  
  /**
   * Habilita el modo de navegación (pan) del mapa
   */
  enablePanning(): void {
    this.enableInteraction();
    this.mapStateService.setActiveTool('pan');
    this.logger.debug('Modo de navegación habilitado');
    
    // Configuración específica para panning
    const map = this.mapService.getMap();
    if (map) {
      map.dragging.enable();
    }
  }
  
  /**
   * Habilita el modo de selección de elementos
   */
  enableSelection(): void {
    // Mantener ciertas interacciones pero entrar en modo selección
    this.enableInteraction();
    this.mapStateService.setActiveTool('select');
    this.logger.debug('Modo de selección habilitado');
    
    // Configuración específica para modo selección
    this.mapService.setTool('select');
  }
  
  /**
   * Habilita el modo de medición de distancias
   */
  enableMeasurement(): void {
    this.disableInteraction();
    this.mapStateService.setActiveTool('measure');
    this.logger.debug('Modo de medición habilitado');
    
    // Activar modo específico para medición
    this.mapService.setTool('measure');
  }
  
  /**
   * Habilita el modo de creación de conexiones
   */
  enableConnectionCreation(): void {
    this.disableInteraction();
    this.mapStateService.setActiveTool('connect');
    this.logger.debug('Modo de creación de conexiones habilitado');
    
    // Activar modo específico para conexiones
    this.mapService.setTool('connect');
  }
  
  /**
   * Habilita el modo de selección por área
   */
  enableAreaSelection(): void {
    this.disableInteraction();
    this.mapStateService.setActiveTool('area');
    this.logger.debug('Modo de selección por área habilitado');
    
    // Activar modo específico para selección por área
    this.mapService.setTool('area');
  }
  
  /**
   * Habilita el modo de edición de elementos
   */
  enableElementEditing(): void {
    this.disableInteraction();
    this.mapStateService.setActiveTool('edit');
    this.logger.debug('Modo de edición de elementos habilitado');
    
    // Activar modo específico para edición
    this.mapService.setTool('edit');
  }
  
  /**
   * Verifica si una herramienta específica está activa
   * @param tool Tipo de herramienta a verificar
   */
  isToolActive(tool: MapToolType): boolean {
    // Obtener el valor directamente del observable
    let activeTool: MapToolType = 'pan';
    this.mapStateService.activeTool$.subscribe(
      tool => activeTool = tool
    ).unsubscribe();
    
    return activeTool === tool;
  }
  
  /**
   * Obtiene la herramienta activa actualmente
   */
  getActiveTool(): Observable<MapToolType> {
    return this.mapStateService.activeTool$;
  }
  
  /**
   * Selecciona un elemento
   */
  selectElement(element: NetworkElement | null): void {
    if (element) {
      if (element.id) {
        this.mapStateService.selectElements([element.id], true);
        this.logger.debug(`Elemento seleccionado: ${element.id}`);
      } else {
        this.logger.warn('Intento de seleccionar un elemento sin ID', element);
      }
    } else {
      this.mapStateService.setState({ selectedElementIds: [] });
      this.logger.debug('Elemento deseleccionado');
    }
  }
  
  /**
   * Selecciona una conexión
   */
  selectConnection(connection: NetworkConnection | null): void {
    if (connection) {
      this.logger.debug(`Conexión seleccionada: ${connection.id || 'sin ID'}`);
      // Implementar la selección de conexión según la estructura del proyecto
    } else {
      this.logger.debug('Conexión deseleccionada');
    }
  }
} 
