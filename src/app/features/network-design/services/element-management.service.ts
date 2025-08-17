/**
 * Servicio para la gestión de elementos de red en la interfaz de usuario
 */
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { NetworkElement, ElementType, ElementStatus } from '../../../shared/types/network.types';
import {
  OLT,
  ONT,
  ODF,
  Splitter,
  TerminalBox,
  SlackFiber,
  FiberThread,
  Rack
} from '../interfaces/element.interface';
import { EDFA } from '../../../shared/models/edfa.model';
import { Manga as SharedManga } from '../../../shared/models/manga.model';

@Injectable({
  providedIn: 'root'
})
export class ElementManagementService {
  private elementsSubject = new BehaviorSubject<NetworkElement[]>([]);
  private selectedElementSubject = new BehaviorSubject<NetworkElement | null>(null);

  // Estado de la selección múltiple
  private multipleSelectionSubject = new BehaviorSubject<NetworkElement[]>([]);
  public multipleSelection$ = this.multipleSelectionSubject.asObservable();

  // Estado de filtros activos
  private activeFiltersSubject = new BehaviorSubject<Record<string, any>>({});
  public activeFilters$ = this.activeFiltersSubject.asObservable();

  constructor() {
    this.initializeElements();
  }

  private initializeElements(): void {
    // Inicializar elementos
    // TODO: Cargar elementos desde backend
  }

  // Métodos para obtener elementos
  getElements(): Observable<NetworkElement[]> {
    return this.elementsSubject.asObservable();
  }

  getElementById(id: string): Observable<NetworkElement | null> {
    return this.elementsSubject.pipe(
      map(elements => elements.find(element => element.id === id) || null)
    );
  }

  getElementsByType(type: ElementType): Observable<NetworkElement[]> {
    return this.elementsSubject.pipe(
      map(elements => elements.filter(element => element.type === type))
    );
  }

  getElementsByStatus(status: ElementStatus): Observable<NetworkElement[]> {
    return this.elementsSubject.pipe(
      map(elements => elements.filter(element => element.status === status))
    );
  }

  // Métodos para gestión de elementos
  addElement(element: NetworkElement): void {
    const currentElements = this.elementsSubject.value;
    this.elementsSubject.next([...currentElements, element]);
  }

  updateElement(element: NetworkElement): void {
    const currentElements = this.elementsSubject.value;
    const index = currentElements.findIndex(e => e.id === element.id);
    if (index !== -1) {
      currentElements[index] = element;
      this.elementsSubject.next([...currentElements]);
    }
  }

  deleteElement(elementId: string): void {
    const currentElements = this.elementsSubject.value;
    this.elementsSubject.next(currentElements.filter(e => e.id !== elementId));
  }

  // Métodos para selección de elementos
  getSelectedElement(): Observable<NetworkElement | null> {
    return this.selectedElementSubject.asObservable();
  }

  selectElement(element: NetworkElement | null): void {
    this.selectedElementSubject.next(element);
  }

  // Métodos para filtrado y búsqueda
  searchElements(query: string): Observable<NetworkElement[]> {
    return this.elementsSubject.pipe(
      map(elements => elements.filter(element => 
        element.name.toLowerCase().includes(query.toLowerCase()) ||
        (element.id ? element.id.toLowerCase().includes(query.toLowerCase()) : false)
      ))
    );
  }

  filterElements(filters: {
    type?: ElementType;
    status?: ElementStatus;
    search?: string;
  }): Observable<NetworkElement[]> {
    return this.elementsSubject.pipe(
      map(elements => elements.filter(element => {
        if (filters.type && element.type !== filters.type) return false;
        if (filters.status && element.status !== filters.status) return false;
        if (filters.search) {
          const search = filters.search.toLowerCase();
          return element.name.toLowerCase().includes(search) ||
                 (element.id ? element.id.toLowerCase().includes(search) : false);
        }
        return true;
      }))
    );
  }

  // Métodos para exportación
  exportElements(): void {
    // TODO: Implementar exportación de elementos
  }

  // Métodos para limpieza
  clearElements(): void {
    this.elementsSubject.next([]);
  }

  clearSelection(): void {
    this.selectedElementSubject.next(null);
  }

  /**
   * Establece la selección múltiple de elementos
   * @param elements Elementos de red seleccionados
   */
  setMultipleSelection(elements: NetworkElement[]): void {
    this.multipleSelectionSubject.next([...elements]);
  }

  /**
   * Agrega un elemento a la selección múltiple
   * @param element Elemento de red a agregar a la selección
   */
  addToMultipleSelection(element: NetworkElement): void {
    const currentSelection = this.multipleSelectionSubject.value;
    if (!currentSelection.some(item => item.id === element.id)) {
      this.multipleSelectionSubject.next([...currentSelection, element]);
    }
  }

  /**
   * Elimina un elemento de la selección múltiple
   * @param elementId ID del elemento a eliminar de la selección
   */
  removeFromMultipleSelection(elementId: string): void {
    const currentSelection = this.multipleSelectionSubject.value;
    this.multipleSelectionSubject.next(
      currentSelection.filter(item => item.id !== elementId)
    );
  }

  /**
   * Limpia la selección múltiple
   */
  clearMultipleSelection(): void {
    this.multipleSelectionSubject.next([]);
  }

  /**
   * Establece los filtros activos para los elementos
   * @param filters Objeto con los filtros a aplicar
   */
  setFilters(filters: Record<string, any>): void {
    this.activeFiltersSubject.next(filters);
  }

  /**
   * Obtiene el valor actual de los filtros
   */
  getFilters(): Record<string, any> {
    return this.activeFiltersSubject.value;
  }

  /**
   * Limpia todos los filtros activos
   */
  clearFilters(): void {
    this.activeFiltersSubject.next({});
  }

  /**
   * Obtiene un observable con los elementos en selección múltiple
   */
  getMultipleSelection(): Observable<NetworkElement[]> {
    return this.multipleSelection$;
  }

  /**
   * Obtiene un observable con los filtros activos
   */
  getActiveFilters(): Observable<Record<string, any>> {
    return this.activeFilters$;
  }

  // Type guards para tipos concretos
  isOLT(element: any): element is OLT {
    return element && element.type === 'OLT';
  }
  isONT(element: any): element is ONT {
    return element && element.type === 'ONT';
  }
  isODF(element: any): element is ODF {
    return element && element.type === 'ODF';
  }
  isEDFA(element: any): element is EDFA {
    return element && element.type === 'EDFA';
  }
  isSplitter(element: any): element is Splitter {
    return element && element.type === 'SPLITTER';
  }
  isManga(element: any): element is SharedManga {
    return element && element.type === 'MANGA';
  }
  isTerminalBox(element: any): element is TerminalBox {
    return element && element.type === 'TERMINAL_BOX';
  }
  isSlackFiber(element: any): element is SlackFiber {
    return element && element.type === 'SLACK_FIBER';
  }
  isFiberThread(element: any): element is FiberThread {
    return element && element.type === 'FIBER_THREAD';
  }
  isRack(element: any): element is Rack {
    return element && element.type === 'RACK';
  }

  /**
   * Obtiene todos los elementos que pertenecen a un rack específico
   */
  getElementsByRackId(rackId: string) {
    return this.getElements().pipe(
      map(elements => elements.filter(e => 'rackId' in e && e.rackId === rackId))
    );
  }
} 
