import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { LoggerService } from '../../../core/services/logger.service';

export interface PerformanceMetric {
  widgetId?: string;
  componentType: string;
  metricType: 'render' | 'update' | 'interaction' | 'load' | 'init';
  value: number; // tiempo en ms
  timestamp: Date;
  context?: any;
}

export interface WidgetPerformanceSummary {
  widgetId: string;
  componentType: string;
  averageRenderTime: number;
  averageUpdateTime: number;
  updateCount: number;
  lastUpdated: Date;
  loadTime?: number;
}

export interface DashboardPerformanceStats {
  totalWidgets: number;
  averageWidgetRenderTime: number; 
  averageWidgetUpdateTime: number;
  totalUpdates: number;
  slowestWidget?: {
    widgetId: string;
    componentType: string;
    averageTime: number;
  };
  fastestWidget?: {
    widgetId: string;
    componentType: string;
    averageTime: number;
  };
  lastCalculated: Date;
}

/**
 * Servicio para monitorear el rendimiento de los widgets y del dashboard
 * Proporciona métricas detalladas para ayudar a optimizar la experiencia del usuario
 */
@Injectable({
  providedIn: 'root'
})
export class PerformanceMonitoringService {
  // Eventos de rendimiento individuales
  private performanceMetrics = new Subject<PerformanceMetric>();
  public performanceMetrics$ = this.performanceMetrics.asObservable();
  
  // Estadísticas calculadas del dashboard
  private dashboardStats = new BehaviorSubject<DashboardPerformanceStats>({
    totalWidgets: 0,
    averageWidgetRenderTime: 0,
    averageWidgetUpdateTime: 0,
    totalUpdates: 0,
    lastCalculated: new Date()
  });
  public dashboardStats$ = this.dashboardStats.asObservable();
  
  // Historial de métricas por widget (para análisis)
  private metricsByWidget = new Map<string, PerformanceMetric[]>();
  
  // Resúmenes de rendimiento por widget
  private widgetSummaries = new Map<string, WidgetPerformanceSummary>();
  
  // Flag para habilitar/deshabilitar el monitoreo
  private monitoringEnabled = true;
  
  constructor(private logger: LoggerService) {
    this.logger.info('Servicio de monitoreo de rendimiento inicializado');
  }
  
  /**
   * Activa o desactiva el monitoreo de rendimiento
   */
  setMonitoringEnabled(enabled: boolean): void {
    this.monitoringEnabled = enabled;
    this.logger.debug(`Monitoreo de rendimiento ${enabled ? 'activado' : 'desactivado'}`);
  }
  
  /**
   * Registra una métrica de rendimiento
   */
  recordMetric(metric: PerformanceMetric): void {
    if (!this.monitoringEnabled) return;
    
    // Asegurarse de que la métrica tenga timestamp
    const metricWithTimestamp = {
      ...metric,
      timestamp: metric.timestamp || new Date()
    };
    
    // Emitir la métrica
    this.performanceMetrics.next(metricWithTimestamp);
    
    // Guardar en historial si tiene ID de widget
    if (metricWithTimestamp.widgetId) {
      if (!this.metricsByWidget.has(metricWithTimestamp.widgetId)) {
        this.metricsByWidget.set(metricWithTimestamp.widgetId, []);
      }
      this.metricsByWidget.get(metricWithTimestamp.widgetId)?.push(metricWithTimestamp);
      
      // Limitar el historial a 100 entradas por widget
      const metrics = this.metricsByWidget.get(metricWithTimestamp.widgetId);
      if (metrics && metrics.length > 100) {
        metrics.shift(); // Eliminar el más antiguo
      }
      
      // Actualizar resumen del widget
      this.updateWidgetSummary(metricWithTimestamp);
    }
    
    // Actualizar estadísticas del dashboard periódicamente
    this.calculateDashboardStats();
  }
  
  /**
   * Comienza a medir el tiempo para una operación
   * @returns Una función que debe llamarse al finalizar la operación para registrar la métrica
   */
  startMeasurement(
    componentType: string, 
    metricType: 'render' | 'update' | 'interaction' | 'load', 
    widgetId?: string,
    context?: any
  ): () => void {
    if (!this.monitoringEnabled) return () => {};
    
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      this.recordMetric({
        widgetId,
        componentType,
        metricType,
        value: duration,
        timestamp: new Date(),
        context
      });
    };
  }
  
  /**
   * Obtiene el resumen de rendimiento para un widget específico
   */
  getWidgetSummary(widgetId: string): WidgetPerformanceSummary | undefined {
    return this.widgetSummaries.get(widgetId);
  }
  
  /**
   * Obtiene todos los resúmenes de rendimiento de widgets
   */
  getAllWidgetSummaries(): WidgetPerformanceSummary[] {
    return Array.from(this.widgetSummaries.values());
  }
  
  /**
   * Obtiene el historial de métricas para un widget
   */
  getWidgetMetricHistory(widgetId: string): PerformanceMetric[] {
    return this.metricsByWidget.get(widgetId) || [];
  }
  
  /**
   * Limpia todas las métricas y estadísticas
   */
  clearAllMetrics(): void {
    this.metricsByWidget.clear();
    this.widgetSummaries.clear();
    this.calculateDashboardStats();
  }
  
  /**
   * Actualiza el resumen de rendimiento para un widget basado en una nueva métrica
   */
  private updateWidgetSummary(metric: PerformanceMetric): void {
    if (!metric.widgetId) return;
    
    const widgetId = metric.widgetId;
    let summary = this.widgetSummaries.get(widgetId);
    
    if (!summary) {
      // Crear nuevo resumen si no existe
      summary = {
        widgetId,
        componentType: metric.componentType,
        averageRenderTime: 0,
        averageUpdateTime: 0,
        updateCount: 0,
        lastUpdated: new Date()
      };
    }
    
    // Actualizar estadísticas según el tipo de métrica
    switch (metric.metricType) {
      case 'render':
        summary.averageRenderTime = this.calculateRunningAverage(
          summary.averageRenderTime,
          metric.value,
          summary.updateCount + 1
        );
        break;
      case 'update':
        summary.averageUpdateTime = this.calculateRunningAverage(
          summary.averageUpdateTime,
          metric.value,
          summary.updateCount + 1
        );
        break;
      case 'load':
        summary.loadTime = metric.value;
        break;
    }
    
    // Actualizar contador y timestamp
    summary.updateCount += 1;
    summary.lastUpdated = new Date();
    
    // Guardar resumen actualizado
    this.widgetSummaries.set(widgetId, summary);
  }
  
  /**
   * Calcula la media móvil
   */
  private calculateRunningAverage(currentAvg: number, newValue: number, count: number): number {
    return ((currentAvg * (count - 1)) + newValue) / count;
  }
  
  /**
   * Calcula estadísticas generales del dashboard basadas en los resúmenes de widgets
   */
  private calculateDashboardStats(): void {
    const summaries = this.getAllWidgetSummaries();
    
    if (summaries.length === 0) {
      // No hay widgets con métricas
      this.dashboardStats.next({
        totalWidgets: 0,
        averageWidgetRenderTime: 0,
        averageWidgetUpdateTime: 0,
        totalUpdates: 0,
        lastCalculated: new Date()
      });
      return;
    }
    
    // Calcular estadísticas
    let totalRenderTime = 0;
    let totalUpdateTime = 0;
    let totalUpdates = 0;
    let slowestWidget;
    let fastestWidget;
    let maxAvgTime = -1;
    let minAvgTime = Number.MAX_VALUE;
    
    for (const summary of summaries) {
      totalRenderTime += summary.averageRenderTime;
      totalUpdateTime += summary.averageUpdateTime;
      totalUpdates += summary.updateCount;
      
      // Encontrar el widget más lento/rápido basado en tiempo promedio de actualización
      const avgTime = summary.averageUpdateTime;
      
      if (avgTime > maxAvgTime) {
        maxAvgTime = avgTime;
        slowestWidget = {
          widgetId: summary.widgetId,
          componentType: summary.componentType,
          averageTime: avgTime
        };
      }
      
      if (avgTime < minAvgTime) {
        minAvgTime = avgTime;
        fastestWidget = {
          widgetId: summary.widgetId,
          componentType: summary.componentType,
          averageTime: avgTime
        };
      }
    }
    
    // Actualizar estadísticas
    this.dashboardStats.next({
      totalWidgets: summaries.length,
      averageWidgetRenderTime: totalRenderTime / summaries.length,
      averageWidgetUpdateTime: totalUpdateTime / summaries.length,
      totalUpdates,
      slowestWidget,
      fastestWidget,
      lastCalculated: new Date()
    });
  }
} 
