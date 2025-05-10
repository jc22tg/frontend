import { Component, OnInit } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { AuthService } from '@core/services/auth.service';
import { MainLayoutComponent } from './main-layout/main-layout.component';

@Component({
  selector: 'app-initializer',
  standalone: true,
  imports: [CommonModule, RouterOutlet, MatProgressSpinner, MainLayoutComponent],
  template: `
    <ng-container *ngIf="initialized">
      <app-main-layout *ngIf="isAuthenticated && !isAuthRoute">
        <router-outlet></router-outlet>
      </app-main-layout>
      <router-outlet *ngIf="!isAuthenticated || isAuthRoute"></router-outlet>
    </ng-container>
    <div *ngIf="!initialized" class="loading-screen">
      <mat-spinner diameter="48"></mat-spinner>
    </div>
  `,
  styles: [`
    .loading-screen {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      width: 100vw;
      background-color: #fafafa;
      position: fixed;
      top: 0;
      left: 0;
      z-index: 9999;
    }
  `]
})
export class AppInitializerComponent implements OnInit {
  initialized = false;
  isAuthenticated = false;
  isAuthRoute = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    // Verificamos si hay un token válido
    this.isAuthenticated = this.authService.isAuthenticated();
    this.isAuthRoute = this.router.url.startsWith('/auth/');
    console.log('Auth status checked:', this.isAuthenticated);
    
    // Si hay una sesión válida
    if (this.isAuthenticated) {
      // Si estamos en la página de login, redirigimos al dashboard
      if (this.router.url === '/auth/login') {
        this.router.navigate(['/dashboard']);
      }
      // Si estamos en otra ruta de auth, redirigimos al dashboard
      else if (this.isAuthRoute) {
        this.router.navigate(['/dashboard']);
      }
    } 
    // Si no hay sesión válida
    else {
      // Si no estamos en una ruta de auth, redirigimos al login
      if (!this.isAuthRoute) {
        this.router.navigate(['/auth/login']);
      }
    }
    
    // Marcamos como inicializado después de todas las verificaciones
    this.initialized = true;
  }
} 