/**
 * Tipos comunes para respuestas de API y parámetros de consulta.
 */

/**
 * Interfaz genérica para respuestas paginadas de la API.
 * Corresponde al PaginatedResponseDto del backend.
 */
export interface PaginatedResponse<T> {
  items: T[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number; // El backend también lo devuelve, es útil tenerlo.
}

/**
 * Interfaz para los parámetros de consulta comunes para endpoints que soportan paginación y filtrado.
 */
export interface QueryParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
  filter?: Record<string, string | number | boolean | readonly (string | number | boolean)[]>;
  [key: string]: string | number | boolean | readonly (string | number | boolean)[] | undefined | Record<string, string | number | boolean | readonly (string | number | boolean)[]>;
} 
