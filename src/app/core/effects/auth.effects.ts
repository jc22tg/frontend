import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, map, switchMap, tap, finalize } from 'rxjs/operators';
import { AuthService, LoginResponse, RefreshTokenResponse } from '../services/auth.service';
import { AuthMapperService } from '../services/auth-mapper.service';
import * as AuthActions from '../store/actions/auth.actions';
import { User } from '../../features/auth/types/auth.types';

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
          map((response: LoginResponse) => {
            console.log('Login response in effect:', response);
            if (!response || !response.user || !response.token || !response.refreshToken || !response.expiresIn) {
              throw new Error('Respuesta de login inválida del servidor');
            }
            
            const userForStore: User = {
              id: String(response.user.id),
              email: response.user.email,
              username: response.user.username,
              firstName: response.user.firstName,
              lastName: response.user.lastName,
              role: response.user.role,
              isActive: response.user.isActive !== undefined ? response.user.isActive : true,
              createdAt: response.user.createdAt ? new Date(response.user.createdAt) : new Date(),
              updatedAt: response.user.updatedAt ? new Date(response.user.updatedAt) : new Date()
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
            const errorMessage = error.error?.message || error.message || 'Error desconocido al iniciar sesión';
            return of(
              AuthActions.loginFailure({ error: errorMessage })
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
            localStorage.removeItem(this.TOKEN_KEY);
            localStorage.removeItem(this.REFRESH_TOKEN_KEY);
            localStorage.removeItem(this.USER_KEY);
            this.router.navigate(['/auth/login']);
          } catch (error) {
            console.error('Error during logout:', error);
            this.router.navigate(['/auth/login']);
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
          map((response: RefreshTokenResponse) => {
            console.log('Refresh token successful:', response);
            if (!response || !response.token || !response.refreshToken || !response.expiresIn) {
              throw new Error('Respuesta de refresh token inválida del servidor');
            }
            return AuthActions.refreshTokenSuccess({
              token: response.token,
              refreshToken: response.refreshToken,
              expiresIn: response.expiresIn,
            });
          }),
          catchError((error) => {
            console.error('Token refresh error:', error);
            const errorMessage = error.error?.message || error.message || 'Error al actualizar el token';
            return of(
              AuthActions.refreshTokenFailure({ error: errorMessage })
            );
          })
        );
      })
    );
  });
} 
