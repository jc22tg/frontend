import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable, of, switchMap, map } from 'rxjs';
import { NetworkStateService } from './network-state.service';
import { ElementService } from './element.service';
import { LoggerService } from '../../../core/services/logger.service';
import { CustomLayer, NetworkElement, ElementType } from '../../../shared/types/network.types';
import { CustomLayerFormComponent } from '../components/network-map/layer-manager/custom-layer-form.component';

@Injectable({
  providedIn: 'root'
})
export class LayerService {
  
  constructor(
    private networkStateService: NetworkStateService,
    private elementService: ElementService,
    private logger: LoggerService,
    private dialog: MatDialog
  ) {}
  
  /**
   * Obtiene todas las capas personalizadas
   */
  getAllLayers(): CustomLayer[] {
    return this.networkStateService.getCustomLayers();
  }
  
  /**
   * Obtiene las capas personalizadas activas
   */
  getActiveLayers(): CustomLayer[] {
    return this.networkStateService.getActiveCustomLayers();
  }
  
  /**
   * Obtiene una capa por su ID
   */
  getLayerById(id: string): CustomLayer | undefined {
    return this.networkStateService.getCustomLayerById(id);
  }
  
  /**
   * Crea una nueva capa personalizada
   */
  createLayer(layer: Omit<CustomLayer, 'id' | 'createdAt'>): string {
    const id = this.networkStateService.createCustomLayer(layer);
    this.logger.info(`Capa personalizada creada con ID: ${id}`);
    return id;
  }
  
  /**
   * Actualiza una capa existente
   */
  updateLayer(id: string, updates: Partial<CustomLayer>): boolean {
    const success = this.networkStateService.updateCustomLayer(id, updates);
    if (success) {
      this.logger.info(`Capa personalizada actualizada con ID: ${id}`);
    }
    return success;
  }
  
  /**
   * Elimina una capa personalizada
   */
  deleteLayer(id: string): boolean {
    const success = this.networkStateService.deleteCustomLayer(id);
    if (success) {
      this.logger.info(`Capa personalizada eliminada con ID: ${id}`);
    }
    return success;
  }
  
  /**
   * Activa o desactiva una capa
   */
  toggleLayer(id: string): void {
    this.networkStateService.toggleCustomLayer(id);
  }
  
  /**
   * Añade elementos a una capa personalizada
   */
  addElementsToLayer(layerId: string, elementIds: string[]): boolean {
    return this.networkStateService.addElementsToCustomLayer(layerId, elementIds);
  }
  
  /**
   * Elimina elementos de una capa personalizada
   */
  removeElementsFromLayer(layerId: string, elementIds: string[]): boolean {
    return this.networkStateService.removeElementsFromCustomLayer(layerId, elementIds);
  }
  
  /**
   * Abre el diálogo de creación de capa
   */
  openCreateLayerDialog(): Observable<string | undefined> {
    return this.elementService.getAllElements().pipe(
      switchMap(elements => {
        const availableElements = elements.map(element => ({
          id: element.id,
          name: element.name,
          type: element.type
        }));
        
        const dialogRef = this.dialog.open(CustomLayerFormComponent, {
          width: '500px',
          data: {
            isEditing: false,
            availableElements
          }
        });
        
        return dialogRef.afterClosed().pipe(
          map((result: any) => {
            if (!result) return undefined;
            
            // Crear la nueva capa
            return this.createLayer({
              name: result.name,
              description: result.description,
              color: result.color,
              visible: result.visible,
              elementIds: result.elementIds,
              icon: result.icon,
              isEditable: result.isEditable,
              isSystem: false,
              priority: result.priority
            });
          })
        );
      })
    );
  }
  
  /**
   * Abre el diálogo de edición de capa
   */
  openEditLayerDialog(layerId: string): Observable<boolean> {
    const layer = this.getLayerById(layerId);
    
    if (!layer) {
      this.logger.error(`No se pudo encontrar la capa con ID: ${layerId}`);
      return of(false);
    }
    
    return this.elementService.getAllElements().pipe(
      switchMap(elements => {
        const availableElements = elements.map(element => ({
          id: element.id,
          name: element.name,
          type: element.type
        }));
        
        const dialogRef = this.dialog.open(CustomLayerFormComponent, {
          width: '500px',
          data: {
            layer,
            isEditing: true,
            availableElements
          }
        });
        
        return dialogRef.afterClosed().pipe(
          map((result: any) => {
            if (!result) return false;
            
            // Actualizar la capa
            return this.updateLayer(layerId, {
              name: result.name,
              description: result.description,
              color: result.color,
              visible: result.visible,
              elementIds: result.elementIds,
              icon: result.icon,
              isEditable: result.isEditable,
              priority: result.priority
            });
          })
        );
      })
    );
  }
  
  /**
   * Crea una capa predefinida basada en un tipo de elemento
   */
  createPredefinedLayerByType(type: ElementType, color: string, icon: string): Observable<string | undefined> {
    return this.elementService.getElementsByType(type).pipe(
      map((elements: NetworkElement[]) => {
        if (elements.length === 0) {
          this.logger.warn(`No se encontraron elementos del tipo ${type} para crear la capa`);
          this.networkStateService.showSnackbar(`No hay elementos del tipo ${type} para crear la capa`, 'warning');
          return undefined;
        }
        
        const elementIds = elements.map(element => element.id);
        const layerId = this.createLayer({
          name: `${type} personalizado`,
          description: `Capa personalizada para elementos de tipo ${type}`,
          color,
          visible: true,
          elementIds,
          icon,
          isEditable: true,
          isSystem: false,
          priority: 50
        });
        
        this.networkStateService.showSnackbar(
          `Capa personalizada creada con ${elementIds.length} elementos de tipo ${type}`,
          'success'
        );
        
        return layerId;
      })
    );
  }
  
  /**
   * Crea una capa para elementos en un área geográfica específica
   */
  createLayerByGeographicArea(
    name: string, 
    boundingBox: { north: number; south: number; east: number; west: number },
    color: string
  ): Observable<string | undefined> {
    return this.elementService.getAllElements().pipe(
      map((elements: NetworkElement[]) => {
        const elementsInArea = elements.filter(element => {
          const lat = element.position.coordinates[1];
          const lng = element.position.coordinates[0];
          
          return (
            lat >= boundingBox.south &&
            lat <= boundingBox.north &&
            lng >= boundingBox.west &&
            lng <= boundingBox.east
          );
        });
        
        if (elementsInArea.length === 0) {
          this.logger.warn('No se encontraron elementos en el área especificada');
          this.networkStateService.showSnackbar('No hay elementos en el área seleccionada', 'warning');
          return undefined;
        }
        
        const elementIds = elementsInArea.map(element => element.id);
        const layerId = this.createLayer({
          name,
          description: `Capa para elementos en área geográfica definida`,
          color,
          visible: true,
          elementIds,
          icon: 'place',
          isEditable: true,
          isSystem: false,
          priority: 50
        });
        
        this.networkStateService.showSnackbar(
          `Capa de área creada con ${elementIds.length} elementos`,
          'success'
        );
        
        return layerId;
      })
    );
  }
  
  /**
   * Crea una capa basada en el estado de los elementos
   */
  createLayerByElementStatus(status: string, color: string): Observable<string | undefined> {
    return this.elementService.getAllElements().pipe(
      map((elements: NetworkElement[]) => {
        const elementsWithStatus = elements.filter(element => element.status === status);
        
        if (elementsWithStatus.length === 0) {
          this.logger.warn(`No se encontraron elementos con estado ${status}`);
          this.networkStateService.showSnackbar(`No hay elementos con estado ${status}`, 'warning');
          return undefined;
        }
        
        const elementIds = elementsWithStatus.map(element => element.id);
        const layerId = this.createLayer({
          name: `Estado: ${status}`,
          description: `Elementos con estado: ${status}`,
          color,
          visible: true,
          elementIds,
          icon: 'info',
          isEditable: true,
          isSystem: false,
          priority: 50
        });
        
        this.networkStateService.showSnackbar(
          `Capa creada con ${elementIds.length} elementos en estado ${status}`,
          'success'
        );
        
        return layerId;
      })
    );
  }
} 