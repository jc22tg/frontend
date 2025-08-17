import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError, BehaviorSubject } from 'rxjs';
import { catchError, tap, map, delay } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';

import { ElementType, CustomLayer } from '../../../shared/types/network.types';
import { CustomLayerFormComponent } from '../components/layer-manager/custom-layer-form.component';
import { environment } from '../../../../environments/environment';
import { LoggerService } from '../../../core/services/logger.service';
import { v4 as uuidv4 } from 'uuid';

/**
 * Servicio para gestionar capas personalizadas (CustomLayer) interactuando con el backend
 * y proveyendo la lista de estas capas a la aplicación.
 * La visibilidad de estas capas es gestionada por NetworkStateService.
 */
@Injectable({
  providedIn: 'root'
})
export class LayerService {
  private apiUrl = '/api/layers';
  private layersCache: CustomLayer[] = [];
  private layersLoaded = false;
  private useMock = environment.useMocks; // Usar la configuración del environment
  
  private layers$ = new BehaviorSubject<CustomLayer[]>([]);
  
  constructor(
    private http: HttpClient,
    private dialog: MatDialog,
    private logger: LoggerService
  ) {
    this.initDefaultLayersOnLoad();
  }

  /**
   * Obtiene todas las capas personalizadas disponibles desde el backend o caché.
   */
  getLayers(): Observable<CustomLayer[]> {
    if (this.layersLoaded && this.layersCache.length > 0) {
      return of([...this.layersCache]);
    }
    
    this.logger.debug('LayerService: Solicitando capas personalizadas.');
    
    // Si useMock está habilitado, usar capas por defecto
    if (this.useMock) {
      this.logger.info('LayerService: Usando datos simulados para capas personalizadas.');
      this.layersCache = this.getDefaultLayers();
      this.layersLoaded = true;
      this.layers$.next([...this.layersCache]);
      return of([...this.layersCache]).pipe(delay(300)); // Simular retraso de red
    }
    
    // Si no usamos mock, hacer la petición HTTP
    return this.http.get<CustomLayer[]>(this.apiUrl).pipe(
      tap(layers => {
        this.layersCache = layers;
        this.layersLoaded = true;
        this.layers$.next([...this.layersCache]);
        this.logger.debug('LayerService: Capas personalizadas cargadas desde API y cacheadas.', layers.length);
      }),
      catchError(error => {
        this.logger.error('LayerService: Error al obtener capas personalizadas desde API.', error);
        
        if (!environment.production) {
          this.logger.warn('LayerService: Usando capas por defecto como fallback.');
          this.layersCache = this.getDefaultLayers();
          this.layersLoaded = true;
          this.layers$.next([...this.layersCache]);
          return of([...this.layersCache]);
        }
        
        return throwError(() => error);
      })
    );
  }

  /**
   * Obtiene un observable que emite la lista actual de capas personalizadas.
   * Dispara una carga inicial si las capas aún no se han obtenido.
   */
  getLayersAsObservable(): Observable<CustomLayer[]> {
    if (!this.layersLoaded) {
      this.getLayers().subscribe({
        error: (err) => this.logger.error('LayerService: Error en la suscripción inicial a getLayers.', err)
      });
    }
    return this.layers$.asObservable();
  }
  
  /**
   * Crea una nueva capa personalizada a través del backend.
   */
  createLayer(layerData: Omit<CustomLayer, 'id' | 'createdAt' | 'updatedAt'>): Observable<CustomLayer> {
    this.logger.debug('LayerService: Creando nueva capa personalizada.', layerData);
    
    // Si useMock está habilitado, simular creación
    if (this.useMock) {
      const now = new Date();
      const newLayer: CustomLayer = {
        ...layerData,
        id: uuidv4(),
        createdAt: now,
        updatedAt: now
      };
      
      this.layersCache = [...this.layersCache, newLayer];
      this.layers$.next([...this.layersCache]);
      
      this.logger.info('LayerService: Capa personalizada creada exitosamente (mock).', newLayer);
      return of(newLayer).pipe(delay(300));
    }
    
    // Si no usamos mock, hacer la petición HTTP
    return this.http.post<CustomLayer>(this.apiUrl, layerData).pipe(
      tap(newLayer => {
        this.layersCache = [...this.layersCache, newLayer];
        this.layers$.next([...this.layersCache]);
        this.logger.info('LayerService: Capa personalizada creada exitosamente.', newLayer);
      }),
      catchError(error => {
        this.logger.error('LayerService: Error al crear capa personalizada.', error, layerData);
        return throwError(() => error);
      })
    );
  }
  
  /**
   * Actualiza una capa personalizada existente a través del backend.
   */
  updateLayer(id: string, layerUpdates: Partial<Omit<CustomLayer, 'id' | 'createdAt' | 'updatedAt'>>): Observable<CustomLayer> {
    this.logger.debug(`LayerService: Actualizando capa personalizada con ID ${id}.`, layerUpdates);
    
    // Si useMock está habilitado, simular actualización
    if (this.useMock) {
      const index = this.layersCache.findIndex(l => l.id === id);
      
      if (index === -1) {
        const error = new Error(`No se encontró la capa con ID ${id}`);
        this.logger.error('LayerService: Error al actualizar capa personalizada (mock).', error);
        return throwError(() => error);
      }
      
      const updatedLayer: CustomLayer = {
        ...this.layersCache[index],
        ...layerUpdates,
        updatedAt: new Date()
      };
      
      this.layersCache[index] = updatedLayer;
      this.layers$.next([...this.layersCache]);
      
      this.logger.info('LayerService: Capa personalizada actualizada exitosamente (mock).', updatedLayer);
      return of(updatedLayer).pipe(delay(300));
    }
    
    // Si no usamos mock, hacer la petición HTTP
    return this.http.patch<CustomLayer>(`${this.apiUrl}/${id}`, layerUpdates).pipe(
      tap(updatedLayer => {
        const index = this.layersCache.findIndex(l => l.id === id);
        if (index !== -1) {
          this.layersCache[index] = updatedLayer;
          this.layers$.next([...this.layersCache]);
          this.logger.info('LayerService: Capa personalizada actualizada exitosamente.', updatedLayer);
        } else {
          this.logger.warn(`LayerService: No se encontró la capa con ID ${id} en caché después de actualizar.`);
          this.forceRefreshLayers();
        }
      }),
      catchError(error => {
        this.logger.error(`LayerService: Error al actualizar capa personalizada con ID ${id}.`, error, layerUpdates);
        return throwError(() => error);
      })
    );
  }
  
  /**
   * Elimina una capa personalizada por su ID a través del backend.
   */
  deleteLayer(id: string): Observable<void> {
    this.logger.debug(`LayerService: Eliminando capa personalizada con ID ${id}.`);
    
    // Si useMock está habilitado, simular eliminación
    if (this.useMock) {
      const index = this.layersCache.findIndex(l => l.id === id);
      
      if (index === -1) {
        const error = new Error(`No se encontró la capa con ID ${id}`);
        this.logger.error('LayerService: Error al eliminar capa personalizada (mock).', error);
        return throwError(() => error);
      }
      
      this.layersCache = this.layersCache.filter(l => l.id !== id);
      this.layers$.next([...this.layersCache]);
      
      this.logger.info(`LayerService: Capa personalizada con ID ${id} eliminada exitosamente (mock).`);
      return of(undefined).pipe(delay(300));
    }
    
    // Si no usamos mock, hacer la petición HTTP
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        this.layersCache = this.layersCache.filter(l => l.id !== id);
        this.layers$.next([...this.layersCache]);
        this.logger.info(`LayerService: Capa personalizada con ID ${id} eliminada exitosamente.`);
      }),
      catchError(error => {
        this.logger.error(`LayerService: Error al eliminar capa personalizada con ID ${id}.`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Fuerza una recarga de las capas desde el backend.
   */
  forceRefreshLayers(): Observable<CustomLayer[]> {
    this.layersLoaded = false;
    this.logger.debug('LayerService: Forzando recarga de capas personalizadas.');
    return this.getLayers();
  }

  /**
   * Abre el diálogo para crear o editar una capa personalizada.
   * @param layer La capa a editar, o undefined para crear una nueva.
   * @returns Observable que emite la capa creada/editada o undefined si se cancela.
   */
  openLayerDialog(layer?: CustomLayer): Observable<CustomLayer | undefined> {
    this.logger.debug('LayerService: Abriendo diálogo de capa personalizada.', layer);
    const dialogRef = this.dialog.open(CustomLayerFormComponent, {
      width: '500px',
      data: { layer: layer ? { ...layer } : undefined }
    });
    
    return dialogRef.afterClosed().pipe(
      tap(result => {
        if (result) {
          this.logger.debug('LayerService: Diálogo de capa personalizada cerrado con resultado.', result);
        } else {
          this.logger.debug('LayerService: Diálogo de capa personalizada cerrado sin resultado (cancelado).');
        }
      })
    );
  }

  /**
   * Inicializa las capas por defecto si no se cargan desde el backend (solo en desarrollo).
   * Este método se llama en el constructor.
   */
  private initDefaultLayersOnLoad(): void {
    if ((this.useMock || !environment.production) && this.layersCache.length === 0 && !this.layersLoaded) {
        this.logger.debug('LayerService: Pre-cargando capas por defecto en modo desarrollo (síncrono).');
        this.layersCache = this.getDefaultLayers();
        this.layers$.next([...this.layersCache]);
    }
  }

  /**
   * Obtiene las capas por defecto para el sistema (usado en desarrollo como fallback).
   */
  private getDefaultLayers(): CustomLayer[] {
    this.logger.debug('LayerService: Obteniendo lista de capas por defecto.');
    return [
      {
        id: 'default-layer-olt',
        name: 'OLTs (Default)',
        type: 'VECTOR' as const,
        visible: true,
        opacity: 1,
        zIndex: 1,
        order: 1,
        color: '#e53935',
        icon: 'router',
        elements: [ElementType.OLT],
        createdAt: new Date(),
        updatedAt: new Date(),
        description: 'Capa por defecto para OLTs'
      },
      {
        id: 'default-layer-ont',
        name: 'ONTs (Default)',
        type: 'VECTOR' as const,
        visible: true,
        opacity: 1,
        zIndex: 2,
        order: 2,
        color: '#43a047',
        icon: 'device_hub',
        elements: [ElementType.ONT],
        createdAt: new Date(),
        updatedAt: new Date(),
        description: 'Capa por defecto para ONTs'
      },
      {
        id: 'default-layer-fdp',
        name: 'FDPs (Default)',
        type: 'VECTOR' as const,
        visible: true,
        opacity: 1,
        zIndex: 3,
        order: 3,
        color: '#2196f3',
        icon: 'settings_input_component',
        elements: [ElementType.FDP],
        createdAt: new Date(),
        updatedAt: new Date(),
        description: 'Capa por defecto para FDPs'
      },
      {
        id: 'default-layer-splitter',
        name: 'Splitters (Default)',
        type: 'VECTOR' as const,
        visible: true,
        opacity: 1,
        zIndex: 4,
        order: 4,
        color: '#ff9800',
        icon: 'call_split',
        elements: [ElementType.SPLITTER],
        createdAt: new Date(),
        updatedAt: new Date(),
        description: 'Capa por defecto para Splitters'
      }
    ];
  }
} 
