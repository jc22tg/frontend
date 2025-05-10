import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Report {
  id: number;
  titulo: string;
  descripcion?: string;
  tipo: 'network' | 'project' | 'maintenance' | 'alert';
  parametros: Record<string, any>;
  formato: 'pdf' | 'excel' | 'csv';
  estado: 'pending' | 'processing' | 'completed' | 'failed';
  url?: string;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  constructor(private http: HttpClient) {}

  getReports(): Observable<Report[]> {
    return this.http.get<Report[]>(`${environment.apiUrl}/reports`);
  }

  getReport(id: number): Observable<Report> {
    return this.http.get<Report>(`${environment.apiUrl}/reports/${id}`);
  }

  generateReport(report: Partial<Report>): Observable<Report> {
    return this.http.post<Report>(`${environment.apiUrl}/reports/generate`, report);
  }

  downloadReport(id: number): Observable<Blob> {
    return this.http.get(`${environment.apiUrl}/reports/${id}/download`, {
      responseType: 'blob'
    });
  }

  deleteReport(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/reports/${id}`);
  }
} 