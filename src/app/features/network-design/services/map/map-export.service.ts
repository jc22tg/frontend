import { Injectable, inject } from '@angular/core';
import { saveAs } from 'file-saver';
// Comentar imports estáticos para usar lazy loading
// import html2canvas from 'html2canvas';
// import { jsPDF } from 'jspdf';
import { Observable, Subject, BehaviorSubject, from, of } from 'rxjs';
import { catchError, finalize, map, switchMap, tap } from 'rxjs/operators';
import { LoggerService } from '../../../../core/services/logger.service';
import { NetworkElement, NetworkConnection } from '../../../../shared/types/network.types';

/**
 * Formatos de exportación soportados
 */
export enum ExportFormat {
  PNG = 'png',
  JPEG = 'jpeg',
  PDF = 'pdf',
  SVG = 'svg',
  JSON = 'json',
  CSV = 'csv'
}

/**
 * Opciones para la exportación
 */
export interface ExportOptions {
  format: ExportFormat;
  filename?: string;
  includeMetadata?: boolean;
  width?: number;
  height?: number;
  quality?: number;
  includeElements?: boolean;
  includeConnections?: boolean;
  includeLegend?: boolean;
  includeTimestamp?: boolean;
  watermark?: string;
  scale?: number;
}

/**
 * Servicio para la exportación del mapa a diferentes formatos
 * 
 * Este servicio proporciona funcionalidades para:
 * - Exportar el mapa a PNG, JPEG, PDF
 * - Exportar los datos del mapa a JSON, CSV
 * - Generar vistas previas de exportación
 */
@Injectable({
  providedIn: 'root'
})
export class MapExportService {
  // Dependencias
  private logger = inject(LoggerService);
  
  // Subjects para notificar estados
  private exportingSubject = new BehaviorSubject<boolean>(false);
  private exportProgressSubject = new BehaviorSubject<number>(0);
  
  // Observables públicos
  readonly exporting$ = this.exportingSubject.asObservable();
  readonly exportProgress$ = this.exportProgressSubject.asObservable();
  
  constructor() {
    this.logger.debug('MapExportService inicializado');
  }

  /**
   * Carga dinámicamente html2canvas para reducir el bundle inicial
   */
  private async loadHtml2Canvas(): Promise<any> {
    const html2canvas = await import('html2canvas');
    return html2canvas.default;
  }

  /**
   * Carga dinámicamente jsPDF para reducir el bundle inicial
   */
  private async loadJsPDF(): Promise<any> {
    const { jsPDF } = await import('jspdf');
    return jsPDF;
  }
  
  /**
   * Exporta el mapa según las opciones especificadas
   * @param mapContainer Elemento HTML que contiene el mapa
   * @param options Opciones de exportación
   * @param elements Elementos del mapa (opcional, solo para formatos de datos)
   * @param connections Conexiones del mapa (opcional, solo para formatos de datos)
   * @returns Observable que resuelve a true si la exportación fue exitosa
   */
  exportMap(
    mapContainer: HTMLElement,
    options: ExportOptions,
    elements?: NetworkElement[],
    connections?: NetworkConnection[]
  ): Observable<boolean> {
    this.exportingSubject.next(true);
    this.exportProgressSubject.next(0);
    
    this.logger.debug(`Iniciando exportación en formato ${options.format}`);
    
    // Establecer opciones por defecto
    const exportOptions: ExportOptions = {
      format: options.format,
      filename: options.filename || `mapa_red_${this.formatDate(new Date())}`,
      includeMetadata: options.includeMetadata ?? true,
      quality: options.quality ?? 0.95,
      scale: options.scale ?? 2,
      includeElements: options.includeElements ?? true,
      includeConnections: options.includeConnections ?? true,
      includeLegend: options.includeLegend ?? true,
      includeTimestamp: options.includeTimestamp ?? true
    };
    
    // Según el formato, elegir la estrategia de exportación
    switch (exportOptions.format) {
      case ExportFormat.PNG:
      case ExportFormat.JPEG:
        return this.exportAsImage(mapContainer, exportOptions);
        
      case ExportFormat.PDF:
        return this.exportAsPDF(mapContainer, exportOptions);
        
      case ExportFormat.SVG:
        return this.exportAsSVG(mapContainer, exportOptions);
        
      case ExportFormat.JSON:
        if (!elements || !connections) {
          this.logger.error('Se requieren elementos y conexiones para exportar a JSON');
          this.exportingSubject.next(false);
          return of(false);
        }
        return this.exportAsJSON(elements, connections, exportOptions);
        
      case ExportFormat.CSV:
        if (!elements || !connections) {
          this.logger.error('Se requieren elementos y conexiones para exportar a CSV');
          this.exportingSubject.next(false);
          return of(false);
        }
        return this.exportAsCSV(elements, connections, exportOptions);
        
      default:
        this.logger.error(`Formato de exportación no soportado: ${exportOptions.format}`);
        this.exportingSubject.next(false);
        return of(false);
    }
  }
  
  /**
   * Exporta el mapa como imagen (PNG o JPEG)
   * @param mapContainer Elemento HTML que contiene el mapa
   * @param options Opciones de exportación
   */
  private exportAsImage(mapContainer: HTMLElement, options: ExportOptions): Observable<boolean> {
    this.exportProgressSubject.next(10);
    
    const html2canvasOptions = {
      scale: options.scale || 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: null,
      logging: false
    };
    
    return from(html2canvas(mapContainer, html2canvasOptions)).pipe(
      tap(() => this.exportProgressSubject.next(70)),
      switchMap(canvas => {
        try {
          // Agregar marcas de agua o leyendas si es necesario
          if (options.includeTimestamp || options.watermark) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.font = '12px Arial';
              ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
              
              if (options.includeTimestamp) {
                const timestamp = `Exportado: ${this.formatDate(new Date())}`;
                ctx.fillText(timestamp, 10, canvas.height - 10);
              }
              
              if (options.watermark) {
                ctx.font = '16px Arial';
                ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
                ctx.fillText(options.watermark, canvas.width / 2 - 100, canvas.height / 2);
              }
            }
          }
          
          this.exportProgressSubject.next(80);
          
          // Convertir a blob según el formato
          const mimeType = options.format === ExportFormat.PNG ? 'image/png' : 'image/jpeg';
          
          canvas.toBlob(
            (blob) => {
              if (blob) {
                saveAs(blob, `${options.filename}.${options.format}`);
                this.exportProgressSubject.next(100);
                this.logger.debug(`Mapa exportado como ${options.format} correctamente`);
              } else {
                this.logger.error('Error al crear el blob de la imagen');
              }
            },
            mimeType,
            options.quality
          );
          
          return of(true);
        } catch (error) {
          this.logger.error('Error al exportar como imagen', error);
          return of(false);
        }
      }),
      catchError(error => {
        this.logger.error('Error al crear canvas del mapa', error);
        return of(false);
      }),
      finalize(() => this.exportingSubject.next(false))
    );
  }
  
  /**
   * Exporta el mapa como PDF
   * @param mapContainer Elemento HTML que contiene el mapa
   * @param options Opciones de exportación
   */
  private exportAsPDF(mapContainer: HTMLElement, options: ExportOptions): Observable<boolean> {
    this.exportProgressSubject.next(10);
    
    const html2canvasOptions = {
      scale: options.scale || 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: null,
      logging: false
    };
    
    return from(html2canvas(mapContainer, html2canvasOptions)).pipe(
      tap(() => this.exportProgressSubject.next(60)),
      switchMap(canvas => {
        try {
          const imgData = canvas.toDataURL('image/png');
          const pdf = new jsPDF({
            orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
            unit: 'mm'
          });
          
          // Calcular dimensiones para ajustar a página
          const imgWidth = pdf.internal.pageSize.getWidth();
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          
          pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
          
          // Añadir metadatos si es necesario
          if (options.includeMetadata) {
            pdf.setProperties({
              title: options.filename || 'Mapa de Red',
              subject: 'Exportación del Mapa de Red',
              creator: 'Network Map Application',
              author: 'Usuario',
              keywords: 'mapa, red, fibra óptica'
            });
          }
          
          // Añadir pie de página con timestamp
          if (options.includeTimestamp) {
            const timestamp = `Exportado: ${this.formatDate(new Date())}`;
            pdf.setFontSize(8);
            pdf.setTextColor(100, 100, 100);
            pdf.text(timestamp, pdf.internal.pageSize.getWidth() - 60, pdf.internal.pageSize.getHeight() - 5);
          }
          
          this.exportProgressSubject.next(90);
          
          // Guardar el PDF
          pdf.save(`${options.filename}.pdf`);
          
          this.exportProgressSubject.next(100);
          this.logger.debug('Mapa exportado como PDF correctamente');
          return of(true);
        } catch (error) {
          this.logger.error('Error al exportar como PDF', error);
          return of(false);
        }
      }),
      catchError(error => {
        this.logger.error('Error al crear canvas del mapa para PDF', error);
        return of(false);
      }),
      finalize(() => this.exportingSubject.next(false))
    );
  }
  
  /**
   * Exporta el mapa como SVG (no implementado, se muestra como ejemplo)
   * @param mapContainer Elemento HTML que contiene el mapa
   * @param options Opciones de exportación
   */
  private exportAsSVG(mapContainer: HTMLElement, options: ExportOptions): Observable<boolean> {
    this.logger.warn('Exportación a SVG no implementada');
    return of(false).pipe(
      finalize(() => this.exportingSubject.next(false))
    );
  }
  
  /**
   * Exporta los datos del mapa como JSON
   * @param elements Elementos del mapa
   * @param connections Conexiones del mapa
   * @param options Opciones de exportación
   */
  private exportAsJSON(
    elements: NetworkElement[],
    connections: NetworkConnection[],
    options: ExportOptions
  ): Observable<boolean> {
    try {
      this.exportProgressSubject.next(30);
      
      const exportData: any = {
        metadata: {
          exportDate: new Date().toISOString(),
          format: 'JSON',
          elementsCount: elements.length,
          connectionsCount: connections.length
        }
      };
      
      if (options.includeElements) {
        exportData.elements = elements;
      }
      
      if (options.includeConnections) {
        exportData.connections = connections;
      }
      
      this.exportProgressSubject.next(60);
      
      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      
      saveAs(blob, `${options.filename}.json`);
      
      this.exportProgressSubject.next(100);
      this.logger.debug('Datos exportados como JSON correctamente');
      return of(true);
    } catch (error) {
      this.logger.error('Error al exportar como JSON', error);
      return of(false);
    } finally {
      this.exportingSubject.next(false);
    }
  }
  
  /**
   * Exporta los datos del mapa como CSV
   * @param elements Elementos del mapa
   * @param connections Conexiones del mapa
   * @param options Opciones de exportación
   */
  private exportAsCSV(
    elements: NetworkElement[],
    connections: NetworkConnection[],
    options: ExportOptions
  ): Observable<boolean> {
    try {
      this.exportProgressSubject.next(30);
      
      // Crear CSV para elementos
      let csvContent = '';
      
      if (options.includeElements) {
        csvContent += 'id,name,type,status,latitude,longitude,description\n';
        
        elements.forEach(element => {
          const coordinates = element.position?.coordinates || [0, 0];
          const lat = coordinates[1] || 0;
          const lng = coordinates[0] || 0;
          
          csvContent += `${element.id},${this.escapeCsvValue(element.name)},${element.type},${element.status},${lat},${lng},${this.escapeCsvValue(element.description || '')}\n`;
        });
      }
      
      // Crear CSV para conexiones
      if (options.includeConnections) {
        if (options.includeElements) {
          csvContent += '\n'; // Línea en blanco para separar secciones
        }
        
        csvContent += 'id,sourceId,targetId,type,status,length,description\n';
        
        connections.forEach(conn => {
          csvContent += `${conn.id},${conn.sourceId},${conn.targetId},${conn.type || ''},${conn.status},${conn.length || ''},${this.escapeCsvValue(conn.description || '')}\n`;
        });
      }
      
      this.exportProgressSubject.next(60);
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
      saveAs(blob, `${options.filename}.csv`);
      
      this.exportProgressSubject.next(100);
      this.logger.debug('Datos exportados como CSV correctamente');
      return of(true);
    } catch (error) {
      this.logger.error('Error al exportar como CSV', error);
      return of(false);
    } finally {
      this.exportingSubject.next(false);
    }
  }
  
  /**
   * Formatea una fecha en formato legible
   * @param date Fecha a formatear
   * @returns Fecha formateada como YYYY-MM-DD_HH-MM-SS
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
  }
  
  /**
   * Escapa valores para CSV
   * @param value Valor a escapar
   * @returns Valor escapado para CSV
   */
  private escapeCsvValue(value: string): string {
    if (!value) return '';
    
    // Si el valor contiene comas, comillas o saltos de línea, encerrarlo en comillas
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      // Escapar comillas duplicándolas
      const escapedValue = value.replace(/"/g, '""');
      return `"${escapedValue}"`;
    }
    
    return value;
  }
} 
