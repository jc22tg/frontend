import { Observable } from 'rxjs';
import { ElementType, ElementStatus, NetworkElement, FiberType, CableType } from '../../../shared/types/network.types';
import { EDFA as SharedEDFA } from '../../../shared/models/edfa.model';
import { Manga as SharedManga } from '../../../shared/models/manga.model';

/**
 * Definición de interfaces locales para verificación de tipos
 */
export interface OLT extends NetworkElement {
  type: ElementType.OLT;
  rackId?: string;
  rackPosition?: string;
  manufacturer: string;
  model: string;
  serialNumber?: string;
  installationDate?: Date;
  portCount: number;
  ponPorts: number;
  ipAddress?: string;
  macAddress?: string;
  firmwareVersion?: string;
  uplinkPortIds?: string[]; // Puertos de subida
  connectedSplitterIds?: string[]; // Splitters conectados
}

export interface ONT extends NetworkElement {
  type: ElementType.ONT;
  manufacturer: string;
  model: string;
  serialNumber: string;
  installationDate?: Date;
  clientId?: string;
  macAddress?: string;
  ipAddress?: string;
  oltId?: string;
  connectedFiberThreadId?: string; // Hilo de fibra conectado
  servicePortIds?: string[]; // Puertos de servicio
  subscriberId?: string; // Abonado relacionado
}

export interface ODF extends NetworkElement {
  type: ElementType.ODF;
  manufacturer: string;
  model: string;
  installationDate?: Date;
  totalPortCapacity: number;
  usedPorts: number;
  rackId?: string;
  inputFiberThreadIds?: string[]; // Hilos de entrada
  outputFiberThreadIds?: string[]; // Hilos de salida
  location?: string; // Ubicación física
}

export interface Splitter extends NetworkElement {
  type: ElementType.SPLITTER;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  installationDate?: Date;
  splitRatio: string; // e.g., "1:8", "1:16", "1:32"
  insertionLoss?: number;
  inputFiberThreadId?: string; // ID del hilo de fibra que alimenta el splitter
  outputFiberThreadIds?: string[]; // Hilos de salida del splitter
}

export interface TerminalBox extends NetworkElement {
  type: ElementType.TERMINAL_BOX;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  installationDate?: Date;
  portCapacity: number;
  usedPorts: number;
  mountingType?: string;
  inputFiberThreadId?: string;
  outputFiberThreadIds?: string[];
  subscriberIds?: string[];
}

export interface SlackFiber extends NetworkElement {
  type: ElementType.SLACK_FIBER;
  length: number;
  fiberConnectionId?: string;
  fiberType?: FiberType;
  manufacturer?: string;
  model?: string;
  installationDate?: Date;
  stockLength?: number;
  relatedFiberThreadIds?: string[];
}

export interface FiberThread extends NetworkElement {
  type: ElementType.FIBER_THREAD;
  length: number;
  color?: string;
  coreNumber?: number;
  cableId?: string;
  fiberType?: FiberType;
  fromElementId?: string; // Elemento de origen
  toElementId?: string; // Elemento de destino
  status: ElementStatus; // Estado del hilo
}

export interface Rack extends NetworkElement {
  type: ElementType.RACK;
  siteId: string;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  installationDate?: Date;
  heightUnits: number;
  width: number;
  depth: number;
  totalU: number;
  usedU: number;
  roomName: string;
  elementIds?: string[]; // Elementos montados en el rack
}

/**
 * Interfaz para el servicio de elementos
 */
export interface IElementService {
  /**
   * Obtiene el nombre del tipo de elemento en formato legible
   */
  getElementTypeName(type: ElementType): string;

  /**
   * Obtiene la clase CSS para el estado del elemento
   */
  getElementStatusClass(status: ElementStatus): string;

  /**
   * Obtiene una propiedad específica de un elemento según su tipo
   */
  getElementProperty<T extends NetworkElement, K extends keyof T>(element: T, property: K): T[K];

  /**
   * Verifica si un elemento es de tipo OLT
   */
  isOLT(element: NetworkElement): element is (NetworkElement & OLT);

  /**
   * Verifica si un elemento es de tipo ONT
   */
  isONT(element: NetworkElement): element is (NetworkElement & ONT);

  /**
   * Verifica si un elemento es de tipo ODF
   */
  isODF(element: NetworkElement): element is (NetworkElement & ODF);

  /**
   * Verifica si un elemento es de tipo EDFA
   */
  isEDFA(element: NetworkElement): element is (NetworkElement & SharedEDFA);

  /**
   * Verifica si un elemento es de tipo Splitter
   */
  isSplitter(element: NetworkElement): element is (NetworkElement & Splitter);

  /**
   * Verifica si un elemento es de tipo Manga
   */
  isManga(element: NetworkElement): element is (NetworkElement & SharedManga);

  /**
   * Verifica si es una caja terminal
   */
  isTerminalBox(element: NetworkElement): element is TerminalBox;

  /**
   * Verifica si un elemento es de tipo SlackFiber
   */
  isSlackFiber(element: NetworkElement): element is SlackFiber;

  /**
   * Verifica si un elemento es de tipo FiberThread
   */
  isFiberThread(element: NetworkElement): element is FiberThread;

  /**
   * Formatea un tamaño de archivo en bytes a una representación legible
   */
  formatFileSize(bytes: number): string;
}

// Elementos de red adicionales según ElementType

export interface Cabinet extends NetworkElement {
  type: ElementType.CABINET;
  location: {
    latitude: number;
    longitude: number;
  };
  capacity: number;
  elementIds?: string[];
}

export interface Chamber extends NetworkElement {
  type: ElementType.CHAMBER;
  location: {
    latitude: number;
    longitude: number;
  };
  capacity: number;
  connectedCableIds?: string[];
}

export interface Pole extends NetworkElement {
  type: ElementType.POLE;
  location: {
    latitude: number;
    longitude: number;
  };
  height: number;
  material: string;
  supportedCableIds?: string[];
}

export interface Building extends NetworkElement {
  type: ElementType.BUILDING;
  location: {
    latitude: number;
    longitude: number;
  };
  address: string;
  siteId?: string;
  connectedElementIds?: string[];
}

export interface Site extends NetworkElement {
  type: ElementType.SITE;
  location: {
    latitude: number;
    longitude: number;
  };
  name: string;
  address: string;
  elementIds?: string[];
}

export interface Node extends NetworkElement {
  type: ElementType.NODE;
  location: {
    latitude: number;
    longitude: number;
  };
  nodeType: string;
  connectedElementIds?: string[];
}

export interface PatchPanel extends NetworkElement {
  type: ElementType.PATCH_PANEL;
  rackId?: string;
  portCount?: number;
  connectorType?: string;      // SC, LC, etc.
  manufacturer?: string;
  model?: string;
}

export interface FiberClosure extends NetworkElement {
  type: ElementType.FIBER_CLOSURE;
  location: {
    latitude: number;
    longitude: number;
  };
  capacity: number;
  inputFiberThreadIds?: string[];
  outputFiberThreadIds?: string[];
}

export interface Switch extends NetworkElement {
  type: ElementType.SWITCH;
  rackId?: string;
  portCount?: number;
  switchType?: string;         // L2, L3, PoE, etc.
  manufacturer?: string;
  model?: string;
  managementIp?: string;
}

export interface Multiplexer extends NetworkElement {
  type: ElementType.MULTIPLEXER;
  rackId?: string;
  channelCount?: number;
  muxType?: string;            // CWDM, DWDM, etc.
  manufacturer?: string;
  model?: string;
}

export interface Demultiplexer extends NetworkElement {
  type: ElementType.DEMULTIPLEXER;
  rackId?: string;
  channelCount?: number;
  demuxType?: string;          // CWDM, DWDM, etc.
  manufacturer?: string;
  model?: string;
}

export interface Repeater extends NetworkElement {
  type: ElementType.REPEATER;
  // No se han definido propiedades específicas para Repeater
}

export interface Attenuator extends NetworkElement {
  type: ElementType.ATTENUATOR;
  // No se han definido propiedades específicas para Attenuator
}

export interface Connector extends NetworkElement {
  type: ElementType.CONNECTOR;
  location?: {
    latitude: number;
    longitude: number;
  };
  connectorType: string;
  connectedFiberThreadId?: string;
}

export interface CrossConnect extends NetworkElement {
  type: ElementType.CROSS_CONNECT;
  location: {
    latitude: number;
    longitude: number;
  };
  inputPortIds?: string[];
  outputPortIds?: string[];
}

export interface Subscriber extends NetworkElement {
  type: ElementType.SUBSCRIBER;
  location?: {
    latitude: number;
    longitude: number;
  };
  name: string;
  address: string;
  ontId?: string;
}

export interface ServicePoint extends NetworkElement {
  type: ElementType.SERVICE_POINT;
  location: {
    latitude: number;
    longitude: number;
  };
  connectedElementId?: string;
}

export interface AggregationPoint extends NetworkElement {
  type: ElementType.AGGREGATION_POINT;
  location: {
    latitude: number;
    longitude: number;
  };
  connectedSplitterIds?: string[];
  outputFiberThreadIds?: string[];
}

export interface SpliceBox extends NetworkElement {
  type: ElementType.SPLICE_BOX;
  location: {
    latitude: number;
    longitude: number;
  };
  capacity: number;
  inputFiberThreadIds?: string[];
  outputFiberThreadIds?: string[];
}

export interface Nap extends NetworkElement {
  type: ElementType.NAP;
  location: {
    latitude: number;
    longitude: number;
  };
  connectedFiberThreadIds?: string[];
  subscriberIds?: string[];
}

export interface Fat extends NetworkElement {
  type: ElementType.FAT;
  location: {
    latitude: number;
    longitude: number;
  };
  capacity: number;
  connectedFiberThreadIds?: string[];
}

export interface DistributionBox extends NetworkElement {
  type: ElementType.DISTRIBUTION_BOX;
  location: {
    latitude: number;
    longitude: number;
  };
  capacity: number;
  inputFiberThreadIds?: string[];
  outputFiberThreadIds?: string[];
}

export interface AccessPoint extends NetworkElement {
  type: ElementType.ACCESS_POINT;
  location: {
    latitude: number;
    longitude: number;
  };
  connectedElementId?: string;
}

export interface Hub extends NetworkElement {
  type: ElementType.HUB;
  location: {
    latitude: number;
    longitude: number;
  };
  connectedElementIds?: string[];
}

export interface Gateway extends NetworkElement {
  type: ElementType.GATEWAY;
  location: {
    latitude: number;
    longitude: number;
  };
  ipAddress?: string;
  connectedElementIds?: string[];
}

export interface FiberCable extends NetworkElement {
  type:
    | ElementType.FIBER_CABLE
    | ElementType.DROP_CABLE
    | ElementType.DISTRIBUTION_CABLE
    | ElementType.FEEDER_CABLE
    | ElementType.BACKBONE_CABLE;
  geometry: {
    coordinates: { latitude: number; longitude: number }[];
  };
  fromElementId: string;
  toElementId: string;
  fiberCount: number;
  cableType: CableType;
  length?: number;
  attenuation?: number;
}

export interface CoherentTransponder extends NetworkElement {
  type: ElementType.COHERENT_TRANSPONDER;
  location: {
    latitude: number;
    longitude: number;
  };
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  installationDate?: Date;
  channelCount?: number;
  supportedProtocols?: string[];
  maxDataRateGbps?: number;
  inputPortIds?: string[];
  outputPortIds?: string[];
}

export interface Custom extends NetworkElement {
  type: ElementType.CUSTOM;
  location: {
    latitude: number;
    longitude: number;
  };
  category?: string;
  subCategory?: string;
  manufacturer?: string;
  model?: string;
  technicalDescription?: string;
  height?: number;
  width?: number;
  depth?: number;
  weight?: number;
  inputPorts?: number;
  outputPorts?: number;
  connectionType?: string;
  connectionDetails?: string;
  installationDate?: Date;
  serialNumber?: string;
  notes?: string;
}

export interface FiberSplice extends NetworkElement {
  type: ElementType.FIBER_SPLICE;
  spliceType: 'fusion' | 'mechanical'; // Tipo de empalme
  inputFiberThreadIds: string[]; // Hilos de entrada
  outputFiberThreadIds: string[]; // Hilos de salida
  lossDb?: number; // Atenuación del empalme
  location?: {
    latitude: number;
    longitude: number;
  };
  installationDate?: Date;
  notes?: string;
}

export interface WavelengthRouter extends NetworkElement {
  type: ElementType.WAVELENGTH_ROUTER;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  installationDate?: Date;
  portCount?: number;
  wavelengthRange?: string; // Ej: "1260-1625nm"
  inputPortIds?: string[];
  outputPortIds?: string[];
  location?: {
    latitude: number;
    longitude: number;
  };
  notes?: string;
}

export interface WdmFilter extends NetworkElement {
  type: ElementType.WDM_FILTER;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  installationDate?: Date;
  filterType?: string; // Ej: "CWDM", "DWDM", "Bandpass"
  supportedWavelengths?: string; // Ej: "1270,1290,1310..." o rango
  inputPortIds?: string[];
  outputPortIds?: string[];
  location?: {
    latitude: number;
    longitude: number;
  };
  notes?: string;
}

// Puedes seguir este patrón para cualquier otro tipo nuevo que se agregue al enum ElementType. 
