/**
 * @description Componente de toolbar para el diseño de red
 * @version 1.1.0
 *
 * Este componente proporciona una barra de herramientas para interactuar con el mapa de red,
 * incluyendo funcionalidades para agregar elementos, controlar capas y centrar el mapa.
 *
 * @example
 * ```html
 * <app-network-toolbar
 *   [activeLayers]="['FDP', 'OLT', 'ONT']"
 *   [isCreatingConnection]="false"
 *   (addElement)="onAddElement()"
 *   (toggleLayer)="onToggleLayer($event)"
 *   (centerMap)="onCenterMap()"
 * ></app-network-toolbar>
 * ```
 */
import { Component, EventEmitter, Input, Output, OnInit, OnDestroy, ChangeDetectionStrategy, Optional, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { ElementType, ElementStatus, NetworkElement } from '../../../../shared/types/network.types';
import { MatBadgeModule } from '@angular/material/badge';
import { ELEMENT_LABELS } from '../../services/map.constants';
import { MapEventsService, MapEventType } from '../../services/map-events.service';
import { LayerManagerService } from '../../services/layer-manager.service';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { LayerSettingsComponent } from '../layer-settings/layer-settings.component';
import { OfflineService } from '../../../../shared/services/offline.service';
import { MatSnackBar } from '@angular/material/snack-bar';

interface ToolbarLayer {
  type: ElementType;
  icon: string;
  tooltip: string;
}

@Component({
  selector: 'app-network-toolbar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule,
    MatTooltipModule,
    MatBadgeModule,
  ],
  template: `
    <div class="network-toolbar" role="toolbar" aria-label="Herramientas de diseño de red">
      <div class="toolbar-section" role="group" aria-label="Navegación del mapa">
        <button 
          mat-icon-button 
          matTooltip="Centrar Mapa" 
          (click)="onCenterMap()"
          aria-label="Centrar mapa"
        >
          <mat-icon aria-hidden="true">center_focus_strong</mat-icon>
        </button>
        
        <button 
          mat-icon-button 
          matTooltip="Acercar" 
          (click)="onZoomIn()"
          aria-label="Acercar mapa"
        >
          <mat-icon aria-hidden="true">zoom_in</mat-icon>
        </button>
        
        <button 
          mat-icon-button 
          matTooltip="Alejar" 
          (click)="onZoomOut()"
          aria-label="Alejar mapa"
        >
          <mat-icon aria-hidden="true">zoom_out</mat-icon>
        </button>
      </div>
      
      <mat-divider vertical aria-hidden="true"></mat-divider>
      
      <div class="toolbar-section" role="group" aria-label="Acciones de elementos">
        <button 
          mat-icon-button 
          matTooltip="Añadir Elemento" 
          (click)="onAddElement()"
          aria-label="Añadir nuevo elemento"
        >
          <mat-icon aria-hidden="true">add_circle</mat-icon>
        </button>
        
        <button 
          mat-icon-button 
          matTooltip="Crear Conexión" 
          (click)="onCreateConnection()"
          [class.active]="isCreatingConnection"
          [attr.aria-pressed]="isCreatingConnection"
          aria-label="Crear conexión entre elementos"
        >
          <mat-icon aria-hidden="true">timeline</mat-icon>
        </button>
      </div>
      
      <mat-divider vertical aria-hidden="true"></mat-divider>
      
      <div class="toolbar-section" role="group" aria-label="Capas del mapa">
        <button *ngFor="let layer of layers"
          mat-icon-button 
          [matTooltip]="layer.tooltip" 
          [class.active]="isLayerActive(layer.type)"
          [attr.aria-pressed]="isLayerActive(layer.type)"
          (click)="toggleLayerVisibility(layer.type)"
          [attr.aria-label]="'Mostrar u ocultar capa de ' + layer.tooltip"
        >
          <mat-icon aria-hidden="true">{{ layer.icon }}</mat-icon>
        </button>
        
        <button 
          mat-icon-button 
          [matMenuTriggerFor]="layersMenu"
          matTooltip="Más capas"
          aria-label="Mostrar más capas disponibles"
        >
          <mat-icon aria-hidden="true">more_horiz</mat-icon>
        </button>
        
        <button 
          mat-icon-button 
          matTooltip="Configuración de capas" 
          (click)="openLayerSettings()"
          aria-label="Configurar capas"
        >
          <mat-icon aria-hidden="true">settings</mat-icon>
        </button>
        
        <mat-menu #layersMenu="matMenu">
          <button *ngFor="let layer of additionalLayers" 
            mat-menu-item
            (click)="toggleLayerVisibility(layer.type)"
          >
            <mat-icon [color]="isLayerActive(layer.type) ? 'primary' : ''">
              {{ isLayerActive(layer.type) ? 'check_box' : 'check_box_outline_blank' }}
            </mat-icon>
            <span>{{ layer.tooltip }}</span>
          </button>
        </mat-menu>
      </div>
      
      <mat-divider vertical aria-hidden="true"></mat-divider>
      
      <div class="toolbar-section" role="group" aria-label="Herramientas adicionales">
        <button 
          mat-icon-button 
          matTooltip="Exportar Mapa" 
          (click)="onExportMap()"
          aria-label="Exportar mapa actual"
        >
          <mat-icon aria-hidden="true">file_download</mat-icon>
        </button>
        
        <button 
          mat-icon-button 
          matTooltip="Configuración" 
          (click)="onOpenSettings()"
          aria-label="Abrir configuración"
        >
          <mat-icon aria-hidden="true">settings</mat-icon>
        </button>
      </div>

      <mat-divider vertical aria-hidden="true"></mat-divider>
      
      <div class="toolbar-section" role="group" aria-label="Visibilidad de paneles">
        <button 
          mat-icon-button 
          [matTooltip]="showSearchWidget ? 'Ocultar buscador' : 'Mostrar buscador'"
          (click)="onToggleSearchWidget()"
          [class.active]="showSearchWidget"
          [attr.aria-pressed]="showSearchWidget"
          aria-label="Mostrar u ocultar buscador"
        >
          <mat-icon aria-hidden="true">{{ showSearchWidget ? 'search_off' : 'search' }}</mat-icon>
        </button>
        
        <button 
          mat-icon-button 
          [matTooltip]="showElementsPanel ? 'Ocultar panel de elementos' : 'Mostrar panel de elementos'"
          (click)="onToggleElementsPanel()"
          [class.active]="showElementsPanel"
          [attr.aria-pressed]="showElementsPanel"
          aria-label="Mostrar u ocultar panel de elementos"
        >
          <mat-icon aria-hidden="true">{{ showElementsPanel ? 'view_sidebar_off' : 'view_sidebar' }}</mat-icon>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .network-toolbar {
      display: flex;
      padding: 8px;
      background-color: white;
      border-bottom: 1px solid #e0e0e0;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      z-index: 100;
    }
    
    .toolbar-section {
      display: flex;
      padding: 0 8px;
      align-items: center;
    }
    
    button.active {
      color: #1976d2;
      background-color: rgba(25, 118, 210, 0.1);
    }
    
    mat-divider {
      height: 36px;
      margin: 0 4px;
    }
    
    @media (max-width: 600px) {
      .network-toolbar {
        flex-wrap: wrap;
        justify-content: space-between;
      }
      
      .toolbar-section {
        margin: 4px 0;
      }
      
      mat-divider[vertical] {
        display: none;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NetworkToolbarComponent implements OnInit, OnDestroy {
  /**
   * @description Herramienta actualmente seleccionada
   */
  activeTool = 'pan';

  /**
   * @description Capas principales mostradas directamente en la barra
   */
  layers: ToolbarLayer[] = [
    { type: ElementType.OLT, icon: 'router', tooltip: 'OLTs' },
    { type: ElementType.ONT, icon: 'device_hub', tooltip: 'ONTs' },
    { type: ElementType.FDP, icon: 'cable', tooltip: 'FDPs' },
    { type: ElementType.SPLITTER, icon: 'call_split', tooltip: 'Splitters' },
    { type: ElementType.ODF, icon: 'settings_input_hdmi', tooltip: 'ODFs' }
  ];
  
  /**
   * @description Capas adicionales en el menú desplegable
   */
  additionalLayers: ToolbarLayer[] = [
    { type: ElementType.MSAN, icon: 'device_hub', tooltip: 'MSANs' },
    { type: ElementType.EDFA, icon: 'electrical_services', tooltip: 'EDFAs' },
    { type: ElementType.MANGA, icon: 'cable', tooltip: 'Mangas' },
    { type: ElementType.TERMINAL_BOX, icon: 'inbox', tooltip: 'Cajas Terminales' },
    { type: ElementType.FIBER_CONNECTION, icon: 'timeline', tooltip: 'Conexiones' },
    { type: ElementType.FIBER_THREAD, icon: 'timeline', tooltip: 'Hilos de Fibra' },
    { type: ElementType.ROUTER, icon: 'wifi_tethering', tooltip: 'Routers' },
    { type: ElementType.RACK, icon: 'dns', tooltip: 'Racks' },
    { type: ElementType.WDM_FILTER, icon: 'filter_alt', tooltip: 'Filtros WDM' },
    { type: ElementType.OPTICAL_SWITCH, icon: 'swap_horiz', tooltip: 'Conmutadores Ópticos' },
    { type: ElementType.ROADM, icon: 'swap_calls', tooltip: 'ROADMs' },
    { type: ElementType.FIBER_SPLICE, icon: 'settings_input_component', tooltip: 'Empalmes' },
    { type: ElementType.DROP_CABLE, icon: 'settings_ethernet', tooltip: 'Cables de Acometida' },
    { type: ElementType.DISTRIBUTION_CABLE, icon: 'settings_ethernet', tooltip: 'Cables de Distribución' },
    { type: ElementType.FEEDER_CABLE, icon: 'settings_ethernet', tooltip: 'Cables Alimentadores' },
    { type: ElementType.BACKBONE_CABLE, icon: 'settings_ethernet', tooltip: 'Cables Troncales' }
  ];

  /**
   * @description Estado actual de las capas visibles
   */
  @Input() activeLayers: ElementType[] = [
    ElementType.OLT, 
    ElementType.ONT, 
    ElementType.FDP, 
    ElementType.SPLITTER,
    ElementType.ODF
  ];

  /**
   * @description Elementos actualmente seleccionados en el mapa
   * Puede ser un array de elementos o un número que representa la cantidad
   */
  @Input() selectedElements: NetworkElement[] | number = [];

  /**
   * @description Indica si se está creando una conexión
   */
  @Input() isCreatingConnection = false;

  /**
   * @description Evento emitido cuando se solicita agregar un nuevo elemento
   */
  @Output() addElement = new EventEmitter<void>();

  /**
   * @description Evento emitido cuando se solicita alternar la visibilidad de una capa
   */
  @Output() toggleLayer = new EventEmitter<ElementType>();

  /**
   * @description Evento emitido cuando se solicita centrar el mapa
   */
  @Output() centerMap = new EventEmitter<void>();

  /**
   * @description Evento emitido cuando se solicita limpiar la selección
   */
  @Output() clearSelection = new EventEmitter<void>();

  /**
   * @description Evento emitido cuando se solicita zoom in
   */
  @Output() zoomIn = new EventEmitter<void>();

  /**
   * @description Evento emitido cuando se solicita zoom out
   */
  @Output() zoomOut = new EventEmitter<void>();

  /**
   * @description Evento emitido cuando se solicita crear una conexión
   */
  @Output() createConnection = new EventEmitter<void>();

  /**
   * @description Evento emitido cuando se solicita exportar el mapa
   * Puede incluir un formato opcional para la exportación
   */
  @Output() exportMap = new EventEmitter<string | void>();

  /**
   * @description Evento emitido cuando se solicita abrir la configuración
   */
  @Output() openSettings = new EventEmitter<void>();

  /**
   * @description Estado de visibilidad de los paneles
   */
  @Input() showSearchWidget = true;
  @Input() showElementsPanel = true;

  /**
   * @description Eventos para controlar la visibilidad de los paneles
   */
  @Output() toggleSearchWidget = new EventEmitter<void>();
  @Output() toggleElementsPanel = new EventEmitter<void>();
  
  /**
   * @description Evento emitido cuando se hace clic en el botón de diagnóstico
   */
  @Output() diagnosticClick = new EventEmitter<void>();
  
  /**
   * @description Evento emitido cuando se hace clic en el botón de ayuda
   */
  @Output() helpClick = new EventEmitter<void>();

  /**
   * @description Evento emitido cuando se solicita preparar datos offline
   */
  @Output() prepareOfflineModeRequest = new EventEmitter<boolean>();

  // Para desuscribirse
  private destroy$ = new Subject<void>();

  isOfflineMode = false;

  // Servicios via inject 
  private mapEventsService = inject(MapEventsService);
  private layerManager = inject(LayerManagerService);
  private dialog = inject(MatDialog);
  private offlineService = inject(OfflineService);
  private snackBar = inject(MatSnackBar);

  constructor() { }

  /**
   * @description Verifica si una capa está activa
   */
  isLayerActive(type: ElementType): boolean {
    return this.layerManager.isLayerActiveSync(type);
  }

  /**
   * @description Obtiene el nombre legible de un tipo de elemento
   */
  getElementTypeName(type: ElementType): string {
    // Usar ELEMENT_LABELS si está disponible para ese tipo
    const label = ELEMENT_LABELS[type];
    if (label) return label;

    // Fallback a la implementación manual
    switch (type) {
      case ElementType.OLT: return 'Terminal de Línea Óptica';
      case ElementType.ONT: return 'Terminal de Red Óptica';
      case ElementType.FDP: return 'Punto de Distribución';
      case ElementType.SPLITTER: return 'Divisor Óptico';
      case ElementType.EDFA: return 'Amplificador EDFA';
      case ElementType.MANGA: return 'Manga de Empalme';
      case ElementType.TERMINAL_BOX: return 'Caja Terminal';
      case ElementType.MSAN: return 'Nodo de Acceso Multi-Servicio';
      case ElementType.ODF: return 'Distribuidor de Fibra Óptica';
      case ElementType.ROUTER: return 'Router';
      case ElementType.RACK: return 'Rack';
      case ElementType.FIBER_CONNECTION: return 'Conexión de Fibra';
      case ElementType.FIBER_THREAD: return 'Hilo de Fibra';
      case ElementType.DROP_CABLE: return 'Cable de Acometida';
      case ElementType.DISTRIBUTION_CABLE: return 'Cable de Distribución';
      case ElementType.FEEDER_CABLE: return 'Cable Alimentador';
      case ElementType.BACKBONE_CABLE: return 'Cable Troncal';
      case ElementType.WDM_FILTER: return 'Filtro WDM';
      case ElementType.OPTICAL_SWITCH: return 'Conmutador Óptico';
      case ElementType.ROADM: return 'Multiplexor Óptico Reconfigurable';
      case ElementType.COHERENT_TRANSPONDER: return 'Transpondedor Coherente';
      case ElementType.WAVELENGTH_ROUTER: return 'Router de Longitudes de Onda';
      case ElementType.FIBER_SPLICE: return 'Empalme de Fibra';
      case ElementType.OPTICAL_AMPLIFIER: return 'Amplificador Óptico';
      case ElementType.NETWORK_GRAPH: return 'Grafo de Red';
      default: return 'Elemento de Red';
    }
  }

  /**
   * Método para cambiar la herramienta actual
   * @param tool Nombre de la herramienta a activar
   */
  setActiveTool(tool: string): void {
    const previousTool = this.activeTool || 'pan';
    this.activeTool = tool;
    
    // Notificar al servicio centralizado de eventos sobre el cambio de herramienta
    this.mapEventsService.changeTool(tool, previousTool);
  }

  /**
   * Handler para añadir un elemento
   */
  onAddElement(): void {
    // Mantener compatibilidad con eventos existentes
    this.addElement.emit();
  }

  /**
   * Handler para activar/desactivar una capa
   * @param layer Tipo de capa a alternar
   */
  toggleLayerVisibility(layer: ElementType): void {
    // Usar el servicio de gestión de capas que determinará correctamente el estado
    this.layerManager.toggleLayer(layer);
    
    // Mantener compatibilidad con eventos existentes para componentes que aún no usan el servicio
    this.toggleLayer.emit(layer);
  }

  /**
   * Handler para centrar el mapa
   */
  onCenterMap(): void {
    // Mantener compatibilidad con eventos existentes
    this.centerMap.emit();
    
    // También podríamos emitir un evento específico en el servicio centralizado
    // si fuera necesario para otras partes de la aplicación
  }

  /**
   * Handler para limpiar la selección actual
   */
  onClearSelection(): void {
    // Mantener compatibilidad con eventos existentes
    this.clearSelection.emit();
    
    // Notificar al servicio centralizado que se ha deseleccionado todo
    this.mapEventsService.selectElement(null);
    this.mapEventsService.selectConnection(null);
  }

  /**
   * Handler para acercar el zoom
   */
  onZoomIn(): void {
    // Mantener compatibilidad con eventos existentes
    this.zoomIn.emit();
  }

  /**
   * Handler para alejar el zoom
   */
  onZoomOut(): void {
    // Mantener compatibilidad con eventos existentes
    this.zoomOut.emit();
  }

  /**
   * Handler para alternar la creación de conexiones
   */
  onCreateConnection(): void {
    // Alternar el estado
    this.isCreatingConnection = !this.isCreatingConnection;
    
    // Emitir el evento para compatibilidad
    this.createConnection.emit();
    
    // Si activamos el modo de conexión, cambiar la herramienta a 'connect'
    if (this.isCreatingConnection) {
      this.setActiveTool('connect');
    } else {
      // Si desactivamos, volver a la herramienta de selección
      this.setActiveTool('select');
    }
  }

  /**
   * Handler para mostrar/ocultar el widget de búsqueda
   */
  onToggleSearchWidget(): void {
    // Emitir el evento para compatibilidad
    this.toggleSearchWidget.emit();
  }

  /**
   * Handler para mostrar/ocultar el panel de elementos
   */
  onToggleElementsPanel(): void {
    // Emitir el evento para compatibilidad
    this.toggleElementsPanel.emit();
  }

  /**
   * @description Maneja el evento de exportar el mapa
   */
  onExportMap(): void {
    // Añadir lógica de pulsación
    const button = document.querySelector('button[matTooltip="Exportar Mapa"]') as HTMLElement;
    if (button) {
      button.classList.add('transition-element');
      button.style.transform = 'scale(0.95)';
      setTimeout(() => {
        button.style.transform = 'scale(1)';
      }, 200);
    }
    
    this.exportMap.emit();
  }

  /**
   * @description Maneja el evento de abrir la configuración
   */
  onOpenSettings(): void {
    // Añadir lógica de pulsación
    const button = document.querySelector('button[matTooltip="Configuración"]') as HTMLElement;
    if (button) {
      button.classList.add('transition-element');
      button.style.transform = 'scale(0.95)';
      setTimeout(() => {
        button.style.transform = 'scale(1)';
      }, 200);
    }
    
    this.openSettings.emit();
  }

  /**
   * @description Maneja el clic en el botón de diagnóstico
   */
  onNavigateToDiagnostic(): void {
    this.diagnosticClick.emit();
  }

  /**
   * @description Maneja el clic en el botón de ayuda
   */
  onOpenHelp(): void {
    this.helpClick.emit();
  }

  // Añadir un método para abrir el diálogo de configuración de capas
  openLayerSettings(): void {
    this.dialog.open(LayerSettingsComponent, {
      width: '600px',
      maxHeight: '80vh',
      panelClass: 'layer-settings-dialog'
    });
  }

  /**
   * Prepara el mapa para uso offline
   */
  prepareOfflineMode(): void {
    this.isOfflineMode = !this.isOfflineMode;
    
    if (this.isOfflineMode) {
      // Verificar si hay conexión
      if (!this.offlineService.isNetworkAvailable()) {
        this.snackBar.open('Ya estás en modo offline. No es posible descargar datos adicionales sin conexión.', 'Cerrar', {
          duration: 5000
        });
        return;
      }
      
      // Emitir evento para que el componente padre lo maneje
      this.prepareOfflineModeRequest.emit(true);
    } else {
      this.snackBar.open('Modo normal activado', 'Cerrar', {
        duration: 2000
      });
      this.prepareOfflineModeRequest.emit(false);
    }
  }

  ngOnInit(): void {
    // Ordenar capas adicionales alfabéticamente por tooltip para mejor usabilidad
    this.additionalLayers.sort((a, b) => a.tooltip.localeCompare(b.tooltip));
    
    // Usar iconos consistentes del servicio
    this.layers.forEach(layer => {
      layer.icon = this.layerManager.getLayerIcon(layer.type);
    });
    
    this.additionalLayers.forEach(layer => {
      layer.icon = this.layerManager.getLayerIcon(layer.type);
    });
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

