import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-quick-nav-menu',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    RouterModule
  ],
  template: `
    <div class="quick-nav-panel" [class.compact]="isCompact">
      <button mat-button color="primary" routerLink="/network-design" matTooltip="Diseño de Red">
        <mat-icon>device_hub</mat-icon>
        <span *ngIf="!isCompact">Diseño de Red</span>
      </button>
      <button mat-button color="primary" routerLink="/network-monitoring" matTooltip="Monitoreo">
        <mat-icon>monitor_heart</mat-icon>
        <span *ngIf="!isCompact">Monitoreo</span>
      </button>
      <button mat-button color="primary" routerLink="/reports" matTooltip="Reportes">
        <mat-icon>assessment</mat-icon>
        <span *ngIf="!isCompact">Reportes</span>
      </button>
      <button mat-button color="primary" routerLink="/settings" matTooltip="Configuración">
        <mat-icon>settings</mat-icon>
        <span *ngIf="!isCompact">Configuración</span>
      </button>
    </div>
  `,
  styles: [`
    .quick-nav-panel {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-bottom: 20px;
      padding: 10px;
      background-color: #f5f5f5;
      border-radius: 4px;
    }

    .quick-nav-panel.compact {
      flex-direction: column;
      width: fit-content;
    }

    .quick-nav-panel button {
      display: flex;
      align-items: center;
      gap: 5px;
    }

    .quick-nav-panel.compact button {
      min-width: auto;
      padding: 8px;
      border-radius: 50%;
      aspect-ratio: 1/1;
      justify-content: center;
    }

    @media (max-width: 600px) {
      .quick-nav-panel:not(.compact) {
        flex-direction: column;
      }
    }
  `]
})
export class QuickNavMenuComponent {
  @Input() isCompact = false;
} 
