# Patrón de Widgets para Network Design

Este documento describe el patrón estándar para la implementación de widgets en el módulo de Network Design. El patrón está diseñado para proporcionar consistencia, mantenibilidad y un buen rendimiento en toda la aplicación.

## Estructura General

El patrón de widgets se basa en una estructura jerárquica:

```
BaseWidgetComponent (clase abstracta)
   ↓
Widget específico (implementación concreta)
   ↓
Contenedor de widgets (coordina múltiples widgets)
   ↓
Página/Dashboard (contiene uno o más contenedores)
```

## Componentes Clave

### BaseWidgetComponent

La clase base que todos los widgets deben extender, proporcionando:

- Gestión de estado (visible, colapsado, error)
- Eventos estándar (`widgetAction`, `widgetError`, `widgetUpdate`)
- Métodos para manejo de errores
- Método `refreshData()` que debe ser implementado por los widgets concretos
- Ciclo de vida común

**Ubicación**: `features/network-design/components/widgets/base/base-widget.component.ts`

### Interfaces de Eventos

Se definen interfaces comunes para todos los eventos de widgets:

- `WidgetEvent`: Base para todos los eventos
- `WidgetActionEvent`: Para acciones iniciadas por el usuario
- `WidgetErrorEvent`: Para errores que ocurren en widgets
- `WidgetUpdateEvent`: Para notificaciones de cambios de estado/datos

**Ubicación**: `features/network-design/components/widgets/container/map-widgets-container/map-widgets-container.component.ts`

### Servicios de Soporte

- `WidgetStateService`: Gestión centralizada del estado de los widgets
- `WidgetDataService`: Obtención de datos para los widgets
- `WidgetRenderService`: Ayuda con la renderización y estilos
- `PerformanceMonitoringService`: Monitoreo de rendimiento de widgets

## Implementación de un Nuevo Widget

Para crear un nuevo widget, sigue estos pasos:

1. **Extiende BaseWidgetComponent**:
   ```typescript
   export class MiNuevoWidgetComponent extends BaseWidgetComponent implements OnInit {
     // implementación específica
   }
   ```

2. **Define propiedades requeridas**:
   ```typescript
   constructor() {
     super();
     this.widgetId = 'mi-nuevo-widget';
     this.title = 'Mi Nuevo Widget';
     this.position = 'bottom-right'; // posición por defecto
   }
   ```

3. **Implementa refreshData()**:
   ```typescript
   override refreshData(): void {
     this.widgetStateService.clearWidgetError(this.widgetId);
     
     // Lógica para cargar datos
     this.widgetDataService.fetchAlgunDato()
       .pipe(takeUntilDestroyed(this.destroyRef))
       .subscribe({
         next: (data) => {
           // Procesar datos
           this.emitUpdateEvent('data', { resultado: data });
         },
         error: (error) => {
           this.handleError('fetchAlgunDato', error);
           this.widgetStateService.registerWidgetError(this.widgetId, {
             code: 'ERROR_CODE',
             message: 'Mensaje de error descriptivo',
             details: error
           });
         }
       });
   }
   ```

4. **Gestiona eventos**:
   - Usa `emitActionEvent()` para notificar acciones del usuario
   - Usa `emitErrorEvent()` para notificar errores específicos
   - Usa `emitUpdateEvent()` para notificar actualizaciones de estado

5. **Implementa la plantilla** con estructura estándar:
   ```html
   <div class="widget-container mi-widget"
        *ngIf="(widgetState$ | async)?.isVisible">
     <!-- Cabecera -->
     <div class="widget-header">
       <h3>{{ title }}</h3>
       <div class="widget-controls">
         <!-- Controles estándar -->
         <button (click)="refreshData()">
           <mat-icon>refresh</mat-icon>
         </button>
         <button (click)="toggleCollapse()" *ngIf="collapsible">
           <mat-icon>{{ isCollapsed ? 'expand_more' : 'expand_less' }}</mat-icon>
         </button>
         <button (click)="closeWidget()" *ngIf="closable">
           <mat-icon>close</mat-icon>
         </button>
       </div>
     </div>
     
     <!-- Contenido (se oculta cuando está colapsado) -->
     <div class="widget-content" *ngIf="!(widgetState$ | async)?.isCollapsed">
       <!-- Componente compartido para errores -->
       <app-error-display 
         *ngIf="(widgetState$ | async)?.hasError"
         [message]="(widgetState$ | async)?.errorInfo?.message"
         [title]="'Error en ' + title"
         (retry)="refreshData()">
       </app-error-display>
       
       <!-- Contenido principal -->
       <div *ngIf="!((widgetState$ | async)?.hasError)">
         <!-- Implementación específica -->
       </div>
     </div>
   </div>
   ```

## Medición de Rendimiento

Para medir el rendimiento de un widget:

```typescript
// En algún método del widget
const endMeasurement = this.performanceMonitoringService.startMeasurement(
  this.constructor.name,
  'update',
  this.widgetId
);

// Cuando termina la operación
endMeasurement();
```

## Buenas Prácticas

1. **Desacoplamiento**: Los widgets no deben depender directamente de otros widgets
2. **Eventos**: Usa eventos para comunicación entre widgets y componentes padres
3. **Manejo de Errores**: Siempre implementa manejo de errores consistente
4. **Pruebas**: Todos los widgets deben tener pruebas unitarias completas
5. **Lazy Loading**: Los widgets complejos deben usar lazy loading cuando sea posible
6. **Rendimiento**:
   - Minimiza las actualizaciones de estado
   - Usa `OnPush` change detection cuando sea apropiado
   - Monitorea el rendimiento con `PerformanceMonitoringService`

## Preguntas Frecuentes

**P: ¿Puedo añadir eventos personalizados a mi widget?**
R: Sí, pero deben extender las interfaces estándar de eventos y seguir las mismas convenciones.

**P: ¿Cómo manejo datos que dependen de otras fuentes?**
R: Usa los servicios de estado o la fachada del dashboard correspondiente.

**P: ¿Debo implementar widgets responsivos?**
R: Sí, todos los widgets deben adaptarse a diferentes tamaños y resoluciones.

## Ejemplos de Referencia

- `NetworkHealthWidgetComponent`: Ejemplo de widget de monitoreo
- `ElementPropertiesWidgetComponent`: Ejemplo de widget con inputs complejos
- `ConnectionStatusWidgetComponent`: Ejemplo de widget con actualización en tiempo real

## Actualizaciones Futuras Planificadas

- Mejoras en el sistema de posicionamiento de widgets
- Temas personalizables para widgets
- Sistema de plantillas para configuración de dashboards 