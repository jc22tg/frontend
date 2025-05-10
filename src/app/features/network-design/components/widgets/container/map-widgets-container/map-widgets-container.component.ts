import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, ElementRef, Renderer2, ViewChildren, QueryList, AfterViewInit, OnInit, NO_ERRORS_SCHEMA, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';

import { NetworkElement, NetworkConnection, ElementType } from '../../../../../../shared/types/network.types';
import { PanelManagerService, PanelType } from '../../../../services/panel-manager.service';
import { NetworkStateService } from '../../../../services/network-state.service';
import { LoggerService } from '../../../../../../core/services/logger.service';
import { WidgetStateService } from '../../../../services/widget-state.service';

// Importar solo los componentes de widgets que se utilizan realmente
import { NetworkHealthWidgetComponent } from '../../monitoring/network-health-widget/network-health-widget.component';
import { ConnectionStatusWidgetComponent } from '../../connectivity/connection-status-widget/connection-status-widget.component';
import { MiniMapWidgetComponent } from '../../map-related/mini-map-widget/mini-map-widget.component';
import { ElementPropertiesWidgetComponent } from '../../element-related/element-properties-widget/element-properties-widget.component';

// Definir las interfaces para los eventos de widgets

// Interfaces actualizadas para una mayor consistencia
export interface WidgetEvent {
  source: string;      // ID del widget que emite el evento
  type: string;        // Tipo de evento (ej: 'update', 'error', 'action')
  timestamp: Date;     // Momento en que ocurrió el evento
  payload?: any;       // Datos adicionales específicos del evento
}

export interface WidgetErrorEvent extends WidgetEvent {
  error: {
    code: string;      // Código de error para identificación programática
    message: string;   // Mensaje descriptivo del error
    details?: any;     // Detalles adicionales del error
  };
}

export interface WidgetUpdateEvent extends WidgetEvent {
  updateType: 'data' | 'state' | 'visibility' | 'initialized';
  previousState?: any;
  currentState?: any;
}

export interface WidgetActionEvent extends WidgetEvent {
  action: string;      // Nombre de la acción (ej: 'edit', 'delete', 'locate')
  elementId?: string;  // ID del elemento asociado si aplica
  actionData?: any;    // Datos específicos de la acción
}

interface WidgetPosition {
  id: string;
  top: number;
  left: number;
  zIndex: number;
}

// Interfaces para el tipado
interface StatusFilter {
  id: string;
  name: string;
  enabled: boolean;
}

interface ElementTypeOption {
  id: string;
  name: string;
  icon: string;
}

interface PerformanceMetrics {
  fps: number;
  elements: number;
  visible: number;
}

interface BaseLayerOption {
  id: string;
  name: string;
  thumbnail?: string;
  description?: string;
}

@Component({
  selector: 'app-map-widgets-container',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatBadgeModule,
    // Importar solo los componentes utilizados
    NetworkHealthWidgetComponent,
    ConnectionStatusWidgetComponent,
    MiniMapWidgetComponent,
    ElementPropertiesWidgetComponent
  ],
  schemas: [NO_ERRORS_SCHEMA],
  template: `
    <div class="widgets-container" id="map-container">
      <!-- Widgets de elementos -->
      <app-element-properties-widget
        [selectedElement]="selectedElement"
        (widgetAction)="onWidgetAction($event)"
        (widgetError)="onWidgetError($event)"
        (widgetUpdate)="onWidgetUpdate($event)">
      </app-element-properties-widget>
      
      <!-- Widgets de conectividad -->
      <app-connection-status-widget
        [connectionStats]="connectionStats"
        (widgetAction)="onWidgetAction($event)"
        (widgetError)="onWidgetError($event)"
        (widgetUpdate)="onWidgetUpdate($event)">
      </app-connection-status-widget>
      
      <!-- Widgets de monitoreo -->
      <app-network-health-widget
        [elementStats]="elementStats"
        (widgetAction)="onWidgetAction($event)"
        (widgetError)="onWidgetError($event)"
        (widgetUpdate)="onWidgetUpdate($event)">
      </app-network-health-widget>
      
      <!-- Widgets relacionados con el mapa -->
      <app-mini-map-widget
        [allElements]="allElements"
        [allConnections]="allConnections"
        [viewportOffsetX]="viewportOffsetX"
        [viewportOffsetY]="viewportOffsetY"
        [viewportWidth]="viewportWidth"
        [viewportHeight]="viewportHeight"
        [zoomLevel]="zoomLevel"
        [isDarkMode]="isDarkMode"
        (widgetAction)="onWidgetAction($event)"
        (widgetError)="onWidgetError($event)"
        (widgetUpdate)="onWidgetUpdate($event)">
      </app-mini-map-widget>
    </div>
  `,
  styles: [`
    .widgets-container {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 10;
      overflow: hidden;
    }
    
    /* Los widgets tendrán pointer-events: auto para que sean interactivos */
    .widgets-container ::ng-deep .widget-container {
      pointer-events: auto;
    }
  `]
})
export class MapWidgetsContainerComponent implements OnInit, AfterViewInit, OnDestroy {
  // Inputs para datos provenientes del mapa
  @Input() activeLayers: ElementType[] = [];
  @Input() selectedElement: NetworkElement | null = null;
  @Input() connectionSourceElement: NetworkElement | null = null;
  @Input() connectionTargetElement: NetworkElement | null = null;
  @Input() elementStats: { total: number, active: number, warning: number, error: number } = { 
    total: 0, active: 0, warning: 0, error: 0 
  };
  @Input() connectionStats: { total: number, active: number, warning: number, error: number } = { 
    total: 0, active: 0, warning: 0, error: 0 
  };
  @Input() performanceStats: { fps: number, elements: number, visible: number } = { 
    fps: 0, elements: 0, visible: 0 
  };
  
  // Nuevos inputs para el mini-mapa
  @Input() allElements: NetworkElement[] = [];
  @Input() allConnections: NetworkConnection[] = [];
  @Input() viewportOffsetX = 0;
  @Input() viewportOffsetY = 0;
  @Input() viewportWidth = 800;
  @Input() viewportHeight = 600;
  @Input() zoomLevel = 100;
  @Input() isDarkMode = false;
  
  // Inputs adicionales que faltan (añadidos para corregir errores)
  @Input() showNetworkStats = false;
  @Input() showFilters = false;
  @Input() showLayers = false;
  @Input() showPerformanceControls = false;
  @Input() elementTypes: ElementTypeOption[] = [];
  @Input() statusFilters: StatusFilter[] = [];
  @Input() baseLayerOptions: BaseLayerOption[] = [];
  @Input() currentBaseLayer = '';
  @Input() collapsedWidgets: Record<string, boolean> = {};
  @Input() performanceMetrics: PerformanceMetrics = { fps: 0, elements: 0, visible: 0 };
  @Input() currentTool = '';
  
  // Input para controlar la posición de los widgets
  @Input() position: 'left' | 'top-right' | 'bottom-left' | 'bottom-right' = 'left';
  
  // Inputs para nuevos widgets personalizados
  @Input() widgets: any[] = [];
  
  // Outputs para eventos que se propagarán al mapa
  @Output() toggleLayer = new EventEmitter<ElementType>();
  @Output() toggleCustomLayer = new EventEmitter<string>();
  @Output() addElement = new EventEmitter<{type: ElementType, batch: boolean}>();
  @Output() createConnection = new EventEmitter<NetworkConnection>();
  @Output() editElement = new EventEmitter<NetworkElement>();
  @Output() deleteElement = new EventEmitter<NetworkElement>();
  @Output() searchElements = new EventEmitter<string>();
  @Output() centerOnElement = new EventEmitter<NetworkElement>();
  @Output() toggleMiniMap = new EventEmitter<void>();
  @Output() toggleSearchWidget = new EventEmitter<void>();
  
  // Outputs adicionales (añadidos para corregir errores)
  @Output() filterChange = new EventEmitter<void>();
  @Output() typeVisibilityChange = new EventEmitter<string>();
  @Output() statusFilterChange = new EventEmitter<string>();
  @Output() layerChange = new EventEmitter<string>();
  @Output() elementSearch = new EventEmitter<string>();
  @Output() toggleNetworkStats = new EventEmitter<void>();
  @Output() toggleFilters = new EventEmitter<void>();
  @Output() toggleLayers = new EventEmitter<void>();
  @Output() togglePerformanceControls = new EventEmitter<void>();
  
  // Nuevos outputs para la gestión estandarizada de widgets
  @Output() widgetAction = new EventEmitter<WidgetActionEvent>();
  @Output() widgetError = new EventEmitter<WidgetErrorEvent>();
  @Output() widgetUpdate = new EventEmitter<WidgetUpdateEvent>();

  // Referencias a los elementos de widgets para arrastrar
  @ViewChildren('widgetItem') widgetElements!: QueryList<ElementRef>;
  
  // Flag para mostrar/ocultar todos los widgets (modo compacto)
  showWidgets = true;
  
  // Estado de visibilidad de cada widget individual
  widgetVisibility = {
    layers: false,
    creator: false,
    connection: false,
    menu: false,
    health: true,
    status: true,
    search: true,
    metrics: true,
    performance: false,
    miniMap: false
  };
  
  // Variables para el arrastre de widgets
  isDragging = false;
  activeWidget: HTMLElement | null = null;
  initialX = 0;
  initialY = 0;
  currentX = 0;
  currentY = 0;
  
  // Variables para el posicionamiento de widgets
  widgetPositions = new Map<string, WidgetPosition>();
  baseZIndex = 100;
  
  // Observador de redimensionamiento para ajustar widgets cuando cambia el tamaño de la ventana
  private resizeObserver: ResizeObserver | null = null;
  
  // Inyectar servicio de estado de widgets
  private widgetStateService = inject(WidgetStateService);
  
  constructor(
    private panelManager: PanelManagerService, 
    private networkStateService: NetworkStateService,
    private el: ElementRef,
    private renderer: Renderer2,
    private logger: LoggerService
  ) {}
  
  ngOnInit(): void {
    // Cargar posiciones guardadas
    this.loadWidgetPositions();
    
    // Inicializar visibilidad según el tipo de contenedor
    this.initializeByPosition();
    
    // Inicializar el observador de redimensionamiento
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(entries => {
        // Cuando el contenedor cambia de tamaño, reorganizar los widgets
        this.organizeWidgets();
      });
      
      // Observar el elemento contenedor
      this.resizeObserver.observe(this.el.nativeElement);
      this.logger.debug('ResizeObserver inicializado para el contenedor de widgets');
    } else {
      this.logger.warn('ResizeObserver no está disponible en este navegador');
      
      // Alternativa usando el evento resize de la ventana
      window.addEventListener('resize', () => this.organizeWidgets());
    }
    
    // Configurar estado inicial de widgets
    this.initializeWidgetsState();
  }
  
  ngAfterViewInit(): void {
    // Inicializar widgets después de que la vista se haya inicializado
    setTimeout(() => {
      this.initWidgetDragging();
    }, 500);
  }
  
  ngOnDestroy(): void {
    // Limpiar recursos y suscripciones al destruir el componente
    this.logger.debug('Destruyendo contenedor de widgets');
    
    // Si hay alguna suscripción, cancelarla aquí
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }
  
  /**
   * Inicializa las propiedades según la posición del contenedor de widgets
   */
  private initializeByPosition(): void {
    if (this.position === 'left') {
      // El contenedor de la izquierda es el principal con la barra de herramientas
      this.logger.debug('Inicializando contenedor de widgets principal');
    } else {
      // Los contenedores en otras posiciones no tienen barra de herramientas
      // y solo muestran los widgets proporcionados a través del input
      this.logger.debug(`Inicializando contenedor de widgets en posición: ${this.position}`);
      
      // Asegurarse de que solo los widgets proporcionados estén visibles
      Object.keys(this.widgetVisibility).forEach(key => {
        this.widgetVisibility[key] = false;
      });
      
      // Si se proporcionan widgets personalizados, hacerlos visibles
      if (this.widgets && this.widgets.length > 0) {
        this.widgets.forEach(widget => {
          if (widget.visible) {
            // Esta lógica permite mostrar el widget correcto en la posición correcta
            if (widget.type === 'layers') this.widgetVisibility.layers = true;
            else if (widget.type === 'creator') this.widgetVisibility.creator = true;
            else if (widget.type === 'search') this.widgetVisibility.search = true;
            else if (widget.type === 'health') this.widgetVisibility.health = true;
            else if (widget.type === 'stats') this.widgetVisibility.metrics = true; 
            else if (widget.type === 'connection') this.widgetVisibility.connection = true;
            else if (widget.type === 'status') this.widgetVisibility.status = true;
            else if (widget.type === 'mini-map') this.widgetVisibility.miniMap = true;
          }
        });
      }
    }
  }
  
  /**
   * Inicializa el arrastre para los widgets
   */
  private initWidgetDragging(): void {
    if (!this.widgetElements) return;
    
    this.widgetElements.forEach((widget, index) => {
      if (!widget || !widget.nativeElement) return;
      
      const widgetEl = widget.nativeElement as HTMLElement;
      const widgetId = widgetEl.getAttribute('id');
      
      if (!widgetId) return;
      
      console.log('Inicializando widget para arrastrar:', widgetId);
      
      // Aplicar posición guardada si existe
      const savedPosition = this.widgetPositions.get(widgetId);
      if (savedPosition) {
        this.renderer.setStyle(widgetEl, 'position', 'absolute');
        this.renderer.setStyle(widgetEl, 'top', `${savedPosition.top}px`);
        this.renderer.setStyle(widgetEl, 'left', `${savedPosition.left}px`);
        this.renderer.setStyle(widgetEl, 'z-index', savedPosition.zIndex.toString());
      } else {
        // Asignar posición predeterminada
        this.renderer.setStyle(widgetEl, 'position', 'absolute');
        this.renderer.setStyle(widgetEl, 'top', `${50 + index * 20}px`);
        this.renderer.setStyle(widgetEl, 'right', `${20}px`); // Colocar en el lado derecho
        this.renderer.setStyle(widgetEl, 'z-index', (this.baseZIndex + index).toString());
      }
      
      // Encontrar el área de arrastre (header del widget)
      const dragHandle = widgetEl.querySelector('.widget-header');
      
      if (dragHandle) {
        console.log('Widget handle encontrado para:', widgetId);
        
        // Asegurarse que el handle sea visible
        this.renderer.setStyle(dragHandle, 'cursor', 'grab');
        
        // Añadir listeners para arrastrar
        this.renderer.listen(dragHandle, 'mousedown', (event: MouseEvent) => {
          // Evitar que se disparen eventos en elementos hijos
          if ((event.target as HTMLElement).closest('button')) {
            return;
          }
          
          event.preventDefault();
          event.stopPropagation();
          this.onDragStart(event, widgetEl);
        });
      } else {
        console.warn('No se encontró el handle para el widget:', widgetId);
      }
    });
    
    // Listeners globales para el movimiento y finalización de arrastre
    this.renderer.listen('document', 'mousemove', (event: MouseEvent) => {
      if (this.isDragging) {
        event.preventDefault();
        this.onDragMove(event);
      }
    });
    
    this.renderer.listen('document', 'mouseup', () => {
      if (this.isDragging) {
        this.onDragEnd();
      }
    });
  }
  
  /**
   * Inicia el arrastre de un widget
   */
  private onDragStart(event: MouseEvent, widget: HTMLElement): void {
    console.log('Iniciando arrastre para:', widget.id);
    
    // Prevenir comportamiento por defecto
    event.preventDefault();
    
    // Asegurarse que otros widgets estén con z-index normal
    this.widgetElements.forEach(widgetRef => {
      const otherWidget = widgetRef.nativeElement;
      if (!otherWidget || otherWidget !== widget) {
        if (otherWidget) {
          const baseZ = parseInt(otherWidget.getAttribute('data-base-z') || `${this.baseZIndex}`);
          this.renderer.setStyle(otherWidget, 'z-index', baseZ.toString());
        }
      }
    });
    
    // Aumentar z-index para que el widget esté por encima durante el arrastre
    const currentZIndex = parseInt(widget.style.zIndex || `${this.baseZIndex}`);
    // Guardar el z-index original
    widget.setAttribute('data-base-z', currentZIndex.toString());
    
    this.renderer.setStyle(widget, 'z-index', (currentZIndex + 100).toString());
    
    // Añadir clase visual de arrastre
    this.renderer.addClass(widget, 'widget-dragging');
    
    // Guardar posición inicial
    const rect = widget.getBoundingClientRect();
    this.initialX = event.clientX - rect.left;
    this.initialY = event.clientY - rect.top;
    
    // Activar estado de arrastre
    this.isDragging = true;
    this.activeWidget = widget;
  }
  
  /**
   * Organiza automáticamente los widgets para evitar superposiciones
   */
  organizeWidgets(): void {
    // Obtener todos los widgets visibles
    setTimeout(() => {
      const visibleWidgets = Array.from(document.querySelectorAll('.widget-panel'))
        .filter(widget => widget.getBoundingClientRect().width > 0);
      
      if (visibleWidgets.length > 0) {
        this.logger.debug(`Organizando ${visibleWidgets.length} widgets para evitar solapamientos`);
        
        // Asegurarse de que los widgets estén posicionados correctamente según el grid
        visibleWidgets.forEach((widget, index) => {
          const row = Math.floor(index / 3) + 1;
          const col = (index % 3) + 1;
          
          // Establecer posición en el grid
          (widget as HTMLElement).style.gridArea = `${row} / ${col} / auto / auto`;
        });
      }
    }, 100);
  }
  
  /**
   * Guarda las posiciones de los widgets
   */
  private saveWidgetPositions(): void {
    const positions = Array.from(this.widgetPositions.values());
    localStorage.setItem('widget-positions', JSON.stringify(positions));
  }
  
  /**
   * Carga las posiciones guardadas de los widgets
   */
  private loadWidgetPositions(): void {
    try {
      const savedPositions = localStorage.getItem('widget-positions');
      if (savedPositions) {
        const positions: WidgetPosition[] = JSON.parse(savedPositions);
        positions.forEach(pos => {
          this.widgetPositions.set(pos.id, pos);
        });
      }
    } catch (e) {
      console.error('Error al cargar posiciones de widgets:', e);
    }
  }
  
  /**
   * Maneja el movimiento durante el arrastre
   */
  private onDragMove(event: MouseEvent): void {
    if (!this.isDragging || !this.activeWidget) return;
    
    // Prevenir comportamiento por defecto
    event.preventDefault();
    
    // Calcular nueva posición absoluta en el viewport
    const newX = event.clientX - this.initialX;
    const newY = event.clientY - this.initialY;
    
    // Obtener las dimensiones del contenedor y el widget
    const containerRect = this.el.nativeElement.getBoundingClientRect();
    const widgetRect = this.activeWidget.getBoundingClientRect();
    
    // Asegurar que el widget permanezca dentro del contenedor
    const maxX = containerRect.width - widgetRect.width;
    const maxY = containerRect.height - widgetRect.height;
    
    // Limitar posición
    this.currentX = Math.max(0, Math.min(newX, maxX));
    this.currentY = Math.max(0, Math.min(newY, maxY));
    
    // Actualizar posición del widget de forma inmediata
    // Usamos transform para mejor rendimiento durante el arrastre
    this.renderer.setStyle(this.activeWidget, 'transform', `translate3d(${this.currentX}px, ${this.currentY}px, 0)`);
  }

  /**
   * Finaliza el arrastre
   */
  private onDragEnd(): void {
    if (!this.isDragging || !this.activeWidget) return;
    
    // Restaurar la posición usando propiedades top/left
    this.renderer.setStyle(this.activeWidget, 'transform', 'none');
    this.renderer.setStyle(this.activeWidget, 'top', `${this.currentY}px`);
    this.renderer.setStyle(this.activeWidget, 'left', `${this.currentX}px`);
    
    // Restaurar el z-index original
    const baseZIndex = parseInt(this.activeWidget.getAttribute('data-base-z') || `${this.baseZIndex}`);
    this.renderer.setStyle(this.activeWidget, 'z-index', (baseZIndex + 5).toString()); // Un poco más alto que el original
    
    // Guardar posición final
    const widgetId = this.activeWidget.getAttribute('id');
    if (widgetId) {
      this.widgetPositions.set(widgetId, {
        id: widgetId,
        top: this.currentY,
        left: this.currentX,
        zIndex: baseZIndex + 5
      });
      
      // Guardar posiciones
      this.saveWidgetPositions();
    }
    
    // Quitar clase visual de arrastre
    this.renderer.removeClass(this.activeWidget, 'widget-dragging');
    
    // Resetear variables de arrastre
    this.isDragging = false;
    this.activeWidget = null;
  }
  
  /**
   * Configura el estado inicial de todos los widgets
   */
  private initializeWidgetsState(): void {
    // Configurar visibilidad y posición inicial de algunos widgets
    this.widgetStateService.updateWidgetState('element-properties-widget', {
      isVisible: false, // Solo visible cuando hay un elemento seleccionado
      position: { x: 16, y: 16 }
    });
    
    this.widgetStateService.updateWidgetState('connection-status-widget', {
      isVisible: true,
      position: { x: 16, y: 16 }
    });
    
    this.widgetStateService.updateWidgetState('network-health-widget', {
      isVisible: true,
      position: { x: 16, y: window.innerHeight - 250 }
    });
    
    this.widgetStateService.updateWidgetState('mini-map-widget', {
      isVisible: true,
      position: { x: window.innerWidth - 250, y: window.innerHeight - 200 }
    });
  }
  
  /**
   * Este método sería llamado desde el componente padre cuando se selecciona un elemento
   */
  setSelectedElement(element: any): void {
    this.selectedElement = element;
    
    // Mostrar el widget de propiedades si hay un elemento seleccionado
    if (element) {
      this.widgetStateService.updateWidgetState('element-properties-widget', {
        isVisible: true,
        isCollapsed: false
      });
    } else {
      this.widgetStateService.updateWidgetState('element-properties-widget', {
        isVisible: false
      });
    }
  }
  
  /**
   * Restaura todos los widgets a su estado por defecto
   */
  resetWidgets(): void {
    this.widgetStateService.resetAllWidgets();
    this.initializeWidgetsState();
  }

  // Nuevos métodos para manejar eventos de widgets
  onWidgetAction(event: WidgetActionEvent): void {
    // Propagar el evento al componente padre
    this.widgetAction.emit(event);
    
    // Manejar acciones específicas si es necesario
    if (event.action === 'edit' && event.elementId) {
      const element = this.allElements.find(e => e.id === event.elementId);
      if (element) {
        this.editElement.emit(element);
      }
    } else if (event.action === 'delete' && event.elementId) {
      const element = this.allElements.find(e => e.id === event.elementId);
      if (element) {
        this.deleteElement.emit(element);
      }
    } else if (event.action === 'center' && event.elementId) {
      const element = this.allElements.find(e => e.id === event.elementId);
      if (element) {
        this.centerOnElement.emit(element);
      }
    }
  }
  
  onWidgetError(event: WidgetErrorEvent): void {
    // Registrar error y propagar al componente padre
    this.logger.error(`Error en widget ${event.source}: ${event.error.message}`, event.error.details);
    this.widgetError.emit(event);
  }
  
  onWidgetUpdate(event: WidgetUpdateEvent): void {
    // Propagar actualizaciones al componente padre
    this.widgetUpdate.emit(event);
  }
  
  /**
   * Método para actualización de datos de widgets
   * Proporciona un método consistente para refrescar datos
   */
  refreshAllWidgets(): void {
    // Emitir evento solicitando a todos los widgets actualizar sus datos
    this.widgetUpdate.emit({
      source: 'map-widgets-container',
      type: 'refresh',
      timestamp: new Date(),
      updateType: 'data',
      currentState: {
        elementStats: this.elementStats,
        connectionStats: this.connectionStats,
        performanceMetrics: this.performanceMetrics,
        selectedElement: this.selectedElement,
        allElements: this.allElements.length,
        allConnections: this.allConnections.length
      }
    });
  }
  
  /**
   * Método para mostrar/ocultar un widget específico
   */
  toggleWidgetVisibility(widgetId: string): void {
    // Obtener el estado actual y alternarlo
    const currentState = this.widgetStateService.getCurrentWidgetState(widgetId);
    this.widgetStateService.setWidgetVisibility(widgetId, !currentState.isVisible);
  }
} 