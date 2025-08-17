import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError, timer, retry } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface NetworkHealthData {
  healthPercentage: number;
  activeElementsCount: number;
  warningElementsCount: number;
  criticalElementsCount: number;
  timestamp: string;
}

export interface NetworkMetric {
  id: string;
  timestamp: string;
  value: number;
  trend: 'up' | 'down' | 'stable';
  elementId: string;
  metricType: string;
}

@Injectable({
  providedIn: 'root'
})
export class NetworkMonitoringService {
  private apiUrl = `${environment.apiUrl}/monitoring`;
  private retryConfig = {
    maxRetries: 2,
    delayMs: 1000,
    excludeStatusCodes: [400, 401, 403, 404] // No reintentar para estos códigos
  };

  constructor(private http: HttpClient) {}

  /**
   * Obtiene el estado de salud general de la red
   */
  getNetworkHealth(): Observable<NetworkHealthData> {
    return this.http.get<NetworkHealthData>(`${this.apiUrl}/health`).pipe(
      retry({
        count: this.retryConfig.maxRetries,
        delay: (error, retryCount) => {
          if (error?.status && this.retryConfig.excludeStatusCodes.includes(error.status)) {
            return throwError(() => error);
          }
          console.log(`Reintentando petición getNetworkHealth... (intento ${retryCount} de ${this.retryConfig.maxRetries})`);
          const delayTime = this.retryConfig.delayMs * Math.pow(2, retryCount);
          return timer(delayTime);
        }
      }),
      catchError(error => {
        console.error('Error obteniendo salud de la red', error);
        // Datos de respaldo en caso de error
        return of({
          healthPercentage: 85,
          activeElementsCount: 42,
          warningElementsCount: 5,
          criticalElementsCount: 2,
          timestamp: new Date().toISOString()
        });
      })
    );
  }

  /**
   * Obtiene métricas para un elemento específico
   * @param elementId ID del elemento
   * @param metricType Tipo de métrica (bandwidth, latency, etc)
   * @param limit Número máximo de registros
   */
  getElementMetrics(elementId: string, metricType: string, limit = 10): Observable<NetworkMetric[]> {
    const params = { metricType, limit: limit.toString() };
    return this.http.get<NetworkMetric[]>(`${this.apiUrl}/elements/${elementId}/metrics`, { params }).pipe(
      retry({
        count: this.retryConfig.maxRetries,
        delay: (error, retryCount) => {
          if (error?.status && this.retryConfig.excludeStatusCodes.includes(error.status)) {
            return throwError(() => error);
          }
          console.log(`Reintentando petición getElementMetrics for ${elementId}... (intento ${retryCount} de ${this.retryConfig.maxRetries})`);
          const delayTime = this.retryConfig.delayMs * Math.pow(2, retryCount);
          return timer(delayTime);
        }
      }),
      catchError(error => {
        console.error(`Error obteniendo métricas para el elemento ${elementId}`, error);
        // Retorna array vacío en caso de error
        return of([]);
      })
    );
  }

  /**
   * Obtiene métricas agregadas para toda la red
   * @param metricType Tipo de métrica
   * @param period Período de tiempo (day, week, month)
   */
  getNetworkMetrics(metricType: string, period = 'day'): Observable<any> {
    // Si useMocks está habilitado, usar datos simulados directamente
    if (environment.useMocks) {
      console.info(`[NetworkMonitoringService] Usando datos simulados para ${metricType}`);
      return of(this.generateMockNetworkMetrics(metricType));
    }
    
    const params = { metricType, period };
    return this.http.get<any>(`${this.apiUrl}/metrics`, { params }).pipe(
      retry({
        count: this.retryConfig.maxRetries,
        delay: (error, retryCount) => {
          if (error?.status && this.retryConfig.excludeStatusCodes.includes(error.status)) {
            return throwError(() => error);
          }
          console.log(`Reintentando petición getNetworkMetrics for ${metricType}... (intento ${retryCount} de ${this.retryConfig.maxRetries})`);
          const delayTime = this.retryConfig.delayMs * Math.pow(2, retryCount);
          return timer(delayTime);
        }
      }),
      map(response => {
        // Asegurarse de que la respuesta tiene el formato esperado
        if (!response || (!response.metrics && !Array.isArray(response.bandwidth))) {
          console.warn('Formato de respuesta inesperado:', response);
          return { metrics: [], lastUpdated: new Date() };
        }
        
        // La respuesta puede venir en dos formatos diferentes dependiendo del backend
        // 1. { metrics: [...], lastUpdated: Date }
        // 2. { bandwidth: [...], latency: [...], packetLoss: [...], uptime: number }
        
        if (response.metrics) {
          // Ya está en el formato esperado
          return response;
        } else {
          // Convertir a formato esperado
          return {
            metrics: response[metricType] || [],
            lastUpdated: response.lastUpdated || new Date()
          };
        }
      }),
      catchError(error => {
        console.error('Error obteniendo métricas de red', error);
        
        // Verificar si el error es porque se recibió HTML en lugar de JSON
        if (error.error instanceof SyntaxError && error.error.message.includes('Unexpected token')) {
          console.warn('La API está retornando HTML en lugar de JSON. Verificar el estado del servidor.');
        }
        
        // Generar datos simulados si está configurado
        if (environment.useMocks) {
          console.info('[NetworkMonitoringService] Usando datos simulados después de error en API');
          return of(this.generateMockNetworkMetrics(metricType));
        }
        
        return of({ metrics: [], lastUpdated: new Date() });
      })
    );
  }

  /**
   * Genera datos de métricas simulados para casos en que el API falla
   * @param metricType Tipo de métrica
   * @returns Datos simulados
   */
  private generateMockNetworkMetrics(metricType: string): any {
    const now = new Date();
    const mockMetrics: {timestamp: string, value: number, trend: string, id: string, elementId?: string}[] = [];
    
    // Generar 24 puntos de datos (uno por hora)
    for (let i = 0; i < 24; i++) {
      const timestamp = new Date(now);
      timestamp.setHours(now.getHours() - (24 - i));
      
      let value: number;
      const baseTrend = i < 12 ? 'down' : 'up'; // Tendencia general
      const randomVariation = Math.random() > 0.7; // Variación aleatoria en algunos puntos
      const trend = randomVariation ? (baseTrend === 'up' ? 'down' : 'up') : baseTrend;
      
      switch(metricType) {
        case 'bandwidth':
          // Simulación de patrón realista con picos durante horas laborales
          const hour = timestamp.getHours();
          const isBusinessHour = hour >= 9 && hour <= 18;
          const baseValue = isBusinessHour ? 350 : 150;
          const variation = isBusinessHour ? 150 : 50;
          value = Math.floor(baseValue + Math.random() * variation);
          break;
        case 'latency':
          // Latencia con variación basada en carga
          const latencyBase = 10;
          const latencyVariation = 40;
          const hourFactor = Math.abs(12 - (timestamp.getHours() % 24)) / 12; // Factor 0-1 según hora del día
          value = latencyBase + (latencyVariation * hourFactor * (0.5 + Math.random() * 0.5));
          value = parseFloat(value.toFixed(1));
          break;
        case 'packetLoss':
          // Pérdida de paquetes baja con ocasionales picos
          value = Math.random() > 0.9 ? parseFloat((0.5 + Math.random() * 1.5).toFixed(2)) : parseFloat((Math.random() * 0.5).toFixed(2));
          break;
        case 'errors':
          // Errores - números enteros pequeños
          value = Math.random() > 0.85 ? Math.floor(Math.random() * 10) + 1 : 0;
          break;
        case 'temperature':
          // Temperatura entre 25-40°C
          value = 25 + Math.random() * 15;
          value = parseFloat(value.toFixed(1));
          break;
        default:
          value = Math.floor(Math.random() * 100);
      }
      
      mockMetrics.push({
        id: `mock-${metricType}-${i}`,
        timestamp: timestamp.toISOString(),
        value,
        trend,
        elementId: 'network' // Id genérico para métricas de red
      });
    }
    
    return {
      metrics: mockMetrics,
      lastUpdated: now
    };
  }

  /**
   * Obtiene el estado de todas las conexiones
   */
  getConnectionsStatus(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/connections`).pipe(
      retry({
        count: this.retryConfig.maxRetries,
        delay: (error, retryCount) => {
          if (error?.status && this.retryConfig.excludeStatusCodes.includes(error.status)) {
            return throwError(() => error);
          }
          console.log(`Reintentando petición getConnectionsStatus... (intento ${retryCount} de ${this.retryConfig.maxRetries})`);
          const delayTime = this.retryConfig.delayMs * Math.pow(2, retryCount);
          return timer(delayTime);
        }
      }),
      catchError(error => {
        console.error('Error obteniendo estado de conexiones', error);
        // Generar datos simulados en caso de error
        if (environment.useMocks) {
          return of(this.generateMockConnectionStatus());
        }
        return throwError(() => error);
      })
    );
  }

  /**
   * Genera datos simulados de estado de conexiones
   */
  private generateMockConnectionStatus(): any {
    // Generar 15 conexiones simuladas con estados variados
    const connections = Array(15).fill(0).map((_, i) => {
      const statusOptions = ['active', 'warning', 'error', 'inactive'];
      const status = statusOptions[Math.floor(Math.random() * statusOptions.length)];
      
      return {
        id: `mock-connection-${i}`,
        sourceId: `source-${i}`,
        targetId: `target-${i}`,
        status,
        lastUpdated: new Date().toISOString(),
        metrics: {
          bandwidth: Math.floor(Math.random() * 1000),
          latency: Math.floor(Math.random() * 50),
          packetLoss: parseFloat((Math.random() * 2).toFixed(2)),
        }
      };
    });
    
    return { connections, lastUpdated: new Date().toISOString() };
  }
} 
