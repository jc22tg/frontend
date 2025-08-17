# Guía de Migración a Componentes Standalone

Este documento proporciona instrucciones para migrar los componentes, directivas y pipes del proyecto a la arquitectura standalone de Angular.

## ¿Qué son los componentes standalone?

Los componentes standalone son una característica introducida en Angular 14 que permite crear componentes, directivas y pipes sin la necesidad de declararlos en un NgModule. Esto simplifica la arquitectura, reduce la complejidad y mejora la carga perezosa (lazy loading).

## Pasos para migrar un componente a standalone

### 1. Actualizar el decorador del componente

```typescript
@Component({
  selector: 'app-mi-componente',
  templateUrl: './mi-componente.component.html',
  styleUrls: ['./mi-componente.component.scss'],
  // Agregar estas propiedades:
  standalone: true,
  imports: [
    // Importar módulos o componentes que se usan en la plantilla
    CommonModule,
    RouterModule,
    // Otros componentes standalone
    OtroComponenteStandalone
  ]
})
```

### 2. Eliminar el módulo asociado (si existe)

Si el componente tenía un módulo específico (como `MiComponenteModule`), generalmente se puede eliminar después de convertir el componente a standalone.

### 3. Actualizar las importaciones en los módulos padre

Si otros módulos importaban el módulo del componente ahora eliminado, deben actualizarse para importar el componente standalone directamente:

```typescript
@NgModule({
  imports: [
    // Antes: MiComponenteModule
    // Ahora:
    MiComponenteComponent
  ]
})
```

### 4. Actualizar las referencias en las plantillas

No se requieren cambios en las plantillas, las etiquetas HTML siguen funcionando igual.

## Estrategia de migración para el proyecto

1. **Enfoque Bottom-Up**: Migrar primero los componentes de nivel más bajo (componentes leaf) y avanzar hacia arriba.
2. **Migración gradual**: No es necesario convertir todo a standalone a la vez.
3. **Prioridad**: Comenzar por componentes reutilizables y widgets.

## Plantilla para reportar progreso

Al completar la migración de un componente, actualizar el archivo `migration-progress.md` con:

```markdown
- ✅ NombreComponente: Migrado a standalone
```

Y añadir detalles en la sección "Migración a Standalone".

## Errores comunes

1. **Olvidar importar CommonModule**: Muchas directivas como `ngIf`, `ngFor` están en CommonModule.
2. **Olvidar importar componentes usados en la plantilla**: Todos los componentes, directivas y pipes usados directamente en la plantilla deben importarse.
3. **Importaciones circulares**: Si dos componentes se referencian mutuamente, puede ser necesario usar `forwardRef()` de Angular.

## Comandos útiles

Angular CLI proporciona comandos para ayudar con la migración:

```bash
# Generar un nuevo componente standalone
ng g c ruta/componente --standalone

# Convertir un módulo existente a standalone (Angular 15+)
ng g @angular/core:standalone
```

## Recursos adicionales

- [Documentación oficial de Angular sobre standalone components](https://angular.io/guide/standalone-components)
- [Guía de migración a standalone](https://angular.io/guide/standalone-migration) 