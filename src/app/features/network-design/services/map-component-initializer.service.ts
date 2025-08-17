import { Injectable, ChangeDetectorRef, NgZone } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LoggerService } from '../../../core/services/logger.service';
import { AppConfig } from '../../../shared/config/app.config';

/**
 * Opciones para la inicialización de un contenedor de mapa
 */
export interface MapContainerOptions {
  /** Ancho del contenedor (px) */
  width?: number;
  /** Alto del contenedor (px) */
  height?: number;
  /** Clase CSS adicional */
  cssClass?: string;
  /** Tamaño mínimo (px) para considerar válido */
  minSize?: number;
  /** Inicializar de manera asíncrona */
  async?: boolean;
  /** Modo oscuro activado */
  darkMode?: boolean;
  /** Modo offline activado */
  enableOfflineMode?: boolean;
  /** Herramienta inicial */
  initialTool?: string;
  /** Mostrar mini mapa */
  showMiniMap?: boolean;
  /** Layout responsivo */
  responsiveLayout?: boolean;
  /** Zoom inicial (0-100) */
  initialZoom?: number;
}

/**
 * Resultado de la inicialización
 */
export interface InitializationResult {
  /** Si fue exitoso */
  success: boolean;
  /** Mensaje de error si falla */
  errorMessage?: string;
  /** Dimensiones del contenedor (si éxito) */
  dimensions?: { width: number; height: number };
}

/**
 * Servicio que centraliza la lógica de inicialización de componentes de mapa
 * para evitar código duplicado en múltiples componentes
 */
@Injectable({
  providedIn: 'root'
})
export class MapComponentInitializerService {
  constructor(
    private logger: LoggerService
  ) {}
  
  /**
   * Inicializa un contenedor de mapa con configuración completa
   * @param container El elemento DOM del contenedor
   * @param options Opciones de inicialización avanzadas
   * @returns Promesa con el resultado de la inicialización
   */
  initialize(
    container: HTMLElement, 
    options: MapContainerOptions = {}
  ): Promise<InitializationResult> {
    return new Promise((resolve, reject) => {
      try {
        // Inicializar contenedor básico primero
        const result = this.initializeMapContainer(container, options);
        
        if (!result.success) {
          reject(new Error(result.errorMessage));
          return;
        }
        
        // Configurar tema basado en modo oscuro
        if (options.darkMode) {
          container.classList.add('dark-theme');
        } else {
          container.classList.remove('dark-theme');
        }
        
        // Configurar modo offline si está activado
        if (options.enableOfflineMode) {
          container.setAttribute('data-offline-mode', 'true');
        }
        
        // Si se requiere inicialización asíncrona, retrasamos la resolución
        if (options.async) {
          setTimeout(() => resolve(result), 100);
        } else {
          resolve(result);
        }
      } catch (error) {
        this.logger.error('Error en initialize:', error);
        reject(error);
      }
    });
  }
  
  /**
   * Inicializa un contenedor de mapa
   * @param container El elemento DOM del contenedor
   * @param options Opciones de inicialización
   * @returns Un objeto con el resultado de la inicialización
   */
  initializeMapContainer(
    container: HTMLElement, 
    options: MapContainerOptions = {}
  ): InitializationResult {
    if (!container) {
      const errorMessage = 'Contenedor de mapa no disponible';
      this.logger.error(errorMessage);
      return { success: false, errorMessage };
    }
    
    const minSize = options.minSize || 10;
    const rect = container.getBoundingClientRect();
    
    if (rect.width < minSize || rect.height < minSize) {
      const errorMessage = `Dimensiones del contenedor incorrectas: ${rect.width}x${rect.height}`;
      this.logger.error(errorMessage);
      return { success: false, errorMessage };
    }
    
    // Establecer dimensiones si se proporcionan
    if (options.width) container.style.width = `${options.width}px`;
    if (options.height) container.style.height = `${options.height}px`;
    
    // Añadir clase CSS si se proporciona
    if (options.cssClass) container.classList.add(options.cssClass);
    
    this.logger.debug(`Contenedor de mapa inicializado: ${rect.width}x${rect.height}`);
    
    return { 
      success: true,
      dimensions: {
        width: rect.width,
        height: rect.height
      }
    };
  }
  
  /**
   * Muestra un error de inicialización al usuario
   * @param message Mensaje de error
   * @param componentName Nombre del componente
   * @param snackBar Referencia al servicio SnackBar
   * @param zone Referencia a NgZone
   */
  showInitializationError(
    message: string, 
    componentName: string,
    snackBar?: MatSnackBar,
    zone?: NgZone
  ): void {
    this.logger.error(`Error de inicialización en ${componentName}: ${message}`);
    
    if (snackBar && zone) {
      zone.run(() => {
        snackBar.open(`Error: ${message}`, 'Cerrar', {
          duration: AppConfig.ui.snackbarDuration,
          panelClass: 'error-snackbar'
        });
      });
    }
  }
  
  /**
   * Actualiza asíncronamente el contenedor y el detector de cambios
   * @param container Elemento DOM a actualizar
   * @param cdr Detector de cambios para notificar
   */
  refreshContainer(container: HTMLElement, cdr: ChangeDetectorRef): void {
    if (!container) return;
    
    // Forzar recálculo de layout
    setTimeout(() => {
      const rect = container.getBoundingClientRect();
      this.logger.debug(`Contenedor actualizado: ${rect.width}x${rect.height}`);
      cdr.markForCheck();
    }, 0);
  }
  
  /**
   * Comprueba si un contenedor tiene dimensiones válidas
   * @param container Elemento DOM a comprobar
   * @param minWidth Ancho mínimo en píxeles
   * @param minHeight Alto mínimo en píxeles
   * @returns true si las dimensiones son válidas
   */
  hasValidDimensions(
    container: HTMLElement | null, 
    minWidth = 10, 
    minHeight = 10
  ): boolean {
    if (!container) return false;
    
    const rect = container.getBoundingClientRect();
    return rect.width >= minWidth && rect.height >= minHeight;
  }
  
  /**
   * Configura un elemento para llenado automático de su contenedor
   * @param element Elemento DOM a configurar
   */
  setupAutoFill(element: HTMLElement): void {
    if (!element) return;
    
    element.style.position = 'absolute';
    element.style.top = '0';
    element.style.left = '0';
    element.style.right = '0';
    element.style.bottom = '0';
    element.style.width = '100%';
    element.style.height = '100%';
  }
  
  /**
   * Añade clases de depuración visual si está activado en configuración
   * @param element Elemento DOM
   * @param label Etiqueta para mostrar
   */
  addDebugVisualization(element: HTMLElement, label: string): void {
    if (!AppConfig.debugging.componentBoundaries) return;
    
    // Solo añadir en desarrollo
    if (!AppConfig.debugging.componentBoundaries) return;
    
    element.style.border = '1px dashed rgba(255, 0, 0, 0.5)';
    
    // Añadir etiqueta de depuración
    const debugLabel = document.createElement('div');
    debugLabel.textContent = label;
    debugLabel.style.position = 'absolute';
    debugLabel.style.top = '0';
    debugLabel.style.left = '0';
    debugLabel.style.fontSize = '10px';
    debugLabel.style.background = 'rgba(255, 0, 0, 0.7)';
    debugLabel.style.color = 'white';
    debugLabel.style.padding = '2px 5px';
    debugLabel.style.zIndex = '9999';
    
    element.appendChild(debugLabel);
  }
} 
