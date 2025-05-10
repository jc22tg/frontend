import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-network-metrics-widget',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule
  ],
  templateUrl: './network-metrics-widget.component.html',
  styleUrls: ['./network-metrics-widget.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NetworkMetricsWidgetComponent {
  @Input() elementStats: { total: number, active: number, warning: number, error: number } = { 
    total: 0, active: 0, warning: 0, error: 0 
  };
  @Input() connectionStats: { total: number, active: number, warning: number, error: number } = { 
    total: 0, active: 0, warning: 0, error: 0 
  };
  
  // Versión simplificada del componente para evitar errores
  constructor() {}
} 