# Plan de Refactorización para Código Duplicado

Este documento presenta un plan estructurado para eliminar el código duplicado identificado en el proyecto, estableciendo prioridades y pasos concretos.

## Fase 1: Centralización de Constantes y Tipos

### 1.1 Crear archivo de constantes centralizadas

**Archivo**: `frontend/src/app/shared/constants/network.constants.ts`

```typescript
import { ElementType, ElementStatus } from '../types/network.types';

/**
 * Nombres legibles para cada tipo de elemento de red
 */
export const ELEMENT_TYPE_NAMES: Record<ElementType, string> = {
  [ElementType.OLT]: 'Terminal de Línea Óptica',
  [ElementType.ONT]: 'Terminal de Red Óptica',
  [ElementType.FDP]: 'Punto de Distribución de Fibra',
  [ElementType.ODF]: 'Marco de Distribución Óptica',
  [ElementType.EDFA]: 'Amplificador de Fibra',
  [ElementType.SPLITTER]: 'Divisor Óptico',
  // ... continuar con todos los tipos
};

/**
 * Íconos asociados a cada tipo de elemento
 */
export const ELEMENT_TYPE_ICONS: Record<ElementType, string> = {
  [ElementType.OLT]: 'router',
  [ElementType.ONT]: 'device_hub',
  [ElementType.FDP]: 'cable',
  // ... continuar con todos los tipos
};

/**
 * Clases CSS para los diferentes estados de elementos
 */
export const ELEMENT_STATUS_CLASSES: Record<ElementStatus, string> = {
  [ElementStatus.ACTIVE]: 'status-active',
  [ElementStatus.INACTIVE]: 'status-inactive',
  [ElementStatus.MAINTENANCE]: 'status-maintenance',
  // ... continuar con todos los estados
};
```

### 1.2 Centralizar animaciones

**Archivo**: `frontend/src/app/shared/animations/common.animations.ts`

```typescript
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';

export const fadeAnimation = trigger('fadeIn', [
  transition(':enter', [
    style({ opacity: 0 }),
    animate('300ms ease-out', style({ opacity: 1 }))
  ]),
  transition(':leave', [
    animate('300ms ease-in', style({ opacity: 0 }))
  ])
]);

export const scaleAnimation = trigger('scale', [
  transition(':enter', [
    style({ transform: 'scale(0.95)', opacity: 0 }),
    animate('200ms ease-out', style({ transform: 'scale(1)', opacity: 1 }))
  ])
]);

// ... otras animaciones comunes
```

### 1.3 Centralizar configuración

**Archivo**: `frontend/src/app/shared/config/app.config.ts`

```typescript
export const AppConfig = {
  api: {
    baseUrl: '/api/v1',
    timeout: 30000,
    retryAttempts: 3
  },
  map: {
    initialZoom: 6,
    maxZoom: 18,
    minZoom: 4,
    defaultCenter: [0, 0],
    tileServer: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
  },
  cache: {
    defaultExpiryTime: 5 * 60 * 1000, // 5 minutos
    storagePrefix: 'network-app-'
  },
  ui: {
    snackbarDuration: 3000,
    confirmDialogWidth: '400px'
  }
};
```

## Fase 2: Servicios de Utilidades Centralizados

### 2.1 Mejorar ElementService

**Archivo**: `frontend/src/app/features/network-design/services/element.service.ts`

```typescript
import { ELEMENT_TYPE_NAMES, ELEMENT_STATUS_CLASSES } from '../../../shared/constants/network.constants';

@Injectable({
  providedIn: 'root'
})
export class ElementService implements IElementService {
  // Utilizar constantes centralizadas
  
  /**
   * Obtiene el nombre del tipo de elemento en formato legible
   */
  getElementTypeName(type: ElementType): string {
    return ELEMENT_TYPE_NAMES[type] || `Desconocido (${type})`;
  }
  
  /**
   * Obtiene la clase CSS para un estado de elemento
   */
  getElementStatusClass(status: ElementStatus): string {
    return ELEMENT_STATUS_CLASSES[status] || 'status-unknown';
  }
  
  // ... resto del servicio
}
```

### 2.2 Crear servicio de utilidades genéricas

**Archivo**: `frontend/src/app/shared/services/utils.service.ts`

```typescript
@Injectable({
  providedIn: 'root'
})
export class UtilsService {
  /**
   * Formatea un tamaño de archivo en bytes a una representación legible
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
  
  /**
   * Calcula la distancia entre dos puntos geográficos
   */
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    // Implementación del cálculo de distancia (Haversine)
    // ...
    return distance;
  }
  
  /**
   * Valida coordenadas geográficas
   */
  validateCoordinates(lat: number, lon: number): boolean {
    return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
  }
  
  // ... otras funciones de utilidad
}
```

### 2.3 Crear servicio genérico de caché

**Archivo**: `frontend/src/app/shared/services/cache.service.ts`

```typescript
interface CacheOptions {
  expiryTime?: number;
  storageKey?: string;
  useLocalStorage?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class CacheService {
  private memoryCache: Map<string, {data: any, timestamp: number}> = new Map();
  
  constructor(private localStorage: LocalStorageService) {}
  
  /**
   * Guarda un elemento en caché
   */
  set<T>(key: string, data: T, options?: CacheOptions): void {
    const timestamp = Date.now();
    this.memoryCache.set(key, {data, timestamp});
    
    if (options?.useLocalStorage) {
      this.localStorage.set(options.storageKey || key, {
        data,
        timestamp
      });
    }
  }
  
  /**
   * Obtiene un elemento de caché
   */
  get<T>(key: string, options?: CacheOptions): T | null {
    // Primero intentar desde memoria
    const cached = this.memoryCache.get(key);
    
    if (cached) {
      const expiryTime = options?.expiryTime || AppConfig.cache.defaultExpiryTime;
      if (Date.now() - cached.timestamp < expiryTime) {
        return cached.data as T;
      }
      
      // Si expiró, eliminarlo
      this.memoryCache.delete(key);
    }
    
    // Intentar desde localStorage si está habilitado
    if (options?.useLocalStorage) {
      const storageKey = options.storageKey || key;
      const storedItem = this.localStorage.get(storageKey);
      
      if (storedItem) {
        const expiryTime = options?.expiryTime || AppConfig.cache.defaultExpiryTime;
        if (Date.now() - storedItem.timestamp < expiryTime) {
          // Actualizar caché en memoria
          this.memoryCache.set(key, storedItem);
          return storedItem.data as T;
        }
        
        // Si expiró, eliminarlo
        this.localStorage.remove(storageKey);
      }
    }
    
    return null;
  }
  
  /**
   * Elimina un elemento de caché
   */
  remove(key: string, options?: CacheOptions): void {
    this.memoryCache.delete(key);
    
    if (options?.useLocalStorage) {
      this.localStorage.remove(options.storageKey || key);
    }
  }
  
  /**
   * Limpia toda la caché
   */
  clear(options?: {preserveLocalStorage?: boolean}): void {
    this.memoryCache.clear();
    
    if (!options?.preserveLocalStorage) {
      // Limpiar solo las claves relacionadas con la caché
      // ... implementación
    }
  }
}
```

## Fase 3: Simplificación de Componentes

### 3.1 Crear servicio de inicialización de componentes de mapa

**Archivo**: `frontend/src/app/features/network-design/services/map-component-initializer.service.ts`

```typescript
@Injectable({
  providedIn: 'root'
})
export class MapComponentInitializerService {
  constructor(
    private logger: LoggerService,
    private cdr: ChangeDetectorRef,
    private zone: NgZone
  ) {}
  
  /**
   * Inicializa un contenedor de mapa
   */
  initializeMapContainer(
    container: HTMLElement, 
    options: { width?: number, height?: number } = {}
  ): boolean {
    if (!container) {
      this.logger.error('Contenedor no disponible');
      return false;
    }
    
    const rect = container.getBoundingClientRect();
    
    if (rect.width < 10 || rect.height < 10) {
      this.logger.error(`Dimensiones del contenedor incorrectas: ${rect.width}x${rect.height}`);
      return false;
    }
    
    // Establecer dimensiones si se proporcionan
    if (options.width) container.style.width = `${options.width}px`;
    if (options.height) container.style.height = `${options.height}px`;
    
    this.logger.info(`Contenedor inicializado: ${rect.width}x${rect.height}`);
    return true;
  }
  
  /**
   * Muestra error de inicialización
   */
  showInitializationError(
    message: string, 
    component: string,
    snackBar?: MatSnackBar
  ): void {
    this.logger.error(`Error de inicialización en ${component}: ${message}`);
    
    if (snackBar) {
      this.zone.run(() => {
        snackBar.open(`Error: ${message}`, 'Cerrar', {
          duration: AppConfig.ui.snackbarDuration,
          panelClass: 'error-snackbar'
        });
      });
    }
  }
  
  // Otros métodos comunes para inicialización
}
```

### 3.2 Base para componentes de mapas

**Archivo**: `frontend/src/app/features/network-design/components/base/base-map.component.ts`

```typescript
export abstract class BaseMapComponent implements OnInit, OnDestroy {
  protected destroy$ = new Subject<void>();
  protected isLoading = true;
  protected error: string | null = null;
  
  constructor(
    protected logger: LoggerService,
    protected cdr: ChangeDetectorRef,
    protected zone: NgZone,
    protected mapInitializer: MapComponentInitializerService
  ) {}
  
  /**
   * Método abstracto que las subclases deben implementar
   */
  protected abstract initializeComponent(): void;
  
  /**
   * Método común para gestión de errores
   */
  protected handleError(error: any, message: string = 'Error en el componente'): void {
    this.error = message;
    this.logger.error(message, error);
    this.cdr.markForCheck();
  }
  
  /**
   * Método para limpiar recursos
   */
  protected cleanup(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  ngOnInit(): void {
    try {
      this.initializeComponent();
    } catch (error) {
      this.handleError(error, 'Error al inicializar componente');
    }
  }
  
  ngOnDestroy(): void {
    this.cleanup();
  }
}
```

## Fase 4: Uso de Servicios Centralizados

### 4.1 Refactorizar componentes para usar servicios centralizados

Modificar cada componente para:
1. Utilizar las constantes de `network.constants.ts`
2. Utilizar el `ElementService` para nombres de tipos y clases de estado
3. Utilizar las animaciones centralizadas
4. Heredar de `BaseMapComponent` cuando sea apropiado

### 4.2 Refactorizar servicios para usar CacheService

Actualizar servicios como `ElementService`, `NetworkStateService`, etc. para usar el nuevo `CacheService` genérico.

## Plan de Implementación

1. **Semana 1**: Implementar Fase 1 (Constantes y Tipos)
2. **Semana 2**: Implementar Fase 2 (Servicios de Utilidades)
3. **Semana 3**: Implementar Fase 3 (Simplificación de Componentes)
4. **Semana 4**: Implementar Fase 4 (Refactorización Final)

## Métricas de Éxito

- Reducción en número de líneas de código
- Reducción en número de archivos
- Reducción en tiempo de carga inicial
- Mejora en métricas de mantenibilidad del código
- Reducción en número de bugs relacionados con inconsistencias 