/**
 * Script para registrar componentes para la migración a standalone
 * 
 * Este archivo contiene una función para registrar todos los componentes del proyecto
 * que necesitan ser migrados a standalone.
 */

import { ComponentMigrationType, ComponentMigrationInfo } from './standalone-compatibility.service';

/**
 * Lista de todos los componentes a migrar
 */
export const ALL_COMPONENTS_TO_MIGRATE: ComponentMigrationInfo[] = [
  // Componentes ya migrados
  {
    name: 'PerformanceWidgetComponent',
    path: 'map-container/components/map-widgets/performance-widget',
    status: ComponentMigrationType.MIGRATED,
    dependencies: ['CommonModule'],
    notes: 'Primer componente migrado a standalone'
  },
  {
    name: 'ElementsPanelComponent',
    path: 'map-container/components/elements-panel',
    status: ComponentMigrationType.MIGRATED,
    dependencies: ['CommonModule', 'ReactiveFormsModule'],
    notes: 'Segundo componente migrado a standalone'
  },
  {
    name: 'LayerControlComponent',
    path: 'map-container/components/layer-control',
    status: ComponentMigrationType.MIGRATED,
    dependencies: ['CommonModule'],
    notes: 'Tercer componente migrado a standalone'
  },
  {
    name: 'MiniMapComponent',
    path: 'map-container/components/mini-map',
    status: ComponentMigrationType.MIGRATED,
    dependencies: ['CommonModule'],
    notes: 'Componente ya implementado como standalone'
  },
  
  // Componentes en progreso
  {
    name: 'MapWidgetsModule',
    path: 'map-container/components/map-widgets',
    status: ComponentMigrationType.IN_PROGRESS,
    dependencies: ['PerformanceWidgetComponent'],
    notes: 'Se mantiene temporalmente durante la migración de los widgets'
  },
  
  // Componentes pendientes (prioridad baja)
  {
    name: 'MapView',
    path: 'map-container/components/map-view',
    status: ComponentMigrationType.NOT_MIGRATED,
    dependencies: ['CommonModule', 'LeafletModule', 'FormsModule'],
    notes: 'Componente complejo con múltiples dependencias'
  },
  
  // Contenedores principales (migrar al final)
  {
    name: 'MapContainer',
    path: 'map-container',
    status: ComponentMigrationType.NOT_MIGRATED,
    dependencies: [
      'CommonModule', 
      'MapWidgetsModule', 
      'ElementsPanelComponent', 
      'LayerControlComponent',
      'MapViewComponent',
      'MiniMapComponent'
    ],
    notes: 'Componente contenedor principal, migrar después de sus hijos'
  }
];

/**
 * Registra todos los componentes en el servicio de compatibilidad
 * @param service Servicio de compatibilidad para standalone
 */
export function registerAllComponents(service: any): void {
  ALL_COMPONENTS_TO_MIGRATE.forEach(component => {
    service.registerComponent(component);
  });
} 
