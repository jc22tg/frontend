import { Routes } from '@angular/router';
import { AppInitializerComponent } from './core/components/app-initializer.component';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { UserRole } from '@shared/models/user.model';
import { ElementEditorComponent } from '@features/network-design/components/element-editor/element-editor.component';
import { BatchElementEditorComponent } from '@features/network-design/components/batch-element-editor/batch-element-editor.component';
import { ElementHistoryComponent } from '@features/network-design/components/element-history/element-history.component';
import { NetworkDesignLayoutComponent } from '@features/network-design/pages/network-design-layout/network-design-layout.component';
import { NETWORK_DESIGN_ROUTES } from '@features/network-design/network-design.routes';

export const routes: Routes = [
  {
    path: '',
    component: AppInitializerComponent,
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'auth',
        loadComponent: () => import('./features/auth/auth.component').then(m => m.AuthComponent),
        loadChildren: () => import('./features/auth/auth.routes').then(m => m.authRoutes)
      },
      {
        path: 'dashboard',
        canActivate: [authGuard],
        loadComponent: () => import('./features/dashboard/dashboard-layout.component').then(m => m.DashboardLayoutComponent),
        loadChildren: () => import('./features/dashboard/dashboard.routes').then(m => m.DASHBOARD_ROUTES)
      },
      {
        path: 'network-design',
        canActivate: [authGuard],
        component: NetworkDesignLayoutComponent,
        children: NETWORK_DESIGN_ROUTES,
        data: { 
          breadcrumb: 'Diseño de Red', 
          icon: 'map',
          preload: true
        }
      },
      {
        path: 'network-design/element/:type/edit/:id',
        component: ElementEditorComponent,
        data: { breadcrumb: 'Editor' }
      },
      {
        path: 'network-design/element/:type/new',
        component: ElementEditorComponent,
        data: { breadcrumb: 'Nuevo' }
      },
      {
        path: 'network-design/element/:type/batch',
        component: BatchElementEditorComponent,
        data: { breadcrumb: 'Editor por Lotes', icon: 'library_add' }
      },
      {
        path: 'network-design/element/history/:id',
        component: ElementHistoryComponent,
        data: { breadcrumb: 'Historial', icon: 'history' }
      },
      {
        path: 'projects',
        canActivate: [authGuard],
        loadComponent: () => import('./projects/projects.component').then(m => m.ProjectsComponent),
        loadChildren: () => import('./projects/projects.routes').then(m => m.PROJECTS_ROUTES),
        canMatch: [() => roleGuard([UserRole.ADMIN, UserRole.OPERATOR])]
      },
      {
        path: 'offline',
        canActivate: [authGuard],
        loadComponent: () => import('./offline/offline.component').then(m => m.OfflineComponent),
        loadChildren: () => import('./offline/offline.routes').then(m => m.OFFLINE_ROUTES)
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'auth/login'
  }
];
