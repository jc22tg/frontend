import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import * as AuthActions from '../actions/auth.actions';

// Servicios inyectados como constantes
const actions$ = inject(Actions);
const authService = inject(AuthService);
const router = inject(Router);

// Efecto para el inicio de sesión
export const login = createEffect(() => 
  actions$.pipe(
    ofType(AuthActions.login),
    switchMap(action => 
      authService.login(action.username, action.password).pipe(
        map(response => AuthActions.loginSuccess({
          user: response.user,
          token: response.token,
          expiresAt: response.expiresAt
        })),
        catchError(error => of(AuthActions.loginFailure({ error: error.message || 'Unknown error' })))
      )
    )
  )
);

// Efecto para cuando el inicio de sesión es exitoso
export const loginSuccess = createEffect(() => 
  actions$.pipe(
    ofType(AuthActions.loginSuccess),
    tap(action => {
      localStorage.setItem('token', action.token);
      localStorage.setItem('user', JSON.stringify(action.user));
      router.navigate(['/dashboard']);
    })
  ),
  { dispatch: false }
);

// Efecto para cerrar sesión
export const logout = createEffect(() => 
  actions$.pipe(
    ofType(AuthActions.logout),
    switchMap(() => 
      authService.logout().pipe(
        map(() => AuthActions.logoutSuccess()),
        catchError(error => of(AuthActions.logoutFailure({ error: error.message || 'Unknown error' })))
      )
    )
  )
);

// Efecto para cuando cerrar sesión es exitoso
export const logoutSuccess = createEffect(() => 
  actions$.pipe(
    ofType(AuthActions.logoutSuccess),
    tap(() => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      router.navigate(['/auth/login']);
    })
  ),
  { dispatch: false }
);

// Efecto para actualizar el token
export const refreshToken = createEffect(() => 
  actions$.pipe(
    ofType(AuthActions.refreshToken),
    switchMap(() => 
      authService.refreshToken().pipe(
        map(response => AuthActions.refreshTokenSuccess({
          token: response.token,
          expiresAt: response.expiresAt
        })),
        catchError(error => of(AuthActions.refreshTokenFailure({ error: error.message || 'Unknown error' })))
      )
    )
  )
); 