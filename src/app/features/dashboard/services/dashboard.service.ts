import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { delay, map, tap, finalize } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';
import { 
  DashboardSummary, 
  StatCard, 
  FiberMetric,
  FiberAlert,
  FiberActivity,
  ActivityType,
  MetricStatus,
  AlertSeverity,
  FiberDeviceType,
  FiberMetricType,
  FiberDevice,
  FiberSegment,
  FiberConnection,
  FiberNetwork
} from '../models/dashboard.models';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiUrl = `${environment.apiUrl}/dashboard`;
  private loadingSubject = new BehaviorSubject<boolean>(false);
  loading$ = this.loadingSubject.asObservable();

  private metricsSubject = new BehaviorSubject<FiberMetric[]>([
    {
      id: 'metric1',
      name: 'Uso de CPU',
      value: 65,
      unit: '%',
      trend: 2.5,
      timestamp: new Date(),
      status: MetricStatus.NORMAL,
      type: FiberMetricType.SIGNAL_QUALITY,
      history: [
        { value: 62, timestamp: new Date(Date.now() - 3600000) },
        { value: 58, timestamp: new Date(Date.now() - 7200000) }
      ]
    },
    {
      id: 'metric2',
      name: 'Memoria Disponible',
      value: 28,
      unit: '%',
      trend: -3.5,
      timestamp: new Date(),
      status: MetricStatus.WARNING,
      type: FiberMetricType.SIGNAL_QUALITY,
      history: [
        { value: 35, timestamp: new Date(Date.now() - 3600000) },
        { value: 32, timestamp: new Date(Date.now() - 7200000) }
      ]
    },
    {
      id: 'metric3',
      name: 'Tráfico de Red',
      value: 85,
      unit: 'Mbps',
      trend: 5.2,
      timestamp: new Date(),
      status: MetricStatus.NORMAL,
      type: FiberMetricType.BANDWIDTH,
      history: [
        { value: 78, timestamp: new Date(Date.now() - 3600000) },
        { value: 82, timestamp: new Date(Date.now() - 7200000) }
      ]
    },
    {
      id: 'metric4',
      name: 'Latencia',
      value: 120,
      unit: 'ms',
      trend: 15.5,
      timestamp: new Date(),
      status: MetricStatus.CRITICAL,
      type: FiberMetricType.LATENCY,
      history: [
        { value: 85, timestamp: new Date(Date.now() - 3600000) },
        { value: 90, timestamp: new Date(Date.now() - 7200000) }
      ]
    }
  ]);

  private alertsSubject = new BehaviorSubject<FiberAlert[]>([
    {
      id: uuidv4(),
      type: AlertSeverity.ERROR,
      message: 'Alta atenuación detectada en segmento FIBER-001',
      timestamp: new Date(),
      source: 'Sistema',
      status: 'active',
      deviceId: 'OLT-001',
      elementType: FiberDeviceType.OLT,
      elementId: 'OLT-001',
      fiberSegment: 'FIBER-001',
      distance: 2.5,
      opticalPower: -18.5,
      affectedElements: ['ONT-001', 'ONT-002', 'ONT-003'],
      priority: 'high',
      resolution: 'Requiere revisión del empalme en punto A',
      maintenanceSchedule: new Date(Date.now() + 86400000),
      acknowledged: false
    },
    {
      id: uuidv4(),
      type: AlertSeverity.WARNING,
      message: 'Potencia óptica baja en ONT-003',
      timestamp: new Date(Date.now() - 3600000),
      source: 'Sistema',
      status: 'active',
      deviceId: 'ONT-003',
      elementType: FiberDeviceType.ONT,
      elementId: 'ONT-003',
      opticalPower: -25.5,
      priority: 'medium',
      acknowledged: false
    },
    {
      id: uuidv4(),
      type: AlertSeverity.INFO,
      message: 'Mantenimiento programado en splitter SPL-002',
      timestamp: new Date(Date.now() - 7200000),
      source: 'Sistema',
      status: 'active',
      deviceId: 'SPL-002',
      elementType: FiberDeviceType.SPLITTER,
      elementId: 'SPL-002',
      priority: 'low',
      maintenanceSchedule: new Date(Date.now() + 172800000),
      acknowledged: true
    }
  ]);

  private activitiesSubject = new BehaviorSubject<FiberActivity[]>([
    {
      id: uuidv4(),
      type: ActivityType.MAINTENANCE,
      action: 'Mantenimiento preventivo en OLT-001',
      user: 'admin',
      timestamp: new Date(),
      details: 'Limpieza de conectores y verificación de potencia',
      deviceId: 'OLT-001',
      deviceType: FiberDeviceType.OLT,
      location: 'Nodo Central',
      maintenanceType: 'preventive',
      elementType: FiberDeviceType.OLT,
      elementId: 'OLT-001',
      workOrderId: 'WO-2024-001',
      technician: 'Juan Pérez',
      estimatedDuration: 120,
      completionStatus: 'in-progress'
    },
    {
      id: uuidv4(),
      type: ActivityType.MONITOR,
      action: 'Nuevo ONT detectado',
      user: 'sistema',
      timestamp: new Date(Date.now() - 3600000),
      details: 'ONT-004 conectado en puerto 1/1/1:1',
      deviceId: 'ONT-004',
      deviceType: FiberDeviceType.ONT,
      location: 'Cliente ABC',
      elementType: FiberDeviceType.ONT,
      elementId: 'ONT-004',
      completionStatus: 'completed'
    },
    {
      id: uuidv4(),
      type: ActivityType.ALERT,
      action: 'Alerta de degradación de señal',
      user: 'sistema',
      timestamp: new Date(Date.now() - 7200000),
      details: 'Degradación detectada en empalme SPL-001',
      deviceId: 'SPL-001',
      deviceType: FiberDeviceType.SPLITTER,
      location: 'Nodo Secundario',
      fiberSegment: 'FIBER-002',
      splicePoint: 'SPL-001',
      affectedUsers: 8,
      elementType: FiberDeviceType.SPLITTER,
      elementId: 'SPL-001',
      workOrderId: 'WO-2024-002',
      completionStatus: 'pending'
    }
  ]);

  constructor(private http: HttpClient) {}
  
  /**
   * Obtiene un resumen completo del dashboard
   * @param period Período de tiempo para los datos ('day', 'week', 'month')
   */
  getDashboardSummary(period = 'day'): Observable<DashboardSummary> {
    this.loadingSubject.next(true);
    
    // En producción, reemplazar por:
    // return this.http.get<DashboardSummary>(`${this.apiUrl}/dashboard/summary?period=${period}`).pipe(
    //   tap(data => {
    //     this.metricsSubject.next(data.performanceMetrics);
    //     this.alertsSubject.next(data.alerts);
    //     this.activitiesSubject.next(data.recentActivities);
    //   }),
    //   finalize(() => this.loadingSubject.next(false))
    // );
    
    // Simulación de datos para desarrollo
    return of(this.getMockDashboardData(period)).pipe(
      tap(data => {
        // Actualizar los BehaviorSubjects con los datos del resumen
        this.metricsSubject.next(data.performanceMetrics);
        this.alertsSubject.next(data.alerts);
        this.activitiesSubject.next(data.recentActivities);
      }),
      delay(500),
      finalize(() => this.loadingSubject.next(false))
    );
  }
  
  /**
   * Obtiene las tarjetas de estadísticas
   */
  getStatCards(): Observable<StatCard[]> {
    // En producción, reemplazar por:
    // return this.http.get<StatCard[]>(`${this.apiUrl}/dashboard/stats`);
    
    return of(this.getMockDashboardData().stats).pipe(delay(300));
  }
  
  /**
   * Obtiene las actividades recientes
   */
  getRecentActivities(limit = 10): Observable<FiberActivity[]> {
    // En producción, reemplazar por:
    // return this.http.get<Activity[]>(`${this.apiUrl}/activities/recent?limit=${limit}`);
    
    return of(this.getMockDashboardData().recentActivities.slice(0, limit)).pipe(delay(400));
  }
  
  /**
   * Obtiene las métricas de rendimiento
   */
  getPerformanceMetrics(): Observable<FiberMetric[]> {
    // En producción, reemplazar por:
    // return this.http.get<PerformanceMetric[]>(`${this.apiUrl}/metrics/performance`);
    
    return of(this.getMockDashboardData().performanceMetrics).pipe(delay(450));
  }
  
  /**
   * Obtiene las alertas del sistema
   */
  getSystemAlerts(includedAcknowledged = false): Observable<FiberAlert[]> {
    // En producción, reemplazar por:
    // return this.http.get<SystemAlert[]>(
    //   `${this.apiUrl}/alerts/system?includedAcknowledged=${includedAcknowledged}`
    // );
    
    const alerts = this.getMockDashboardData().alerts;
    const filtered = includedAcknowledged ? alerts : alerts.filter(a => !a.acknowledged);
    return of(filtered).pipe(delay(350));
  }
  
  /**
   * Reconoce una alerta
   */
  acknowledgeAlert(alertId: string): Observable<boolean> {
    return this.http.patch<FiberAlert>(`${this.apiUrl}/alerts/${alertId}/acknowledge`, {}).pipe(
      map(updatedAlert => {
        const alerts = this.alertsSubject.value;
        const index = alerts.findIndex(alert => alert.id === alertId);
        if (index !== -1) {
          alerts[index] = updatedAlert;
          this.alertsSubject.next(alerts);
        }
        return true;
      })
    );
  }
  
  /**
   * Datos simulados para desarrollo
   * @param period Período de tiempo ('day', 'week', 'month')
   */
  private getMockDashboardData(period = 'day'): DashboardSummary {
    const now = new Date();
    
    // Crear timestamps para diferentes momentos
    const getTime = (minutesAgo: number) => {
      const date = new Date(now);
      date.setMinutes(date.getMinutes() - minutesAgo);
      return date;
    };
    
    // Ajustar datos según el período
    let stats: StatCard[] = [];
    
    switch (period) {
      case 'week':
        stats = [
          { id: '1', title: 'Total de Clientes', value: '1,345', icon: 'people', color: '#1976d2', trend: 8 },
          { id: '2', title: 'Redes Activas', value: '52', icon: 'wifi', color: '#4caf50', trend: 15 },
          { id: '3', title: 'Ancho de Banda Total', value: '12 Gbps', icon: 'speed', color: '#ff9800', trend: 20 },
          { id: '4', title: 'Uptime', value: '99.5%', icon: 'schedule', color: '#9c27b0', trend: -0.4 }
        ];
        break;
      case 'month':
        stats = [
          { id: '1', title: 'Total de Clientes', value: '1,502', icon: 'people', color: '#1976d2', trend: 22 },
          { id: '2', title: 'Redes Activas', value: '58', icon: 'wifi', color: '#4caf50', trend: 29 },
          { id: '3', title: 'Ancho de Banda Total', value: '15 Gbps', icon: 'speed', color: '#ff9800', trend: 50 },
          { id: '4', title: 'Uptime', value: '99.3%', icon: 'schedule', color: '#9c27b0', trend: -0.6 }
        ];
        break;
      default: // day
        stats = [
          { id: '1', title: 'Total de Clientes', value: '1,234', icon: 'people', color: '#1976d2', trend: 5 },
          { id: '2', title: 'Redes Activas', value: '45', icon: 'wifi', color: '#4caf50', trend: 0 },
          { id: '3', title: 'Ancho de Banda Total', value: '10 Gbps', icon: 'speed', color: '#ff9800', trend: 12 },
          { id: '4', title: 'Uptime', value: '99.9%', icon: 'schedule', color: '#9c27b0', trend: 0.2 }
        ];
    }
    
    return {
      stats: stats,
      recentActivities: [
        { 
          id: 'act1', 
          type: ActivityType.MAINTENANCE,
          action: 'Nueva red creada en Zona Norte',
          user: 'admin',
          timestamp: getTime(5),
          deviceId: 'net123',
          deviceType: FiberDeviceType.OTHER
        },
        { 
          id: 'act2', 
          type: ActivityType.MAINTENANCE,
          action: 'Actualización de firmware en OLT-001',
          user: 'admin',
          timestamp: getTime(60),
          deviceId: 'olt001',
          deviceType: FiberDeviceType.OLT
        },
        { 
          id: 'act3', 
          type: ActivityType.MAINTENANCE,
          action: 'Nuevo cliente agregado: Empresa XYZ',
          user: 'admin',
          timestamp: getTime(120),
          deviceId: 'client456',
          deviceType: FiberDeviceType.OTHER
        },
        { 
          id: 'act4', 
          type: ActivityType.MAINTENANCE,
          action: 'Mantenimiento programado para mañana',
          user: 'admin',
          timestamp: getTime(1440),
          deviceId: 'maintenance001',
          deviceType: FiberDeviceType.OTHER
        },
        { 
          id: 'act5', 
          type: ActivityType.ALERT,
          action: 'Alerta: Alto consumo de ancho de banda en Sector B',
          user: 'sistema',
          timestamp: getTime(30),
          deviceId: 'sector-b',
          deviceType: FiberDeviceType.OTHER
        }
      ],
      alerts: [
        {
          id: 'alert1',
          type: AlertSeverity.WARNING,
          message: 'Alto consumo de ancho de banda en el sector B que podría afectar el servicio.',
          timestamp: getTime(30),
          source: 'Sistema',
          status: 'active',
          deviceId: 'sector-b',
          elementType: FiberDeviceType.OTHER,
          acknowledged: false
        },
        {
          id: 'alert2',
          type: AlertSeverity.ERROR,
          message: 'El dispositivo OLT-003 está offline y no responde a ping.',
          timestamp: getTime(45),
          source: 'Sistema',
          status: 'active',
          deviceId: 'olt003',
          elementType: FiberDeviceType.OLT,
          acknowledged: false
        },
        {
          id: 'alert3',
          type: AlertSeverity.INFO,
          message: 'Hay una actualización de firmware disponible para los dispositivos ONT.',
          timestamp: getTime(120),
          source: 'Sistema',
          status: 'active',
          deviceId: 'system',
          acknowledged: true
        },
        {
          id: 'alert4',
          type: AlertSeverity.CRITICAL,
          message: 'El nodo principal del centro de datos presenta fallos críticos que requieren atención inmediata.',
          timestamp: getTime(15),
          source: 'Sistema',
          status: 'active',
          deviceId: 'main-node',
          elementType: FiberDeviceType.OTHER,
          acknowledged: false
        }
      ],
      performanceMetrics: [
        {
          id: 'metric1',
          name: 'Uso de CPU',
          value: 65,
          unit: '%',
          trend: 2.5,
          timestamp: now,
          status: MetricStatus.NORMAL,
          type: FiberMetricType.SIGNAL_QUALITY,
          history: [
            { value: 62, timestamp: getTime(60) },
            { value: 58, timestamp: getTime(120) },
            { value: 61, timestamp: getTime(180) },
            { value: 65, timestamp: getTime(240) }
          ]
        },
        {
          id: 'metric2',
          name: 'Memoria Disponible',
          value: 28,
          unit: '%',
          trend: -3.5,
          timestamp: now,
          status: MetricStatus.WARNING,
          type: FiberMetricType.SIGNAL_QUALITY,
          history: [
            { value: 35, timestamp: getTime(60) },
            { value: 32, timestamp: getTime(120) },
            { value: 30, timestamp: getTime(180) },
            { value: 28, timestamp: getTime(240) }
          ]
        },
        {
          id: 'metric3',
          name: 'Tráfico de Red',
          value: 85,
          unit: 'Mbps',
          trend: 5.2,
          timestamp: now,
          status: MetricStatus.NORMAL,
          type: FiberMetricType.BANDWIDTH,
          history: [
            { value: 78, timestamp: getTime(60) },
            { value: 82, timestamp: getTime(120) },
            { value: 80, timestamp: getTime(180) },
            { value: 85, timestamp: getTime(240) }
          ]
        },
        {
          id: 'metric4',
          name: 'Latencia',
          value: 120,
          unit: 'ms',
          trend: 15.5,
          timestamp: now,
          status: MetricStatus.CRITICAL,
          type: FiberMetricType.LATENCY,
          history: [
            { value: 85, timestamp: getTime(60) },
            { value: 90, timestamp: getTime(120) },
            { value: 105, timestamp: getTime(180) },
            { value: 120, timestamp: getTime(240) }
          ]
        }
      ]
    };
  }

  // Métricas
  getMetrics(): Observable<FiberMetric[]> {
    return this.metricsSubject.asObservable();
  }

  refreshMetrics(): Observable<FiberMetric[]> {
    this.loadingSubject.next(true);
    return of(this.metricsSubject.value).pipe(
      delay(1000)
    );
  }

  // Alertas
  getAlerts(): Observable<FiberAlert[]> {
    return this.alertsSubject.asObservable();
  }

  getActiveAlerts(): Observable<FiberAlert[]> {
    return this.getAlerts().pipe(
      map(alerts => alerts.filter(alert => !alert.acknowledged))
    );
  }

  refreshAlerts(): Observable<FiberAlert[]> {
    this.loadingSubject.next(true);
    return of(this.alertsSubject.value).pipe(
      delay(1000),
      tap(() => this.loadingSubject.next(false))
    );
  }

  toggleAlertStatus(alertId: string): Observable<FiberAlert> {
    return this.http.patch<FiberAlert>(`${this.apiUrl}/alerts/${alertId}/toggle`, {});
  }

  // Actividades
  getActivities(): Observable<FiberActivity[]> {
    return this.activitiesSubject.asObservable();
  }

  refreshActivities(): Observable<FiberActivity[]> {
    this.loadingSubject.next(true);
    return of(this.activitiesSubject.value).pipe(
      delay(1000)
    );
  }

  // Exportación
  exportDashboard(format: 'pdf' | 'excel'): Observable<boolean> {
    this.loadingSubject.next(true);
    return of(true).pipe(
      delay(2000)
    );
  }

  // Dispositivos
  getDevices(): Observable<FiberDevice[]> {
    return this.http.get<FiberDevice[]>(`${this.apiUrl}/devices`);
  }

  getDeviceById(deviceId: string): Observable<FiberDevice> {
    return this.http.get<FiberDevice>(`${this.apiUrl}/devices/${deviceId}`);
  }

  getDevicesByType(type: FiberDeviceType): Observable<FiberDevice[]> {
    return this.getDevices().pipe(
      map(devices => devices.filter(device => device.type === type))
    );
  }

  createDevice(device: Omit<FiberDevice, 'id'>): Observable<FiberDevice> {
    return this.http.post<FiberDevice>(`${this.apiUrl}/devices`, device);
  }

  updateDevice(deviceId: string, device: Partial<FiberDevice>): Observable<FiberDevice> {
    return this.http.patch<FiberDevice>(`${this.apiUrl}/devices/${deviceId}`, device);
  }

  deleteDevice(deviceId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/devices/${deviceId}`);
  }

  // Segmentos
  getSegments(): Observable<FiberSegment[]> {
    return this.http.get<FiberSegment[]>(`${this.apiUrl}/segments`);
  }

  getSegmentById(segmentId: string): Observable<FiberSegment> {
    return this.http.get<FiberSegment>(`${this.apiUrl}/segments/${segmentId}`);
  }

  createSegment(segment: Omit<FiberSegment, 'id'>): Observable<FiberSegment> {
    return this.http.post<FiberSegment>(`${this.apiUrl}/segments`, segment);
  }

  updateSegment(segmentId: string, segment: Partial<FiberSegment>): Observable<FiberSegment> {
    return this.http.patch<FiberSegment>(`${this.apiUrl}/segments/${segmentId}`, segment);
  }

  deleteSegment(segmentId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/segments/${segmentId}`);
  }

  // Conexiones
  getConnections(): Observable<FiberConnection[]> {
    return this.http.get<FiberConnection[]>(`${this.apiUrl}/connections`);
  }

  getConnectionById(connectionId: string): Observable<FiberConnection> {
    return this.http.get<FiberConnection>(`${this.apiUrl}/connections/${connectionId}`);
  }

  createConnection(connection: Omit<FiberConnection, 'id'>): Observable<FiberConnection> {
    return this.http.post<FiberConnection>(`${this.apiUrl}/connections`, connection);
  }

  updateConnection(connectionId: string, connection: Partial<FiberConnection>): Observable<FiberConnection> {
    return this.http.patch<FiberConnection>(`${this.apiUrl}/connections/${connectionId}`, connection);
  }

  deleteConnection(connectionId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/connections/${connectionId}`);
  }

  // Red completa
  getNetwork(): Observable<FiberNetwork> {
    return this.http.get<FiberNetwork>(`${this.apiUrl}/network`);
  }

  updateNetwork(network: Partial<FiberNetwork>): Observable<FiberNetwork> {
    return this.http.patch<FiberNetwork>(`${this.apiUrl}/network`, network);
  }

  // Métricas
  getNetworkMetrics(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/metrics`);
  }

  getDeviceMetrics(deviceId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/devices/${deviceId}/metrics`);
  }

  getSegmentMetrics(segmentId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/segments/${segmentId}/metrics`);
  }
} 
