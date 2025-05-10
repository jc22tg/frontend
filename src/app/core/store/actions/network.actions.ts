import { createAction, props } from '@ngrx/store';
import {
  FDP,
  OLT,
  ONT,
  EDFA,
  Splitter,
  Manga,
  FiberConnection,
  NetworkAlert,
} from '../../../shared/models/network.model';

// FDPs
export const loadFDPs = createAction('[Network] Load FDPs');

export const loadFDPsSuccess = createAction(
  '[Network] Load FDPs Success',
  props<{ fdps: FDP[] }>()
);

export const loadFDPsFailure = createAction(
  '[Network] Load FDPs Failure',
  props<{ error: string }>()
);

// OLTs
export const loadOLTs = createAction('[Network] Load OLTs');

export const loadOLTsSuccess = createAction(
  '[Network] Load OLTs Success',
  props<{ olts: OLT[] }>()
);

export const loadOLTsFailure = createAction(
  '[Network] Load OLTs Failure',
  props<{ error: string }>()
);

// ONTs
export const loadONTs = createAction('[Network] Load ONTs');

export const loadONTsSuccess = createAction(
  '[Network] Load ONTs Success',
  props<{ onts: ONT[] }>()
);

export const loadONTsFailure = createAction(
  '[Network] Load ONTs Failure',
  props<{ error: string }>()
);

// EDFAs
export const loadEDFAs = createAction('[Network] Load EDFAs');

export const loadEDFAsSuccess = createAction(
  '[Network] Load EDFAs Success',
  props<{ edfas: EDFA[] }>()
);

export const loadEDFAsFailure = createAction(
  '[Network] Load EDFAs Failure',
  props<{ error: string }>()
);

// Splitters
export const loadSplitters = createAction('[Network] Load Splitters');

export const loadSplittersSuccess = createAction(
  '[Network] Load Splitters Success',
  props<{ splitters: Splitter[] }>()
);

export const loadSplittersFailure = createAction(
  '[Network] Load Splitters Failure',
  props<{ error: string }>()
);

// Mangas
export const loadMangas = createAction('[Network] Load Mangas');

export const loadMangasSuccess = createAction(
  '[Network] Load Mangas Success',
  props<{ mangas: Manga[] }>()
);

export const loadMangasFailure = createAction(
  '[Network] Load Mangas Failure',
  props<{ error: string }>()
);

// Conexiones de fibra
export const loadFiberConnections = createAction(
  '[Network] Load Fiber Connections'
);

export const loadFiberConnectionsSuccess = createAction(
  '[Network] Load Fiber Connections Success',
  props<{ fiberConnections: FiberConnection[] }>()
);

export const loadFiberConnectionsFailure = createAction(
  '[Network] Load Fiber Connections Failure',
  props<{ error: string }>()
);

// Selección de elementos
export const selectNetworkElement = createAction(
  '[Network] Select Network Element',
  props<{ elementType: string; elementId: number }>()
);

// Simulación de fallos
export const simulateFailure = createAction(
  '[Network] Simulate Failure',
  props<{
    deviceType: string;
    deviceId?: number;
    connectionId?: number;
    failureType: string;
    severity: string;
  }>()
);

export const simulateFailureSuccess = createAction(
  '[Network] Simulate Failure Success'
);

export const simulateFailureFailure = createAction(
  '[Network] Simulate Failure Failure',
  props<{ error: string }>()
);

// Alertas
export const loadAlerts = createAction(
  '[Network] Load Alerts',
  props<{ filters?: any }>()
);

export const loadAlertsSuccess = createAction(
  '[Network] Load Alerts Success',
  props<{ alerts: NetworkAlert[] }>()
);

export const loadAlertsFailure = createAction(
  '[Network] Load Alerts Failure',
  props<{ error: string }>()
);

export const acknowledgeAlert = createAction(
  '[Network] Acknowledge Alert',
  props<{ alertId: number }>()
);

export const acknowledgeAlertSuccess = createAction(
  '[Network] Acknowledge Alert Success',
  props<{ alert: NetworkAlert }>()
);

export const acknowledgeAlertFailure = createAction(
  '[Network] Acknowledge Alert Failure',
  props<{ error: string }>()
);

export const resolveAlert = createAction(
  '[Network] Resolve Alert',
  props<{ alertId: number; notes?: string }>()
);

export const resolveAlertSuccess = createAction(
  '[Network] Resolve Alert Success',
  props<{ alert: NetworkAlert }>()
);

export const resolveAlertFailure = createAction(
  '[Network] Resolve Alert Failure',
  props<{ error: string }>()
);
