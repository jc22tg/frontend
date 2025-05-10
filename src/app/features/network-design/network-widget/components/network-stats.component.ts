import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-network-stats',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatTooltipModule],
  template: `
    <div class="header-stats">
      <span class="elements-count" matTooltip="Total de elementos">
        <mat-icon>device_hub</mat-icon>
        <span class="count">{{ elementsCount }}</span>
      </span>
      <span class="connections-count" matTooltip="Conexiones activas">
        <mat-icon>link</mat-icon>
        <span class="count">{{ connectionsCount }}</span>
      </span>
      <span class="status-count" matTooltip="Elementos con problemas">
        <mat-icon>warning</mat-icon>
        <span class="count">{{ warningCount }}</span>
      </span>
    </div>
  `,
  styles: [`
    .header-stats {
      display: flex;
      gap: var(--spacing-md);
    }

    .elements-count,
    .connections-count,
    .status-count {
      display: flex;
      align-items: center;
      gap: var(--spacing-xs);
      font-size: 14px;
      color: var(--text-color);

      .count {
        font-weight: 500;
      }
    }
  `]
})
export class NetworkStatsComponent {
  @Input() elementsCount = 0;
  @Input() connectionsCount = 0;
  @Input() warningCount = 0;
} 