import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, map, switchMap, tap, finalize, delay } from 'rxjs/operators';
import { AuthService } from '@core/services/auth.service';
import { AuthMapperService } from '@core/services/auth-mapper.service';
import * as AuthActions from '@core/store/actions/auth.actions';
import { User } from '../../features/auth/types/auth.types';
import { UserRole } from '../../shared/models/user.model';

@Injectable()
export class AuthEffects {
  private actions$ = inject(Actions);
  private authService = inject(AuthService);
  private authMapperService = inject(AuthMapperService);
  private router = inject(Router);

  // Constantes para las claves del localStorage (deben coincidir con AuthService)
  private readonly TOKEN_KEY = 'token';
  private readonly REFRESH_TOKEN_KEY = 'refreshToken';
  private readonly USER_KEY = 'user';

  // Efecto para el inicio de sesión
  login$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AuthActions.login),
      switchMap((action) => {
        console.log('Login effect triggered:', action);
        return this.authService.login(action.email, action.password).pipe(
          map((response) => {
            console.log('Login response in effect:', response);
            if (!response || !response.user || !response.token || !response.refreshToken || !response.expiresIn) {
              throw new Error('Respuesta de login inválida');
            }
            
            // Asegurar que el usuario que viene de la respuesta sea compatible con User de auth.types
            const userForStore: User = {
              id: String(response.user.id),
              email: response.user.email,
              username: response.user.username,
              firstName: response.user.firstName,
              lastName: response.user.lastName,
              role: response.user.role,
              isActive: response.user.isActive || true,
              createdAt: new Date(response.user.createdAt || new Date()),
              updatedAt: new Date(response.user.updatedAt || new Date())
            };
            
            return AuthActions.loginSuccess({
              user: userForStore,
              token: response.token,
              refreshToken: response.refreshToken,
              expiresIn: response.expiresIn,
            });
          }),
          catchError((error) => {
            console.error('Login error in effect:', error);
            return of(
              AuthActions.loginFailure({
                error: error.message || 'Error al iniciar sesión',
              })
            );
          }),
          finalize(() => {
            console.log('Login effect completed');
          })
        );
      })
    );
  });

  // Efecto para cuando el inicio de sesión es exitoso
  loginSuccess$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(AuthActions.loginSuccess),
        tap((action) => {
          try {
            console.log('Login success action:', action);
            // Guardar los nuevos datos de autenticación
            localStorage.setItem(this.TOKEN_KEY, action.token);
            localStorage.setItem(this.REFRESH_TOKEN_KEY, action.refreshToken);
            localStorage.setItem(this.USER_KEY, JSON.stringify(action.user));
            console.log('Redirecting to dashboard...');
            this.router.navigate(['/dashboard']);
          } catch (error) {
            console.error('Error after login success:', error);
            this.router.navigate(['/auth/login']);
          }
        })
      );
    },
    { dispatch: false }
  );

  // Efecto para cuando el inicio de sesión falla
  loginFailure$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(AuthActions.loginFailure),
        tap((action) => {
          console.error('Login failed:', action.error);
          // Limpiar cualquier dato de autenticación residual
          localStorage.removeItem(this.TOKEN_KEY);
          localStorage.removeItem(this.REFRESH_TOKEN_KEY);
          localStorage.removeItem(this.USER_KEY);
        })
      );
    },
    { dispatch: false }
  );

  // Efecto para cerrar sesión
  logout$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(AuthActions.logout),
        tap(() => {
          try {
            // Limpiar todos los datos de autenticación
            localStorage.removeItem(this.TOKEN_KEY);
            localStorage.removeItem(this.REFRESH_TOKEN_KEY);
            localStorage.removeItem(this.USER_KEY);
            // Redirigir al login
            this.router.navigate(['/auth/login']);
          } catch (error) {
            console.error('Error during logout:', error);
          }
        })
      );
    },
    { dispatch: false }
  );

  // Efecto para actualizar el token
  refreshToken$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AuthActions.refreshToken),
      switchMap(() => {
        console.log('Refresh token effect triggered');
        return this.authService.refreshToken().pipe(
          map((response) => {
            console.log('Refresh token successful:', response);
            return AuthActions.refreshTokenSuccess({
              token: response.token,
              refreshToken: response.refreshToken,
              expiresIn: response.expiresIn,
            });
          }),
          catchError((error) => {
            console.error('Token refresh error:', error);
            return of(
              AuthActions.refreshTokenFailure({
                error: error.message || 'Error al actualizar el token',
              })
            );
          })
        );
      })
    );
  });
} 