import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, interval } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface Alert {
  id: number;
  type: 'ERROR' | 'WARNING' | 'INFO';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  message: string;
  elementId?: number;
  elementType?: string;
  timestamp: Date;
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';
}

@Injectable({
  providedIn: 'root'
})
export class AlertService {
  private alertsSubject = new BehaviorSubject<Alert[]>([]);
  public alerts$ = this.alertsSubject.asObservable();

  constructor(private http: HttpClient) {
    // Actualizar alertas cada 15 segundos
    interval(15000).pipe(
      switchMap(() => this.getActiveAlerts())
    ).subscribe();
  }

  getActiveAlerts(): Observable<Alert[]> {
    return this.http.get<Alert[]>(`${environment.apiUrl}/alerts/active`)
      .pipe(
        tap(alerts => this.alertsSubject.next(alerts))
      );
  }

  getAlertHistory(startDate: Date, endDate: Date): Observable<Alert[]> {
    const params = {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    };
    return this.http.get<Alert[]>(`${environment.apiUrl}/alerts/history`, { params });
  }

  acknowledgeAlert(alertId: number): Observable<Alert> {
    return this.http.patch<Alert>(`${environment.apiUrl}/alerts/${alertId}/acknowledge`, {});
  }

  resolveAlert(alertId: number): Observable<Alert> {
    return this.http.patch<Alert>(`${environment.apiUrl}/alerts/${alertId}/resolve`, {});
  }

  getAlertStats(): Observable<{
    totalAlerts: number;
    activeAlerts: number;
    criticalAlerts: number;
    resolvedAlerts: number;
  }> {
    return this.http.get<{
      totalAlerts: number;
      activeAlerts: number;
      criticalAlerts: number;
      resolvedAlerts: number;
    }>(`${environment.apiUrl}/alerts/stats`);
  }
} 
