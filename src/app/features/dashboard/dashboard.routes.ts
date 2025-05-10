import { Routes } from '@angular/router';
import { DashboardLayoutComponent } from './dashboard-layout.component';

// Se elimina la importación comentada del componente obsoleto
// Ya no es necesario mantener esta referencia

export const DASHBOARD_ROUTES: Routes = [
  {
    path: '',
    component: DashboardLayoutComponent
  }
]; 