import * as d3 from 'd3';
import { ElementType, ElementStatus } from '../../../shared/types/network.types';

/**
 * Colores asociados a cada tipo de elemento
 */
export const ELEMENT_COLORS: Record<ElementType | 'default', string> = {
  [ElementType.OLT]: '#E57373',
  [ElementType.ONT]: '#81C784',
  [ElementType.FDP]: '#64B5F6',
  [ElementType.EDFA]: '#FFD54F',
  [ElementType.SPLITTER]: '#BA68C8',
  [ElementType.MANGA]: '#4DB6AC',
  [ElementType.TERMINAL_BOX]: '#F06292',
  [ElementType.FIBER_CONNECTION]: '#A1887F',
  [ElementType.FIBER_SPLICE]: '#FF8A65',
  [ElementType.FIBER_CABLE]: '#7986CB',
  [ElementType.FIBER_STRAND]: '#4FC3F7',
  [ElementType.FIBER_THREAD]: '#4FC3F7',
  [ElementType.DROP_CABLE]: '#9575CD',
  [ElementType.DISTRIBUTION_CABLE]: '#7E57C2',
  [ElementType.FEEDER_CABLE]: '#673AB7',
  [ElementType.BACKBONE_CABLE]: '#5E35B1',
  [ElementType.MSAN]: '#FB8C00',
  [ElementType.ODF]: '#00897B',
  [ElementType.ROUTER]: '#D32F2F',
  [ElementType.RACK]: '#757575',
  [ElementType.NETWORK_GRAPH]: '#0288D1',
  [ElementType.WDM_FILTER]: '#FFA000',
  [ElementType.COHERENT_TRANSPONDER]: '#8D6E63',
  [ElementType.WAVELENGTH_ROUTER]: '#26A69A',
  [ElementType.OPTICAL_SWITCH]: '#7CB342',
  [ElementType.ROADM]: '#AB47BC',
  [ElementType.OPTICAL_AMPLIFIER]: '#EF6C00',
  default: '#78909C'
};

/**
 * Colores asociados a cada estado de elemento
 */
export const STATUS_COLORS: Record<ElementStatus | 'default', string> = {
  [ElementStatus.ACTIVE]: '#4CAF50',
  [ElementStatus.INACTIVE]: '#9E9E9E',
  [ElementStatus.UNKNOWN]: '#9E9E9E',
  [ElementStatus.WARNING]: '#FFA726',
  [ElementStatus.CRITICAL]: '#E53935',
  [ElementStatus.FAULT]: '#E53935',
  [ElementStatus.MAINTENANCE]: '#42A5F5',
  [ElementStatus.PLANNED]: '#8D6E63',
  [ElementStatus.BUILDING]: '#FBC02D',
  [ElementStatus.RESERVED]: '#7CB342',
  [ElementStatus.DECOMMISSIONED]: '#78909C',
  default: '#9E9E9E'
};

/**
 * Iconos asociados a cada tipo de elemento (Material Icons)
 */
export const ELEMENT_ICONS: Record<ElementType | 'default', string> = {
  [ElementType.OLT]: 'router',
  [ElementType.ONT]: 'devices',
  [ElementType.FDP]: 'settings_input_component',
  [ElementType.EDFA]: 'amp_stories',
  [ElementType.SPLITTER]: 'call_split',
  [ElementType.MANGA]: 'track_changes',
  [ElementType.TERMINAL_BOX]: 'inbox',
  [ElementType.FIBER_CONNECTION]: 'timeline',
  [ElementType.FIBER_SPLICE]: 'hub',
  [ElementType.FIBER_CABLE]: 'cable',
  [ElementType.FIBER_STRAND]: 'fiber_manual_record',
  [ElementType.FIBER_THREAD]: 'fiber_manual_record',
  [ElementType.DROP_CABLE]: 'swap_horiz',
  [ElementType.DISTRIBUTION_CABLE]: 'compare_arrows',
  [ElementType.FEEDER_CABLE]: 'sync_alt',
  [ElementType.BACKBONE_CABLE]: 'all_inclusive',
  [ElementType.MSAN]: 'dns',
  [ElementType.ODF]: 'grid_view',
  [ElementType.ROUTER]: 'wifi',
  [ElementType.RACK]: 'inventory_2',
  [ElementType.NETWORK_GRAPH]: 'share',
  [ElementType.WDM_FILTER]: 'filter_alt',
  [ElementType.COHERENT_TRANSPONDER]: 'memory',
  [ElementType.WAVELENGTH_ROUTER]: 'settings_input_hdmi',
  [ElementType.OPTICAL_SWITCH]: 'switch_right',
  [ElementType.ROADM]: 'swap_calls',
  [ElementType.OPTICAL_AMPLIFIER]: 'trending_up',
  default: 'device_unknown'
};

/**
 * Etiquetas descriptivas para cada tipo de elemento
 */
export const ELEMENT_LABELS: Record<ElementType | 'default', string> = {
  [ElementType.OLT]: 'Terminal de Línea Óptica',
  [ElementType.ONT]: 'Terminal de Red Óptica',
  [ElementType.FDP]: 'Punto de Distribución',
  [ElementType.EDFA]: 'Amplificador Óptico',
  [ElementType.SPLITTER]: 'Divisor Óptico',
  [ElementType.MANGA]: 'Manga',
  [ElementType.TERMINAL_BOX]: 'Caja Terminal',
  [ElementType.FIBER_CONNECTION]: 'Conexión de Fibra',
  [ElementType.FIBER_SPLICE]: 'Empalme',
  [ElementType.FIBER_CABLE]: 'Cable de Fibra',
  [ElementType.FIBER_STRAND]: 'Hilo de Fibra',
  [ElementType.FIBER_THREAD]: 'Hilo de Fibra',
  [ElementType.DROP_CABLE]: 'Cable de Acometida',
  [ElementType.DISTRIBUTION_CABLE]: 'Cable de Distribución',
  [ElementType.FEEDER_CABLE]: 'Cable Alimentador',
  [ElementType.BACKBONE_CABLE]: 'Cable Troncal',
  [ElementType.MSAN]: 'Nodo de Acceso Multi-Servicio',
  [ElementType.ODF]: 'Distribuidor de Fibra Óptica',
  [ElementType.ROUTER]: 'Router',
  [ElementType.RACK]: 'Rack',
  [ElementType.NETWORK_GRAPH]: 'Grafo de Red',
  [ElementType.WDM_FILTER]: 'Filtro WDM',
  [ElementType.COHERENT_TRANSPONDER]: 'Transpondedor Coherente',
  [ElementType.WAVELENGTH_ROUTER]: 'Router de Longitudes de Onda',
  [ElementType.OPTICAL_SWITCH]: 'Conmutador Óptico',
  [ElementType.ROADM]: 'Multiplexor Óptico Reconfigurable',
  [ElementType.OPTICAL_AMPLIFIER]: 'Amplificador Óptico',
  default: 'Elemento Desconocido'
};

/**
 * Símbolos D3 para cada tipo de elemento
 */
export const ELEMENT_SYMBOLS: Record<ElementType | 'default', string> = {
  [ElementType.OLT]: generateSymbol(d3.symbolSquare, 15 * 2.5),
  [ElementType.ONT]: generateSymbol(d3.symbolCircle, 15),
  [ElementType.FDP]: generateSymbol(d3.symbolTriangle, 15 * 1.5),
  [ElementType.EDFA]: generateSymbol(d3.symbolDiamond, 15 * 1.5),
  [ElementType.SPLITTER]: generateSymbol(d3.symbolCross, 15 * 1.5),
  [ElementType.MANGA]: generateSymbol(d3.symbolStar, 15 * 1.5),
  [ElementType.FIBER_SPLICE]: generateSymbol(d3.symbolWye, 15 * 1.2),
  [ElementType.FIBER_CABLE]: generateSymbol(d3.symbolSquare, 15 * 1.8),
  [ElementType.FIBER_STRAND]: generateSymbol(d3.symbolCircle, 15 * 0.8),
  [ElementType.TERMINAL_BOX]: generateSymbol(d3.symbolDiamond, 15 * 1.5),
  [ElementType.FIBER_CONNECTION]: generateSymbol(d3.symbolTriangle, 15),
  [ElementType.FIBER_THREAD]: generateSymbol(d3.symbolCircle, 15 * 0.8),
  [ElementType.DROP_CABLE]: generateSymbol(d3.symbolSquare, 15 * 1.4),
  [ElementType.DISTRIBUTION_CABLE]: generateSymbol(d3.symbolSquare, 15 * 1.6),
  [ElementType.FEEDER_CABLE]: generateSymbol(d3.symbolSquare, 15 * 1.8),
  [ElementType.BACKBONE_CABLE]: generateSymbol(d3.symbolSquare, 15 * 2.0),
  [ElementType.MSAN]: generateSymbol(d3.symbolDiamond, 15 * 2.0),
  [ElementType.ODF]: generateSymbol(d3.symbolSquare, 15 * 2.2),
  [ElementType.ROUTER]: generateSymbol(d3.symbolDiamond, 15 * 1.8),
  [ElementType.RACK]: generateSymbol(d3.symbolSquare, 15 * 2.4),
  [ElementType.NETWORK_GRAPH]: generateSymbol(d3.symbolCircle, 15 * 2.2),
  [ElementType.WDM_FILTER]: generateSymbol(d3.symbolTriangle, 15 * 1.8),
  [ElementType.COHERENT_TRANSPONDER]: generateSymbol(d3.symbolDiamond, 15 * 1.7),
  [ElementType.WAVELENGTH_ROUTER]: generateSymbol(d3.symbolWye, 15 * 1.8),
  [ElementType.OPTICAL_SWITCH]: generateSymbol(d3.symbolCross, 15 * 1.8),
  [ElementType.ROADM]: generateSymbol(d3.symbolStar, 15 * 1.8),
  [ElementType.OPTICAL_AMPLIFIER]: generateSymbol(d3.symbolDiamond, 15 * 1.6),
  default: generateSymbol(d3.symbolCircle, 15)
};

/**
 * Función auxiliar para generar un símbolo D3
 */
function generateSymbol(symbolType: d3.SymbolType, size: number): string {
  return d3.symbol().type(symbolType).size(size)() || '';
} 