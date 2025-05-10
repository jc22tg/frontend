import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FiberType } from '../../../../../shared/types/network.types';

/**
 * Componente para el formulario específico de elementos Terminal Box
 * 
 * Este componente recibe un FormGroup del componente padre
 * y gestiona los controles específicos para este tipo de elemento.
 */
@Component({
  selector: 'app-terminal-box-form',
  template: `
    <div class="type-specific-form" [formGroup]="parentForm">
      <div class="form-row" formGroupName="properties">
        <mat-form-field appearance="outline">
          <mat-label>Capacidad</mat-label>
          <input matInput type="number" formControlName="capacity" placeholder="Capacidad total">
          <mat-error *ngIf="propertiesGroup?.get('capacity')?.hasError('required')">
            La capacidad es obligatoria
          </mat-error>
          <mat-error *ngIf="propertiesGroup?.get('capacity')?.hasError('min')">
            Debe ser mayor que 0
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Puertos Utilizados</mat-label>
          <input matInput type="number" formControlName="usedPorts" placeholder="Puertos en uso">
          <mat-error *ngIf="propertiesGroup?.get('usedPorts')?.hasError('min')">
            No puede ser un valor negativo
          </mat-error>
        </mat-form-field>
      </div>

      <div class="form-row" formGroupName="properties">
        <mat-form-field appearance="outline">
          <mat-label>Fabricante</mat-label>
          <input matInput formControlName="vendor" placeholder="Fabricante">
          <mat-error *ngIf="propertiesGroup?.get('vendor')?.hasError('required')">
            El fabricante es obligatorio
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Modelo</mat-label>
          <input matInput formControlName="model" placeholder="Modelo">
        </mat-form-field>
      </div>

      <div class="form-row" formGroupName="properties">
        <mat-form-field appearance="outline">
          <mat-label>Número de Serie</mat-label>
          <input matInput formControlName="serialNumber" placeholder="Número de Serie">
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Tipo de Cable</mat-label>
          <input matInput formControlName="cableType" placeholder="Tipo de cable">
          <mat-error *ngIf="propertiesGroup?.get('cableType')?.hasError('required')">
            El tipo de cable es obligatorio
          </mat-error>
        </mat-form-field>
      </div>

      <div class="form-row" formGroupName="properties">
        <mat-form-field appearance="outline">
          <mat-label>Tipo de Instalación</mat-label>
          <mat-select formControlName="indoorOutdoor">
            <mat-option value="indoor">Interior</mat-option>
            <mat-option value="outdoor">Exterior</mat-option>
            <mat-option value="both">Ambos</mat-option>
          </mat-select>
          <mat-error *ngIf="propertiesGroup?.get('indoorOutdoor')?.hasError('required')">
            El tipo de instalación es obligatorio
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Tipo de Gabinete</mat-label>
          <input matInput formControlName="enclosureType" placeholder="Tipo de gabinete">
          <mat-error *ngIf="propertiesGroup?.get('enclosureType')?.hasError('required')">
            El tipo de gabinete es obligatorio
          </mat-error>
        </mat-form-field>
      </div>

      <div class="form-row" formGroupName="properties">
        <mat-form-field appearance="outline">
          <mat-label>Tipo de Montaje</mat-label>
          <mat-select formControlName="mountingType">
            <mat-option value="wall">Mural</mat-option>
            <mat-option value="pole">Poste</mat-option>
            <mat-option value="aerial">Aéreo</mat-option>
            <mat-option value="underground">Subterráneo</mat-option>
          </mat-select>
          <mat-error *ngIf="propertiesGroup?.get('mountingType')?.hasError('required')">
            El tipo de montaje es obligatorio
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Clasificación IP</mat-label>
          <input matInput formControlName="ipRating" placeholder="Ej. IP68">
          <mat-error *ngIf="propertiesGroup?.get('ipRating')?.hasError('required')">
            La clasificación IP es obligatoria
          </mat-error>
        </mat-form-field>
      </div>

      <div class="form-row" formGroupName="properties">
        <mat-form-field appearance="outline">
          <mat-label>Fecha de Instalación</mat-label>
          <input matInput [matDatepicker]="installationDatePicker" formControlName="installationDate">
          <mat-datepicker-toggle matSuffix [for]="installationDatePicker"></mat-datepicker-toggle>
          <mat-datepicker #installationDatePicker></mat-datepicker>
          <mat-error *ngIf="propertiesGroup?.get('installationDate')?.hasError('required')">
            La fecha de instalación es obligatoria
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Próxima Fecha de Mantenimiento</mat-label>
          <input matInput [matDatepicker]="nextMaintenancePicker" formControlName="nextMaintenanceDate">
          <mat-datepicker-toggle matSuffix [for]="nextMaintenancePicker"></mat-datepicker-toggle>
          <mat-datepicker #nextMaintenancePicker></mat-datepicker>
        </mat-form-field>
      </div>

      <div class="form-row" formGroupName="properties">
        <mat-form-field appearance="outline">
          <mat-label>Tipo de Fibra</mat-label>
          <mat-select formControlName="fiberType">
            <mat-option [value]="FiberType.SINGLE_MODE">Monomodo</mat-option>
            <mat-option [value]="FiberType.MULTI_MODE">Multimodo</mat-option>
            <mat-option [value]="FiberType.MULTI_MODE_OM3">Multimodo OM3</mat-option>
            <mat-option [value]="FiberType.MULTI_MODE_OM4">Multimodo OM4</mat-option>
            <mat-option [value]="FiberType.MULTI_MODE_OM4">Multimodo OM5</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Ancho de Banda Máximo (Mbps)</mat-label>
          <input matInput type="number" formControlName="maxBandwidth" placeholder="Ancho de banda máximo">
        </mat-form-field>
      </div>

      <div class="form-row" formGroupName="properties">
        <div class="dimensions-group" formGroupName="dimensions">
          <h3 class="dimensions-title">Dimensiones (mm)</h3>
          <div class="dimensions-fields">
            <mat-form-field appearance="outline">
              <mat-label>Ancho</mat-label>
              <input matInput type="number" formControlName="width" placeholder="Ancho">
              <mat-error *ngIf="dimensionsGroup?.get('width')?.hasError('required')">
                El ancho es obligatorio
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Alto</mat-label>
              <input matInput type="number" formControlName="height" placeholder="Alto">
              <mat-error *ngIf="dimensionsGroup?.get('height')?.hasError('required')">
                El alto es obligatorio
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Profundidad</mat-label>
              <input matInput type="number" formControlName="depth" placeholder="Profundidad">
              <mat-error *ngIf="dimensionsGroup?.get('depth')?.hasError('required')">
                La profundidad es obligatoria
              </mat-error>
            </mat-form-field>
          </div>
        </div>
      </div>

      <div class="form-row" formGroupName="properties">
        <div class="checkbox-group">
          <mat-checkbox formControlName="monitoringEnabled">
            Monitoreo habilitado
          </mat-checkbox>
          
          <mat-checkbox formControlName="isWeatherproof">
            Resistente a la intemperie
          </mat-checkbox>
        </div>
      </div>
      
      <div class="form-row" formGroupName="properties">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Descripción de la Ubicación</mat-label>
          <textarea matInput formControlName="locationDescription" placeholder="Descripción detallada de la ubicación" rows="2"></textarea>
        </mat-form-field>
      </div>
      
      <div class="form-row" formGroupName="properties">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Instrucciones de Acceso</mat-label>
          <textarea matInput formControlName="accessInstructions" placeholder="Instrucciones para acceder al equipo" rows="2"></textarea>
        </mat-form-field>
      </div>
    </div>
  `,
  styles: [`
    .type-specific-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    
    .form-row {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }
    
    mat-form-field {
      flex: 1 1 calc(50% - 8px);
      min-width: 200px;
    }
    
    .full-width {
      flex: 1 1 100%;
    }
    
    .dimensions-group {
      flex: 1 1 100%;
      display: flex;
      flex-direction: column;
      background-color: rgba(0, 0, 0, 0.03);
      border-radius: 4px;
      padding: 8px 16px;
      margin-bottom: 8px;
    }
    
    .dimensions-title {
      margin: 8px 0;
      font-size: 14px;
      font-weight: 500;
      color: rgba(0, 0, 0, 0.7);
    }
    
    .dimensions-fields {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }
    
    .checkbox-group {
      display: flex;
      flex: 1 1 100%;
      gap: 24px;
      margin: 8px 0;
    }
    
    @media screen and (max-width: 768px) {
      mat-form-field {
        flex: 1 1 100%;
      }
      
      .dimensions-fields {
        flex-direction: column;
      }
      
      .checkbox-group {
        flex-direction: column;
        gap: 8px;
      }
    }
  `],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatCheckboxModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TerminalBoxFormComponent {
  @Input() parentForm!: FormGroup;
  
  // Enumeraciones para el template
  FiberType = FiberType;
  
  /**
   * Getter para acceder al grupo de propiedades específicas
   */
  get propertiesGroup(): FormGroup | null {
    return this.parentForm?.get('properties') as FormGroup;
  }
  
  /**
   * Getter para acceder al grupo de dimensiones
   */
  get dimensionsGroup(): FormGroup | null {
    return this.propertiesGroup?.get('dimensions') as FormGroup;
  }
} 