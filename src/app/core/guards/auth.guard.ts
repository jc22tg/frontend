import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { firstValueFrom } from 'rxjs';

export const authGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  console.log('Auth guard activated for route:', state.url);

  try {
    // Verificamos si hay un token almacenado
    const token = authService.getToken();
    console.log('Token check in guard:', token ? 'exists' : 'not found');
    
    if (!token) {
      console.log('No token found, redirecting to login');
      return router.createUrlTree(['/auth/login'], {
        queryParams: { returnUrl: state.url }
      });
    }

    // Verificamos si el token es válido
    const isAuthenticated = authService.isAuthenticated();
    console.log('Auth status check result:', isAuthenticated);

    if (isAuthenticated) {
      console.log('User is authenticated, allowing navigation');
      return true;
    }

    console.log('Authentication failed, redirecting to login');
    return router.createUrlTree(['/auth/login'], {
      queryParams: { returnUrl: state.url }
    });
  } catch (error) {
    console.error('Error in auth guard:', error);
    return router.createUrlTree(['/auth/login']);
  }
}; 