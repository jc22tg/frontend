import { HttpErrorResponse, HttpEvent, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service'; // Corregida la ruta para resolver la dependencia circular

// Variable para evitar bucles de refresh token
let isRefreshing = false;

function addToken(request: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return request.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });
}

function handle401Error(
  request: HttpRequest<unknown>,
  next: HttpHandlerFn,
  authService: AuthService,
  router: Router
): Observable<HttpEvent<unknown>> {
  const refreshToken = localStorage.getItem('refreshToken');

  if (!refreshToken || isRefreshing) {
    if (!isRefreshing) { // Solo ejecutar logout y navigate si no se está ya en proceso de refresh
      isRefreshing = true; // Prevenir múltiples llamadas a logout
      authService.logout();
      router.navigate(['/auth/login']);
      isRefreshing = false;
    }
    return throwError(() => new Error('Sesión expirada o refresh en curso'));
  }

  isRefreshing = true;

  return authService.refreshToken().pipe(
    switchMap((data) => {
      isRefreshing = false;
      localStorage.setItem('token', data.token);
      localStorage.setItem('refreshToken', data.refreshToken);
      return next(addToken(request, data.token));
    }),
    catchError((error) => {
      isRefreshing = false;
      authService.logout();
      router.navigate(['/auth/login']);
      return throwError(() => error);
    })
  );
}

export function authInterceptorFn(req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = localStorage.getItem('token');

  let authReq = req;
  if (token) {
    authReq = addToken(req, token);
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        return handle401Error(authReq, next, authService, router);
      }
      return throwError(() => error);
    })
  );
} 
