/**
 * Interfaces extendidas para elementos de red
 * 
 * Este archivo define las interfaces mejoradas para los elementos de red
 * conforme a estándares de la industria y mejores prácticas
 */

import {
  ElementType,
  ElementStatus,
  PONStandard,
  PONAuthenticationMethod,
  PONEncryptionMethod,
  GeographicPosition,
  FiberType,
  CableType,
} from './unified-network-types';

// Importar enums desde common-definitions
import {
  FiberType as CommonFiberType,
  CableType as CommonCableType,
  ConnectorType as CommonConnectorType,
} from '@common-definitions/enums/network.enums';

// Re-exportamos los tipos importantes para que estén disponibles al importar este módulo
export { ElementType, ElementStatus, FiberType, CableType };

/**
 * Certificación de elementos
 */
export interface Certification {
  id: string;
  type: 'OTDR' | 'POWER_METER' | 'VISUAL' | 'CONTINUITY' | 'LOSS' | 'OTHER';
  date: Date;
  technician: string;
  result: 'PASS' | 'FAIL' | 'WARNING';
  measurements: Record<string, number>;
  fileRefs?: string[];
  notes?: string;
  validUntil?: Date;
}

/**
 * Entrada de historial de auditoría
 */
export interface AuditEntry {
  timestamp: Date;
  user: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'STATUS_CHANGE';
  details: string;
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
}

/**
 * Adjunto (fotos, documentos, etc.)
 */
export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  description?: string;
  uploadDate: Date;
  uploadedBy?: string;
  category?: 'PHOTO' | 'DOCUMENT' | 'CERTIFICATE' | 'MEASUREMENT' | 'OTHER';
}

/**
 * Elemento base con estructura mejorada
 */
export interface ExtendedNetworkElement {
  id: string;
  code: string;
  name: string;
  type: ElementType;
  status: ElementStatus;
  description?: string;
  position: GeographicPosition;
  installationDate?: Date;
  lastMaintenance?: Date;
  nextMaintenance?: Date;
  warrantyExpiration?: Date;
  metadata?: {
    manufacturer?: string; // Movido de technical para consistencia con otros elementos
    model?: string;      // Movido de technical
    serialNumber?: string; // Movido de technical
    manufacturerPartNumber?: string;
    firmware?: string;
    hardwareVersion?: string;
    [key: string]: any; // Para otras propiedades de metadatos
  };
  projectId?: string;
  ownerId?: string;
  maintainerId?: string;
  tags?: string[];
  attachments?: Attachment[];
  certifications?: Certification[];
  auditTrail?: AuditEntry[];
  customProperties?: Record<string, any>; // Para propiedades personalizadas como en el backend
  createdAt?: Date; // Añadido para alinearse con BaseNetworkElementResponseDto
  updatedAt?: Date; // Añadido para alinearse con BaseNetworkElementResponseDto
  createdBy?: string; // Añadido para alinearse con BaseNetworkElementResponseDto
  updatedBy?: string; // Añadido para alinearse con BaseNetworkElementResponseDto
}

/**
 * Tipo de conector ampliado
 */
export enum ConnectorType {
  SC = 'SC',
  LC = 'LC',
  FC = 'FC',
  ST = 'ST',
  MTP = 'MTP',
  MPO = 'MPO',
  E2000 = 'E2000',
  SMA = 'SMA',
  DIN = 'DIN',
  MTRJ = 'MTRJ',
  SC_APC = 'SC/APC',
  LC_APC = 'LC/APC',
  FC_APC = 'FC/APC',
  E2000_APC = 'E2000/APC'
}

/**
 * Tipo de fibra ampliado
 */
// export enum FiberType { // ELIMINAR ESTE ENUM LOCAL
//   G652_D = 'G.652.D',
//   G657_A1 = 'G.657.A1',
//   G657_A2 = 'G.657.A2',
//   G657_B3 = 'G.657.B3',
//   G655 = 'G.655',
//   G651 = 'G.651',
//   OM3 = 'OM3',
//   OM4 = 'OM4',
//   OM5 = 'OM5',
//   OS2 = 'OS2'
// }

/**
 * Tipo de splitter ampliado
 */
export enum SplitterType {
  FBT = 'FBT',
  PLC = 'PLC',
  BALANCED = 'BALANCED',
  UNBALANCED = 'UNBALANCED'
}

/**
 * Tipo de empalme mejorado
 */
export enum SpliceMethodType {
  FUSION = 'FUSION',
  MECHANICAL = 'MECHANICAL',
  FACTORY_PRE_TERMINATED = 'FACTORY_PRE_TERMINATED',
  FIELD_INSTALLABLE = 'FIELD_INSTALLABLE'
}

/**
 * Site (Sitio) extendido
 */
export interface ExtendedSite extends ExtendedNetworkElement {
  type: ElementType.SITE;
  siteType: 'CENTRAL_OFFICE' | 'POP' | 'AGGREGATION_NODE' | 'DISTRIBUTION_HUB' | 'CUSTOMER_PREMISES' | 'OTHER';
  
  address: {
    street: string;
    number?: string;
    city: string;
    state: string;
    postalCode?: string;
    country: string;
    reference?: string;
    cadastralReference?: string;
  };
  
  area: {
    total: number;
    usable?: number;
  };
  
  power: {
    mainSupply: boolean;
    backup: boolean;
    backupType?: 'GENERATOR' | 'UPS' | 'DUAL_FEED' | 'NONE';
    backupAutonomy?: number;
    totalCapacity?: number;
    voltage?: number;
  };
  
  environment: {
    airConditioning: boolean;
    temperature?: {
      min: number;
      max: number;
      optimal: number;
    };
    humidity?: {
      min: number;
      max: number;
      optimal: number;
    };
    hasFacilityMonitoring?: boolean;
  };
  
  security: {
    accessControl: boolean;
    surveillance: boolean;
    alarmSystem?: boolean;
    fireDetection?: boolean;
    fireSuppression?: boolean;
  };
  
  racks?: string[];
  equipmentIds?: string[];
  
  access: {
    restrictions?: string;
    contactPerson?: string;
    contactPhone?: string;
    requiresEscort?: boolean;
    accessHours?: string;
    keyLocation?: string;
  };
  
  connectivity: {
    fiberEntryPoints?: number;
    ductsAvailable?: number;
    backboneRoutes?: {
      routeId: string;
      direction: string;
      cableCount: number;
    }[];
  };

  networkTier: 'CORE' | 'AGGREGATION' | 'DISTRIBUTION' | 'ACCESS';
}

/**
 * Rack extendido
 */
export interface ExtendedRack extends ExtendedNetworkElement {
  type: ElementType.RACK;
  siteId: string;
  
  physicalProperties: {
    heightUnits: number;
    width: number;
    depth: number;
    weightCapacity?: number;
    actualWeight?: number;
    doorType?: 'FRONT' | 'FRONT_REAR' | 'FRONT_SIDES' | 'FULL';
  };
  
  capacity: {
    totalU: number;
    usedU: number;
    availableU: number;
    occupancyPercentage: number;
  };
  
  powerDistribution: {
    pduCount?: number;
    totalOutlets?: number;
    usedOutlets?: number;
    redundantPower?: boolean;
    totalPowerCapacity?: number;
    estimatedPowerUsage?: number;
  };
  
  cooling: {
    airflow?: 'FRONT_TO_BACK' | 'SIDE_TO_SIDE' | 'BOTTOM_TO_TOP';
    hasContainment?: boolean;
    maxBTU?: number;
  };
  
  location: {
    roomName: string;
    row?: string;
    position?: string;
    orientation?: 'HORIZONTAL' | 'VERTICAL';
  };
  
  organization: {
    odfPositions?: { id: string; position: string; uSize: number }[];
    equipmentPositions?: { id: string; type: ElementType; position: string; uSize: number }[];
  };
  
  cableManagement: {
    verticalManagers?: boolean;
    horizontalManagers?: number;
    patchPanels?: { id: string; position: string; portCount: number }[];
  };
  
  mountedElements: {
    elementId: string;
    elementType: ElementType;
    positionU: number;
    sizeU: number;
    frontRear: 'FRONT' | 'REAR' | 'BOTH';
  }[];
}

/**
 * OLT extendida
 */
export interface ExtendedOLT extends ExtendedNetworkElement {
  type: ElementType.OLT;
  
  installation: {
    rackId?: string;
    rackPosition?: string;
    rackUnits: number;
  };
  
  technical: {
    manufacturer: string;
    model: string;
    serialNumber: string;
    firmwareVersion: string;
    softwareVersion?: string;
    ponStandard: PONStandard | PONStandard[];
    powerConsumption: number;
    redundancy?: {
      powerSupply: boolean;
      controller: boolean;
      switching: boolean;
    };
  };
  
  capacity: {
    slots: number;
    usedSlots: number;
    totalPonPorts: number;
    activePonPorts: number;
    maximumSplitRatio: string;
    maxONTsPerPON: number;
    maxBandwidthPerPON: number;
    totalSubscribers: number;
    totalSubscriberCapacity: number;
  };
  
  opticalSpecifications: {
    transmitPower: {
      min: number;
      typical: number;
      max: number;
    };
    receiveSensitivity: {
      min: number;
      typical: number;
    };
    wavelengths: {
      downstream: string[];
      upstream: string[];
    };
    opticalBudget: number;
    maxDistance: number;
  };
  
  management: {
    ipAddress?: string;
    subnetMask?: string;
    gateway?: string;
    managementVlan?: number;
    managementInterface?: string;
    accessProtocols?: ('SNMP' | 'SSH' | 'TELNET' | 'HTTP' | 'HTTPS')[];
    nmsIntegration?: string[];
  };
  
  security: {
    authenticationMethod: PONAuthenticationMethod | PONAuthenticationMethod[];
    encryptionMethod: PONEncryptionMethod | PONEncryptionMethod[];
    radiusSupport?: boolean;
    acls?: boolean;
    portSecurity?: boolean;
  };
  
  connections: {
    uplink: {
      portIds: string[];
      redundancy: boolean;
      totalBandwidth: number;
    };
    odfConnections: {
      odfId: string;
      portMappings: {
        oltPort: string;
        odfPort: string;
      }[];
    }[];
  };
  
  ponPorts: {
    id: string;
    name: string;
    status: ElementStatus;
    standard: PONStandard;
    connectedSplitters: string[];
    subscriberCount: number;
    utilizationPercent: number;
    opticalPowerTx?: number;
    opticalPowerRx?: number;
    alarms?: {
      type: string;
      severity: 'INFO' | 'WARNING' | 'CRITICAL';
      timestamp: Date;
      description: string;
    }[];
  }[];
  
  services: {
    supportedServices: ('INTERNET' | 'VOIP' | 'IPTV' | 'RF_OVERLAY')[];
    qosProfiles?: string[];
    multicastSupport?: boolean;
    ipv6Support?: boolean;
  };
  
  performanceMetrics?: {
    currentUtilization: number;
    averageLatency?: number;
    uptimeHours?: number;
    temperatureCelsius?: number;
    alarmCount?: {
      critical: number;
      major: number;
      minor: number;
    };
  };
}

/**
 * FDP extendido
 */
export interface ExtendedFDP extends ExtendedNetworkElement {
  type: ElementType.FDP;
  
  hierarchyLevel: 'PRIMARY' | 'SECONDARY' | 'TERTIARY' | 'TERMINAL';
  
  technical: {
    manufacturer: string;
    model: string;
    serialNumber?: string;
    manufacturerPartNumber?: string;
  };
  
  physicalProperties: {
    dimensions: {
      height: number;
      width: number;
      depth: number;
    };
    weight?: number;
    color?: string;
    material?: string;
    ipRating?: string;
    uvResistant?: boolean;
    impactResistant?: boolean;
  };
  
  installation: {
    locationType: 'INDOOR' | 'OUTDOOR' | 'UNDERGROUND';
    mountingType: 'POLE' | 'WALL' | 'AERIAL' | 'PEDESTAL' | 'UNDERGROUND' | 'RACK';
    mountingHeight?: number;
    installationNotes?: string;
    requiredTools?: string[];
  };
  
  capacity: {
    maxFiberPorts: number;
    usedPorts: number;
    availablePorts: number;
    maxSplitters: number;
    installedSplitters: number;
    maxSubscribers: number;
    connectedSubscribers: number;
    reservePorts?: number;
  };
  
  protection: {
    isSealed: boolean;
    lockType?: 'KEY' | 'TOOL' | 'PADLOCK' | 'SECURITY_BOLT' | 'NONE';
    hasGasketSeal?: boolean;
    waterproofing?: boolean;
    ventilation?: boolean;
  };
  
  opticalProperties: {
    connectorTypes: ConnectorType[];
    adapterTypes?: string[];
    fusionSpliceCapacity?: number;
    mechanicalSpliceCapacity?: number;
    bendRadius?: number;
  };
  
  splitters: {
    id: string;
    type: SplitterType;
    ratio: string;
    insertionLoss: number;
    connectorType: ConnectorType;
    status: ElementStatus;
  }[];
  
  connections: {
    upstream: {
      elementId: string;
      elementType: ElementType;
      fiberIds: string[];
      cableId?: string;
    };
    downstream: {
      elementIds: string[];
      elementTypes: ElementType[];
      fiberIds: string[];
    };
  };
  
  cabling: {
    incomingCables: {
      cableId: string;
      cableType: CableType;
      fiberCount: number;
      fiberType: FiberType;
      direction: string;
      length?: number;
    }[];
    outgoingCables: {
      cableId: string;
      cableType: CableType;
      fiberCount: number;
      fiberType: FiberType;
      direction: string;
      length?: number;
    }[];
  };
  
  serviceArea: {
    coverageRadius?: number;
    buildingsServed?: number;
    homesPassedCount?: number;
    subscriberLimit?: number;
    hasRedundantPath?: boolean;
  };
  
  labeling: {
    externalLabel: string;
    internalLabels?: {
      portLabels: Record<string, string>;
      splitterLabels: Record<string, string>;
      otherLabels?: Record<string, string>;
    };
    labelingStandard?: string;
  };
  
  measurements?: {
    otdrTests: {
      date: Date;
      technicianId: string;
      fileReference: string;
      upstreamLoss?: number;
      downstreamLoss?: number;
      reflectance?: number;
      events?: {
        distance: number;
        type: string;
        loss: number;
      }[];
    }[];
    powerMeterTests?: {
      date: Date;
      technicianId: string;
      portId: string;
      wavelength: number;
      powerLevel: number;
      referenceLevel?: number;
      loss?: number;
    }[];
  };
}

/**
 * Manga extendida
 */
export interface ExtendedManga extends ExtendedNetworkElement {
  type: ElementType.MANGA;
  
  technical: {
    manufacturer: string;
    model: string;
    serialNumber?: string;
    manufacturerPartNumber?: string;
  };
  
  physicalProperties: {
    dimensions: {
      length: number;
      width: number;
      height: number;
    };
    weight?: number;
    form: 'DOME' | 'HORIZONTAL' | 'VERTICAL' | 'TORPEDO' | 'OVAL' | 'BRANCH';
    material?: string;
    color?: string;
    entrancePortCount: number;
  };
  
  installation: {
    locationType: 'AERIAL' | 'UNDERGROUND' | 'WALL_MOUNTED' | 'DIRECT_BURIED';
    mountingType: 'POLE' | 'MANHOLE' | 'HANDHOLE' | 'PEDESTAL' | 'WALL' | 'BURIED';
    installationDepth?: number;
    mountingHeight?: number;
  };
  
  capacity: {
    maxFiberSplices: number;
    usedSplices: number;
    availableSplices: number;
    passThroughFibers?: number;
    maxSpliceTrays: number;
    installedTrays: number;
    maxCableEntries: number;
    usedCableEntries: number;
  };
  
  protection: {
    ipRating: string;
    pressureTest?: boolean;
    pressureRating?: string;
    sealType: 'HEAT_SHRINK' | 'MECHANICAL' | 'GEL' | 'TAPE' | 'HYBRID';
    reEnterable: boolean;
    isWaterproof: boolean;
    uvResistant?: boolean;
    chemicalResistant?: boolean;
  };
  
  splicingTrays: {
    id: string;
    trayNumber: number;
    capacity: number;
    usedPositions: number;
    spliceType: SpliceMethodType;
    fibers: {
      tubeColor: string;
      fiberColor: string;
      connectedTo: {
        tubeColor: string;
        fiberColor: string;
      };
      spliceMethod: SpliceMethodType;
      lossDb?: number;
      comments?: string;
    }[];
  }[];
  
  cables: {
    id: string;
    cableId: string;
    portNumber: number;
    direction: 'IN' | 'OUT' | 'PASS_THROUGH';
    cableType: CableType;
    fiberCount: number;
    fiberType: FiberType;
    tubeCount?: number;
    isLooped?: boolean;
    lengthMeters?: number;
    bufferedFiber?: boolean;
    originElement?: {
      id: string;
      type: ElementType;
      name: string;
    };
    destinationElement?: {
      id: string;
      type: ElementType;
      name: string;
    };
  }[];
  
  fiberSegregation: {
    tubeManagement: 'TRAY' | 'CASSETTE' | 'BASKET' | 'DIRECT';
    organizationType: 'BY_COLOR' | 'BY_NUMBER' | 'BY_DESTINATION';
    storageType?: 'COIL' | 'SPLICE_TRAY' | 'STORAGE_BASKET';
    loopStorage?: boolean;
    minBendRadius: number;
  };
  
  measurements?: {
    hermeticity?: {
      date: Date;
      result: 'PASS' | 'FAIL';
      pressureValue?: number;
      duration?: number;
    };
    otdrTests?: {
      date: Date;
      technicianId: string;
      direction: 'A-B' | 'B-A' | 'BIDIRECTIONAL';
      fileReference: string;
      results: {
        fiberNumber: number;
        lossDb: number;
        events: {
          distance: number;
          type: 'REFLECTIVE' | 'NON_REFLECTIVE' | 'MACRO_BEND' | 'END';
          lossDb: number;
        }[];
      }[];
    }[];
  };
  
  interventions?: {
    date: Date;
    technicianId: string;
    type: 'INSTALLATION' | 'RE_ENTRY' | 'ADD_FIBERS' | 'REPAIR' | 'TEST';
    description: string;
    changesPerformed?: string;
    beforeImages?: string[];
    afterImages?: string[];
  }[];
  
  labeling: {
    externalLabel: string;
    cableLabels: Record<string, string>;
    trayLabels?: Record<string, string>;
    labelingStandard?: string;
    tagColor?: string;
  };
  
  organization: {
    colorCoding?: {
      standard: 'TIA_598' | 'IEC_60304' | 'CUSTOM';
      customScheme?: Record<string, string>;
    };
    tubeOrganization?: string;
    fiberRouting?: string;
  };
}

/**
 * ONT/ONU (Optical Network Terminal/Unit) extendida
 */
export interface ExtendedONT extends ExtendedNetworkElement {
  type: ElementType.ONT;

  installation: {
    customerId?: string;
    serviceAddress?: string;
    locationInPremises?: string; // e.g., 'Living Room', 'Office'
    accessNotes?: string;
  };

  technical: {
    manufacturer: string;
    model: string;
    serialNumber: string;
    firmwareVersion: string;
    hardwareVersion?: string;
    ponStandard: PONStandard;
    macAddress?: string;
    wifiCapabilities?: {
      standards: string[]; // e.g., ['802.11ac', '802.11ax']
      bands: ('2.4GHz' | '5GHz' | '6GHz')[];
      maxSpeed?: number; // Mbps
    };
    lanPorts?: {
      count: number;
      speed?: ('100Mbps' | '1Gbps' | '2.5Gbps' | '10Gbps')[];
    };
    fxsPorts?: number; // For VoIP
    rfPort?: boolean;  // For RF Overlay
  };

  connectivity: {
    oltId?: string;
    oltPonPortId?: string;
    fdpId?: string;
    fdpPortId?: string;
    dropCableId?: string;
    dropCableLength?: number; // meters
    fiberConnectorType?: ConnectorType;
    upstreamSignalLevel?: number; // dBm
    downstreamSignalLevel?: number; // dBm
  };

  serviceConfiguration: {
    serviceProfileId?: string;
    vlanId?: number;
    ipAddress?: string; // WAN IP
    subnetMask?: string;
    gateway?: string;
    dnsServers?: string[];
    pppoeUsername?: string;
    voipNumber?: string;
    iptvProfile?: string;
  };

  performanceMetrics?: {
    opticalPowerTx?: number;    // dBm
    opticalPowerRx?: number;    // dBm
    temperatureCelsius?: number;
    cpuUtilization?: number;    // %
    memoryUtilization?: number; // %
    lanPortStatus?: Record<string, 'UP' | 'DOWN' | 'DISABLED'>;
    wifiClientCount?: number;
  };
}

/**
 * ODF (Optical Distribution Frame) extendido
 */
export interface ExtendedODF extends ExtendedNetworkElement {
  type: ElementType.ODF;

  installation: {
    rackId: string;
    startUnit: number; // U position in rack
    sizeU: number;     // Size in U
    side?: 'FRONT' | 'REAR';
  };

  technical: {
    manufacturer: string;
    model: string;
    serialNumber?: string;
    capacityType: 'PATCH_PANEL' | 'SPLICE_PANEL' | 'COMBINED';
  };

  capacity: {
    maxPorts: number;
    usedPorts: number;
    availablePorts: number;
    portDensity?: string; // e.g., 'High', 'Standard'
    maxSpliceTrays?: number;
    installedSpliceTrays?: number;
  };

  portConfiguration: {
    id: string;
    portNumber: string; // e.g., 'A1', '1-1'
    status: 'CONNECTED' | 'DISCONNECTED' | 'RESERVED' | 'FAULTY' | 'AVAILABLE';
    connectorType: ConnectorType;
    connectedElementId?: string;
    connectedElementPort?: string;
    connectedElementType?: ElementType;
    fiberId?: string;
    label?: string;
    notes?: string;
    attenuationDb?: number;
  }[];

  cableManagement?: {
    cableEntryPoints?: number;
    routingSystem?: 'HORIZONTAL_GUIDES' | 'VERTICAL_GUIDES' | 'TRAYS';
    bendRadiusProtection?: boolean;
  };

  labeling: {
    panelLabel: string;
    portLabelingSchema?: string; // e.g., 'Row-Column', 'Sequential'
  };
}

/**
 * Pole (Poste) extendido
 */
export interface ExtendedPole extends ExtendedNetworkElement {
  type: ElementType.POLE;

  material: 'WOOD' | 'CONCRETE' | 'STEEL' | 'COMPOSITE';
  heightMeters: number;
  diameterCm?: number;
  classRating?: string; // e.g., 'Class 5', 'H2'
  installationType: 'DIRECT_BURIED' | 'CONCRETE_BASE' | 'ANCHORED';
  
  attachmentsSupported: {
    maxWeightKg?: number;
    maxCables?: number;
    equipmentMounts?: ('FDP' | 'MANGA' | 'ANTENNA' | 'CAMERA')[];
  };

  condition: 'GOOD' | 'FAIR' | 'POOR' | 'NEEDS_REPLACEMENT';
  lastInspectionDate?: Date;
  inspectionNotes?: string;
  
  sharedWith?: string[]; // e.g., ['PowerCompany', 'TelecomCompanyB']
  jointUseAgreementId?: string;

  cablesAttached: {
    cableId: string;
    cableType: CableType;
    attachmentHeightMeters?: number;
    tensionKN?: number;
  }[];

  equipmentAttached: {
    elementId: string;
    elementType: ElementType;
    mountingDetails?: string;
  }[];
}

/**
 * Chamber / Manhole / Handhole (Cámara/Pozo) extendido
 */
export interface ExtendedChamber extends ExtendedNetworkElement {
  type: ElementType.CHAMBER;

  chamberType: 'MANHOLE' | 'HANDHOLE' | 'JOINT_BOX' | 'SERVICE_BOX';
  material: 'CONCRETE' | 'PLASTIC' | 'COMPOSITE' | 'BRICK';
  dimensions: { // in cm
    length: number;
    width: number;
    depth: number;
  };
  coverType: 'CONCRETE' | 'CAST_IRON' | 'COMPOSITE' | 'STEEL';
  loadRating?: string; // e.g., 'A15', 'B125', 'D400' (EN 124)
  
  installationDepthMeters?: number; // Depth of the chamber itself
  accessSizeCm?: { // Size of the opening
    length: number;
    width: number;
  };

  condition: 'GOOD' | 'FAIR' | 'POOR' | 'FLOODED' | 'DAMAGED';
  lastInspectionDate?: Date;
  gasTestRequired?: boolean;
  
  cableEntries: {
    entryNumber: number;
    ductId?: string; // Connected duct
    sealed: boolean;
    sizeMm?: number;
  }[];

  cablesInside: {
    cableId: string;
    cableType: CableType;
    isLooped?: boolean;
    slackLengthMeters?: number;
  }[];

  equipmentInside: {
    elementId: string;
    elementType: ElementType.MANGA | ElementType.SPLITTER | ElementType.SLACK_FIBER; // Typically these
    mountingDetails?: string;
  }[];

  sumpPumpRequired?: boolean;
  hasLadder?: boolean;
}

/**
 * Duct (Ducto/Canalización) extendido
 */
export interface ExtendedDuct extends ExtendedNetworkElement {
  type: ElementType.DUCT;

  ductSpecificStatus?: 'BLOCKED' | 'DAMAGED' | 'FULL' | 'OKAY'; // Estado específico del ducto
  path: { // GeoJSON LineString or similar
    type: "LineString";
    coordinates: [number, number][]; // Array of [longitude, latitude]
  };
  lengthMeters: number;
  
  material: 'PVC' | 'HDPE' | 'CONCRETE' | 'STEEL' | 'FIBERGLASS';
  diameterMm: number; // Inner diameter
  wallThicknessMm?: number;
  
  subDucts?: {
    count: number;
    diameterMm: number;
    color?: string;
    occupiedByCableId?: string;
  }[];
  
  burialDepthMeters?: number;
  installationMethod: 'TRENCHED' | 'DIRECTIONAL_BORING' | 'PLOWED' | 'AERIAL_ON_POLE';
  
  startPoint: {
    elementId: string; // e.g., Chamber ID, Pole ID, Site ID
    elementType: ElementType.CHAMBER | ElementType.POLE | ElementType.SITE;
    portOrEntryPoint?: string;
  };
  endPoint: {
    elementId: string;
    elementType: ElementType.CHAMBER | ElementType.POLE | ElementType.SITE;
    portOrEntryPoint?: string;
  };
  
  occupancy: {
    cableIds: string[];
    fillPercentage?: number;
  };

  lastInspectionDate?: Date;
  mandrelTestPassed?: boolean;
  pressureTestPassed?: boolean;
}

/**
 * Fiber Cable (Cable de Fibra) Genérico Extendido 
 * This can be specialized for Feeder, Distribution, Drop, etc.
 * Or, use this as the base and have specific types extend it with fewer fields.
 */
export interface ExtendedFiberCable extends ExtendedNetworkElement {
  // type will be ElementType.FEEDER_CABLE, ElementType.DISTRIBUTION_CABLE, ElementType.DROP_CABLE etc.
  cableTypeSpecific: CableType; // The detailed cable type from THIS FILE's CableType enum (local)

  path?: { // GeoJSON LineString
    type: "LineString";
    coordinates: [number, number][]; // Array of [longitude, latitude]
  };
  lengthMeters: number;
  
  installationMethod?: string; // Método de instalación como string
  ductId?: string; // If installed in a duct
  poleIds?: string[]; // If aerial, list of poles it's attached to

  technical: {
    manufacturer?: string; // Ya estaba, pero asegurar que se mapea desde el DTO
    model?: string;      // Ya estaba
    partNumber?: string;
    fiberCount: number; // Mapear desde backend strandConfiguration.totalStrands si es posible o calcular
    tubeCount?: number;  // Mapear desde backend strandConfiguration.tubesPerCable
    fibersPerTube?: number; // Mapear desde backend strandConfiguration.strandsPerTube
    fiberType: FiberType; // ACTUALIZADO para usar el enum importado
    standard?: string; // Añadido para mapear desde DTO
    outerJacketColor?: string; // Añadido para mapear desde DTO
    coreDiameterMicrons?: number; 
    claddingDiameterMicrons?: number; 
    coatingDiameterMicrons?: number; 
    tensileStrengthN?: number;
    minBendRadiusMmInstallation: number;
    minBendRadiusMmOperation: number;
    attenuationAt1310nmDbPerKm?: number; // El backend tiene attenuationPerKmDb (genérico)
    attenuationAt1550nmDbPerKm?: number; // Considerar cómo mapear o si se usa el más genérico
    attenuationAt1625nmDbPerKm?: number;
    attenuationPerKmDb?: number; // Campo genérico para mapear el del backend
    chromaticDispersionPsPerNmKm?: number;
    sheathMaterial?: string; 
    isArmored?: boolean;
    armorType?: 'STEEL_TAPE' | 'CORRUGATED_STEEL' | 'STEEL_WIRE' | 'DIELECTRIC';
    isRodentProtected?: boolean;
  };
  
  // Información de configuración y estado de hilos del backend
  strandConfiguration?: { // Mapea StrandConfigurationDto
    totalStrands: number;
    strandsPerTube?: number;
    tubesPerCable?: number;
  };
  strandStatus?: { // Mapea StrandStatusDto
    total: number;
    available: number;
    inUse: number;
    reserved: number;
    damaged: number;
  };

  connectivity: {
    fromElementId: string;
    fromElementType: ElementType;
    fromElementPortOrFiber?: string; // Port on ODF, fiber number in Manga
    toElementId: string;
    toElementType: ElementType;
    toElementPortOrFiber?: string;
  };

  fiberStrands: {
    strandNumber: number; // 1 to N
    tubeNumber?: number;
    colorCodeTube?: string; // Based on TIA-598-C or IEC 60304
    colorCodeFiber: string;
    status: 'USED' | 'AVAILABLE' | 'RESERVED' | 'FAULTY' | 'SPLICED_THROUGH';
    connectedToFiberStrandId?: string; // If directly spliced
    notes?: string;
    measurements?: {
      lossDb?: number;
      lengthMeters?: number; // Actual measured length of this strand
      otdrTraceId?: string; // Link to an OTDR trace
    };
  }[];

  labeling: {
    startLabel?: string;
    endLabel?: string;
    intermediateLabels?: string[]; // Every X meters
  };
}

/**
 * Slack Loop / Cable Reserve (Reserva de Cable)
 */
export interface ExtendedSlackLoop extends ExtendedNetworkElement {
  type: ElementType.SLACK_FIBER; // Or a new ElementType.SLACK_LOOP

  relatedCableId: string;
  lengthMeters: number; // Length of the slack loop itself
  
  locationDescription: string; // e.g., 'Pole #P123', 'Manhole #MH45', 'Inside FDP-001'
  mountingType: 'COILED_ON_POLE' | 'IN_HANDHOLE_FIGURE_8' | 'ON_WALL_RACK' | 'INSIDE_CLOSURE';
  
  reason: 'FUTURE_SPLICE' | 'REPAIR_LOOP' | 'EQUIPMENT_CONNECTION' | 'INSTALLATION_REQUIREMENT';
}

/**
 * NAP (Network Access Point) extendido
 * Similar to a small FDP or a more capable TerminalBox, often pole or facade mounted.
 */
export interface ExtendedNAP extends ExtendedNetworkElement {
  type: ElementType.NAP;

  technical: {
    manufacturer?: string;
    model?: string;
    partNumber?: string;
  };

  physicalProperties: {
    dimensions?: { height: number; width: number; depth: number }; // cm
    material?: 'PLASTIC' | 'METAL';
    ipRating?: string; // e.g., IP65
  };

  installation: {
    mountingType: 'POLE' | 'FACADE' | 'PEDESTAL' | 'HANDHOLE';
    environment: 'INDOOR' | 'OUTDOOR';
  };

  capacity: {
    maxDropConnections: number;
    usedDropConnections: number;
    splitterPortsInput?: number; // If it contains a splitter
    splitterPortsOutput?: number;
    passThroughFibers?: number;
  };

  splitterInside?: {
    splitterId?: string; // If pre-connectorized or managed as separate asset
    type?: SplitterType;
    ratio?: string;
    connectorTypeInput?: ConnectorType;
    connectorTypeOutput?: ConnectorType;
  };

  connectivity: {
    inputCableId?: string;
    inputFiberIds?: string[]; // Specific fibers from input cable
    dropCableIds?: string[];  // IDs of connected drop cables
  };

  labeling?: {
    boxLabel: string;
    portLabels?: Record<string, string>; // e.g., {'1': 'Cust123', '2': 'Cust456'}
  };
}

/**
 * FAT (Fiber Access Terminal) extendido
 * Often used interchangeably with NAP or Terminal Box, depends on regional terminology.
 */
export interface ExtendedFAT extends ExtendedNetworkElement { // Does not inherit from ExtendedNAP anymore
  type: ElementType.FAT;

  // Properties similar to ExtendedNAP, copied for now, can be refactored later if too much duplication
  technical: {
    manufacturer?: string;
    model?: string;
    partNumber?: string;
  };

  physicalProperties: {
    dimensions?: { height: number; width: number; depth: number }; // cm
    material?: 'PLASTIC' | 'METAL';
    ipRating?: string; // e.g., IP65
  };

  installation: {
    mountingType: 'POLE' | 'FACADE' | 'PEDESTAL' | 'HANDHOLE' | 'WALL'; // Added WALL from common usage
    environment: 'INDOOR' | 'OUTDOOR';
  };

  capacity: {
    maxDropConnections: number;
    usedDropConnections: number;
    splitterPortsInput?: number; 
    splitterPortsOutput?: number;
    passThroughFibers?: number;
  };

  splitterInside?: {
    splitterId?: string; 
    type?: SplitterType;
    ratio?: string;
    connectorTypeInput?: ConnectorType;
    connectorTypeOutput?: ConnectorType;
  };

  connectivity: {
    inputCableId?: string;
    inputFiberIds?: string[]; 
    dropCableIds?: string[];  
  };

  labeling?: {
    boxLabel: string;
    portLabels?: Record<string, string>; 
  };
  
  // Add any FAT-specific properties here if they differ significantly from NAP
  fatSpecificConnectorPanel?: string; // Example FAT-specific field
  sealingType?: 'GROMMET' | 'MECHANICAL_SEAL'; // Example FAT-specific field
}

/**
 * MDU (Multi-Dwelling Unit) Building - As a manageable network element itself
 */
export interface ExtendedMDUBuilding extends ExtendedNetworkElement {
  type: ElementType.MDU_BUILDING; // Ensure MDU_BUILDING is in ElementType enum

  address: {
    street: string;
    number: string;
    apartmentPrefix?: string; // e.g., 'Apt', 'Unit', 'Suite'
    city: string;
    postalCode: string;
    country: string;
  };

  buildingDetails: {
    numberOfUnits: number;
    numberOfFloors?: number;
    buildingType: 'APARTMENT_COMPLEX' | 'CONDOMINIUM' | 'OFFICE_BUILDING' | 'MIXED_USE';
    constructionMaterial?: string;
    yearBuilt?: number;
  };

  internalNetworkInfrastructure: {
    riserCableIds?: string[];
    floorDistributorIds?: string[]; // IDs of small boxes/NAPs per floor
    internalWiringType?: 'FIBER_TO_THE_UNIT' | 'CAT_CABLE_TO_UNIT';
    hasSharedPathways?: boolean;
    demarcationPointLocation?: string; // e.g., 'Basement Telco Room'
  };

  accessPointForNetwork: {
    mainEntryCableId?: string; // Cable feeding the MDU
    externalNapOrFdpId?: string; // External NAP/FDP feeding this MDU
    internalDistributionType: 'SPLITTER_PER_FLOOR' | 'HOME_RUN_FIBER' | 'CENTRAL_SPLITTER';
  };

  units: {
    unitId: string; // e.g., 'A101', '20B'
    floor?: number;
    status: 'OCCUPIED_SERVICEABLE' | 'VACANT_SERVICEABLE' | 'REQUIRES_WIRING' | 'NOT_INTERESTED' | 'SUBSCRIBED';
    ontId?: string; // If an ONT is installed
    serviceTier?: string;
    notes?: string;
  }[];

  siteManagerContact?: {
    name?: string;
    phone?: string;
    email?: string;
  };
}

/**
 * Route / Path (Ruta o Trazado de Fibra) extendido
 * Represents a logical or physical path composed of multiple segments (ducts, aerial spans, cables)
 */
export interface ExtendedRoute extends ExtendedNetworkElement {
  type: ElementType.ROUTE;

  routeName: string;
  routeType: 'PHYSICAL_PATH' | 'LOGICAL_CIRCUIT' | 'SERVICE_PATH';
  overallLengthKm?: number;

  segments: {
    sequence: number;
    segmentType: ElementType.DUCT | ElementType.POLE /*for aerial span*/ | ElementType.FIBER_CABLE | ElementType.SITE;
    elementId: string; // ID of the Duct, Cable, Pole (representing a span to next pole), or Site (if passing through)
    startNode?: string; // Could be a chamber, pole, ODF port, etc.
    endNode?: string;
    lengthKm?: number;
    notes?: string;
  }[];

  startPoint: {
    elementId: string;
    elementType: ElementType;
    portOrTerminal?: string;
  };
  endPoint: {
    elementId: string;
    elementType: ElementType;
    portOrTerminal?: string;
  };

  redundancyPathId?: string; // ID of a backup route
  associatedServices?: string[]; // Services using this route
  calculatedAttenuationDb?: number;
}

/**
 * Service Area (Área de Servicio) extendida
 */
export interface ExtendedServiceArea extends ExtendedNetworkElement {
  type: ElementType.SERVICE_AREA;

  areaName: string;
  areaType: 'URBAN' | 'SUBURBAN' | 'RURAL' | 'INDUSTRIAL_PARK' | 'COMMERCIAL_DISTRICT';
  
  boundary: { // GeoJSON Polygon or MultiPolygon
    type: "Polygon" | "MultiPolygon";
    coordinates: any; // Structure depends on Polygon or MultiPolygon
  };

  demographics?: {
    population?: number;
    households?: number;
    businesses?: number;
    density?: number; // households or pop per sq km
  };

  networkInfrastructure: {
    feedingOltIds?: string[];
    mainFdpIds?: string[];
    totalNapCount?: number;
    homesPassed?: number;
    homesConnected?: number;
    penetrationRatePercent?: number;
  };

  targetMarket?: {
    serviceTiersOffered?: string[]; // e.g., ['100Mbps', '1Gbps', 'BusinessSymmetric']
    competitorPresence?: string[];
    growthPotential?: 'HIGH' | 'MEDIUM' | 'LOW';
  };

  planningStatus?: 'IDENTIFIED' | 'SURVEY_PLANNED' | 'SURVEY_COMPLETED' | 'DESIGN_IN_PROGRESS' | 'CONSTRUCTION_PHASE' | 'OPERATIONAL';
}

/**
 * ROADM (Reconfigurable Optical Add-Drop Multiplexer) extendido
 */
export interface ExtendedROADM extends ExtendedNetworkElement {
  type: ElementType.ROADM;

  installation: {
    rackId?: string;
    rackPosition?: string; 
    rackUnits?: number;
  };

  technical: {
    manufacturer: string;
    model: string;
    serialNumber: string;
    firmwareVersion?: string;
    degreeCount: number; // Number of input/output directions
    maxWavelengths: number; // Max number of channels supported
    channelSpacingGhz: 50 | 100 | 200 | 'FLEXGRID';
    gridType: 'FIXED' | 'FLEXIBLE';
    supportsCband?: boolean;
    supportsLband?: boolean;
    powerConsumptionW?: number;
  };

  ports: {
    id: string;
    portName: string; // e.g., 'LINE_IN_EAST', 'ADD_CH_1', 'DROP_WEST_CH_5'
    type: 'LINE_IN' | 'LINE_OUT' | 'ADD' | 'DROP' | 'EXPRESS_IN' | 'EXPRESS_OUT' | 'MONITORING';
    direction?: 'EAST' | 'WEST' | 'NORTH' | 'SOUTH' | 'LOCAL';
    connectorType: ConnectorType;
    connectedFiberId?: string;
    status: ElementStatus;
    monitoring?: {
      inputPowerDbm?: number;
      outputPowerDbm?: number;
      osnrDb?: number;
    };
  }[];

  channelConfiguration: {
    channelId: string; // e.g., Wavelength number or frequency
    wavelengthNm?: number;
    frequencyThz?: number;
    bandwidthGhz?: number;
    status: 'ACTIVE' | 'INACTIVE' | 'RESERVED' | 'FAULTY';
    path: {
      sourceDegreePort: string;
      destinationDegreePort: string;
      addPort?: string; // Port used to add this channel
      dropPort?: string; // Port used to drop this channel
    }[];
    attenuationDb?: number;
    powerDbm?: number;
    label?: string;
  }[];

  management: {
    ipAddress?: string;
    managementInterface?: string;
    controlPlaneProtocol?: string; // e.g., GMPLS, NETCONF
  };
}

/**
 * WSS (Wavelength Selective Switch) extendido
 */
export interface ExtendedWSS extends ExtendedNetworkElement {
  type: ElementType.WSS;

  installation: {
    rackId?: string;
    rackPosition?: string;
    rackUnits?: number;
  };

  technical: {
    manufacturer: string;
    model: string;
    serialNumber: string;
    inputPortCount: number;
    outputPortCount: number;
    maxWavelengthsPerPort: number;
    channelSpacingGhz: 50 | 100 | 'FLEXGRID';
    switchingTechnology?: 'LC' | 'LCOS' | 'MEMS';
    insertionLossDb?: number;
    polarizationDependentLossDb?: number;
  };

  ports: {
    id: string;
    portName: string; // e.g., 'COMMON_IN', 'OUT_1', 'OUT_2'
    type: 'INPUT' | 'OUTPUT' | 'MONITORING';
    connectorType: ConnectorType;
    connectedFiberId?: string;
    status: ElementStatus;
  }[];

  channelRouting: {
    inputId: string; // Input port ID
    outputId: string; // Output port ID
    wavelengthNm?: number;
    frequencyThz?: number;
    bandwidthGhz?: number;
    attenuationDb?: number; // Configured attenuation for this path
    status: 'ACTIVE' | 'CONFIGURED' | 'FAILED';
  }[];

  management: {
    ipAddress?: string;
    controlInterface?: string;
  };
}

/**
 * Optical Amplifier (EDFA, Raman, etc.) extendido
 */
export interface ExtendedOpticalAmplifier extends ExtendedNetworkElement {
  type: ElementType.OPTICAL_AMPLIFIER | ElementType.EDFA; // Could be generic or specific

  amplifierType: 'EDFA' | 'RAMAN' | 'SOA' | 'HYBRID';
  application: 'BOOSTER' | 'INLINE' | 'PREAMPLIFIER';

  installation: {
    rackId?: string;
    rackPosition?: string;
    rackUnits?: number;
    locationInLine?: string; // e.g., 'After OLT', 'Mid-span between SiteA and SiteB'
  };

  technical: {
    manufacturer: string;
    model: string;
    serialNumber: string;
    gainDbTypical: number;
    gainDbMin?: number;
    gainDbMax?: number;
    gainFlatnessDb?: number;
    noiseFigureDbTypical: number;
    outputPowerDbmTypical: number;
    inputPowerDbmMin: number;
    inputPowerDbmMax: number;
    wavelengthRangeNm: string; // e.g., '1530-1565' (C-Band), '1570-1610' (L-Band)
    polarizationDependentGainDb?: number;
    powerConsumptionW?: number;
    ramanPumpWavelengthsNm?: number[]; // For Raman amplifiers
    ramanPumpPowerMw?: number[];      // For Raman amplifiers
  };

  ports: {
    input: { portName: string; connectorType: ConnectorType; fiberId?: string; monitoredPowerDbm?: number; };
    output: { portName: string; connectorType: ConnectorType; fiberId?: string; monitoredPowerDbm?: number; };
    monitor?: { portName: string; connectorType: ConnectorType; tapPercentage?: number; };
  };

  operationalParameters?: {
    currentGainDb?: number;
    currentOutputPowerDbm?: number;
    currentInputPowerDbm?: number;
    temperatureCelsius?: number;
    alarms?: { type: string; severity: 'CRITICAL' | 'MAJOR' | 'MINOR'; description: string; timestamp: Date; }[];
  };

  management?: {
    ipAddress?: string;
    snmpEnabled?: boolean;
  };
}

/**
 * Transponder (Coherent, etc.) extendido
 */
export interface ExtendedTransponder extends ExtendedNetworkElement {
  type: ElementType.COHERENT_TRANSPONDER; // Or a generic ElementType.TRANSPONDER

  installation: {
    rackId?: string;
    rackPosition?: string;
    rackUnits?: number;
    chassisId?: string; // If part of a larger chassis system
    slotNumber?: string;
  };

  technical: {
    manufacturer: string;
    model: string;
    serialNumber: string;
    transponderType: 'COHERENT' | 'DIRECT_DETECT' | 'WDM_CONVERTER';
    supportedLineRatesGbps: number[]; // e.g., [100, 200, 400]
    supportedClientProtocols: string[]; // e.g., ['100GE_LR4', 'OTU4']
    modulationFormats?: string[]; // e.g., ['DP-QPSK', 'DP-16QAM']
    fecType?: string; // e.g., 'CFEC', 'OFEC', 'SDFEC'
    powerConsumptionW?: number;
    tunableWavelengthRangeNm?: string; // For tunable lasers
  };

  lineSidePort: {
    id: string;
    portName: string;
    connectorType: ConnectorType;
    fiberId?: string;
    wavelengthNmSet?: number;
    frequencyThzSet?: number;
    outputPowerDbm?: number;
    inputPowerDbmExpectedMin?: number;
    inputPowerDbmExpectedMax?: number;
    osnrRequiredDb?: number;
    chromaticDispersionTolerancePsNm?: number;
    pmdTolerancePs?: number;
  };

  clientSidePorts: {
    id: string;
    portName: string;
    connectorType: ConnectorType; // Could be SFP, QSFP, etc. physical, or logical
    interfaceType: string; // e.g., '100GBASE-LR4', 'STM-64'
    expectedSignal?: string;
    connectedEquipmentId?: string;
    status: ElementStatus;
  }[];

  performanceMonitoring?: {
    preFecBer?: number;
    postFecBer?: number;
    esnrDb?: number; // Electrical Signal to Noise Ratio
    qValueDb?: number;
    currentInputLinePowerDbm?: number;
    currentOutputLinePowerDbm?: number;
    temperatureCelsius?: number;
  };

  management?: {
    ipAddress?: string;
  };
}

/**
 * WDM Filter (Mux/Demux) extendido
 */
export interface ExtendedWDMFilter extends ExtendedNetworkElement {
  type: ElementType.WDM_FILTER;

  filterType: 'MUX' | 'DEMUX' | 'CWDM' | 'DWDM' | 'BAND_SPLITTER' | 'INTERLEAVER';
  technology?: 'THIN_FILM_FILTER' | 'AWG' | 'FIBER_BRAGG_GRATING';

  installation: {
    rackId?: string;
    rackPosition?: string;
    rackUnits?: number;
    isPassive: boolean;
  };

  technical: {
    manufacturer: string;
    model: string;
    serialNumber?: string;
    channelCount: number;
    channelSpacingGhzOrNm: string; // e.g., '100GHz', '0.8nm', 'CWDM_GRID'
    passbandWidthGhzOrNm?: string;
    insertionLossDbPerChannelTypical: number;
    insertionLossDbPerChannelMax?: number;
    adjacentChannelIsolationDb?: number;
    nonAdjacentChannelIsolationDb?: number;
    uniformityDb?: number; // Max difference in IL between channels
    directivityDb?: number;
    returnLossDb?: number;
    operatingWavelengthRangeNm?: string;
  };

  commonPort: {
    id: string;
    portName: string; // e.g., 'COMMON', 'LINE'
    connectorType: ConnectorType;
    fiberId?: string;
  };

  channelPorts: {
    id: string;
    portName: string; // e.g., 'CH1', '1550.12nm', 'C21'
    channelNumber?: number;
    wavelengthNm?: number;
    frequencyThz?: number;
    connectorType: ConnectorType;
    fiberId?: string;
    status: ElementStatus;
    monitoredPowerDbm?: number; // If pass-through monitoring is available
  }[];

  upgradePort?: { // For future expansion
    id: string;
    portName: string;
    connectorType: ConnectorType;
  };

  monitoringPort?: { // Dedicated port for monitoring overall signal
    id: string;
    portName: string;
    connectorType: ConnectorType;
    tapPercentage?: number;
  };
}

/**
 * Attenuator (Óptico) Extendido
 */
export interface ExtendedAttenuator extends ExtendedNetworkElement {
  type: ElementType.ATTENUATOR;

  attenuatorType: 'FIXED' | 'VARIABLE_MANUAL' | 'VARIABLE_ELECTRONIC' | 'MEMS_VOA';
  attenuationDb: number;
  
  installation: {
    locationDescription: string; // e.g., 'Patch Panel A, Port 5', 'Before Receiver X'
    inlineOrPlugType: 'INLINE_PATCHCORD' | 'BULKHEAD_ADAPTER' | 'PLUGGABLE_MODULE';
  };

  technical: {
    manufacturer?: string;
    model?: string;
    wavelengthRangeNm: string; // e.g., '1260-1650'
    maxPowerHandlingDbm?: number;
    returnLossDb?: number;
    connectorTypeIn?: ConnectorType;
    connectorTypeOut?: ConnectorType;
    accuracyDb?: number; // For variable attenuators
    adjustmentRangeDb?: string; // For variable, e.g., '0-30'
  };
}

/**
 * Monitoring System (Sistema de Monitorización de Fibra, etc.) extendido
 */
export interface ExtendedMonitoringSystem extends ExtendedNetworkElement {
  type: ElementType.MONITORING_SYSTEM;

  systemType: 'OTDR_DISTRIBUTED' | 'OTDR_REMOTE_TEST_UNIT' | 'POWER_MONITORING' | 'SPECTRUM_ANALYZER_SYSTEM';
  
  installation: {
    rackId?: string;
    rackPosition?: string;
    rackUnits?: number;
    siteId?: string;
  };

  technical: {
    manufacturer: string;
    model: string;
    serialNumber: string;
    softwareVersion?: string;
    ipAddressForManagement: string;
    monitoredPortsCount?: number; // How many fibers/ports it can monitor
    measurementCapabilities?: string[]; // e.g., ['IL', 'ORL', 'FaultLocation', 'PMD', 'CD']
    testWavelengthsNm?: number[]; // e.g., [1310, 1550, 1625, 1650]
    dynamicRangeDb?: number; // For OTDR systems
  };

  monitoredElements: {
    elementId: string; // Fiber ID, ODF Port ID, Cable ID
    elementType: ElementType;
    monitoringSchedule?: string; // e.g., 'HOURLY', 'DAILY', 'ON_DEMAND'
    lastTestTimestamp?: Date;
    lastTestResult?: 'PASS' | 'FAIL' | 'DEGRADED';
  }[];

  alertingConfiguration?: {
    thresholds: Record<string, { critical: number; major: number; minor: number; unit: string }>;
    notificationEndpoints?: string[]; // Email, SMS, NMS Trap IPs
  };
}

/**
 * RF Overlay System (Sistema de Superposición de RF para TV) extendido
 */
export interface ExtendedRFOverlaySystem extends ExtendedNetworkElement {
  type: ElementType.RF_OVERLAY_SYSTEM;

  systemComponents: {
    transmitter?: {
      id: string;
      manufacturer: string;
      model: string;
      outputPowerDbm: number;
      wavelengthNm: number; // Typically 1550nm
      modulationIndexPercent?: number;
      inputRfFrequencyRangeMhz?: string; // e.g., '45-1000'
    };
    amplifier?: {
      id: string;
      type: 'EDFA_RF' | 'SPLITTER_COMBINER_RF';
      gainDb?: number;
    };
    receiverAtOntSide?: {
      modelUsedWithOnt?: string[];
      inputOpticalPowerRangeDbm: string;
      outputRfLevelDbMv?: number;
    };
  };

  performance?: {
    carrierToNoiseRatioCnrDb?: number;
    compositeSecondOrderCsoDbc?: number;
    compositeTripleBeatCtbDbc?: number;
  };

  channelLineupId?: string; // Reference to a channel lineup configuration
  monitoredParameters?: string[]; // e.g., ['OpticalInputPower', 'RFOutputLevel']
}

/**
 * Specialized Fiber Cable Types
 */

/**
 * Drop Cable (Cable de Acometida) Extendido
 * Extends ExtendedFiberCable, fixing the element type.
 */
export interface ExtendedDropCable extends ExtendedFiberCable {
  type: ElementType.DROP_CABLE;
  // Specific properties for Drop Cables, if any, beyond ExtendedFiberCable
  // For example, could have a direct link to an ONT or customer premises equipment if not already covered
  targetPremisesInfo?: {
    customerId?: string;
    servicePointId?: string; 
    ontId?: string; // Could be redundant if ONT has a dropCableId field
    installationAddress?: string;
    installationNotes?: string;
  };
  // Información geográfica adicional específica para cables de acometida
  geoInfo?: {
    startLat?: number;
    startLon?: number;
    endLat?: number;
    endLon?: number;
    routePoints?: [number, number][];  // Array de coordenadas [lon, lat] que definen la ruta del cable
    elevationProfile?: {
      distance: number;
      elevation: number;
    }[];  // Perfil de elevación a lo largo de la ruta
    installationHeightMeters?: number;  // Altura de instalación (especialmente para cables aéreos)
  };
}

/**
 * Distribution Cable (Cable de Distribución) Extendido
 * Extends ExtendedFiberCable, fixing the element type.
 */
export interface ExtendedDistributionCable extends ExtendedFiberCable {
  type: ElementType.DISTRIBUTION_CABLE;
  // Specific properties for Distribution Cables
  // e.g., areas or FDPs it primarily serves
  primaryServiceTo?: (ElementType.FDP | ElementType.NAP | ElementType.FAT)[];
  secondaryServiceTo?: (ElementType.TERMINAL_BOX | ElementType.MDU_BUILDING)[];
}

/**
 * Feeder Cable (Cable de Alimentación) Extendido
 * Extends ExtendedFiberCable, fixing the element type.
 */
export interface ExtendedFeederCable extends ExtendedFiberCable {
  type: ElementType.FEEDER_CABLE;
  // Specific properties for Feeder Cables
  // e.g., originating OLT/Site and main FDPs it feeds
  feedsFdps?: string[]; // Array of FDP IDs
  originatesFromSiteOrOlt?: string; // Site ID or OLT ID
}

/**
 * Backbone Cable (Cable Troncal) Extendido
 * Extends ExtendedFiberCable, fixing the element type.
 */
export interface ExtendedBackboneCable extends ExtendedFiberCable {
  type: ElementType.BACKBONE_CABLE;
  // Specific properties for Backbone Cables
  // e.g., linking major sites or POPs
  connectsSites?: { siteA_Id: string; siteB_Id: string; redundancyGroup?: string }[];
  capacityGbps?: number; // Often higher capacity cables
}

/**
 * Logical and Planning Elements
 */

/**
 * Service Tier (Plan de Servicio)
 * Defines a specific offering to customers.
 */
export interface ServiceTier {
  id: string;
  name: string; // e.g., 'Fiber 100/100 Residential', 'Business Gold 1Gbps Symmetric'
  code?: string; // Internal plan code
  description?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'PROMOTIONAL' | 'GRANDFATHERED';

  type: 'RESIDENTIAL' | 'BUSINESS' | 'WHOLESALE' | 'OTHER';
  
  speed: {
    downloadMbps: number;
    uploadMbps: number;
    burstSpeedMbps?: number;
    isSymmetrical: boolean;
  };
  
  dataCap?: {
    limitGB?: number; // Null or undefined for unlimited
    throttlingSpeedMbps?: number; // Speed after cap is reached
  };

  pricing: {
    monthlyFee: number;
    currency: string; // e.g., 'USD', 'EUR'
    installationFee?: number;
    contractTerms?: string; // e.g., '24 months', 'No contract'
    promotionalDetails?: string;
  };

  features?: {
    staticIp?: boolean;
    includedVoipLines?: number;
    iptvPackageId?: string;
    slaId?: string; // Service Level Agreement ID
    additionalServices?: string[]; // e.g., ['Premium Support', 'Online Storage']
  };
  
  availability?: {
    regions?: string[]; // Specific regions or service areas where this tier is available
    requiresPonStandard?: PONStandard[];
  };

  customProperties?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Network Customer (Cliente de la Red)
 * Represents an individual or organization subscribing to services.
 */
export interface NetworkCustomer {
  id: string; // Could be a UUID or a CRM-generated ID
  customerType: 'INDIVIDUAL' | 'BUSINESS' | 'GOVERNMENT' | 'INTERNAL';
  status: 'ACTIVE' | 'PROSPECT' | 'INACTIVE' | 'SUSPENDED' | 'BLACKLISTED';
  
  name: string; // Full name for individual, company name for business
  contactInfo: {
    primaryEmail?: string;
    secondaryEmail?: string;
    primaryPhone?: string;
    mobilePhone?: string;
    preferredContactMethod?: 'EMAIL' | 'PHONE';
  };
  
  billingAddress: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    notes?: string;
  };

  serviceAddresses?: {
    id: string;
    alias?: string; // e.g., 'Main Office', 'Home'
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    position?: GeographicPosition; // For mapping
    installationNotes?: string;
    ontId?: string; // Link to installed ONT at this address
    servicePointId?: string; // Link to a logical service delivery point
  }[];

  financialInfo?: {
    paymentMethod?: 'CREDIT_CARD' | 'BANK_TRANSFER' | 'DIRECT_DEBIT';
    billingCycleDay?: number; // e.g., 1st, 15th
    taxId?: string;
    creditRating?: string;
  };
  
  preferences?: {
    language?: string; // e.g., 'en', 'es'
    receiveMarketingEmails?: boolean;
  };

  accountManagerId?: string; // For business customers
  associatedSubscriptionIds?: string[];
  notes?: string;
  createdAt: Date;
  updatedAt?: Date;
}

/**
 * Subscription (Suscripción / Contrato de Servicio)
 * Links a Customer to a ServiceTier at a specific ServiceAddress.
 */
export interface Subscription {
  id: string;
  customerId: string; 
  serviceTierId: string;
  serviceAddressId?: string; // ID of the specific service address from NetworkCustomer.serviceAddresses
  status: 'ACTIVE' | 'PENDING_INSTALLATION' | 'PENDING_ACTIVATION' | 'SUSPENDED' | 'CANCELLED' | 'ENDED';
  
  activationDate?: Date;
  cancellationDate?: Date;
  contractStartDate?: Date;
  contractEndDate?: Date;
  billingStartDate?: Date;

  primaryOntId?: string; // If directly tied to an ONT for this subscription
  associatedEquipment?: { elementId: string; elementType: ElementType; role: string }[]; // e.g., Modem, Router provided

  notes?: string;
  customConfiguration?: Record<string, any>; // e.g., Static IP assigned, specific VLAN
  createdAt: Date;
  updatedAt?: Date;
}

/**
 * Work Order (Orden de Trabajo)
 * Represents a task to be performed, often related to installation, maintenance, or repair.
 */
export interface WorkOrder {
  id: string;
  workOrderNumber: string; // User-friendly WO number
  type: 'INSTALLATION' | 'REPAIR' | 'MAINTENANCE' | 'DISCONNECTION' | 'SURVEY' | 'UPGRADE' | 'OTHER';
  status: 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED' | 'FAILED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

  title?: string;
  description: string;
  
  creationDate: Date;
  scheduledDate?: Date;
  estimatedDurationHours?: number;
  completionDate?: Date;
  
  assignedTechnicianId?: string;
  assignedTeamId?: string;

  customerId?: string; // Related customer, if applicable
  subscriptionId?: string; // Related subscription, if applicable
  serviceAddressId?: string; // Related service address
  relatedNetworkElement?: { // Element directly affected or target of work
    elementId: string;
    elementType: ElementType;
    name?: string;
  };
  affectedElements?: { elementId: string; elementType: ElementType }[]; // Other elements involved

  location?: {
    address?: string; // Can be copied from service address or entered manually
    position?: GeographicPosition;
    accessNotes?: string;
  };

  requiredMaterials?: { itemId: string; quantity: number; description?: string }[];
  tasks?: { sequence: number; description: string; status: 'PENDING' | 'COMPLETED' | 'SKIPPED'; notes?: string }[];
  notes?: string;
  completionNotes?: string;
  feedback?: {
    rating?: number; // 1-5 stars
    comments?: string;
  };

  attachments?: Attachment[]; // Reuse the Attachment interface
  customProperties?: Record<string, any>;
  createdAt: Date;
  updatedAt?: Date;
}

// Final set of TODOs for completeness:
// TODO: Refine/Specialize Cable Types if ExtendedFiberCable is too generic (e.g., ExtendedDropCable, ExtendedFeederCable)
// TODO: Consider adding more logical/planning elements: ServiceTier, Customer, Contract, WorkOrder etc. if within scope.
// TODO: Review all ElementType usage to ensure they exist in network.types.ts and are appropriate.

// Remaining TODOs from previous step:
// TODO: Add more elements like ROADM, WSS, Amplifiers, Transponders, WDM Filters, Attenuators (as Extended types)
// TODO: Add logical elements like MonitoringSystems

// Note: ElementType enum in network.types.ts has been updated in the previous step.
// Ensure all `type` fields above correctly reference an existing ElementType.

// Consider adding specific cable types if differentiation is large:
// export interface ExtendedDropCable extends ExtendedFiberCable { type: ElementType.DROP_CABLE; ... specific drop properties }
// export interface ExtendedFeederCable extends ExtendedFiberCable { type: ElementType.FEEDER_CABLE; ... specific feeder properties }

// It might also be beneficial to update ElementType enum in network.types.ts
// to include any new specific types like DUCT, POLE, CHAMBER, MDU, NAP, FAT, ROADM, WSS etc.
// if they are not already present. 
