import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService as CoreAuthService } from '../../../core/services/auth.service';

/**
 * Servicio de autenticación específico para el módulo de Auth
 * Actúa como un proxy hacia el servicio principal
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(private coreAuthService: CoreAuthService) {}

  login(email: string, password: string): Observable<any> {
    return this.coreAuthService.login(email, password);
  }

  logout(): void {
    this.coreAuthService.logout();
  }

  refreshToken(): Observable<any> {
    return this.coreAuthService.refreshToken();
  }

  isAuthenticated(): boolean {
    return this.coreAuthService.isAuthenticated();
  }

  getCurrentUser(): any {
    return this.coreAuthService.getCurrentUser();
  }
} 