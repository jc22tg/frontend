import { Component, ViewEncapsulation, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { takeUntil } from 'rxjs/operators';
import { MapElementManagerService } from '../../../../services/map/map-element-manager.service';
import { MapStateManagerService } from '../../../../services/map/map-state-manager.service';
import { LoggerService } from '../../../../../../core/services/logger.service';
import { ElementsPanelBaseComponent, ExtendedNetworkElement } from '../../../elements/shared/elements-panel-base.component';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { NetworkElement } from '../../../../../../shared/types/network.types';
import { ElementFilterDto } from '../../../../services/map/map-element-filter.dto';

// Importaciones de Angular Material
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MapInteractionService } from '../../../../services/map/map-interaction.service';

/**
 * Interfaz ampliada para el servicio de gestión de estado del mapa
 * para evitar castings excesivos
 */
interface ExtendedMapStateManager extends MapStateManagerService {
  mapMoved?: any;
  getMapBounds?(): any;
  highlightElement?(elementId: string): void;
  centerMapOnElement?(elementId: string): void;
}

/**
 * Versión del panel de elementos integrada con el contenedor del mapa
 */
@Component({
  selector: 'app-elements-panel',
  template: `
    <div class="elements-panel-container" 
         [ngClass]="{'expanded': isExpanded, 'cdk-drag-disabled': !isDraggable}" 
         cdkDrag 
         [cdkDragDisabled]="!isDraggable"
         [cdkDragBoundary]="'.map-container'" 
         (cdkDragEnded)="onPanelDragEnded($event)">
      <div class="panel-header" cdkDragHandle (mousedown)="$event.stopPropagation()">
        <button mat-icon-button (click)="toggleDraggable()" [matTooltip]="isDraggable ? 'Desactivar arrastre' : 'Activar arrastre'">
          <mat-icon>{{ isDraggable ? 'lock_open' : 'lock' }}</mat-icon>
        </button>
        <h3 class="panel-title" *ngIf="isExpanded">Elementos</h3>
        <span class="spacer"></span>
        <button mat-icon-button (click)="toggleExpansion()">
          <mat-icon>{{ isExpanded ? 'chevron_left' : 'chevron_right' }}</mat-icon>
        </button>
      </div>

      <div class="panel-content" *ngIf="isExpanded">
        <div class="tab-container">
          <div class="tab-header">
            <button 
              [class.active]="activeTab === 'elements'" 
              (click)="setActiveTab('elements')">Elementos</button>
            <button 
              [class.active]="activeTab === 'search'" 
              (click)="setActiveTab('search')">Búsqueda</button>
            <button 
              *ngIf="showFilters"
              [class.active]="activeTab === 'filters'" 
              (click)="setActiveTab('filters')">Filtros</button>
          </div>
          
          <!-- Pestaña de Elementos -->
          <div class="tab-content" *ngIf="activeTab === 'elements'">
            <div class="quick-filter">
              <span>Filtrar por tipo:</span>
              <div class="type-toggle-group">
                <button 
                  [class.selected]="elementTypeFilter === null"
                  (click)="filterByType(null)">Todos</button>
                <button 
                  *ngFor="let type of elementTypes"
                  [class.selected]="elementTypeFilter === type"
                  (click)="filterByType(type)">{{type}}</button>
              </div>
            </div>
            
            <div class="elements-list">
              <div 
                *ngFor="let element of getCurrentPageElements()" 
                class="element-item"
                [class.selected]="selectedElement?.id === element.id"
                (click)="selectElement(element)">
                <div class="element-id">{{element.id}}</div>
                <div class="element-type">{{element.type}}</div>
                <div class="element-name">{{element.name || 'Sin nombre'}}</div>
              </div>
              
              <div class="no-elements" *ngIf="getCurrentPageElements().length === 0">
                No hay elementos para mostrar
              </div>
            </div>
            
            <div class="pagination" *ngIf="totalPages > 1">
              <button 
                [disabled]="currentPage === 1"
                (click)="goToPage(currentPage - 1)">Anterior</button>
              <span>{{ currentPage }} / {{ totalPages }}</span>
              <button 
                [disabled]="currentPage === totalPages"
                (click)="goToPage(currentPage + 1)">Siguiente</button>
            </div>
          </div>
          
          <!-- Pestaña de Búsqueda -->
          <div class="tab-content" *ngIf="activeTab === 'search'">
            <div class="search-container">
              <div class="search-input">
                <input 
                  [formControl]="searchControl"
                  placeholder="Buscar por ID, nombre o descripción">
                <button 
                  *ngIf="searchControl.value" 
                  (click)="searchControl.setValue('')"
                  class="clear-button">✕</button>
                <span *ngIf="!isSearching" class="search-icon">🔍</span>
                <div *ngIf="isSearching" class="search-spinner"></div>
              </div>
              
              <div class="elements-list">
                <div 
                  *ngFor="let element of searchResults" 
                  class="element-item"
                  [class.selected]="selectedElement?.id === element.id"
                  (click)="selectElement(element)">
                  <div class="element-id">{{element.id}}</div>
                  <div class="element-type">{{element.type}}</div>
                  <div class="element-name">{{element.name || 'Sin nombre'}}</div>
                </div>
                
                <div class="no-results" *ngIf="searchResults.length === 0 && searchControl.value">
                  No se encontraron resultados
                </div>
                
                <div class="search-hint" *ngIf="!searchControl.value">
                  Ingresa un texto para buscar
                </div>
              </div>
            </div>
          </div>
          
          <!-- Pestaña de Filtros -->
          <div class="tab-content" *ngIf="activeTab === 'filters' && showFilters">
            <div class="filters-form">
              <form [formGroup]="advancedFiltersForm" (ngSubmit)="applyAdvancedFilters()">
                <!-- Implementación simplificada de filtros -->
                <div class="form-group">
                  <label>Tipo de elemento</label>
                  <select formControlName="types" multiple>
                    <option *ngFor="let type of elementTypes" [value]="type">{{ type }}</option>
                  </select>
                </div>
                
                <div class="form-actions">
                  <button type="submit" class="primary-button">Aplicar</button>
                  <button type="button" class="secondary-button" (click)="resetAdvancedFilters()">Limpiar</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
    }
    
    .elements-panel-container {
      height: 100%;
      width: 320px;
      background: white;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      display: flex;
      flex-direction: column;
      transition: width 0.3s ease;
      overflow: hidden;
    }
    
    .elements-panel-container.expanded {
      width: 320px;
    }
    
    .elements-panel-container:not(.expanded) {
      width: 50px;
    }
    
    .panel-header {
      height: 48px;
      display: flex;
      align-items: center;
      padding: 0 16px;
      background-color: #3f51b5;
      color: white;
      font-weight: 500;
    }
    
    .spacer {
      flex: 1;
    }
    
    .panel-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    
    .tab-container {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    
    .tab-header {
      display: flex;
      border-bottom: 1px solid #e0e0e0;
    }
    
    .tab-header button {
      flex: 1;
      padding: 12px;
      background: none;
      border: none;
      cursor: pointer;
      font-size: 14px;
      color: #757575;
      transition: all 0.2s;
    }
    
    .tab-header button.active {
      color: #3f51b5;
      border-bottom: 2px solid #3f51b5;
      font-weight: 500;
    }
    
    .tab-content {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
    }
    
    .quick-filter {
      margin-bottom: 16px;
    }
    
    .quick-filter span {
      display: block;
      font-size: 12px;
      margin-bottom: 8px;
      color: #757575;
    }
    
    .type-toggle-group {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }
    
    .type-toggle-group button {
      padding: 6px 12px;
      font-size: 12px;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      background: white;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .type-toggle-group button.selected {
      background: #e3f2fd;
      border-color: #2196f3;
      color: #2196f3;
    }
    
    .elements-list {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    
    .element-item {
      padding: 8px 12px;
      border-left: 3px solid transparent;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .element-item:hover {
      background-color: #f5f5f5;
    }
    
    .element-item.selected {
      border-left-color: #3f51b5;
      background-color: rgba(63, 81, 181, 0.08);
    }
    
    .element-id {
      font-weight: 500;
      font-size: 14px;
    }
    
    .element-type {
      font-size: 12px;
      color: #757575;
      margin-top: 2px;
    }
    
    .element-name {
      font-size: 13px;
      margin-top: 2px;
    }
    
    .pagination {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 16px;
      border-top: 1px solid #f0f0f0;
      margin-top: 16px;
    }
    
    .pagination button {
      padding: 6px 12px;
      background: #f5f5f5;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      cursor: pointer;
    }
    
    .pagination button:disabled {
      opacity: 0.5;
      cursor: default;
    }
    
    .search-container {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    
    .search-input {
      position: relative;
      display: flex;
      align-items: center;
    }
    
    .search-input input {
      width: 100%;
      padding: 10px 16px;
      padding-right: 40px;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      font-size: 14px;
    }
    
    .search-icon, .clear-button {
      position: absolute;
      right: 12px;
    }
    
    .clear-button {
      border: none;
      background: none;
      cursor: pointer;
      color: #757575;
    }
    
    .search-spinner {
      width: 20px;
      height: 20px;
      border: 2px solid rgba(63, 81, 181, 0.3);
      border-top-color: #3f51b5;
      border-radius: 50%;
      position: absolute;
      right: 12px;
      animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    
    .no-elements, .no-results, .search-hint {
      text-align: center;
      color: #757575;
      font-style: italic;
      padding: 20px 0;
    }
    
    .filters-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    
    .form-group label {
      font-size: 12px;
      font-weight: 500;
      color: #757575;
    }
    
    .form-group select {
      padding: 10px;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
    }
    
    .form-actions {
      display: flex;
      gap: 8px;
      margin-top: 16px;
    }
    
    .primary-button {
      padding: 8px 16px;
      background: #3f51b5;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    
    .secondary-button {
      padding: 8px 16px;
      background: white;
      color: #3f51b5;
      border: 1px solid #3f51b5;
      border-radius: 4px;
      cursor: pointer;
    }
  `],
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule,
    DragDropModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatDividerModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatSnackBarModule,
    MatButtonToggleModule,
    MatChipsModule,
    MatBadgeModule,
    MatSlideToggleModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatPaginatorModule
  ],
  encapsulation: ViewEncapsulation.None,
  animations: [
    trigger('expandCollapse', [
      state('expanded', style({
        width: '350px',
        opacity: 1
      })),
      state('collapsed', style({
        width: '0px',
        opacity: 0.9
      })),
      transition('expanded <=> collapsed', animate('300ms ease-in-out'))
    ]),
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms', style({ opacity: 1 }))
      ])
    ])
  ]
})
export class ElementsPanelComponent extends ElementsPanelBaseComponent implements OnInit {
  /**
   * Propiedad específica del panel de elementos del mapa
   * Indica si el panel debe actualizarse automáticamente cuando
   * se mueve el mapa
   */
  autoUpdateOnMapMove = true;
  
  /**
   * Controla si el panel se puede arrastrar
   */
  isDraggable = false;
  
  /**
   * Posición almacenada del panel para recordarla entre sesiones
   */
  panelPosition: {x: number, y: number} | null = null;
  
  constructor(
    elementManager: MapElementManagerService,
    mapStateManager: MapStateManagerService,
    logger: LoggerService,
    fb: FormBuilder,
    private snackBar: MatSnackBar,
    private interactionService: MapInteractionService
  ) {
    super(elementManager, mapStateManager, logger, fb);
    
    // Por defecto, el panel está posicionado a la derecha en el mapa
    this.position = 'right';
    
    // Intentar recuperar posición guardada
    this.loadSavedPosition();
  }
  
  /**
   * Toggle para habilitar/deshabilitar el arrastre del panel
   */
  toggleDraggable(): void {
    this.isDraggable = !this.isDraggable;
    this.showMessage(this.isDraggable ? 'Panel desbloqueado' : 'Panel bloqueado');
  }
  
  /**
   * Guarda la posición actual del panel cuando se suelta
   */
  onPanelDragEnded(event: {source: any, distance: {x: number, y: number}}): void {
    if (this.isDraggable) {
      // Actualizar la posición guardada
      const element = event.source.element.nativeElement;
      const rect = element.getBoundingClientRect();
      
      this.panelPosition = {
        x: rect.left,
        y: rect.top
      };
      
      // Guardar en localStorage para persistencia
      this.saveCurrentPosition();
    }
  }
  
  /**
   * Guarda la posición en el almacenamiento local
   */
  private saveCurrentPosition(): void {
    if (this.panelPosition) {
      try {
        localStorage.setItem('elements-panel-position', JSON.stringify(this.panelPosition));
      } catch (e) {
        this.logger.warn('No se pudo guardar la posición del panel', e);
      }
    }
  }
  
  /**
   * Carga la posición guardada desde el almacenamiento local
   */
  private loadSavedPosition(): void {
    try {
      const savedPosition = localStorage.getItem('elements-panel-position');
      if (savedPosition) {
        this.panelPosition = JSON.parse(savedPosition);
      }
    } catch (e) {
      this.logger.warn('No se pudo cargar la posición guardada del panel', e);
    }
  }
  
  /**
   * Override: Carga elementos iniciales filtrados por la vista actual del mapa
   */
  override ngOnInit(): void {
    super.ngOnInit();
    
    // Acceso seguro a mapStateManager como ExtendedMapStateManager
    const extendedMapManager = this.mapStateManager as ExtendedMapStateManager;
    
    // Suscribirse a cambios de posición del mapa si existe la propiedad mapMoved
    if (this.autoUpdateOnMapMove && extendedMapManager.mapMoved) {
      extendedMapManager.mapMoved
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.logger.info('Map moved, re-applying filters to load elements from server.');
          this.applyFilters(); 
        });
    }
  }
  
  /**
   * Carga elementos dentro de los límites actuales del mapa - AHORA LLAMA A APPLYFILTERS
   */
  loadElementsInMapBounds(): void {
    // Ya no carga desde elementManager localmente para los bounds directamente,
    // sino que re-aplica los filtros actuales que cargarán desde el servidor.
    // La lógica de bounds necesitaría pasarse como QueryParams al backend si se implementa.
    this.logger.info('loadElementsInMapBounds called, re-applying filters.');
    this.applyFilters(); 
    // try {
    //   const extendedMapManager = this.mapStateManager as ExtendedMapStateManager;
    //   const mapBounds = extendedMapManager.getMapBounds?.();
      
    //   if (mapBounds) {
    //     // Acceder de forma segura a los métodos del elementManager
    //     const elementsInBounds = this.elementManager.hasOwnProperty('getElementsInBounds') 
    //       ? (this.elementManager as any).getElementsInBounds(mapBounds)
    //       : this.elements;
        
    //     if (Array.isArray(elementsInBounds)) {
    //       this.elements = elementsInBounds as ExtendedNetworkElement[];
    //       this.detectCustomAttributes();
    //       this.applyFilters();
    //     }
    //   }
    // } catch (error) {
    //   this.handleError('Error al cargar elementos en la vista del mapa', error);
    // }
  }
  
  /**
   * Muestra un mensaje informativo usando snackbar
   */
  private showMessage(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 5000,
      panelClass: ['info-snackbar']
    });
  }
  
  /**
   * Selecciona un elemento y centra el mapa en él
   */
  override selectElement(element: NetworkElement): void {
    super.selectElement(element);
    
    // Notificar al servicio de interacción sobre la selección
    this.interactionService.selectElement(element);
    
    // Eliminar el centrado directo. MapViewComponent debería reaccionar a la selección 
    // (suscrito a interactionService.selectedElement$) y centrar si es necesario.
    /*
    try {
      const extendedMapManager = this.mapStateManager as ExtendedMapStateManager;
      
      if ((element as any).geometry && extendedMapManager.centerMapOnElement) {
        extendedMapManager.centerMapOnElement(element.id || '');
      }
    } catch (error) {
      this.logger.warn('No se pudo centrar el mapa en el elemento', error);
    }
    */
  }
  
  /**
   * Alterna la actualización automática
   */
  toggleAutoUpdate(): void {
    this.autoUpdateOnMapMove = !this.autoUpdateOnMapMove;
    
    // Si se acaba de activar, actualizar inmediatamente
    if (this.autoUpdateOnMapMove) {
      this.loadElementsInMapBounds();
    }
  }
  
  /**
   * Sobreescribimos el método handleError para mostrar mensajes visuales
   */
  protected override handleError(message: string, error: any): void {
    super.handleError(message, error);
    this.showMessage(`${message}: ${error?.message || 'Error desconocido'}`);
  }
  
  /**
   * Refresca manualmente la lista de elementos
   */
  refreshElements(): void {
    // if (this.autoUpdateOnMapMove) {
    //   this.loadElementsInMapBounds(); // Esto ahora llama a applyFilters
    // } else {
    //   // this.loadElements(); // loadElements() de la base fue eliminado, usar applyFilters
    // }
    this.logger.info('Refreshing elements by calling applyFilters().');
    this.applyFilters(); // Llama a applyFilters para recargar desde el servidor
    
    this.showMessage('Panel de elementos actualizado');
  }
  
  /**
   * Implementación para compatibilidad con la plantilla compartida
   */
  applyAdvancedFilters(): void {
    // En esta versión simplemente aplicamos los filtros estándar
    this.applyFilters();
    
    this.activeTab = 'elements';
    this.showMessage('Filtros aplicados al panel de mapa');
  }
  
  /**
   * Implementación para compatibilidad con la plantilla compartida
   */
  resetAdvancedFilters(): void {
    this.elementTypeFilter = null;
    this.applyFilters();
    
    this.showMessage('Filtros restablecidos');
  }

  /**
   * Implementación para compatibilidad con la plantilla compartida
   */
  saveFilterSet(): void {
    this.showMessage('Esta función no está disponible en el panel de mapa');
  }
  
  /**
   * Implementación para compatibilidad con la plantilla compartida
   */
  loadFilterSet(event: any): void {
    this.showMessage('Esta función no está disponible en el panel de mapa');
  }
  
  /**
   * Implementación para compatibilidad con la plantilla compartida
   */
  removeActiveFilter(key: string): void {
    // No implementado en esta versión
  }
} 
