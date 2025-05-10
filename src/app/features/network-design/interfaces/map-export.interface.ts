/**
 * Interfaz para el servicio de exportación del mapa
 */
export interface IMapExportService {
  /**
   * Inicializa el servicio de exportación
   */
  initialize(svg: any): void;
  
  /**
   * Exporta el mapa al formato especificado
   */
  exportMap(format: string): void;
  
  /**
   * Exporta el mapa como imagen PNG
   */
  exportToPNG(): void;
  
  /**
   * Exporta el mapa como SVG
   */
  exportToSVG(): void;
  
  /**
   * Exporta el mapa como JSON
   */
  exportToJSON(): void;
  
  /**
   * Exporta las mediciones actuales
   */
  exportMeasurements(): void;
  
  /**
   * Descarga un blob como archivo
   */
  downloadBlob(blob: Blob, filename: string): void;
} 