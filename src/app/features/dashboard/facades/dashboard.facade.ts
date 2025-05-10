import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, interval } from 'rxjs';
import { startWith, switchMap, tap, shareReplay } from 'rxjs/operators';
import { DashboardService } from '@features/dashboard/services/dashboard.service';
import { 
  StatCard, 
  Activity, 
  PerformanceMetric, 
  SystemAlert 
} from '../models/dashboard.models';

@Injectable({
  providedIn: 'root'
})
export class DashboardFacade {
  private refreshInterval = 30000; // 30 segundos
  
  // Estado para indicar carga
  private loadingSubject = new BehaviorSubject<boolean>(false);
  loading$ = this.loadingSubject.asObservable();
  
  // Estado para tarjetas de estadísticas
  private statsSubject = new BehaviorSubject<StatCard[]>([]);
  stats$ = this.statsSubject.asObservable();
  
  // Estado para actividades recientes
  private activitiesSubject = new BehaviorSubject<Activity[]>([]);
  activities$ = this.activitiesSubject.asObservable();
  
  // Estado para métricas de rendimiento
  private metricsSubject = new BehaviorSubject<PerformanceMetric[]>([]);
  metrics$ = this.metricsSubject.asObservable();
  
  // Estado para alertas del sistema
  private alertsSubject = new BehaviorSubject<SystemAlert[]>([]);
  alerts$ = this.alertsSubject.asObservable();
  
  // Período de tiempo actual
  private periodSubject = new BehaviorSubject<string>('day');
  period$ = this.periodSubject.asObservable();
  
  // Observable compartido para el resumen del dashboard
  dashboardSummary$ = interval(this.refreshInterval).pipe(
    startWith(0),
    tap(() => this.loadingSubject.next(true)),
    switchMap(() => this.dashboardService.getDashboardSummary(this.periodSubject.getValue())),
    tap(summary => {
      this.statsSubject.next(summary.stats);
      this.activitiesSubject.next(summary.recentActivities);
      this.metricsSubject.next(summary.performanceMetrics);
      this.alertsSubject.next(summary.alerts);
      this.loadingSubject.next(false);
    }),
    shareReplay(1)
  );
  
  constructor(private dashboardService: DashboardService) {}
  
  /**
   * Inicia la carga de datos del dashboard
   */
  loadDashboardData(): void {
    // Trigger inicial
    this.dashboardSummary$.subscribe();
  }
  
  /**
   * Obtiene actividades recientes con límite
   * @param limit Número máximo de actividades a obtener
   */
  getRecentActivities(limit = 10): Observable<Activity[]> {
    return this.dashboardService.getRecentActivities(limit);
  }
  
  /**
   * Obtiene alertas del sistema
   * @param includeAcknowledged Indica si se incluyen alertas reconocidas
   */
  getSystemAlerts(includeAcknowledged = false): Observable<SystemAlert[]> {
    return this.dashboardService.getSystemAlerts(includeAcknowledged);
  }
  
  /**
   * Reconoce una alerta
   * @param alertId ID de la alerta a reconocer
   */
  acknowledgeAlert(alertId: string): Observable<boolean> {
    return this.dashboardService.acknowledgeAlert(alertId);
  }
  
  /**
   * Actualiza todos los datos del dashboard
   */
  refreshAll(): void {
    this.loadingSubject.next(true);
    this.dashboardService.getDashboardSummary(this.periodSubject.getValue()).subscribe(summary => {
      this.statsSubject.next(summary.stats);
      this.activitiesSubject.next(summary.recentActivities);
      this.metricsSubject.next(summary.performanceMetrics);
      this.alertsSubject.next(summary.alerts);
      this.loadingSubject.next(false);
    });
  }
  
  /**
   * Actualiza una sección específica del dashboard
   * @param sectionId Identificador de la sección a actualizar
   */
  refreshSection(sectionId: string): void {
    this.loadingSubject.next(true);
    
    switch (sectionId) {
      case 'health':
      case 'network':
        // Actualizar solo la sección de red/salud
        console.log('Actualizando datos de red/salud');
        setTimeout(() => this.loadingSubject.next(false), 1000);
        break;
      case 'metrics':
        // Actualizar solo métricas
        this.dashboardService.getPerformanceMetrics().subscribe(metrics => {
          this.metricsSubject.next(metrics);
          this.loadingSubject.next(false);
        });
        break;
      case 'alerts':
        // Actualizar solo alertas
        this.dashboardService.getSystemAlerts().subscribe(alerts => {
          this.alertsSubject.next(alerts);
          this.loadingSubject.next(false);
        });
        break;
      case 'activities':
        // Actualizar solo actividades
        this.dashboardService.getRecentActivities().subscribe(activities => {
          this.activitiesSubject.next(activities);
          this.loadingSubject.next(false);
        });
        break;
      default:
        // Si no se reconoce la sección, actualizar todo
        this.refreshAll();
    }
  }

  /**
   * Establece el período de tiempo para los datos
   * @param period Período a mostrar ('day', 'week', 'month')
   */
  setPeriod(period: string): void {
    if (this.periodSubject.getValue() === period) return;
    
    this.periodSubject.next(period);
    this.loadingSubject.next(true);
    
    // Obtener datos para el nuevo período
    this.dashboardService.getDashboardSummary(period).subscribe(summary => {
      this.statsSubject.next(summary.stats);
      this.activitiesSubject.next(summary.recentActivities);
      this.metricsSubject.next(summary.performanceMetrics);
      this.alertsSubject.next(summary.alerts);
      this.loadingSubject.next(false);
    });
  }

  /**
   * Exporta los datos del dashboard en el formato especificado
   * @param format Formato de exportación ('pdf' o 'excel')
   */
  exportDashboard(format: 'pdf' | 'excel'): void {
    this.loadingSubject.next(true);
    
    // Simulación de exportación
    console.log(`Exportando dashboard en formato ${format}`);
    
    setTimeout(() => {
      // En una implementación real, aquí se llamaría al servicio correspondiente
      alert(`Dashboard exportado en formato ${format}`);
      this.loadingSubject.next(false);
    }, 1500);
  }
} 