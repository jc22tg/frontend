import { ElementType, ElementStatus } from '../types/network.types';

/**
 * Nombres legibles para cada tipo de elemento de red
 */
export const ELEMENT_TYPE_NAMES: Partial<Record<ElementType, string>> = {
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
  [ElementType.OPTICAL_AMPLIFIER]: 'Amplificador Óptico',
  [ElementType.SLACK_FIBER]: 'Flojo de Fibra',
  [ElementType.CUSTOM]: 'Elemento Personalizado',
  [ElementType.CABINET]: 'Gabinete',
  [ElementType.CHAMBER]: 'Cámara/Pozo',
  [ElementType.POLE]: 'Poste',
  [ElementType.BUILDING]: 'Edificio',
  [ElementType.SITE]: 'Sitio/Local',
  [ElementType.NODE]: 'Nodo',
  [ElementType.PATCH_PANEL]: 'Panel de Parcheo',
  [ElementType.FIBER_CLOSURE]: 'Cierre de Fibra',
  [ElementType.SWITCH]: 'Switch',
  [ElementType.MULTIPLEXER]: 'Multiplexor',
  [ElementType.DEMULTIPLEXER]: 'Demultiplexor',
  [ElementType.REPEATER]: 'Repetidor',
  [ElementType.ATTENUATOR]: 'Atenuador',
  [ElementType.CONNECTOR]: 'Conector',
  [ElementType.CROSS_CONNECT]: 'Cruzada',
  [ElementType.SUBSCRIBER]: 'Abonado/Cliente',
  [ElementType.SERVICE_POINT]: 'Punto de Servicio',
  [ElementType.AGGREGATION_POINT]: 'Punto de Agregación',
  [ElementType.SPLICE_BOX]: 'Caja de Empalme',
  [ElementType.NAP]: 'Punto de Acceso a la Red',
  [ElementType.FAT]: 'Terminal de Acceso de Fibra',
  [ElementType.DISTRIBUTION_BOX]: 'Caja de Distribución',
  [ElementType.ACCESS_POINT]: 'Punto de Acceso',
  [ElementType.HUB]: 'Concentrador',
  [ElementType.GATEWAY]: 'Pasarela',
  [ElementType.DUCT]: 'Ducto/Canalización',
  [ElementType.WSS]: 'Switch Selectivo de Longitud de Onda',
  [ElementType.RF_OVERLAY_SYSTEM]: 'Sistema RF Overlay',
  [ElementType.MONITORING_SYSTEM]: 'Sistema de Monitorización',
  [ElementType.ROUTE]: 'Ruta',
  [ElementType.SERVICE_AREA]: 'Área de Servicio',
  [ElementType.MDU_BUILDING]: 'Edificio MDU'
};

/**
 * Íconos asociados a cada tipo de elemento
 */
export const ELEMENT_TYPE_ICONS: Partial<Record<ElementType, string>> = {
  [ElementType.OLT]: 'router',
  [ElementType.ONT]: 'device_hub',
  [ElementType.FDP]: 'cable',
  [ElementType.ODF]: 'settings_input_hdmi',
  [ElementType.EDFA]: 'electrical_services',
  [ElementType.SPLITTER]: 'call_split',
  [ElementType.MANGA]: 'manga',
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
  [ElementType.OPTICAL_AMPLIFIER]: 'trending_up',
  [ElementType.SLACK_FIBER]: 'waves',
  [ElementType.CUSTOM]: 'extension',
  [ElementType.CABINET]: 'inventory_2',
  [ElementType.CHAMBER]: 'architecture',
  [ElementType.POLE]: 'candlestick_chart',
  [ElementType.BUILDING]: 'apartment',
  [ElementType.SITE]: 'location_on',
  [ElementType.NODE]: 'hub',
  [ElementType.PATCH_PANEL]: 'dashboard',
  [ElementType.FIBER_CLOSURE]: 'all_inbox',
  [ElementType.SWITCH]: 'swap_horiz',
  [ElementType.MULTIPLEXER]: 'call_merge',
  [ElementType.DEMULTIPLEXER]: 'call_split',
  [ElementType.REPEATER]: 'repeat',
  [ElementType.ATTENUATOR]: 'tune',
  [ElementType.CONNECTOR]: 'link',
  [ElementType.CROSS_CONNECT]: 'compare_arrows',
  [ElementType.SUBSCRIBER]: 'person',
  [ElementType.SERVICE_POINT]: 'room_service',
  [ElementType.AGGREGATION_POINT]: 'merge_type',
  [ElementType.SPLICE_BOX]: 'inbox',
  [ElementType.NAP]: 'network_cell',
  [ElementType.FAT]: 'router',
  [ElementType.DISTRIBUTION_BOX]: 'inventory',
  [ElementType.ACCESS_POINT]: 'wifi',
  [ElementType.HUB]: 'hub',
  [ElementType.GATEWAY]: 'vpn_lock',
  [ElementType.DUCT]: 'alt_route',
  [ElementType.WSS]: 'settings_ethernet',
  [ElementType.RF_OVERLAY_SYSTEM]: 'settings_input_antenna',
  [ElementType.MONITORING_SYSTEM]: 'monitor_heart',
  [ElementType.ROUTE]: 'alt_route',
  [ElementType.SERVICE_AREA]: 'map',
  [ElementType.MDU_BUILDING]: 'apartment'
};

/**
 * Clases CSS para los diferentes estados de elementos
 */
export const ELEMENT_STATUS_CLASSES: Partial<Record<ElementStatus, string>> = {
  [ElementStatus.ACTIVE]: 'status-active',
  [ElementStatus.INACTIVE]: 'status-inactive',
  [ElementStatus.MAINTENANCE]: 'status-maintenance',
  [ElementStatus.ERROR]: 'status-error',
  [ElementStatus.PLANNING]: 'status-planning',
  [ElementStatus.FAULT]: 'status-fault',
  [ElementStatus.PLANNED]: 'status-planned',
  [ElementStatus.BUILDING]: 'status-building',
  [ElementStatus.RESERVE]: 'status-reserved',
  [ElementStatus.DECOMMISSIONED]: 'status-decommissioned',
  [ElementStatus.WARNING]: 'status-warning',
  [ElementStatus.CRITICAL]: 'status-critical',
  [ElementStatus.UNKNOWN]: 'status-unknown'
};

/**
 * Nombres de estados en formato legible
 */
export const ELEMENT_STATUS_NAMES: Partial<Record<ElementStatus, string>> = {
  [ElementStatus.ACTIVE]: 'Activo',
  [ElementStatus.INACTIVE]: 'Inactivo',
  [ElementStatus.MAINTENANCE]: 'En mantenimiento',
  [ElementStatus.ERROR]: 'Error',
  [ElementStatus.PLANNING]: 'Planificación',
  [ElementStatus.FAULT]: 'Con fallo',
  [ElementStatus.PLANNED]: 'Planificado',
  [ElementStatus.BUILDING]: 'En construcción',
  [ElementStatus.RESERVE]: 'Reservado',
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
    ElementType.OPTICAL_AMPLIFIER,
    ElementType.SWITCH,
    ElementType.MULTIPLEXER,
    ElementType.DEMULTIPLEXER,
    ElementType.REPEATER,
    ElementType.HUB,
    ElementType.GATEWAY,
    ElementType.ACCESS_POINT
  ],
  PASSIVE_EQUIPMENT: [
    ElementType.ODF,
    ElementType.FDP,
    ElementType.SPLITTER,
    ElementType.MANGA,
    ElementType.TERMINAL_BOX,
    ElementType.RACK,
    ElementType.WDM_FILTER,
    ElementType.PATCH_PANEL,
    ElementType.FIBER_CLOSURE,
    ElementType.ATTENUATOR,
    ElementType.CONNECTOR,
    ElementType.CROSS_CONNECT,
    ElementType.SPLICE_BOX,
    ElementType.NAP,
    ElementType.FAT,
    ElementType.DISTRIBUTION_BOX
  ],
  INFRASTRUCTURE: [
    ElementType.CABINET,
    ElementType.CHAMBER,
    ElementType.POLE,
    ElementType.BUILDING,
    ElementType.SITE,
    ElementType.NODE
  ],
  CABLES: [
    ElementType.FIBER_CABLE,
    ElementType.DROP_CABLE,
    ElementType.DISTRIBUTION_CABLE,
    ElementType.FEEDER_CABLE,
    ElementType.BACKBONE_CABLE,
    ElementType.FIBER_THREAD,
    ElementType.FIBER_STRAND,
    ElementType.SLACK_FIBER
  ],
  CONNECTIONS: [
    ElementType.FIBER_CONNECTION,
    ElementType.FIBER_SPLICE
  ],
  VIRTUAL: [
    ElementType.NETWORK_GRAPH,
    ElementType.WAVELENGTH_ROUTER
  ],
  CLIENTS: [
    ElementType.SUBSCRIBER,
    ElementType.SERVICE_POINT,
    ElementType.AGGREGATION_POINT
  ],
  CUSTOM: [
    ElementType.CUSTOM
  ]
}; 
