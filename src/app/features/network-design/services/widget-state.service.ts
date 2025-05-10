import { Injectable, signal } from '@angular/core';
import { Observable, BehaviorSubject, map, Subject } from 'rxjs';

/**
 * Interfaz para el estado de un widget
 */
export interface WidgetState {
  id: string;
  isVisible: boolean;
  isCollapsed: boolean;
  position?: { x: number; y: number };
  size?: { width: number; height: number };
  data?: any;
  lastUpdated?: Date;
  hasError?: boolean;
  errorInfo?: {
    code?: string;
    message?: string;
    timestamp?: Date;
  };
}

/**
 * Interfaz para errores de widget
 */
export interface WidgetError {
  widgetId: string;
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
}

/**
 * Servicio centralizado para gestionar el estado de los widgets en la aplicación
 */
@Injectable({
  providedIn: 'root'
})
export class WidgetStateService {
  private widgetStates = new Map<string, BehaviorSubject<WidgetState>>();
  
  // Subject para emitir errores de widgets
  private widgetErrors = new Subject<WidgetError>();
  public widgetErrors$ = this.widgetErrors.asObservable();
  
  // Subject para solicitar actualización de datos a todos los widgets
  private refreshWidgetsRequest = new Subject<{ source: string, targets?: string[] }>();
  public refreshWidgetsRequest$ = this.refreshWidgetsRequest.asObservable();
  
  /**
   * Obtiene el estado de un widget como Observable
   */
  getWidgetState(widgetId: string): Observable<WidgetState> {
    if (!this.widgetStates.has(widgetId)) {
      this.widgetStates.set(widgetId, new BehaviorSubject<WidgetState>({
        id: widgetId,
        isVisible: true,
        isCollapsed: false,
        lastUpdated: new Date()
      }));
    }
    return this.widgetStates.get(widgetId)!.asObservable();
  }
  
  /**
   * Obtiene el valor actual del estado de un widget
   */
  getCurrentWidgetState(widgetId: string): WidgetState {
    if (!this.widgetStates.has(widgetId)) {
      this.getWidgetState(widgetId); // Inicializa el estado
    }
    return this.widgetStates.get(widgetId)!.value;
  }
  
  /**
   * Actualiza el estado de un widget
   */
  updateWidgetState(widgetId: string, state: Partial<WidgetState>): void {
    if (!this.widgetStates.has(widgetId)) {
      this.getWidgetState(widgetId); // Inicializa el estado
    }
    
    const currentState = this.widgetStates.get(widgetId)!.value;
    this.widgetStates.get(widgetId)!.next({
      ...currentState,
      ...state,
      lastUpdated: new Date()
    });
  }
  
  /**
   * Establece la visibilidad de un widget
   */
  setWidgetVisibility(widgetId: string, isVisible: boolean): void {
    this.updateWidgetState(widgetId, { isVisible });
  }
  
  /**
   * Activa/desactiva el colapso de un widget
   */
  toggleWidgetCollapse(widgetId: string): void {
    const currentState = this.getCurrentWidgetState(widgetId);
    this.updateWidgetState(widgetId, { isCollapsed: !currentState.isCollapsed });
  }
  
  /**
   * Actualiza la posición de un widget
   */
  updateWidgetPosition(widgetId: string, position: { x: number; y: number }): void {
    this.updateWidgetState(widgetId, { position });
  }
  
  /**
   * Registra un error en un widget
   */
  registerWidgetError(widgetId: string, error: { code: string, message: string, details?: any }): void {
    // Actualizar el estado del widget
    this.updateWidgetState(widgetId, {
      hasError: true,
      errorInfo: {
        code: error.code,
        message: error.message,
        timestamp: new Date()
      }
    });
    
    // Emitir el error
    this.widgetErrors.next({
      widgetId,
      code: error.code,
      message: error.message,
      details: error.details,
      timestamp: new Date()
    });
  }
  
  /**
   * Limpia los errores de un widget
   */
  clearWidgetError(widgetId: string): void {
    this.updateWidgetState(widgetId, {
      hasError: false,
      errorInfo: undefined
    });
  }
  
  /**
   * Solicita a todos los widgets que actualicen sus datos
   */
  refreshAllWidgetsData(source = 'system'): void {
    this.refreshWidgetsRequest.next({ source });
  }
  
  /**
   * Solicita a widgets específicos que actualicen sus datos
   */
  refreshWidgetsData(widgetIds: string[], source = 'system'): void {
    this.refreshWidgetsRequest.next({ source, targets: widgetIds });
  }
  
  /**
   * Obtiene los IDs de todos los widgets visibles
   */
  getVisibleWidgets(): Observable<string[]> {
    return new Observable<string[]>(observer => {
      const visibleWidgets = Array.from(this.widgetStates.values())
        .filter(subject => subject.value.isVisible)
        .map(subject => subject.value.id);
      
      observer.next(visibleWidgets);
      
      // Para cada widget, subscribirse a cambios de visibilidad
      const subscriptions = Array.from(this.widgetStates.entries()).map(([id, subject]) => {
        return subject.subscribe(() => {
          const updatedVisibleWidgets = Array.from(this.widgetStates.values())
            .filter(s => s.value.isVisible)
            .map(s => s.value.id);
          
          observer.next(updatedVisibleWidgets);
        });
      });
      
      // Limpieza al desuscribirse
      return () => {
        subscriptions.forEach(sub => sub.unsubscribe());
      };
    });
  }
  
  /**
   * Restaura todos los widgets a su estado por defecto
   */
  resetAllWidgets(): void {
    this.widgetStates.forEach((subject, id) => {
      subject.next({
        id,
        isVisible: true,
        isCollapsed: false,
        hasError: false,
        lastUpdated: new Date()
      });
    });
  }
} 