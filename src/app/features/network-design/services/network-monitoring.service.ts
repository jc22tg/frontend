import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ElementType
} from '../../../shared/models/network.model';
import { 
  MonitoringData,
  NetworkAlert,
  MaintenanceSchedule
} from '../../../shared/types/network.types';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class NetworkMonitoringService {
  private apiUrl = `${environment.apiUrl}/monitoring`;

  constructor(private http: HttpClient) {}

  // Monitoreo
  getMonitoringData(elementId: string, elementType: ElementType): Observable<MonitoringData> {
    return this.http.get<MonitoringData>(`${this.apiUrl}/data/${elementType}/${elementId}`);
  }

  getElementMetrics(elementId: string, elementType: ElementType, timeRange: string): Observable<MonitoringData[]> {
    const params = new HttpParams().set('timeRange', timeRange);
    return this.http.get<MonitoringData[]>(
      `${this.apiUrl}/metrics/${elementType}/${elementId}`,
      { params }
    );
  }

  // Alertas
  getNetworkAlerts(severity?: 'critical' | 'warning' | 'info', resolved?: boolean): Observable<NetworkAlert[]> {
    let params = new HttpParams();
    if (severity) {
      params = params.set('severity', severity);
    }
    if (resolved !== undefined) {
      params = params.set('resolved', resolved.toString());
    }
    return this.http.get<NetworkAlert[]>(`${this.apiUrl}/alerts`, { params });
  }

  resolveAlert(alertId: string): Observable<NetworkAlert> {
    return this.http.patch<NetworkAlert>(`${this.apiUrl}/alerts/${alertId}/resolve`, {});
  }

  // Mantenimiento
  getMaintenanceSchedules(status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'): Observable<MaintenanceSchedule[]> {
    let params = new HttpParams();
    if (status) {
      params = params.set('status', status);
    }
    return this.http.get<MaintenanceSchedule[]>(`${this.apiUrl}/maintenance`, { params });
  }

  scheduleMaintenanceTask(task: Omit<MaintenanceSchedule, 'id'>): Observable<MaintenanceSchedule> {
    return this.http.post<MaintenanceSchedule>(`${this.apiUrl}/maintenance`, task);
  }

  updateMaintenanceTask(taskId: string, updates: Partial<MaintenanceSchedule>): Observable<MaintenanceSchedule> {
    return this.http.patch<MaintenanceSchedule>(`${this.apiUrl}/maintenance/${taskId}`, updates);
  }

  // Métricas en tiempo real
  subscribeToMetrics(elementId: string, elementType: ElementType): Observable<MonitoringData> {
    // Implementar WebSocket o SSE para métricas en tiempo real
    throw new Error('Not implemented');
  }
} 
