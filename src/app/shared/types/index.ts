/**
 * Exportaciones de tipos para el módulo compartido
 */

// Exportar tipos básicos
export * from './network.types';
export * from './geo-position';
export * from './network-elements';
export * from './network-aux.types';

// Exportar tipos extendidos con nombres específicos para evitar conflictos
export {
  ExtendedNetworkElement,
  ExtendedSite,
  ExtendedRack,
  ExtendedOLT,
  ExtendedFDP,
  ExtendedManga,
  
  // Sobreescribir enums extendidos con alias para evitar conflictos
  ConnectorType as ExtendedConnectorType,
  FiberType as ExtendedFiberType,
  SplitterType as ExtendedSplitterType,
  CableType as ExtendedCableType,
  
  // Tipos adicionales
  Certification,
  AuditEntry,
  SpliceMethodType,
  
  // Sobrescribir este tipo con un alias para evitar conflictos
  Attachment as ExtendedAttachment
} from './network-elements-extended';

// Nuevas interfaces extendidas para elementos adicionales
export {
  ExtendedONT,
  ExtendedODF,
  ExtendedPole,
  ExtendedChamber,
  ExtendedDuct,
  ExtendedFiberCable,
  ExtendedSlackLoop
} from './network-elements-extended';

// Nuevas interfaces extendidas para elementos adicionales - Fase 2
export {
  ExtendedNAP,
  ExtendedFAT,
  ExtendedMDUBuilding,
  ExtendedRoute,
  ExtendedServiceArea
} from './network-elements-extended';

// Nuevas interfaces extendidas para elementos adicionales - Fase 3
export {
  ExtendedROADM,
  ExtendedWSS,
  ExtendedOpticalAmplifier,
  ExtendedTransponder,
  ExtendedWDMFilter,
  ExtendedAttenuator,
  ExtendedMonitoringSystem,
  ExtendedRFOverlaySystem
} from './network-elements-extended';

// Specialized Fiber Cable Types
export {
  ExtendedDropCable,
  ExtendedDistributionCable,
  ExtendedFeederCable,
  ExtendedBackboneCable
} from './network-elements-extended';

// Logical and Planning Element Types
export {
  ServiceTier,
  NetworkCustomer,
  Subscription,
  WorkOrder
} from './network-elements-extended'; 
