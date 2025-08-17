import { NetworkElement } from '../../../shared/types/network.types';

/**
 * Interfaz para el servicio de vista previa del mapa
 */
export interface IMapPreviewService {
  /**
   * Inicializa el servicio de vista previa
   */
  initialize(svg: any, mainGroup: any): void;
  
  /**
   * Muestra una vista previa de un elemento en el mapa
   */
  previewElement(element: NetworkElement): void;
  
  /**
   * Limpia la vista previa actual
   */
  clearPreview(): void;
  
  /**
   * Comprueba si hay una vista previa activa
   */
  hasActivePreview(): boolean;
  
  /**
   * Obtiene el elemento actualmente en vista previa
   */
  getPreviewElement(): NetworkElement | null;
} 
