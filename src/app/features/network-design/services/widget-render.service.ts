import { Injectable, ElementRef, Renderer2, NgZone } from '@angular/core';
import { LoggerService } from '../../../core/services/logger.service';

/**
 * Opciones para la renderización de widgets
 */
export interface WidgetRenderOptions {
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  draggable?: boolean;
  resizable?: boolean;
  customClass?: string[];
  zIndex?: number;
}

/**
 * Resultado de la operación de inicialización
 */
export interface WidgetInitResult {
  success: boolean;
  elementRef?: ElementRef;
  dimensions?: { width: number; height: number };
  errorMessage?: string;
}

/**
 * Servicio centralizado para gestionar el renderizado de widgets
 */
@Injectable({
  providedIn: 'root'
})
export class WidgetRenderService {
  constructor(
    private logger: LoggerService,
    private zone: NgZone
  ) {}
  
  /**
   * Inicializa un widget con las opciones especificadas
   */
  initializeWidget(
    elementRef: ElementRef,
    renderer: Renderer2,
    options: WidgetRenderOptions = {}
  ): WidgetInitResult {
    try {
      const element = elementRef.nativeElement;
      
      // Aplicar clases base
      renderer.addClass(element, 'widget-container');
      
      // Aplicar dimensiones
      if (options.minWidth) {
        renderer.setStyle(element, 'min-width', `${options.minWidth}px`);
      }
      
      if (options.minHeight) {
        renderer.setStyle(element, 'min-height', `${options.minHeight}px`);
      }
      
      if (options.maxWidth) {
        renderer.setStyle(element, 'max-width', `${options.maxWidth}px`);
      }
      
      if (options.maxHeight) {
        renderer.setStyle(element, 'max-height', `${options.maxHeight}px`);
      }
      
      // Aplicar posición
      if (options.position) {
        renderer.addClass(element, `widget-position-${options.position}`);
      }
      
      // Aplicar z-index
      if (options.zIndex !== undefined) {
        renderer.setStyle(element, 'z-index', options.zIndex);
      }
      
      // Aplicar clases personalizadas
      if (options.customClass && options.customClass.length > 0) {
        options.customClass.forEach(className => {
          renderer.addClass(element, className);
        });
      }
      
      // Verificar dimensiones
      const rect = element.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        return {
          success: false,
          elementRef,
          errorMessage: 'Dimensiones del widget inválidas (0x0)'
        };
      }
      
      return {
        success: true,
        elementRef,
        dimensions: { width: rect.width, height: rect.height }
      };
    } catch (error) {
      this.logger.error('Error al inicializar widget:', error);
      return {
        success: false,
        elementRef,
        errorMessage: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }
  
  /**
   * Configura un widget como arrastrable
   */
  setupDraggableWidget(
    elementRef: ElementRef,
    renderer: Renderer2,
    handleSelector: string,
    containerId: string
  ): void {
    try {
      const element = elementRef.nativeElement;
      const handle = element.querySelector(handleSelector);
      
      if (!handle) {
        this.logger.warn(`No se encontró el selector de arrastre "${handleSelector}" en el widget`);
        return;
      }
      
      renderer.setStyle(handle, 'cursor', 'move');
      renderer.setAttribute(element, 'draggable', 'false'); // Prevenir arrastre nativo
      
      let isDragging = false;
      let offsetX = 0;
      let offsetY = 0;
      
      // Obtener el contenedor
      const container = containerId ? document.getElementById(containerId) : document.body;
      if (!container) {
        this.logger.warn(`No se encontró el contenedor "${containerId}" para el widget arrastrable`);
        return;
      }
      
      // Agregar clases
      renderer.addClass(element, 'widget-draggable');
      
      // Cuando el mouse se presiona en el manejador
      const mousedownListener = (e: MouseEvent) => {
        if (e.button !== 0) return; // Solo botón izquierdo
        
        e.preventDefault();
        
        const rect = element.getBoundingClientRect();
        
        // Calcular offset relativo a la posición del mouse
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;
        
        isDragging = true;
        renderer.addClass(element, 'widget-dragging');
        
        // Posicionar elemento
        renderer.setStyle(element, 'position', 'absolute');
      };
      
      // Cuando el mouse se mueve
      const mousemoveListener = (e: MouseEvent) => {
        if (!isDragging) return;
        
        e.preventDefault();
        
        // Ejecutar en ngZone para asegurar detección de cambios
        this.zone.run(() => {
          const containerRect = container.getBoundingClientRect();
          
          // Calcular nueva posición, confinada al contenedor
          let newX = e.clientX - containerRect.left - offsetX;
          let newY = e.clientY - containerRect.top - offsetY;
          
          // Restringir para que no se salga del contenedor
          const elementRect = element.getBoundingClientRect();
          
          // Limitamos por los bordes
          newX = Math.max(0, Math.min(newX, containerRect.width - elementRect.width));
          newY = Math.max(0, Math.min(newY, containerRect.height - elementRect.height));
          
          // Aplicar posición
          renderer.setStyle(element, 'left', `${newX}px`);
          renderer.setStyle(element, 'top', `${newY}px`);
        });
      };
      
      // Cuando se suelta el mouse
      const mouseupListener = (e: MouseEvent) => {
        if (!isDragging) return;
        
        e.preventDefault();
        isDragging = false;
        renderer.removeClass(element, 'widget-dragging');
      };
      
      // Registrar eventos
      handle.addEventListener('mousedown', mousedownListener);
      document.addEventListener('mousemove', mousemoveListener);
      document.addEventListener('mouseup', mouseupListener);
      
      // Limpiar eventos cuando el elemento se destruye
      const cleanup = () => {
        handle.removeEventListener('mousedown', mousedownListener);
        document.removeEventListener('mousemove', mousemoveListener);
        document.removeEventListener('mouseup', mouseupListener);
      };
      
      // Almacenar función de limpieza en el elemento
      (element as any)._draggableCleanup = cleanup;
    } catch (error) {
      this.logger.error('Error al configurar widget arrastrable:', error);
    }
  }
  
  /**
   * Muestra un error de inicialización para el widget
   */
  showWidgetError(
    message: string,
    componentName: string,
    elementRef: ElementRef,
    renderer: Renderer2
  ): void {
    try {
      const element = elementRef.nativeElement;
      
      // Crear elemento de error
      const errorDiv = renderer.createElement('div');
      renderer.addClass(errorDiv, 'widget-error');
      
      const errorIcon = renderer.createElement('span');
      renderer.addClass(errorIcon, 'error-icon');
      renderer.appendChild(errorIcon, renderer.createText('⚠️'));
      
      const errorText = renderer.createElement('span');
      renderer.appendChild(errorText, renderer.createText(`Error en ${componentName}: ${message}`));
      
      renderer.appendChild(errorDiv, errorIcon);
      renderer.appendChild(errorDiv, errorText);
      
      // Limpiar contenido y agregar mensaje de error
      renderer.setProperty(element, 'innerHTML', '');
      renderer.appendChild(element, errorDiv);
      
      // Estilo para el error
      renderer.setStyle(errorDiv, 'background-color', '#ffebee');
      renderer.setStyle(errorDiv, 'color', '#c62828');
      renderer.setStyle(errorDiv, 'padding', '8px 12px');
      renderer.setStyle(errorDiv, 'border-radius', '4px');
      renderer.setStyle(errorDiv, 'margin', '8px');
      renderer.setStyle(errorDiv, 'font-size', '12px');
      renderer.setStyle(errorDiv, 'display', 'flex');
      renderer.setStyle(errorDiv, 'align-items', 'center');
      renderer.setStyle(errorDiv, 'gap', '8px');
      
    } catch (error) {
      this.logger.error('Error al mostrar error de widget:', error);
    }
  }
} 
