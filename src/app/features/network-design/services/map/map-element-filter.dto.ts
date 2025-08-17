import { ElementType, ElementStatus } from '../../../../shared/types/network.types';

/**
 * DTO para filtrar elementos de red
 */
export interface ElementFilterDto {
  /**
   * Tipos de elementos a filtrar
   */
  types?: ElementType[];
  
  /**
   * Estados de elementos a filtrar
   */
  statuses?: ElementStatus[];
  
  /**
   * Texto para búsqueda general
   */
  text?: string;
  
  /**
   * Fecha de creación desde
   */
  createdFrom?: string;
  
  /**
   * Fecha de creación hasta
   */
  createdTo?: string;
  
  /**
   * Filtros personalizados por atributos específicos
   */
  custom?: Record<string, any>;
} 
