import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { MatBadgeModule } from '@angular/material/badge';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { Subject, timer } from 'rxjs';
import { takeUntil, finalize, switchMap, tap, take } from 'rxjs/operators';
import { FormatPercentagePipe } from '../../../../shared/pipes/format-percentage.pipe';

import { MapDiagnosticService } from '../../services/map-diagnostic.service';
import { MapPositionService } from '../../services/map-position.service';
import { NetworkStateService } from '../../services/network-state.service';

// Importación de los nuevos servicios refactorizados
import { MapStateManagerService } from '../../services/map/map-state-manager.service';
import { MapElementManagerService } from '../../services/map/map-element-manager.service';
import { MapRenderingService, PerformanceMetrics, MapStatistics } from '../../services/map/map-rendering.service';
import { MapInteractionService } from '../../services/map/map-interaction.service';
import { MapServicesModule } from '../../services/map/map-services.module';
import { ElementType } from '../../../../shared/types/network.types';

/**
 * Interfaz para los resultados del diagnóstico
 */
interface DiagnosticoResultado {
  error?: boolean;
  mensaje?: string;
  recursos?: RecursoVerificado[];
  estadisticas?: Estadisticas;
  warnings?: string[];
  tiles?: boolean;
  timestamp?: number;
}

/**
 * Interfaz para recursos verificados
 */
interface RecursoVerificado {
  url: string;
  status: 'ok' | 'error';
  message?: string;
  responseTime?: number; // Nuevo: tiempo de respuesta en ms
}

/**
 * Interfaz para estadísticas
 */
interface Estadisticas {
  memoria?: string;
  rendimiento?: string;
  leafletCargado?: boolean;
  tilesCargados?: boolean;
  fps?: number; // Nuevo: frames por segundo
  tiempoInicializacion?: string; // Nuevo: tiempo de inicialización
  [key: string]: any;
}

@Component({
  selector: 'app-map-diagnostic',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressBarModule,
    MatExpansionModule,
    MatDividerModule,
    MatListModule,
    MatBadgeModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatDialogModule,
    MatMenuModule,
    FormatPercentagePipe,
    MapServicesModule // Importar el módulo de servicios de mapa
  ],
  templateUrl: './map-diagnostic.component.html',
  styleUrls: ['./map-diagnostic.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MapDiagnosticComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Exponer Object para usarlo en el template
  Object = Object;
  
  diagnosticoResultado: DiagnosticoResultado | null = null;
  cargando = false;
  errorCount = 0;
  warningCount = 0;
  recursosVerificados: RecursoVerificado[] = [];
  estadisticas: Estadisticas = {};
  
  // Nuevo: opciones para modo autoDiagnostico
  autoDiagnosticoActive = false;
  autoDiagnosticoInterval = 60; // segundos
  
  // Nuevo: para mostrar la hora del último diagnóstico
  ultimoDiagnostico: Date | null = null;
  
  constructor(
    private diagnosticService: MapDiagnosticService,
    private mapService: MapPositionService,
    private networkStateService: NetworkStateService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef,
    // Inyectar los servicios refactorizados
    private stateManager: MapStateManagerService,
    private elementManager: MapElementManagerService,
    private renderingService: MapRenderingService,
    private interactionService: MapInteractionService
  ) {}

  ngOnInit(): void {
    // Notificar al sistema que el modo diagnóstico está activo
    this.networkStateService.setDiagnosticMode(true);
    
    // Opcional: ejecutar diagnóstico inicial automáticamente
    this.ejecutarDiagnostico();
  }
  
  ngOnDestroy(): void {
    // Desactivar modo diagnóstico al salir
    this.networkStateService.setDiagnosticMode(false);
    
    this.stopAutoDiagnostico();
    this.destroy$.next();
    this.destroy$.complete();
  }

  ejecutarDiagnostico(): void {
    this.cargando = true;
    this.diagnosticoResultado = null;
    this.errorCount = 0;
    this.warningCount = 0;
    this.cdr.markForCheck();
    
    // Obtener información de rendimiento del servicio refactorizado
    const performanceMetrics = this.renderingService.getPerformanceMetrics();
    const mapStatistics = this.renderingService.getMapStatistics();
    
    // Actualizar estadísticas con datos de los nuevos servicios
    this.estadisticas = {
      memoria: mapStatistics.memoryUsageFormatted,
      rendimiento: mapStatistics.performanceLevel,
      fps: performanceMetrics.fps,
      tiempoInicializacion: `${mapStatistics.loadTime}ms`,
      elementosCargados: mapStatistics.totalElements.toString(),
      elementosVisibles: this.elementManager.getAllElements().length.toString()
    };
    
    // Generar lista de advertencias basadas en métricas
    const warnings: string[] = [];
    
    if (performanceMetrics.fps < 30) {
      warnings.push('Rendimiento bajo: FPS por debajo de 30');
    }
    
    if (performanceMetrics.renderTime > 100) {
      warnings.push('Tiempo de renderizado alto: ' + performanceMetrics.renderTime + 'ms');
    }
    
    this.mapService.diagnosticarMapa()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.cargando = false;
          this.ultimoDiagnostico = new Date();
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (resultado: any) => {
          this.diagnosticoResultado = resultado;
          if (this.diagnosticoResultado) {
            this.diagnosticoResultado.timestamp = Date.now();
            
            // Integrar las estadísticas obtenidas de los nuevos servicios
            this.diagnosticoResultado.estadisticas = {
              ...this.diagnosticoResultado.estadisticas,
              ...this.estadisticas
            };
            
            // Integrar advertencias
            if (!this.diagnosticoResultado.warnings) {
              this.diagnosticoResultado.warnings = [];
            }
            
            this.diagnosticoResultado.warnings = [
              ...this.diagnosticoResultado.warnings,
              ...warnings
            ];
          }
          
          // Extraer recursos verificados
          if (resultado.recursos) {
            this.recursosVerificados = resultado.recursos;
            this.errorCount = this.recursosVerificados.filter(r => r.status === 'error').length;
          }
          
          // Extraer estadísticas
          if (resultado.estadisticas) {
            this.estadisticas = resultado.estadisticas;
          }
          
          // Verificar warnings
          if (resultado.warnings) {
            this.warningCount = resultado.warnings.length;
          }
          
          // Mostrar notificación según resultado
          if (!this.autoDiagnosticoActive) {
            this.mostrarResultadoNotificacion();
          }
        },
        error: (error: any) => {
          console.error('Error al ejecutar diagnóstico:', error);
          this.diagnosticoResultado = {
            error: true,
            mensaje: 'Error al ejecutar el diagnóstico: ' + (error.message || 'Error desconocido'),
            timestamp: Date.now()
          };
          this.errorCount = 1;
          
          if (!this.autoDiagnosticoActive) {
            this.snackBar.open('Error al ejecutar el diagnóstico del mapa', 'Cerrar', {
              duration: 5000,
              panelClass: ['error-snackbar'],
              politeness: 'assertive'
            });
          }
        }
      });
  }

  // Nuevo: mostrar notificación de resultados
  mostrarResultadoNotificacion(): void {
    if (this.errorCount > 0) {
      this.snackBar.open(`Diagnóstico completado con ${this.errorCount} errores`, 'Cerrar', {
        duration: 5000,
        panelClass: ['error-snackbar'],
        politeness: 'assertive'
      });
    } else if (this.warningCount > 0) {
      this.snackBar.open(`Diagnóstico completado con ${this.warningCount} advertencias`, 'Cerrar', {
        duration: 5000,
        panelClass: ['warning-snackbar'],
        politeness: 'polite'
      });
    } else {
      this.snackBar.open('Diagnóstico completado exitosamente', 'Cerrar', {
        duration: 3000,
        panelClass: ['success-snackbar'],
        politeness: 'polite'
      });
    }
  }

  toggleLogs(): void {
    this.diagnosticService.toggleDiagnosticoLogs(true);
    this.snackBar.open('Logs de diagnóstico activados', 'Cerrar', {
      duration: 2000
    });
  }
  
  getStatusColor(status: string): string {
    return status === 'ok' ? 'green' : 'red';
  }
  
  getStatusIcon(status: string): string {
    return status === 'ok' ? 'check_circle' : 'error';
  }
  
  isProblemaSevero(): boolean {
    return this.errorCount > 0;
  }
  
  getTieneProblemas(): boolean {
    return this.errorCount > 0 || this.warningCount > 0;
  }
  
  verificarDeTiles(): void {
    this.cargando = true;
    this.cdr.markForCheck();
    
    this.diagnosticService.verificarServidoresTiles()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.cargando = false;
          this.ultimoDiagnostico = new Date();
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (resultado: any) => {
          if (!this.diagnosticoResultado) {
            this.diagnosticoResultado = { timestamp: Date.now() };
          }
          
          this.diagnosticoResultado.tiles = resultado.success;
          
          if (resultado.recursos) {
            this.recursosVerificados = resultado.recursos;
            this.errorCount = this.recursosVerificados.filter(r => r.status === 'error').length;
          }
          
          this.snackBar.open(
            resultado.success ? 'Servicios de tiles funcionando correctamente' : 'Problemas con los servicios de tiles',
            'Cerrar',
            {
              duration: 3000,
              panelClass: resultado.success ? ['success-snackbar'] : ['error-snackbar']
            }
          );
        },
        error: (error: any) => {
          console.error('Error al verificar tiles:', error);
          if (!this.diagnosticoResultado) {
            this.diagnosticoResultado = { timestamp: Date.now() };
          }
          
          this.diagnosticoResultado.tiles = false;
          this.errorCount++;
          
          this.snackBar.open('Error al verificar servicios de tiles', 'Cerrar', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        }
      });
  }

  exportarResultados(): void {
    if (!this.diagnosticoResultado) {
      this.snackBar.open('No hay resultados para exportar', 'Cerrar', {
        duration: 2000
      });
      return;
    }
    
    try {
      // Incluir métricas de rendimiento de los nuevos servicios
      const exportData = {
        ...this.diagnosticoResultado,
        performanceMetrics: this.renderingService.getPerformanceMetrics(),
        mapStatistics: this.renderingService.getMapStatistics(),
        elementCount: this.elementManager.getAllElements().length,
        activeLayersCount: 0 // Lo actualizaremos con la suscripción
      };
      
      // Obtener número de capas activas
      this.stateManager.activeLayers.pipe(take(1)).subscribe((layers: ElementType[]) => {
        exportData.activeLayersCount = layers.length;
      });
      
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `map-diagnostico-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      this.snackBar.open('Resultados exportados correctamente', 'Cerrar', {
        duration: 2000
      });
    } catch (error) {
      console.error('Error al exportar resultados:', error);
      this.snackBar.open('Error al exportar resultados', 'Cerrar', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
    }
  }

  toggleAutoDiagnostico(): void {
    if (this.autoDiagnosticoActive) {
      this.stopAutoDiagnostico();
      this.snackBar.open('Diagnóstico automático desactivado', 'Cerrar', {
        duration: 2000
      });
    } else {
      this.startAutoDiagnostico();
      this.snackBar.open(`Diagnóstico automático activado (cada ${this.autoDiagnosticoInterval} segundos)`, 'Cerrar', {
        duration: 2000
      });
    }
  }

  private startAutoDiagnostico(): void {
    if (this.autoDiagnosticoActive) return;
    
    this.autoDiagnosticoActive = true;
    
    // Ejecutar diagnóstico inicial
    this.ejecutarDiagnostico();
    
    // Crear timer que ejecuta el diagnóstico periódicamente
    timer(this.autoDiagnosticoInterval * 1000, this.autoDiagnosticoInterval * 1000)
      .pipe(
        takeUntil(this.destroy$),
        tap(() => {
          console.log(`Ejecutando diagnóstico automático (intervalo: ${this.autoDiagnosticoInterval}s)`);
        }),
        switchMap(() => {
          // En lugar de ejecutar directamente, marcamos como cargando y luego invocamos
          this.cargando = true;
          this.cdr.markForCheck();
          
          // Usamos el rendimiento de los servicios refactorizados
          const performanceMetrics = this.renderingService.getPerformanceMetrics();
          
          // Si el rendimiento es bajo, agregar advertencia
          const warnings: string[] = [];
          if (performanceMetrics.fps < 20) {
            warnings.push('Rendimiento crítico detectado en diagnóstico automático');
          }
          
          // Devolver observable del servicio de diagnóstico
          return this.mapService.diagnosticarMapa();
        })
      )
      .subscribe({
        next: (resultado: any) => {
          // Actualizar el resultado de diagnóstico con la misma lógica del método ejecutarDiagnostico
          this.diagnosticoResultado = resultado;
          
          // Extraer recursos verificados
          if (resultado.recursos) {
            this.recursosVerificados = resultado.recursos;
            this.errorCount = this.recursosVerificados.filter(r => r.status === 'error').length;
          }
          
          // Extraer estadísticas
          if (resultado.estadisticas) {
            this.estadisticas = {
              ...resultado.estadisticas,
              ...this.estadisticas,
              fps: this.renderingService.getPerformanceMetrics().fps
            };
          }
          
          // Verificar warnings
          if (resultado.warnings) {
            this.warningCount = resultado.warnings.length;
          }
          
          // Marcar diagnóstico como completado
          this.cargando = false;
          this.ultimoDiagnostico = new Date();
          this.cdr.markForCheck();
          
          // Si hay errores severos, notificar aunque esté en modo automático
          if (this.errorCount > 0) {
            this.snackBar.open(`Diagnóstico automático: ${this.errorCount} errores detectados`, 'Ver', {
              duration: 5000,
              panelClass: ['error-snackbar']
            });
          }
        },
        error: (error: any) => {
          console.error('Error en diagnóstico automático:', error);
          this.cargando = false;
          this.ultimoDiagnostico = new Date();
          this.cdr.markForCheck();
        }
      });
  }

  private stopAutoDiagnostico(): void {
    this.autoDiagnosticoActive = false;
  }

  reiniciarServicioMapa(): void {
    this.cargando = true;
    this.cdr.markForCheck();
    
    try {
      // Reiniciar servicios refactorizados
      this.renderingService.clearMemoizationCache();
      
      // Reiniciar capas activas usando enum ElementType correctamente
      const defaultLayers: ElementType[] = [
        ElementType.OLT,
        ElementType.ONT, 
        ElementType.FDP, 
        ElementType.SPLITTER,
        ElementType.EDFA,
        ElementType.MANGA
      ];
      this.stateManager.setActiveLayers(defaultLayers);
      
      // Descartar selecciones
      this.interactionService.selectElement(null);
      this.interactionService.selectConnection(null);
      
      // Continuar con el reinicio del servicio original
      // Verificar si existe método reiniciarServicio o reinicializarMapa
      if (typeof this.mapService['reiniciarServicio'] === 'function') {
        (this.mapService['reiniciarServicio'] as Function)()
          .pipe(
            takeUntil(this.destroy$),
            finalize(() => {
              this.cargando = false;
              this.cdr.markForCheck();
            })
          )
          .subscribe({
            next: () => {
              this.snackBar.open('Servicio de mapa reiniciado correctamente', 'Cerrar', {
                duration: 3000,
                panelClass: ['success-snackbar']
              });
              
              // Ejecutar diagnóstico tras reiniciar
              this.ejecutarDiagnostico();
            },
            error: (error: any) => {
              console.error('Error al reiniciar servicio de mapa:', error);
              this.snackBar.open('Error al reiniciar servicio de mapa', 'Cerrar', {
                duration: 5000,
                panelClass: ['error-snackbar']
              });
            }
          });
      } else if (typeof this.mapService['reinicializarMapa'] === 'function') {
        (this.mapService['reinicializarMapa'] as Function)()
          .pipe(
            takeUntil(this.destroy$),
            finalize(() => {
              this.cargando = false;
              this.cdr.markForCheck();
            })
          )
          .subscribe({
            next: () => {
              this.snackBar.open('Servicio de mapa reiniciado correctamente', 'Cerrar', {
                duration: 3000,
                panelClass: ['success-snackbar']
              });
              
              // Ejecutar diagnóstico tras reiniciar
              this.ejecutarDiagnostico();
            },
            error: (error: any) => {
              console.error('Error al reiniciar servicio de mapa:', error);
              this.snackBar.open('Error al reiniciar servicio de mapa', 'Cerrar', {
                duration: 5000,
                panelClass: ['error-snackbar']
              });
            }
          });
      } else {
        this.snackBar.open('No se pudo reiniciar el servicio de mapa: método no encontrado', 'Cerrar', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
        this.cargando = false;
        this.cdr.markForCheck();
      }
    } catch (error) {
      console.error('Error al reiniciar servicios del mapa:', error);
      this.cargando = false;
      this.cdr.markForCheck();
      
      this.snackBar.open('Error al reiniciar servicios del mapa', 'Cerrar', {
        duration: 5000,
        panelClass: ['error-snackbar']
      });
    }
  }

  getResultadoResumen(): string {
    if (!this.diagnosticoResultado) {
      return 'No se ha ejecutado diagnóstico';
    }
    
    if (this.diagnosticoResultado.error) {
      return 'Error en el diagnóstico';
    }
    
    if (this.errorCount > 0) {
      return `${this.errorCount} errores encontrados`;
    }
    
    if (this.warningCount > 0) {
      return `${this.warningCount} advertencias encontradas`;
    }
    
    return 'Diagnóstico completado sin problemas';
  }

  getUltimoDiagnosticoTiempo(): string {
    if (!this.ultimoDiagnostico) return '';
    
    return this.ultimoDiagnostico.toLocaleTimeString();
  }

  formatearTiempo(ms: any): string {
    if (typeof ms !== 'number') {
      // Si ms es un string, intentar parsearlo
      if (typeof ms === 'string') {
        const parsedMs = parseFloat(ms);
        if (isNaN(parsedMs)) return ms;
        ms = parsedMs;
      } else {
        return ms;
      }
    }
    
    if (ms < 1000) {
      return `${ms.toFixed(1)} ms`;
    } else if (ms < 60000) {
      return `${(ms / 1000).toFixed(1)} s`;
    } else {
      const minutos = Math.floor(ms / 60000);
      const segundos = ((ms % 60000) / 1000).toFixed(0);
      return `${minutos}:${segundos.padStart(2, '0')} min`;
    }
  }
} 