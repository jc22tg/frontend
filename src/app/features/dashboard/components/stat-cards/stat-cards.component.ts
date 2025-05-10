import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Observable } from 'rxjs';
import { StatCard } from '../../models/dashboard.models';
import { DashboardFacade } from '../../facades/dashboard.facade';

@Component({
  selector: 'app-stat-cards',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatProgressBarModule,
    MatTooltipModule
  ],
  template: `
    <div class="stats-grid">
      <div class="stat-card" *ngFor="let stat of stats">
        <div class="stat-icon" [style.color]="stat.color || '#1976d2'">
          <mat-icon>{{stat.icon || 'trending_up'}}</mat-icon>
        </div>
        <div class="stat-content">
          <h3>{{stat.title}}</h3>
          <p class="stat-value">{{stat.value}}</p>
          <div class="stat-trend" *ngIf="stat.trend !== undefined" 
               [ngClass]="{'positive': stat.trend > 0, 'neutral': stat.trend === 0, 'negative': stat.trend < 0}"
               [matTooltip]="getTrendTooltip(stat)">
            <mat-icon class="trend-icon">
              {{stat.trend > 0 ? 'trending_up' : (stat.trend < 0 ? 'trending_down' : 'trending_flat')}}
            </mat-icon>
            <span>{{getFormattedTrend(stat.trend)}}</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    
    .stat-card {
      display: flex;
      padding: 16px;
      background-color: #fff;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      transition: all 0.3s ease;
    }
    
    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0,0,0,0.15);
    }
    
    .stat-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2rem;
      margin-right: 16px;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background-color: rgba(25, 118, 210, 0.1);
    }
    
    .stat-icon mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
    }
    
    .stat-content {
      flex: 1;
    }
    
    .stat-content h3 {
      margin: 0;
      font-size: 14px;
      color: #666;
      font-weight: 500;
    }
    
    .stat-value {
      font-size: 24px;
      font-weight: 600;
      margin: 4px 0;
    }
    
    .stat-trend {
      display: flex;
      align-items: center;
      font-size: 12px;
      line-height: 12px;
    }
    
    .trend-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
      margin-right: 4px;
    }
    
    .positive {
      color: #4caf50;
    }
    
    .negative {
      color: #f44336;
    }
    
    .neutral {
      color: #757575;
    }
    
    @media (max-width: 768px) {
      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
    
    @media (max-width: 480px) {
      .stats-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class StatCardsComponent implements OnInit {
  @Input() stats: StatCard[] = [];
  
  constructor(private dashboardFacade: DashboardFacade) {}
  
  ngOnInit(): void {
    // Si no se reciben stats a través de @Input, usar las del facade
    if (!this.stats || this.stats.length === 0) {
      this.dashboardFacade.stats$.subscribe(stats => {
        if (stats && stats.length > 0) {
          this.stats = stats;
        }
      });
    }
  }
  
  getFormattedTrend(trend: number): string {
    if (trend === 0) return '0%';
    const sign = trend > 0 ? '+' : '';
    return `${sign}${trend}%`;
  }
  
  getTrendTooltip(stat: StatCard): string {
    if (stat.trend === undefined) return '';
    if (stat.trend === 0) return 'Sin cambios';
    
    const direction = stat.trend > 0 ? 'aumentó' : 'disminuyó';
    return `${stat.title} ${direction} un ${Math.abs(stat.trend)}% en el último período`;
  }
} 