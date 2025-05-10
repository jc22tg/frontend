# Componente NetworkMapPageComponent

Este componente implementa la **página principal del mapa de red** siguiendo el patrón Contenedor/Presentación (Container/Presentational).

## Patrón Contenedor/Presentación

Este componente actúa como un **contenedor** que:

1. Gestiona el estado y la lógica de negocio
2. Se comunica con los servicios del sistema
3. Maneja la navegación y los flujos de trabajo
4. Delega la visualización al componente presentacional

## Responsabilidades

- Coordinar la comunicación entre el componente de mapa (`NetworkMapComponent`) y los servicios
- Manejar las acciones del usuario (selección, edición, eliminación)
- Actualizar el estado global a través de `NetworkStateService`
- Dirigir la navegación en respuesta a acciones del usuario

## Estructura

```
NetworkMapPageComponent (Contenedor)
   |
   ├── NetworkMapComponent (Presentación)
   |      ├── Responsable de la renderización visual
   |      ├── Interacciones directas con el usuario
   |      └── Emite eventos que el contenedor gestiona
   |
   ├── NetworkStateService (Estado)
   |      └── Gestiona el estado global de la aplicación
   |
   └── Router (Navegación)
          └── Gestiona la navegación
```

## Flujo de Datos

1. **Entrada**: El contenedor configura las propiedades del componente visual
   - `[zoomLevel]="zoomLevel"`
   - `[isDarkMode]="isDarkMode"`
   - `[currentTool]="currentTool"`
   - `[activeLayers]="activeLayers"`

2. **Salida**: El componente visual emite eventos
   - `(elementSelect)="handleElementSelected($event)"`
   - `(connectionSelect)="handleConnectionSelected($event)"`
   - `(editElementRequest)="handleEditElementRequest($event)"`

3. **Acciones**: El contenedor procesa estos eventos
   - Actualiza el estado global
   - Navega a otras vistas
   - Registra actividades en el historial

## Beneficios

- **Separación de responsabilidades**: Cada componente tiene una función clara
- **Mejor testabilidad**: Es más fácil probar componentes con responsabilidades únicas
- **Reutilización**: Los componentes presentacionales pueden usarse en diferentes contextos
- **Mantenibilidad**: Los cambios están localizados

## Uso

Este componente se carga a través de lazy loading en la ruta `/network-design/map` definida en `network-design.routes.ts`. 