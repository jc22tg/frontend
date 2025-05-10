import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { PONStandard } from '../../../../../shared/types/network.types';

/**
 * Componente para el formulario específico de elementos ONT
 * 
 * Este componente recibe un FormGroup del componente padre
 * y gestiona los controles específicos para este tipo de elemento.
 */
@Component({
  selector: 'app-ont-form',
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
          <mat-label>Número de Serie</mat-label>
          <input matInput formControlName="serialNumber" placeholder="Número de Serie">
          <mat-error *ngIf="propertiesGroup?.get('serialNumber')?.hasError('required')">
            El número de serie es obligatorio
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>ID de Cliente</mat-label>
          <input matInput formControlName="clientId" placeholder="ID de Cliente">
        </mat-form-field>
      </div>

      <div class="form-row" formGroupName="properties">
        <mat-form-field appearance="outline">
          <mat-label>Dirección IP</mat-label>
          <input matInput formControlName="ipAddress" placeholder="Ej. 192.168.1.1">
          <mat-error *ngIf="propertiesGroup?.get('ipAddress')?.hasError('pattern')">
            Formato de IP inválido
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Dirección MAC</mat-label>
          <input matInput formControlName="macAddress" placeholder="Ej. 00:1A:2B:3C:4D:5E">
          <mat-error *ngIf="propertiesGroup?.get('macAddress')?.hasError('pattern')">
            Formato de MAC inválido
          </mat-error>
        </mat-form-field>
      </div>

      <div class="form-row" formGroupName="properties">
        <mat-form-field appearance="outline">
          <mat-label>Versión de Firmware</mat-label>
          <input matInput formControlName="firmwareVersion" placeholder="Versión de Firmware">
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Estándar PON</mat-label>
          <mat-select formControlName="ponStandard">
            <mat-option [value]="PONStandard.GPON">GPON</mat-option>
            <mat-option [value]="PONStandard.XG_PON">XG-PON</mat-option>
            <mat-option [value]="PONStandard.XGS_PON">XGS-PON</mat-option>
            <mat-option [value]="PONStandard.GPON">NG-PON2</mat-option>
            <mat-option [value]="PONStandard.EPON">EPON</mat-option>
            <mat-option [value]="PONStandard.TEN_EPON">10G-EPON</mat-option>
          </mat-select>
          <mat-error *ngIf="propertiesGroup?.get('ponStandard')?.hasError('required')">
            El estándar PON es obligatorio
          </mat-error>
        </mat-form-field>
      </div>

      <div class="form-row" formGroupName="properties">
        <div formGroupName="bandwidth" class="bandwidth-group">
          <mat-form-field appearance="outline">
            <mat-label>Capacidad de Bajada (Gbps)</mat-label>
            <input matInput type="number" formControlName="downstreamCapacity" placeholder="Capacidad de Bajada">
            <mat-error *ngIf="bandwidthGroup?.get('downstreamCapacity')?.hasError('required')">
              La capacidad de bajada es obligatoria
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Capacidad de Subida (Gbps)</mat-label>
            <input matInput type="number" formControlName="upstreamCapacity" placeholder="Capacidad de Subida">
            <mat-error *ngIf="bandwidthGroup?.get('upstreamCapacity')?.hasError('required')">
              La capacidad de subida es obligatoria
            </mat-error>
          </mat-form-field>
        </div>
      </div>

      <div class="form-row" formGroupName="properties">
        <mat-checkbox formControlName="dualRateSupport">
          Soporte para operación de velocidad dual
        </mat-checkbox>
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
    
    .bandwidth-group {
      display: flex;
      flex: 1 1 100%;
      gap: 16px;
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
    MatDatepickerModule,
    MatCheckboxModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OntFormComponent {
  @Input() parentForm!: FormGroup;
  
  // Enumeración de estándares PON para el template
  PONStandard = PONStandard;
  
  /**
   * Getter para acceder al grupo de propiedades específicas
   */
  get propertiesGroup(): FormGroup | null {
    return this.parentForm?.get('properties') as FormGroup;
  }
  
  /**
   * Getter para acceder al grupo de propiedades de ancho de banda
   */
  get bandwidthGroup(): FormGroup | null {
    return this.propertiesGroup?.get('bandwidth') as FormGroup;
  }
} 