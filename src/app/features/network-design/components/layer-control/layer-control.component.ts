import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MapStateManagerService } from '../../services/map/map-state-manager.service';
import { LoggerService } from '../../../../core/services/logger.service';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { MatIconModule } from '@angular/material/icon';

/**
 * Interfaz para capas del mapa - la original
 */
interface MapLayer {
  id: string;
  name: string;
  visible: boolean;
  type: 'base' | 'overlay';
  icon?: string;
  description?: string;
  order: number;
}

/**
 * Interfaz simplificada para uso en el UI
 */
export interface LayerEntry {
  id: string;
  name: string;
  visible: boolean;
  description?: string;
  icon?: string;
  options?: any;
}

@Component({
  selector: 'app-layer-control',
  templateUrl: './layer-control.component.html',
  styleUrls: ['./layer-control.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatTooltipModule,
    DragDropModule,
    MatIconModule
  ]
})
export class LayerControlComponent implements OnInit, OnDestroy {
  @Input() position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' = 'top-right';

  // Usamos MapLayer internamente para almacenar datos completos
  private _baseLayers: MapLayer[] = [];
  private _overlayLayers: MapLayer[] = [];
  
  // Exponemos LayerEntry para la UI
  baseLayers: LayerEntry[] = [];
  overlayLayers: LayerEntry[] = [];
  
  @Output() baseLayerChanged = new EventEmitter<LayerEntry>();
  @Output() overlayLayerChanged = new EventEmitter<LayerEntry>();
  
  expandedLayers = false;
  expandedBase = true;
  expandedOverlays = true;
  
  /**
   * Controla si el panel se puede arrastrar
   */
  isDraggable = false;
  
  /**
   * Posición almacenada del panel para recordarla entre sesiones
   */
  panelPosition: {x: number, y: number} | null = null;
  
  private destroy$ = new Subject<void>();
  
  get positionClass(): string {
    return `lc-${this.position}`;
  }
  
  constructor(
    private mapStateManager: MapStateManagerService,
    private logger: LoggerService
  ) {}
  
  ngOnInit(): void {
    // Suscribirse a cambios en las capas
    this.mapStateManager.layerChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadLayers();
      });
      
    // Cargar capas iniciales
    this.loadLayers();
    
    // Intentar recuperar posición guardada
    this.loadSavedPosition();
    
    // Por defecto, si no hay capas base, añadimos una capa base estándar
    if (this.baseLayers.length === 0) {
      this.createDefaultBaseLayers();
    }
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  /**
   * Carga las capas desde el servicio de gestión del mapa
   */
  private loadLayers(): void {
    try {
      // Obtener todas las capas del state manager
      const allLayers = this.mapStateManager.getAllLayers();
      
      // Separar en base y overlay
      this._baseLayers = allLayers
        .filter(layer => layer.type === 'base')
        .sort((a, b) => a.order - b.order);
        
      this._overlayLayers = allLayers
        .filter(layer => layer.type === 'overlay')
        .sort((a, b) => a.order - b.order);
        
      // Si no hay capas después de filtrar, crear algunas por defecto
      if (this._baseLayers.length === 0) {
        this.createDefaultBaseLayers();
      }
      
      if (this._overlayLayers.length === 0) {
        this.createDefaultOverlayLayers();
      }
      
      // Convertir a LayerEntry para la UI
      this.baseLayers = this._baseLayers.map(layer => ({
        id: layer.id,
        name: layer.name,
        visible: layer.visible,
        description: layer.description,
        icon: layer.icon
      }));
      
      this.overlayLayers = this._overlayLayers.map(layer => ({
        id: layer.id,
        name: layer.name,
        visible: layer.visible,
        description: layer.description,
        icon: layer.icon
      }));
    } catch (error) {
      this.logger.error('Error al cargar capas:', error);
    }
  }
  
  /**
   * Crea capas base por defecto si no se han proporcionado
   */
  private createDefaultBaseLayers(): void {
    this._baseLayers = [
      {
        id: 'osm',
        name: 'OpenStreetMap',
        visible: true,
        type: 'base',
        icon: 'fa-map',
        description: 'Mapa base estándar',
        order: 1
      },
      {
        id: 'satellite',
        name: 'Satélite',
        visible: false,
        type: 'base',
        icon: 'fa-satellite-dish',
        description: 'Vista satelital',
        order: 2
      },
      {
        id: 'terrain',
        name: 'Terreno',
        visible: false,
        type: 'base',
        icon: 'fa-mountain',
        description: 'Mapa topográfico y de terreno',
        order: 3
      }
    ];
    
    // Actualizar también el array UI
    this.baseLayers = this._baseLayers.map(layer => ({
      id: layer.id,
      name: layer.name,
      visible: layer.visible,
      description: layer.description,
      icon: layer.icon
    }));
  }
  
  /**
   * Crea capas overlay por defecto si no se han proporcionado
   */
  private createDefaultOverlayLayers(): void {
    this._overlayLayers = [
      {
        id: 'elements',
        name: 'Elementos',
        visible: true,
        type: 'overlay',
        icon: 'fa-network-wired',
        description: 'Elementos de la red',
        order: 1
      },
      {
        id: 'connections',
        name: 'Conexiones',
        visible: true,
        type: 'overlay',
        icon: 'fa-project-diagram',
        description: 'Conexiones entre elementos',
        order: 2
      },
      {
        id: 'labels',
        name: 'Etiquetas',
        visible: true,
        type: 'overlay',
        icon: 'fa-tag',
        description: 'Nombres de los elementos',
        order: 3
      },
      {
        id: 'grid',
        name: 'Cuadrícula',
        visible: false,
        type: 'overlay',
        icon: 'fa-th',
        description: 'Cuadrícula de coordenadas',
        order: 4
      }
    ];
    
    // Actualizar también el array UI
    this.overlayLayers = this._overlayLayers.map(layer => ({
      id: layer.id,
      name: layer.name,
      visible: layer.visible,
      description: layer.description,
      icon: layer.icon
    }));
  }
  
  /**
   * Alterna la visibilidad de una capa base
   * @param layer Capa base seleccionada
   */
  toggleBaseLayer(layer: LayerEntry): void {
    // Capas base son mutuamente excluyentes, sólo una puede estar activa
    this.baseLayers.forEach(l => {
      l.visible = l.id === layer.id;
    });
    
    // Actualizar también en el modelo interno y servicio
    this._baseLayers.forEach(l => {
      const visible = l.id === layer.id;
      if (l.visible !== visible) {
        l.visible = visible;
        this.mapStateManager.toggleLayerVisibility(l.id);
      }
    });
    
    this.baseLayerChanged.emit(layer);
  }
  
  /**
   * Alterna la visibilidad de una capa overlay
   * @param layer Capa overlay a mostrar/ocultar
   */
  toggleOverlayLayer(layer: LayerEntry): void {
    // Capas overlay pueden tener múltiples activas
    layer.visible = !layer.visible;
    
    // Actualizar también en el modelo interno y servicio
    const internalLayer = this._overlayLayers.find(l => l.id === layer.id);
    if (internalLayer) {
      internalLayer.visible = layer.visible;
      this.mapStateManager.toggleLayerVisibility(internalLayer.id);
    }
    
    this.overlayLayerChanged.emit(layer);
  }
  
  /**
   * Expande o colapsa el panel principal
   */
  toggleExpand(): void {
    this.expandedLayers = !this.expandedLayers;
  }
  
  /**
   * Expande o colapsa el grupo de capas base
   */
  toggleBaseExpand(): void {
    this.expandedBase = !this.expandedBase;
  }
  
  /**
   * Expande o colapsa el grupo de capas overlay
   */
  toggleOverlaysExpand(): void {
    this.expandedOverlays = !this.expandedOverlays;
  }
  
  /**
   * Toggle para habilitar/deshabilitar el arrastre del panel
   */
  toggleDraggable(): void {
    this.isDraggable = !this.isDraggable;
    if (!this.isDraggable && this.panelPosition) {
      // Opcional: resetear la posición si se desactiva el arrastre y estaba movido
      // this.panelPosition = { x: 0, y: 0 }; // O a su posición original por defecto
    } else if (this.isDraggable && !this.panelPosition) {
      // Si se activa el arrastre y no hay posición guardada, podría inicializarse
      // this.panelPosition = { x: 0, y: 0 }; 
    }
    this.logger.debug(`LayerControlComponent: Draggable toggled to ${this.isDraggable}`);
  }
  
  /**
   * Guarda la posición actual del panel cuando se suelta
   */
  onPanelDragEnded(event: {source: any, distance: {x: number, y: number}}): void {
    if (!this.isDraggable) return;

    const newPosition = {
      x: (this.panelPosition?.x || 0) + event.distance.x,
      y: (this.panelPosition?.y || 0) + event.distance.y
    };
    this.panelPosition = newPosition;
    
    // Mover el elemento explícitamente con transform si no se usa cdkDragFreeDragPosition
    event.source.element.nativeElement.style.transform = `translate3d(${newPosition.x}px, ${newPosition.y}px, 0)`;

    this.logger.debug('LayerControlComponent: Panel drag ended', event.distance, 'New position:', this.panelPosition);
    this.saveCurrentPosition();
  }
  
  /**
   * Guarda la posición en el almacenamiento local
   */
  private saveCurrentPosition(): void {
    if (this.panelPosition) {
      try {
        localStorage.setItem('layer-control-position', JSON.stringify(this.panelPosition));
      } catch (e) {
        console.warn('No se pudo guardar la posición del panel de capas', e);
      }
    }
  }
  
  /**
   * Carga la posición guardada desde el almacenamiento local
   */
  private loadSavedPosition(): void {
    try {
      const savedPosition = localStorage.getItem('layer-control-position');
      if (savedPosition) {
        this.panelPosition = JSON.parse(savedPosition);
      }
    } catch (e) {
      console.warn('No se pudo cargar la posición guardada del panel de capas', e);
    }
  }
} 
