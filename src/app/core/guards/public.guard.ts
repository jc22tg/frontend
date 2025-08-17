import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const publicGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    // Usuario autenticado intentando acceder a una ruta pública (ej. login), redirige al dashboard
    router.navigate(['/dashboard']); // O la ruta principal post-login
    return false;
  } else {
    // Usuario no autenticado, permite el acceso
    return true;
  }
}; 
