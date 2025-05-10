export * from '../types/network.types';

// Exportación explícita para evitar errores de importación
import {
  ElementType,
  ElementStatus,
  NetworkElement,
  NetworkConnection,
  FiberConnection,
  NetworkAlert,
  OLT,
  ONT,
  ODF,
  EDFA,
  Splitter,
  Manga,
  FDP,
  TerminalBox,
  FiberThread,
  MSAN,
  WDMFilter,
  Router as NetworkRouter,
  Rack
} from '../types/network.types';

// Re-exportar explícitamente para compatibilidad
export {
  ElementType,
  ElementStatus
};

// Re-exportar tipos usando 'export type' para compatibilidad con isolatedModules
export type {
  NetworkElement,
  NetworkConnection,
  FiberConnection,
  NetworkAlert,
  OLT,
  ONT,
  ODF,
  EDFA,
  Splitter,
  Manga,
  FDP,
  TerminalBox,
  FiberThread,
  MSAN,
  WDMFilter,
  // Renombrando Router para evitar conflicto con Angular Router
  NetworkRouter as Router,
  Rack
};
