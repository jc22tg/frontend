# Formularios de Tipos de Elementos

## Estructura y Estándares

Este directorio contiene los componentes de formulario específicos para cada tipo de elemento de red. Estos componentes fueron refactorizados para seguir un enfoque más consistente y mantenible.

### Estructura de Componentes

Todos los componentes siguen esta estructura:

1. **Clase Base**: 
   - Todos extienden de `BaseElementFormComponent`
   - Implementan `OnInit` y `OnDestroy` a través de la clase base
   - Tienen acceso a métodos utilitarios comunes
   - Incluyen un patrón seguro para limpieza de recursos con `cleanupResources()`

2. **Módulo Compartido**:
   - Utilizan `ElementFormSharedModule` que centraliza todas las importaciones comunes
   - Reduce la duplicación y garantiza la consistencia en las dependencias
   - Incluye módulos para componentes Material como formularios, botones, checkboxes, etc.
   - Añade soporte para indicadores de progreso (MatProgressSpinnerModule, MatProgressBarModule)

3. **Estilos Compartidos**:
   - Usan `shared-form-styles.scss` para la apariencia visual
   - Garantiza consistencia en espaciado, colores y comportamiento responsive

### Cómo Agregar un Nuevo Formulario de Tipo

Para agregar un nuevo formulario para un tipo de elemento:

1. Cree un nuevo componente que extienda de `BaseElementFormComponent`:

```typescript
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { BaseElementFormComponent } from './base-element-form.component';
import { ElementFormSharedModule } from './element-form-shared.module';
import { ElementType } from '../../../../../shared/types/network.types';

@Component({
  selector: 'app-mi-nuevo-form',
  templateUrl: './mi-nuevo-form.component.html', // O usar template inline
  styleUrls: ['./shared-form-styles.scss'],
  standalone: true,
  imports: [ElementFormSharedModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MiNuevoFormComponent extends BaseElementFormComponent {
  // Si necesita inicializar subgrupos:
  protected override initializeFormGroups(): void {
    if (this.propertiesGroup) {
      // Inicializar subgrupos aquí
    }
  }
  
  // Si necesita limpiar recursos al destruir el componente:
  protected override cleanupResources(): void {
    // Código de limpieza aquí (subscripciones, timers, etc.)
  }
}
```

2. Asegúrese de usar los métodos de ayuda proporcionados:
   - Use `hasError(controlPath, errorType)` para verificar errores
   - Use `getSubgroup(subgroupName)` para acceder a subgrupos

3. Importe el componente en `element-editor.component.ts` y agreguelo al switcher en el template.

### Buenas Prácticas

1. **Validación de Errores**:
   - Use el método `hasError` para verificar errores en campos
   - Proporcione mensajes claros y específicos para cada error

2. **Secciones del Formulario**:
   - Use la clase `section-title` para títulos de sección
   - Agrupe campos relacionados en el mismo `form-row`

3. **Formularios Reactivos**:
   - Todos los componentes usan formularios reactivos
   - Mantenga la validación principal en el service que crea los formularios

4. **Accesibilidad**:
   - Asegúrese de que todos los campos tengan labels claros
   - Use `mat-error` para errores de validación
   - Proporcione `mat-hint` para ayuda adicional

5. **Gestión de Recursos**:
   - Para limpiar recursos (subscripciones, timers), sobrescriba el método `cleanupResources()`
   - No sobrescriba directamente `ngOnDestroy()` para evitar problemas con la cadena de herencia

## Estructura de Archivos

```
element-type-form/
  ├── base-element-form.component.ts     # Clase base abstracta
  ├── element-form-shared.module.ts      # Módulo de imports compartidos
  ├── shared-form-styles.scss            # Estilos compartidos
  ├── olt-form.component.ts              # Formulario específico OLT
  ├── odf-form.component.ts              # Formulario específico ODF
  ├── ont-form.component.ts              # Formulario específico ONT
  ├── edfa-form.component.ts             # Formulario específico EDFA
  ├── edfa-form.component.html           # Template HTML para EDFA
  ├── splitter-form.component.ts         # Formulario específico Splitter
  ├── manga-form.component.ts            # Formulario específico Manga
  ├── terminal-box-form.component.ts     # Formulario específico TerminalBox
  └── README.md                          # Esta documentación
```

## Actualización (Consolidación de Componentes)

Este directorio ahora contiene la versión consolidada de todos los formularios de tipos de elementos. Se han realizado las siguientes mejoras:

1. **Mejora del Componente Base**:
   - Se ha integrado un patrón seguro para la limpieza de recursos
   - Se ha documentado el uso correcto de la herencia para componentes derivados

2. **Módulo Compartido Ampliado**:
   - Se han añadido módulos para indicadores de progreso (spinner y barra)
   - Se ha estandarizado la importación de componentes Material 