import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  NetworkElement,
  ElementType,
  ElementStatus,
  FiberConnection,
  MonitoringData,
  NetworkAlert,
  Client
} from '../../shared/types/network.types';
import { MOCK_CONNECTIONS } from './mock-data/connections.mock';

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
    return this.http.get<NetworkElement[]>(`${this.apiUrl}/elements`);
  }

  getElementsByType(type: ElementType): Observable<NetworkElement[]> {
    return this.http.get<NetworkElement[]>(`${this.apiUrl}/elements?type=${type}`);
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
          
          // Verificar si el error está relacionado con HTML devuelto en lugar de JSON
          if (error?.error?.text && typeof error.error.text === 'string' && error.error.text.includes('<!DOCTYPE html>')) {
            console.warn('El servidor devolvió HTML en lugar de JSON. Usando datos mock.');
            return new Observable<FiberConnection[]>(observer => {
              observer.next(MOCK_CONNECTIONS);
              observer.complete();
            });
          }
          
          // Si environment.useMocks está activado, devolver datos mock en caso de error
          if (environment.useMocks) {
            console.log('Usando datos mock para conexiones');
            return new Observable<FiberConnection[]>(observer => {
              observer.next(MOCK_CONNECTIONS);
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
