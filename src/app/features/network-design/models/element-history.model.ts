import { NetworkElement } from '../../../shared/types/network.types';

/**
 * Interfaz para un evento en el historial de un elemento
 */
export interface ElementHistoryItem {
  id: string;
  timestamp: Date;
  action: string;
  description: string;
  user: string;
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
}

/**
 * Interfaz para los datos pasados al diálogo de historial
 */
export interface ElementHistoryDialogData {
  element: NetworkElement;
  history?: ElementHistoryItem[];
}

/**
 * Tipos de acciones comunes en el historial
 */
export enum HistoryActionType {
  UPDATE = 'Actualización',
  CREATE = 'Creación',
  DELETE = 'Eliminación',
  MAINTENANCE = 'Mantenimiento',
  CONFIG = 'Configuración',
  CONNECT = 'Conexión',
  DISCONNECT = 'Desconexión',
  ALERT = 'Alerta',
  ERROR = 'Error'
} 
