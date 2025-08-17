/**
 * Interfaces para eventos de widgets
 */

// Tipos específicos para los payloads
export type WidgetPayload = Record<string, string | number | boolean | object | null>;

export interface WidgetErrorDetails {
  stack?: string;
  context?: string;
  [key: string]: unknown;
}

// Interfaz base para todos los eventos de widgets
export interface WidgetEvent {
  source: string;      // ID del widget que emite el evento
  type: string;        // Tipo de evento (ej: 'update', 'error', 'action')
  timestamp: Date;     // Momento en que ocurrió el evento
  payload?: WidgetPayload;  // Datos adicionales específicos del evento
}

// Interfaz para eventos de error
export interface WidgetErrorEvent extends WidgetEvent {
  error: {
    code: string;      // Código de error para identificación programática
    message: string;   // Mensaje descriptivo del error
    details?: WidgetErrorDetails;  // Detalles adicionales del error
  };
}

// Tipos para eventos de actualización
export type WidgetUpdateType = 'data' | 'state' | 'visibility' | 'initialized';

export interface WidgetState {
  isVisible?: boolean;
  isCollapsed?: boolean;
  position?: { x: number; y: number };
  size?: { width: number; height: number };
  [key: string]: unknown;
}

// Interfaz para eventos de actualización
export interface WidgetUpdateEvent extends WidgetEvent {
  updateType: WidgetUpdateType;
  previousState?: WidgetState;
  currentState?: WidgetState;
}

// Tipos para acciones de widgets
export type WidgetActionType = 'edit' | 'delete' | 'locate' | 'refresh' | 'filter' | 'select' | string;

// Interfaz para eventos de acción
export interface WidgetActionEvent extends WidgetEvent {
  action: WidgetActionType;  // Nombre de la acción
  elementId?: string;        // ID del elemento asociado si aplica
  actionData?: Record<string, unknown>;
} 
