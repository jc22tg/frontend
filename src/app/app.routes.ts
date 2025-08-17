import { Routes } from '@angular/router';
import { AppInitializerComponent } from './core/components/app-initializer.component';
import { MainLayoutComponent } from './core/components/main-layout/main-layout.component';
import { authGuard } from './core/guards/auth.guard';
import { publicGuard } from './core/guards/public.guard';
import { roleGuard } from './core/guards/role.guard';
import { UserRole } from '@shared/models/user.model';
import { NetworkDesignLayoutComponent } from '@features/network-design/pages/network-design-layout/network-design-layout.component';
import { NETWORK_DESIGN_ROUTES } from '@features/network-design/network-design.routes';

export const routes: Routes = [
  {
    path: '',
    component: AppInitializerComponent,
    children: [
      {
        path: 'auth',
        canActivate: [publicGuard],
        loadComponent: () => import('./features/auth/auth.component').then(m => m.AuthComponent),
        loadChildren: () => import('./features/auth/auth.routes').then(m => m.authRoutes)
      },
      {
        path: '',
        component: MainLayoutComponent,
        canActivate: [authGuard],
        children: [
          {
            path: 'dashboard',
            loadComponent: () => import('./features/dashboard/dashboard-layout.component').then(m => m.DashboardLayoutComponent),
            loadChildren: () => import('./features/dashboard/dashboard.routes').then(m => m.DASHBOARD_ROUTES)
          },
          {
            path: 'network-design',
            component: NetworkDesignLayoutComponent,
            children: NETWORK_DESIGN_ROUTES,
            data: { 
              breadcrumb: 'Diseño de Red', 
              icon: 'map',
              preload: true
            }
          },
          {
            path: 'projects',
            loadComponent: () => import('./projects/projects.component').then(m => m.ProjectsComponent),
            loadChildren: () => import('./projects/projects.routes').then(m => m.PROJECTS_ROUTES),
            canMatch: [() => roleGuard([UserRole.ADMIN, UserRole.OPERATOR])]
          },
          {
            path: 'offline',
            loadComponent: () => import('./offline/offline.component').then(m => m.OfflineComponent),
            loadChildren: () => import('./offline/offline.routes').then(m => m.OFFLINE_ROUTES)
          },
          {
            path: '',
            redirectTo: 'dashboard',
            pathMatch: 'full'
          }
        ]
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
