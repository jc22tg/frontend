import { Routes } from '@angular/router';
import { ErrorComponent } from '../../shared/error/error.component';
import { PendingChangesGuard } from './guards/pending-changes.guard';
import { MapPositionDialogComponent } from './components/map-position-dialog/map-position-dialog.component';
import { MapContainerComponent } from './components/map-container/map-container.component';

/**
 * Configuración de rutas para el módulo de diseño de red.
 *
 * Define las rutas principales y secundarias para la funcionalidad de diseño de red,
 * incluyendo la edición, creación y visualización de detalles de elementos.
 *
 * @example
 * ```typescript
 * RouterModule.forChild(NETWORK_DESIGN_ROUTES)
 * ```
 *
 * @remarks
 * Las rutas utilizan lazy loading para cargar los componentes solo cuando son necesarios,
 * y definen animaciones para las transiciones entre vistas.
 */
export const NETWORK_DESIGN_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'map',
    pathMatch: 'full'
  },
  {
    path: 'map',
    component: MapContainerComponent,
    data: { 
      animation: 'map',
      breadcrumb: 'Mapa',
      preload: true,
      mapConfig: {
        initialZoom: 16,
        initialCenter: [19.783750, -70.676666]
      }
    }
  },
  {
    path: 'elements',
    loadComponent: () => import('@features/network-design/components/elements/element-details/element-details.component').then(c => c.ElementDetailsComponent),
    data: { 
      animation: 'list',
      breadcrumb: 'Elementos'
    }
  },
  {
    path: 'connections',
    loadComponent: () => import('@features/network-design/components/connection-editor/connection-editor.component').then(c => c.ConnectionEditorComponent),
    data: { 
      animation: 'connections',
      breadcrumb: 'Conexiones'
    }
  },
  {
    path: 'monitoring',
    loadComponent: () => import('@features/network-design/components/widgets/monitoring/network-health-widget/network-health-widget.component').then(c => c.NetworkHealthWidgetComponent),
    data: { 
      animation: 'monitoring',
      breadcrumb: 'Monitoreo'
    }
  },
  {
    path: 'editor',
    loadComponent: () => import('@features/network-design/components/elements/element-editor/element-editor.component').then(c => c.ElementEditorComponent),
    canDeactivate: [PendingChangesGuard],
    data: { 
      animation: 'editor',
      breadcrumb: 'Editor'
    },
  },
  {
    path: 'editor/:id',
    loadComponent: () => import('@features/network-design/components/elements/element-editor/element-editor.component').then(c => c.ElementEditorComponent),
    canDeactivate: [PendingChangesGuard],
    data: { 
      animation: 'editor',
      breadcrumb: 'Editor'
    },
  },
  {
    path: 'elements/create',
    title: 'Crear Elemento',
    loadComponent: () => import('@features/network-design/components/elements/element-editor/element-editor.component').then(c => c.ElementEditorComponent),
    canDeactivate: [PendingChangesGuard],
  },
  {
    path: 'elements/:type/create',
    title: 'Crear Elemento',
    loadComponent: () => import('@features/network-design/components/elements/element-editor/element-editor.component').then(c => c.ElementEditorComponent),
    canDeactivate: [PendingChangesGuard],
  },
  {
    path: 'elements/:id',
    title: 'Detalles del Elemento',
    loadComponent: () => import('@features/network-design/components/elements/element-details/element-details.component').then(c => c.ElementDetailsComponent),
  },
  {
    path: 'elements/:id/edit',
    title: 'Editar Elemento',
    loadComponent: () => import('@features/network-design/components/elements/element-editor/element-editor.component').then(c => c.ElementEditorComponent),
    canDeactivate: [PendingChangesGuard],
  },
  {
    path: 'elements/:id/history',
    title: 'Historial del Elemento',
    loadComponent: () => import('@features/network-design/components/elements/element-history/element-history.component').then(c => c.ElementHistoryComponent),
  },
  {
    path: 'history/:id',
    loadComponent: () => import('@features/network-design/components/elements/element-history/element-history.component').then(c => c.ElementHistoryComponent),
    data: { 
      animation: 'history',
      breadcrumb: 'Historial'
    },
  },
  {
    path: 'diagnostic',
    loadComponent: () => import('@features/network-design/components/map-diagnostic/map-diagnostic.component').then(c => c.MapDiagnosticComponent),
    data: { 
      animation: 'diagnostic',
      breadcrumb: 'Diagnóstico'
    },
  },
  {
    path: 'position-selector',
    component: MapPositionDialogComponent,
    data: { 
      animation: 'position-selector', 
      breadcrumb: 'Selector de Posición',
      isFullPage: true 
    }
  },
  {
    path: 'error',
    component: ErrorComponent,
    data: { 
      animation: 'error',
      breadcrumb: 'Error'
    },
  },
  {
    path: 'element/:type/edit/:id',
    loadComponent: () => import('@features/network-design/components/elements/element-editor/element-editor.component').then(c => c.ElementEditorComponent),
    data: { 
      animation: 'editor',
      breadcrumb: 'Editor' 
    }
  },
  {
    path: 'element/:type/new',
    loadComponent: () => import('@features/network-design/components/elements/element-editor/element-editor.component').then(c => c.ElementEditorComponent),
    data: { 
      animation: 'editor',
      breadcrumb: 'Nuevo' 
    }
  },
  {
    path: 'element/:type/batch',
    loadComponent: () => import('@features/network-design/components/batch-element-editor/batch-element-editor.component').then(c => c.BatchElementEditorComponent),
    data: { 
      animation: 'editor',
      breadcrumb: 'Editor por Lotes', 
      icon: 'library_add' 
    }
  },
  {
    path: 'element/history/:id',
    loadComponent: () => import('@features/network-design/components/elements/element-history/element-history.component').then(c => c.ElementHistoryComponent),
    data: { 
      animation: 'history',
      breadcrumb: 'Historial', 
      icon: 'history' 
    }
  },
  {
    path: '**',
    redirectTo: 'error',
    data: {
      error: {
        code: 404,
        message: 'Página no encontrada',
        description: 'La ruta solicitada no existe en el sistema.',
      },
    },
  },
];
