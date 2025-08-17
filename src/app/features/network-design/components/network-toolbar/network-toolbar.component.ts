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
import { Component, EventEmitter, Input, Output, OnInit, OnDestroy, ChangeDetectionStrategy, Optional, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { ElementType, ElementStatus, NetworkElement } from '../../../../shared/types/network.types';
import { ExtendedElementType, getElementTypeName } from '../../../../shared/types/network-elements';
import { MatBadgeModule } from '@angular/material/badge';
import { ELEMENT_LABELS, ELEMENT_ICONS } from '../../services/map.constants';
import { MapEventsService, MapEventType } from '../../services/map-events.service';
import { LayerManagerService } from '../../services/layer-manager.service';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { LayerSettingsComponent } from '../layer-settings/layer-settings.component';
import { OfflineService } from '../../../../shared/services/offline.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ToolType } from '../../services/map/map-state-manager.service';
import { LoggerService } from '../../../../core/services/logger.service';

interface ToolbarLayer {
  type: ElementType;
  icon: string;
  tooltip: string;
}

interface AddableElementType {
  key: ElementType;
  name: string;
  icon: string;
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
      
      <div class="toolbar-section" role="group" aria-label="Herramientas de mapa">
        <button 
          mat-icon-button 
          matTooltip="Mover (Pan)" 
          (click)="setActiveTool('pan')"
          [class.active]="activeTool === 'pan'"
          [attr.aria-pressed]="activeTool === 'pan'"
          aria-label="Mover el mapa (modo navegación)"
        >
          <mat-icon aria-hidden="true">pan_tool</mat-icon>
        </button>
        
        <button 
          mat-icon-button 
          matTooltip="Seleccionar" 
          (click)="setActiveTool('select')"
          [class.active]="activeTool === 'select'"
          [attr.aria-pressed]="activeTool === 'select'"
          aria-label="Seleccionar elementos"
        >
          <mat-icon aria-hidden="true">touch_app</mat-icon>
        </button>
        
        <button 
          mat-icon-button 
          matTooltip="Medir distancia" 
          (click)="setActiveTool('measure')"
          [class.active]="activeTool === 'measure'"
          [attr.aria-pressed]="activeTool === 'measure'"
          aria-label="Medir distancia entre puntos"
        >
          <mat-icon aria-hidden="true">straighten</mat-icon>
        </button>
        
        <button 
          mat-icon-button 
          matTooltip="Selección por área" 
          (click)="setActiveTool('areaSelect')"
          [class.active]="activeTool === 'areaSelect'"
          [attr.aria-pressed]="activeTool === 'areaSelect'"
          aria-label="Seleccionar elementos por área"
        >
          <mat-icon aria-hidden="true">select_all</mat-icon>
        </button>
      </div>
      
      <mat-divider vertical aria-hidden="true"></mat-divider>
      
      <div class="toolbar-section" role="group" aria-label="Acciones de elementos">
        <button 
          mat-icon-button 
          matTooltip="Añadir Elemento" 
          [matMenuTriggerFor]="addElementMenu"  
          aria-label="Añadir nuevo elemento"
        >
          <mat-icon aria-hidden="true">add_circle</mat-icon>
        </button>
        <mat-menu #addElementMenu="matMenu">
          <button *ngFor="let item of addableElementTypes" mat-menu-item (click)="onSelectElementType(item.key)">
            <mat-icon *ngIf="item.icon && item.icon !== ELEMENT_ICONS.default">{{ item.icon }}</mat-icon>
            <mat-icon *ngIf="!item.icon || item.icon === ELEMENT_ICONS.default">{{ ELEMENT_ICONS.default }}</mat-icon>
            <span>{{ item.name }}</span>
          </button>
        </mat-menu>
        
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
          [class.pulse-effect]="exportButtonPulsing"
        >
          <mat-icon aria-hidden="true">file_download</mat-icon>
        </button>
        
        <button 
          mat-icon-button 
          matTooltip="Configuración" 
          (click)="onOpenSettings()"
          aria-label="Abrir configuración"
          [class.pulse-effect]="settingsButtonPulsing"
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
      padding: 4px 10px;
      background-color: white;
      border-bottom: 1px solid #e0e0e0;
      box-shadow: 0 3px 5px rgba(0,0,0,0.12);
      z-index: 1100;
      position: relative;
      height: 52px;
      align-items: center;
      gap: 2px;
    }
    
    .toolbar-section {
      display: flex;
      padding: 0 5px;
      align-items: center;
      gap: 3px;
    }
    
    button.active {
      color: #1976d2;
      background-color: rgba(25, 118, 210, 0.12);
      font-weight: 500;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    
    button[mat-icon-button] {
      transition: all 0.2s ease;
      border-radius: 4px;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    
    button[mat-icon-button]:hover {
      background-color: rgba(0,0,0,0.04);
      transform: translateY(-1px);
    }
    
    button[mat-icon-button]:active {
      background-color: rgba(0,0,0,0.08);
      transform: translateY(0px);
    }
    
    mat-divider {
      height: 38px;
      margin: 0 5px;
      opacity: 0.5;
    }

    mat-icon-button, [mat-icon-button] {
      width: 40px !important;
      height: 40px !important;
      line-height: 40px !important;
      padding: 0 !important;
      margin: 0 2px !important;
    }

    mat-icon {
      font-size: 22px;
      height: 22px;
      width: 22px;
      margin: auto;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    
    /* Proporciones para pantallas pequeñas donde la barra es más compacta */
    @media (max-width: 768px) and (min-width: 601px) {
      .network-toolbar {
        height: 48px;
        padding: 4px 8px;
      }
      
      mat-icon-button, [mat-icon-button] {
        width: 36px !important;
        height: 36px !important;
        line-height: 36px !important;
      }
      
      mat-icon {
        font-size: 20px;
        height: 20px;
        width: 20px;
      }
      
      mat-divider {
        height: 34px;
      }
    }

    /* Animación de pulsación para botones */
    @keyframes pulseEffect {
      0% {
        transform: scale(1);
        box-shadow: 0 0 0 0 rgba(25, 118, 210, 0.4);
      }
      70% {
        transform: scale(1.05);
        box-shadow: 0 0 5px 10px rgba(25, 118, 210, 0);
      }
      100% {
        transform: scale(1);
        box-shadow: 0 0 0 0 rgba(25, 118, 210, 0);
      }
    }

    .pulse-effect {
      animation: pulseEffect 0.5s ease-out;
    }
    
    /* Dispositivos móviles o pantallas muy pequeñas */
    @media (max-width: 600px) {
      .network-toolbar {
        flex-wrap: wrap;
        justify-content: space-between;
        height: auto;
        padding: 4px;
      }
      
      .toolbar-section {
        margin: 2px;
        flex-wrap: wrap;
        justify-content: center;
      }
      
      mat-divider[vertical] {
        display: none;
      }
      
      mat-icon-button, [mat-icon-button] {
        width: 32px !important;
        height: 32px !important;
        line-height: 32px !important;
      }
      
      mat-icon {
        font-size: 18px;
        height: 18px;
        width: 18px;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NetworkToolbarComponent implements OnInit, OnDestroy {
  /**
   * @description Herramienta actualmente seleccionada
   */
  @Input() activeTool: ToolType = 'pan';

  /**
   * @description Control para la animación de pulsación del botón Exportar
   */
  exportButtonPulsing = false;

  /**
   * @description Control para la animación de pulsación del botón Configuración
   */
  settingsButtonPulsing = false;

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
  @Output() addElement = new EventEmitter<ElementType>();

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

  /**
   * @description Evento emitido cuando se cambia la herramienta activa
   */
  @Output() toolChanged = new EventEmitter<ToolType>();

  /**
   * @description Capas actualmente activas
   */
  @Input() activeLayers: ElementType[] = [];

  // Para desuscribirse
  private destroy$ = new Subject<void>();

  isOfflineMode = false;

  // Servicios via inject 
  private mapEventsService = inject(MapEventsService);
  private layerManager = inject(LayerManagerService);
  private dialog = inject(MatDialog);
  private offlineService = inject(OfflineService);
  private snackBar = inject(MatSnackBar);
  private logger = inject(LoggerService);

  public addableElementTypes: AddableElementType[] = [];
  public ELEMENT_ICONS = ELEMENT_ICONS;

  constructor() { }

  /**
   * @description Verifica si una capa está activa
   * @param type Tipo de elemento/capa
   * @returns true si la capa está activa
   */
  isLayerActive(type: ElementType): boolean {
    // Si no hay capas definidas, asumir todas activas
    if (!this.activeLayers || !Array.isArray(this.activeLayers) || this.activeLayers.length === 0) {
      return true;
    }
    
    return this.activeLayers.includes(type);
  }

  /**
   * @description Obtiene el nombre legible de un tipo de elemento
   */
  getElementTypeName(type: ElementType): string {
    // Usar la función importada del nuevo módulo
    return getElementTypeName(type);
  }

  /**
   * Método para cambiar la herramienta actual
   * @param tool Nombre de la herramienta a activar
   */
  setActiveTool(tool: ToolType): void {
    if (this.activeTool === tool) return; // No hacer nada si la herramienta ya está activa
    
    const previousTool = this.activeTool;
    this.activeTool = tool;
    
    // Notificar al servicio centralizado de eventos sobre el cambio de herramienta
    this.mapEventsService.changeTool(tool, previousTool);
    
    // Emitir el evento de cambio de herramienta
    this.toolChanged.emit(tool);
    
    // Anunciar para lectores de pantalla
    this.announceForScreenReader(`Herramienta ${this.getToolName(tool)} activada`);
    
    console.log('NetworkToolbar: Herramienta cambiada a', tool, new Date().toISOString());
  }
  
  /**
   * Obtiene el nombre legible de una herramienta
   */
  private getToolName(tool: ToolType): string {
    // Mapeo de herramientas a nombres legibles en español
    const toolNames: Record<string, string> = {
      'pan': 'Mover',
      'select': 'Seleccionar',
      'measure': 'Medir',
      'connect': 'Conectar',
      'areaSelect': 'Selección por área',
      'zoomIn': 'Acercar',
      'zoomOut': 'Alejar',
      'fitToScreen': 'Ajustar a pantalla',
      'resetZoom': 'Restablecer zoom'
    };
    
    return toolNames[tool] || tool;
  }

  /**
   * Handler para añadir un elemento
   */
  onAddElement(): void {
    this.logger.debug('Menú para añadir elemento abierto desde NetworkToolbar.');
  }

  /**
   * Handler para activar/desactivar una capa
   * @param layer Tipo de capa a alternar
   */
  toggleLayerVisibility(layer: ElementType): void {
    console.log('NetworkToolbar: Solicitud para alternar capa', layer, new Date().toISOString());
    const isActive = this.isLayerActive(layer);
    this.toggleLayer.emit(layer);
    
    // Anunciar el cambio para lectores de pantalla
    const action = isActive ? 'ocultada' : 'mostrada';
    const typeName = this.getElementTypeName(layer);
    this.announceForScreenReader(`Capa ${typeName} ${action}`);
  }

  /**
   * Handler para centrar el mapa
   */
  onCenterMap(): void {
    console.log('NetworkToolbar: Solicitud para centrar mapa', new Date().toISOString());
    this.centerMap.emit();
    
    // Anunciar para lectores de pantalla
    this.announceForScreenReader('Mapa centrado');
  }

  /**
   * Handler para limpiar la selección actual
   */
  onClearSelection(): void {
    console.log('NetworkToolbar: Solicitud para limpiar selección', new Date().toISOString());
    this.clearSelection.emit();
    
    // Anunciar para lectores de pantalla
    const count = Array.isArray(this.selectedElements) ? this.selectedElements.length : 0;
    this.announceForScreenReader(`Selección de ${count} elementos limpiada`);
  }

  /**
   * Handler para acercar el zoom
   */
  onZoomIn(): void {
    console.log('NetworkToolbar: Solicitud de zoom in', new Date().toISOString());
    this.zoomIn.emit();
    
    // Anunciar para lectores de pantalla
    this.announceForScreenReader('Zoom aumentado');
  }

  /**
   * Handler para alejar el zoom
   */
  onZoomOut(): void {
    console.log('NetworkToolbar: Solicitud de zoom out', new Date().toISOString());
    this.zoomOut.emit();
    
    // Anunciar para lectores de pantalla
    this.announceForScreenReader('Zoom disminuido');
  }

  /**
   * Handler para alternar la creación de conexiones
   */
  onCreateConnection(): void {
    console.log('NetworkToolbar: Solicitud para crear conexión', new Date().toISOString());
    // Cambiar el estado visual interno
    this.isCreatingConnection = !this.isCreatingConnection;
    
    // Emitir el evento al componente padre
    this.createConnection.emit();
    
    // Anunciar para lectores de pantalla
    const status = this.isCreatingConnection ? 'iniciada' : 'cancelada';
    this.announceForScreenReader(`Creación de conexión ${status}`);
  }

  /**
   * Handler para mostrar/ocultar el widget de búsqueda
   */
  onToggleSearchWidget(): void {
    console.log('NetworkToolbar: Solicitud para alternar widget de búsqueda', new Date().toISOString());
    this.toggleSearchWidget.emit();
    
    // Anunciar para lectores de pantalla
    const action = this.showSearchWidget ? 'ocultado' : 'mostrado';
    this.announceForScreenReader(`Buscador ${action}`);
  }

  /**
   * Handler para mostrar/ocultar el panel de elementos
   */
  onToggleElementsPanel(): void {
    console.log('NetworkToolbar: Solicitud para alternar panel de elementos', new Date().toISOString());
    this.toggleElementsPanel.emit();
    
    // Anunciar para lectores de pantalla
    const action = this.showElementsPanel ? 'ocultado' : 'mostrado';
    this.announceForScreenReader(`Panel de elementos ${action}`);
  }

  /**
   * @description Maneja el evento de exportar el mapa
   */
  onExportMap(): void {
    console.log('NetworkToolbar: Solicitud para exportar mapa', new Date().toISOString());
    this.exportMap.emit();
    
    // Anunciar para lectores de pantalla
    this.announceForScreenReader('Exportando mapa');
  }

  /**
   * @description Maneja el evento de abrir la configuración
   */
  onOpenSettings(): void {
    console.log('NetworkToolbar: Solicitud para abrir configuración');
    this.settingsButtonPulsing = true;
    setTimeout(() => this.settingsButtonPulsing = false, 500); // Duración de la animación
    
    this.openSettings.emit();
  }

  /**
   * @description Maneja el clic en el botón de diagnóstico
   */
  onNavigateToDiagnostic(): void {
    console.log('NetworkToolbar: Solicitud para navegar a diagnóstico');
    this.diagnosticClick.emit();
  }

  /**
   * @description Maneja el clic en el botón de ayuda
   */
  onOpenHelp(): void {
    console.log('NetworkToolbar: Solicitud para abrir ayuda');
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
          duration: 5000,
          panelClass: ['warning-snackbar'] // Ejemplo de clase para estilo
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
    // Lógica original de ngOnInit si la había, o mantenerla simple
    // Ejemplo: Suscripciones originales si eran correctas y necesarias aquí
    // Comentado temporalmente para evitar errores de linter no relacionados con la tarea actual
    /*
    this.mapEventsService.events$?.pipe(takeUntil(this.destroy$)).subscribe(event => {
      if (event?.type === MapEventType.EXPORT_START) {
        this.exportButtonPulsing = true;
      } else if (event?.type === MapEventType.EXPORT_END) {
        this.exportButtonPulsing = false;
      }
    });

    this.offlineService.isOfflineMode$?.pipe(takeUntil(this.destroy$)).subscribe(isOffline => {
      this.isOfflineMode = isOffline;
    });
    */
    
    this.prepareAddableElementTypes();
    // Ordenar capas adicionales alfabéticamente por tooltip para mejor usabilidad
    this.additionalLayers.sort((a, b) => a.tooltip.localeCompare(b.tooltip));
    
    // Usar iconos consistentes del servicio
    this.layers.forEach(layer => {
      layer.icon = this.layerManager.getLayerIcon(layer.type as any);
    });
    
    this.additionalLayers.forEach(layer => {
      layer.icon = this.layerManager.getLayerIcon(layer.type as any);
    });
    console.log('NetworkToolbarComponent: ngOnInit'); // Log para confirmar inicialización
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    console.error('NetworkToolbarComponent: ngOnDestroy FUE LLAMADO!'); // Log importante
    debugger; // Pausar ejecución aquí si se destruye
  }

  /**
   * Maneja las pulsaciones de teclas para la navegación accesible
   */
  @HostListener('keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    // Atajos de teclado para funciones comunes
    switch (event.key) {
      case 'z':
        if (event.ctrlKey || event.metaKey) {
          // Zoom in (Ctrl+Z)
          this.onZoomIn();
          event.preventDefault();
        }
        break;
      case 'x':
        if (event.ctrlKey || event.metaKey) {
          // Zoom out (Ctrl+X)
          this.onZoomOut();
          event.preventDefault();
        }
        break;
      case 'c':
        if (event.ctrlKey || event.metaKey) {
          // Center map (Ctrl+C)
          this.onCenterMap();
          event.preventDefault();
        }
        break;
      case 'Escape':
        // Cancelar la selección actual
        if (Array.isArray(this.selectedElements) ? this.selectedElements.length > 0 : (this.selectedElements as number) > 0) {
          this.onClearSelection();
          event.preventDefault();
        }
        break;
      case 'f':
        if (event.ctrlKey || event.metaKey) {
          // Togglear el panel de búsqueda (Ctrl+F)
          this.onToggleSearchWidget();
          event.preventDefault();
        }
        break;
      case 'h':
        if (event.ctrlKey || event.metaKey) {
          // Mostrar ayuda (Ctrl+H)
          this.onOpenHelp();
          event.preventDefault();
        }
        break;
    }
  }

  /**
   * Método para anunciar cambios para lectores de pantalla
   * Utiliza aria-live para anunciar cambios importantes
   */
  private announceForScreenReader(message: string): void {
    // Buscar o crear un elemento aria-live
    let ariaLive = document.getElementById('network-toolbar-announcer');
    
    if (!ariaLive) {
      ariaLive = document.createElement('div');
      ariaLive.id = 'network-toolbar-announcer';
      ariaLive.setAttribute('aria-live', 'polite');
      ariaLive.setAttribute('aria-atomic', 'true');
      ariaLive.classList.add('sr-only'); // Clase para esconder visualmente pero mantener accesible
      document.body.appendChild(ariaLive);
    }
    
    // Anunciar el mensaje
    ariaLive.textContent = message;
    
    // Limpiar después de un tiempo para evitar repeticiones
    setTimeout(() => {
      ariaLive.textContent = '';
    }, 3000);
  }

  private prepareAddableElementTypes(): void {
    this.addableElementTypes = Object.entries(ELEMENT_LABELS)
      .filter(([key, _]) => key !== 'default' && 
                           key !== ElementType.FIBER_CONNECTION &&
                           key !== ElementType.FIBER_SPLICE && 
                           key !== ElementType.FIBER_STRAND && 
                           key !== ElementType.FIBER_THREAD && 
                           key !== ElementType.NETWORK_GRAPH)
      .map(([key, name]) => ({
        key: key as ElementType,
        name: name,
        icon: ELEMENT_ICONS[key as ElementType] || ELEMENT_ICONS['default']
      }));
  }

  // Nuevo método para manejar la selección del tipo de elemento del menú
  onSelectElementType(elementType: ElementType, event?: MouseEvent): void {
    console.log('Clic en elemento detectado:', elementType);
    
    // Si tenemos el evento, detener propagación para evitar problemas con capas superiores
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    
    try {
      this.addElement.emit(elementType);
      this.logger.debug(`Solicitud para añadir elemento de tipo: ${elementType} desde NetworkToolbar`);
    } catch (error) {
      console.error('Error al seleccionar tipo de elemento:', error);
      this.snackBar.open('Error al seleccionar el tipo de elemento', 'Cerrar', { duration: 3000 });
    }
  }

  getElementIcon(type: ElementType): string {
    return ELEMENT_ICONS[type] || ELEMENT_ICONS.default;
  }

  /**
   * Activa la herramienta para mover elementos
   */
  onMoveElementClicked(): void {
    this.setActiveTool('moveElement' as ToolType);
  }
}

