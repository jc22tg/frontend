import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { NetworkElement, ElementType, ElementStatus, FiberConnection } from '../../../shared/types/network.types';

export interface SearchFilters {
  type?: ElementType;
  status?: ElementStatus;
  search?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  location?: {
    lat: number;
    lng: number;
    radius: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  private searchHistorySubject = new BehaviorSubject<string[]>([]);
  private savedFiltersSubject = new BehaviorSubject<SearchFilters[]>([]);
  private currentFiltersSubject = new BehaviorSubject<SearchFilters>({});

  constructor() {
    this.loadSearchHistory();
    this.loadSavedFilters();
  }

  private loadSearchHistory(): void {
    // TODO: Cargar historial de búsquedas desde localStorage
  }

  private loadSavedFilters(): void {
    // TODO: Cargar filtros guardados desde localStorage
  }

  // Métodos para búsqueda de elementos
  searchElements(elements: NetworkElement[], filters: SearchFilters): NetworkElement[] {
    return elements.filter(element => {
      if (filters.type && element.type !== filters.type) return false;
      if (filters.status && element.status !== filters.status) return false;
      if (filters.search) {
        const search = filters.search.toLowerCase();
        return element.name.toLowerCase().includes(search) ||
               (element.id ? element.id.toLowerCase().includes(search) : false) ||
               (element.description ? element.description.toLowerCase().includes(search) : false);
      }
      if (filters.location) {
        // TODO: Implementar búsqueda por ubicación
      }
      return true;
    });
  }

  // Métodos para búsqueda de conexiones
  searchConnections(connections: FiberConnection[], filters: SearchFilters): FiberConnection[] {
    return connections.filter(connection => {
      if (filters.status && connection.status !== filters.status) return false;
      if (filters.search) {
        const search = filters.search.toLowerCase();
        return connection.id.toString().includes(search) ||
               connection.sourceId.toString().includes(search) ||
               connection.targetId.toString().includes(search);
      }
      return true;
    });
  }

  // Métodos para gestión de historial
  addToSearchHistory(query: string): void {
    const currentHistory = this.searchHistorySubject.value;
    const newHistory = [query, ...currentHistory.filter(q => q !== query)].slice(0, 10);
    this.searchHistorySubject.next(newHistory);
    this.saveSearchHistory();
  }

  getSearchHistory(): Observable<string[]> {
    return this.searchHistorySubject.asObservable();
  }

  clearSearchHistory(): void {
    this.searchHistorySubject.next([]);
    this.saveSearchHistory();
  }

  private saveSearchHistory(): void {
    // TODO: Guardar historial en localStorage
  }

  // Métodos para gestión de filtros
  saveFilter(filter: SearchFilters): void {
    const currentFilters = this.savedFiltersSubject.value;
    this.savedFiltersSubject.next([...currentFilters, filter]);
    this.saveFilters();
  }

  getSavedFilters(): Observable<SearchFilters[]> {
    return this.savedFiltersSubject.asObservable();
  }

  deleteSavedFilter(index: number): void {
    const currentFilters = this.savedFiltersSubject.value;
    currentFilters.splice(index, 1);
    this.savedFiltersSubject.next([...currentFilters]);
    this.saveFilters();
  }

  private saveFilters(): void {
    // TODO: Guardar filtros en localStorage
  }

  // Métodos para gestión de filtros actuales
  setCurrentFilters(filters: SearchFilters): void {
    this.currentFiltersSubject.next(filters);
  }

  getCurrentFilters(): Observable<SearchFilters> {
    return this.currentFiltersSubject.asObservable();
  }

  clearCurrentFilters(): void {
    this.currentFiltersSubject.next({});
  }

  // Métodos para búsqueda avanzada
  searchByDateRange(elements: NetworkElement[], startDate: Date, endDate: Date): NetworkElement[] {
    return elements.filter(element => {
      // Si no hay fechas de mantenimiento, se excluye
      if (!element.lastMaintenance && !element.nextMaintenance) return false;
      
      const elementDate = element.lastMaintenance || element.nextMaintenance || new Date();
      return elementDate >= startDate && elementDate <= endDate;
    });
  }

  searchByLocation(elements: NetworkElement[], lat: number, lng: number, radius: number): NetworkElement[] {
    return elements.filter(element => {
      // TODO: Implementar búsqueda por distancia
      return true;
    });
  }

  // Métodos para exportación
  exportSearchResults(results: any[]): void {
    // TODO: Implementar exportación de resultados
  }

  // Métodos para limpieza
  clearAll(): void {
    this.clearSearchHistory();
    this.clearCurrentFilters();
    this.savedFiltersSubject.next([]);
  }
} 