import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { PONStandard, SplitterType, SplitterOutputType } from '../../../../../shared/types/network.types';

/**
 * Componente para el formulario específico de elementos Splitter
 * 
 * Este componente recibe un FormGroup del componente padre
 * y gestiona los controles específicos para este tipo de elemento.
 */
@Component({
  selector: 'app-splitter-form',
  template: `
    <div class="type-specific-form" [formGroup]="parentForm">
      <div class="form-row" formGroupName="properties">
        <mat-form-field appearance="outline">
          <mat-label>Tipo de Splitter</mat-label>
          <mat-select formControlName="splitterType">
            <mat-option [value]="SplitterType.DISTRIBUTION">Distribución</mat-option>
            <mat-option [value]="SplitterType.TERMINAL">Terminal</mat-option>
          </mat-select>
          <mat-error *ngIf="propertiesGroup?.get('splitterType')?.hasError('required')">
            El tipo de splitter es obligatorio
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Relación de División</mat-label>
          <mat-select formControlName="splitRatio">
            <mat-option value="1:2">1:2</mat-option>
            <mat-option value="1:4">1:4</mat-option>
            <mat-option value="1:8">1:8</mat-option>
            <mat-option value="1:16">1:16</mat-option>
            <mat-option value="1:32">1:32</mat-option>
            <mat-option value="1:64">1:64</mat-option>
            <mat-option value="1:128">1:128</mat-option>
            <mat-option value="2:4">2:4</mat-option>
            <mat-option value="2:8">2:8</mat-option>
            <mat-option value="2:16">2:16</mat-option>
          </mat-select>
          <mat-error *ngIf="propertiesGroup?.get('splitRatio')?.hasError('required')">
            La relación de división es obligatoria
          </mat-error>
        </mat-form-field>
      </div>

      <div class="form-row" formGroupName="properties">
        <mat-form-field appearance="outline">
          <mat-label>Pérdida de Inserción (dB)</mat-label>
          <input matInput type="number" formControlName="insertionLossDb" placeholder="Pérdida en dB">
          <mat-error *ngIf="propertiesGroup?.get('insertionLossDb')?.hasError('required')">
            La pérdida de inserción es obligatoria
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Nivel en Jerarquía</mat-label>
          <mat-select formControlName="level">
            <mat-option [value]="1">Nivel 1</mat-option>
            <mat-option [value]="2">Nivel 2</mat-option>
            <mat-option [value]="3">Nivel 3</mat-option>
          </mat-select>
          <mat-error *ngIf="propertiesGroup?.get('level')?.hasError('required')">
            El nivel es obligatorio
          </mat-error>
        </mat-form-field>
      </div>

      <div class="form-row" formGroupName="properties">
        <mat-form-field appearance="outline">
          <mat-label>Puertos Totales</mat-label>
          <input matInput type="number" formControlName="totalPorts" placeholder="Puertos totales">
          <mat-error *ngIf="propertiesGroup?.get('totalPorts')?.hasError('required')">
            El número total de puertos es obligatorio
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
          <mat-label>Tipo de Salida</mat-label>
          <mat-select formControlName="outputType">
            <mat-option [value]="SplitterOutputType.BALANCED">Balanceada</mat-option>
            <mat-option [value]="SplitterOutputType.UNBALANCED">No Balanceada</mat-option>
          </mat-select>
          <mat-error *ngIf="propertiesGroup?.get('outputType')?.hasError('required')">
            El tipo de salida es obligatorio
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Fabricante</mat-label>
          <input matInput formControlName="manufacturer" placeholder="Fabricante">
        </mat-form-field>
      </div>

      <div class="form-row" formGroupName="properties">
        <mat-form-field appearance="outline">
          <mat-label>Modelo</mat-label>
          <input matInput formControlName="model" placeholder="Modelo">
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Número de Serie</mat-label>
          <input matInput formControlName="serialNumber" placeholder="Número de Serie">
        </mat-form-field>
      </div>

      <div class="form-row" formGroupName="properties">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Estándares PON Soportados</mat-label>
          <mat-select formControlName="supportedPONStandards" multiple>
            <mat-option [value]="PONStandard.GPON">GPON</mat-option>
            <mat-option [value]="PONStandard.XG_PON">XG-PON</mat-option>
            <mat-option [value]="PONStandard.XGS_PON">XGS-PON</mat-option>
            <mat-option [value]="PONStandard.TWENTYFIVE_GS_PON">25GS-PON</mat-option>
            <mat-option [value]="PONStandard.EPON">EPON</mat-option>
            <mat-option [value]="PONStandard.TEN_EPON">10G-EPON</mat-option>
          </mat-select>
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
    MatCheckboxModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SplitterFormComponent {
  @Input() parentForm!: FormGroup;
  
  // Enumeraciones para el template
  PONStandard = PONStandard;
  SplitterType = SplitterType;
  SplitterOutputType = SplitterOutputType;
  
  /**
   * Getter para acceder al grupo de propiedades específicas
   */
  get propertiesGroup(): FormGroup | null {
    return this.parentForm?.get('properties') as FormGroup;
  }
} 