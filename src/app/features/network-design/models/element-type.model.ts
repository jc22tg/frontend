/**
 * Enum que define los tipos posibles de elementos de red
 */
export enum ElementType {
  OLT = 'OLT',
  ONT = 'ONT',
  FDP = 'FDP',
  SPLITTER = 'SPLITTER',
  SWITCH = 'SWITCH',
  ROUTER = 'ROUTER',
  SERVER = 'SERVER',
  ANTENNA = 'ANTENNA',
  OTHER = 'OTHER'
}

/**
 * Interfaz que define las propiedades de un tipo de elemento
 */
export interface ElementTypeInfo {
  id: ElementType;
  name: string;
  icon: string;
  description?: string;
}

/**
 * Conjunto de información para cada tipo de elemento
 */
export const ELEMENT_TYPES: Record<ElementType, ElementTypeInfo> = {
  [ElementType.OLT]: {
    id: ElementType.OLT,
    name: 'Terminal de Línea Óptica',
    icon: 'router',
    description: 'Equipo de cabecera en redes PON'
  },
  [ElementType.ONT]: {
    id: ElementType.ONT,
    name: 'Terminal de Red Óptica',
    icon: 'device_hub',
    description: 'Equipo de cliente en redes PON'
  },
  [ElementType.FDP]: {
    id: ElementType.FDP,
    name: 'Punto de Distribución de Fibra',
    icon: 'call_split',
    description: 'Caja de empalme y distribución de fibra'
  },
  [ElementType.SPLITTER]: {
    id: ElementType.SPLITTER,
    name: 'Divisor Óptico',
    icon: 'alt_route',
    description: 'Dispositivo que divide la señal óptica'
  },
  [ElementType.SWITCH]: {
    id: ElementType.SWITCH,
    name: 'Conmutador',
    icon: 'lan',
    description: 'Dispositivo de interconexión de red'
  },
  [ElementType.ROUTER]: {
    id: ElementType.ROUTER,
    name: 'Enrutador',
    icon: 'wifi_tethering',
    description: 'Dispositivo que encamina paquetes de datos'
  },
  [ElementType.SERVER]: {
    id: ElementType.SERVER,
    name: 'Servidor',
    icon: 'dns',
    description: 'Equipo que proporciona servicios a la red'
  },
  [ElementType.ANTENNA]: {
    id: ElementType.ANTENNA,
    name: 'Antena',
    icon: 'settings_input_antenna',
    description: 'Dispositivo de comunicación inalámbrica'
  },
  [ElementType.OTHER]: {
    id: ElementType.OTHER,
    name: 'Otro',
    icon: 'device_unknown',
    description: 'Otro tipo de elemento de red'
  }
}; 