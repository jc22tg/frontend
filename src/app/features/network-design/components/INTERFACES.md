# Interfaces entre Componentes

## Diagrama de Dependencias

```
[Network Map] ──────┐
    │              │
    ├─► [Network Toolbar]
    │              │
    ├─► [Element Search]
    │              │
    └─► [Element Quick View]
                    │
[Element Details] ──┘
    │
    ├─► [Element Editor]
    │
    └─► [Element Detail Row]
```

## Interfaces Principales

### 1. Network Map Component
```typescript
interface NetworkMapComponent {
  // Inputs
  elements: NetworkElement[];
  connections: Connection[];
  selectedElement: NetworkElement | null;

  // Outputs
  elementClick: EventEmitter<NetworkElement>;
  elementSelect: EventEmitter<NetworkElement>;
  elementDeselect: EventEmitter<void>;
}
```

### 2. Element Details Component
```typescript
interface ElementDetailsComponent {
  // Inputs
  element: NetworkElement;
  monitoringData: MonitoringData | null;

  // Outputs
  edit: EventEmitter<NetworkElement>;
  delete: EventEmitter<NetworkElement>;
  monitor: EventEmitter<NetworkElement>;
}
```

### 3. Element Editor Component
```typescript
interface ElementEditorComponent {
  // Inputs
  element: NetworkElement | null;
  mode: 'create' | 'edit';

  // Outputs
  save: EventEmitter<NetworkElement>;
  cancel: EventEmitter<void>;
  positionSelect: EventEmitter<void>;
}
```

### 4. Element Quick View Component
```typescript
interface ElementQuickViewComponent {
  // Inputs
  element: NetworkElement;
  showActions: boolean;

  // Outputs
  viewDetails: EventEmitter<NetworkElement>;
  edit: EventEmitter<NetworkElement>;
  delete: EventEmitter<NetworkElement>;
}
```

## Flujos de Comunicación

### 1. Selección de Elemento
```
[Network Map] ──elementClick──► [Element Details]
                    │
                    └─elementSelect──► [Element Quick View]
```

### 2. Edición de Elemento
```
[Element Details] ──edit──► [Element Editor]
                            │
                            └─save──► [Network Map]
```

### 3. Monitoreo de Elemento
```
[Element Details] ──monitor──► [Network Status Widget]
                                │
                                └─update──► [Network Metrics Widget]
```

## Reglas de Comunicación

### 1. Comunicación Padre-Hijo
- Usar Input/Output para comunicación directa
- Documentar tipos de datos
- Validar datos en el componente hijo
- Manejar errores apropiadamente

### 2. Comunicación entre Componentes
- Usar servicios para comunicación indirecta
- Evitar comunicación directa entre hermanos
- Documentar dependencias
- Mantener acoplamiento bajo

### 3. Estado Compartido
- Usar servicios para estado compartido
- Implementar observables para cambios
- Manejar suscripciones apropiadamente
- Limpiar recursos en ngOnDestroy

### 4. Eventos
- Usar EventEmitter para eventos
- Documentar tipos de eventos
- Manejar errores en eventos
- Implementar cancelación de eventos

## Mejores Prácticas

### 1. Diseño de Interfaces
- Interfaces pequeñas y enfocadas
- Documentación clara
- Tipado fuerte
- Validación de datos

### 2. Comunicación
- Minimizar acoplamiento
- Usar servicios apropiadamente
- Documentar flujos
- Manejar errores

### 3. Estado
- Centralizar estado
- Usar observables
- Implementar OnPush
- Optimizar rendimiento

### 4. Testing
- Pruebas de integración
- Mocks de servicios
- Pruebas de eventos
- Cobertura de código 