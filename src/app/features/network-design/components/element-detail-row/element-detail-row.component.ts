import { Component, Input, HostBinding, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';

// Importamos las animaciones compartidas en lugar de definir una local
import { fadeAnimation } from '../../animations';
import { ElementType, NetworkConnection } from '../../../../shared/types/network.types';

/**
 * Componente que muestra una fila de detalle con etiqueta y valor
 * 
 * Este componente se utiliza en distintas vistas de detalles de elementos
 * para mostrar una etiqueta y su valor correspondiente de manera consistente.
 * Soporta tooltips, estilos personalizados y estados para valores vacíos.
 */
@Component({
  selector: 'app-element-detail-row',
  template: `
    <div class="detail-row" [class.important]="isImportant" [@fadeAnimation]>
      <span class="label" [matTooltip]="tooltip || label">{{ label }}:</span>
      <span 
        class="value" 
        [ngClass]="valueClass"
        [matTooltip]="valueTooltip || value?.toString() || ''"
        [class.truncate]="truncate">
        <ng-container *ngIf="value !== undefined && value !== null; else emptyValue">
          {{ value }}
        </ng-container>
        <ng-template #emptyValue>
          <span class="empty-value">{{ emptyText }}</span>
        </ng-template>
      </span>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    .detail-row {
      display: flex;
      margin-bottom: var(--spacing-sm, 8px);
      line-height: 24px;
      padding: 2px 0;
      transition: background-color var(--transition-fast, 150ms ease-in-out);
      border-radius: var(--border-radius-sm, 2px);
    }

    .detail-row:hover {
      background-color: var(--hover-bg-color, rgba(0, 0, 0, 0.02));
    }

    .label {
      flex: 0 0 150px;
      color: var(--text-color-secondary, rgba(0, 0, 0, 0.7));
      font-weight: 500;
      user-select: none;
      font-size: var(--font-size-sm, 14px);
    }

    .value {
      flex: 1;
      color: var(--text-color, #212121);
      font-weight: 400;
      font-size: var(--font-size-sm, 14px);
    }

    .truncate {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 200px;
    }

    .empty-value {
      font-style: italic;
      color: var(--text-color-tertiary, rgba(0, 0, 0, 0.5));
    }

    .important .label {
      font-weight: 600;
      color: var(--primary-color, #3F51B5);
    }

    .important .value {
      font-weight: 500;
    }

    /* Soporte para tema oscuro */
    :host-context(.dark-theme) {
      .detail-row:hover {
        background-color: var(--dark-hover-bg-color, rgba(255, 255, 255, 0.05));
      }

      .label {
        color: var(--dark-text-secondary, rgba(255, 255, 255, 0.7));
      }

      .value {
        color: var(--dark-text-primary, #ffffff);
      }

      .empty-value {
        color: var(--dark-text-tertiary, rgba(255, 255, 255, 0.3));
      }

      .important .label {
        color: var(--primary-color, #3F51B5);
      }
    }
  `],
  standalone: true,
  imports: [CommonModule, MatTooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [fadeAnimation]
})
export class ElementDetailRowComponent {
  /** Etiqueta descriptiva del detalle */
  @Input() label!: string;
  
  /** Valor a mostrar */
  @Input() value?: string | number;
  
  /** Clase CSS opcional para aplicar al valor */
  @Input() valueClass?: string;
  
  /** Tooltip para la etiqueta */
  @Input() tooltip?: string;
  
  /** Tooltip para el valor */
  @Input() valueTooltip?: string;
  
  /** Indica si es un detalle importante (destacado visualmente) */
  @Input() isImportant = false;
  
  /** Indica si debe truncarse el valor cuando es demasiado largo */
  @Input() truncate = false;
  
  /** Texto a mostrar cuando el valor es vacío */
  @Input() emptyText = 'No disponible';
  
  /** Indica si la fila debe tener animación */
  @HostBinding('class.animated-row') animatedRow = true;

  /** Conexión de red para la fila de detalle */
  @Input() connection?: NetworkConnection;

  /** Tipo de elemento al que pertenece la conexión */
  @Input() elementType?: ElementType;
} 