# Guía de Calidad de Código para Network Map

Esta guía proporciona recomendaciones para mejorar la calidad del código en el proyecto Network Map, con un enfoque en la reducción del uso de `any`, la eliminación de código no utilizado y la mejora de la accesibilidad.

## Índice

1. [Tipado estricto](#tipado-estricto)
2. [Eliminación de código no utilizado](#eliminación-de-código-no-utilizado)
3. [Mejora de la accesibilidad](#mejora-de-la-accesibilidad)
4. [Herramientas y utilidades](#herramientas-y-utilidades)
5. [Proceso de revisión de código](#proceso-de-revisión-de-código)

## Tipado estricto

### Evitar el uso de `any`

El tipo `any` evita las comprobaciones de tipo de TypeScript, lo que puede llevar a errores en tiempo de ejecución. Reemplaza `any` con tipos más específicos:

```typescript
// ❌ Mal
function procesarDatos(datos: any): any {
  return datos.map(item => item.valor);
}

// ✅ Bien
interface Dato {
  valor: number;
  // otras propiedades...
}

function procesarDatos(datos: Dato[]): number[] {
  return datos.map(item => item.valor);
}
```

### Alternativas a `any`

- **`unknown`**: Cuando no conoces el tipo pero quieres mantener la seguridad de tipos
- **Tipos genéricos**: Para funciones que trabajan con múltiples tipos
- **Tipos de unión**: Cuando un valor puede ser de varios tipos específicos
- **Interfaces o tipos personalizados**: Para estructuras de datos complejas

```typescript
// Usando unknown (requiere comprobación de tipo)
function procesarEntrada(entrada: unknown): string {
  if (typeof entrada === 'string') {
    return entrada.toUpperCase();
  }
  return String(entrada);
}

// Usando genéricos
function primero<T>(array: T[]): T | undefined {
  return array[0];
}

// Usando tipos de unión
function formatearValor(valor: string | number | boolean): string {
  return String(valor);
}
```

### Habilitar comprobaciones estrictas

En `tsconfig.json`, habilita las siguientes opciones:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true
  }
}
```

## Eliminación de código no utilizado

### Importaciones no utilizadas

Las importaciones no utilizadas aumentan el tamaño del bundle y dificultan la lectura del código.

```typescript
// ❌ Mal
import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
// Solo se usan Component, Input y OnInit

// ✅ Bien
import { Component, Input, OnInit } from '@angular/core';
```

### Código muerto

Elimina código que nunca se ejecuta o variables que no se utilizan:

```typescript
// ❌ Mal
function calcularTotal(items: Item[]): number {
  let total = 0;
  let contador = 0; // Esta variable nunca se usa
  
  for (const item of items) {
    total += item.precio;
  }
  
  if (false) { // Este bloque nunca se ejecuta
    console.log('Esto nunca se mostrará');
  }
  
  return total;
}

// ✅ Bien
function calcularTotal(items: Item[]): number {
  let total = 0;
  
  for (const item of items) {
    total += item.precio;
  }
  
  return total;
}
```

### Herramientas para detectar código no utilizado

- **ESLint** con reglas como `no-unused-vars`, `no-unreachable`, etc.
- **Servicio CodeQualityService** incluido en el proyecto

## Mejora de la accesibilidad

### Manejo de eventos de teclado

Asegúrate de que todos los elementos interactivos sean accesibles mediante teclado:

```typescript
// ❌ Mal
<div (click)="onClick()">Haz clic aquí</div>

// ✅ Bien
<button (click)="onClick()" (keydown.enter)="onClick()">Haz clic aquí</button>
```

### Atributos ARIA

Utiliza atributos ARIA para mejorar la accesibilidad:

```html
<!-- ❌ Mal -->
<div class="menu">
  <div class="menu-item" (click)="seleccionar('item1')">Item 1</div>
  <div class="menu-item" (click)="seleccionar('item2')">Item 2</div>
</div>

<!-- ✅ Bien -->
<div class="menu" role="menu" aria-label="Menú principal">
  <button class="menu-item" role="menuitem" (click)="seleccionar('item1')" (keydown.enter)="seleccionar('item1')" tabindex="0">Item 1</button>
  <button class="menu-item" role="menuitem" (click)="seleccionar('item2')" (keydown.enter)="seleccionar('item2')" tabindex="0">Item 2</button>
</div>
```

### Contraste y visibilidad

- Asegúrate de que el texto tenga suficiente contraste con el fondo
- Proporciona indicadores visuales claros para el foco
- No dependas solo del color para transmitir información

```css
/* ✅ Bien */
:focus {
  outline: 2px solid #4a90e2;
  outline-offset: 2px;
}

.error-message {
  color: #d32f2f; /* Rojo para errores */
  border: 1px solid #d32f2f; /* No solo depende del color */
  padding-left: 20px;
  background: url('error-icon.svg') no-repeat left center; /* Icono adicional */
}
```

## Herramientas y utilidades

### CodeQualityService

Hemos creado un servicio `CodeQualityService` que ayuda a detectar:

- Importaciones no utilizadas
- Usos de `any`
- Problemas de accesibilidad

Ejemplo de uso:

```typescript
import { CodeQualityService } from '../../shared/services/code-quality.service';

// En un componente o servicio
constructor(private codeQualityService: CodeQualityService) {
  const fileContent = '...'; // Contenido del archivo a analizar
  const analysis = this.codeQualityService.analyzeFile(fileContent);
  
  console.log('Importaciones no utilizadas:', analysis.unusedImports);
  console.log('Usos de any:', analysis.anyUsages);
  console.log('Problemas de accesibilidad:', analysis.accessibilityIssues);
}
```

### ESLint y TSLint

Configura ESLint con reglas estrictas para detectar problemas:

```bash
ng lint --fix  # Corrige automáticamente problemas simples
```

## Proceso de revisión de código

Para mantener la calidad del código, sigue este proceso:

1. **Antes de crear un PR**:
   - Ejecuta `ng lint` y corrige los errores
   - Verifica la accesibilidad de los componentes nuevos o modificados
   - Elimina código no utilizado e importaciones innecesarias
   - Reemplaza usos de `any` con tipos específicos

2. **Durante la revisión de código**:
   - Verifica que no se introduzcan nuevos usos de `any`
   - Comprueba la accesibilidad de los componentes
   - Asegúrate de que no haya código muerto o importaciones no utilizadas

3. **Refactorización gradual**:
   - Identifica áreas con muchos usos de `any` y planifica su refactorización
   - Prioriza componentes y servicios críticos
   - Documenta las decisiones de diseño y los tipos personalizados

---

Siguiendo estas recomendaciones, mejoraremos la calidad del código, reduciremos los errores y haremos nuestra aplicación más accesible para todos los usuarios. 