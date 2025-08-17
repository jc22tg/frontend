import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { NetworkElement, ElementType, MonitoringData } from '../../../shared/types/network.types';

export interface MetricData {
  elementId: string;
  timestamp: Date;
  metrics: {
    bandwidth?: number;
    latency?: number;
    packetLoss?: number;
    temperature?: number;
    power?: number;
    signal?: number;
  };
}

export interface MetricSummary {
  average: number;
  min: number;
  max: number;
  current: number;
  trend: 'up' | 'down' | 'stable';
}

@Injectable({
  providedIn: 'root'
})
export class MetricsService {
  private metricsSubject = new BehaviorSubject<Record<string, MetricData[]>>({});
  private summarySubject = new BehaviorSubject<Record<string, Record<string, MetricSummary>>>({});

  constructor() {
    this.initializeMetrics();
  }

  private initializeMetrics(): void {
    // Inicializar métricas
    // TODO: Cargar métricas desde backend
  }

  // Métodos para obtener métricas
  getMetrics(elementId: string): Observable<MetricData[]> {
    return this.metricsSubject.pipe(
      map(metrics => metrics[elementId] || [])
    );
  }

  getAllMetrics(): Observable<Record<string, MetricData[]>> {
    return this.metricsSubject.asObservable();
  }

  getMetricSummary(elementId: string, metricName: string): Observable<MetricSummary | null> {
    return this.summarySubject.pipe(
      map(summaries => summaries[elementId]?.[metricName] || null)
    );
  }

  // Métodos para actualizar métricas
  updateMetrics(elementId: string, metrics: MetricData): void {
    const currentMetrics = this.metricsSubject.value;
    const elementMetrics = currentMetrics[elementId] || [];
    elementMetrics.push(metrics);
    currentMetrics[elementId] = elementMetrics;
    this.metricsSubject.next({ ...currentMetrics });
    this.updateSummary(elementId);
  }

  private updateSummary(elementId: string): void {
    const metrics = this.metricsSubject.value[elementId] || [];
    const summaries: Record<string, MetricSummary> = {};

    // Calcular resúmenes para cada métrica
    Object.keys(metrics[0]?.metrics || {}).forEach(metricName => {
      const values = metrics.map(m => m.metrics[metricName as keyof typeof m.metrics] || 0);
      summaries[metricName] = this.calculateSummary(values);
    });

    const currentSummaries = this.summarySubject.value;
    currentSummaries[elementId] = summaries;
    this.summarySubject.next({ ...currentSummaries });
  }

  private calculateSummary(values: number[]): MetricSummary {
    const current = values[values.length - 1] || 0;
    const average = values.reduce((a, b) => a + b, 0) / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const trend = this.calculateTrend(values);

    return {
      average,
      min,
      max,
      current,
      trend
    };
  }

  private calculateTrend(values: number[]): 'up' | 'down' | 'stable' {
    if (values.length < 2) return 'stable';
    const lastValue = values[values.length - 1];
    const previousValue = values[values.length - 2];
    const difference = lastValue - previousValue;
    const threshold = 0.1; // 10% de cambio

    if (Math.abs(difference) < threshold) return 'stable';
    return difference > 0 ? 'up' : 'down';
  }

  // Métodos para filtrado y análisis
  getMetricsByTimeRange(elementId: string, startDate: Date, endDate: Date): Observable<MetricData[]> {
    return this.getMetrics(elementId).pipe(
      map(metrics => metrics.filter(m => 
        m.timestamp >= startDate && m.timestamp <= endDate
      ))
    );
  }

  getMetricsByType(elementId: string, metricType: string): Observable<MetricData[]> {
    return this.getMetrics(elementId).pipe(
      map(metrics => metrics.filter(m => 
        Object.keys(m.metrics).includes(metricType)
      ))
    );
  }

  // Métodos para exportación
  exportMetrics(elementId: string): void {
    // TODO: Implementar exportación de métricas
  }

  exportSummary(elementId: string): void {
    // TODO: Implementar exportación de resumen
  }

  // Métodos para limpieza
  clearMetrics(elementId: string): void {
    const currentMetrics = this.metricsSubject.value;
    delete currentMetrics[elementId];
    this.metricsSubject.next({ ...currentMetrics });
  }

  clearAllMetrics(): void {
    this.metricsSubject.next({});
    this.summarySubject.next({});
  }
} 
