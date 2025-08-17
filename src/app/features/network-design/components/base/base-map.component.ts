import { Directive, OnInit, OnDestroy, ChangeDetectorRef, NgZone, ElementRef, Injector } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LoggerService } from '../../../../core/services/logger.service';
import { ElementType, ElementStatus, NetworkElement, NetworkConnection } from '../../../../shared/types/network.types';
import { ElementService } from '../../services/element.service';
import { NetworkStateService } from '../../services/network-state.service';
import { MapEventsService } from '../../services/map-events.service';
import { MapComponentInitializerService } from '../../services/map-component-initializer.service';
import { ELEMENT_TYPE_NAMES, ELEMENT_STATUS_CLASSES } from '../../../../shared/constants/network.constants';
import { UtilsService } from '../../../../shared/services/utils.service';

/**
 * Interfaz para los datos en caché de memoización
 * 
 * @property {T} value - El valor almacenado en caché
 * @property {number} timestamp - Marca de tiempo cuando se almacenó el valor
 * @property {number} ttl - Tiempo de vida en milisegundos
 * @property {number} hitCount - Contador de veces que se ha accedido a este valor
 */
interface CacheEntry<T> {
  value: T;
  timestamp: number;
  ttl: number;
  hitCount: number;
}

/**
 * Niveles de log disponibles para depuración
 */
enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  PERFORMANCE = 'performance'
}

/**
 * Componente base abstracto para todos los componentes relacionados con el mapa de red
 * 
 * Esta clase abstracta proporciona funcionalidad común a todos los componentes de mapa,
 * estandarizando la gestión de errores, logging, ciclo de vida y operaciones frecuentes.
 * Implementa los patrones Observer (con destroy$) y Memoización para optimizar rendimiento.
 * 
 * @abstract
 * @implements {OnInit, OnDestroy}
 * 
 * @description
 * Este componente proporciona:
 * - Gestión común del ciclo de vida con hooks estandarizados
 * - Inyección centralizada de servicios mediante Injector
 * - Manejo estandarizado de errores con logging detallado
 * - Sistema de memoización para optimizar operaciones costosas
 * - Métodos de utilidad para operaciones habituales en mapas
 * - Logging condicional basado en modo debug
 * - Gestión unificada de eventos de selección de elementos/conexiones
 * - Métricas de rendimiento para memoización
 */
@Directive()
export abstract class BaseMapComponent implements OnInit, OnDestroy {
  /**
   * Subject para desuscribirse de Observables cuando el componente se destruye
   * Utilizado como parte del patrón de limpieza con takeUntil
   * 
   * @protected
   * @type {Subject<void>}
   */
  protected destroy$ = new Subject<void>();
  
  /**
   * Indica si el componente está en proceso de carga
   * Se utiliza para mostrar indicadores visuales de carga (spinners, etc.)
   * 
   * @protected
   * @type {boolean}
   * @default true
   */
  protected isLoading = true;
  
  /**
   * Almacena el mensaje de error si ocurre alguno durante la inicialización o uso
   * Si es null, no hay errores activos
   * 
   * @protected
   * @type {string | null}
   * @default null
   */
  protected error: string | null = null;
  
  /**
   * Indica si el mapa se ha inicializado correctamente
   * Se usa para prevenir operaciones en un mapa no inicializado
   * 
   * @protected
   * @type {boolean}
   * @default false
   */
  protected mapInitialized = false;
  
  /**
   * Servicio para registro de logs centralizado
   * 
   * @protected
   * @type {LoggerService}
   */
  protected logger: LoggerService;
  
  /**
   * Detector de cambios para forzar actualizaciones en la vista
   * 
   * @protected
   * @type {ChangeDetectorRef}
   */
  protected cdr: ChangeDetectorRef;
  
  /**
   * Servicio NgZone para ejecutar código dentro/fuera de Angular Zone
   * Especialmente útil para operaciones con librerías externas como Leaflet
   * 
   * @protected
   * @type {NgZone}
   */
  protected zone: NgZone;
  
  /**
   * Servicio para mostrar notificaciones emergentes
   * 
   * @protected
   * @type {MatSnackBar}
   */
  protected snackBar: MatSnackBar;
  
  /**
   * Servicio para gestionar elementos de red
   * 
   * @protected
   * @type {ElementService}
   */
  protected elementService: ElementService;
  
  /**
   * Servicio para gestionar el estado global de la red
   * 
   * @protected
   * @type {NetworkStateService}
   */
  protected networkStateService: NetworkStateService;
  
  /**
   * Servicio para gestionar eventos del mapa
   * Proporciona comunicación entre componentes relacionados con el mapa
   * 
   * @protected
   * @type {MapEventsService}
   */
  protected mapEventsService: MapEventsService;
  
  /**
   * Servicio para inicialización de componentes de mapa
   * 
   * @protected
   * @type {MapComponentInitializerService}
   */
  protected mapInitializer: MapComponentInitializerService;
  
  /**
   * Servicio de utilidades general
   * 
   * @protected
   * @type {UtilsService}
   */
  protected utils: UtilsService;
  
  /**
   * Caché para almacenar resultados de operaciones memoizadas
   * Mejora rendimiento evitando cálculos repetitivos
   * 
   * @private
   * @type {Map<string, CacheEntry<any>>}
   */
  private memoizationCache = new Map<string, CacheEntry<any>>();
  
  /**
   * Indica si el modo debug está activado
   * Cuando está activado, se registran logs detallados
   * 
   * @private
   * @type {boolean}
   * @default false
   */
  private debugMode = false;
  
  /**
   * Niveles de log habilitados para depuración
   * 
   * @private
   * @type {Set<LogLevel>}
   */
  private enabledLogLevels = new Set<LogLevel>([
    LogLevel.ERROR,
    LogLevel.WARN
  ]);
  
  /**
   * Estadísticas de uso de la caché de memoización
   */
  private memoStats = {
    hits: 0,
    misses: 0,
    expired: 0,
    totalEntries: 0
  };
  
  /**
   * Constructor que inyecta todos los servicios comunes a través del Injector
   * Utiliza el patrón de inyección de dependencias de Angular
   * 
   * @param {Injector} injector - Injector de Angular para resolver servicios comunes
   */
  constructor(protected injector: Injector) {
    // Inyección de servicios comunes
    this.logger = this.injector.get(LoggerService);
    this.cdr = this.injector.get(ChangeDetectorRef);
    this.zone = this.injector.get(NgZone);
    this.snackBar = this.injector.get(MatSnackBar);
    this.elementService = this.injector.get(ElementService);
    this.networkStateService = this.injector.get(NetworkStateService);
    this.mapEventsService = this.injector.get(MapEventsService);
    this.mapInitializer = this.injector.get(MapComponentInitializerService);
    this.utils = this.injector.get(UtilsService);
    
    // Detectar modo debug
    this.checkDebugMode();
  }
  
  /**
   * Método abstracto que todas las subclases deben implementar
   * Define el contrato que deben cumplir las clases hijas
   * 
   * Aquí se debe implementar la lógica específica de inicialización de cada componente,
   * como configuración de capas de mapa, registro de oyentes de eventos específicos, etc.
   * 
   * @abstract
   * @protected
   * @returns {void}
   */
  protected abstract initializeComponent(): void;
  
  /**
   * Verifica si el modo debug está activado consultando el localStorage o parámetros de URL
   * El modo debug puede activarse de dos formas:
   * 1. Con localStorage.setItem('networkmap_debug_mode', 'true')
   * 2. Con el parámetro URL ?debug=true
   * 
   * @private
   * @returns {void}
   */
  private checkDebugMode(): void {
    // Verificar localStorage
    const debugFromStorage = localStorage.getItem('networkmap_debug_mode');
    if (debugFromStorage === 'true') {
      this.debugMode = true;
      this.enableAllLogLevels();
      this.logDebug('Modo debug activado desde localStorage');
      return;
    }
    
    // Verificar URL params si estamos en el navegador
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const debugParam = urlParams.get('debug');
      if (debugParam === 'true') {
        this.debugMode = true;
        this.enableAllLogLevels();
        this.logDebug('Modo debug activado desde URL');
      }
      
      // Configurar niveles de log desde parámetros URL
      const logLevels = urlParams.get('logLevels');
      if (logLevels) {
        this.configureLogLevels(logLevels.split(','));
      }
    }
  }
  
  /**
   * Habilita todos los niveles de log para depuración
   * 
   * @private
   * @returns {void}
   */
  private enableAllLogLevels(): void {
    this.enabledLogLevels = new Set(Object.values(LogLevel));
  }
  
  /**
   * Configura los niveles de log habilitados
   * 
   * @private
   * @param {string[]} levels - Nombres de los niveles a habilitar
   * @returns {void}
   */
  private configureLogLevels(levels: string[]): void {
    if (!levels || levels.length === 0) return;
    
    this.enabledLogLevels.clear();
    levels.forEach(level => {
      const logLevel = level.toLowerCase() as LogLevel;
      if (Object.values(LogLevel).includes(logLevel)) {
        this.enabledLogLevels.add(logLevel);
      }
    });
    
    // Siempre habilitar errores
    this.enabledLogLevels.add(LogLevel.ERROR);
  }
  
  /**
   * Registra logs detallados solo si el modo debug está activado
   * Incluye timestamp y nombre del componente para facilitar depuración
   * 
   * @protected
   * @param {string} message - Mensaje a registrar en el log
   * @param {any} [data] - Datos adicionales opcionales para incluir en el log
   * @param {LogLevel} [level=LogLevel.DEBUG] - Nivel de log
   * @returns {void}
   */
  protected logDebug(message: string, data?: any, level: LogLevel = LogLevel.DEBUG): void {
    if (!this.debugMode && !this.enabledLogLevels.has(level)) return;
    
    const componentName = this.constructor.name;
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${componentName}] ${message}`;
    
    switch (level) {
      case LogLevel.INFO:
        data ? this.logger.info(logMessage, data) : this.logger.info(logMessage);
        break;
      case LogLevel.WARN:
        data ? this.logger.warn(logMessage, data) : this.logger.warn(logMessage);
        break;
      case LogLevel.ERROR:
        data ? this.logger.error(logMessage, data) : this.logger.error(logMessage);
        break;
      case LogLevel.PERFORMANCE:
        data ? this.logger.debug(`[PERFORMANCE] ${logMessage}`, data) : this.logger.debug(`[PERFORMANCE] ${logMessage}`);
        break;
      case LogLevel.DEBUG:
      default:
        data ? this.logger.debug(logMessage, data) : this.logger.debug(logMessage);
    }
  }
  
  /**
   * Implementa el patrón de Memoización para cachear resultados de operaciones costosas
   * Reduce la carga de CPU al evitar recalcular valores que no cambian frecuentemente
   * Incluye sistema de estadísticas para analizar la eficacia de la caché
   * 
   * @protected
   * @template T - Tipo de dato devuelto por la función memoizada
   * @param {string} key - Clave única para identificar esta operación en la caché
   * @param {() => T} callback - Función que realiza la operación costosa
   * @param {number} [ttlMs=5000] - Tiempo de vida en milisegundos (por defecto 5 segundos)
   * @returns {T} - El resultado de la función, ya sea de caché o recién calculado
   */
  protected memoize<T>(key: string, callback: () => T, ttlMs = 5000): T {
    const cacheKey = `${this.constructor.name}_${key}`;
    const now = Date.now();
    
    // Verificar si el valor está en caché y es válido
    const cachedEntry = this.memoizationCache.get(cacheKey);
    
    if (cachedEntry) {
      if (now - cachedEntry.timestamp < cachedEntry.ttl) {
        // Actualizar contador de accesos y registrar estadísticas
        cachedEntry.hitCount++;
        this.memoStats.hits++;
        
        this.logDebug(`Cache hit para: ${cacheKey} (hit count: ${cachedEntry.hitCount})`, 
          { ttl: cachedEntry.ttl, age: now - cachedEntry.timestamp }, 
          LogLevel.PERFORMANCE
        );
        
        return cachedEntry.value;
      } else {
        // El valor expiró, registrar estadísticas
        this.memoStats.expired++;
        this.logDebug(`Cache expired para: ${cacheKey}`, 
          { age: now - cachedEntry.timestamp, ttl: cachedEntry.ttl }, 
          LogLevel.PERFORMANCE
        );
      }
    } else {
      this.memoStats.misses++;
    }
    
    // Calcular nuevo valor
    const startTime = performance.now();
    const value = callback();
    const executionTime = performance.now() - startTime;
    
    // Almacenar en caché
    this.memoizationCache.set(cacheKey, {
      value,
      timestamp: now,
      ttl: ttlMs,
      hitCount: 1
    });
    
    this.memoStats.totalEntries = this.memoizationCache.size;
    
    this.logDebug(`Cache miss para: ${cacheKey}, calculado en ${executionTime.toFixed(2)}ms`, 
      { executionTime, cacheSize: this.memoizationCache.size }, 
      LogLevel.PERFORMANCE
    );
    
    return value;
  }
  
  /**
   * Limpia entradas específicas o toda la caché de memoización
   * Útil cuando cambian datos que invalidarían los valores en caché
   * 
   * @protected
   * @param {string} [key] - Clave específica a limpiar (si se omite, limpia toda la caché)
   * @returns {void}
   */
  protected clearMemoization(key?: string): void {
    if (key) {
      const cacheKey = `${this.constructor.name}_${key}`;
      this.memoizationCache.delete(cacheKey);
      this.logDebug(`Caché limpiada para: ${cacheKey}`, null, LogLevel.PERFORMANCE);
    } else {
      const count = this.memoizationCache.size;
      this.memoizationCache.clear();
      this.logDebug(`Toda la caché de memoización ha sido limpiada (${count} entradas)`, null, LogLevel.PERFORMANCE);
    }
    
    this.memoStats.totalEntries = this.memoizationCache.size;
  }
  
  /**
   * Obtiene las estadísticas de uso de la caché de memoización
   * Útil para monitoreo y optimización del rendimiento
   * 
   * @protected
   * @returns {Object} - Estadísticas de uso de caché
   */
  protected getMemoizationStats(): typeof this.memoStats {
    const hitRatio = this.memoStats.hits / (this.memoStats.hits + this.memoStats.misses);
    this.logDebug(`Estadísticas de memoización:`, {
      ...this.memoStats,
      hitRatio: isNaN(hitRatio) ? 0 : hitRatio.toFixed(2),
      cacheSize: this.memoizationCache.size
    }, LogLevel.PERFORMANCE);
    
    return { ...this.memoStats };
  }
  
  /**
   * Método centralizado para gestión de errores
   * Proporciona manejo consistente de errores en todos los componentes de mapa:
   * 1. Registra el error con detalles en el log
   * 2. Notifica al usuario mediante un snackbar
   * 3. Actualiza el estado del componente
   * 4. Opcionalmente lanza un evento personalizado
   * 
   * @protected
   * @param {any} error - El error capturado
   * @param {string} [message='Error en el componente de mapa'] - Mensaje descriptivo para el usuario
   * @param {boolean} [showToUser=true] - Si se debe mostrar notificación al usuario
   * @returns {void}
   */
  protected handleError(error: any, message = 'Error en el componente de mapa', showToUser = true): void {
    this.error = message;
    this.isLoading = false;
    
    // Log detallado del error
    const componentName = this.constructor.name;
    const errorDetails = error ? (error.message || JSON.stringify(error)) : 'Error desconocido';
    this.logger.error(`[${componentName}] ${message}`, {
      component: componentName,
      message: message,
      error: errorDetails,
      timestamp: new Date().toISOString(),
      stack: error?.stack
    });
    
    // Mostrar mensaje de error al usuario si está habilitado
    if (showToUser) {
      this.zone.run(() => {
        this.snackBar.open(`Error: ${message}`, 'Cerrar', {
          duration: 5000,
          panelClass: 'error-snackbar'
        });
        this.cdr.markForCheck();
      });
    }
    
    // Limpiar caché si es necesario (errores graves pueden hacer que los datos en caché sean inválidos)
    if (error && (error.name === 'NetworkError' || error.name === 'DataCorruptionError')) {
      this.clearMemoization();
    }
  }
  
  /**
   * Verifica que un contenedor de mapa tiene dimensiones válidas antes de inicializar
   * Evita problemas comunes con mapas en contenedores no visibles o demasiado pequeños
   * 
   * @protected
   * @param {HTMLElement | null} container - Elemento HTML a validar
   * @param {number} [minWidth=100] - Ancho mínimo aceptable en píxeles
   * @param {number} [minHeight=100] - Alto mínimo aceptable en píxeles
   * @returns {boolean} - true si el contenedor tiene dimensiones válidas para mostrar un mapa
   */
  protected validateContainerDimensions(container: HTMLElement | null, minWidth = 100, minHeight = 100): boolean {
    if (!container) {
      this.logDebug('Contenedor no disponible', null, LogLevel.WARN);
      return false;
    }
    
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    if (width < minWidth || height < minHeight) {
      this.logDebug(`Dimensiones de contenedor inválidas: ${width}x${height}`, 
        { width, height, minWidth, minHeight }, 
        LogLevel.WARN
      );
      return false;
    }
    
    this.logDebug(`Dimensiones de contenedor válidas: ${width}x${height}`, 
      { width, height, minWidth, minHeight }, 
      LogLevel.DEBUG
    );
    return true;
  }
  
  /**
   * Método centralizado para inicializar un contenedor de mapa
   * Delega en el servicio especializado y maneja errores de forma consistente
   * 
   * @protected
   * @param {HTMLElement} container - Elemento HTML donde inicializar el mapa
   * @returns {boolean} - true si la inicialización fue exitosa
   */
  protected initializeMapContainer(container: HTMLElement): boolean {
    this.logDebug('Inicializando contenedor de mapa', { 
      container: container.id || 'sin-id',
      dimensions: `${container.clientWidth}x${container.clientHeight}`
    }, LogLevel.INFO);
    
    const result = this.mapInitializer.initializeMapContainer(container);
    
    if (!result.success) {
      this.handleError(null, result.errorMessage || 'Error al inicializar contenedor');
      return false;
    }
    
    return true;
  }
  
  /**
   * Método común para marcar el fin del proceso de carga
   * Actualiza estado, registra log, emite evento y fuerza detección de cambios para actualizar UI
   * 
   * @protected
   * @returns {void}
   */
  protected completeLoading(): void {
    const loadingTime = performance.now();
    this.isLoading = false;
    this.mapInitialized = true;
    this.logDebug('Carga completada', { loadingTime }, LogLevel.INFO);
    this.cdr.markForCheck();
  }
  
  /**
   * Obtiene el nombre legible/descriptivo de un tipo de elemento de red
   * Utiliza memoización para optimizar rendimiento
   * 
   * @protected
   * @param {ElementType} type - Tipo de elemento de red (enumeración)
   * @returns {string} - Nombre humanamente legible del tipo de elemento
   */
  protected getElementTypeName(type: ElementType): string {
    return this.memoize<string>(
      `elementTypeName_${type}`,
      () => ELEMENT_TYPE_NAMES[type] || `Tipo ${type}`,
      60000 // TTL de 1 minuto
    );
  }
  
  /**
   * Obtiene la clase CSS correspondiente a un estado de elemento
   * Utiliza memoización para optimizar rendimiento
   * Las clases se utilizan para mostrar indicadores visuales del estado (colores, iconos)
   * 
   * @protected
   * @param {ElementStatus} status - Estado del elemento de red (enumeración)
   * @returns {string} - Clase CSS correspondiente al estado
   */
  protected getElementStatusClass(status: ElementStatus): string {
    return this.memoize<string>(
      `elementStatusClass_${status}`,
      () => ELEMENT_STATUS_CLASSES[status] || 'status-unknown',
      60000 // TTL de 1 minuto
    );
  }
  
  /**
   * Calcula la distancia entre dos puntos geográficos usando la fórmula Haversine
   * Delega en el servicio de utilidades para encapsular el algoritmo
   * 
   * @protected
   * @param {number} lat1 - Latitud del primer punto en grados decimales
   * @param {number} lon1 - Longitud del primer punto en grados decimales
   * @param {number} lat2 - Latitud del segundo punto en grados decimales
   * @param {number} lon2 - Longitud del segundo punto en grados decimales
   * @returns {number} - Distancia en kilómetros entre los dos puntos
   */
  protected calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    // Usar memoización para cálculos que pueden repetirse (por ejemplo al renderizar)
    return this.memoize<number>(
      `distance_${lat1}_${lon1}_${lat2}_${lon2}`,
      () => this.utils.calculateDistance(lat1, lon1, lat2, lon2),
      30000 // TTL de 30 segundos
    );
  }
  
  /**
   * Método para formatear fechas con formato consistente en toda la aplicación
   * Utiliza el servicio centralizado para mantener coherencia
   * 
   * @protected
   * @param {Date | string | number} date - Fecha a formatear (puede ser objeto Date, ISO string o timestamp)
   * @returns {string} - Cadena de texto con la fecha formateada
   */
  protected formatDate(date: Date | string | number): string {
    // Para formateo de fechas no se usa memoización para evitar problemas con zonas horarias
    return this.utils.formatDate(date);
  }
  
  /**
   * Método para limpiar recursos cuando se destruye el componente
   * Implementa la liberación segura de recursos y cancelación de suscripciones
   * 
   * @protected
   * @returns {void}
   */
  protected cleanup(): void {
    this.logDebug('Limpiando recursos', this.getMemoizationStats(), LogLevel.INFO);
    this.clearMemoization(); // Limpiar toda la caché
    this.destroy$.next();     // Notificar a todos los observables que usan takeUntil
    this.destroy$.complete(); // Completar el subject
  }
  
  /**
   * Manejo centralizado de selección de elementos de red
   * Notifica al servicio de eventos para mantener coherencia en toda la aplicación
   * 
   * @protected
   * @param {NetworkElement | null} element - Elemento seleccionado o null si se deselecciona
   * @returns {void}
   */
  protected handleElementSelected(element: NetworkElement | null): void {
    this.mapEventsService.selectElement(element);
    this.logDebug(`Elemento seleccionado`, 
      element ? { id: element.id, name: element.name, type: element.type } : null, 
      LogLevel.INFO
    );
  }
  
  /**
   * Manejo centralizado de selección de conexiones de red
   * Notifica al servicio de eventos para mantener coherencia en toda la aplicación
   * 
   * @protected
   * @param {NetworkConnection | null} connection - Conexión seleccionada o null si se deselecciona
   * @returns {void}
   */
  protected handleConnectionSelected(connection: NetworkConnection | null): void {
    this.mapEventsService.selectConnection(connection);
    this.logDebug(`Conexión seleccionada`, 
      connection ? { id: connection.id, type: connection.type } : null,
      LogLevel.INFO
    );
  }
  
  /**
   * Implementación del hook de ciclo de vida OnInit de Angular
   * Inicializa el componente llamando al método abstracto que implementan las subclases
   * Maneja errores de inicialización de forma segura
   * 
   * @public
   * @returns {void}
   */
  ngOnInit(): void {
    try {
      const startTime = performance.now();
      this.logDebug(`Inicializando componente`, null, LogLevel.INFO);
      
      this.initializeComponent();
      
      const initTime = performance.now() - startTime;
      this.logDebug(`Componente inicializado en ${initTime.toFixed(2)}ms`, 
        { initTime }, 
        LogLevel.PERFORMANCE
      );
    } catch (error) {
      this.handleError(error, 'Error al inicializar componente');
    }
  }
  
  /**
   * Implementación del hook de ciclo de vida OnDestroy de Angular
   * Limpia recursos cuando Angular destruye el componente
   * Llama al método cleanup para liberar memoria y cancelar suscripciones
   * 
   * @public
   * @returns {void}
   */
  ngOnDestroy(): void {
    this.logDebug(`Destruyendo componente`, null, LogLevel.INFO);
    this.cleanup();
  }
} 
