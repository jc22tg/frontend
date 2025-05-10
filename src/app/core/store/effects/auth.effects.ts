import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, map, switchMap, tap, finalize, delay } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import * as AuthActions from '../actions/auth.actions';

@Injectable()
export class AuthEffects {
  private actions$ = inject(Actions);
  private authService = inject(AuthService);
  private router = inject(Router);

  // Constantes para las claves del localStorage (deben coincidir con AuthService)
  private readonly TOKEN_KEY = 'auth_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly USER_KEY = 'auth_user';
  private readonly EXPIRES_IN_KEY = 'expires_in';

  // Efecto para el inicio de sesión
  login$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AuthActions.login),
      switchMap((action) =>
        this.authService.login(action.email, action.password).pipe(
          map((response) => {
            console.log('Login response in effect:', response);
            if (!response || !response.user || !response.token || !response.refreshToken || !response.expiresIn) {
              throw new Error('Respuesta de login inválida');
            }
            return AuthActions.loginSuccess({
              user: response.user,
              token: response.token,
              refreshToken: response.refreshToken,
              expiresIn: response.expiresIn,
            });
          }),
          catchError((error) => {
            console.error('Login error:', error);
            return of(
              AuthActions.loginFailure({
                error: error.message || 'Error al iniciar sesión',
              })
            );
          }),
          finalize(() => {
            console.log('Login effect completed');
          })
        )
      )
    );
  });

  // Efecto para cuando el inicio de sesión es exitoso
  loginSuccess$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(AuthActions.loginSuccess),
        delay(100), // Pequeño delay para asegurar que el estado se actualice
        tap((action) => {
          try {
            console.log('Login success action:', action);
            if (!action.expiresIn) {
              throw new Error('expiresIn es undefined');
            }
            localStorage.setItem(this.TOKEN_KEY, action.token);
            localStorage.setItem(this.REFRESH_TOKEN_KEY, action.refreshToken);
            localStorage.setItem(this.USER_KEY, JSON.stringify(action.user));
            localStorage.setItem(this.EXPIRES_IN_KEY, action.expiresIn.toString());
            this.router.navigate(['/dashboard']);
          } catch (error) {
            console.error('Error storing auth data:', error);
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
            this.authService.logout();
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
      switchMap(() =>
        this.authService.refreshToken().pipe(
          map((response) =>
            AuthActions.refreshTokenSuccess({
              token: response.token,
              refreshToken: response.refreshToken,
              expiresIn: response.expiresIn,
            })
          ),
          catchError((error) => {
            console.error('Token refresh error:', error);
            return of(
              AuthActions.refreshTokenFailure({
                error: error.message || 'Error al actualizar el token',
              })
            );
          })
        )
      )
    );
  });

  // Efecto para cuando la actualización del token es exitosa
  refreshTokenSuccess$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(AuthActions.refreshTokenSuccess),
        tap((action) => {
          try {
            localStorage.setItem(this.TOKEN_KEY, action.token);
            localStorage.setItem(this.REFRESH_TOKEN_KEY, action.refreshToken);
            localStorage.setItem(this.EXPIRES_IN_KEY, action.expiresIn.toString());
          } catch (error) {
            console.error('Error storing refreshed token:', error);
          }
        })
      );
    },
    { dispatch: false }
  );
}
