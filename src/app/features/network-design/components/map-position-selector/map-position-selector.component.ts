import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormArray } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

import { BaseElementFormComponent } from '../element-editor/element-type-form/base-element-form.component';
import { GeographicPosition, createPosition } from '../../../../shared/types/network.types';

// Los servicios no son necesarios renderizar el componente para esta demostración
// Usamos implementaciones mock si son necesarias
class MockMapService {
  centerOnCoordinates(coords: any): void {}
  setCurrentCoordinates(coords: any): void {}
}

class MockNetworkMapDialogService {
  openMapPositionDialog(position: any, options: any): any {
    return {
      afterClosed: () => ({
        pipe: () => ({
          subscribe: (fn: any) => {}
        })
      })
    };
  }
}

class MockLoggerService {
  debug(message: string, ...args: any[]): void {}
  error(message: string, ...args: any[]): void {}
}

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
      & {
        margin-bottom: 20px;
      }
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
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: MockMapService, useClass: MockMapService },
    { provide: MockNetworkMapDialogService, useClass: MockNetworkMapDialogService },
    { provide: MockLoggerService, useClass: MockLoggerService }
  ]
})
export class MapPositionSelectorComponent extends BaseElementFormComponent {
  private destroy$ = new Subject<void>();
  private selectionActive = false;
  
  constructor(
    private mapService: MockMapService,
    private networkMapDialogService: MockNetworkMapDialogService,
    private logger: MockLoggerService,
    private cdr: ChangeDetectorRef
  ) {
    super();
  }
  
  /**
   * Limpieza de recursos específicos para este componente
   * Este método es llamado automáticamente por el ngOnDestroy de la clase base
   */
  protected override cleanupResources(): void {
    // Limpiar suscripciones específicas
    this.destroy$.next();
    this.destroy$.complete();
    
    // Llamar a la implementación base
    super.cleanupResources();
  }
  
  /**
   * Abre el diálogo para seleccionar una posición en el mapa
   */
  enableMapSelection(): void {
    // Obtener la posición actual del formulario
    const coordinatesArray = this.getCoordinatesArray();
    
    // Código simplificado para la demostración
    this.logger.debug('Abriendo diálogo de selección de posición');
    this.networkMapDialogService.openMapPositionDialog(null, {
      title: 'Seleccionar ubicación',
      description: 'Seleccione ubicación en el mapa'
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
        this.mapService.centerOnCoordinates({ x: lng, y: lat });
        this.logger.debug(`Mapa centrado en [${lat}, ${lng}]`);
      } catch (error) {
        this.logger.error('Error al centrar el mapa');
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