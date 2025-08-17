import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { NetworkElement, ElementType, ElementStatus, NetworkConnection } from '../../../shared/types/network.types';
import { ElementRepository } from '../repositories/element.repository';
import { SearchService, SearchFilters } from '../services/search.service';
import { MetricsService } from '../services/metrics.service';
import { ConnectionService } from '../services/connection.service';

@Injectable({
  providedIn: 'root'
})
export class NetworkFacade {
  private selectedElementSubject = new BehaviorSubject<NetworkElement | null>(null);
  private selectedConnectionSubject = new BehaviorSubject<NetworkConnection | null>(null);

  constructor(
    private elementRepository: ElementRepository,
    private searchService: SearchService,
    private metricsService: MetricsService,
    private connectionService: ConnectionService
  ) {}

  // Métodos para elementos
  getElements(): Observable<NetworkElement[]> {
    return this.elementRepository.getAll();
  }

  getElementById(id: string): Observable<NetworkElement | null> {
    return this.elementRepository.getById(id);
  }

  createElement(element: NetworkElement): Observable<NetworkElement> {
    if (this.elementRepository.validate(element)) {
      return this.elementRepository.create(element);
    }
    throw new Error('Elemento inválido');
  }

  updateElement(element: NetworkElement): Observable<NetworkElement> {
    if (this.elementRepository.validate(element)) {
      return this.elementRepository.update(element);
    }
    throw new Error('Elemento inválido');
  }

  deleteElement(id: string): Observable<void> {
    return this.elementRepository.delete(id);
  }

  // Métodos para búsqueda
  searchElements(filters: SearchFilters): Observable<NetworkElement[]> {
    return this.elementRepository.getAll().pipe(
      map(elements => this.searchService.searchElements(elements, filters))
    );
  }

  // Métodos para métricas
  getElementMetrics(elementId: string): Observable<any> {
    return this.metricsService.getMetrics(elementId);
  }

  updateElementMetrics(elementId: string, metrics: any): void {
    this.metricsService.updateMetrics(elementId, metrics);
  }

  // Métodos para conexiones
  getConnections(): Observable<NetworkConnection[]> {
    return this.connectionService.getConnections();
  }

  getConnectionsByElement(elementId: string): Observable<NetworkConnection[]> {
    return this.connectionService.getConnectionsByElementId(elementId);
  }

  createConnection(connection: NetworkConnection): void {
    if (this.connectionService.validateConnection(connection)) {
      this.connectionService.addConnection(connection);
    }
  }

  updateConnection(connection: NetworkConnection): void {
    if (this.connectionService.validateConnection(connection)) {
      this.connectionService.updateConnection(connection);
    }
  }

  deleteConnection(connectionId: string): void {
    this.connectionService.deleteConnection(connectionId);
  }

  // Métodos para selección
  getSelectedElement(): Observable<NetworkElement | null> {
    return this.selectedElementSubject.asObservable();
  }

  selectElement(element: NetworkElement | null): void {
    this.selectedElementSubject.next(element);
  }

  getSelectedConnection(): Observable<NetworkConnection | null> {
    return this.selectedConnectionSubject.asObservable();
  }

  selectConnection(connection: NetworkConnection | null): void {
    this.selectedConnectionSubject.next(connection);
  }

  // Métodos para exportación
  exportElements(): Observable<string> {
    return this.elementRepository.export();
  }

  exportMetrics(elementId: string): void {
    this.metricsService.exportMetrics(elementId);
  }

  exportConnections(): void {
    this.connectionService.exportConnections();
  }

  // Métodos para limpieza
  clearAll(): void {
    this.elementRepository.clear();
    this.searchService.clearAll();
    this.metricsService.clearAllMetrics();
    this.connectionService.clearConnections();
    this.selectedElementSubject.next(null);
    this.selectedConnectionSubject.next(null);
  }
} 
