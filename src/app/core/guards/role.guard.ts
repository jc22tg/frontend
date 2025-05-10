import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { UserRole } from '../../shared/models/user.model';

export const roleGuard = (allowedRoles: UserRole[]) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated() && authService.hasAnyRole(allowedRoles)) {
    return true;
  }

  // Redireccionar a una página de acceso denegado o al dashboard
  return router.createUrlTree(['/dashboard']);
}; 