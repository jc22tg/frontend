import { ActionReducerMap, MetaReducer } from '@ngrx/store';
import { environment } from '../../../environments/environment';
import * as fromAuth from './reducers/auth.reducer';
import * as fromNetwork from './reducers/network.reducer';

// Efectos
import { AuthEffects } from './effects/auth.effects';

/**
 * Interfaz que define la estructura global del estado de la aplicación
 */
export interface AppState {
  auth: fromAuth.State;
  network: fromNetwork.State;
}

/**
 * Definición de todos los reducers de la aplicación
 */
export const reducers: ActionReducerMap<AppState> = {
  auth: fromAuth.reducer,
  network: fromNetwork.reducer
};

/**
 * Metareducers para aplicar transformaciones a todo el estado
 */
export const metaReducers: MetaReducer<AppState>[] = !environment.production 
  ? [] 
  : [];

/**
 * Registro de todos los efectos de la aplicación
 */
export const appEffects = [
  AuthEffects
]; 
