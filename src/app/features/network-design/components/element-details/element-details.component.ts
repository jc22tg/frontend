import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, TrackByFunction, CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogConfig, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, BehaviorSubject } from 'rxjs';
import { takeUntil, distinctUntilChanged, filter, debounceTime } from 'rxjs/operators';

// Importamos las animaciones compartidas
import { fadeAnimation, listAnimation, scaleAnimation } from '../../animations';

import { NetworkFacade } from '../../facades/network.facade';
import { 
  NetworkElement,
  ElementType, 
  ElementStatus, 
  MonitoringData, 
  OLT,
  ONT,
  ODF,
  EDFA,
  Splitter,
  Manga,
  TerminalBox,
  FiberThread,
  NetworkConnection,
  WDMFilter,
  Router,
  Rack
} from '../../../../shared/types/network.types';
import { ElementService } from '../../services/element.service';
import { MapService } from '../../services/map.service';
import { ElementDetailRowComponent } from '../element-detail-row/element-detail-row.component';
import { ConfirmDialogComponent } from '../../../../shared/confirm-dialog/confirm-dialog.component';

/**
 * Tipo de unión que representa todos los tipos posibles de elementos
 */
type ElementUnion = OLT | ONT | ODF | EDFA | Splitter | Manga | TerminalBox | FiberThread | 
                    WDMFilter | Router | Rack;

/**
 * Interfaz extendida para datos de monitoreo con timestamp
 */
interface MonitoringDataWithTimestamp extends MonitoringData {
  timestamp: Date;
  elementId: string;
}

/**
 * Configuración de métricas con unidades y funciones de formato
 */
interface MetricConfig {
  unit: string;
  formatFn?: (value: number) => string;
}

/**
 * Componente que muestra los detalles de un elemento de red seleccionado
 * 
 * Este componente visualiza toda la información relevante de un elemento de red,
 * adaptando su interfaz según el tipo de elemento. Implementa detección de cambios
 * OnPush para optimizar el rendimiento.
 */
@Component({
  selector: 'app-element-details',
  templateUrl: './element-details.component.html',
  styleUrls: ['./element-details.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDialogModule,
    ElementDetailRowComponent
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [fadeAnimation, listAnimation, scaleAnimation]
})
export class ElementDetailsComponent implements OnInit, OnDestroy {
  /** Subject para gestionar la limpieza de suscripciones */
  private readonly destroy$ = new Subject<void>();
  
  /** BehaviorSubject para manejar el estado de carga */
  private readonly loading$ = new BehaviorSubject<boolean>(false);
  
  /** BehaviorSubject para manejar errores */
  private readonly error$ = new BehaviorSubject<string | null>(null);
  
  /** ID de intervalo para actualización de monitoreo */
  private monitoringInterval: number | null = null;
  
  /** Elemento de red actualmente seleccionado */
  element: NetworkElement | null = null;
  
  /** Datos de monitoreo del elemento seleccionado */
  monitoringData: MonitoringDataWithTimestamp | null = null;
  
  /** Configuración de métricas con unidades */
  private readonly metricConfigs: Record<string, MetricConfig> = {
    temperature: { unit: '°C' },
    humidity: { unit: '%' },
    voltage: { unit: 'V' },
    current: { unit: 'A' },
    power: { unit: 'W' },
    signal: { unit: 'dBm' },
    bandwidth: { unit: 'Mbps' },
    latency: { unit: 'ms' },
    uptime: { unit: 'h' },
    freeSpace: { unit: 'GB' },
    cpu: { unit: '%' },
    memory: { unit: '%' },
    storage: { unit: '%' },
    load: { unit: '%' },
    traffic: { unit: 'Mbps' },
    errorRate: { unit: 'ppm' }
  };
  
  /** Getter para el estado de carga */
  get loading(): boolean {
    return this.loading$.value;
  }
  
  /** Getter para el mensaje de error */
  get error(): string | null {
    return this.error$.value;
  }
  
  /** Constantes disponibles en el template */
  readonly ElementType = ElementType;
  readonly ElementStatus = ElementStatus;
  
  /** ID del elemento actual para optimizar */
  currentElementId: string | null = null;

  /** TrackBy function para optimizar ngFor */
  readonly trackByProperty: TrackByFunction<[string, any]> = (index, item) => item[0];

  /** TrackBy function para optimizar ngFor de conexiones */
  readonly trackByConnection: TrackByFunction<NetworkConnection> = (index, item) => item.id || index;

  /**
   * Constructor con inyección de dependencias
   * 
   * @param networkFacade Fachada para acceso a datos de la red
   * @param dialog Servicio de diálogos de Material
   * @param mapService Servicio para interactuar con el mapa
   * @param elementService Servicio para operaciones con elementos
   * @param cdr Referencia al detector de cambios para OnPush
   */
  constructor(
    private networkFacade: NetworkFacade,
    private dialog: MatDialog,
    private mapService: MapService,
    private elementService: ElementService,
    private cdr: ChangeDetectorRef
  ) {}

  /**
   * Inicialización del componente y suscripción a eventos
   */
  ngOnInit(): void {
    this.subscribeToSelectedElement();
    this.setupMonitoringUpdates();
  }

  /**
   * Limpieza de recursos al destruir el componente
   */
  ngOnDestroy(): void {
    // Limpiar el intervalo de monitoreo
    if (this.monitoringInterval !== null) {
      window.clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    this.destroy$.next();
    this.destroy$.complete();
    this.loading$.complete();
    this.error$.complete();
  }

  /**
   * Configura actualizaciones periódicas de datos de monitoreo
   * @private
   */
  private setupMonitoringUpdates(): void {
    // Actualizar datos de monitoreo cada 30 segundos si hay un elemento seleccionado
    const MONITORING_UPDATE_INTERVAL = 30000;
    
    this.monitoringInterval = window.setInterval(() => {
      if (this.currentElementId && !this.loading) {
        this.loadMonitoringData(this.element as NetworkElement);
      }
    }, MONITORING_UPDATE_INTERVAL);
  }

  /**
   * Suscribe a cambios en el elemento seleccionado con optimizaciones
   * @private
   */
  private subscribeToSelectedElement(): void {
    this.networkFacade.getSelectedElement()
      .pipe(
        takeUntil(this.destroy$),
        distinctUntilChanged((prev, curr) => prev?.id === curr?.id),
        debounceTime(100) // Evitar múltiples actualizaciones rápidas
      )
      .subscribe({
        next: (element) => {
          this.element = element;
          
          if (element) {
            this.currentElementId = element.id || null;
            this.loadMonitoringData(element);
            this.updateMapPosition();
          } else {
            this.currentElementId = null;
            this.monitoringData = null;
          }
          
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Error al obtener elemento seleccionado:', error);
          this.error$.next('Error al cargar el elemento');
          this.cdr.markForCheck();
        }
      });
  }

  /**
   * Carga datos de monitoreo para el elemento seleccionado
   * con mejor gestión de errores y estado de carga
   * 
   * @param element Elemento del que se cargarán los datos de monitoreo
   * @private
   */
  loadMonitoringData(element: NetworkElement): void {
    if (!element.id) {
      this.error$.next('Error: Elemento sin ID válido');
      this.loading$.next(false);
      return;
    }
    
    // Evitar cargar datos si ya tenemos datos actualizados para este elemento
    if (this.monitoringData?.elementId === element.id && 
        Date.now() - (this.monitoringData.timestamp.getTime() || 0) < 30000) {
      return;
    }
    
    this.loading$.next(true);
    this.error$.next(null);
    this.monitoringData = null;
    this.cdr.markForCheck();

    this.networkFacade.getElementMetrics(element.id)
      .pipe(
        takeUntil(this.destroy$),
        filter(() => this.currentElementId === element.id)
      )
      .subscribe({
        next: (data) => {
          this.monitoringData = {
            ...data,
            timestamp: new Date(),
            elementId: element.id as string
          };
          this.loading$.next(false);
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Error loading monitoring data:', error);
          this.error$.next('Error al cargar los datos de monitoreo');
          this.loading$.next(false);
          this.cdr.markForCheck();
        }
      });
  }

  /**
   * Maneja la edición de elemento
   */
  onEdit(): void {
    if (!this.element) return;
    
    // Implementación de lógica de edición usando dialogo
    const dialogConfig = new MatDialogConfig();
    dialogConfig.data = { element: this.element };
    dialogConfig.width = '600px';
    dialogConfig.maxWidth = '90vw';
    dialogConfig.disableClose = true;
    
    // Abrir diálogo de edición (la implementación exacta dependerá del componente de edición)
    this.dialog.open(dialogConfig.data.component || ConfirmDialogComponent, dialogConfig);
  }

  /**
   * Maneja la eliminación de elemento con confirmación usando Material Dialog
   */
  onDelete(): void {
    if (!this.element) return;
    
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Confirmar eliminación',
        message: `¿Está seguro que desea eliminar el elemento "${this.element.name}"?`,
        confirmText: 'Eliminar',
        cancelText: 'Cancelar'
      }
    });
    
    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        if (result && this.element?.id) {
          this.networkFacade.deleteElement(this.element.id);
        }
      });
  }

  /**
   * Obtiene la clase CSS para el estado del elemento
   * 
   * @param status Estado del elemento
   * @returns Nombre de clase CSS correspondiente
   */
  getElementStatusClass(status: ElementStatus): string {
    return this.elementService.getElementStatusClass(status);
  }

  /**
   * Obtiene la clase CSS para el tipo de elemento
   * 
   * @param type Tipo de elemento
   * @returns Nombre de clase CSS correspondiente
   */
  getElementTypeClass(type: ElementType): string {
    return type.toString();
  }

  /**
   * Obtiene el nombre legible del tipo de elemento
   * 
   * @param type Tipo de elemento
   * @returns Nombre descriptivo del tipo
   */
  getElementTypeName(type: ElementType): string {
    return this.elementService.getElementTypeName(type);
  }

  /**
   * Obtiene una propiedad específica del elemento con mejor seguridad de tipos
   * 
   * @param property Nombre de la propiedad a obtener
   * @returns Valor de la propiedad o undefined si no existe
   */
  getElementProperty(property: string): string | number | undefined {
    if (!this.element) return undefined;
    
    // Acceso seguro a propiedades
    const value = (this.element as any)[property];
    
    // Si es un número, aseguramos que sea un número
    if (typeof value === 'number') return value;
    
    // Si es un string, lo devolvemos directamente
    if (typeof value === 'string') return value;
    
    // Para otros tipos complejos, convertimos a string cuando sea posible
    if (value && typeof value === 'object') {
      try {
        if ('toString' in value && typeof value.toString === 'function') {
          return value.toString();
        }
        return JSON.stringify(value);
      } catch (e) {
        return undefined;
      }
    }
    
    return undefined;
  }
  
  /**
   * Obtiene una propiedad numérica específica del elemento
   * 
   * @param property Nombre de la propiedad a obtener
   * @returns Valor de la propiedad como número o undefined
   */
  getNumberProperty(property: string): number | undefined {
    if (!this.element) return undefined;
    
    const value = (this.element as any)[property];
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const num = parseFloat(value);
      if (!isNaN(num)) return num;
    }
    
    return undefined;
  }

  /**
   * Verifica si una propiedad existe y tiene un valor válido
   * @param property Nombre de la propiedad a verificar
   * @returns true si la propiedad existe y tiene valor
   */
  hasProperty(property: string): boolean {
    if (!this.element) return false;
    const value = (this.element as unknown as Record<string, unknown>)[property];
    return value !== undefined && value !== null && value !== '';
  }

  /**
   * Calcula el porcentaje de uso para un elemento
   * @param element Elemento del que calcular el uso
   * @returns Porcentaje de uso (0-100)
   */
  getUsagePercentage(element: NetworkElement | null): number {
    if (!element) return 0;
    
    const el = element as unknown as Record<string, unknown>;
    
    // Detectar automáticamente las propiedades disponibles para calcular el uso
    if (typeof el.usedPorts === 'number' && typeof el.totalPorts === 'number') {
      return Math.min(Math.round((el.usedPorts / el.totalPorts) * 100), 100);
    } else if (typeof el.usedCapacity === 'number' && typeof el.totalCapacity === 'number') {
      return Math.min(Math.round((el.usedCapacity / el.totalCapacity) * 100), 100);
    } else if (typeof el.usage === 'number' && typeof el.capacity === 'number') {
      return Math.min(Math.round((el.usage / el.capacity) * 100), 100);
    }
    
    return 0;
  }

  /**
   * Formatea un valor numérico con unidades
   * @param value Valor a formatear
   * @param unit Unidad a agregar
   * @param decimals Número de decimales
   * @returns Valor formateado con unidad
   */
  formatValue(value: number | undefined, unit = '', decimals = 1): string {
    if (value === undefined) return 'N/A';
    return `${value.toFixed(decimals)}${unit ? ' ' + unit : ''}`;
  }

  /**
   * Actualiza la posición del mapa al elemento seleccionado
   * @private
   */
  private updateMapPosition(): void {
    if (!this.element?.position?.coordinates) return;
    
    const [lng, lat] = this.element.position.coordinates;
    this.mapService.centerOnCoordinates({ x: lng, y: lat });
  }

  /**
   * Enfoca el elemento en el mapa
   */
  focusOnMap(): void {
    if (!this.element?.position?.coordinates) return;
    
    const [lng, lat] = this.element.position.coordinates;
    this.mapService.setZoom(18, true);
    this.mapService.centerOnCoordinates({ x: lng, y: lat });
  }

  /**
   * Obtiene el ícono correspondiente al estado del elemento
   * @param status Estado del elemento
   * @returns Nombre del ícono Material
   */
  getStatusIcon(status: ElementStatus): string {
    switch (status) {
      case ElementStatus.ACTIVE:
        return 'check_circle';
      case ElementStatus.INACTIVE:
        return 'cancel';
      case ElementStatus.MAINTENANCE:
        return 'build';
      case ElementStatus.FAULT:
        return 'error';
      case ElementStatus.PLANNED:
        return 'schedule';
      case ElementStatus.BUILDING:
        return 'construction';
      case ElementStatus.RESERVED:
        return 'bookmark';
      case ElementStatus.DECOMMISSIONED:
        return 'archive';
      default:
        return 'help';
    }
  }

  /**
   * Verifica si el elemento tiene información de capacidad para mostrar
   * @param element Elemento a verificar
   * @returns true si el elemento tiene propiedades de capacidad
   */
  hasCapacityInfo(element: NetworkElement | null): boolean {
    if (!element) return false;
    
    const castedElement = element as unknown as Record<string, unknown>;
    return (
      (castedElement.totalPorts !== undefined && castedElement.usedPorts !== undefined) ||
      (castedElement.capacity !== undefined) ||
      (castedElement.totalCapacity !== undefined)
    );
  }

  /**
   * Obtiene el valor de capacidad formateado según el tipo de elemento
   * @param element Elemento del que obtener capacidad
   * @returns Texto formateado de capacidad
   */
  getCapacityValue(element: NetworkElement | null): string {
    if (!element) return 'N/A';
    
    const el = element as unknown as Record<string, unknown>;
    
    if (el.totalPorts !== undefined) {
      return `${el.totalPorts} puertos`;
    } else if (el.totalCapacity !== undefined) {
      return `${el.totalCapacity} ${el.capacityUnit || 'unidades'}`;
    } else if (el.capacity !== undefined) {
      return `${el.capacity} ${el.capacityUnit || 'unidades'}`;
    }
    
    return 'N/A';
  }

  /**
   * Obtiene las métricas de monitoreo como array de pares clave-valor
   * @returns Array de pares [nombre, {valor, unidad}]
   */
  getMonitoringMetrics(): [string, { value: string, unit: string }][] {
    if (!this.monitoringData) return [];
    
    // Filtrar propiedades internas como elementId y timestamp
    const excludedProps = ['elementId', 'timestamp', 'id'];
    
    return Object.entries(this.monitoringData)
      .filter(([key]) => !excludedProps.includes(key))
      .map(([key, value]) => {
        // Si el valor es un objeto con value y unit, usarlo directamente
        if (typeof value === 'object' && value !== null && 'value' in value && 'unit' in value) {
          return [key, value as { value: string, unit: string }];
        }
        
        // Si es un valor simple, convertirlo al formato esperado
        return [
          key, 
          { 
            value: typeof value === 'number' ? value.toFixed(2) : String(value),
            unit: this.getUnitForMetric(key)
          }
        ];
      });
  }

  /**
   * Maneja el clic en una conexión
   * @param connection Conexión en la que se hizo clic
   */
  onConnectionClick(connection: NetworkConnection): void {
    if (!connection || !connection.id) return;
    
    // Buscar el elemento conectado por ID y seleccionarlo
    this.networkFacade.getElementById(connection.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe(element => {
        if (element) {
          this.networkFacade.selectElement(element);
        }
      });
  }

  /**
   * Determina la unidad para una métrica según su nombre
   * @param metricName Nombre de la métrica
   * @returns Unidad correspondiente
   * @private
   */
  private getUnitForMetric(metricName: string): string {
    // Buscar coincidencia exacta primero
    if (metricName in this.metricConfigs) {
      return this.metricConfigs[metricName].unit;
    }
    
    // Buscar coincidencias parciales en nombres de métricas
    for (const [key, config] of Object.entries(this.metricConfigs)) {
      if (metricName.toLowerCase().includes(key.toLowerCase())) {
        return config.unit;
      }
    }
    
    return '';
  }

  /**
   * Obtiene las propiedades genéricas del elemento actual
   * @returns Un array de pares [nombre, valor] de las propiedades genéricas
   */
  getGenericProperties(): [string, string | number][] {
    if (!this.element) return [];
    
    // Lista de propiedades que no queremos mostrar
    const excludedProps = ['id', 'name', 'type', 'status', 'position', 'coordinates', 
                          'installDate', 'serialNumber', 'model', 'manufacturer',
                          'connections'];
    
    const result: [string, string | number][] = [];
    
    // Convertir el elemento a un objeto regular
    const elementObj = { ...this.element };
    
    // Recorrer las propiedades
    for (const key in elementObj) {
      if (Object.prototype.hasOwnProperty.call(elementObj, key) && !excludedProps.includes(key)) {
        const value = elementObj[key];
        
        // Saltamos propiedades nulas o undefined
        if (value === null || value === undefined) continue;
        
        // Convertimos a string o number según corresponda
        if (typeof value === 'number') {
          result.push([key, value]);
        } else if (typeof value === 'string') {
          result.push([key, value]);
        } else if (typeof value === 'boolean') {
          result.push([key, value ? 'Sí' : 'No']);
        } else if (typeof value === 'object') {
          // Para objetos complejos, intentamos convertir a JSON
          try {
            result.push([key, JSON.stringify(value)]);
          } catch (e) {
            // Si no se puede convertir, lo omitimos
            continue;
          }
        }
      }
    }
    
    return result;
  }

  /**
   * Formatea una fecha como string legible
   * @param value Fecha como string, number o Date
   * @returns Fecha formateada o N/A si no es válida
   */
  formatDate(value: string | number | undefined): string {
    if (value === undefined) return 'N/A';
    
    try {
      const date = new Date(value);
      if (isNaN(date.getTime())) return 'N/A';
      
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (e) {
      return 'N/A';
    }
  }

  /**
   * Obtiene el número de propiedades específicas para la animación
   * @returns El número de propiedades
   */
  getPropertiesCount(): number {
    if (!this.element) return 0;
    
    // Lógica para determinar el número de propiedades según el tipo
    switch (this.element.type) {
      case ElementType.OLT:
        return this.countPropertiesForType(['ipAddress', 'domain', 'ponPorts']);
      case ElementType.ONT:
        return this.countPropertiesForType(['oltId', 'macAddress', 'signalLevel']);
      case ElementType.SPLITTER:
        return this.countPropertiesForType(['ratio', 'level', 'insertionLoss']);
      case ElementType.EDFA:
        return this.countPropertiesForType(['gainRange', 'pumpPower', 'currentGain']);
      case ElementType.ODF:
        return this.countPropertiesForType(['rackPosition', 'connectorType']);
      case ElementType.FIBER_THREAD:
        return this.countPropertiesForType(['length', 'attenuation', 'fiberType']);
      default:
        // Para elementos genéricos
        return this.getGenericProperties().length;
    }
  }
  
  /**
   * Cuenta cuántas propiedades de la lista existen en el elemento
   * @param properties Lista de nombres de propiedades a verificar
   * @returns Número de propiedades existentes
   */
  private countPropertiesForType(properties: string[]): number {
    return properties.filter(prop => this.hasProperty(prop)).length;
  }

  /**
   * Verifica si el elemento tiene conexiones
   * @returns True si tiene conexiones, false en caso contrario
   */
  hasConnections(): boolean {
    return Array.isArray(this.element?.connections) && this.element.connections.length > 0;
  }
  
  /**
   * Obtiene el número de conexiones del elemento
   * @returns Número de conexiones
   */
  getConnectionsCount(): number {
    if (!this.element?.connections) return 0;
    return this.element.connections.length;
  }
}
