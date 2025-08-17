import { createReducer, on } from '@ngrx/store';
import { User } from '../../../features/auth/types/auth.types';
import * as AuthActions from '../actions/auth.actions';

// Definir la clave del feature para usarla en la configuración del store
export const authFeatureKey = 'auth';

export interface State {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  expiresIn: number | null;
  loading: boolean;
  error: string | null;
}

export const initialState: State = {
  user: null,
  token: null,
  refreshToken: null,
  expiresIn: null,
  loading: false,
  error: null
};

// Exportar el reducer con el nombre authReducer para usarlo en la configuración
export const authReducer = createReducer(
  initialState,

  // Login
  on(AuthActions.login, state => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(AuthActions.loginSuccess, (state, { user, token, refreshToken, expiresIn }) => ({
    ...state,
    user,
    token,
    refreshToken,
    expiresIn,
    loading: false,
    error: null
  })),
  
  on(AuthActions.loginFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Logout
  on(AuthActions.logout, state => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(AuthActions.logoutSuccess, () => ({
    ...initialState
  })),
  
  on(AuthActions.logoutFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Refresh Token
  on(AuthActions.refreshToken, state => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(AuthActions.refreshTokenSuccess, (state, { token, refreshToken, expiresIn }) => ({
    ...state,
    token,
    refreshToken,
    expiresIn,
    loading: false,
    error: null
  })),
  
  on(AuthActions.refreshTokenFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  }))
);

// Mantener la exportación original para compatibilidad con el código existente
export const reducer = authReducer; 
