import { createReducer, on } from '@ngrx/store';
import { 
  FDPElement, 
  OLTElement, 
  ONTElement, 
  EDFAElement, 
  SplitterElement, 
  MangaElement, 
  NetworkAlert
} from '../../../shared/types/network.types';
import { FiberConnection } from '../../../shared/models/fiber-connection.model';
import * as NetworkActions from '../actions/network.actions';

export interface State {
  fdps: FDPElement[];
  olts: OLTElement[];
  onts: ONTElement[];
  edfas: EDFAElement[];
  splitters: SplitterElement[];
  mangas: MangaElement[];
  fiberConnections: FiberConnection[];
  alerts: NetworkAlert[];
  selectedElementType: string | null;
  selectedElementId: number | null;
  loading: boolean;
  error: string | null;
}

export const initialState: State = {
  fdps: [],
  olts: [],
  onts: [],
  edfas: [],
  splitters: [],
  mangas: [],
  fiberConnections: [],
  alerts: [],
  selectedElementType: null,
  selectedElementId: null,
  loading: false,
  error: null
};

export const reducer = createReducer(
  initialState,

  // Cargar FDPs
  on(NetworkActions.loadFDPs, state => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(NetworkActions.loadFDPsSuccess, (state, { fdps }) => ({
    ...state,
    fdps,
    loading: false,
    error: null
  })),
  
  on(NetworkActions.loadFDPsFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Cargar OLTs
  on(NetworkActions.loadOLTs, state => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(NetworkActions.loadOLTsSuccess, (state, { olts }) => ({
    ...state,
    olts,
    loading: false,
    error: null
  })),
  
  on(NetworkActions.loadOLTsFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Cargar conexiones de fibra
  on(NetworkActions.loadFiberConnections, state => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(NetworkActions.loadFiberConnectionsSuccess, (state, { fiberConnections }) => ({
    ...state,
    fiberConnections,
    loading: false,
    error: null
  })),
  
  on(NetworkActions.loadFiberConnectionsFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Seleccionar elemento
  on(NetworkActions.selectNetworkElement, (state, { elementType, elementId }) => ({
    ...state,
    selectedElementType: elementType,
    selectedElementId: elementId
  })),

  // Simular fallo
  on(NetworkActions.simulateFailure, state => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(NetworkActions.simulateFailureSuccess, state => ({
    ...state,
    loading: false,
    error: null
  })),
  
  on(NetworkActions.simulateFailureFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Cargar alertas
  on(NetworkActions.loadAlerts, state => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(NetworkActions.loadAlertsSuccess, (state, { alerts }) => ({
    ...state,
    alerts,
    loading: false,
    error: null
  })),
  
  on(NetworkActions.loadAlertsFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  }))
); 
