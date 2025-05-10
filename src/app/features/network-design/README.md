# Módulo de Diseño de Red

Este módulo maneja la visualización y gestión de elementos de red en la aplicación.

## Estructura del Módulo

```
network-design/
├── components/          # Componentes reutilizables
│   ├── element-details/
│   ├── element-detail-row/
│   └── network-map/
├── services/           # Servicios de lógica de negocio
│   ├── element.service.ts
│   └── map.service.ts
├── interfaces/         # Interfaces y tipos
│   └── element.interface.ts
├── facades/           # Facades para gestión de estado
│   └── network.facade.ts
├── repositories/      # Repositorios para acceso a datos
│   └── network.repository.ts
├── pages/            # Páginas principales
│   ├── network-map/
│   └── element-management/
├── network-widget/   # Widgets específicos de red
│   ├── network-status/
│   └── element-quick-view/
├── animations.ts     # Animaciones del módulo
├── network-design.component.ts    # Componente principal
├── network-design.styles.scss     # Estilos globales
├── network-design.routes.ts       # Configuración de rutas
├── network-design.config.ts       # Configuración del módulo
└── index.ts          # Exportaciones del módulo
```

## Arquitectura

### Capas del Módulo

1. **Presentación (Components)**
   - Componentes reutilizables
   - Páginas principales
   - Widgets específicos

2. **Lógica de Negocio (Services)**
   - Servicios principales
   - Facades para estado
   - Repositorios para datos

3. **Datos (Repositories)**
   - Acceso a API
   - Transformación de datos
   - Caché local

4. **Configuración**
   - Configuración del módulo
   - Rutas
   - Estilos globales

### Patrones de Diseño

1. **Facade Pattern**
   - Simplificación de interacciones complejas
   - Centralización de lógica de estado
   - Mejor testabilidad

2. **Repository Pattern**
   - Abstracción de acceso a datos
   - Caché y optimización
   - Manejo de errores

3. **Component Pattern**
   - Componentes pequeños y enfocados
   - Reutilización de código
   - Mejor mantenibilidad

## Componentes Principales

### Network Map Component
- Visualización del mapa de red
- Gestión de elementos
- Interacción con el mapa

### Element Details Component
- Visualización de detalles
- Edición de elementos
- Monitoreo en tiempo real

### Network Status Widget
- Estado general de la red
- Métricas principales
- Alertas y notificaciones

## Servicios

### Element Service
- Gestión de elementos
- Validación de datos
- Transformación de tipos

### Map Service
- Gestión del mapa
- Interacción con elementos
- Optimización de rendimiento

### Network Facade
- Estado global de la red
- Acciones principales
- Sincronización de datos

## Configuración

### Network Design Config
```typescript
interface NetworkDesignConfig {
  map: {
    initialZoom: number;
    initialCenter: [number, number];
    zoomLimits: [number, number];
    tileLayerUrl: string;
  };
  elements: {
    size: { min: number; max: number; };
    colors: { [key: string]: string; };
  };
  monitoring: {
    updateInterval: number;
    thresholds: { [key: string]: number; };
  };
  animations: {
    duration: number;
    easing: string;
  };
}
```

## Estilos

### Variables Globales
```scss
:root {
  // Colores
  --color-primary: #1976d2;
  --color-secondary: #424242;
  --color-success: #4caf50;
  --color-warning: #ff9800;
  --color-danger: #f44336;
  --color-info: #2196f3;

  // Espaciado
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;

  // Tipografía
  --font-family: 'Roboto', sans-serif;
  --font-size-xs: 12px;
  --font-size-sm: 14px;
  --font-size-md: 16px;
  --font-size-lg: 18px;
  --font-size-xl: 24px;
}
```

## Mejores Prácticas

### 1. Desarrollo
- Componentes standalone
- Servicios con interfaces
- Pruebas unitarias
- Documentación JSDoc

### 2. Rendimiento
- Lazy loading
- Optimización de renderizado
- Caché de datos
- Gestión eficiente de estado

### 3. Mantenibilidad
- Código limpio y documentado
- Estructura clara
- Convenciones de nombrado
- Control de versiones

### 4. Accesibilidad
- ARIA labels
- Navegación por teclado
- Contraste de colores
- Textos alternativos

## Flujos de Trabajo

### 1. Desarrollo de Características
1. Crear estructura de directorios
2. Definir interfaces
3. Implementar servicios
4. Desarrollar componentes
5. Escribir pruebas
6. Documentar cambios

### 2. Mantenimiento
1. Revisar código
2. Identificar mejoras
3. Implementar cambios
4. Actualizar documentación
5. Ejecutar pruebas

### 3. Control de Calidad
1. Revisión de código
2. Pruebas unitarias
3. Pruebas de integración
4. Pruebas de rendimiento
5. Documentación actualizada

## Herramientas y Recursos

### 1. Desarrollo
- Angular CLI
- TypeScript
- SCSS
- RxJS

### 2. Testing
- Jest
- Cypress
- Testing Library
- Coverage Reports

### 3. Documentación
- Compodoc
- Storybook
- Markdown
- JSDoc

### 4. CI/CD
- GitHub Actions
- SonarQube
- Docker
- NPM Scripts
- Azure DevOps
- Jenkins Pipelines

## Integración con Otros Módulos

### 1. Módulo de Autenticación
- Gestión de permisos por usuario
- Roles específicos para operaciones de red
- Registro de actividad del usuario

### 2. Módulo de Notificaciones
- Alertas en tiempo real
- Notificaciones de cambios en elementos
- Informes programados

### 3. Módulo de Análisis
- Integración de datos de rendimiento
- Visualizaciones estadísticas
- Detección de patrones

## Seguridad

### 1. Autorización
- Control de acceso basado en roles (RBAC)
- Permisos granulares por tipo de elemento
- Registros de auditoría

### 2. Protección de Datos
- Cifrado de datos sensibles
- Validación de entrada
- Sanitización de datos

### 3. Prevención de Ataques
- Protección XSS
- Prevención de CSRF
- Limitación de peticiones (Rate limiting)

## Optimización de Rendimiento

### 1. Carga Inicial
- Carga diferida de componentes
- Priorización de recursos críticos
- Precarga estratégica de datos

### 2. Interactividad del Mapa
- Virtualización de elementos
- Renderizado optimizado
- Gestión eficiente de memoria

### 3. Análisis de Rendimiento
- Métricas de Core Web Vitals
- Monitoreo de tiempos de carga
- Identificación de cuellos de botella

## Despliegue y Entornos

### 1. Entornos
- Desarrollo
- Pruebas (QA)
- Staging
- Producción

### 2. Configuración por Entorno
- Variables de entorno
- Endpoints de API
- Niveles de logging

### 3. Estrategia de Despliegue
- Despliegue continuo
- Canary releases
- Rollback automatizado

## Integración entre Element-Editor y Network-Design

Para mejorar la integración entre los componentes `element-editor` y `network-design`, se han implementado las siguientes mejoras:

### 1. Comunicación Bidireccional

El sistema ahora utiliza un enfoque de comunicación bidireccional a través del servicio compartido `NetworkStateService`:

- Se ha añadido un sistema de vista previa en tiempo real que permite ver los cambios en el mapa mientras se está editando un elemento
- Los servicios `MapService` y `ElementEditorService` se comunican a través de `NetworkStateService`
- Se implementó un mecanismo de notificación de cambios sin guardar

### 2. Mejoras en la Interfaz de Usuario

- Se ha añadido un indicador visual cuando hay cambios sin guardar
- Se mejoró la indicación de sincronización con el mapa
- Se implementaron animaciones para una experiencia de transición más fluida
- Se añadieron atajos de teclado (Esc para cancelar, Ctrl+S para guardar)

### 3. Manejo de Errores Centralizado

- Se utiliza `ErrorHandlingService` para gestionar todos los errores de manera consistente
- Mejores mensajes de error con contexto específico
- Registro centralizado de errores para facilitar la depuración

### 4. Protección contra Navegación con Cambios sin Guardar

- Se utiliza `PendingChangesGuard` para prevenir la pérdida accidental de cambios
- El guardia muestra un diálogo de confirmación cuando hay cambios sin guardar
- El estado de cambios sin guardar se sincroniza globalmente

### 5. Optimización de Rendimiento

- Las suscripciones se limpian correctamente en la destrucción de componentes
- Se utiliza ChangeDetectionStrategy.OnPush para mejorar el rendimiento
- Las actualizaciones visuales son más eficientes con renderizado condicional

Este nuevo sistema de integración mejora significativamente la experiencia de usuario y reduce la posibilidad de errores o pérdida de datos durante la edición de elementos de red.

### Integración ElementHistory - NetworkDesign

La integración entre el componente `ElementHistoryComponent` y su componente padre `NetworkDesignComponent` se ha mejorado para proporcionar una experiencia de usuario más cohesiva y navegación fluida:

#### Rutas y Navegación

- Se ha añadido una ruta específica para el historial de elementos en `network-design.routes.ts` con la forma `history/:id`.
- Se ha agregado el método `viewElementHistory(elementId)` en el componente padre para permitir la navegación directa.
- Se han añadido botones de navegación en el componente de historial para volver al mapa o ver detalles.

#### Compartición de Estado

- El componente `ElementHistoryComponent` ahora utiliza `NetworkStateService` para sincronizar:
  - El elemento seleccionado
  - El modo de visualización actual
  - Notificaciones y estado global

#### Mejoras de Interfaz

- Se muestra un resumen del elemento para proporcionar contexto
- Se han añadido acciones para ver el elemento en el mapa, ver sus detalles o imprimir el historial
- Se ha mejorado la visualización de cambios y eventos de mantenimiento
- Se han optimizado los estilos para una experiencia visual cohesiva

#### Carga de Datos

- El componente puede recibir el ID del elemento tanto por Input como por la ruta
- Se implementa carga de datos optimizada usando forkJoin
- Se agregó manejo de errores centralizado
- Se añadió soporte para actualización de datos en tiempo real

Esta integración permite una navegación fluida entre el historial, los detalles del elemento y el mapa, manteniendo el contexto entre las vistas y proporcionando una experiencia de usuario coherente.

# Componentes de Editor y Formularios - Documentación Técnica

## Estructura y Estándares

Los componentes de editor y formularios fueron refactorizados para seguir un enfoque más consistente y mantenible. Esta documentación describe la nueva arquitectura y las prácticas recomendadas para futuras ampliaciones.

### Patrones Implementados

#### 1. Clases Base Abstractas

Se implementaron dos clases base abstractas que proporcionan funcionalidad común:

- **BaseEditorComponent**: Para componentes de editor principales
- **BaseElementFormComponent**: Para formularios específicos por tipo de elemento

Estas clases base:
- Estandarizan la gestión del ciclo de vida de componentes
- Centralizan la lógica de manejo de estados (carga, errores)
- Proporcionan métodos auxiliares comunes

#### 2. Módulos Compartidos

- **ElementFormSharedModule**: Centraliza todas las importaciones comunes utilizadas por formularios
  - Reduce la duplicación de código
  - Garantiza la consistencia en las dependencias

#### 3. Estilos Compartidos

- **editor-base.scss**: Proporciona estilos base reutilizables
- **shared-form-styles.scss**: Contiene estilos comunes para formularios de elementos

### Estructura de Archivos

```
components/
├── base-editor.component.ts             # Clase base para editores
├── element-editor/
│   ├── element-editor.component.ts      # Implementación concreta
│   ├── element-editor.component.html    # Plantilla
│   ├── element-editor.component.scss    # Estilos específicos
│   └── element-type-form/               # Formularios para tipos específicos (ubicación consolidada)
│       ├── base-element-form.component.ts  # Clase base para formularios
│       ├── element-form-shared.module.ts   # Módulo compartido
│       ├── shared-form-styles.scss         # Estilos compartidos
│       └── [tipo]-form.component.ts        # Implementaciones específicas
├── element-type-form/                    # DEPRECATED: Use element-editor/element-type-form en su lugar
└── shared/
    └── styles/
        └── editor-base.scss             # Estilos base compartidos
```

## Guía de Implementación

### Cómo Crear un Nuevo Editor

1. Extiende `BaseEditorComponent`
2. Implementa los métodos abstractos obligatorios:
   - `initializeForm()`
   - `initializeState()`
   - `subscribeToChanges()`
3. Utiliza `ElementFormSharedModule` para las importaciones comunes
4. Importa los estilos base en tu archivo SCSS

### Cómo Crear un Nuevo Formulario por Tipo

1. Extiende `BaseElementFormComponent`
2. Usa `ElementFormSharedModule` para importaciones
3. Implementa `initializeFormGroups()` si necesitas inicialización específica
4. Usa los métodos auxiliares como `hasError()` y `getSubgroup()`

## Mejores Prácticas

1. **Gestión del Estado**: Utiliza BehaviorSubject para estados locales
2. **Limpieza de Recursos**: Siempre llama a `super.ngOnDestroy()` en la implementación
3. **Validaciones**: Centraliza lógica de validación en servicios especializados
4. **Estilos**: Evita duplicar estilos, utiliza los compartidos
5. **Reactividad**: Implementa patrones reactivos y evita manipulación manual del DOM

## Ejemplos

### Ejemplo de extensión de BaseEditorComponent:

```typescript
export class MyNewEditorComponent extends BaseEditorComponent {
  protected override initializeForm(): void {
    // Implementación específica
  }
  
  protected override initializeState(): void {
    // Implementación específica
  }
  
  protected override subscribeToChanges(): void {
    // Implementación específica
  }
}
```

### Ejemplo de extensión de BaseElementFormComponent:

```typescript
export class MyNewElementFormComponent extends BaseElementFormComponent {
  protected override initializeFormGroups(): void {
    // Inicialización de subgrupos si es necesario
  }
}
```

# Actualización: Enfoque de Componentes Standalone

## Migración a Componentes Standalone

Hemos actualizado la arquitectura del módulo para adoptar completamente el enfoque de componentes standalone de Angular:

### Cambios realizados

1. **Eliminación de módulos compartidos**: Hemos eliminado la dependencia del `ElementFormSharedModule` en favor de importaciones directas en cada componente.

2. **Importaciones explícitas**: Cada componente ahora importa exactamente lo que necesita.

3. **Independencia de componentes**: Ahora los componentes son totalmente independientes y pueden utilizarse individualmente.

### ¿Por qué componentes standalone?

- **Mejor mantenibilidad**: Cada componente gestiona sus propias dependencias
- **Reducción del tamaño del bundle**: El tree-shaking es más efectivo
- **Facilidad de testeo**: Los componentes son más fáciles de probar de forma aislada
- **Preparación para el futuro**: Alineado con la dirección estratégica de Angular

### Ejemplo de componente standalone

```typescript
@Component({
  selector: 'app-mi-componente',
  standalone: true, // Indica que es un componente standalone
  imports: [
    CommonModule, 
    ReactiveFormsModule,
    MatButtonModule,
    // Importación directa de otros componentes standalone
    OtroComponenteStandalone
  ],
  template: `...`
})
export class MiComponenteStandalone {
  // implementación
}
```

### Estructura de dependencias actual

En lugar de tener un módulo compartido centralizado que todos importan, ahora cada componente declara explícitamente sus dependencias:

```
ComponenteA
 ├── CommonModule
 ├── ReactiveFormsModule
 └── MatButtonModule

ComponenteB
 ├── CommonModule
 ├── ReactiveFormsModule
 ├── MatCardModule
 └── ComponenteA (standalone)
```

### Migración futura

Para componentes que todavía dependen de módulos compartidos, se recomienda seguir estos pasos para migrarlos:

1. Identificar todas las dependencias directas usadas en la plantilla
2. Añadir las importaciones correspondientes al decorador `@Component`
3. Eliminar la referencia al módulo compartido
4. Añadir `standalone: true` al decorador del componente

### Beneficios en rendimiento

Esta migración ha resultado en:
- Reducción del tamaño final de los bundles
- Carga más rápida de componentes individuales
- Mejor rendimiento de la aplicación en general 

# Documentación de Ciclo de Vida y Extensibilidad

## Gestión del Ciclo de Vida de Componentes

La aplicación utiliza un patrón consistente para la gestión del ciclo de vida de los componentes que simplifica el mantenimiento y evita problemas comunes en las jerarquías de herencia.

### Patrón de Limpieza de Recursos

Para evitar problemas con las llamadas a `super.ngOnDestroy()` en la cadena de herencia, se implementa el siguiente patrón:

1. La clase base proporciona una implementación segura de `ngOnDestroy()` que llama a un método protegido `cleanupResources()`
2. Las clases hijas sobrescriben `cleanupResources()` en lugar de `ngOnDestroy()`
3. Cada clase asegura llamar a `super.cleanupResources()` después de su propia limpieza

```typescript
// En la clase base
@Directive()
export abstract class BaseElementFormComponent implements OnInit, OnDestroy {
  ngOnDestroy(): void {
    this.cleanupResources();
  }
  
  protected cleanupResources(): void {
    // Implementación base vacía
  }
}

// En la clase hija
export class ConcreteElementFormComponent extends BaseElementFormComponent {
  private destroy$ = new Subject<void>();
  
  protected override cleanupResources(): void {
    // Limpieza específica de recursos
    this.destroy$.next();
    this.destroy$.complete();
    
    // Siempre llamar a la implementación base
    super.cleanupResources();
  }
}
```

Este patrón proporciona varias ventajas:
- Evita problemas de compilación relacionados con las implementaciones de ngOnDestroy
- Garantiza una limpieza correcta de recursos en toda la jerarquía
- Proporciona mayor claridad sobre las responsabilidades de limpieza

## Cómo Añadir Nuevos Tipos de Elementos

Para extender el sistema con nuevos tipos de elementos, siga estos pasos:

### 1. Actualizar tipos de elementos

Asegúrese de que el nuevo tipo esté definido en el enum `ElementType` en `/shared/types/network.types.ts`.

### 2. Crear el componente de formulario específico

Cree un nuevo componente que extienda de `BaseElementFormComponent`:

```typescript
@Component({
  selector: 'app-nuevo-tipo-form',
  templateUrl: './nuevo-tipo-form.component.html',
  styleUrls: ['./shared-form-styles.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    // Otros módulos necesarios
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NuevoTipoFormComponent extends BaseElementFormComponent {
  protected override initializeFormGroups(): void {
    if (!this.propertiesGroup) return;
    
    // Inicializar subgrupos específicos para este tipo
    if (!this.getSubgroup('tuSubgrupo')) {
      this.propertiesGroup.addControl('tuSubgrupo', new FormGroup({}));
    }
  }
  
  protected override cleanupResources(): void {
    // Limpieza específica si es necesaria
    super.cleanupResources();
  }
}
```

### 3. Crear la plantilla del formulario

Cree una plantilla HTML específica para el tipo o utilice templates en línea para formularios simples.

### 4. Actualizar el ElementEditorComponent

Incluir el nuevo componente en las importaciones:

```typescript
@Component({
  // ...
  imports: [
    // ... imports existentes
    NuevoTipoFormComponent
  ]
})
```

### 5. Actualizar el HTML del editor para incluir el nuevo tipo

```html
<div [ngSwitch]="elementForm.get('type')?.value">
  <!-- Otros casos existentes -->
  <app-nuevo-tipo-form *ngSwitchCase="ElementType.NUEVO_TIPO" [parentForm]="elementForm"></app-nuevo-tipo-form>
  <!-- Caso por defecto -->
</div>
```

### 6. Añadir validadores específicos en el servicio ElementEditorService

Actualice el método `updateFormForElementType` en `element-editor.service.ts` para agregar validadores específicos para el nuevo tipo.

### 7. Añadir el tipo a la interfaz de selección

Si es necesario, actualice `ElementTypeSelectorComponent` para incluir el nuevo tipo en las opciones disponibles.

## Pruebas de Implementación

Para garantizar que el nuevo tipo de elemento funciona correctamente:

1. Verifique que aparece en el selector de tipos
2. Compruebe que el formulario muestra los campos específicos
3. Valide que se guarda y recupera correctamente
4. Asegúrese de que se visualiza correctamente en el mapa
5. Confirme que la edición de elementos existentes funciona correctamente 