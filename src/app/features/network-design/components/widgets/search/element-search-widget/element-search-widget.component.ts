import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { WidgetBaseComponent } from '../../base/widget-base.component';
import { MapStateService } from '../../../../services/map/state/map-state.service';
import { LoggerService } from '../../../../../../core/services/logger.service';
import { NetworkElement, ElementType, ElementStatus } from '../../../../../../shared/types/network.types';
import { createGeographicPosition } from '../../../../../../shared/types/geo-position';

/**
 * Widget para búsqueda de elementos en el mapa
 * 
 * Este widget permite buscar elementos en el mapa por diferentes criterios
 * como nombre, tipo, estado, etc. y muestra los resultados de forma paginada.
 */
@Component({
  selector: 'app-element-search-widget',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <app-widget-base
      [title]="'Búsqueda de Elementos'"
      [darkMode]="darkMode"
      [position]="position"
      (positionChange)="handlePositionChange($event)"
      (closeRequest)="handleCloseRequest()">
      
      <div class="search-container">
        <div class="search-header">
          <div class="search-input-container">
            <input 
              type="text" 
              class="search-input"
              [(ngModel)]="searchQuery"
              placeholder="Buscar elementos..."
              (input)="onSearchInput()">
            <button class="search-clear" *ngIf="searchQuery" (click)="clearSearch()">
              <i class="fa fa-times"></i>
            </button>
          </div>
          
          <div class="search-filters">
            <select [(ngModel)]="typeFilter" (change)="applyFilters()">
              <option value="">Todos los tipos</option>
              <option *ngFor="let type of availableTypes" [value]="type">{{ type }}</option>
            </select>
            
            <select [(ngModel)]="statusFilter" (change)="applyFilters()">
              <option value="">Todos los estados</option>
              <option *ngFor="let status of availableStatuses" [value]="status">{{ status }}</option>
            </select>
          </div>
        </div>
        
        <div class="search-results" *ngIf="filteredElements.length > 0; else noResults">
          <div class="results-header">
            <span>{{ filteredElements.length }} elementos encontrados</span>
            <div class="sort-options">
              <span>Ordenar por:</span>
              <select [(ngModel)]="sortBy" (change)="sortResults()">
                <option value="name">Nombre</option>
                <option value="type">Tipo</option>
                <option value="status">Estado</option>
              </select>
              <button class="sort-direction" (click)="toggleSortDirection()">
                <i class="fa" [ngClass]="sortDirection === 'asc' ? 'fa-arrow-up' : 'fa-arrow-down'"></i>
              </button>
            </div>
          </div>
          
          <div class="results-list">
            <div *ngFor="let element of paginatedElements" 
                 class="element-item"
                 [class.selected]="isElementSelected(element.id)"
                 (click)="selectElement(element)">
              <div class="element-icon" [ngClass]="element.type?.toLowerCase()">
                <i [class]="getIconClass(element.type)"></i>
              </div>
              <div class="element-details">
                <div class="element-name">{{ element.name }}</div>
                <div class="element-meta">
                  <span class="element-type">{{ element.type }}</span>
                  <span class="element-status" [ngClass]="element.status?.toLowerCase()">
                    {{ element.status }}
                  </span>
                </div>
              </div>
              <div class="element-actions">
                <button class="action-button" (click)="centerOnElement(element); $event.stopPropagation()">
                  <i class="fa fa-crosshairs"></i>
                </button>
              </div>
            </div>
          </div>
          
          <div class="pagination" *ngIf="totalPages > 1">
            <button class="page-button" (click)="prevPage()" [disabled]="currentPage === 1">
              <i class="fa fa-chevron-left"></i>
            </button>
            <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
            <button class="page-button" (click)="nextPage()" [disabled]="currentPage === totalPages">
              <i class="fa fa-chevron-right"></i>
            </button>
          </div>
        </div>
        
        <ng-template #noResults>
          <div class="no-results" *ngIf="hasSearched">
            <i class="fa fa-search"></i>
            <p>No se encontraron elementos que coincidan con la búsqueda.</p>
          </div>
          <div class="no-results" *ngIf="!hasSearched">
            <i class="fa fa-info-circle"></i>
            <p>Ingrese un término de búsqueda para encontrar elementos.</p>
          </div>
        </ng-template>
      </div>
    </app-widget-base>
  `,
  styles: [`
    .search-container {
      width: 320px;
      max-width: 100%;
    }
    
    .search-header {
      margin-bottom: 12px;
    }
    
    .search-input-container {
      position: relative;
      margin-bottom: 8px;
    }
    
    .search-input {
      width: 100%;
      padding: 8px 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
    }
    
    :host-context(.dark-mode) .search-input {
      background-color: #333;
      border-color: #555;
      color: #fff;
    }
    
    .search-clear {
      position: absolute;
      right: 8px;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      color: #999;
      cursor: pointer;
      padding: 0;
      font-size: 14px;
    }
    
    .search-filters {
      display: flex;
      gap: 8px;
    }
    
    .search-filters select {
      flex: 1;
      padding: 4px 6px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 12px;
    }
    
    :host-context(.dark-mode) .search-filters select {
      background-color: #333;
      border-color: #555;
      color: #fff;
    }
    
    .results-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      font-size: 12px;
      color: #666;
    }
    
    :host-context(.dark-mode) .results-header {
      color: #aaa;
    }
    
    .sort-options {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    
    .sort-options select {
      padding: 2px 4px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 12px;
    }
    
    :host-context(.dark-mode) .sort-options select {
      background-color: #333;
      border-color: #555;
      color: #fff;
    }
    
    .sort-direction {
      background: none;
      border: none;
      cursor: pointer;
      padding: 2px 4px;
      font-size: 12px;
    }
    
    .results-list {
      max-height: 300px;
      overflow-y: auto;
      margin-bottom: 8px;
      border: 1px solid #eee;
      border-radius: 4px;
    }
    
    :host-context(.dark-mode) .results-list {
      border-color: #444;
    }
    
    .element-item {
      display: flex;
      align-items: center;
      padding: 8px 10px;
      border-bottom: 1px solid #f0f0f0;
      cursor: pointer;
    }
    
    :host-context(.dark-mode) .element-item {
      border-bottom-color: #444;
    }
    
    .element-item:last-child {
      border-bottom: none;
    }
    
    .element-item:hover {
      background-color: #f5f5f5;
    }
    
    :host-context(.dark-mode) .element-item:hover {
      background-color: #3a3a3a;
    }
    
    .element-item.selected {
      background-color: rgba(33, 150, 243, 0.1);
    }
    
    :host-context(.dark-mode) .element-item.selected {
      background-color: rgba(33, 150, 243, 0.2);
    }
    
    .element-icon {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background-color: #eee;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 10px;
      flex-shrink: 0;
    }
    
    :host-context(.dark-mode) .element-icon {
      background-color: #444;
    }
    
    .element-icon.olt {
      background-color: rgba(76, 175, 80, 0.2);
      color: #4caf50;
    }
    
    .element-icon.fdp {
      background-color: rgba(255, 152, 0, 0.2);
      color: #ff9800;
    }
    
    .element-icon.splitter {
      background-color: rgba(156, 39, 176, 0.2);
      color: #9c27b0;
    }
    
    .element-icon.ont {
      background-color: rgba(33, 150, 243, 0.2);
      color: #2196f3;
    }
    
    .element-icon.edfa {
      background-color: rgba(244, 67, 54, 0.2);
      color: #f44336;
    }
    
    .element-icon.manga {
      background-color: rgba(121, 85, 72, 0.2);
      color: #795548;
    }
    
    .element-details {
      flex: 1;
      min-width: 0;
    }
    
    .element-name {
      font-weight: 500;
      font-size: 13px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .element-meta {
      display: flex;
      gap: 8px;
      font-size: 11px;
    }
    
    .element-type {
      color: #666;
    }
    
    :host-context(.dark-mode) .element-type {
      color: #aaa;
    }
    
    .element-status {
      padding: 1px 4px;
      border-radius: 10px;
      font-size: 10px;
    }
    
    .element-status.active {
      background-color: rgba(76, 175, 80, 0.2);
      color: #4caf50;
    }
    
    .element-status.warning {
      background-color: rgba(255, 193, 7, 0.2);
      color: #ffc107;
    }
    
    .element-status.error, .element-status.fault {
      background-color: rgba(244, 67, 54, 0.2);
      color: #f44336;
    }
    
    .element-status.inactive {
      background-color: rgba(158, 158, 158, 0.2);
      color: #9e9e9e;
    }
    
    .element-actions {
      display: flex;
      align-items: center;
    }
    
    .action-button {
      background: none;
      border: none;
      color: #666;
      cursor: pointer;
      padding: 4px;
      font-size: 12px;
      border-radius: 50%;
    }
    
    :host-context(.dark-mode) .action-button {
      color: #aaa;
    }
    
    .action-button:hover {
      background-color: rgba(0, 0, 0, 0.05);
    }
    
    :host-context(.dark-mode) .action-button:hover {
      background-color: rgba(255, 255, 255, 0.1);
    }
    
    .pagination {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 8px;
      margin-top: 8px;
    }
    
    .page-button {
      background: none;
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 2px 6px;
      cursor: pointer;
    }
    
    :host-context(.dark-mode) .page-button {
      background-color: #333;
      border-color: #555;
      color: #fff;
    }
    
    .page-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    .page-info {
      font-size: 12px;
    }
    
    .no-results {
      text-align: center;
      padding: 20px;
      color: #666;
    }
    
    :host-context(.dark-mode) .no-results {
      color: #999;
    }
    
    .no-results i {
      font-size: 24px;
      margin-bottom: 8px;
    }
    
    .no-results p {
      font-size: 13px;
    }
  `]
})
export class ElementSearchWidgetComponent implements OnInit, OnDestroy {
  // Propiedades del widget base
  darkMode = false;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center' = 'top-left';
  
  // Propiedades de búsqueda
  searchQuery = '';
  typeFilter = '';
  statusFilter = '';
  sortBy = 'name';
  sortDirection: 'asc' | 'desc' = 'asc';
  
  // Propiedades de paginación
  currentPage = 1;
  pageSize = 10;
  totalPages = 1;
  
  // Elementos
  allElements: NetworkElement[] = [];
  filteredElements: NetworkElement[] = [];
  paginatedElements: NetworkElement[] = [];
  
  // Estado de la búsqueda
  hasSearched = false;
  
  // Valores para los selectores de filtros
  availableTypes: string[] = [];
  availableStatuses: string[] = [];
  
  // Subject para cancelar suscripciones
  private destroy$ = new Subject<void>();
  
  // Subject para debounce de búsqueda
  private searchSubject = new Subject<string>();
  
  constructor(
    private mapStateService: MapStateService,
    private logger: LoggerService,
    private cdr: ChangeDetectorRef
  ) {}
  
  ngOnInit(): void {
    // Configurar debounce para búsqueda
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(value => {
      this.search(value);
    });
    
    // Suscribirse a cambios en selecciones
    this.mapStateService.selectedElementIds$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.cdr.markForCheck();
      });
    
    // Cargar datos
    this.loadData();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  /**
   * Carga los datos iniciales
   */
  private loadData(): void {
    // Aquí se cargarían los elementos del servicio
    // Por ahora simulamos con datos de ejemplo
    this.allElements = this.getSampleElements();
    
    // Extraer tipos y estados disponibles
    this.extractAvailableFilters();
    
    // Aplicar filtros iniciales
    this.applyFilters();
  }
  
  /**
   * Maneja el evento de input en la búsqueda
   */
  onSearchInput(): void {
    this.searchSubject.next(this.searchQuery);
  }
  
  /**
   * Realiza la búsqueda con el término especificado
   */
  search(query: string): void {
    this.searchQuery = query;
    this.hasSearched = true;
    this.currentPage = 1;
    this.applyFilters();
  }
  
  /**
   * Limpia la búsqueda
   */
  clearSearch(): void {
    this.searchQuery = '';
    this.hasSearched = false;
    this.applyFilters();
  }
  
  /**
   * Aplica los filtros seleccionados
   */
  applyFilters(): void {
    // Filtrar elementos
    this.filteredElements = this.allElements.filter(element => {
      // Filtrar por texto de búsqueda
      const matchesQuery = !this.searchQuery || 
        element.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        (element.id && element.id.toLowerCase().includes(this.searchQuery.toLowerCase()));
      
      // Filtrar por tipo
      const matchesType = !this.typeFilter || element.type === this.typeFilter;
      
      // Filtrar por estado
      const matchesStatus = !this.statusFilter || element.status === this.statusFilter;
      
      return matchesQuery && matchesType && matchesStatus;
    });
    
    // Ordenar resultados
    this.sortResults();
    
    // Actualizar paginación
    this.updatePagination();
  }
  
  /**
   * Ordena los resultados según criterio y dirección
   */
  sortResults(): void {
    this.filteredElements.sort((a, b) => {
      let comparison = 0;
      
      switch (this.sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'type':
          comparison = (a.type || '').localeCompare(b.type || '');
          break;
        case 'status':
          comparison = (a.status || '').localeCompare(b.status || '');
          break;
        default:
          comparison = 0;
      }
      
      return this.sortDirection === 'asc' ? comparison : -comparison;
    });
    
    // Actualizar paginación
    this.updatePagination();
  }
  
  /**
   * Cambia la dirección de ordenamiento
   */
  toggleSortDirection(): void {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    this.sortResults();
  }
  
  /**
   * Actualiza la paginación
   */
  updatePagination(): void {
    // Calcular total de páginas
    this.totalPages = Math.max(1, Math.ceil(this.filteredElements.length / this.pageSize));
    
    // Asegurarse de que la página actual es válida
    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }
    
    // Obtener elementos de la página actual
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = Math.min(startIndex + this.pageSize, this.filteredElements.length);
    
    this.paginatedElements = this.filteredElements.slice(startIndex, endIndex);
  }
  
  /**
   * Avanza a la página siguiente
   */
  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagination();
    }
  }
  
  /**
   * Retrocede a la página anterior
   */
  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
    }
  }
  
  /**
   * Extrae los valores disponibles para filtros
   */
  private extractAvailableFilters(): void {
    // Extraer tipos únicos
    const typesSet = new Set<string>();
    
    // Extraer estados únicos
    const statusesSet = new Set<string>();
    
    this.allElements.forEach(element => {
      if (element.type) typesSet.add(element.type);
      if (element.status) statusesSet.add(element.status);
    });
    
    this.availableTypes = Array.from(typesSet);
    this.availableStatuses = Array.from(statusesSet);
  }
  
  /**
   * Selecciona un elemento
   */
  selectElement(element: NetworkElement): void {
    if (!element || !element.id) return;
    
    this.mapStateService.setState({
      selectedElementIds: [element.id]
    });
  }
  
  /**
   * Centra el mapa en un elemento
   */
  centerOnElement(element: NetworkElement): void {
    if (!element || !element.position) return;
    
    // Usar correctamente la estructura de GeoPosition
    // Asegurar que sea una tupla [number, number] como espera el método
    const coordinates: [number, number] = [element.position.lng, element.position.lat];
    this.mapStateService.setCenter(coordinates);
  }
  
  /**
   * Verifica si un elemento está seleccionado
   */
  isElementSelected(elementId: string | undefined): boolean {
    if (!elementId) return false;
    
    const selectedIds = this.mapStateService.getState().selectedElementIds;
    return selectedIds.includes(elementId);
  }
  
  /**
   * Obtiene la clase de icono según el tipo de elemento
   */
  getIconClass(type?: ElementType | string): string {
    switch (type) {
      case ElementType.OLT:
        return 'fa fa-server';
      case ElementType.ONT:
        return 'fa fa-wifi';
      case ElementType.ODF: // Usar ODF como sustituto de FDP
      case 'FDP': // Para compatibilidad
        return 'fa fa-box';
      case ElementType.SPLITTER:
        return 'fa fa-sitemap';
      case ElementType.EDFA:
      case 'EDFA': // Para compatibilidad
        return 'fa fa-bolt';
      case ElementType.MANGA:
      case 'MANGA': // Para compatibilidad
        return 'fa fa-project-diagram';
      default:
        return 'fa fa-circle';
    }
  }
  
  /**
   * Maneja el cambio de posición desde el componente base
   */
  handlePositionChange(newPosition: string): void {
    this.position = newPosition as any;
  }
  
  /**
   * Maneja la solicitud de cierre desde el componente base
   */
  handleCloseRequest(): void {
    // Aquí podríamos emitir un evento para notificar al contenedor
    this.logger.debug('Solicitud de cierre de ElementSearchWidget');
  }
  
  /**
   * Obtiene elementos de ejemplo
   */
  private getSampleElements(): NetworkElement[] {
    return [
      {
        id: 'olt-1',
        name: 'OLT Principal',
        type: ElementType.OLT,
        position: createGeographicPosition(0, 0),
        status: ElementStatus.ACTIVE
      },
      {
        id: 'olt-2',
        name: 'OLT Secundaria',
        type: ElementType.OLT,
        position: createGeographicPosition(5, 5),
        status: ElementStatus.ACTIVE
      },
      {
        id: 'fdp-1',
        name: 'FDP Norte',
        type: ElementType.ODF, // Usando ODF como sustituto de FDP
        position: createGeographicPosition(10, 20),
        status: ElementStatus.ACTIVE
      },
      {
        id: 'fdp-2',
        name: 'FDP Sur',
        type: ElementType.ODF, // Usando ODF como sustituto de FDP
        position: createGeographicPosition(-10, -15),
        status: ElementStatus.MAINTENANCE
      },
      {
        id: 'fdp-3',
        name: 'FDP Este',
        type: ElementType.ODF, // Usando ODF como sustituto de FDP
        position: createGeographicPosition(15, -8),
        status: ElementStatus.INACTIVE
      },
      {
        id: 'splitter-1',
        name: 'Splitter 1',
        type: ElementType.SPLITTER,
        position: createGeographicPosition(15, 5),
        status: ElementStatus.ACTIVE
      },
      {
        id: 'splitter-2',
        name: 'Splitter 2',
        type: ElementType.SPLITTER,
        position: createGeographicPosition(-5, 18),
        status: ElementStatus.ACTIVE
      },
      {
        id: 'ont-1',
        name: 'ONT Cliente 1',
        type: ElementType.ONT,
        position: createGeographicPosition(20, 10),
        status: ElementStatus.ACTIVE
      },
      {
        id: 'ont-2',
        name: 'ONT Cliente 2',
        type: ElementType.ONT,
        position: createGeographicPosition(18, 12),
        status: ElementStatus.MAINTENANCE
      },
      {
        id: 'ont-3',
        name: 'ONT Cliente 3',
        type: ElementType.ONT,
        position: createGeographicPosition(-5, -20),
        status: ElementStatus.ERROR
      },
      {
        id: 'ont-4',
        name: 'ONT Cliente 4',
        type: ElementType.ONT,
        position: createGeographicPosition(-8, -18),
        status: ElementStatus.ACTIVE
      },
      {
        id: 'edfa-1',
        name: 'EDFA Principal',
        type: ElementType.EDFA,
        position: createGeographicPosition(2, 8),
        status: ElementStatus.ACTIVE
      },
      {
        id: 'manga-1',
        name: 'Manga A1',
        type: ElementType.MANGA,
        position: createGeographicPosition(7, -12),
        status: ElementStatus.ACTIVE
      },
      {
        id: 'manga-2',
        name: 'Manga B2',
        type: ElementType.MANGA,
        position: createGeographicPosition(-12, 7),
        status: ElementStatus.MAINTENANCE
      }
    ];
  }
} 
