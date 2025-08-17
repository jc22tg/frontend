import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { LoggerService } from '../../../../core/services/logger.service';
import { MapService } from '../map.service';

/**
 * Tipos de herramientas disponibles en el mapa
 */
export type MapToolType = 
  | 'pan'       // Herramienta de navegación
  | 'select'    // Selección de elementos
  | 'measure'   // Medición de distancias
  | 'connect'   // Crear conexiones entre elementos
  | 'area'      // Selección por área
  | 'polygon'   // Selección por polígono
  | 'edit';     // Edición de elementos

/**
 * Interfaz para datos de medición
 */
export interface MeasurementData {
  distance: number;       // Distancia en metros
  sourceId?: string;      // ID del elemento origen (opcional)
  targetId?: string;      // ID del elemento destino (opcional)
  coordinates: number[][]; // Array de coordenadas del trazado [[lng1, lat1], [lng2, lat2], ...]
  unit: 'km' | 'm';       // Unidad de medida
}

/**
 * Estado interno del servicio
 */
interface ToolsState {
  activeTool: MapToolType;
  previousTool?: MapToolType;
  isMeasuring: boolean;
  measurements: MeasurementData[];
  activeMeasurement?: MeasurementData;
}

/**
 * Servicio para gestionar las herramientas del mapa
 * 
 * Este servicio administra las diferentes herramientas de interacción con el mapa,
 * gestionando los cambios entre herramientas y las funcionalidades específicas
 * de cada una (mediciones, conexiones, selecciones, etc.)
 */
@Injectable({
  providedIn: 'root'
})
export class MapToolsService {
  // Dependencias
  private logger = inject(LoggerService);
  private mapService = inject(MapService);
  
  // Estado interno
  private state: ToolsState = {
    activeTool: 'pan',
    isMeasuring: false,
    measurements: []
  };
  
  // BehaviorSubjects para comunicar cambios
  private activeToolSubject = new BehaviorSubject<MapToolType>('pan');
  private isMeasuringSubject = new BehaviorSubject<boolean>(false);
  private measurementsSubject = new BehaviorSubject<MeasurementData[]>([]);
  private activeMeasurementSubject = new BehaviorSubject<MeasurementData | undefined>(undefined);
  
  // Observables públicos
  readonly activeTool$ = this.activeToolSubject.asObservable();
  readonly isMeasuring$ = this.isMeasuringSubject.asObservable();
  readonly measurements$ = this.measurementsSubject.asObservable();
  readonly activeMeasurement$ = this.activeMeasurementSubject.asObservable();
  
  constructor() {
    this.logger.debug('MapToolsService inicializado');
  }
  
  /**
   * Obtiene la herramienta activa actualmente
   */
  getActiveTool(): MapToolType {
    return this.state.activeTool;
  }
  
  /**
   * Cambia la herramienta activa
   * @param tool Tipo de herramienta a activar
   */
  setActiveTool(tool: MapToolType): void {
    const previousTool = this.state.activeTool;
    
    // No hacer nada si es la misma herramienta
    if (tool === previousTool) return;
    
    // Guardar herramienta previa antes de cambiar
    this.state.previousTool = previousTool;
    this.state.activeTool = tool;
    
    // Limpiar estados específicos al cambiar de herramienta
    if (previousTool === 'measure' && this.state.isMeasuring) {
      this.cancelMeasurement();
    }
    
    // Configurar el mapa según la herramienta seleccionada
    this.configureMapForTool(tool);
    
    this.logger.debug(`Herramienta cambiada: ${previousTool} -> ${tool}`);
    this.activeToolSubject.next(tool);
  }
  
  /**
   * Configura el mapa según la herramienta seleccionada
   */
  private configureMapForTool(tool: MapToolType): void {
    switch (tool) {
      case 'pan':
        // Configuración para navegación
        this.mapService.disableInteraction();
        this.mapService.enablePanning();
        break;
        
      case 'select':
        // Configuración para selección
        this.mapService.disableInteraction();
        this.mapService.enableSelection();
        break;
        
      case 'measure':
        // Configuración para medición
        this.mapService.disableInteraction();
        this.mapService.enableMeasurement();
        break;
        
      case 'connect':
        // Configuración para conexión
        this.mapService.disableInteraction();
        this.mapService.enableConnectionCreation();
        break;
        
      case 'area':
      case 'polygon':
        // Configuración para selección por área
        this.mapService.disableInteraction();
        this.mapService.enableAreaSelection();
        break;
        
      case 'edit':
        // Configuración para edición
        this.mapService.disableInteraction();
        this.mapService.enableElementEditing();
        break;
        
      default:
        this.logger.warn(`Herramienta no reconocida: ${tool}`);
        // Configuración por defecto: navegación
        this.mapService.disableInteraction();
        this.mapService.enablePanning();
    }
  }
  
  /**
   * Restaura la herramienta anterior
   */
  restorePreviousTool(): void {
    if (this.state.previousTool) {
      this.setActiveTool(this.state.previousTool);
    } else {
      // Si no hay herramienta previa, usar 'pan' por defecto
      this.setActiveTool('pan');
    }
  }
  
  /**
   * Inicia una medición
   */
  startMeasurement(): void {
    if (this.state.activeTool !== 'measure') {
      this.setActiveTool('measure');
    }
    
    this.state.isMeasuring = true;
    this.state.activeMeasurement = {
      distance: 0,
      coordinates: [],
      unit: 'm'
    };
    
    this.isMeasuringSubject.next(true);
    this.activeMeasurementSubject.next(this.state.activeMeasurement);
    this.logger.debug('Iniciando medición');
  }
  
  /**
   * Actualiza la medición actual con un nuevo punto
   * @param lat Latitud del punto
   * @param lng Longitud del punto
   */
  updateMeasurement(lat: number, lng: number): void {
    if (!this.state.isMeasuring || !this.state.activeMeasurement) {
      return;
    }
    
    // Añadir punto a las coordenadas
    this.state.activeMeasurement.coordinates.push([lng, lat]);
    
    // Calcular distancia total
    if (this.state.activeMeasurement.coordinates.length > 1) {
      this.state.activeMeasurement.distance = this.calculateTotalDistance(
        this.state.activeMeasurement.coordinates
      );
      
      // Actualizar unidad si es necesario
      if (this.state.activeMeasurement.distance > 1000) {
        this.state.activeMeasurement.unit = 'km';
        this.state.activeMeasurement.distance /= 1000;
      }
    }
    
    this.activeMeasurementSubject.next(this.state.activeMeasurement);
    this.logger.debug(`Medición actualizada: ${this.state.activeMeasurement.distance} ${this.state.activeMeasurement.unit}`);
  }
  
  /**
   * Finaliza la medición actual y la guarda
   */
  finishMeasurement(): void {
    if (!this.state.isMeasuring || !this.state.activeMeasurement) {
      return;
    }
    
    // Solo guardar mediciones válidas
    if (this.state.activeMeasurement.coordinates.length > 1) {
      this.state.measurements.push({ ...this.state.activeMeasurement });
      this.measurementsSubject.next([...this.state.measurements]);
      this.logger.debug(`Medición finalizada: ${this.state.activeMeasurement.distance} ${this.state.activeMeasurement.unit}`);
    }
    
    this.state.isMeasuring = false;
    this.state.activeMeasurement = undefined;
    
    this.isMeasuringSubject.next(false);
    this.activeMeasurementSubject.next(undefined);
  }
  
  /**
   * Cancela la medición actual sin guardarla
   */
  cancelMeasurement(): void {
    if (!this.state.isMeasuring) {
      return;
    }
    
    this.state.isMeasuring = false;
    this.state.activeMeasurement = undefined;
    
    this.isMeasuringSubject.next(false);
    this.activeMeasurementSubject.next(undefined);
    this.logger.debug('Medición cancelada');
  }
  
  /**
   * Limpia todas las mediciones guardadas
   */
  clearMeasurements(): void {
    this.state.measurements = [];
    this.measurementsSubject.next([]);
    this.logger.debug('Mediciones eliminadas');
  }
  
  /**
   * Calcula la distancia total de un conjunto de coordenadas
   * @param coordinates Coordenadas [[lng1, lat1], [lng2, lat2], ...]
   * @returns Distancia en metros
   */
  private calculateTotalDistance(coordinates: number[][]): number {
    let totalDistance = 0;
    
    for (let i = 1; i < coordinates.length; i++) {
      const [lng1, lat1] = coordinates[i - 1];
      const [lng2, lat2] = coordinates[i];
      
      totalDistance += this.calculateDistance(lat1, lng1, lat2, lng2);
    }
    
    return totalDistance;
  }
  
  /**
   * Calcula la distancia entre dos puntos usando la fórmula de Haversine
   * @returns Distancia en metros
   */
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371e3; // Radio de la Tierra en metros
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lng2 - lng1) * Math.PI) / 180;
    
    const a = 
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
      
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return distance;
  }
} 
