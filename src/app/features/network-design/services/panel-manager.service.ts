import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { LoggerService } from '../../../core/services/logger.service';

/**
 * Tipo de panel que puede mostrarse en la aplicación
 */
export enum PanelType {
  LAYER_MANAGER = 'layerManager',
  ELEMENT_CREATOR = 'elementCreator',
  CONNECTION_CREATOR = 'connectionCreator',
  ELEMENT_DETAILS = 'elementDetails',
  SETTINGS = 'settings',
  MAP_MENU = 'mapMenu'
}

/**
 * Servicio para gestionar la visualización de paneles en la interfaz de usuario
 * Centraliza la lógica de mostrar/ocultar paneles y evita duplicación de código
 */
@Injectable({
  providedIn: 'root'
})
export class PanelManagerService {
  // BehaviorSubjects para cada tipo de panel
  private layerManagerVisible = new BehaviorSubject<boolean>(false);
  private elementCreatorVisible = new BehaviorSubject<boolean>(false);
  private connectionCreatorVisible = new BehaviorSubject<boolean>(false);
  private elementDetailsVisible = new BehaviorSubject<boolean>(false);
  private settingsVisible = new BehaviorSubject<boolean>(false);

  // Observables públicos para que los componentes puedan suscribirse
  public layerManager$: Observable<boolean> = this.layerManagerVisible.asObservable();
  public elementCreator$: Observable<boolean> = this.elementCreatorVisible.asObservable();
  public connectionCreator$: Observable<boolean> = this.connectionCreatorVisible.asObservable();
  public elementDetails$: Observable<boolean> = this.elementDetailsVisible.asObservable();
  public settings$: Observable<boolean> = this.settingsVisible.asObservable();

  constructor(private logger: LoggerService) {}

  /**
   * Muestra u oculta un panel específico
   * @param panelType Tipo de panel a mostrar/ocultar
   * @param visible Si true, muestra el panel; si false, lo oculta
   * @param exclusive Si true, cierra todos los demás paneles
   */
  togglePanel(panelType: PanelType, visible?: boolean, exclusive = true): void {
    // Determinar si debe mostrarse u ocultarse
    const newState = visible !== undefined ? visible : !this.getPanelState(panelType);
    
    // Si es exclusivo, cerrar todos los demás paneles primero
    if (exclusive && newState) {
      this.closeAllPanels();
    }
    
    // Actualizar el estado del panel solicitado
    this.setPanelState(panelType, newState);
    
    this.logger.debug(`Panel ${panelType} ${newState ? 'mostrado' : 'ocultado'}`);
  }

  /**
   * Cierra todos los paneles
   */
  closeAllPanels(): void {
    this.layerManagerVisible.next(false);
    this.elementCreatorVisible.next(false);
    this.connectionCreatorVisible.next(false);
    this.elementDetailsVisible.next(false);
    this.settingsVisible.next(false);
    
    this.logger.debug('Todos los paneles cerrados');
  }

  /**
   * Devuelve el estado actual de un panel
   * @param panelType Tipo de panel
   * @returns true si el panel está visible, false en caso contrario
   */
  isPanelVisible(panelType: PanelType): boolean {
    return this.getPanelState(panelType);
  }

  /**
   * Obtiene el estado actual de un panel
   * @param panelType Tipo de panel
   * @returns Estado actual del panel (visible o no)
   */
  private getPanelState(panelType: PanelType): boolean {
    switch (panelType) {
      case PanelType.LAYER_MANAGER:
        return this.layerManagerVisible.value;
      case PanelType.ELEMENT_CREATOR:
        return this.elementCreatorVisible.value;
      case PanelType.CONNECTION_CREATOR:
        return this.connectionCreatorVisible.value;
      case PanelType.ELEMENT_DETAILS:
        return this.elementDetailsVisible.value;
      case PanelType.SETTINGS:
        return this.settingsVisible.value;
      default:
        return false;
    }
  }

  /**
   * Actualiza el estado de un panel
   * @param panelType Tipo de panel
   * @param visible Nuevo estado del panel
   */
  private setPanelState(panelType: PanelType, visible: boolean): void {
    switch (panelType) {
      case PanelType.LAYER_MANAGER:
        this.layerManagerVisible.next(visible);
        break;
      case PanelType.ELEMENT_CREATOR:
        this.elementCreatorVisible.next(visible);
        break;
      case PanelType.CONNECTION_CREATOR:
        this.connectionCreatorVisible.next(visible);
        break;
      case PanelType.ELEMENT_DETAILS:
        this.elementDetailsVisible.next(visible);
        break;
      case PanelType.SETTINGS:
        this.settingsVisible.next(visible);
        break;
    }
  }
} 
