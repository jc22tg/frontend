import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { 
  NetworkElement, 
  MonitoringData, 
  ElementType, 
  ElementStatus, 
  PONStandard, 
  SplitterType, 
  SplitterOutputType, 
  StrandColor,
  CableType,
  ConnectorType,
  SpliceType,
  NetworkAlert
} from '../../../shared/types/network.types';
import { GeographicPosition } from '../../../shared/types/geo-position';
import { OLT, Splitter, ONT, FiberThread, FiberStrand } from '../../../shared/types/network-elements';
import {
  QoSProfile,
  AlarmThreshold,
  SLATerms,
  CustomerService,
  OpticalMeasurements,
  RedundancyConfig,
  NetworkDocumentation,
  MaintenanceRecord,
  NetworkCapacity,
  Accessibility
} from '../../../shared/types/network-aux.types';

/**
 * Servicio local para la gestión y simulación de elementos de red y datos de monitoreo.
 * Proporciona datos de ejemplo y operaciones CRUD en memoria para elementos de red,
 * así como generación de datos de monitoreo simulados.
 * Utilizado principalmente para pruebas, desarrollo y prototipado sin backend real.
 */
@Injectable({
  providedIn: 'root'
})
/**
 * Servicio que gestiona elementos de red y datos de monitoreo de forma local (en memoria).
 */
export class NetworkLocalService {
  /**
   * Lista de elementos de red simulados.
   */
  private elements: NetworkElement[] = [];
  /**
   * Lista de hilos de fibra simulados.
   */
  private fiberStrands: FiberStrand[] = [];

  constructor() {
    this.initializeLocalData();
  }

  /**
   * Inicializa los datos locales de ejemplo para elementos de red, hilos de fibra,
   * perfiles QoS, umbrales de alarma, términos SLA, servicios de cliente, mediciones ópticas,
   * configuración de redundancia y documentación de red.
   */
  private initializeLocalData(): void {
    // Crear perfiles QoS
    const qosProfiles: QoSProfile[] = [
      {
        id: 'qos-1',
        name: 'Premium',
        guaranteedBandwidth: 1000,
        maxBandwidth: 2000,
        priority: 1,
        latency: 5,
        jitter: 1,
        packetLoss: 0.1
      },
      {
        id: 'qos-2',
        name: 'Business',
        guaranteedBandwidth: 500,
        maxBandwidth: 1000,
        priority: 2,
        latency: 10,
        jitter: 2,
        packetLoss: 0.2
      },
      {
        id: 'qos-3',
        name: 'Residential',
        guaranteedBandwidth: 100,
        maxBandwidth: 500,
        priority: 3,
        latency: 20,
        jitter: 5,
        packetLoss: 0.5
      }
    ];

    // Crear umbrales de alarma
    const alarmThresholds: AlarmThreshold[] = [
      {
        metric: 'bandwidth',
        warning: 80,
        critical: 90,
        unit: '%'
      },
      {
        metric: 'latency',
        warning: 50,
        critical: 100,
        unit: 'ms'
      },
      {
        metric: 'packetLoss',
        warning: 1,
        critical: 5,
        unit: '%'
      },
      {
        metric: 'temperature',
        warning: 35,
        critical: 40,
        unit: '°C'
      },
      {
        metric: 'power',
        warning: -15,
        critical: -20,
        unit: 'dBm'
      }
    ];

    // Crear términos SLA
    const slaTerms: SLATerms = {
      id: 'sla-1',
      name: 'SLA Premium',
      uptime: 99.99,
      responseTime: 30,
      resolutionTime: 120,
      bandwidth: {
        guaranteed: 1000,
        burst: 2000
      },
      penalties: [
        {
          amount: 1000,
          conditions: ['uptime < 99.9%', 'responseTime > 30min']
        }
      ]
    };

    // Crear servicio de cliente
    const customerService: CustomerService = {
      id: 'cs-1',
      customerId: 'CUST-001',
      type: 'business',
      sla: slaTerms,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2025-01-01'),
      status: 'active',
      incidents: [
        {
          id: 'INC-001',
          date: new Date('2024-02-15'),
          type: 'service_interruption',
          description: 'Corte de fibra por obra civil',
          resolution: 'Reparación de fibra y empalme',
          downtime: 120
        }
      ],
      maintenanceHistory: [
        {
          id: 'MNT-001',
          date: new Date('2024-01-15'),
          type: 'preventive',
          description: 'Mantenimiento preventivo trimestral',
          technician: 'Juan Pérez',
          technicianId: 'TECH-001',
          cost: 500,
          parts: [
            {
              id: 'PART-001',
              name: 'Conector SC',
              quantity: 2,
              cost: 50
            }
          ],
          beforeMetrics: {
            signalStrength: -20,
            attenuation: 0.2,
            temperature: 25
          },
          afterMetrics: {
            signalStrength: -18,
            attenuation: 0.15,
            temperature: 24
          },
          photos: ['photo1.jpg', 'photo2.jpg'],
          notes: 'Mantenimiento realizado según plan'
        }
      ]
    };

    // Crear mediciones ópticas con valores más realistas
    const opticalMeasurements: OpticalMeasurements = {
      reflectance: -45, // Valor típico para empalmes de fusión
      chromaticDispersion: 17, // Valor típico para fibra monomodo
      polarizationModeDispersion: 0.1, // Valor típico para fibra monomodo
      bendingLoss: 0.05, // Pérdida típica por curvatura
      lastMeasurementDate: new Date('2024-02-15'),
      measurementEquipment: 'OTDR EXFO FTB-200',
      technician: 'Carlos Rodríguez',
      location: { 
        coordinates: [-99.13325, 19.43265],
        lat: 19.43265,
        lng: -99.13325
      },
      photos: ['otdr_trace.jpg']
    };

    // Crear configuración de redundancia con valores más realistas
    const redundancyConfig: RedundancyConfig = {
      isRedundant: true,
      primaryPath: 'PATH-001',
      backupPath: 'PATH-002',
      failoverTime: 50, // Tiempo típico de conmutación en ms
      automaticFailover: true,
      lastFailoverTest: new Date('2024-02-01'),
      failoverHistory: [
        {
          date: new Date('2024-01-15'),
          reason: 'Corte de fibra principal',
          duration: 45,
          resolution: 'Conmutación automática a ruta de respaldo'
        }
      ],
      powerBackup: {
        ups: true,
        generator: true,
        batteryRuntime: 240, // 4 horas de respaldo
        lastBatteryTest: new Date('2024-02-01'),
        batteryStatus: 100
      }
    };

    // Crear documentación de red
    const networkDocumentation: NetworkDocumentation[] = [
      {
        id: 'DOC-001',
        type: 'network_diagram',
        title: 'Diagrama de Red Principal',
        description: 'Diagrama detallado de la red de fibra óptica',
        fileUrl: 'diagrams/main_network.pdf',
        uploadDate: new Date('2024-01-01'),
        uploadedBy: 'Admin',
        version: '1.0',
        tags: ['diagram', 'network', 'fiber'],
        relatedElements: ['1', '2', '3', '4']
      },
      {
        id: 'DOC-002',
        type: 'technical_drawing',
        title: 'Plano de Instalación',
        description: 'Plano detallado de la instalación de fibra',
        fileUrl: 'drawings/installation_plan.pdf',
        uploadDate: new Date('2024-01-01'),
        uploadedBy: 'Admin',
        version: '1.0',
        tags: ['drawing', 'installation', 'fiber'],
        relatedElements: ['1', '2', '3', '4']
      }
    ];

    // Crear elementos de red de ejemplo con valores más realistas
    this.elements = [
      {
        id: '1',
        name: 'OLT Principal',
        type: ElementType.OLT,
        status: ElementStatus.ACTIVE,
        position: { coordinates: [-99.1332, 19.4326], lat: 19.4326, lng: -99.1332 },
        description: 'OLT principal del centro de datos',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-03-15'),
        properties: {
          code: 'OLT-001',
          model: 'ZXA10 C320',
          manufacturer: 'ZTE',
          portCount: 16
        }
      },
      {
        id: '2',
        name: 'Splitter Principal',
        type: ElementType.SPLITTER,
        status: ElementStatus.ACTIVE,
        position: { coordinates: [-99.1333, 19.4327], lat: 19.4327, lng: -99.1333 },
        description: 'Splitter 1:32 para distribución',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-03-15'),
        properties: {
          splitRatio: '1:32',
          insertionLossDb: 15.5
        }
      },
      {
        id: '3',
        name: 'ONT Cliente 1',
        type: ElementType.ONT,
        status: ElementStatus.ACTIVE,
        position: { coordinates: [-99.1334, 19.4328], lat: 19.4328, lng: -99.1334 },
        description: 'ONT para cliente residencial',
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-03-15'),
        properties: {
          serialNumber: 'ONT123456',
          manufacturer: 'ZTE'
        }
      },
      {
        id: '4',
        name: 'Hilo de Fibra Principal',
        type: ElementType.FIBER_THREAD,
        status: ElementStatus.ACTIVE,
        position: { coordinates: [-99.1335, 19.4329], lat: 19.4329, lng: -99.1335 },
        description: 'Hilo de fibra principal entre OLT y Splitter',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-03-15'),
        properties: {
          fiberType: 'SINGLE_MODE',
          length: 500
        }
      }
    ];

    // Crear algunos hilos de fibra de ejemplo
    this.fiberStrands = [
      {
        id: '5',
        cableId: 'CAB-001',
        strandNumber: 1,
        color: StrandColor.BLUE,
        type: ElementType.FIBER_STRAND,
        status: ElementStatus.ACTIVE,
        length: 500,
        attenuation: 0.2,
        sourceElementId: '1',
        targetElementId: '2',
        isSpare: false
      }
    ];
  }

  /**
   * Obtiene la lista de elementos de red simulados.
   * @returns Observable con el arreglo de elementos de red.
   */
  getNetworkElements(): Observable<NetworkElement[]> {
    return of(this.elements);
  }

  /**
   * Busca un elemento de red por su ID.
   * @param id ID del elemento a buscar.
   * @returns Observable con el elemento encontrado o null si no existe.
   */
  getElement(id: string): Observable<NetworkElement | null> {
    const element = this.elements.find(e => e.id === id);
    return of(element || null);
  }

  /**
   * Guarda (crea o actualiza) un elemento de red en la lista local.
   * @param element Elemento de red a guardar.
   * @returns Observable con el elemento guardado (nuevo o actualizado).
   */
  saveElement(element: NetworkElement): Observable<NetworkElement> {
    if (element.id) {
      // Actualizar elemento existente
      const index = this.elements.findIndex(e => e.id === element.id);
      if (index !== -1) {
        this.elements[index] = { ...element, updatedAt: new Date() };
        return of(this.elements[index]);
      }
    }
    
    // Crear nuevo elemento
    const newElement = {
      ...element,
      id: (this.elements.length + 1).toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.elements.push(newElement);
    return of(newElement);
  }

  /**
   * Elimina un elemento de red por su ID.
   * @param id ID del elemento a eliminar.
   * @returns Observable con true si se eliminó, false si no se encontró.
   */
  deleteElement(id: string): Observable<boolean> {
    const index = this.elements.findIndex(e => e.id === id);
    if (index !== -1) {
      this.elements.splice(index, 1);
      return of(true);
    }
    return of(false);
  }

  /**
   * Genera y obtiene datos de monitoreo simulados para un elemento de red.
   * Incluye métricas y posibles alertas según los valores generados.
   * @param elementId ID del elemento de red.
   * @returns Observable con los datos de monitoreo generados.
   */
  getMonitoringData(elementId: string): Observable<MonitoringData> {
    const element = this.elements.find(e => e.id === elementId);
    if (!element) {
      return of({
        elementId,
        elementType: ElementType.OLT, // Valor por defecto
        timestamp: new Date(),
        utilizationPercentage: 0,
        status: ElementStatus.UNKNOWN,
        metrics: {
          bandwidth: 0,
          latency: 0, 
          packetLoss: 0,
          temperature: 0,
          power: 0,
          signalStrength: 0,
          errorRate: 0
        }
      });
    }

    // Generar datos de monitoreo realistas basados en el tipo de elemento
    const baseMetrics = {
      bandwidth: Math.floor(Math.random() * 1000),
      latency: Math.floor(Math.random() * 50),
      packetLoss: Math.random() * 5,
      temperature: Math.floor(20 + Math.random() * 15),
      power: Math.floor(Math.random() * 100),
      signalStrength: Math.floor(Math.random() * 100),
      errorRate: Math.random() * 2
    };

    // Ajustar métricas según el tipo de elemento
    if (element.type === ElementType.OLT) {
      baseMetrics.bandwidth = Math.floor(Math.random() * 10000);
      baseMetrics.power = Math.floor(Math.random() * 1000);
      baseMetrics.temperature = Math.floor(30 + Math.random() * 20);
    } else if (element.type === ElementType.ONT) {
      baseMetrics.bandwidth = Math.floor(Math.random() * 100);
      baseMetrics.power = Math.floor(Math.random() * 10);
      baseMetrics.temperature = Math.floor(25 + Math.random() * 10);
    }

    // Generar alarmas si las métricas exceden los umbrales
    const alerts: NetworkAlert[] = [];
    if (baseMetrics.bandwidth > 80) {
      alerts.push({
        id: 'ALM-001',
        elementId,
        elementType: element.type,
        deviceType: 'general',
        severity: 'MEDIUM',
        title: 'Alto uso de ancho de banda',
        message: 'El uso de ancho de banda excede el 80% de la capacidad',
        timestamp: new Date(),
        resolved: false,
        acknowledged: false
      });
    }
    if (baseMetrics.temperature > 35) {
      alerts.push({
        id: 'ALM-002',
        elementId,
        elementType: element.type,
        deviceType: 'general',
        severity: 'CRITICAL',
        title: 'Temperatura elevada',
        message: 'La temperatura del dispositivo es superior a 35°C',
        timestamp: new Date(),
        resolved: false,
        acknowledged: false
      });
    }

    // Calcular utilización basada en ancho de banda (0-100%)
    const utilizationPercentage = Math.min(Math.floor(baseMetrics.bandwidth / 100), 100);

    return of({
      elementId,
      elementType: element.type,
      timestamp: new Date(),
      utilizationPercentage,
      status: element.status,
      metrics: baseMetrics,
      alerts: alerts.length > 0 ? alerts : undefined
    });
  }
} 
