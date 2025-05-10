import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';
import { Observable, from, of } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { NetworkElement, NetworkConnection } from '../../../shared/types/network.types';
import { MapService } from './map.service';
import { LoggerService } from '../../../core/services/logger.service';
import { NetworkStateService } from './network-state.service';
import * as d3 from 'd3';
import * as html2canvas from 'html2canvas';
import { IMapExportService } from '../interfaces/map-export.interface';

/**
 * Servicio para exportar el mapa a diferentes formatos
 */
@Injectable({
  providedIn: 'root'
})
export class MapExportService implements IMapExportService {
  private svg: d3.Selection<SVGSVGElement, unknown, null, undefined> | null = null;
  private currentMeasurements: any = null;
  
  constructor(
    private mapService: MapService,
    private logger: LoggerService,
    private networkStateService: NetworkStateService
  ) {}
  
  /**
   * Inicializa el servicio de exportación
   */
  initialize(svg: d3.Selection<SVGSVGElement, unknown, null, undefined>): void {
    this.svg = svg;
    this.logger.debug('Servicio de exportación inicializado');
  }
  
  /**
   * Establece las mediciones actuales para exportación
   */
  setMeasurements(measurements: any): void {
    this.currentMeasurements = measurements;
  }
  
  /**
   * Exporta el mapa al formato especificado
   * @param format Formato de exportación ('png', 'pdf', 'json', 'svg')
   * @returns Observable que emite true si la exportación fue exitosa
   */
  exportMap(format: string): void {
    this.logger.debug(`Exportando mapa en formato ${format}`);
    
    try {
      // Delegar la exportación al método correspondiente según el formato
      switch (format.toLowerCase()) {
        case 'png':
          this.exportToPNG();
          break;
        case 'pdf':
          this.exportToPDF();
          break;
        case 'json':
          this.exportToJSON();
          break;
        case 'svg':
          this.exportToSVG();
          break;
        case 'measurements':
          this.exportMeasurements();
          break;
        default:
          this.logger.error(`Formato de exportación no soportado: ${format}`);
          break;
      }
    } catch (error) {
      this.logger.error('Error al exportar mapa:', error);
    }
  }
  
  /**
   * Exporta el mapa como imagen PNG
   * @param fileName Nombre del archivo (opcional)
   * @returns Observable que emite true si la exportación fue exitosa
   */
  exportToPNG(fileName?: string): void {
    const outputFileName = fileName || `network-map-${new Date().toISOString().slice(0, 10)}.png`;
    
    try {
      // Uso promisificado de la exportación del servicio de mapa
      this.mapService.exportMap('png');
      this.logger.info(`Mapa exportado como PNG: ${outputFileName}`);
    } catch (error) {
      this.logger.error('Error al exportar como PNG:', error);
    }
  }
  
  /**
   * Exporta el mapa como documento PDF
   * @param fileName Nombre del archivo (opcional)
   * @returns Observable que emite true si la exportación fue exitosa
   */
  private exportToPDF(fileName?: string): Observable<boolean> {
    const outputFileName = fileName || `network-map-${new Date().toISOString().slice(0, 10)}.pdf`;
    
    try {
      // Uso una promesa para manejar la operación asíncrona con jsPDF
      return from(new Promise<boolean>(async (resolve) => {
        try {
          // Obtener la representación SVG del mapa
          const svgElement = document.querySelector('.map-content svg') as SVGElement;
          if (!svgElement) {
            this.logger.error('No se encontró el elemento SVG del mapa');
            resolve(false);
            return;
          }
          
          // Convertir SVG a imagen
          const canvas = document.createElement('canvas');
          const svgRect = svgElement.getBoundingClientRect();
          canvas.width = svgRect.width;
          canvas.height = svgRect.height;
          
          const xml = new XMLSerializer().serializeToString(svgElement);
          const svg64 = btoa(xml);
          const image64 = 'data:image/svg+xml;base64,' + svg64;
          
          const img = new Image();
          img.onload = () => {
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              this.logger.error('No se pudo obtener el contexto 2D del canvas');
              resolve(false);
              return;
            }
            
            // Dibujar la imagen en el canvas
            ctx.drawImage(img, 0, 0);
            
            // Crear el PDF
            const pdf = new jsPDF({
              orientation: 'landscape',
              unit: 'px',
              format: [canvas.width, canvas.height]
            });
            
            // Añadir metadatos
            const state = this.networkStateService.getCurrentState();
            pdf.setProperties({
              title: 'Network Map',
              subject: 'Network Map Export',
              author: 'Network Map Tool',
              keywords: 'network, map, export',
              creator: 'Network Map Tool'
            });
            
            // Añadir imagen al PDF
            const imgData = canvas.toDataURL('image/png');
            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
            
            // Añadir información adicional
            pdf.setFontSize(10);
            pdf.setTextColor(128, 128, 128);
            pdf.text(`Exportado: ${new Date().toLocaleString()}`, 10, canvas.height - 10);
            
            // Guardar el PDF
            pdf.save(outputFileName);
            
            this.logger.info(`Mapa exportado como PDF: ${outputFileName}`);
            resolve(true);
          };
          
          img.onerror = () => {
            this.logger.error('Error al cargar la imagen SVG');
            resolve(false);
          };
          
          img.src = image64;
        } catch (error) {
          this.logger.error('Error al exportar como PDF:', error);
          resolve(false);
        }
      })).pipe(
        catchError(error => {
          this.logger.error('Error al exportar como PDF:', error);
          return of(false);
        })
      );
    } catch (error) {
      this.logger.error('Error al exportar como PDF:', error);
      return of(false);
    }
  }
  
  /**
   * Exporta el mapa como archivo JSON
   * @param fileName Nombre del archivo (opcional)
   */
  exportToJSON(fileName?: string): void {
    const outputFileName = fileName || `network-map-${new Date().toISOString().slice(0, 10)}.json`;
    
    try {
      // Obtener elementos y conexiones del estado actual
      const currentState = this.networkStateService.getCurrentState();
      const elements = currentState.connections ? currentState.connections : [];
      const connections = currentState.connections ? currentState.connections : [];
      
      // Crear objeto JSON
      const exportData = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        elements: elements,
        connections: connections,
        metadata: {
          totalElements: elements.length,
          totalConnections: connections.length,
          exportedBy: 'NetworkMapTool'
        }
      };
      
      // Convertir a string JSON y crear blob
      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
      
      // Descargar archivo
      this.downloadBlob(blob, outputFileName);
      
      this.logger.info(`Mapa exportado como JSON: ${outputFileName}`);
    } catch (error) {
      this.logger.error('Error al exportar como JSON:', error);
    }
  }
  
  /**
   * Exporta el mapa como archivo SVG
   * @param fileName Nombre del archivo (opcional)
   */
  exportToSVG(fileName?: string): void {
    const outputFileName = fileName || `network-map-${new Date().toISOString().slice(0, 10)}.svg`;
    
    try {
      // Verificar que el SVG esté inicializado
      if (!this.svg || !this.svg.node()) {
        this.logger.error('No se pudo exportar el SVG: elemento svg no inicializado');
        return;
      }
      
      // Clonar el SVG para no modificar el original
      const svgClone = this.svg.node()!.cloneNode(true) as SVGSVGElement;
      
      // Aplicar estilos inline para que se vean bien al exportar
      this.applyInlineStyles(svgClone);
      
      // Convertir a string XML
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svgClone);
      
      // Crear blob y descargar
      const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      this.downloadBlob(blob, outputFileName);
      
      this.logger.info(`Mapa exportado como SVG: ${outputFileName}`);
    } catch (error) {
      this.logger.error('Error al exportar como SVG:', error);
    }
  }
  
  /**
   * Exporta las mediciones actuales
   */
  exportMeasurements(): void {
    if (!this.currentMeasurements) {
      this.logger.warn('No hay mediciones para exportar');
      this.networkStateService.showSnackbar('No hay mediciones para exportar', 'warning');
      return;
    }
    
    try {
      // Crear objeto de mediciones para exportar
      const measurementData = {
        timestamp: new Date().toISOString(),
        measurements: this.currentMeasurements,
        metadata: {
          type: 'distance-measurement',
          unit: 'meters',
          exportedBy: 'NetworkMapTool'
        }
      };
      
      // Convertir a string JSON y crear blob
      const jsonString = JSON.stringify(measurementData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
      
      // Descargar archivo
      this.downloadBlob(blob, `network-measurements-${this.getDateTimeString()}.json`);
      
      this.networkStateService.showSnackbar('Mediciones exportadas', 'success');
    } catch (error) {
      this.logger.error('Error al exportar mediciones:', error);
      this.networkStateService.showSnackbar('Error al exportar mediciones', 'error');
    }
  }
  
  /**
   * Guarda el estado actual del mapa en el formato especificado
   * @param elements Elementos del mapa
   * @param connections Conexiones del mapa
   * @param format Formato de exportación ('json')
   * @param fileName Nombre del archivo (opcional)
   */
  saveMapState(
    elements: NetworkElement[],
    connections: NetworkConnection[],
    format = 'json',
    fileName?: string
  ): void {
    this.logger.debug(`Guardando estado del mapa en formato ${format}`);
    
    // Por ahora solo soportamos JSON
    if (format.toLowerCase() !== 'json') {
      this.logger.warn(`Formato no soportado para guardar estado: ${format}. Usando JSON.`);
    }
    
    const outputFileName = fileName || `network-map-state-${new Date().toISOString().slice(0, 10)}.json`;
    
    try {
      // Crear el objeto de estado
      const state = {
        elements,
        connections,
        metadata: {
          version: '1.0',
          exportDate: new Date().toISOString(),
          elementCount: elements.length,
          connectionCount: connections.length
        }
      };
      
      // Convertir a JSON
      const jsonString = JSON.stringify(state, null, 2);
      
      // Crear blob y descargar
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = outputFileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      this.logger.info(`Estado del mapa guardado como JSON: ${outputFileName}`);
    } catch (error) {
      this.logger.error('Error al guardar estado del mapa:', error);
      throw error; // Relanzar el error para que el componente pueda manejarlo
    }
  }
  
  /**
   * Genera un informe detallado del mapa como PDF
   * @param elements Elementos del mapa
   * @param connections Conexiones del mapa
   * @param fileName Nombre del archivo (opcional)
   */
  generateMapReport(
    elements: NetworkElement[],
    connections: NetworkConnection[],
    fileName?: string
  ): void {
    const outputFileName = fileName || `network-map-report-${new Date().toISOString().slice(0, 10)}.pdf`;
    
    this.logger.debug('Generando informe del mapa en PDF');
    
    try {
      // Crear el PDF con orientación horizontal
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      
      // Añadir metadatos
      pdf.setProperties({
        title: 'Network Map Report',
        subject: 'Network Map Detailed Report',
        author: 'Network Map Tool',
        keywords: 'network, map, report',
        creator: 'Network Map Tool'
      });
      
      // Añadir título y encabezado
      pdf.setFontSize(22);
      pdf.setTextColor(0, 0, 0);
      pdf.text('Network Map Report', 15, 15);
      
      pdf.setFontSize(12);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Generated: ${new Date().toLocaleString()}`, 15, 22);
      
      // Añadir línea separadora
      pdf.setDrawColor(200, 200, 200);
      pdf.line(15, 25, 280, 25);
      
      // Sección de resumen
      pdf.setFontSize(16);
      pdf.setTextColor(0, 0, 0);
      pdf.text('Summary', 15, 35);
      
      pdf.setFontSize(12);
      pdf.text(`Total Elements: ${elements.length}`, 15, 45);
      pdf.text(`Total Connections: ${connections.length}`, 15, 52);
      
      // Calcular estadísticas por tipo
      const elementsByType = this.calculateElementsByType(elements);
      
      // Añadir tabla de elementos por tipo
      pdf.setFontSize(14);
      pdf.text('Elements by Type', 15, 65);
      
      // Configurar tabla
      let y = 70;
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      
      // Cabecera de la tabla
      pdf.setFillColor(240, 240, 240);
      pdf.rect(15, y, 100, 7, 'F');
      pdf.setFont('helvetica', 'bold');
      pdf.text('Element Type', 17, y + 5);
      pdf.text('Count', 80, y + 5);
      pdf.setFont('helvetica', 'normal');
      
      y += 10;
      
      // Filas de la tabla
      Object.entries(elementsByType).forEach(([type, count], index) => {
        if (index % 2 === 0) {
          pdf.setFillColor(250, 250, 250);
          pdf.rect(15, y - 5, 100, 7, 'F');
        }
        
        pdf.text(this.getElementTypeName(type), 17, y);
        pdf.text(count.toString(), 80, y);
        
        y += 7;
      });
      
      // Añadir una segunda página si hay muchos elementos
      if (elements.length > 10) {
        pdf.addPage();
        
        pdf.setFontSize(16);
        pdf.setTextColor(0, 0, 0);
        pdf.text('Elements Detail', 15, 15);
        
        // Tabla de elementos
        y = 25;
        pdf.setFontSize(10);
        
        // Cabecera de la tabla
        pdf.setFillColor(240, 240, 240);
        pdf.rect(15, y, 260, 7, 'F');
        pdf.setFont('helvetica', 'bold');
        pdf.text('ID', 17, y + 5);
        pdf.text('Name', 50, y + 5);
        pdf.text('Type', 120, y + 5);
        pdf.text('Status', 160, y + 5);
        pdf.text('Connections', 200, y + 5);
        pdf.setFont('helvetica', 'normal');
        
        y += 10;
        
        // Mostrar elementos (limitar a 30 por página)
        elements.slice(0, 30).forEach((element, index) => {
          if (index % 2 === 0) {
            pdf.setFillColor(250, 250, 250);
            pdf.rect(15, y - 5, 260, 7, 'F');
          }
          
          // Contar conexiones para este elemento
          const elementConnections = connections.filter(
            conn => conn.sourceId === element.id || conn.targetId === element.id
          ).length;
          
          pdf.text(element.id.slice(0, 12), 17, y);
          pdf.text(element.name.slice(0, 25), 50, y);
          pdf.text(this.getElementTypeName(element.type), 120, y);
          pdf.text(element.status, 160, y);
          pdf.text(elementConnections.toString(), 200, y);
          
          y += 7;
          
          // Si hemos alcanzado el final de la página, añadir una nueva
          if (y > 190 && index < elements.length - 1) {
            pdf.addPage();
            
            // Repetir la cabecera
            y = 15;
            pdf.setFontSize(16);
            pdf.text('Elements Detail (continued)', 15, y);
            
            y = 25;
            pdf.setFontSize(10);
            
            pdf.setFillColor(240, 240, 240);
            pdf.rect(15, y, 260, 7, 'F');
            pdf.setFont('helvetica', 'bold');
            pdf.text('ID', 17, y + 5);
            pdf.text('Name', 50, y + 5);
            pdf.text('Type', 120, y + 5);
            pdf.text('Status', 160, y + 5);
            pdf.text('Connections', 200, y + 5);
            pdf.setFont('helvetica', 'normal');
            
            y += 10;
          }
        });
      }
      
      // Añadir pie de página en todas las páginas
      const totalPages = pdf.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(150, 150, 150);
        pdf.text(
          `Network Map Report - Page ${i} of ${totalPages}`,
          pdf.internal.pageSize.getWidth() / 2,
          pdf.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }
      
      // Guardar el PDF
      pdf.save(outputFileName);
      
      this.logger.info(`Informe del mapa generado como PDF: ${outputFileName}`);
    } catch (error) {
      this.logger.error('Error al generar informe del mapa:', error);
      throw error;
    }
  }
  
  /**
   * Calcula el número de elementos por tipo
   * @param elements Elementos del mapa
   * @returns Objeto con el conteo de elementos por tipo
   */
  private calculateElementsByType(elements: NetworkElement[]): Record<string, number> {
    const elementsByType: Record<string, number> = {};
    
    elements.forEach(element => {
      if (!elementsByType[element.type]) {
        elementsByType[element.type] = 0;
      }
      elementsByType[element.type]++;
    });
    
    return elementsByType;
  }
  
  /**
   * Obtiene el nombre legible de un tipo de elemento
   * @param type Tipo de elemento
   * @returns Nombre legible del tipo de elemento
   */
  private getElementTypeName(type: string): string {
    const typeNames: Record<string, string> = {
      'FDP': 'Fiber Distribution Point',
      'OLT': 'Optical Line Terminal',
      'ONT': 'Optical Network Terminal',
      'SPLITTER': 'Splitter',
      'EDFA': 'Erbium Doped Fiber Amplifier',
      'MANGA': 'Fiber Splice Enclosure',
      'TERMINAL_BOX': 'Terminal Box',
      'MSAN': 'Multi-Service Access Node'
    };
    
    return typeNames[type] || type;
  }
  
  /**
   * Descarga un blob como archivo
   */
  downloadBlob(blob: Blob, filename: string): void {
    // Crear URL para el blob
    const url = URL.createObjectURL(blob);
    
    // Crear enlace de descarga
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    
    // Añadir a la página, hacer clic y eliminar
    document.body.appendChild(link);
    link.click();
    
    // Limpiar recursos
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);
  }
  
  /**
   * Aplica estilos inline al SVG para exportación
   */
  private applyInlineStyles(svgElement: SVGElement): void {
    // Seleccionar todos los elementos en el SVG
    const elements = svgElement.querySelectorAll('*');
    
    // Para cada elemento, aplicar estilos computados como atributos inline
    for (let i = 0; i < elements.length; i++) {
      const el = elements[i] as HTMLElement;
      const styles = window.getComputedStyle(el);
      
      // Convertir estilos a atributos inline
      for (let j = 0; j < styles.length; j++) {
        const styleName = styles[j];
        const styleValue = styles.getPropertyValue(styleName);
        
        if (styleValue) {
          el.style[styleName as any] = styleValue;
        }
      }
    }
  }
  
  /**
   * Obtiene una cadena de fecha y hora para nombres de archivo
   */
  private getDateTimeString(): string {
    const now = new Date();
    return now.toISOString()
      .replace(/:/g, '-')
      .replace(/\..+/, '')
      .replace('T', '_');
  }
} 