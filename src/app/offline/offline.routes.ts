import { Routes } from '@angular/router';
import { SyncStatusComponent } from './components/sync-status/sync-status.component';

export const OFFLINE_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'sync',
    pathMatch: 'full'
  },
  {
    path: 'sync',
    component: SyncStatusComponent
  }
]; 