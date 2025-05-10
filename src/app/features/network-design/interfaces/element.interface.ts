import { Observable } from 'rxjs';
import { ElementType, ElementStatus, NetworkElement } from '../../../shared/types/network.types';

/**
 * Definición de interfaces locales para verificación de tipos
 */
export interface OLT extends NetworkElement {
  type: ElementType.OLT;
  manufacturer: string;
  model: string;
  serialNumber?: string;
  installationDate?: Date;
  portCount: number;
  ponPorts: number;
  ipAddress?: string;
  macAddress?: string;
  firmwareVersion?: string;
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
}

export interface ODF extends NetworkElement {
  type: ElementType.ODF;
  manufacturer: string;
  model: string;
  installationDate?: Date;
  totalPortCapacity: number;
  usedPorts: number;
}

export interface EDFA extends NetworkElement {
  type: ElementType.EDFA;
  manufacturer: string;
  model: string;
  serialNumber?: string;
  installationDate?: Date;
  gainDb: number;
  inputPowerRange: {
    min: number;
    max: number;
  };
}

export interface Splitter extends NetworkElement {
  type: ElementType.SPLITTER;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  installationDate?: Date;
  splitRatio: string; // e.g., "1:8", "1:16", "1:32"
  insertionLoss?: number;
}

export interface Manga extends NetworkElement {
  type: ElementType.MANGA;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  installationDate?: Date;
  capacity: number;
  usedCapacity: number;
  sealType?: string;
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
}

export interface FiberThread extends NetworkElement {
  type: ElementType.FIBER_THREAD;
  length: number;
  color?: string;
  coreNumber?: number;
  cableId?: string;
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
  isEDFA(element: NetworkElement): element is (NetworkElement & EDFA);

  /**
   * Verifica si un elemento es de tipo Splitter
   */
  isSplitter(element: NetworkElement): element is (NetworkElement & Splitter);

  /**
   * Verifica si un elemento es de tipo Manga
   */
  isManga(element: NetworkElement): element is (NetworkElement & Manga);

  /**
   * Verifica si es una caja terminal
   */
  isTerminalBox(element: NetworkElement): element is TerminalBox;

  /**
   * Verifica si es un hilo de fibra
   */
  isFiberThread(element: NetworkElement): element is FiberThread;

  /**
   * Formatea un tamaño de archivo en bytes a una representación legible
   */
  formatFileSize(bytes: number): string;
} 