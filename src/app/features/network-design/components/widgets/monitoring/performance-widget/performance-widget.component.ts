import { Component, OnInit, OnDestroy, Input, ChangeDetectorRef } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { 
  MapRenderingService, 
  PerformanceMetrics, 
  MapStatistics,
  OptimizationLevel
} from '../../../../services/map/map-rendering.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-performance-widget',
  templateUrl: './performance-widget.component.html',
  styleUrls: ['./performance-widget.component.scss'],
  standalone: true,
  imports: [CommonModule]
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
  
  constructor(
    private renderingService: MapRenderingService,
    private cdr: ChangeDetectorRef
  ) {}
  
  ngOnInit(): void {
    this.isExpanded = this.expanded;
    
    // Suscribirse a las métricas de rendimiento
    this.renderingService.performanceMetrics
      .pipe(takeUntil(this.destroy$))
      .subscribe(metrics => {
        this.metrics = metrics;
        this.performanceScore = this.renderingService.calculatePerformanceScore();
        this.cdr.detectChanges();
      });
    
    // Suscribirse a las estadísticas del mapa
    this.renderingService.mapStatistics
      .pipe(takeUntil(this.destroy$))
      .subscribe(statistics => {
        this.statistics = statistics;
        this.cdr.detectChanges();
      });
    
    // Suscribirse a la configuración de optimización
    this.renderingService.optimizationConfig
      .pipe(takeUntil(this.destroy$))
      .subscribe(config => {
        this.currentOptimizationLevel = config.level;
        this.cdr.detectChanges();
      });
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  /**
   * Expande o colapsa el widget
   */
  toggleExpand(): void {
    this.isExpanded = !this.isExpanded;
  }
  
  /**
   * Cambia a la pestaña especificada
   * @param tab Pestaña a activar
   */
  setActiveTab(tab: 'performance' | 'optimization'): void {
    this.activeTab = tab;
  }
  
  /**
   * Cambia el nivel de optimización
   * @param level Nivel de optimización
   */
  setOptimizationLevel(level: OptimizationLevel): void {
    this.renderingService.setOptimizationLevel(level);
  }
  
  /**
   * Habilita o deshabilita la optimización automática
   */
  toggleAutoOptimization(): void {
    this.autoOptimizationEnabled = !this.autoOptimizationEnabled;
    this.renderingService.setAutoOptimization(this.autoOptimizationEnabled);
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
  formatFps(fps: number): string {
    return fps.toFixed(0);
  }
} 
