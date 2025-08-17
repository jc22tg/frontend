import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * Tipos de componentes para registrar en la migración a standalone
 */
export enum ComponentMigrationType {
  NOT_MIGRATED = 'not_migrated',
  IN_PROGRESS = 'in_progress',
  MIGRATED = 'migrated',
  DEPRECATED = 'deprecated'
}

/**
 * Interfaz para el registro de componentes en migración
 */
export interface ComponentMigrationInfo {
  name: string;
  path: string;
  status: ComponentMigrationType;
  dependencies: string[];
  notes?: string;
}

/**
 * Servicio para gestionar la compatibilidad durante la migración a standalone
 * 
 * Este servicio ayuda a rastrear el progreso de la migración a componentes standalone
 * y proporciona utilidades para manejar la transición entre los componentes antiguos
 * y los nuevos.
 */
@Injectable({
  providedIn: 'root'
})
export class StandaloneCompatibilityService {
  // Registro de componentes y su estado de migración
  private migrationRegistry$ = new BehaviorSubject<ComponentMigrationInfo[]>([]);
  
  constructor() {
    // Inicializar con el primer componente migrado
    this.registerComponent({
      name: 'PerformanceWidgetComponent',
      path: 'map-container/components/map-widgets/performance-widget',
      status: ComponentMigrationType.MIGRATED,
      dependencies: ['CommonModule'],
      notes: 'Primer componente migrado a standalone'
    });
  }
  
  /**
   * Registra un componente en el registro de migración
   */
  registerComponent(info: ComponentMigrationInfo): void {
    const currentRegistry = this.migrationRegistry$.value;
    const existingIndex = currentRegistry.findIndex(item => item.name === info.name);
    
    if (existingIndex >= 0) {
      // Actualizar componente existente
      const updatedRegistry = [...currentRegistry];
      updatedRegistry[existingIndex] = info;
      this.migrationRegistry$.next(updatedRegistry);
    } else {
      // Añadir nuevo componente
      this.migrationRegistry$.next([...currentRegistry, info]);
    }
  }
  
  /**
   * Actualiza el estado de migración de un componente
   */
  updateComponentStatus(name: string, status: ComponentMigrationType, notes?: string): void {
    const currentRegistry = this.migrationRegistry$.value;
    const component = currentRegistry.find(item => item.name === name);
    
    if (component) {
      this.registerComponent({
        ...component,
        status,
        notes: notes || component.notes
      });
    }
  }
  
  /**
   * Obtiene todos los componentes registrados
   */
  getAllComponents(): ComponentMigrationInfo[] {
    return this.migrationRegistry$.value;
  }
  
  /**
   * Observable para componentes registrados
   */
  get migrationRegistry(): Observable<ComponentMigrationInfo[]> {
    return this.migrationRegistry$.asObservable();
  }
  
  /**
   * Obtiene un resumen del progreso de migración
   */
  getMigrationSummary(): {
    total: number;
    migrated: number;
    inProgress: number;
    notStarted: number;
    deprecated: number;
    percentComplete: number;
  } {
    const components = this.migrationRegistry$.value;
    const total = components.length;
    
    const migrated = components.filter(c => c.status === ComponentMigrationType.MIGRATED).length;
    const inProgress = components.filter(c => c.status === ComponentMigrationType.IN_PROGRESS).length;
    const notStarted = components.filter(c => c.status === ComponentMigrationType.NOT_MIGRATED).length;
    const deprecated = components.filter(c => c.status === ComponentMigrationType.DEPRECATED).length;
    
    // Calcular progreso, considerando los deprecados como "completados"
    const percentComplete = total > 0 
      ? Math.round(((migrated + deprecated) / total) * 100) 
      : 0;
    
    return {
      total,
      migrated,
      inProgress,
      notStarted,
      deprecated,
      percentComplete
    };
  }
  
  /**
   * Genera un informe de estado de la migración en formato markdown
   */
  generateMarkdownReport(): string {
    const components = this.migrationRegistry$.value;
    const summary = this.getMigrationSummary();
    
    let report = `# Informe de Migración a Standalone\n\n`;
    
    // Añadir resumen
    report += `## Resumen\n\n`;
    report += `- **Progreso Total:** ${summary.percentComplete}%\n`;
    report += `- **Componentes Migrados:** ${summary.migrated}/${summary.total}\n`;
    report += `- **En Progreso:** ${summary.inProgress}\n`;
    report += `- **No Iniciados:** ${summary.notStarted}\n`;
    report += `- **Deprecados:** ${summary.deprecated}\n\n`;
    
    // Añadir detalles por estado
    report += `## Componentes Migrados\n\n`;
    components
      .filter(c => c.status === ComponentMigrationType.MIGRATED)
      .forEach(c => {
        report += `- ✅ **${c.name}** (${c.path})\n`;
        if (c.notes) report += `  - ${c.notes}\n`;
      });
    
    report += `\n## Componentes En Progreso\n\n`;
    components
      .filter(c => c.status === ComponentMigrationType.IN_PROGRESS)
      .forEach(c => {
        report += `- ⚠️ **${c.name}** (${c.path})\n`;
        if (c.notes) report += `  - ${c.notes}\n`;
      });
    
    report += `\n## Componentes Pendientes\n\n`;
    components
      .filter(c => c.status === ComponentMigrationType.NOT_MIGRATED)
      .forEach(c => {
        report += `- ❌ **${c.name}** (${c.path})\n`;
        if (c.notes) report += `  - ${c.notes}\n`;
      });
    
    return report;
  }
} 
