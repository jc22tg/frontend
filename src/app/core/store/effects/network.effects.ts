import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { NetworkService } from '../../services/network.service';
import * as NetworkActions from '../actions/network.actions';

@Injectable()
export class NetworkEffects {
  
  loadFDPs$ = createEffect(() => this.actions$.pipe(
    ofType(NetworkActions.loadFDPs),
    switchMap(() => 
      this.networkService.getFDPs().pipe(
        map(fdps => NetworkActions.loadFDPsSuccess({ fdps })),
        catchError(error => of(NetworkActions.loadFDPsFailure({ error: error.message })))
      )
    )
  ));

  loadOLTs$ = createEffect(() => this.actions$.pipe(
    ofType(NetworkActions.loadOLTs),
    switchMap(() => 
      this.networkService.getOLTs().pipe(
        map(olts => NetworkActions.loadOLTsSuccess({ olts })),
        catchError(error => of(NetworkActions.loadOLTsFailure({ error: error.message })))
      )
    )
  ));

  loadONTs$ = createEffect(() => this.actions$.pipe(
    ofType(NetworkActions.loadONTs),
    switchMap(() => 
      this.networkService.getONTs().pipe(
        map(onts => NetworkActions.loadONTsSuccess({ onts })),
        catchError(error => of(NetworkActions.loadONTsFailure({ error: error.message })))
      )
    )
  ));

  loadFiberConnections$ = createEffect(() => this.actions$.pipe(
    ofType(NetworkActions.loadFiberConnections),
    switchMap(() => 
      this.networkService.getFiberConnections().pipe(
        map(fiberConnections => NetworkActions.loadFiberConnectionsSuccess({ fiberConnections })),
        catchError(error => of(NetworkActions.loadFiberConnectionsFailure({ error: error.message })))
      )
    )
  ));

  simulateFailure$ = createEffect(() => this.actions$.pipe(
    ofType(NetworkActions.simulateFailure),
    switchMap(({ deviceType, deviceId, connectionId, failureType, severity }) => 
      this.networkService.simulateFailure({ 
        deviceType, 
        deviceId, 
        connectionId, 
        failureType, 
        severity 
      }).pipe(
        map(() => NetworkActions.simulateFailureSuccess()),
        catchError(error => of(NetworkActions.simulateFailureFailure({ error: error.message })))
      )
    )
  ));

  loadAlerts$ = createEffect(() => this.actions$.pipe(
    ofType(NetworkActions.loadAlerts),
    switchMap(({ filters }) => 
      this.networkService.getAlerts(filters).pipe(
        map(alerts => NetworkActions.loadAlertsSuccess({ alerts })),
        catchError(error => of(NetworkActions.loadAlertsFailure({ error: error.message })))
      )
    )
  ));

  acknowledgeAlert$ = createEffect(() => this.actions$.pipe(
    ofType(NetworkActions.acknowledgeAlert),
    switchMap(({ alertId }) => 
      this.networkService.acknowledgeAlert(alertId).pipe(
        map(alert => NetworkActions.acknowledgeAlertSuccess({ alert })),
        catchError(error => of(NetworkActions.acknowledgeAlertFailure({ error: error.message })))
      )
    )
  ));

  resolveAlert$ = createEffect(() => this.actions$.pipe(
    ofType(NetworkActions.resolveAlert),
    switchMap(({ alertId, notes }) => 
      this.networkService.resolveAlert(alertId, notes).pipe(
        map(alert => NetworkActions.resolveAlertSuccess({ alert })),
        catchError(error => of(NetworkActions.resolveAlertFailure({ error: error.message })))
      )
    )
  ));

  constructor(
    private actions$: Actions,
    private networkService: NetworkService
  ) {}
} 
