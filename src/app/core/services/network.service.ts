import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  NetworkElement,
  ElementType,
  ElementStatus,
  MonitoringData,
  NetworkAlert,
  Client,
  NetworkConnection
} from '../../shared/types/network.types';
import { FiberConnection } from '../../shared/models/fiber-connection.model';
import { MOCK_CONNECTIONS } from './mock-data/connections.mock';
import { PaginatedResponse, QueryParams } from '../../shared/types/api.types';

export interface NetworkStats {
  totalElements: number;
  activeElements: number;
  totalBandwidth: number;
  averageUptime: number;
  connectedClients: number;
}

export interface SimulationData {
  deviceType: string;
  deviceId: string;
  connectionId: string;
  failureType: string;
  severity: string;
}

@Injectable({
  providedIn: 'root',
})
export class NetworkService {
  private apiUrl = `${environment.apiUrl}/network`;
  private elementsSubject = new BehaviorSubject<NetworkElement[]>([]);
  elements$ = this.elementsSubject.asObservable();

  constructor(private http: HttpClient) {}

  getNetworkElements(): Observable<NetworkElement[]> {
    console.warn("getNetworkElements() no soporta paginación y podría devolver muchos datos.")
    return this.http.get<NetworkElement[]>(`${this.apiUrl}/elements`);
  }

  getElements<T extends NetworkElement>(
    elementType: ElementType,
    params?: QueryParams
  ): Observable<PaginatedResponse<T>> {
    const elementPath = this.getElementPath(elementType);
    if (!elementPath) {
      return throwError(() => new Error(`Path no definido para el tipo de elemento: ${elementType}`));
    }

    let httpParams = new HttpParams();

    if (params) {
      if (params.page !== undefined) {
        httpParams = httpParams.set('page', params.page.toString());
      }
      if (params.pageSize !== undefined) {
        httpParams = httpParams.set('pageSize', params.pageSize.toString());
      }
      if (params.sortBy) {
        httpParams = httpParams.set('sortBy', params.sortBy);
      }
      if (params.sortDirection) {
        httpParams = httpParams.set('sortDirection', params.sortDirection);
      }
      
      if (params.filter) {
        for (const key in params.filter) {
          if (params.filter.hasOwnProperty(key) && params.filter[key] !== undefined && params.filter[key] !== null) {
            httpParams = httpParams.set(key, params.filter[key].toString());
          }
        }
      }

      for (const key in params) {
        if (params.hasOwnProperty(key) && !
        ['page', 'pageSize', 'sortBy', 'sortDirection', 'filter'].includes(key) && 
        params[key] !== undefined && params[key] !== null) {
          httpParams = httpParams.set(key, params[key].toString());
        }
      }
    }

    return this.http.get<PaginatedResponse<T>>(`${this.apiUrl}/${elementPath}`, { params: httpParams });
  }

  private getElementPath(type: ElementType): string | null {
    switch (type) {
      case ElementType.FIBER_CABLE:
        return 'fiber-cables';
      case ElementType.FIBER_SPLICE:
        return 'fiber-splices';
      case ElementType.FIBER_STRAND:
        return 'fiber-strands';
      case ElementType.FIBER_THREAD:
        return 'fiber-threads';
      default:
        console.error(`Path de API no definido en getElementPath para el tipo: ${type}`);
        return null; 
    }
  }

  getElementsByType(type: ElementType, params?: QueryParams): Observable<PaginatedResponse<NetworkElement>> {
    return this.getElements<NetworkElement>(type, params);
  }

  getElementById(id: string): Observable<NetworkElement> {
    return this.http.get<NetworkElement>(`${this.apiUrl}/elements/${id}`);
  }

  updateElementStatus(id: string, status: ElementStatus): Observable<NetworkElement> {
    return this.http.patch<NetworkElement>(`${this.apiUrl}/elements/${id}/status`, { status });
  }

  getConnections(): Observable<FiberConnection[]> {
    const headers = new HttpHeaders({
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    });
    
    return this.http.get<FiberConnection[]>(`${this.apiUrl}/connections`, { headers })
      .pipe(
        catchError(error => {
          console.error('Error obteniendo conexiones:', error);
          
          if (error?.error?.text && typeof error.error.text === 'string' && error.error.text.includes('<!DOCTYPE html>')) {
            console.warn('El servidor devolvió HTML en lugar de JSON. Usando datos mock.');
            return new Observable<FiberConnection[]>(observer => {
              observer.next(MOCK_CONNECTIONS as any as FiberConnection[]);
              observer.complete();
            });
          }
          
          if (environment.useMocks) {
            console.log('Usando datos mock para conexiones');
            return new Observable<FiberConnection[]>(observer => {
              observer.next(MOCK_CONNECTIONS as any as FiberConnection[]);
              observer.complete();
            });
          }
          
          return throwError(() => error);
        })
      );
  }

  createConnection(connection: Partial<FiberConnection>): Observable<FiberConnection> {
    return this.http.post<FiberConnection>(`${this.apiUrl}/connections`, connection);
  }

  updateConnection(id: string, connection: Partial<FiberConnection>): Observable<FiberConnection> {
    return this.http.put<FiberConnection>(`${this.apiUrl}/connections/${id}`, connection);
  }

  deleteConnection(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/connections/${id}`);
  }

  getMonitoringData(elementId: string): Observable<MonitoringData[]> {
    return this.http
      .get<MonitoringData[]>(`${this.apiUrl}/monitoring/${elementId}`)
      .pipe(catchError(this.handleError));
  }

  getAlerts(): Observable<NetworkAlert[]> {
    return this.http
      .get<NetworkAlert[]>(`${this.apiUrl}/alerts`)
      .pipe(catchError(this.handleError));
  }

  getClients(): Observable<Client[]> {
    return this.http
      .get<Client[]>(`${this.apiUrl}/clients`)
      .pipe(catchError(this.handleError));
  }

  private handleError(error: any) {
    console.error('Error en el servicio de red:', error);
    return throwError(() => new Error('Error en el servicio de red'));
  }

  simulateFailure(data: SimulationData): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/simulate-failure`, data);
  }

  deleteElement(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/elements/${id}`);
  }

  createElement(element: Partial<NetworkElement>): Observable<NetworkElement> {
    return this.http.post<NetworkElement>(`${this.apiUrl}/elements`, element);
  }

  updateElement(id: string, element: Partial<NetworkElement>): Observable<NetworkElement> {
    return this.http.put<NetworkElement>(`${this.apiUrl}/elements/${id}`, element);
  }
}
