import { Component, OnInit, OnDestroy, Input, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime } from 'rxjs/operators';
import { 
  MapRenderingService, 
  PerformanceMetrics, 
  MapStatistics,
  OptimizationLevel
} from '../../../../../services/map/map-rendering.service';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-performance-widget',
  templateUrl: './performance-widget.component.html',
  styleUrls: ['./performance-widget.component.scss'],
  standalone: true,
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PerformanceWidgetComponent implements OnInit, OnDestroy {
  @Input() expanded = false;
  @Input() position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' = 'bottom-right';
  
  metrics: PerformanceMetrics | null = null;
  statistics: MapStatistics | null = null;
  performanceScore = 0;
  
  optLevels = OptimizationLevel;
  currentOptimizationLevel: OptimizationLevel = OptimizationLevel.AUTO;
  autoOptimizationEnabled = true;
  
  isExpanded = false;
  activeTab: 'performance' | 'optimization' = 'performance';
  
  private destroy$ = new Subject<void>();
  private updateView$ = new Subject<void>();
  
  constructor(
    private renderingService: MapRenderingService,
    private cdr: ChangeDetectorRef
  ) {}
  
  ngOnInit(): void {
    this.isExpanded = this.expanded;
    
    // Optimización: Agrupar las actualizaciones de la vista
    this.updateView$
      .pipe(
        debounceTime(16), // ~60fps
        takeUntil(this.destroy$)
      )
      .subscribe(() => this.cdr.detectChanges());
    
    // Suscribirse a las métricas de rendimiento
    this.renderingService.performanceMetrics
      .pipe(takeUntil(this.destroy$))
      .subscribe(metrics => {
        this.metrics = metrics;
        this.performanceScore = this.renderingService.calculatePerformanceScore();
        this.updateView$.next();
      });
    
    // Suscribirse a las estadísticas del mapa
    this.renderingService.mapStatistics
      .pipe(takeUntil(this.destroy$))
      .subscribe(statistics => {
        this.statistics = statistics;
        this.updateView$.next();
      });
    
    // Suscribirse a la configuración de optimización
    this.renderingService.optimizationConfig
      .pipe(takeUntil(this.destroy$))
      .subscribe(config => {
        this.currentOptimizationLevel = config.level;
        this.updateView$.next();
      });
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.updateView$.complete();
  }
  
  /**
   * Expande o colapsa el widget
   */
  toggleExpand(): void {
    this.isExpanded = !this.isExpanded;
    this.cdr.markForCheck(); // Usar markForCheck en lugar de detectChanges para respetar OnPush
  }
  
  /**
   * Cambia a la pestaña especificada
   * @param tab Pestaña a activar
   */
  setActiveTab(tab: 'performance' | 'optimization'): void {
    if (this.activeTab === tab) return; // Validación añadida
    
    this.activeTab = tab;
    this.cdr.markForCheck();
  }
  
  /**
   * Cambia el nivel de optimización
   * @param level Nivel de optimización
   */
  setOptimizationLevel(level: OptimizationLevel): void {
    // Validación añadida
    if (level === this.currentOptimizationLevel) return;
    
    if (Object.values(OptimizationLevel).includes(level)) {
      this.renderingService.setOptimizationLevel(level);
      this.currentOptimizationLevel = level;
      this.cdr.markForCheck();
    } else {
      console.warn(`Nivel de optimización no válido: ${level}`);
    }
  }
  
  /**
   * Habilita o deshabilita la optimización automática
   */
  toggleAutoOptimization(): void {
    this.autoOptimizationEnabled = !this.autoOptimizationEnabled;
    this.renderingService.setAutoOptimization(this.autoOptimizationEnabled);
    this.cdr.markForCheck();
  }
  
  /**
   * Obtiene la clase CSS para el medidor de rendimiento
   */
  getPerformanceClass(): string {
    if (!this.performanceScore) return 'unknown';
    
    if (this.performanceScore >= 80) return 'high';
    if (this.performanceScore >= 50) return 'medium';
    return 'low';
  }
  
  /**
   * Formatea el valor de los FPS con una precisión específica
   * @param fps Valor de FPS a formatear
   * @returns FPS formateado
   */
  formatFps(fps: number | undefined): string {
    if (fps === undefined || isNaN(fps)) return '0'; // Validación añadida
    return fps.toFixed(0);
  }
} 
