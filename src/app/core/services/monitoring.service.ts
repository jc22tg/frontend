import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, interval } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface Metric {
  timestamp: Date;
  value: number;
  unit: string;
}

export interface NetworkMetrics {
  bandwidth: Metric[];
  latency: Metric[];
  packetLoss: Metric[];
  uptime: number;
}

export interface ElementMetrics {
  elementId: string;
  metrics: NetworkMetrics;
}

export interface MonitoringData {
  elementId: string;
  // ... existing code ...
}

@Injectable({
  providedIn: 'root'
})
export class MonitoringService {
  private metricsSubject = new BehaviorSubject<ElementMetrics[]>([]);
  public metrics$ = this.metricsSubject.asObservable();

  constructor(private http: HttpClient) {
    // Actualizar métricas cada 30 segundos
    interval(30000).pipe(
      switchMap(() => this.getNetworkMetrics())
    ).subscribe();
  }

  getNetworkMetrics(): Observable<ElementMetrics[]> {
    return this.http.get<ElementMetrics[]>(`${environment.apiUrl}/monitoring/metrics`)
      .pipe(
        tap(metrics => this.metricsSubject.next(metrics))
      );
  }

  getElementMetrics(elementId: string): Observable<ElementMetrics> {
    return this.http.get<ElementMetrics>(`${environment.apiUrl}/monitoring/elements/${elementId}/metrics`);
  }

  getHistoricalMetrics(elementId: string, startDate: Date, endDate: Date): Observable<NetworkMetrics> {
    const params = {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    };
    return this.http.get<NetworkMetrics>(`${environment.apiUrl}/monitoring/elements/${elementId}/history`, { params });
  }
} 
