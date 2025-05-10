import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { 
  NetworkElement, 
  MonitoringData, 
  ElementType, 
  ElementStatus, 
  GeographicPosition, 
  OLT, 
  Splitter, 
  ONT, 
  PONStandard, 
  SplitterType, 
  SplitterOutputType, 
  Accessibility, 
  FiberType, 
  FiberThread, 
  FiberStrand, 
  StrandColor,
  CableType,
  ConnectorType,
  SpliceType,
  NetworkCapacity,
  QoSProfile,
  AlarmThreshold,
  MaintenanceRecord,
  SLATerms,
  CustomerService,
  OpticalMeasurements,
  RedundancyConfig,
  NetworkDocumentation,
  NetworkAlert
} from '../../../shared/types/network.types';

@Injectable({
  providedIn: 'root'
})
export class NetworkLocalService {
  private elements: NetworkElement[] = [];
  private fiberStrands: FiberStrand[] = [];

  constructor() {
    this.initializeLocalData();
  }

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
        code: 'OLT-001',
        name: 'OLT Principal',
        type: ElementType.OLT,
        status: ElementStatus.ACTIVE,
        position: { 
          coordinates: [-99.1332, 19.4326],
          lat: 19.4326,
          lng: -99.1332
        },
        description: 'OLT principal del centro de datos',
        model: 'ZXA10 C320',
        manufacturer: 'ZTE',
        portCount: 16,
        slotCount: 4,
        ponPorts: 16,
        distributionPorts: 4,
        uplinkPorts: 4,
        supportedPONStandards: [PONStandard.GPON, PONStandard.XGS_PON],
        accessibility: {
          needsPermission: true,
          isLocked: true,
          hasRestrictedAccess: true,
          accessNotes: 'Acceso solo para personal autorizado'
        },
        networkCapacity: {
          totalBandwidth: 100000,
          usedBandwidth: 45000,
          availableBandwidth: 55000,
          maxSubscribers: 1000,
          currentSubscribers: 450
        },
        qosProfiles: qosProfiles,
        alarmThresholds: alarmThresholds,
        performanceHistory: {
          bandwidth: [],
          latency: [],
          packetLoss: [],
          temperature: [],
          power: [],
          signalStrength: [],
          errorRate: []
        },
        redundancy: redundancyConfig,
        maintenanceHistory: [
          {
            id: 'MNT-002',
            date: new Date('2024-01-15'),
            type: 'preventive',
            description: 'Mantenimiento preventivo trimestral',
            technician: 'Juan Pérez',
            technicianId: 'TECH-001',
            cost: 1000,
            parts: [
              {
                id: 'PART-002',
                name: 'Ventilador de repuesto',
                quantity: 1,
                cost: 200
              }
            ],
            beforeMetrics: {
              signalStrength: -15, // Valor típico para OLT
              attenuation: 0.2,
              temperature: 35
            },
            afterMetrics: {
              signalStrength: -14, // Mejora típica después de mantenimiento
              attenuation: 0.15,
              temperature: 30
            },
            photos: ['photo3.jpg', 'photo4.jpg'],
            notes: 'Mantenimiento realizado según plan'
          }
        ],
        documentation: networkDocumentation,
        technicalSpecs: {
          firmwareVersion: 'V2.1.0',
          hardwareVersion: 'HW1.0',
          maxPowerConsumption: 500,
          operatingTemperature: {
            min: 0,
            max: 45,
            optimal: 25
          },
          humidityRange: {
            min: 10,
            max: 90
          },
          rackUnits: 4,
          weight: 15
        },
        security: {
          accessControl: true,
          authentication: ['password', 'certificate'],
          encryption: ['AES-256'],
          lastSecurityAudit: new Date('2024-01-15'),
          securityVulnerabilities: [
            {
              id: 'VULN-001',
              severity: 'low',
              description: 'Versión de firmware desactualizada',
              status: 'resolved',
              resolutionDate: new Date('2024-01-20')
            }
          ]
        },
        powerSupply: {
          primary: true,
          backup: true,
          batteryStatus: 100,
          lastMaintenance: new Date('2024-01-15')
        },
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-03-15')
      } as OLT,
      {
        id: '2',
        code: 'SPL-001',
        name: 'Splitter Principal',
        type: ElementType.SPLITTER,
        status: ElementStatus.ACTIVE,
        position: { coordinates: [-99.1333, 19.4327] },
        description: 'Splitter 1:32 para distribución',
        splitterType: SplitterType.DISTRIBUTION,
        splitRatio: '1:32',
        insertionLossDb: 15.5, // Pérdida típica para splitter 1:32
        level: 1,
        totalPorts: 32,
        usedPorts: 16,
        supportedPONStandards: [PONStandard.GPON, PONStandard.XGS_PON],
        wavelengthRangeSupport: {
          min: 1260,
          max: 1650,
          optimizedFor: [1310, 1490, 1550]
        },
        outputType: SplitterOutputType.BALANCED,
        accessibility: {
          needsPermission: true,
          isLocked: true,
          hasRestrictedAccess: true,
          accessNotes: 'Acceso solo para personal autorizado'
        },
        physicalLocation: {
          building: 'Centro de Datos Principal',
          room: 'Sala de Equipos',
          rack: 'Rack-01',
          position: 'U-23'
        },
        maintenanceHistory: [
          {
            id: 'MNT-003',
            date: new Date('2024-01-15'),
            type: 'preventive',
            description: 'Mantenimiento preventivo trimestral',
            technician: 'Juan Pérez',
            technicianId: 'TECH-001',
            cost: 300,
            parts: [
              {
                id: 'PART-003',
                name: 'Conector SC',
                quantity: 4,
                cost: 100
              }
            ],
            beforeMetrics: {
              signalStrength: -20, // Valor típico para splitter
              attenuation: 0.2,
              temperature: 25
            },
            afterMetrics: {
              signalStrength: -19, // Mejora típica después de mantenimiento
              attenuation: 0.15,
              temperature: 24
            },
            photos: ['photo5.jpg', 'photo6.jpg'],
            notes: 'Mantenimiento realizado según plan'
          }
        ],
        documentation: networkDocumentation,
        technicalSpecs: {
          insertionLoss: 15.5,
          returnLoss: 50,
          directivity: 55,
          uniformity: 0.5,
          polarizationDependentLoss: 0.1,
          operatingTemperature: {
            min: -40,
            max: 85
          },
          humidityRange: {
            min: 0,
            max: 95
          }
        },
        qualityMetrics: {
          lastTestDate: new Date('2024-02-15'),
          testResults: [
            {
              portNumber: 1,
              insertionLoss: 15.5,
              returnLoss: 50,
              uniformity: 0.5
            }
          ],
          testEquipment: 'OTDR EXFO FTB-200',
          testTechnician: 'Carlos Rodríguez'
        },
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-03-15')
      } as Splitter,
      {
        id: '3',
        code: 'ONT-001',
        name: 'ONT Cliente 1',
        type: ElementType.ONT,
        status: ElementStatus.ACTIVE,
        position: { coordinates: [-99.1334, 19.4328] },
        description: 'ONT para cliente residencial',
        serialNumber: 'ONT123456',
        model: 'ZXHN F670',
        manufacturer: 'ZTE',
        ponStandard: PONStandard.GPON,
        bandwidth: {
          downstreamCapacity: 2.5, // Capacidad típica para GPON
          upstreamCapacity: 1.25
        },
        accessibility: {
          needsPermission: false,
          isLocked: false,
          hasRestrictedAccess: false,
          accessNotes: 'Acceso para el cliente'
        },
        customerService: customerService,
        maintenanceHistory: [
          {
            id: 'MNT-004',
            date: new Date('2024-01-15'),
            type: 'preventive',
            description: 'Mantenimiento preventivo trimestral',
            technician: 'Juan Pérez',
            technicianId: 'TECH-001',
            cost: 200,
            parts: [
              {
                id: 'PART-004',
                name: 'Conector SC',
                quantity: 1,
                cost: 25
              }
            ],
            beforeMetrics: {
              signalStrength: -25, // Valor típico para ONT
              attenuation: 0.2,
              temperature: 25
            },
            afterMetrics: {
              signalStrength: -24, // Mejora típica después de mantenimiento
              attenuation: 0.15,
              temperature: 24
            },
            photos: ['photo7.jpg', 'photo8.jpg'],
            notes: 'Mantenimiento realizado según plan'
          }
        ],
        documentation: networkDocumentation,
        technicalSpecs: {
          firmwareVersion: 'V1.2.0',
          hardwareVersion: 'HW1.0',
          maxPowerConsumption: 12,
          operatingTemperature: {
            min: 0,
            max: 40
          },
          humidityRange: {
            min: 10,
            max: 90
          },
          dimensions: {
            width: 100,
            height: 100,
            depth: 30
          },
          weight: 0.5
        },
        qualityMetrics: {
          signalStrength: -24,
          transmitPower: -1,
          receivePower: -20,
          lastTestDate: new Date('2024-02-15'),
          testEquipment: 'OTDR EXFO FTB-200',
          testTechnician: 'Carlos Rodríguez'
        },
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-03-15')
      } as ONT,
      {
        id: '4',
        code: 'FIB-001',
        name: 'Hilo de Fibra Principal',
        type: ElementType.FIBER_THREAD,
        status: ElementStatus.ACTIVE,
        position: { coordinates: [-99.1335, 19.4329] },
        description: 'Hilo de fibra principal entre OLT y Splitter',
        fiberType: FiberType.SINGLE_MODE,
        length: 500,
        attenuationDb: 0.2, // Pérdida típica para fibra monomodo
        sourceElementId: '1',
        targetElementId: '2',
        route: [
          { coordinates: [-99.1332, 19.4326] },
          { coordinates: [-99.1333, 19.4327] }
        ],
        installationDate: new Date('2024-01-01'),
        accessibility: {
          needsPermission: true,
          isLocked: true,
          hasRestrictedAccess: true,
          accessNotes: 'Acceso solo para personal autorizado'
        },
        cableType: CableType.UNDERGROUND,
        splices: [
          {
            id: 'SPL-001',
            type: SpliceType.FUSION,
            location: { coordinates: [-99.13325, 19.43265] },
            loss: 0.1, // Pérdida típica para empalme de fusión
            date: new Date('2024-01-01'),
            technician: 'Carlos Rodríguez'
          }
        ],
        connectors: [
          {
            id: 'CON-001',
            type: ConnectorType.SC,
            location: { coordinates: [-99.1332, 19.4326] },
            loss: 0.2, // Pérdida típica para conector SC
            installationDate: new Date('2024-01-01'),
            lastCleaningDate: new Date('2024-02-15')
          },
          {
            id: 'CON-002',
            type: ConnectorType.SC,
            location: { coordinates: [-99.1333, 19.4327] },
            loss: 0.2, // Pérdida típica para conector SC
            installationDate: new Date('2024-01-01'),
            lastCleaningDate: new Date('2024-02-15')
          }
        ],
        maxDistance: 1000,
        currentDistance: 500,
        bendRadius: 30,
        tensileStrength: 100,
        environmentalRating: 'IP67',
        maintenanceHistory: [
          {
            id: 'MNT-005',
            date: new Date('2024-01-15'),
            type: 'preventive',
            description: 'Mantenimiento preventivo trimestral',
            technician: 'Juan Pérez',
            technicianId: 'TECH-001',
            cost: 300,
            parts: [
              {
                id: 'PART-005',
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
              signalStrength: -19,
              attenuation: 0.15,
              temperature: 24
            },
            photos: ['photo9.jpg', 'photo10.jpg'],
            notes: 'Mantenimiento realizado según plan'
          }
        ],
        opticalMeasurements: opticalMeasurements,
        redundancy: redundancyConfig,
        documentation: networkDocumentation,
        physicalProperties: {
          bendRadius: 30,
          tensileStrength: 100,
          environmentalRating: 'IP67',
          jacketType: 'LSZH',
          installationType: 'underground',
          maxDistance: 1000,
          currentDistance: 500
        },
        qualityMetrics: {
          otdrTrace: 'traces/otdr_trace_001.pdf',
          insertionLoss: 0.2,
          returnLoss: 50,
          endToEndLoss: 0.4,
          lastTestDate: new Date('2024-02-15'),
          testEquipment: 'OTDR EXFO FTB-200',
          testTechnician: 'Carlos Rodríguez'
        },
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-03-15')
      } as FiberThread
    ];

    // Crear algunos hilos de fibra de ejemplo
    this.fiberStrands = [
      {
        id: '5',
        cableId: 'CAB-001',
        strandNumber: 1,
        color: StrandColor.BLUE,
        type: FiberType.SINGLE_MODE,
        status: ElementStatus.ACTIVE,
        length: 500,
        attenuation: 0.2,
        sourceElementId: '1',
        targetElementId: '2',
        isSpare: false
      }
    ];
  }

  getNetworkElements(): Observable<NetworkElement[]> {
    return of(this.elements);
  }

  getElement(id: string): Observable<NetworkElement | null> {
    const element = this.elements.find(e => e.id === id);
    return of(element || null);
  }

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

  deleteElement(id: string): Observable<boolean> {
    const index = this.elements.findIndex(e => e.id === id);
    if (index !== -1) {
      this.elements.splice(index, 1);
      return of(true);
    }
    return of(false);
  }

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
        severity: 'warning',
        title: 'Alto uso de ancho de banda',
        message: 'El uso de ancho de banda excede el 80% de la capacidad',
        timestamp: new Date(),
        resolved: false
      });
    }
    if (baseMetrics.temperature > 35) {
      alerts.push({
        id: 'ALM-002',
        elementId,
        elementType: element.type,
        deviceType: 'general',
        severity: 'critical',
        title: 'Temperatura elevada',
        message: 'La temperatura del dispositivo es superior a 35°C',
        timestamp: new Date(),
        resolved: false
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