import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';

/**
 * Componente compartido para visualización uniforme de errores
 * Utilizado en todos los widgets y componentes que necesiten mostrar errores
 */
@Component({
  selector: 'app-error-display',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule
  ],
  template: `
    <div class="error-container" [ngClass]="severity">
      <mat-icon>{{ getIcon() }}</mat-icon>
      <div class="error-content">
        <div class="error-title" *ngIf="title">{{ title }}</div>
        <div class="error-message">{{ message }}</div>
        <div class="error-details" *ngIf="details && showDetails">{{ details }}</div>
        <div class="error-actions">
          <button *ngIf="retryVisible" mat-button color="primary" (click)="onRetry()">
            <mat-icon>refresh</mat-icon> {{ retryLabel }}
          </button>
          <button *ngIf="closeVisible" mat-button (click)="onClose()">
            <mat-icon>close</mat-icon> {{ closeLabel }}
          </button>
          <button *ngIf="details" mat-button (click)="toggleDetails()">
            <mat-icon>{{ showDetails ? 'keyboard_arrow_up' : 'keyboard_arrow_down' }}</mat-icon>
            {{ showDetails ? 'Ocultar detalles' : 'Mostrar detalles' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .error-container {
      display: flex;
      padding: 16px;
      margin: 8px 0;
      border-radius: 4px;
      align-items: flex-start;
    }
    
    .error-container.critical {
      background-color: #ffebee;
      border-left: 4px solid #f44336;
    }
    
    .error-container.warning {
      background-color: #fff8e1;
      border-left: 4px solid #ffc107;
    }
    
    .error-container.info {
      background-color: #e3f2fd;
      border-left: 4px solid #2196f3;
    }
    
    .error-container mat-icon {
      margin-right: 16px;
    }
    
    .error-container.critical mat-icon {
      color: #f44336;
    }
    
    .error-container.warning mat-icon {
      color: #ffc107;
    }
    
    .error-container.info mat-icon {
      color: #2196f3;
    }
    
    .error-content {
      flex-grow: 1;
    }
    
    .error-title {
      font-weight: 500;
      font-size: 16px;
      margin-bottom: 4px;
    }
    
    .error-message {
      margin-bottom: 8px;
    }
    
    .error-details {
      background-color: rgba(0, 0, 0, 0.03);
      padding: 8px;
      border-radius: 4px;
      margin-bottom: 8px;
      font-family: monospace;
      white-space: pre-wrap;
      font-size: 12px;
      max-height: 200px;
      overflow-y: auto;
    }
    
    .error-actions {
      display: flex;
      gap: 8px;
      margin-top: 8px;
    }
  `]
})
export class ErrorDisplayComponent {
  @Input() severity: 'critical' | 'warning' | 'info' = 'critical';
  @Input() title = '';
  @Input() message = 'Ha ocurrido un error';
  @Input() details = '';
  @Input() code = '';
  @Input() retryVisible = true;
  @Input() closeVisible = true;
  @Input() retryLabel = 'Reintentar';
  @Input() closeLabel = 'Cerrar';
  
  @Output() retry = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();
  
  showDetails = false;
  
  /**
   * Determina el icono según la severidad
   */
  getIcon(): string {
    switch (this.severity) {
      case 'critical':
        return 'error_outline';
      case 'warning':
        return 'warning_amber';
      case 'info':
        return 'info';
      default:
        return 'error_outline';
    }
  }
  
  /**
   * Emite evento de reintento
   */
  onRetry(): void {
    this.retry.emit();
  }
  
  /**
   * Emite evento de cierre
   */
  onClose(): void {
    this.close.emit();
  }
  
  /**
   * Muestra/oculta los detalles del error
   */
  toggleDetails(): void {
    this.showDetails = !this.showDetails;
  }
} 