import { ElementType, ElementStatus } from '../types/network.types';

/**
 * Nombres legibles para cada tipo de elemento de red
 */
export const ELEMENT_TYPE_NAMES: Record<ElementType, string> = {
  [ElementType.OLT]: 'Terminal de Línea Óptica',
  [ElementType.ONT]: 'Terminal de Red Óptica',
  [ElementType.FDP]: 'Punto de Distribución de Fibra',
  [ElementType.ODF]: 'Marco de Distribución Óptica',
  [ElementType.EDFA]: 'Amplificador de Fibra',
  [ElementType.SPLITTER]: 'Divisor Óptico',
  [ElementType.MANGA]: 'Manga de Empalme',
  [ElementType.TERMINAL_BOX]: 'Caja Terminal',
  [ElementType.FIBER_THREAD]: 'Hilo de Fibra',
  [ElementType.FIBER_CONNECTION]: 'Conexión de Fibra',
  [ElementType.FIBER_SPLICE]: 'Empalme de Fibra',
  [ElementType.FIBER_CABLE]: 'Cable de Fibra',
  [ElementType.FIBER_STRAND]: 'Hilo de Fibra',
  [ElementType.DROP_CABLE]: 'Cable de Acometida',
  [ElementType.DISTRIBUTION_CABLE]: 'Cable de Distribución',
  [ElementType.FEEDER_CABLE]: 'Cable Alimentador',
  [ElementType.BACKBONE_CABLE]: 'Cable Troncal',
  [ElementType.ROUTER]: 'Router',
  [ElementType.RACK]: 'Rack',
  [ElementType.MSAN]: 'Nodo de Acceso Multi-Servicio',
  [ElementType.NETWORK_GRAPH]: 'Grafo de Red',
  [ElementType.WDM_FILTER]: 'Filtro WDM',
  [ElementType.COHERENT_TRANSPONDER]: 'Transpondedor Coherente',
  [ElementType.WAVELENGTH_ROUTER]: 'Enrutador de Longitudes de Onda',
  [ElementType.OPTICAL_SWITCH]: 'Conmutador Óptico',
  [ElementType.ROADM]: 'Multiplexor Óptico Reconfigurable',
  [ElementType.OPTICAL_AMPLIFIER]: 'Amplificador Óptico'
};

/**
 * Íconos asociados a cada tipo de elemento
 */
export const ELEMENT_TYPE_ICONS: Record<ElementType, string> = {
  [ElementType.OLT]: 'router',
  [ElementType.ONT]: 'device_hub',
  [ElementType.FDP]: 'cable',
  [ElementType.ODF]: 'settings_input_hdmi',
  [ElementType.EDFA]: 'electrical_services',
  [ElementType.SPLITTER]: 'call_split',
  [ElementType.MANGA]: 'cable',
  [ElementType.TERMINAL_BOX]: 'inbox',
  [ElementType.FIBER_THREAD]: 'timeline',
  [ElementType.FIBER_CONNECTION]: 'timeline',
  [ElementType.FIBER_SPLICE]: 'settings_input_component',
  [ElementType.FIBER_CABLE]: 'settings_ethernet',
  [ElementType.FIBER_STRAND]: 'settings_ethernet',
  [ElementType.DROP_CABLE]: 'settings_ethernet',
  [ElementType.DISTRIBUTION_CABLE]: 'settings_ethernet',
  [ElementType.FEEDER_CABLE]: 'settings_ethernet',
  [ElementType.BACKBONE_CABLE]: 'settings_ethernet',
  [ElementType.ROUTER]: 'wifi_tethering',
  [ElementType.RACK]: 'dns',
  [ElementType.MSAN]: 'device_hub',
  [ElementType.NETWORK_GRAPH]: 'share',
  [ElementType.WDM_FILTER]: 'filter_alt',
  [ElementType.COHERENT_TRANSPONDER]: 'dvr',
  [ElementType.WAVELENGTH_ROUTER]: 'router',
  [ElementType.OPTICAL_SWITCH]: 'swap_horiz',
  [ElementType.ROADM]: 'swap_calls',
  [ElementType.OPTICAL_AMPLIFIER]: 'trending_up'
};

/**
 * Clases CSS para los diferentes estados de elementos
 */
export const ELEMENT_STATUS_CLASSES: Record<ElementStatus, string> = {
  [ElementStatus.ACTIVE]: 'status-active',
  [ElementStatus.INACTIVE]: 'status-inactive',
  [ElementStatus.MAINTENANCE]: 'status-maintenance',
  [ElementStatus.FAULT]: 'status-fault',
  [ElementStatus.PLANNED]: 'status-planned',
  [ElementStatus.BUILDING]: 'status-building',
  [ElementStatus.RESERVED]: 'status-reserved',
  [ElementStatus.DECOMMISSIONED]: 'status-decommissioned',
  [ElementStatus.WARNING]: 'status-warning',
  [ElementStatus.CRITICAL]: 'status-critical',
  [ElementStatus.UNKNOWN]: 'status-unknown'
};

/**
 * Nombres de estados en formato legible
 */
export const ELEMENT_STATUS_NAMES: Record<ElementStatus, string> = {
  [ElementStatus.ACTIVE]: 'Activo',
  [ElementStatus.INACTIVE]: 'Inactivo',
  [ElementStatus.MAINTENANCE]: 'En mantenimiento',
  [ElementStatus.FAULT]: 'Con fallo',
  [ElementStatus.PLANNED]: 'Planificado',
  [ElementStatus.BUILDING]: 'En construcción',
  [ElementStatus.RESERVED]: 'Reservado',
  [ElementStatus.DECOMMISSIONED]: 'Fuera de servicio',
  [ElementStatus.WARNING]: 'Con advertencias',
  [ElementStatus.CRITICAL]: 'Estado crítico',
  [ElementStatus.UNKNOWN]: 'Desconocido'
};

/**
 * Grupos de elementos por categoría para menús y filtros
 */
export const ELEMENT_GROUPS = {
  ACTIVE_EQUIPMENT: [
    ElementType.OLT,
    ElementType.ONT,
    ElementType.EDFA,
    ElementType.ROUTER,
    ElementType.MSAN,
    ElementType.ROADM,
    ElementType.COHERENT_TRANSPONDER,
    ElementType.OPTICAL_SWITCH,
    ElementType.OPTICAL_AMPLIFIER
  ],
  PASSIVE_EQUIPMENT: [
    ElementType.ODF,
    ElementType.FDP,
    ElementType.SPLITTER,
    ElementType.MANGA,
    ElementType.TERMINAL_BOX,
    ElementType.RACK,
    ElementType.WDM_FILTER
  ],
  CABLES: [
    ElementType.FIBER_CABLE,
    ElementType.DROP_CABLE,
    ElementType.DISTRIBUTION_CABLE,
    ElementType.FEEDER_CABLE,
    ElementType.BACKBONE_CABLE,
    ElementType.FIBER_THREAD,
    ElementType.FIBER_STRAND
  ],
  CONNECTIONS: [
    ElementType.FIBER_CONNECTION,
    ElementType.FIBER_SPLICE
  ],
  VIRTUAL: [
    ElementType.NETWORK_GRAPH,
    ElementType.WAVELENGTH_ROUTER
  ]
}; 