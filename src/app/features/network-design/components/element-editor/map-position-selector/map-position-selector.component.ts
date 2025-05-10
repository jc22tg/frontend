import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormArray } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { BaseElementFormComponent } from '../element-type-form/base-element-form.component';
import { ElementFormSharedModule } from '../element-type-form/element-form-shared.module';
import { MapService } from '../../../services/map.service';
import { NetworkMapDialogService } from '../../../services/network-map-dialog.service';
import { LoggerService } from '../../../../../core/services/logger.service';
import { GeographicPosition, createPosition } from '../../../../../shared/types/network.types';

/**
 * Componente para seleccionar la posición geográfica del elemento en el mapa
 * 
 * Este componente extiende de BaseElementFormComponent para mantener
 * consistencia con los otros formularios específicos.
 */
@Component({
  selector: 'app-map-position-selector',
  template: `
    <mat-card class="map-card" [formGroup]="parentForm">
      <mat-card-header>
        <mat-card-title>Ubicación</mat-card-title>
      </mat-card-header>
      
      <mat-card-content>
        <div class="coordinates-display" formGroupName="position">
          <div class="coordinate">
            <span class="label">Latitud:</span>
            <span class="value">{{ getLatitude() | number:'1.6-6' }}</span>
          </div>
          <div class="coordinate">
            <span class="label">Longitud:</span>
            <span class="value">{{ getLongitude() | number:'1.6-6' }}</span>
          </div>
        </div>
        
        <div class="map-actions">
          <button 
            mat-stroked-button 
            color="primary" 
            type="button"
            (click)="enableMapSelection()" 
            matTooltip="Haga clic en el mapa para seleccionar la ubicación">
            <mat-icon>place</mat-icon>
            Seleccionar en mapa
          </button>
          
          <button 
            *ngIf="hasValidCoordinates()"
            mat-stroked-button 
            color="accent" 
            type="button"
            (click)="centerMapOnCoordinates()" 
            matTooltip="Centrar mapa en la ubicación actual">
            <mat-icon>my_location</mat-icon>
            Ver en mapa
          </button>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .map-card {
      margin-bottom: 20px;
    }
    
    .coordinates-display {
      display: flex;
      flex-wrap: wrap;
      margin-bottom: 16px;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      padding: 12px;
      background: #f9f9f9;
    }
    
    .coordinate {
      flex: 1 1 calc(50% - 8px);
      min-width: 150px;
      margin: 4px;
      
      .label {
        font-weight: 500;
        margin-right: 8px;
        color: rgba(0, 0, 0, 0.6);
      }
      
      .value {
        font-family: monospace;
        font-size: 1.1em;
      }
    }
    
    .map-actions {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      
      button {
        flex: 1;
      }
    }
    
    @media screen and (max-width: 600px) {
      .coordinate {
        flex: 1 1 100%;
      }
      
      .map-actions {
        flex-direction: column;
      }
    }
  `],
  standalone: true,
  imports: [ElementFormSharedModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MapPositionSelectorComponent extends BaseElementFormComponent {
  private destroy$ = new Subject<void>();
  private selectionActive = false;
  
  constructor(
    private mapService: MapService,
    private networkMapDialogService: NetworkMapDialogService,
    private logger: LoggerService,
    private cdr: ChangeDetectorRef
  ) {
    super();
  }
  
  /**
   * Limpieza de recursos cuando se destruye el componente
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    // No llamamos a super.ngOnDestroy() ya que causa problemas de compilación
  }
  
  /**
   * Abre el diálogo para seleccionar una posición en el mapa
   */
  enableMapSelection(): void {
    // Obtener la posición actual del formulario
    const coordinatesArray = this.getCoordinatesArray();
    
    // Crear la posición usando la función utilitaria
    const currentPosition = createPosition([
      coordinatesArray.at(0).value, // longitud
      coordinatesArray.at(1).value  // latitud
    ], { type: 'Point' });
    
    // Abrir el diálogo de selección de posición
    this.logger.debug('Abriendo diálogo de selección de posición');
    const dialogRef = this.networkMapDialogService.openMapPositionDialog(
      this.hasValidCoordinates() ? currentPosition : undefined,
      {
        title: 'Seleccionar ubicación del elemento',
        description: 'Seleccione la ubicación geográfica donde se instalará el elemento'
      }
    );
    
    // Manejar la respuesta del diálogo
    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        if (result) {
          this.updateCoordinates({
            lng: result.coordinates[0],
            lat: result.coordinates[1]
          });
          this.logger.debug('Posición actualizada desde el diálogo');
        }
      });
  }

  /**
   * Centra el mapa en las coordenadas actuales
   */
  centerMapOnCoordinates(): void {
    if (this.hasValidCoordinates()) {
      const coordinatesArray = this.getCoordinatesArray();
      const lng = coordinatesArray.at(0).value;
      const lat = coordinatesArray.at(1).value;
      
      try {
        // Usar el método centerOnCoordinates del servicio de mapa
        this.mapService.centerOnCoordinates({ x: lng, y: lat });
        this.logger.debug(`Mapa centrado en [${lat}, ${lng}]`);
      } catch (error) {
        this.logger.error('Error al centrar el mapa:', error);
      }
    }
  }
  
  /**
   * Actualiza las coordenadas en el formulario
   */
  private updateCoordinates(coords: {lat: number, lng: number}): void {
    if (!coords || !this.parentForm) return;
    
    const coordinatesArray = this.getCoordinatesArray();
    coordinatesArray.at(0).setValue(coords.lng); // Longitud
    coordinatesArray.at(1).setValue(coords.lat); // Latitud
    
    this.cdr.markForCheck();
  }
  
  /**
   * Obtiene el FormArray de coordenadas
   */
  private getCoordinatesArray(): FormArray {
    return this.parentForm.get('position.coordinates') as FormArray;
  }
  
  /**
   * Verifica si hay coordenadas válidas
   */
  hasValidCoordinates(): boolean {
    const coordinatesArray = this.getCoordinatesArray();
    return coordinatesArray && 
           coordinatesArray.length === 2 && 
           coordinatesArray.at(0).value !== null && 
           coordinatesArray.at(1).value !== null;
  }
  
  /**
   * Devuelve la longitud actual
   */
  getLongitude(): number {
    const coordinatesArray = this.getCoordinatesArray();
    return coordinatesArray ? coordinatesArray.at(0).value : 0;
  }
  
  /**
   * Devuelve la latitud actual
   */
  getLatitude(): number {
    const coordinatesArray = this.getCoordinatesArray();
    return coordinatesArray ? coordinatesArray.at(1).value : 0;
  }
} 