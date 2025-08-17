import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '@core/services/auth.service';

export const authGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true; // Usuario autenticado, permite el acceso
  } else {
    // Usuario no autenticado, redirige a login y guarda la URL intentada
    router.navigate(['/auth/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }
}; 
