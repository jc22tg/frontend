import { Injectable, Component, Inject } from '@angular/core';
import { MatDialog, MatDialogConfig, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Observable, Subject } from 'rxjs';
import { map, filter } from 'rxjs/operators';
import { NetworkElement, ElementType } from '../../../shared/types/network.types';
import { GeographicPosition, createPosition } from '../../../shared/types/geo-position';
import { MapPositionDialogComponent } from '../components/map-position-dialog/map-position-dialog.component';
// import { ConfirmDialogComponent } from '../components/confirm-dialog/confirm-dialog.component';
import { MapPositionSelectorComponent } from '../components/map-position-selector/map-position-selector.component';

// Las siguientes importaciones serían reemplazadas por componentes reales
// Comentamos ya que estos archivos pueden no existir aún
/*
import { ElementFormDialogComponent } from '../components/element-form-dialog/element-form-dialog.component';
import { ConnectionFormDialogComponent } from '../components/connection-form-dialog/connection-form-dialog.component';
import { AddElementMenuComponent } from '../components/network-map/add-element-menu/add-element-menu.component';
import { ShortcutsHelpDialogComponent } from '../../../shared/components/shortcuts-help-dialog/shortcuts-help-dialog.component';
import { HistoricalDataDialogComponent } from '../components/historical-data-dialog/historical-data-dialog.component';
import { NetworkDialogService } from './network-dialog.service';
*/

/**
 * Opciones para el diálogo de confirmación
 */
export interface ConfirmDialogOptions {
  title: string;
  message: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  confirmButtonColor?: 'primary' | 'accent' | 'warn';
  width?: string;
  height?: string;
  disableClose?: boolean;
}

/**
 * Opciones para el selector de posición en el mapa
 */
export interface MapPositionSelectorOptions {
  initialPosition?: GeographicPosition;
  title?: string;
  description?: string;
  elementType?: string;
  width?: string;
  height?: string;
  disableClose?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NetworkMapDialogService {

  constructor(
    private dialog: MatDialog
    // private networkDialogService: NetworkDialogService
  ) {}

  /**
   * Muestra el formulario de elemento para crear o editar
   */
  showElementFormDialog(data: Partial<NetworkElement>): MatDialogRef<any> {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.disableClose = true;
    dialogConfig.width = '700px';
    dialogConfig.maxWidth = '100vw';
    dialogConfig.data = data;
    dialogConfig.panelClass = 'element-form-dialog';

    // Reemplazar por implementación real cuando exista el componente
    console.log('Mostrando formulario para edición de elemento', data);
    return this.dialog.open(/* ElementFormDialogComponent */ Object, dialogConfig);
  }

  /**
   * Muestra el formulario de conexión para crear o editar
   */
  showConnectionFormDialog(data: any): MatDialogRef<any> {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.disableClose = true;
    dialogConfig.width = '600px';
    dialogConfig.data = data;
    dialogConfig.panelClass = 'connection-form-dialog';

    // Reemplazar por implementación real cuando exista el componente
    console.log('Mostrando formulario para conexión', data);
    return this.dialog.open(/* ConnectionFormDialogComponent */ Object, dialogConfig);
  }
  
  /**
   * Muestra el diálogo de ayuda con atajos de teclado
   */
  showKeyboardShortcutsDialog(shortcuts: {key: string, description: string, contexts?: string[]}[]): MatDialogRef<any> {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.width = '500px';
    dialogConfig.data = { shortcuts };
    dialogConfig.panelClass = 'shortcuts-dialog';
    
    // Reemplazar por implementación real cuando exista el componente
    console.log('Mostrando diálogo de atajos de teclado', shortcuts);
    return this.dialog.open(/* ShortcutsHelpDialogComponent */ Object, dialogConfig);
  }
  
  /**
   * Muestra el menú para añadir elementos
   */
  showAddElementMenu(position: {x: number, y: number}, elementTypes: ElementType[]): MatDialogRef<any> {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.position = {
      left: `${position.x}px`,
      top: `${position.y}px`
    };
    dialogConfig.data = { elementTypes };
    dialogConfig.panelClass = 'add-element-menu';
    dialogConfig.hasBackdrop = true;
    
    // Reemplazar por implementación real cuando exista el componente
    console.log('Mostrando menú para agregar elemento', {position, elementTypes});
    return this.dialog.open(/* AddElementMenuComponent */ Object, dialogConfig);
  }
  
  /**
   * Muestra el diálogo de datos históricos
   */
  showHistoricalDataDialog(elementId: string): MatDialogRef<any> {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.width = '800px';
    dialogConfig.maxWidth = '95vw';
    dialogConfig.height = '600px';
    dialogConfig.data = { elementId };
    dialogConfig.panelClass = 'historical-data-dialog';
    
    // Reemplazar por implementación real cuando exista el componente
    console.log('Mostrando diálogo de datos históricos', elementId);
    return this.dialog.open(/* HistoricalDataDialogComponent */ Object, dialogConfig);
  }

  /**
   * Abre un diálogo de confirmación
   * @param options Opciones del diálogo
   * @returns Referencia al diálogo abierto
   */
  openConfirmDialog(options: ConfirmDialogOptions) {
    const dialogRef = this.dialog.open(/* ConfirmDialogComponent */ Object, {
      width: options.width || '400px',
      height: options.height,
      disableClose: options.disableClose || false,
      data: {
        title: options.title,
        message: options.message,
        confirmButtonText: options.confirmButtonText || 'Confirmar',
        cancelButtonText: options.cancelButtonText || 'Cancelar',
        confirmButtonColor: options.confirmButtonColor || 'primary'
      }
    });

    return dialogRef;
  }

  /**
   * Abre un selector de posición en el mapa
   * @param options Opciones del selector
   * @returns Referencia al diálogo abierto
   */
  openMapPositionSelector(options: MapPositionSelectorOptions) {
    const dialogRef = this.dialog.open(MapPositionSelectorComponent, {
      width: options.width || '800px',
      height: options.height || '600px',
      disableClose: options.disableClose || false,
      panelClass: 'map-position-dialog',
      data: {
        initialPosition: options.initialPosition,
        title: options.title || 'Seleccionar ubicación',
        description: options.description || 'Haga clic en el mapa para seleccionar la ubicación.',
        elementType: options.elementType
      }
    });

    return dialogRef;
  }

  /**
   * Abre un diálogo para editar un elemento
   */
  openElementDialog(element: NetworkElement): void {
    console.log('Abriendo diálogo para editar elemento:', element);
    // En una implementación real, abriría un MatDialog con un formulario
    alert(`Editando elemento: ${element.name || element.id}`);
  }

  /**
   * Abre un diálogo para crear conexiones
   */
  openConnectionDialog(element: NetworkElement): void {
    console.log('Abriendo diálogo para conectar elemento:', element);
    // En una implementación real, abriría un MatDialog con opciones de conexión
    alert(`Conectando elemento: ${element.name || element.id}`);
  }

  /**
   * Abre un diálogo de error
   */
  openErrorDialog(message: string): void {
    console.error('Error:', message);
    // En una implementación real, abriría un MatDialog con el mensaje de error
    alert(`Error: ${message}`);
  }

  /**
   * Abre un diálogo para visualizar detalles
   */
  openDetailsDialog(element: NetworkElement): void {
    console.log('Mostrando detalles del elemento:', element);
    // En una implementación real, abriría un MatDialog con detalles
    alert(`Detalles del elemento: ${element.name || element.id}`);
  }

  /**
   * Abre un diálogo para filtros avanzados
   */
  openFilterDialog(currentFilters: any, applyCallback: (filters: any) => void): void {
    console.log('Abriendo diálogo de filtros avanzados', currentFilters);
    // En una implementación real, abriría un MatDialog con opciones de filtrado
    // y llamaría al callback con los filtros seleccionados
  }

  /**
   * Muestra el diálogo para seleccionar posición en el mapa
   * @param initialPosition Posición inicial a mostrar en el mapa
   * @param options Opciones adicionales del diálogo
   * @returns Observable con la posición seleccionada cuando se confirma
   */
  openMapPositionDialog(
    initialPosition?: GeographicPosition,
    options?: {
      title?: string;
      description?: string;
      elementType?: string;
      maxDistance?: number;
      showValidationHint?: boolean;
    }
  ): MatDialogRef<MapPositionDialogComponent, GeographicPosition> {
    try {
      const dialogConfig = new MatDialogConfig();
      dialogConfig.disableClose = false;
      dialogConfig.width = '800px';
      dialogConfig.maxWidth = '95vw';
      dialogConfig.height = '600px';
      dialogConfig.maxHeight = '90vh';
      dialogConfig.panelClass = 'map-position-dialog';
      
      // Posición por defecto si no se proporciona
      const defaultPosition = createPosition(
        [-70.6884, 19.7934], // Puerto Plata, RD
        { type: 'Point' }
      );
      
      // Manejo seguro de la posición inicial
      let positionToUse = defaultPosition;
      if (initialPosition && 
          initialPosition.coordinates && 
          Array.isArray(initialPosition.coordinates) && 
          initialPosition.coordinates.length === 2 &&
          !isNaN(initialPosition.coordinates[0]) && 
          !isNaN(initialPosition.coordinates[1])) {
        positionToUse = initialPosition;
      }
      
      // Datos para el diálogo
      dialogConfig.data = {
        position: positionToUse,
        title: options?.title || 'Seleccionar ubicación',
        description: options?.description,
        elementType: options?.elementType,
        maxDistance: options?.maxDistance,
        showValidationHint: options?.showValidationHint
      };
      
      // Verificar que el componente exista antes de intentar abrirlo
      if (MapPositionDialogComponent) {
        return this.dialog.open(MapPositionDialogComponent, dialogConfig);
      } else {
        console.error('Error: MapPositionDialogComponent no está disponible');
        throw new Error('El componente de selección de posición no está disponible');
      }
    } catch (error) {
      console.error('Error al abrir el diálogo de selección de posición:', error);
      throw error;
    }
  }
} 
