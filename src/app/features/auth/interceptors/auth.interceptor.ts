import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError, Observable, BehaviorSubject, filter, take } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';

// BehaviorSubject para rastrear cuando se está refrescando el token
const isRefreshing = new BehaviorSubject<boolean>(false);
// Almacena solicitudes pendientes durante el refresco del token
let refreshTokenPromise: Observable<any> | null = null;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  // Excluir rutas de autenticación del proceso de intercepción de token
  if (req.url.includes('/auth/login') || req.url.includes('/auth/refresh')) {
    return next(req);
  }
  
  const token = authService.getToken();
  
  if (token) {
    req = addToken(req, token);
  }

  return next(req).pipe(
    catchError((error) => {
      // Solo manejar errores 401 (No autorizado)
      if (error.status === 401) {
        return handleUnauthorizedError(req, next, authService, router);
      }
      return throwError(() => error);
    })
  );
};

function addToken(req: any, token: string) {
  return req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });
}

function handleUnauthorizedError(req: any, next: any, authService: AuthService, router: Router) {
  // Si no estamos refrescando ya, iniciar el proceso
  if (!isRefreshing.value) {
    isRefreshing.next(true);
    
    // Almacenar la promesa de refresco para reutilizarla en solicitudes concurrentes
    refreshTokenPromise = authService.refreshToken().pipe(
      switchMap(response => {
        isRefreshing.next(false);
        refreshTokenPromise = null;
        return next(addToken(req, response.token));
      }),
      catchError(error => {
        isRefreshing.next(false);
        refreshTokenPromise = null;
        authService.logout();
        router.navigate(['/auth/login']);
        return throwError(() => error);
      })
    );
    
    return refreshTokenPromise;
  } else {
    // Si ya estamos refrescando, esperar hasta que termine y luego reintentar
    if (refreshTokenPromise) {
      return isRefreshing.pipe(
        filter(isRefreshing => !isRefreshing),
        take(1),
        switchMap(() => {
          const newToken = authService.getToken();
          if (newToken) {
            return next(addToken(req, newToken));
          } else {
            // Si después de refrescar no hay token, ir a login
            router.navigate(['/auth/login']);
            return throwError(() => new Error('No se pudo obtener un nuevo token'));
          }
        })
      );
    } else {
      // Si no hay promesa de refresco (caso raro), ir a login
      authService.logout();
      router.navigate(['/auth/login']);
      return throwError(() => new Error('Error en el proceso de refresco del token'));
    }
  }
} 