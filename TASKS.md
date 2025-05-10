# Tareas Pendientes

## Refactorización y Limpieza

### Alta Prioridad

- [ ] Eliminar archivos de redirección en `/src/app/features/network-design/components/element-type-form/` después de confirmar que todas las importaciones han sido actualizadas a la nueva ubicación (`../element-editor/element-type-form/`).
- [ ] Actualizar cualquier referencia pendiente a la antigua ubicación de los componentes de formulario.

### Media Prioridad

- [ ] Revisar y eliminar código comentado o no utilizado.
- [ ] Mejorar la cobertura de pruebas unitarias para los componentes refactorizados.

## Mejoras Técnicas

- [ ] Completar la migración a componentes standalone en todo el proyecto.
- [ ] Mejorar la documentación del código, especialmente en las clases base y servicios compartidos.

## Notas de Refactorización

### Consolidación de Componentes de Formulario (Completado)

Se ha consolidado la estructura de directorios para los componentes de formulario de tipos de elementos:

- Ubicación consolidada: `/src/app/features/network-design/components/element-editor/element-type-form/`
- Se añadió un archivo de redirección en la ubicación anterior para facilitar la transición.
- Se actualizó el componente base con un patrón mejorado para la limpieza de recursos.
- Se estandarizaron las importaciones mediante el uso del módulo compartido.

**Importante**: Cualquier nuevo componente de formulario debe agregarse directamente en la ubicación consolidada.

### Mejora de Componentes Relacionados (En Progreso)

Se ha actualizado el componente `ElementTypeSelectorComponent` para seguir los mismos patrones de diseño:

- Ahora extiende de `BaseElementFormComponent` para mantener consistencia.
- Implementa el patrón de limpieza de recursos mediante `cleanupResources()`.
- Se mejoró la documentación JSDoc siguiendo los estándares del proyecto.
- Se añadió gestión de suscripciones con `takeUntil` para prevenir fugas de memoria.

Se ha actualizado el componente `HelpDialogComponent` para seguir las mejores prácticas del proyecto:

- Se implementaron interfaces `OnInit` y `OnDestroy` para gestionar correctamente el ciclo de vida.
- Se añadió estrategia `ChangeDetectionStrategy.OnPush` para mejorar el rendimiento.
- Se implementó el patrón de limpieza de recursos con `destroy$` y `takeUntil`.
- Se crearon interfaces tipadas para mejorar la legibilidad y mantenibilidad.
- Se corrigió la importación de `ElementType` para usar la ruta correcta.
- Se mejoró considerablemente la documentación JSDoc para todos los métodos y propiedades.

Se ha actualizado el componente `LayerSettingsComponent` para mejorar su consistencia:

- Se añadió estrategia `ChangeDetectionStrategy.OnPush` para mejorar el rendimiento.
- Se implementó correctamente la detección de cambios con `markForCheck()` en los puntos necesarios.
- Se extrajeron constantes a un objeto centralizado `CONSTANTS` para evitar valores hardcodeados.
- Se mejoró significativamente la documentación JSDoc con descripciones detalladas, ejemplos y tipos de retorno.
- Se reforzó el tipado con tipos de retorno explícitos en los métodos.
- Se añadieron mejores descripciones a las interfaces y propiedades de la clase.
- Se actualizaron las referencias a CSS para usar variables cuando fue posible.

Componentes pendientes de revisión:
- [ ] MapPositionSelectorComponent
- [ ] ElementPropertyEditorComponent
- [ ] ConnectionSelectorComponent 