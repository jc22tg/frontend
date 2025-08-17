/**
 * Funciones auxiliares y utilidades para trabajar con elementos de red
 * Este archivo proporciona funciones para visualización y manipulación de elementos
 */

import { ElementType } from './network.types';

/**
 * Tipo para compatibilidad con código existente
 * @deprecated Usar ElementType directamente
 */
export type ExtendedElementType = ElementType;

/**
 * Tipo combinado para compatibilidad con código existente
 * @deprecated Usar ElementType directamente
 */
export type CombinedElementType = ElementType;

/**
 * Función utilidad para convertir un tipo extendido a tipo básico cuando sea posible
 * @param type Tipo de elemento
 * @returns Tipo de elemento básico o el mismo tipo si no hay equivalente
 * @deprecated Esta función se mantiene para compatibilidad
 */
export function toBaseElementType(type: ElementType): ElementType {
  // Esta función ya no es necesaria porque ahora usamos un solo enum,
  // pero se mantiene para compatibilidad con código existente
  return type;
}

/**
 * Obtiene un ícono recomendado para el tipo de elemento
 * @param type Tipo de elemento
 * @returns Nombre de ícono de Material Design
 */
export function getElementIcon(type: ElementType): string {
  switch (type) {
    case ElementType.OLT:
    case ElementType.MSAN:
      return 'router';
    case ElementType.ONT:
      return 'device_hub';
    case ElementType.SPLITTER:
      return 'call_split';
    case ElementType.ODF:
    case ElementType.FDP:
      return 'settings_input_hdmi';
    case ElementType.EDFA:
    case ElementType.OPTICAL_AMPLIFIER:
      return 'electrical_services';
    case ElementType.MANGA:
    case ElementType.FIBER_CLOSURE:
    case ElementType.SPLICE_BOX:
      return 'cable';
    case ElementType.TERMINAL_BOX:
    case ElementType.NAP:
    case ElementType.FAT:
    case ElementType.DISTRIBUTION_BOX:
      return 'inbox';
    case ElementType.RACK:
    case ElementType.CABINET:
      return 'dns';
    case ElementType.ROUTER:
    case ElementType.GATEWAY:
      return 'wifi_tethering';
    case ElementType.FIBER_CONNECTION:
    case ElementType.FIBER_THREAD:
      return 'timeline';
    case ElementType.WDM_FILTER:
    case ElementType.ATTENUATOR:
      return 'filter_alt';
    case ElementType.OPTICAL_SWITCH:
    case ElementType.SWITCH:
      return 'swap_horiz';
    case ElementType.ROADM:
    case ElementType.MULTIPLEXER:
    case ElementType.DEMULTIPLEXER:
      return 'swap_calls';
    case ElementType.FIBER_SPLICE:
    case ElementType.CONNECTOR:
    case ElementType.CROSS_CONNECT:
      return 'settings_input_component';
    case ElementType.DROP_CABLE:
    case ElementType.DISTRIBUTION_CABLE:
    case ElementType.FEEDER_CABLE:
    case ElementType.BACKBONE_CABLE:
      return 'settings_ethernet';
    case ElementType.COHERENT_TRANSPONDER:
      return 'memory';
    case ElementType.WAVELENGTH_ROUTER:
      return 'router';
    case ElementType.NETWORK_GRAPH:
      return 'grain';
    case ElementType.POLE:
      return 'light_pole';
    case ElementType.CHAMBER:
      return 'foundation';
    case ElementType.BUILDING:
      return 'business';
    case ElementType.SITE:
    case ElementType.NODE:
      return 'location_on';
    case ElementType.PATCH_PANEL:
      return 'grid_3x3';
    case ElementType.REPEATER:
      return 'wifi_repeater';
    case ElementType.SUBSCRIBER:
    case ElementType.SERVICE_POINT:
      return 'person_pin';
    case ElementType.AGGREGATION_POINT:
      return 'hub';
    case ElementType.ACCESS_POINT:
      return 'signal_cellular_alt';
    case ElementType.HUB:
      return 'device_hub';
    default:
      return 'device_unknown';
  }
}

/**
 * Obtiene el nombre legible para el tipo de elemento
 * @param type Tipo de elemento
 * @returns Nombre legible en español
 */
export function getElementTypeName(type: ElementType): string {
  switch (type) {
    case ElementType.OLT: return 'Terminal de Línea Óptica';
    case ElementType.ONT: return 'Terminal de Red Óptica';
    case ElementType.FDP: return 'Punto de Distribución';
    case ElementType.SPLITTER: return 'Divisor Óptico';
    case ElementType.EDFA: return 'Amplificador EDFA';
    case ElementType.MANGA: return 'Manga de Empalme';
    case ElementType.TERMINAL_BOX: return 'Caja Terminal';
    case ElementType.MSAN: return 'Nodo de Acceso Multi-Servicio';
    case ElementType.ODF: return 'Distribuidor de Fibra Óptica';
    case ElementType.ROUTER: return 'Router';
    case ElementType.RACK: return 'Rack';
    case ElementType.FIBER_CONNECTION: return 'Conexión de Fibra';
    case ElementType.FIBER_THREAD: return 'Hilo de Fibra';
    case ElementType.DROP_CABLE: return 'Cable de Acometida';
    case ElementType.DISTRIBUTION_CABLE: return 'Cable de Distribución';
    case ElementType.FEEDER_CABLE: return 'Cable Alimentador';
    case ElementType.BACKBONE_CABLE: return 'Cable Troncal';
    case ElementType.WDM_FILTER: return 'Filtro WDM';
    case ElementType.OPTICAL_SWITCH: return 'Conmutador Óptico';
    case ElementType.ROADM: return 'Multiplexor Óptico Reconfigurable';
    case ElementType.COHERENT_TRANSPONDER: return 'Transpondedor Coherente';
    case ElementType.WAVELENGTH_ROUTER: return 'Router de Longitudes de Onda';
    case ElementType.FIBER_SPLICE: return 'Empalme de Fibra';
    case ElementType.OPTICAL_AMPLIFIER: return 'Amplificador Óptico';
    case ElementType.NETWORK_GRAPH: return 'Grafo de Red';
    case ElementType.SLACK_FIBER: return 'Reserva de Fibra';
    case ElementType.CABINET: return 'Gabinete';
    case ElementType.CHAMBER: return 'Cámara/Pozo';
    case ElementType.POLE: return 'Poste';
    case ElementType.BUILDING: return 'Edificio';
    case ElementType.SITE: return 'Sitio/Local';
    case ElementType.NODE: return 'Nodo';
    case ElementType.PATCH_PANEL: return 'Panel de Parcheo';
    case ElementType.FIBER_CLOSURE: return 'Cierre de Fibra';
    case ElementType.SWITCH: return 'Switch/Conmutador';
    case ElementType.MULTIPLEXER: return 'Multiplexor';
    case ElementType.DEMULTIPLEXER: return 'Demultiplexor';
    case ElementType.REPEATER: return 'Repetidor';
    case ElementType.ATTENUATOR: return 'Atenuador';
    case ElementType.CONNECTOR: return 'Conector';
    case ElementType.CROSS_CONNECT: return 'Cruzada';
    case ElementType.SUBSCRIBER: return 'Abonado/Cliente';
    case ElementType.SERVICE_POINT: return 'Punto de Servicio';
    case ElementType.AGGREGATION_POINT: return 'Punto de Agregación';
    case ElementType.SPLICE_BOX: return 'Caja de Empalme';
    case ElementType.NAP: return 'Punto de Acceso a la Red';
    case ElementType.FAT: return 'Terminal de Acceso de Fibra';
    case ElementType.DISTRIBUTION_BOX: return 'Caja de Distribución';
    case ElementType.ACCESS_POINT: return 'Punto de Acceso';
    case ElementType.HUB: return 'Concentrador';
    case ElementType.GATEWAY: return 'Pasarela';
    case ElementType.CUSTOM: return 'Elemento Personalizado';
    default: return 'Elemento de Red';
  }
}

/**
 * Obtiene el color de visualización recomendado para un tipo de elemento
 * @param type Tipo de elemento
 * @returns Código de color en formato hex
 */
export function getElementTypeColor(type: ElementType): string {
  switch (type) {
    case ElementType.OLT: return '#FF5722'; // Naranja profundo
    case ElementType.ONT: return '#4CAF50'; // Verde
    case ElementType.SPLITTER: return '#673AB7'; // Morado
    case ElementType.ODF: return '#3F51B5'; // Indigo
    case ElementType.FDP: return '#2196F3'; // Azul
    case ElementType.TERMINAL_BOX: return '#00BCD4'; // Cyan
    case ElementType.MANGA: return '#607D8B'; // Gris azulado
    case ElementType.FIBER_CONNECTION: return '#9E9E9E'; // Gris
    case ElementType.EDFA: return '#795548'; // Marrón
    case ElementType.RACK: return '#9C27B0'; // Púrpura
    case ElementType.MSAN: return '#E91E63'; // Rosa
    case ElementType.ROUTER: return '#F44336'; // Rojo
    default: return '#9E9E9E'; // Gris por defecto
  }
}

/**
 * Clasifica elementos por su función principal
 * @param type Tipo de elemento
 * @returns Categoría del elemento
 */
export function getElementCategory(type: ElementType): 'activo' | 'pasivo' | 'infraestructura' | 'conexión' | 'otro' {
  // Elementos activos (con alimentación/electrónica)
  if ([
    ElementType.OLT, 
    ElementType.ONT, 
    ElementType.ROUTER,
    ElementType.MSAN,
    ElementType.EDFA,
    ElementType.OPTICAL_AMPLIFIER,
    ElementType.OPTICAL_SWITCH,
    ElementType.ROADM,
    ElementType.COHERENT_TRANSPONDER,
    ElementType.WAVELENGTH_ROUTER
  ].includes(type)) {
    return 'activo';
  }
  
  // Elementos pasivos (sin alimentación)
  if ([
    ElementType.SPLITTER,
    ElementType.ODF,
    ElementType.FDP,
    ElementType.TERMINAL_BOX,
    ElementType.WDM_FILTER,
    ElementType.ATTENUATOR,
    ElementType.CONNECTOR
  ].includes(type)) {
    return 'pasivo';
  }
  
  // Infraestructura física
  if ([
    ElementType.MANGA,
    ElementType.RACK,
    ElementType.CABINET,
    ElementType.POLE,
    ElementType.BUILDING,
    ElementType.CHAMBER,
    ElementType.SITE
  ].includes(type)) {
    return 'infraestructura';
  }
  
  // Conexiones y cables
  if ([
    ElementType.FIBER_CONNECTION,
    ElementType.FIBER_THREAD,
    ElementType.FIBER_SPLICE,
    ElementType.FIBER_CABLE,
    ElementType.DROP_CABLE,
    ElementType.DISTRIBUTION_CABLE,
    ElementType.FEEDER_CABLE,
    ElementType.BACKBONE_CABLE
  ].includes(type)) {
    return 'conexión';
  }
  
  // Todo lo demás
  return 'otro';
}

export interface OLT {
  id: string;
  name: string;
  type: ElementType.OLT;
  status: string;
  position: any;
  [key: string]: any;
}

export interface Splitter {
  id: string;
  name: string;
  type: ElementType.SPLITTER;
  status: string;
  position: any;
  [key: string]: any;
}

export interface ONT {
  id: string;
  name: string;
  type: ElementType.ONT;
  status: string;
  position: any;
  [key: string]: any;
}

export interface FiberThread {
  id: string;
  name: string;
  type: ElementType.FIBER_THREAD;
  status: string;
  position: any;
  [key: string]: any;
}

export interface FiberStrand {
  id: string;
  cableId: string;
  strandNumber: number;
  color: string;
  type: ElementType.FIBER_STRAND;
  status: string;
  length: number;
  attenuation: number;
  sourceElementId: string;
  targetElementId: string;
  isSpare: boolean;
  [key: string]: any;
} 
