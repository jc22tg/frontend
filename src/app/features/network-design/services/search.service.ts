import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { NetworkElement, ElementType, ElementStatus, /* FiberConnection, */ NetworkConnection, ConnectionStatus } from '../../../shared/types/network.types';
import { FiberConnection } from '../../../shared/models/fiber-connection.model';
import { LoggerService } from '../../../core/services/logger.service';

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

export interface ConnectionSearchFilters {
  type?: ElementType;
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
  status?: ConnectionStatus;
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
        return (element.name?.toLowerCase().includes(search) ?? false) ||
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
  searchConnections(connections: NetworkConnection[], filters: ConnectionSearchFilters): NetworkConnection[] {
    return connections.filter(connection => {
      if (filters.status && connection.status !== filters.status) return false;
      if (filters.search) {
        const search = filters.search.toLowerCase();
        return (connection.id?.toLowerCase().includes(search) ?? false) ||
               (connection.sourceElementId?.toLowerCase().includes(search) ?? false) ||
               (connection.targetElementId?.toLowerCase().includes(search) ?? false) ||
               (connection.name?.toLowerCase().includes(search) ?? false) ||
               (connection.description?.toLowerCase().includes(search) ?? false);
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
      if (!element.lastMaintenanceDate && !element.nextMaintenanceDate) return false;
      
      const elementDate = element.lastMaintenanceDate || element.nextMaintenanceDate || new Date();
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

  /**
   * Filtra conexiones según los criterios proporcionados
   */
  filterConnections(connections: NetworkConnection[], filters: any = {}): NetworkConnection[] {
    return connections.filter(connection => {
      // Filtrar por tipo de conexión
      if (filters.type && connection.type !== filters.type) return false;
      
      // Filtrar por estado de conexión
      if (filters.status && connection.status !== filters.status) {
        if (typeof filters.status === 'string' && 
            typeof connection.status === 'string' &&
            filters.status.toLowerCase() === connection.status.toLowerCase()) {
          // Permitir si los valores de texto coinciden
        } else {
          return false;
        }
      }
      
      // Filtrar por texto de búsqueda (restaurado a una lógica más simple)
      if (filters.search) {
        const search = filters.search.toLowerCase();
        return (connection.id?.toLowerCase().includes(search) ?? false) ||
               (connection.name?.toLowerCase().includes(search) ?? false) || 
               (connection.sourceElementId?.toLowerCase().includes(search) ?? false) ||
               (connection.targetElementId?.toLowerCase().includes(search) ?? false) ||
               (connection.description?.toLowerCase().includes(search) ?? false);
      }
      
      return true;
    });
  }
} 
