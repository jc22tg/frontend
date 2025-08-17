import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { NetworkElement, ElementStatus, MonitoringData, NetworkAlert, ElementType } from '../../../shared/types/network.types';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MonitoringService {
  private monitoringDataSubject = new BehaviorSubject<Record<string, MonitoringData>>({});
  private alerts = new BehaviorSubject<NetworkAlert[]>([]);
  private networkHealthSubject = new BehaviorSubject<number>(0);

  constructor(private http: HttpClient) {
    this.initializeMonitoring();
    // Cargar alertas de ejemplo inicialmente
    this.loadSampleAlerts();
  }

  private initializeMonitoring(): void {
    // Inicializar monitoreo
    this.startMonitoring();
  }

  private startMonitoring(): void {
    // Lógica para iniciar el monitoreo
    setInterval(() => {
      this.updateMonitoringData();
      this.checkNetworkHealth();
      this.processAlerts();
    }, 5000); // Actualizar cada 5 segundos
  }

  private updateMonitoringData(): void {
    // Lógica para actualizar datos de monitoreo
    // TODO: Implementar lógica real de monitoreo
  }

  private checkNetworkHealth(): void {
    // Lógica para verificar la salud de la red
    // TODO: Implementar lógica real de verificación
  }

  private processAlerts(): void {
    // Lógica para procesar alertas
    // TODO: Implementar lógica real de procesamiento
  }

  // Métodos públicos para componentes

  getMonitoringData(elementId: string): Observable<MonitoringData | null> {
    return this.monitoringDataSubject.pipe(
      map(data => data[elementId] || null)
    );
  }

  getAllMonitoringData(): Observable<Record<string, MonitoringData>> {
    return this.monitoringDataSubject.asObservable();
  }

  getAlerts(limit?: number): Observable<NetworkAlert[]> {
    return this.alerts.asObservable().pipe(
      map(alerts => {
        if (limit && limit > 0) {
          return alerts.slice(0, limit);
        }
        return alerts;
      })
    );
  }

  getNetworkHealth(): Observable<number> {
    return this.networkHealthSubject.asObservable();
  }

  /**
   * Obtiene métricas generales de la red
   * @returns Observable con métricas de la red
   */
  getMetrics(): Observable<any> {
    // Si useMocks está activado en environment, usar datos locales
    if (environment.useMocks) {
      return this.monitoringDataSubject.pipe(
        map(data => {
          // Calcular métricas a partir de los datos de monitoreo locales
          const metrics = {
            elementCount: Object.keys(data).length || 10,
            connectionCount: 15, // Valor simulado
            utilization: this.calculateNetworkUtilization(data) || 65,
            health: this.networkHealthSubject.getValue() || 85
          };
          return metrics;
        })
      );
    }
    
    // Usar HTTP para obtener datos reales de la API
    return this.http.get<any>(`${environment.apiUrl}/monitoring/metrics`).pipe(
      map(response => {
        // Asegurar que los datos tienen el formato esperado 
        const metrics = {
          elementCount: response?.elementCount || 0,
          connectionCount: response?.connectionCount || 0,
          utilization: response?.utilization || 0,
          health: response?.health || 0
        };
        
        // Actualizar el subject de salud de la red
        if (response?.health) {
          this.networkHealthSubject.next(response.health);
        }
        
        return metrics;
      }),
      // En caso de error, volver a los datos locales
      catchError(error => {
        console.error('Error al obtener métricas de la API:', error);
        
        // Generar datos simulados como respaldo
        return this.monitoringDataSubject.pipe(
          map(data => {
            return {
              elementCount: Object.keys(data).length || 10,
              connectionCount: 15, // Valor simulado
              utilization: this.calculateNetworkUtilization(data) || 65,
              health: this.networkHealthSubject.getValue() || 85
            };
          })
        );
      })
    );
  }

  /**
   * Calcula la utilización de la red basada en los datos de monitoreo
   * @param data Datos de monitoreo
   * @returns Porcentaje de utilización (0-100)
   */
  private calculateNetworkUtilization(data: Record<string, MonitoringData>): number {
    // Implementación de ejemplo - en un caso real se basaría en métricas reales
    if (Object.keys(data).length === 0) return 0;
    
    let totalUtilization = 0;
    let itemCount = 0;
    
    Object.values(data).forEach(item => {
      if (item && typeof item === 'object') {
        // Comprobar si tiene alguna propiedad de utilización
        const utilizationValue = 
          item.utilizationPercentage || 
          (item as any).utilization || 
          (item as any).usagePercentage || 
          0;
        
        if (utilizationValue !== undefined) {
          totalUtilization += utilizationValue;
          itemCount++;
        }
      }
    });
    
    return itemCount > 0 ? totalUtilization / itemCount : 0;
  }

  // Métodos para gestión de alertas

  addAlert(alert: Omit<NetworkAlert, 'id'>): void {
    // Verificar que existe el campo title que es obligatorio
    if (!alert.title) {
      console.warn('Se intentó crear una alerta sin título. Se usará el mensaje como título.');
      alert = { ...alert, title: alert.message || 'Alerta sin título' };
    }
    
    const newAlert: NetworkAlert = {
      ...alert,
      id: Date.now().toString(),
      timestamp: new Date(),
      resolved: false,
      acknowledged: false
    };

    const currentAlerts = this.alerts.getValue();
    this.alerts.next([...currentAlerts, newAlert]);
  }

  resolveAlert(id: string): void {
    const currentAlerts = this.alerts.getValue();
    const updatedAlerts = currentAlerts.map(alert => 
      alert.id === id ? { ...alert, resolved: true } : alert
    );
    this.alerts.next(updatedAlerts);
  }

  reopenAlert(id: string): void {
    const currentAlerts = this.alerts.getValue();
    const updatedAlerts = currentAlerts.map(alert => 
      alert.id === id ? { ...alert, resolved: false } : alert
    );
    this.alerts.next(updatedAlerts);
  }

  removeAlert(id: string): void {
    const currentAlerts = this.alerts.getValue();
    const filteredAlerts = currentAlerts.filter(alert => alert.id !== id);
    this.alerts.next(filteredAlerts);
  }

  clearAllAlerts(): void {
    this.alerts.next([]);
  }

  // Métodos para configuración

  setMonitoringInterval(interval: number): void {
    // Configurar intervalo de monitoreo
  }

  setAlertThresholds(thresholds: any): void {
    // Configurar umbrales de alerta
  }

  // Métodos para exportación de datos

  exportMonitoringData(): void {
    // Exportar datos de monitoreo
  }

  exportAlerts(): void {
    // Exportar alertas
  }

  // Métodos para limpieza

  clearMonitoringData(): void {
    this.monitoringDataSubject.next({});
  }

  private loadSampleAlerts(): void {
    const sampleAlerts: NetworkAlert[] = [
      {
        id: '1',
        elementId: 'OLT-001',
        elementType: ElementType.OLT,
        type: 'CRITICAL',
        deviceType: 'olt',
        severity: 'CRITICAL',
        title: 'Fallo de conectividad en OLT',
        message: 'OLT-001 ha reportado fallo de conectividad',
        timestamp: new Date(Date.now() - 120000),
        resolved: false,
        acknowledged: false
      },
      {
        id: '2',
        elementId: 'FDP-003',
        elementType: ElementType.FDP,
        type: 'WARNING',
        deviceType: 'general',
        severity: 'MEDIUM',
        title: 'Señal degradada en FDP',
        message: 'Señal de fibra degradada en conexión FDP-003 a ONT-005',
        timestamp: new Date(Date.now() - 3600000),
        resolved: false,
        acknowledged: false
      },
      {
        id: '3',
        elementId: 'SECTOR-NORTE',
        elementType: ElementType.TERMINAL_BOX,
        type: 'INFO',
        deviceType: 'general',
        severity: 'LOW',
        title: 'Mantenimiento programado',
        message: 'Mantenimiento programado para el sector norte el 15/06/2023',
        timestamp: new Date(Date.now() - 86400000),
        resolved: true,
        acknowledged: true
      },
      {
        id: '4',
        elementId: 'SPL-002',
        elementType: ElementType.SPLITTER,
        type: 'WARNING',
        deviceType: 'splitter',
        severity: 'MEDIUM',
        title: 'Capacidad límite en Splitter',
        message: 'Splitter SPL-002 alcanzando límite de capacidad (85%)',
        timestamp: new Date(Date.now() - 7200000),
        resolved: false,
        acknowledged: false
      }
    ];

    this.alerts.next(sampleAlerts);
  }

  /**
   * Obtiene alertas de prueba para simulación
   */
  private getTestAlerts(): NetworkAlert[] {
    const currentTime = new Date();
    return [
      {
        id: 'alert-001',
        elementId: 'olt-001',
        elementType: ElementType.OLT,
        type: 'CRITICAL',
        title: 'Pérdida de conexión OLT',
        severity: 'CRITICAL',
        message: 'Pérdida de conexión con OLT principal',
        timestamp: new Date(currentTime.getTime() - 30 * 60000),
        acknowledged: false,
        details: {
          reason: 'No responde a ICMP',
          affectedCustomers: 120
        }
      },
      {
        id: 'alert-002',
        elementId: 'edfa-001',
        elementType: ElementType.EDFA,
        type: 'ERROR',
        title: 'Temperatura elevada EDFA',
        severity: 'HIGH',
        message: 'Temperatura elevada en amplificador EDFA',
        timestamp: new Date(currentTime.getTime() - 120 * 60000),
        acknowledged: true,
        acknowledgedBy: 'admin',
        acknowledgedAt: new Date(currentTime.getTime() - 90 * 60000),
        details: {
          temperature: 75,
          threshold: 70
        }
      },
      {
        id: 'alert-003',
        elementId: 'splitter-002',
        elementType: ElementType.SPLITTER,
        type: 'WARNING',
        title: 'Degradación de señal',
        severity: 'MEDIUM',
        message: 'Degradación de señal en divisor óptico',
        timestamp: new Date(currentTime.getTime() - 180 * 60000),
        acknowledged: false,
        details: {
          signalLoss: '7.2dB',
          expectedLoss: '3.5dB'
        }
      },
      {
        id: 'alert-004',
        elementId: 'conn-001',
        elementType: ElementType.FIBER_CONNECTION,
        type: 'INFO',
        title: 'Fluctuación de potencia',
        severity: 'LOW',
        message: 'Fluctuación de potencia óptica detectada',
        timestamp: new Date(currentTime.getTime() - 240 * 60000),
        acknowledged: false
      }
    ];
  }
} 
