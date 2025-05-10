import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { NetworkElement, ElementType, ElementStatus } from '../../../shared/types/network.types';

@Injectable({
  providedIn: 'root'
})
export class ElementRepository {
  private elements: NetworkElement[] = [];

  constructor() {
    this.initializeElements();
  }

  private initializeElements(): void {
    // TODO: Cargar elementos desde backend
  }

  // Métodos CRUD
  getAll(): Observable<NetworkElement[]> {
    return of(this.elements);
  }

  getById(id: string): Observable<NetworkElement | null> {
    const element = this.elements.find(e => e.id === id);
    return of(element || null);
  }

  getByType(type: ElementType): Observable<NetworkElement[]> {
    return of(this.elements.filter(e => e.type === type));
  }

  getByStatus(status: ElementStatus): Observable<NetworkElement[]> {
    return of(this.elements.filter(e => e.status === status));
  }

  create(element: NetworkElement): Observable<NetworkElement> {
    this.elements.push(element);
    return of(element);
  }

  update(element: NetworkElement): Observable<NetworkElement> {
    const index = this.elements.findIndex(e => e.id === element.id);
    if (index !== -1) {
      this.elements[index] = element;
    }
    return of(element);
  }

  delete(id: string): Observable<void> {
    this.elements = this.elements.filter(e => e.id !== id);
    return of(void 0);
  }

  // Métodos de búsqueda
  search(query: string): Observable<NetworkElement[]> {
    const searchTerm = query.toLowerCase();
    return of(this.elements.filter(element => 
      element.name.toLowerCase().includes(searchTerm) ||
      (element.id ? element.id.toLowerCase().includes(searchTerm) : false) ||
      (element.description ? element.description.toLowerCase().includes(searchTerm) : false)
    ));
  }

  // Métodos de filtrado
  filter(filters: {
    type?: ElementType;
    status?: ElementStatus;
    search?: string;
  }): Observable<NetworkElement[]> {
    let filtered = this.elements;

    if (filters.type) {
      filtered = filtered.filter(e => e.type === filters.type);
    }

    if (filters.status) {
      filtered = filtered.filter(e => e.status === filters.status);
    }

    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(e => 
        e.name.toLowerCase().includes(search) ||
        (e.id ? e.id.toLowerCase().includes(search) : false) ||
        (e.description ? e.description.toLowerCase().includes(search) : false)
      );
    }

    return of(filtered);
  }

  // Métodos de validación
  validate(element: NetworkElement): boolean {
    // TODO: Implementar validaciones específicas
    return true;
  }

  // Métodos de exportación
  export(): Observable<string> {
    // TODO: Implementar exportación
    return of('');
  }

  // Métodos de limpieza
  clear(): void {
    this.elements = [];
  }
} 