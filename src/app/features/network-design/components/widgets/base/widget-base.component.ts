import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

/**
 * Componente base para todos los widgets
 * 
 * Esta clase proporciona funcionalidad común para todos los widgets,
 * permitiendo unificar aspectos como:
 * - Manejo del estado de colapso/expansión
 * - Cambio de posición
 * - Estilos comunes
 * - Dimensión y redimensionamiento
 */
@Component({
  selector: 'app-widget-base',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="widget" [class.collapsed]="collapsed" [class.dark-mode]="darkMode">
      <div class="widget-header" (mousedown)="onDragStart($event)">
        <div class="widget-title">{{ title }}</div>
        <div class="widget-controls">
          <button *ngIf="allowCollapse" class="widget-control" (click)="toggleCollapse()">
            <i class="fa" [class.fa-chevron-up]="!collapsed" [class.fa-chevron-down]="collapsed"></i>
          </button>
          <button *ngIf="allowClose" class="widget-control" (click)="close()">
            <i class="fa fa-times"></i>
          </button>
        </div>
      </div>
      <div class="widget-content" *ngIf="!collapsed">
        <ng-content></ng-content>
      </div>
    </div>
  `,
  styles: [`
    .widget {
      background-color: #fff;
      border-radius: 4px;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
      margin: 8px;
      overflow: hidden;
      position: relative;
      min-width: 180px;
      transition: all 0.3s ease;
    }
    
    .widget.dark-mode {
      background-color: #333;
      color: #fff;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.5);
    }
    
    .widget.collapsed .widget-content {
      display: none;
    }
    
    .widget-header {
      align-items: center;
      background-color: #f5f5f5;
      cursor: move;
      display: flex;
      justify-content: space-between;
      padding: 8px 12px;
      user-select: none;
    }
    
    .widget.dark-mode .widget-header {
      background-color: #444;
    }
    
    .widget-title {
      font-weight: 500;
      font-size: 14px;
    }
    
    .widget-controls {
      display: flex;
      gap: 4px;
    }
    
    .widget-control {
      background: none;
      border: none;
      color: #555;
      cursor: pointer;
      font-size: 12px;
      height: 20px;
      padding: 0;
      width: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
    }
    
    .widget.dark-mode .widget-control {
      color: #ccc;
    }
    
    .widget-control:hover {
      background-color: rgba(0, 0, 0, 0.1);
    }
    
    .widget.dark-mode .widget-control:hover {
      background-color: rgba(255, 255, 255, 0.1);
    }
    
    .widget-content {
      padding: 12px;
    }
  `]
})
export class WidgetBaseComponent implements OnInit, OnDestroy {
  // Propiedades de configuración
  @Input() title = 'Widget';
  @Input() collapsed = false;
  @Input() allowCollapse = true;
  @Input() allowClose = true;
  @Input() position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center' = 'top-right';
  @Input() darkMode = false;
  @Input() minWidth = 180;
  @Input() minHeight = 100;
  
  // Eventos
  @Output() positionChange = new EventEmitter<string>();
  @Output() collapsedChange = new EventEmitter<boolean>();
  @Output() closeRequest = new EventEmitter<void>();
  
  // Variables para manejo de arrastre
  private isDragging = false;
  private dragOffset = { x: 0, y: 0 };
  
  // Subject para gestionar suscripciones
  private destroy$ = new Subject<void>();
  
  // Contenedor del widget
  private widgetElement: HTMLElement | null = null;
  
  ngOnInit(): void {
    // Configuración inicial
    document.addEventListener('mousemove', this.onDragMove.bind(this));
    document.addEventListener('mouseup', this.onDragEnd.bind(this));
  }
  
  ngOnDestroy(): void {
    // Limpiar recursos
    this.destroy$.next();
    this.destroy$.complete();
    
    // Eliminar listeners
    document.removeEventListener('mousemove', this.onDragMove.bind(this));
    document.removeEventListener('mouseup', this.onDragEnd.bind(this));
  }
  
  /**
   * Alterna el estado de colapso
   */
  toggleCollapse(): void {
    this.collapsed = !this.collapsed;
    this.collapsedChange.emit(this.collapsed);
  }
  
  /**
   * Emite evento de cierre
   */
  close(): void {
    this.closeRequest.emit();
  }
  
  /**
   * Inicia el arrastre del widget
   */
  onDragStart(event: MouseEvent): void {
    if (event.target && (event.target as HTMLElement).classList.contains('widget-control')) {
      return; // No iniciar arrastre si se hizo clic en un control
    }
    
    this.isDragging = true;
    
    // Obtener el elemento del widget
    if (!this.widgetElement) {
      this.widgetElement = (event.currentTarget as HTMLElement).closest('.widget');
    }
    
    if (this.widgetElement) {
      const rect = this.widgetElement.getBoundingClientRect();
      this.dragOffset = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      };
    }
    
    // Prevenir selección de texto durante arrastre
    event.preventDefault();
  }
  
  /**
   * Actualiza la posición durante el arrastre
   */
  onDragMove(event: MouseEvent): void {
    if (!this.isDragging || !this.widgetElement) return;
    
    const x = event.clientX - this.dragOffset.x;
    const y = event.clientY - this.dragOffset.y;
    
    // Actualizar posición
    this.widgetElement.style.position = 'absolute';
    this.widgetElement.style.left = `${x}px`;
    this.widgetElement.style.top = `${y}px`;
    
    // Determinar la nueva posición relativa
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const widgetRect = this.widgetElement.getBoundingClientRect();
    
    // Determinar en qué cuadrante está el widget
    const isTop = widgetRect.top < viewportHeight / 2;
    const isLeft = widgetRect.left < viewportWidth / 2;
    
    let newPosition: string;
    if (isTop && isLeft) newPosition = 'top-left';
    else if (isTop && !isLeft) newPosition = 'top-right';
    else if (!isTop && isLeft) newPosition = 'bottom-left';
    else newPosition = 'bottom-right';
    
    // Si el widget está cerca del centro
    const centerThreshold = 100;
    const distanceToCenter = Math.sqrt(
      Math.pow((widgetRect.left + widgetRect.width / 2) - viewportWidth / 2, 2) +
      Math.pow((widgetRect.top + widgetRect.height / 2) - viewportHeight / 2, 2)
    );
    
    if (distanceToCenter < centerThreshold) {
      newPosition = 'center';
    }
    
    // Emitir cambio de posición si cambió
    if (newPosition !== this.position) {
      this.position = newPosition as any;
      this.positionChange.emit(this.position);
    }
  }
  
  /**
   * Finaliza el arrastre
   */
  onDragEnd(): void {
    this.isDragging = false;
  }
} 
