export * from '../types/network.types';

// Importación explícita para evitar errores de importación
import {
  ElementType,
  ElementStatus,
  NetworkElement,
  NetworkConnection,
  NetworkAlert,
  OLTElement,
  ONTElement,
  ODFElement,
  EDFAElement,
  SplitterElement,
  MangaElement,
  FDPElement,
  TerminalBoxElement,
  FiberThreadElement,
  MSANElement,
  WDMFilterElement,
  RouterElement,
  SlackFiberElement
} from '../types/network.types';

// Importar el modelo detallado FiberConnection
import { FiberConnection as DetailedFiberConnectionModel } from './fiber-connection.model';

// Re-exportar explícitamente para compatibilidad
export {
  ElementType,
  ElementStatus
};

// Re-exportar tipos usando 'export type' para compatibilidad con isolatedModules
export type {
  NetworkElement,
  NetworkConnection,
  NetworkAlert,
  OLTElement,
  ONTElement,
  ODFElement,
  EDFAElement,
  SplitterElement,
  MangaElement,
  FDPElement,
  TerminalBoxElement,
  FiberThreadElement,
  MSANElement,
  WDMFilterElement,
  RouterElement as Router,
  SlackFiberElement,
  DetailedFiberConnectionModel as FiberConnection
};
