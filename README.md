# Sistema de Mapas de Red

## Visión General
Este módulo proporciona una solución completa para visualizar y gestionar mapas de red, con capacidades para mostrar, editar y analizar elementos de red en un entorno geoespacial.

## Estructura de Componentes

### Componentes Principales

#### MapContainerComponent
- **Función**: Componente contenedor principal que orquesta todos los aspectos de la visualización del mapa.
- **Ubicación**: `frontend/src/app/features/network-design/components/map-container`
- **Responsabilidades**:
  - Inicialización del mapa (Leaflet o componentes standalone)
  - Coordinación de interacciones entre herramientas y elementos
  - Gestión de eventos del usuario (click, hover, etc.)
  - Integración con servicios de estado y datos

#### NetworkToolbarComponent
- **Función**: Barra de herramientas principal para interacción con el mapa.
- **Ubicación**: `frontend/src/app/features/network-design/components/network-toolbar`
- **Responsabilidades**:
  - Proporcionar controles para herramientas de mapa (zoom, pan, medición, etc.)
  - Gestionar selección y creación de elementos
  - Controlar visibilidad de paneles y widgets
  - Exportación e importación de datos

#### LayerControlComponent
- **Función**: Control de capas del mapa y su visibilidad.
- **Ubicación**: `frontend/src/app/features/network-design/components/layer-control`
- **Responsabilidades**:
  - Mostrar/ocultar capas del mapa
  - Organizar capas en grupos lógicos
  - Proporcionar información sobre cada capa

#### ElementsPanelComponent
- **Función**: Panel para gestionar elementos de red.
- **Ubicación**: `frontend/src/app/features/network-design/components/map-container/components/elements-panel`
- **Responsabilidades**:
  - Listar elementos disponibles por tipo
  - Permitir búsqueda y filtrado de elementos
  - Facilitar la adición de nuevos elementos al mapa

### Servicios Principales

#### MapStateManagerService
- **Función**: Gestiona el estado global del mapa.
- **Ubicación**: `frontend/src/app/features/network-design/services/map/map-state-manager.service.ts`
- **Responsabilidades**:
  - Mantener el estado actual del mapa (zoom, centro, etc.)
  - Gestionar la herramienta activa
  - Proporcionar métodos para actualizar el estado

#### MapToolsService
- **Función**: Proporciona funcionalidades para las herramientas del mapa.
- **Ubicación**: `frontend/src/app/features/network-design/services/map/map-tools.service.ts`
- **Responsabilidades**:
  - Implementar lógica para herramientas específicas (medición, conexión, etc.)
  - Gestionar comportamiento de herramientas

#### MapElementManagerAdapter
- **Función**: Gestiona los elementos del mapa.
- **Ubicación**: `frontend/src/app/features/network-design/services/map/standalone-adapters/map-element-manager-adapter.ts`
- **Responsabilidades**:
  - Selección de elementos
  - Creación y eliminación de elementos
  - Modificación de propiedades de elementos

## Flujo de Datos y Comunicación

### Flujo de Eventos
1. **Usuario → NetworkToolbar**: El usuario interactúa con los botones de la barra de herramientas.
2. **NetworkToolbar → MapContainer**: La barra emite eventos (ej: `toggleLayer`, `addElement`).
3. **MapContainer → Servicios**: El contenedor procesa los eventos y llama a los servicios adecuados.
4. **Servicios → Estado**: Los servicios actualizan el estado global.
5. **Estado → Componentes**: Los componentes reaccionan a los cambios de estado (patrón Observable).

### Diagrama de Interacción
```
Usuario → NetworkToolbar → MapContainer → Servicios → Estado
                                     ↓
                        Componentes visuales ← Estado
```

## Arquitectura de Componentes Standalone
El sistema está migrando hacia una arquitectura de componentes standalone que permite:
- Mayor modularidad y reutilización
- Mejor rendimiento
- Facilidad de testing unitario

### Modo Legacy vs. Standalone
- **Legacy**: Basado en Leaflet directamente integrado en el DOM.
- **Standalone**: Componentes Angular independientes con encapsulación propia.

## Guía de Desarrollo

### Añadir una Nueva Herramienta
1. Registrar la herramienta en `ToolType` (map-state-manager.service.ts)
2. Añadir botón en network-toolbar.component.html
3. Implementar la lógica en el servicio correspondiente
4. Conectar los eventos en MapContainer

### Añadir un Nuevo Tipo de Elemento
1. Definir la interfaz del elemento en network.types.ts
2. Crear componentes específicos para ese elemento
3. Registrar el tipo en los servicios de gestión de elementos
4. Añadir soporte visual en el mapa

## Accesibilidad

El sistema de mapas de red ha sido diseñado teniendo en cuenta las mejores prácticas de accesibilidad:

### Soporte para lectores de pantalla
- Todos los componentes utilizan atributos ARIA (`role`, `aria-label`, `aria-pressed`, etc.)
- Los iconos puramente decorativos están marcados con `aria-hidden="true"`
- Las acciones importantes son anunciadas usando regiones `aria-live`
- Estructura semántica con roles adecuados (`toolbar`, `group`, etc.)

### Navegación por teclado
- Todos los elementos interactivos son accesibles mediante teclado
- Atajos de teclado para operaciones comunes:
  - `Ctrl+Z`: Zoom in (acercar)
  - `Ctrl+X`: Zoom out (alejar)
  - `Ctrl+C`: Centrar mapa
  - `Esc`: Cancelar selección actual
  - `Ctrl+F`: Mostrar/ocultar buscador
  - `Ctrl+H`: Mostrar ayuda

### Contraste y visibilidad
- Colores con suficiente contraste para todos los textos y elementos interactivos
- Elementos interactivos con estados visibles (foco, selección, hover)
- Tamaño de texto ajustable y soporte para zoom del navegador

### Herramientas de accesibilidad
Se recomienda probar regularmente la aplicación con las siguientes herramientas:
- Lectores de pantalla (NVDA, JAWS, VoiceOver)
- Pruebas de contraste (WCAG 2.1 AA/AAA)
- Navegación exclusivamente por teclado
- Lighthouse (Chrome DevTools)

### Recursos adicionales
- [WCAG 2.1 Guidelines](https://www.w3.org/TR/WCAG21/)
- [Angular Accessibility Guide](https://angular.io/guide/accessibility)
- [Material Design Accessibility](https://material.io/design/usability/accessibility.html)

## Mejores Prácticas
- Usar el patrón Observable para comunicación entre componentes
- Mantener la lógica de negocio en servicios, no en componentes
- Seguir el enfoque de componentes presentacionales y contenedores
- Documentar APIs y componentes importantes
- Escribir tests unitarios para componentes críticos

## Pruebas Unitarias
Ejecutar `ng test` para iniciar pruebas unitarias con Karma.

# Frontend

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 19.2.6.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

## Arquitectura del Mapa de Red

### Componentes Consolidados

Para mejorar el rendimiento y eliminar duplicación de código, se ha consolidado la funcionalidad del mapa en:

1. **MapContainerComponent**: Componente principal que gestiona la visualización y la interacción con el mapa
2. **NetworkMapComponent**: Componente de presentación que maneja la renderización del mapa
3. **MapFacadeService**: Servicio que centraliza la lógica de gestión del mapa

### Servicios relacionados con el mapa

- **MapFacadeService**: Fachada que centraliza toda la lógica relacionada con la gestión del mapa
- **NetworkStateService**: Gestiona el estado global de la red
- **LayerManagerService**: Gestiona las capas del mapa
- **ElementService**: Gestiona los elementos de la red
- **MapEventsService**: Centraliza los eventos del mapa

La estructura anterior reemplaza la implementación anterior que utilizaba dos componentes separados (NetworkMapPageComponent y MapContainerComponent) con funcionalidades duplicadas.

## Herramientas para mejorar la calidad del código

Hemos añadido varias herramientas para ayudar a mejorar la calidad del código, reducir el uso de `any`, eliminar código no utilizado y mejorar la accesibilidad.

### Reducción de 'any'

Para eliminar gradualmente el uso de `any` en el proyecto, ejecuta:

```bash
# Analizar archivos para detectar usos de 'any'
node scripts/fix-any-types.js

# Corregir automáticamente los usos de 'any' cuando sea posible
node scripts/fix-any-types.js --fix

# Analizar solo una carpeta específica
node scripts/fix-any-types.js --path=src/app/features/network-design
```

### Eliminación de importaciones no utilizadas

Para detectar y eliminar importaciones no utilizadas:

```bash
# Analizar archivos para detectar importaciones no utilizadas
node scripts/unused-imports-finder.js

# Eliminar automáticamente las importaciones no utilizadas
node scripts/unused-imports-finder.js --fix

# Analizar solo una carpeta específica
node scripts/unused-imports-finder.js --path=src/app/features/network-design
```

### Mejora de accesibilidad

Para mejorar la accesibilidad de los componentes:

```bash
# Analizar archivos para detectar problemas de accesibilidad
node scripts/accessibility-check.js

# Corregir automáticamente los problemas de accesibilidad cuando sea posible
node scripts/accessibility-check.js --fix

# Analizar solo una carpeta específica
node scripts/accessibility-check.js --path=src/app/features/network-design
```

### Uso de tipos mejorados

También hemos creado el servicio `CodeQualityService` que puede ayudar a analizar el código en tiempo de ejecución. Ejemplo de uso:

```typescript
import { CodeQualityService } from '../../shared/services/code-quality.service';

constructor(private codeQualityService: CodeQualityService) {
  // Analizar un archivo o texto
  const analysis = this.codeQualityService.analyzeFile(fileContent);
  
  // Ver resultados
  console.log('Importaciones no utilizadas:', analysis.unusedImports);
  console.log('Usos de any:', analysis.anyUsages);
  console.log('Problemas de accesibilidad:', analysis.accessibilityIssues);
}
```

Consulta la [Guía de Calidad de Código](docs/code-quality-guide.md) para obtener más información sobre cómo mejorar la calidad del código en el proyecto.
