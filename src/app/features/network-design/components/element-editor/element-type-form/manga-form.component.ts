import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { FiberType } from '../../../../../shared/types/network.types';

/**
 * Componente para el formulario específico de elementos Manga (Empalme)
 * 
 * Este componente recibe un FormGroup del componente padre
 * y gestiona los controles específicos para este tipo de elemento.
 */
@Component({
  selector: 'app-manga-form',
  template: `
    <div class="type-specific-form" [formGroup]="parentForm">
      <div class="form-row" formGroupName="properties">
        <mat-form-field appearance="outline">
          <mat-label>Fabricante</mat-label>
          <input matInput formControlName="manufacturer" placeholder="Fabricante">
          <mat-error *ngIf="propertiesGroup?.get('manufacturer')?.hasError('required')">
            El fabricante es obligatorio
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Modelo</mat-label>
          <input matInput formControlName="model" placeholder="Modelo">
          <mat-error *ngIf="propertiesGroup?.get('model')?.hasError('required')">
            El modelo es obligatorio
          </mat-error>
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
          <mat-error *ngIf="propertiesGroup?.get('fiberType')?.hasError('required')">
            El tipo de fibra es obligatorio
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Cantidad de Fibras</mat-label>
          <input matInput type="number" formControlName="fiberCount" placeholder="Cantidad">
          <mat-error *ngIf="propertiesGroup?.get('fiberCount')?.hasError('required')">
            La cantidad de fibras es obligatoria
          </mat-error>
          <mat-error *ngIf="propertiesGroup?.get('fiberCount')?.hasError('min')">
            Debe ser mayor que 0
          </mat-error>
        </mat-form-field>
      </div>

      <div class="form-row" formGroupName="properties">
        <mat-form-field appearance="outline">
          <mat-label>Longitud (m)</mat-label>
          <input matInput type="number" formControlName="length" placeholder="Longitud en metros">
          <mat-error *ngIf="propertiesGroup?.get('length')?.hasError('required')">
            La longitud es obligatoria
          </mat-error>
          <mat-error *ngIf="propertiesGroup?.get('length')?.hasError('min')">
            Debe ser mayor que 0
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Diámetro (mm)</mat-label>
          <input matInput type="number" formControlName="diameter" placeholder="Diámetro en mm">
          <mat-error *ngIf="propertiesGroup?.get('diameter')?.hasError('required')">
            El diámetro es obligatorio
          </mat-error>
          <mat-error *ngIf="propertiesGroup?.get('diameter')?.hasError('min')">
            Debe ser mayor que 0
          </mat-error>
        </mat-form-field>
      </div>

      <div class="form-row" formGroupName="properties">
        <mat-form-field appearance="outline">
          <mat-label>Color</mat-label>
          <input matInput formControlName="color" placeholder="Color">
          <mat-error *ngIf="propertiesGroup?.get('color')?.hasError('required')">
            El color es obligatorio
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Tipo de Sellado</mat-label>
          <input matInput formControlName="sealType" placeholder="Tipo de sellado">
          <mat-error *ngIf="propertiesGroup?.get('sealType')?.hasError('required')">
            El tipo de sellado es obligatorio
          </mat-error>
        </mat-form-field>
      </div>

      <div class="form-row" formGroupName="properties">
        <mat-form-field appearance="outline">
          <mat-label>Tipo de Instalación</mat-label>
          <input matInput formControlName="installationType" placeholder="Tipo de instalación">
          <mat-error *ngIf="propertiesGroup?.get('installationType')?.hasError('required')">
            El tipo de instalación es obligatorio
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Tipo de Montaje</mat-label>
          <mat-select formControlName="mountingType">
            <mat-option value="wall">Mural</mat-option>
            <mat-option value="pole">Poste</mat-option>
            <mat-option value="aerial">Aéreo</mat-option>
            <mat-option value="underground">Subterráneo</mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      <div class="form-row" formGroupName="properties">
        <mat-form-field appearance="outline">
          <mat-label>Ubicación</mat-label>
          <input matInput formControlName="location" placeholder="Ubicación física">
          <mat-error *ngIf="propertiesGroup?.get('location')?.hasError('required')">
            La ubicación es obligatoria
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Fecha de Instalación</mat-label>
          <input matInput [matDatepicker]="installationDatePicker" formControlName="installationDate">
          <mat-datepicker-toggle matSuffix [for]="installationDatePicker"></mat-datepicker-toggle>
          <mat-datepicker #installationDatePicker></mat-datepicker>
          <mat-error *ngIf="propertiesGroup?.get('installationDate')?.hasError('required')">
            La fecha de instalación es obligatoria
          </mat-error>
        </mat-form-field>
      </div>

      <div class="form-row" formGroupName="properties">
        <mat-form-field appearance="outline">
          <mat-label>Capacidad Total de Empalmes</mat-label>
          <input matInput type="number" formControlName="capacity" placeholder="Capacidad total">
          <mat-error *ngIf="propertiesGroup?.get('capacity')?.hasError('required')">
            La capacidad es obligatoria
          </mat-error>
          <mat-error *ngIf="propertiesGroup?.get('capacity')?.hasError('min')">
            Debe ser mayor que 0
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Cantidad de Empalmes Utilizados</mat-label>
          <input matInput type="number" formControlName="usedSplices" placeholder="Empalmes utilizados">
          <mat-error *ngIf="propertiesGroup?.get('usedSplices')?.hasError('min')">
            No puede ser un valor negativo
          </mat-error>
        </mat-form-field>
      </div>

      <div class="form-row" formGroupName="properties">
        <mat-form-field appearance="outline">
          <mat-label>Cantidad Total de Empalmes Posibles</mat-label>
          <input matInput type="number" formControlName="spliceCount" placeholder="Empalmes posibles">
          <mat-error *ngIf="propertiesGroup?.get('spliceCount')?.hasError('required')">
            La cantidad total de empalmes es obligatoria
          </mat-error>
          <mat-error *ngIf="propertiesGroup?.get('spliceCount')?.hasError('min')">
            Debe ser mayor que 0
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Número de Serie</mat-label>
          <input matInput formControlName="serialNumber" placeholder="Número de serie">
        </mat-form-field>
      </div>

      <div class="form-row" formGroupName="properties">
        <mat-form-field appearance="outline">
          <mat-label>Técnico de Instalación</mat-label>
          <input matInput formControlName="installationTechnician" placeholder="Nombre del técnico">
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>ID del Técnico</mat-label>
          <input matInput formControlName="technicianId" placeholder="ID del técnico">
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
    
    @media screen and (max-width: 768px) {
      mat-form-field {
        flex: 1 1 100%;
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
    MatDatepickerModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MangaFormComponent {
  @Input() parentForm!: FormGroup;
  
  // Enumeraciones para el template
  FiberType = FiberType;
  
  /**
   * Getter para acceder al grupo de propiedades específicas
   */
  get propertiesGroup(): FormGroup | null {
    return this.parentForm?.get('properties') as FormGroup;
  }
} 