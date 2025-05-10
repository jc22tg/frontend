import { Directive, ElementRef, Renderer2, OnInit, OnDestroy, Input, Output, EventEmitter, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { WidgetStateService } from '../../../services/widget-state.service';
import { WidgetRenderService, WidgetRenderOptions } from '../../../services/widget-render.service';
import { WidgetEvent, WidgetErrorEvent, WidgetUpdateEvent, WidgetActionEvent } from '../../widgets/container/map-widgets-container/map-widgets-container.component';
import { PerformanceMonitoringService } from '../../../services/performance-monitoring.service';

/**
 * Componente base para todos los widgets
 * Proporciona funcionalidad común como gestión de estado, arrastre, colapso, etc.
 */
@Directive()
export class BaseWidgetComponent implements OnInit, OnDestroy {
  @Input() widgetId!: string;
  @Input() title = 'Widget';
  @Input() position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center' = 'top-right';
  @Input() draggable = true;
  @Input() collapsible = true;
  @Input() closable = true;
  @Input() resizable = false;
  @Input() minWidth = 250;
  @Input() maxWidth?: number;
  @Input() minHeight = 100;
  @Input() maxHeight?: number;
  @Input() zIndex?: number;
  @Input() customClass: string[] = [];
  
  // Outputs para notificar eventos
  @Output() widgetAction = new EventEmitter<WidgetActionEvent>();
  @Output() widgetError = new EventEmitter<WidgetErrorEvent>();
  @Output() widgetUpdate = new EventEmitter<WidgetUpdateEvent>();
  
  // Flag para habilitar monitoreo de rendimiento
  @Input() enablePerformanceMonitoring = true;
  
  // Servicios inyectados
  protected widgetStateService = inject(WidgetStateService);
  protected widgetRenderService = inject(WidgetRenderService);
  protected performanceMonitoringService = inject(PerformanceMonitoringService);
  protected renderer = inject(Renderer2);
  protected el = inject(ElementRef);
  protected destroyRef = inject(DestroyRef);
  
  // Estado del widget como Observable
  widgetState$ = this.widgetStateService.getWidgetState(this.widgetId || 'unknown-widget');
  
  // Para facilitar el binding en plantillas
  get isVisible(): boolean {
    return this.widgetStateService.getCurrentWidgetState(this.widgetId).isVisible;
  }
  
  get isCollapsed(): boolean {
    return this.widgetStateService.getCurrentWidgetState(this.widgetId).isCollapsed;
  }
  
  ngOnInit(): void {
    // Iniciar medición de rendimiento para la inicialización
    const endInitMeasurement = this.startPerformanceMeasurement('init');
    
    if (!this.widgetId) {
      console.error('Widget debe tener un ID único');
      this.widgetId = `widget-${Date.now()}`;
    }
    
    // Actualizar referencia al widgetState$ con el ID correcto
    this.widgetState$ = this.widgetStateService.getWidgetState(this.widgetId);
    
    // Configuración inicial del widget
    this.initializeWidget();
    
    // Notificar que el widget ha sido inicializado
    this.emitUpdateEvent('initialized', {
      widgetId: this.widgetId,
      isVisible: this.isVisible,
      isCollapsed: this.isCollapsed,
      position: this.position
    });
    
    // Finalizar medición de inicialización
    endInitMeasurement();
  }
  
  /**
   * Inicializa el widget con las opciones configuradas
   */
  protected initializeWidget(): void {
    const options: WidgetRenderOptions = {
      minWidth: this.minWidth,
      minHeight: this.minHeight,
      maxWidth: this.maxWidth,
      maxHeight: this.maxHeight,
      position: this.position,
      draggable: this.draggable,
      resizable: this.resizable,
      customClass: this.customClass,
      zIndex: this.zIndex
    };
    
    // Inicializar el widget
    const result = this.widgetRenderService.initializeWidget(this.el, this.renderer, options);
    
    if (!result.success) {
      console.warn(`Error al inicializar widget ${this.widgetId}:`, result.errorMessage);
      this.widgetRenderService.showWidgetError(
        result.errorMessage || 'Error desconocido', 
        this.constructor.name,
        this.el,
        this.renderer
      );
      
      // Emitir el error
      this.emitErrorEvent('initialization', {
        code: 'WIDGET_INIT_ERROR',
        message: result.errorMessage || 'Error al inicializar widget',
        details: {
          options,
          widgetType: this.constructor.name
        }
      });
    }
    
    // Si es arrastrable, configurar
    if (this.draggable) {
      this.widgetRenderService.setupDraggableWidget(
        this.el,
        this.renderer,
        '.widget-header',
        'map-container'
      );
    }
  }
  
  /**
   * Alterna el estado colapsado del widget
   */
  toggleCollapse(): void {
    if (!this.collapsible) return;
    
    // Medir tiempo de la operación
    const endToggleMeasurement = this.startPerformanceMeasurement('interaction');
    
    const wasCollapsed = this.isCollapsed;
    this.widgetStateService.toggleWidgetCollapse(this.widgetId);
    
    // Notificar el cambio
    this.emitUpdateEvent('state', {
      widgetId: this.widgetId,
      previousState: { isCollapsed: wasCollapsed },
      currentState: { isCollapsed: !wasCollapsed }
    });
    
    endToggleMeasurement();
  }
  
  /**
   * Cierra el widget (oculta)
   */
  closeWidget(): void {
    if (!this.closable) return;
    
    const endCloseMeasurement = this.startPerformanceMeasurement('interaction');
    
    this.widgetStateService.setWidgetVisibility(this.widgetId, false);
    
    // Notificar el cambio
    this.emitUpdateEvent('visibility', {
      widgetId: this.widgetId,
      previousState: { isVisible: true },
      currentState: { isVisible: false }
    });
    
    endCloseMeasurement();
  }
  
  /**
   * Muestra el widget
   */
  showWidget(): void {
    const endShowMeasurement = this.startPerformanceMeasurement('interaction');
    
    this.widgetStateService.setWidgetVisibility(this.widgetId, true);
    
    // Notificar el cambio
    this.emitUpdateEvent('visibility', {
      widgetId: this.widgetId,
      previousState: { isVisible: false },
      currentState: { isVisible: true }
    });
    
    endShowMeasurement();
  }
  
  /**
   * Método para refrescar los datos del widget
   * Debe ser implementado por los widgets concretos
   */
  refreshData(): void {
    // Implementación base vacía
    console.log(`Widget ${this.widgetId}: método refreshData() no implementado`);
  }
  
  /**
   * Inicia medición de rendimiento para una operación
   * @param metricType El tipo de métrica a medir
   * @param context Información adicional de contexto
   * @returns Una función para finalizar la medición
   */
  protected startPerformanceMeasurement(
    metricType: 'render' | 'update' | 'interaction' | 'load' | 'init',
    context?: any
  ): () => void {
    if (!this.enablePerformanceMonitoring) {
      return () => {}; // Función vacía si el monitoreo está desactivado
    }
    
    return this.performanceMonitoringService.startMeasurement(
      this.constructor.name,
      metricType as any,
      this.widgetId,
      context
    );
  }
  
  /**
   * Método de utilidad para emitir eventos de actualización
   */
  protected emitUpdateEvent(updateType: 'data' | 'state' | 'visibility' | 'initialized', data?: any): void {
    const endEmitMeasurement = this.startPerformanceMeasurement('update', { updateType });
    
    this.widgetUpdate.emit({
      source: this.widgetId,
      type: 'update',
      timestamp: new Date(),
      updateType,
      currentState: data
    });
    
    endEmitMeasurement();
  }
  
  /**
   * Método de utilidad para emitir eventos de acción
   */
  protected emitActionEvent(action: string, elementId?: string, actionData?: any): void {
    const endEmitMeasurement = this.startPerformanceMeasurement('interaction', { action });
    
    this.widgetAction.emit({
      source: this.widgetId,
      type: 'action',
      timestamp: new Date(),
      action,
      elementId,
      actionData
    });
    
    endEmitMeasurement();
  }
  
  /**
   * Método de utilidad para emitir eventos de error
   */
  protected emitErrorEvent(context: string, error: { code: string, message: string, details?: any }): void {
    this.widgetError.emit({
      source: this.widgetId,
      type: 'error',
      timestamp: new Date(),
      error: {
        ...error,
        details: {
          ...error.details,
          context
        }
      }
    });
  }
  
  /**
   * Gestión unificada de errores para widgets
   */
  protected handleError(operation: string, error: any): void {
    const errorMsg = error?.message || 'Error desconocido';
    console.error(`Error en widget ${this.widgetId} durante ${operation}:`, error);
    
    this.emitErrorEvent(operation, {
      code: 'WIDGET_OPERATION_ERROR',
      message: `Error al realizar la operación ${operation}: ${errorMsg}`,
      details: { error, operation, widgetId: this.widgetId }
    });
  }
  
  /**
   * Limpieza en la destrucción del componente
   */
  ngOnDestroy(): void {
    // Emitir evento de que el widget se está destruyendo
    this.emitUpdateEvent('state', {
      widgetId: this.widgetId,
      currentState: { isDestroying: true }
    });
    
    // Limpiar recursos del arrastrable si existe
    const element = this.el.nativeElement;
    if (element && (element as any)._draggableCleanup) {
      (element as any)._draggableCleanup();
    }
  }
} 