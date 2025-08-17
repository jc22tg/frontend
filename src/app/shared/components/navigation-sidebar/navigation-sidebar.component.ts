import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { UserRole } from '../../models/user.model';

@Component({
  selector: 'app-navigation-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatDividerModule,
    MatTooltipModule
  ],
  template: `
    <div class="navigation-container" [class.collapsed]="collapsed">
      <div class="nav-header">
        <div class="logo" [class.collapsed]="collapsed">
          <img src="assets/logo.svg" alt="Logo" />
          <span *ngIf="!collapsed" class="logo-text">Network Map</span>
        </div>
        <button class="collapse-toggle" mat-icon-button (click)="toggleCollapse()">
          <mat-icon>{{ collapsed ? 'chevron_right' : 'chevron_left' }}</mat-icon>
        </button>
      </div>
      
      <mat-divider></mat-divider>
      
      <div class="nav-links">
        <a 
          mat-list-item 
          routerLink="/dashboard" 
          routerLinkActive="active-link"
          [matTooltip]="collapsed ? 'Dashboard' : ''"
          [matTooltipPosition]="'right'"
        >
          <mat-icon>dashboard</mat-icon>
          <span *ngIf="!collapsed">Dashboard</span>
        </a>
        <a 
          mat-list-item 
          routerLink="/network-design" 
          routerLinkActive="active-link"
          [matTooltip]="collapsed ? 'Diseño de Red' : ''"
          [matTooltipPosition]="'right'"
        >
          <mat-icon>share</mat-icon>
          <span *ngIf="!collapsed">Diseño de Red</span>
        </a>
        <a 
          mat-list-item 
          routerLink="/projects" 
          routerLinkActive="active-link"
          [matTooltip]="collapsed ? 'Proyectos' : ''"
          [matTooltipPosition]="'right'"
          *ngIf="hasRole([UserRole.ADMIN, UserRole.OPERATOR])"
        >
          <mat-icon>work</mat-icon>
          <span *ngIf="!collapsed">Proyectos</span>
        </a>
        <a 
          mat-list-item 
          routerLink="/offline" 
          routerLinkActive="active-link"
          [matTooltip]="collapsed ? 'Modo Offline' : ''"
          [matTooltipPosition]="'right'"
        >
          <mat-icon>offline_bolt</mat-icon>
          <span *ngIf="!collapsed">Modo Offline</span>
        </a>
      </div>
      
      <div class="nav-footer">
        <mat-divider></mat-divider>
        <a 
          mat-list-item 
          routerLink="/settings" 
          routerLinkActive="active-link"
          [matTooltip]="collapsed ? 'Configuración' : ''"
          [matTooltipPosition]="'right'"
        >
          <mat-icon>settings</mat-icon>
          <span *ngIf="!collapsed">Configuración</span>
        </a>
        <a 
          mat-list-item 
          routerLink="/help" 
          routerLinkActive="active-link"
          [matTooltip]="collapsed ? 'Ayuda' : ''"
          [matTooltipPosition]="'right'"
        >
          <mat-icon>help</mat-icon>
          <span *ngIf="!collapsed">Ayuda</span>
        </a>
      </div>
    </div>
  `,
  styles: [`
    .navigation-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      width: 240px;
      transition: width 0.3s ease;
      background-color: #fff;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    
    .navigation-container.collapsed {
      width: 64px;
    }
    
    .nav-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px;
      height: 64px;
    }
    
    .logo {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .logo img {
      height: 32px;
      width: 32px;
      object-fit: contain;
      background-color: transparent;
      border-radius: 4px;
    }
    
    .logo-text {
      font-size: 18px;
      font-weight: 500;
    }
    
    .nav-links {
      flex: 1;
      overflow-y: auto;
      padding-top: 8px;
    }
    
    .nav-links a, .nav-footer a {
      display: flex;
      align-items: center;
      gap: 16px;
      height: 48px;
      padding: 0 16px;
      color: rgba(0, 0, 0, 0.87);
      text-decoration: none;
      transition: background-color 0.2s ease;
    }
    
    .nav-links a:hover, .nav-footer a:hover {
      background-color: rgba(0, 0, 0, 0.04);
    }
    
    .active-link {
      background-color: rgba(33, 150, 243, 0.1) !important;
      color: #2196f3 !important;
    }
    
    .active-link mat-icon {
      color: #2196f3;
    }
    
    .nav-footer {
      padding-bottom: 8px;
    }
  `]
})
export class NavigationSidebarComponent {
  @Input() collapsed = false;
  @Input() userRoles: UserRole[] = [];
  
  UserRole = UserRole;
  
  toggleCollapse() {
    this.collapsed = !this.collapsed;
  }
  
  hasRole(roles: UserRole[]): boolean {
    return roles.some(role => this.userRoles.includes(role));
  }
} 
