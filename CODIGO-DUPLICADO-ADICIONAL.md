# Código Duplicado Adicional

Después de analizar el código, se han identificado las siguientes áreas de duplicación que requieren refactorización:

## 1. Métodos `getElementTypeName` en múltiples componentes

Este método está implementado de forma redundante en múltiples lugares:

| Ubicación | Implementación |
|-----------|----------------|
| ElementService | `getElementTypeName(type: ElementType): string { return this.elementTypes.get(type) || 'Desconocido'; }` |
| MapExportService | Define un método privado con una implementación diferente |
| ElementSearchWidgetComponent | Implementación completa con un mapeo propio de tipos |
| BatchElementEditorComponent | Implementa su propia versión con un switch-case |
| ElementCompatibilityListComponent | Implementa versión propia con switch-case |
| ElementQuickViewComponent | Implementación con un objeto literal extenso |
| NetworkMapPageComponent | Implementación con switch-case simple |
| LayerManagerService | Implementación privada diferente |

**Solución recomendada**: Centralizar en ElementService y reutilizarlo en todos los componentes.

## 2. Constantes de tipos de elementos duplicadas

Los tipos de elementos se definen y mapean múltiples veces:

| Ubicación | Implementación |
|-----------|----------------|
| ElementService | `private elementTypes = new Map<ElementType, string>([...])` |
| NetworkToolbarComponent | Define `layers` y `additionalLayers` con información similar |
| MapExportService | `const typeNames: Record<string, string> = {...}` |
| ElementQuickViewComponent | `const typeNames: Record<string, string> = {...}` |

**Solución recomendada**: Crear un archivo de constantes centralizadas que contenga estos mapeos.

## 3. Manejo del estado de elementos

El estado de los elementos (activo, inactivo, etc.) se gestiona de manera redundante:

| Ubicación | Implementación |
|-----------|----------------|
| ElementService | `private statusClasses = new Map<ElementStatus, string>([...])` |
| Varios componentes | Implementaciones propias para mapear estados a clases CSS |

**Solución recomendada**: Centralizar en un servicio de utilidades y reutilizar.

## 4. Inicialización de componentes

Hay patrones duplicados en la inicialización de componentes, especialmente en:

1. **MapContainerComponent**:
   - Inicialización del contenedor
   - Verificación de dimensiones
   - Manejo de errores

2. **NetworkMapComponent**:
   - Lógica similar de inicialización y verificación

**Solución recomendada**: Extraer a un servicio de inicialización de componentes o una clase base.

## 5. Funciones de utilidad duplicadas

Se identificaron varias funciones de utilidad implementadas múltiples veces:

1. **Formateo de unidades**
2. **Cálculos de distancia**
3. **Conversiones de formato**
4. **Validación de coordenadas**

**Solución recomendada**: Crear un `UtilsService` que centralice estas funciones.

## 6. Animaciones duplicadas

Múltiples componentes definen las mismas animaciones:

```typescript
trigger('fadeIn', [
  transition(':enter', [
    style({ opacity: 0 }),
    animate('300ms ease-out', style({ opacity: 1 }))
  ])
])
```

**Solución recomendada**: Centralizar las animaciones en un archivo de constantes.

## 7. Constantes de configuración

Varios servicios definen sus propias constantes para timeouts, configuraciones, etc.

**Solución recomendada**: Centralizar en un objeto de configuración global.

## 8. Lógica de cacheo en servicios

Varios servicios implementan su propia lógica de cache con estructuras similares.

**Solución recomendada**: Crear un servicio genérico de cache que pueda ser utilizado por otros servicios. 