import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subscription } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { NavigationSidebarComponent } from '../../../shared/components/navigation-sidebar/navigation-sidebar.component';
import { AuthService } from '../../services/auth.service';
import { UserRole } from '../../../shared/models/user.model';
import { HelpService } from '../../services/help/help.service';

// Mapa de rutas a títulos
const ROUTE_TITLE_MAP: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/network-design': 'Diseño de Red',
  '/projects': 'Proyectos',
  '/offline': 'Modo Offline',
  '/settings': 'Configuración',
  '/profile': 'Mi Perfil',
  '/help': 'Ayuda'
};

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatIconModule,
    MatMenuModule,
    MatButtonModule,
    MatSidenavModule,
    MatBadgeModule,
    MatDividerModule,
    MatTooltipModule,
    NavigationSidebarComponent
  ],
  template: `
    <div class="layout-container">
      <app-navigation-sidebar [collapsed]="navCollapsed" [userRoles]="userRoles"></app-navigation-sidebar>
      
      <div class="content-container" [class.nav-collapsed]="navCollapsed">
        <mat-toolbar class="top-toolbar">
          <div class="toolbar-left">
            <button mat-icon-button (click)="toggleSidebar()">
              <mat-icon>menu</mat-icon>
            </button>
            <h1 class="page-title">{{ pageTitle }}</h1>
          </div>
          
          <div class="toolbar-actions">
            <button mat-icon-button (click)="showKeyboardShortcuts()" matTooltip="Atajos de teclado">
              <mat-icon>keyboard</mat-icon>
            </button>
            
            <button mat-icon-button [matMenuTriggerFor]="notificationsMenu">
              <mat-icon [matBadge]="notificationCount" matBadgeColor="warn" [matBadgeHidden]="notificationCount === 0" aria-hidden="false">
                notifications
              </mat-icon>
            </button>
            <mat-menu #notificationsMenu="matMenu" class="notifications-menu">
              <div class="notification-header">
                <h3>Notificaciones</h3>
                <button mat-button color="primary" (click)="markAllAsRead()">Marcar todas como leídas</button>
              </div>
              <mat-divider></mat-divider>
              <div class="empty-notifications" *ngIf="notificationCount === 0">
                <mat-icon>notifications_none</mat-icon>
                <p>No hay notificaciones nuevas</p>
              </div>
              <!-- Aquí irían las notificaciones dinámicas -->
            </mat-menu>
            
            <button mat-button [matMenuTriggerFor]="userMenu" class="user-menu-button">
              <div class="user-avatar">
                <mat-icon *ngIf="!userAvatar">account_circle</mat-icon>
                <img *ngIf="userAvatar" [src]="userAvatar" alt="Avatar">
              </div>
              <span class="username">{{ userName }}</span>
              <mat-icon>arrow_drop_down</mat-icon>
            </button>
            <mat-menu #userMenu="matMenu">
              <button mat-menu-item routerLink="/profile">
                <mat-icon>person</mat-icon>
                <span>Mi Perfil</span>
              </button>
              <button mat-menu-item routerLink="/settings">
                <mat-icon>settings</mat-icon>
                <span>Configuración</span>
              </button>
              <mat-divider></mat-divider>
              <button mat-menu-item (click)="logout()">
                <mat-icon>exit_to_app</mat-icon>
                <span>Cerrar Sesión</span>
              </button>
            </mat-menu>
          </div>
        </mat-toolbar>
        
        <div class="main-content">
          <ng-content></ng-content>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .layout-container {
      display: flex;
      height: 100vh;
      width: 100vw;
      overflow: hidden;
    }
    
    .content-container {
      flex: 1;
      display: flex;
      flex-direction: column;
      width: calc(100% - 240px);
      transition: width 0.3s ease;
    }
    
    .content-container.nav-collapsed {
      width: calc(100% - 64px);
    }
    
    .top-toolbar {
      display: flex;
      justify-content: space-between;
      background-color: #ffffff;
      color: rgba(0, 0, 0, 0.87);
      border-bottom: 1px solid #e0e0e0;
      padding: 0 16px;
    }
    
    .toolbar-left {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    
    .page-title {
      font-size: 20px;
      font-weight: 500;
      margin: 0;
    }
    
    .toolbar-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .user-menu-button {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .user-avatar {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background-color: #f0f0f0;
      overflow: hidden;
    }
    
    .user-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    .username {
      max-width: 150px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    
    .main-content {
      flex: 1;
      overflow: auto;
      padding: 16px;
      background-color: #f5f5f5;
    }
    
    .notifications-menu {
      min-width: 320px;
    }
    
    .notification-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
    }
    
    .notification-header h3 {
      margin: 0;
      font-weight: 500;
    }
    
    .empty-notifications {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 24px;
      color: #757575;
    }
    
    .empty-notifications mat-icon {
      font-size: 48px;
      height: 48px;
      width: 48px;
      margin-bottom: 8px;
    }
  `]
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  navCollapsed = false;
  pageTitle = 'Dashboard';
  notificationCount = 0;
  userName = 'Usuario';
  userAvatar: string | null = null;
  userRoles: UserRole[] = [];
  
  private subscriptions = new Subscription();
  
  constructor(
    private authService: AuthService,
    private router: Router,
    private helpService: HelpService
  ) {}
  
  ngOnInit() {
    // Obtener datos del usuario autenticado
    this.loadUserData();
    
    // Suscribirse a eventos de navegación para actualizar el título
    this.subscriptions.add(
      this.router.events.pipe(
        filter(event => event instanceof NavigationEnd),
        map((event: NavigationEnd) => {
          // Determinar el título basado en la ruta actual
          const baseRoute = '/' + event.urlAfterRedirects.split('/')[1];
          return ROUTE_TITLE_MAP[baseRoute] || 'Network Map';
        })
      ).subscribe(title => {
        this.pageTitle = title;
      })
    );
  }
  
  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
  
  toggleSidebar() {
    this.navCollapsed = !this.navCollapsed;
  }
  
  logout() {
    this.authService.logout();
  }
  
  markAllAsRead() {
    this.notificationCount = 0;
    // Aquí implementarías la lógica para marcar las notificaciones como leídas
  }
  
  private loadUserData() {
    // Obtener información del usuario desde el servicio de autenticación
    const user = this.authService.getCurrentUser();
    if (user) {
      this.userName = `${user.firstName} ${user.lastName}`;
      this.userAvatar = null; // Asumimos que no hay avatar en el modelo
      this.userRoles = [user.role]; // Convertimos el único rol en un array
    }
  }
  
  /**
   * Muestra el diálogo de atajos de teclado
   */
  showKeyboardShortcuts(): void {
    this.helpService.showKeyboardShortcutsHelp();
  }
} 