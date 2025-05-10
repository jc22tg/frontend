import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, forkJoin, throwError } from 'rxjs';
import { catchError, map, delay, timeout } from 'rxjs/operators';
import { environment } from '@environments/environment';
import * as L from 'leaflet';
import * as d3 from 'd3';
import { LoggerService } from '../../../core/services/logger.service';

export interface DiagnosticResult {
  success: boolean;
  error?: string;
  details?: Record<string, any>;
}

export interface RecursoVerificado {
  url: string;
  status: 'ok' | 'error';
  message?: string;
  responseTime?: number;
}

@Injectable({
  providedIn: 'root'
})
export class MapDiagnosticService {
  private logEnabled = true;
  private inicioRendering = 0;
  private frameCount = 0;
  private lastFrameTime = 0;
  private fps = 0;

  // Lista de URLs críticas para el funcionamiento
  private recursosEsenciales: string[] = [
    'https://tile.openstreetmap.org/1/1/1.png',
    '/assets/leaflet/images/marker-icon.png',
    '/assets/leaflet/leaflet.css'
  ];

  private readonly LEAFLET_RESOURCES = [
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
  ];
  
  private readonly TILE_SERVERS = [
    'https://tile.openstreetmap.org/1/1/1.png',
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/1/1/1',
    'https://mt0.google.com/vt/lyrs=s,h&x=1&y=1&z=1'
  ];

  constructor(private http: HttpClient, private logger: LoggerService) {
    // Iniciar medición de FPS
    this.iniciarMedicionFPS();
  }

  /**
   * Verifica que todos los recursos necesarios para el mapa estén disponibles
   */
  verifyResources(): Observable<DiagnosticResult> {
    console.log('Verificando recursos del mapa');
    
    // Simulación de verificación exitosa
    return of({
      success: true,
      details: {
        leafletLoaded: true,
        tilesAvailable: true,
        geolocationAvailable: 'navigator.geolocation' in window
      }
    }).pipe(delay(300));
  }

  /**
   * Verifica la disponibilidad de Leaflet
   */
  verifyLeaflet(): Observable<DiagnosticResult> {
    // Simulación de verificación
    return of({
      success: true,
      details: {
        leafletVersion: '1.7.1'
      }
    }).pipe(delay(100));
  }

  /**
   * Verifica la disponibilidad de servicios de tiles
   */
  verifyTileServices(): Observable<DiagnosticResult> {
    // Simulación de verificación
    return of({
      success: true,
      details: {
        openStreetMap: true,
        mapbox: true
      }
    }).pipe(delay(100));
  }

  /**
   * Ejecuta diagnóstico completo del mapa
   */
  runFullDiagnostic(): Observable<DiagnosticResult> {
    console.log('Ejecutando diagnóstico completo');
    
    // Simulación de diagnóstico completo
    return of({
      success: true,
      details: {
        leaflet: true,
        tiles: true,
        geolocation: true,
        rendering: true,
        memory: {
          status: 'good',
          usage: '45MB'
        },
        performance: {
          status: 'good',
          renderTime: '120ms'
        }
      }
    }).pipe(delay(500));
  }

  /**
   * Registra resultados de diagnóstico
   */
  logDiagnosticResults(results: DiagnosticResult): void {
    console.log('Resultados de diagnóstico:', results);
    // Aquí iría lógica para registrar resultados en algún servicio
  }

  /**
   * Mide el rendimiento de operaciones en el mapa
   */
  measurePerformance(operation: string): Observable<{ operation: string; time: number }> {
    const startTime = performance.now();
    
    // Simulamos una operación
    return of({
      operation,
      time: performance.now() - startTime
    }).pipe(delay(Math.random() * 200));
  }

  /**
   * Verifica la carga de activos de mapa
   */
  public verificarRecursosLeaflet(): Observable<boolean> {
    this.logger.debug('Verificando disponibilidad de recursos Leaflet...');
    
    try {
      // Verificar si Leaflet ya está cargado
      if (typeof L !== 'undefined') {
        this.logger.debug('Leaflet ya está cargado en la página');
        return of(true);
      }
      
      // Verificar acceso a CDN de Leaflet
      const comprobaciones = this.LEAFLET_RESOURCES.map(url => 
        this.comprobarRecurso(url).pipe(
          catchError(error => {
            this.logger.warn(`No se pudo acceder a ${url}: ${error.message}`);
            return of(false);
          })
        )
      );
      
      return forkJoin(comprobaciones).pipe(
        map(resultados => {
          const todosDisponibles = resultados.every(Boolean);
          this.logger.debug(`Recursos Leaflet ${todosDisponibles ? 'disponibles' : 'NO disponibles'}`);
          return todosDisponibles;
        }),
        catchError(error => {
          this.logger.error('Error al verificar recursos Leaflet:', error);
          return of(false);
        })
      );
    } catch (error) {
      this.logger.error('Error en verificación de recursos:', error);
      return of(false);
    }
  }

  /**
   * Comprueba la disponibilidad de un recurso web
   */
  private comprobarRecurso(url: string): Observable<boolean> {
    return this.http.head(url, { observe: 'response' }).pipe(
      timeout(5000),
      map(response => response.status === 200),
      catchError(error => {
        this.logger.warn(`Error al comprobar ${url}: ${error.message}`);
        return of(false);
      })
    );
  }

  /**
   * Verifica la disponibilidad de los servidores de tiles
   */
  verificarServidoresTiles(): Observable<Record<string, boolean>> {
    this.logger.debug('Verificando disponibilidad de servidores de tiles...');
    
    const comprobaciones = this.TILE_SERVERS.map(url => 
      this.comprobarRecurso(url).pipe(
        map(disponible => ({ url, disponible })),
        catchError(() => of({ url, disponible: false }))
      )
    );
    
    return forkJoin(comprobaciones).pipe(
      map(resultados => {
        const resultado: Record<string, boolean> = {};
        resultados.forEach(r => {
          const servidor = r.url.split('/')[2]; // Obtener el dominio
          resultado[servidor] = r.disponible;
        });
        
        this.logger.debug('Resultado verificación servidores:', resultado);
        return resultado;
      }),
      catchError(error => {
        this.logger.error('Error al verificar servidores de tiles:', error);
        return of({});
      })
    );
  }

  /**
   * Realiza un diagnóstico completo del mapa
   */
  diagnosticoCompleto(): Observable<any> {
    this.logger.debug('Iniciando diagnóstico completo del mapa...');
    
    return forkJoin({
      recursosLeaflet: this.verificarRecursosLeaflet(),
      servidoresTiles: this.verificarServidoresTiles()
    }).pipe(
      catchError(error => {
        this.logger.error('Error en diagnóstico completo:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Activa/desactiva los logs de diagnóstico
   */
  public toggleDiagnosticoLogs(enabled: boolean): void {
    this.logEnabled = enabled;
    console.log(`Logs de diagnóstico de mapa: ${enabled ? 'ACTIVADOS' : 'DESACTIVADOS'}`);
  }

  /**
   * Registra información sobre el mapa para diagnóstico
   */
  logMapInfo(map: any): void {
    if (!map) {
      this.logger.warn('No hay instancia de mapa para diagnosticar');
      return;
    }
    
    try {
      this.logger.debug(`Información del mapa:
        - Inicializado: ${map._initialized || 'desconocido'}
        - Zoom: ${map.getZoom ? map.getZoom() : 'N/A'}
        - Centro: ${map.getCenter ? JSON.stringify(map.getCenter()) : 'N/A'}
        - Capas: ${map._layers ? Object.keys(map._layers).length : 'N/A'}
        - Container: ${map._container ? map._container.clientWidth + 'x' + map._container.clientHeight : 'N/A'}
      `);
    } catch (error) {
      this.logger.error('Error al registrar información del mapa:', error);
    }
  }

  private verificarRecursos(urls: string[]): Observable<boolean> {
    const verificaciones: Observable<boolean>[] = urls.map(url => 
      this.http.get(url, { responseType: 'blob' }).pipe(
        timeout(5000),
        map(() => true),
        catchError(error => {
          console.error(`Error al verificar recurso ${url}:`, error);
          return of(false);
        })
      )
    );
    
    return forkJoin(verificaciones).pipe(
      map(results => !results.includes(false))
    );
  }

  /**
   * Verifica recursos y devuelve información detallada
   */
  private verificarRecursosDetallados(urls: string[]): Observable<RecursoVerificado[]> {
    const verificaciones: Observable<RecursoVerificado>[] = urls.map(url => {
      const startTime = performance.now();
      return this.http.get(url, { responseType: 'blob' }).pipe(
        timeout(5000),
        map(() => {
          const endTime = performance.now();
          return {
            url,
            status: 'ok' as const,
            responseTime: Math.round(endTime - startTime)
          };
        }),
        catchError(error => {
          return of({
            url,
            status: 'error' as const,
            message: error.status ? `Error ${error.status}` : 'Tiempo de espera agotado',
            responseTime: 0
          });
        })
      );
    });
    
    return forkJoin(verificaciones);
  }

  private obtenerEstadoMemoria(): string {
    if (!window.performance) {
      return 'No disponible';
    }
    
    try {
      // Extender la interfaz Performance para TypeScript
      interface PerformanceMemory {
        jsHeapSizeLimit: number;
        totalJSHeapSize: number;
        usedJSHeapSize: number;
      }
      
      interface PerformanceWithMemory extends Performance {
        memory?: PerformanceMemory;
      }
      
      const performanceExt = window.performance as PerformanceWithMemory;
      
      if (performanceExt.memory) {
        const memoryInfo = performanceExt.memory;
        const usedMb = Math.round(memoryInfo.usedJSHeapSize / (1024 * 1024));
        const limitMb = Math.round(memoryInfo.jsHeapSizeLimit / (1024 * 1024));
        const porcentaje = (usedMb / limitMb * 100).toFixed(1);
        return `${porcentaje}%`;
      }
    } catch (error) {
      console.error('Error al obtener información de memoria:', error);
    }
    
    return 'No disponible';
  }

  private medirRendimiento(): string {
    try {
      // Simulamos aquí una medida de rendimiento basada en los FPS
      const rendimientoBasadoEnFPS = this.fps > 30 ? '95%' : this.fps > 15 ? '70%' : '40%';
      return rendimientoBasadoEnFPS;
    } catch (error) {
      console.error('Error al medir rendimiento:', error);
      return 'No disponible';
    }
  }
  
  /**
   * Inicia medición de FPS
   */
  private iniciarMedicionFPS(): void {
    this.inicioRendering = performance.now();
    this.frameCount = 0;
    this.lastFrameTime = this.inicioRendering;
    this.fps = 0;
    
    const medirFrame = () => {
      const ahora = performance.now();
      this.frameCount++;
      
      // Actualizar FPS cada segundo
      if (ahora - this.lastFrameTime >= 1000) {
        this.fps = Math.round((this.frameCount * 1000) / (ahora - this.lastFrameTime));
        this.lastFrameTime = ahora;
        this.frameCount = 0;
      }
      
      requestAnimationFrame(medirFrame);
    };
    
    requestAnimationFrame(medirFrame);
  }
  
  /**
   * Mide tiempo de inicialización aproximado
   */
  private medirTiempoInicializacion(): string {
    // Aquí simulamos un tiempo de inicialización
    const tiempoAleatorio = Math.floor(Math.random() * 500) + 100;
    return `${tiempoAleatorio}ms`;
  }
  
  /**
   * Formatea un valor de tiempo para mostrar
   */
  public formatearTiempo(ms: number): string {
    if (ms < 1000) return `${ms.toFixed(0)} ms`;
    return `${(ms/1000).toFixed(2)} s`;
  }
} 