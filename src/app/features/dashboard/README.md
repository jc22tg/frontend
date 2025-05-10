# Módulo Dashboard

## Estructura del módulo

Este módulo contiene los componentes y servicios necesarios para la funcionalidad del dashboard principal de la aplicación de Network Map.

## Componentes

### Componente Principal

El componente principal del dashboard se encuentra en:
```
/features/dashboard/dashboard-layout.component.ts
```

Este componente implementa un patrón Facade para comunicarse con los servicios, tiene una interfaz moderna y funcionalidades avanzadas como:
- Personalización de secciones
- Exportación de datos
- Cambio de períodos de tiempo
- Vista compacta adaptable a diferentes tamaños de pantalla
- Integración completa con el componente QuickNavMenu

### Patrón de Diseño

El componente `DashboardLayoutComponent` sigue los siguientes patrones:

1. **Patrón Facade**:
   - Utiliza `DashboardFacade` para simplificar las interacciones con múltiples servicios
   - Proporciona una API unificada para los widgets del dashboard

2. **Patrón de Componente Contenedor**:
   - Actúa como contenedor para widgets más pequeños y especializados
   - Coordina la comunicación entre componentes

3. **Diseño Responsivo**:
   - Adaptación automática a diferentes tamaños de pantalla
   - Usa BreakpointObserver para detectar cambios en la pantalla

## Renovación y Estándares

Este componente ha sido renombrado de `DashboardComponent` a `DashboardLayoutComponent` como parte de una iniciativa para:

1. **Mejorar la consistencia de nomenclatura** en toda la aplicación
2. **Hacer más explícita la función** principal de cada componente
3. **Seguir patrones estándar** de Angular para facilitar mantenimiento

## Componentes Auxiliares

Los siguientes componentes son utilizados por el dashboard principal:

- **QuickNavMenuComponent**: Menú de navegación rápida que se adapta según el espacio disponible
- **StatCardsComponent**: Tarjetas de estadísticas principales
- **RecentActivitiesComponent**: Muestra las actividades recientes en el sistema
- **PerformanceMetricsComponent**: Visualiza métricas de rendimiento del sistema
- **SystemAlertsComponent**: Muestra las alertas del sistema

## Configuración de Rutas

Las rutas están configuradas en `dashboard.routes.ts` utilizando el nuevo nombre del componente:

```typescript
import { Routes } from '@angular/router';
import { DashboardLayoutComponent } from './dashboard-layout.component';

export const DASHBOARD_ROUTES: Routes = [
  {
    path: '',
    component: DashboardLayoutComponent
  }
];
```

Este enfoque de rutas permite:
- Carga perezosa (lazy loading) del módulo
- Integración fluida con el sistema de rutas principal
- Facilidad para añadir subrutas en el futuro

## Migración

Si estás utilizando el componente simple de dashboard, debes migrar al componente principal. Sigue estos pasos:

1. Actualiza cualquier importación de:
   ```typescript
   import { DashboardComponent } from './features/dashboard/components/dashboard/dashboard.component';
   ```
   A:
   ```typescript
   import { DashboardComponent } from './features/dashboard/dashboard-layout.component';
   ```

2. Si estás extendiendo o modificando la funcionalidad del dashboard, hazlo sobre el componente principal
3. Asegúrate de que todas las rutas apunten al componente principal

## Notas para Desarrolladores

- No uses el componente simple de dashboard en nuevas implementaciones
- El componente principal usa el patrón Facade a través de `DashboardFacade`
- La UI es completamente responsive con diseño adaptable a móviles 