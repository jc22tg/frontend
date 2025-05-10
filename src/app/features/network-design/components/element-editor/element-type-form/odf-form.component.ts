import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ODFType } from '../../../../../shared/types/network.types';

/**
 * Componente para el formulario específico de elementos ODF (Optical Distribution Frame)
 * 
 * Este componente unifica y reemplaza la funcionalidad del anterior FdpFormComponent,
 * gestionando los controles específicos para este tipo de elemento con campos
 * mejorados y mejor accesibilidad.
 */
@Component({
  selector: 'app-odf-form',
  template: `
    <div class="type-specific-form" [formGroup]="parentForm">
      <h3 class="form-section-title">Información de capacidad</h3>
      
      <div class="form-row" formGroupName="properties">
        <mat-form-field appearance="outline">
          <mat-label>Capacidad total de puertos</mat-label>
          <input 
            matInput 
            type="number" 
            formControlName="totalPortCapacity" 
            placeholder="Capacidad total"
            aria-describedby="totalPortCapacityHint"
            min="1"
            max="1024">
          <mat-icon matSuffix matTooltip="Número total de puertos disponibles en este ODF">info</mat-icon>
          <mat-hint id="totalPortCapacityHint">Número total de puertos físicos</mat-hint>
          <mat-error *ngIf="propertiesGroup?.get('totalPortCapacity')?.hasError('required')">
            La capacidad es obligatoria
          </mat-error>
          <mat-error *ngIf="propertiesGroup?.get('totalPortCapacity')?.hasError('min')">
            Debe tener al menos 1 puerto
          </mat-error>
          <mat-error *ngIf="propertiesGroup?.get('totalPortCapacity')?.hasError('max')">
            El máximo es 1024 puertos
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Puertos utilizados</mat-label>
          <input 
            matInput 
            type="number" 
            formControlName="usedPorts" 
            placeholder="Puertos en uso"
            aria-describedby="usedPortsHint"
            min="0">
          <mat-hint id="usedPortsHint">Cantidad de puertos ya ocupados</mat-hint>
          <mat-error *ngIf="propertiesGroup?.get('usedPorts')?.hasError('min')">
            No puede ser un valor negativo
          </mat-error>
          <mat-error *ngIf="propertiesGroup?.get('usedPorts')?.hasError('max')">
            No puede ser mayor que la capacidad total
          </mat-error>
        </mat-form-field>
      </div>

      <h3 class="form-section-title">Especificaciones técnicas</h3>
      
      <div class="form-row" formGroupName="properties">
        <mat-form-field appearance="outline">
          <mat-label>Tipo de ODF</mat-label>
          <mat-select 
            formControlName="odfType"
            aria-describedby="odfTypeHint">
            <mat-option [value]="ODFType.PRIMARY">Primario</mat-option>
            <mat-option [value]="ODFType.SECONDARY">Secundario</mat-option>
            <mat-option [value]="ODFType.TERTIARY">Terciario</mat-option>
          </mat-select>
          <mat-hint id="odfTypeHint">Nivel jerárquico del ODF en la red</mat-hint>
          <mat-error *ngIf="propertiesGroup?.get('odfType')?.hasError('required')">
            El tipo de ODF es obligatorio
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Tipo de montaje</mat-label>
          <mat-select 
            formControlName="mountingType"
            aria-describedby="mountingTypeHint">
            <mat-option value="rack">Rack</mat-option>
            <mat-option value="wall">Mural</mat-option>
            <mat-option value="pole">Poste</mat-option>
            <mat-option value="aerial">Aéreo</mat-option>
            <mat-option value="underground">Subterráneo</mat-option>
            <mat-option value="cabinet">Gabinete</mat-option>
          </mat-select>
          <mat-hint id="mountingTypeHint">Tipo de instalación física</mat-hint>
          <mat-error *ngIf="propertiesGroup?.get('mountingType')?.hasError('required')">
            El tipo de montaje es obligatorio
          </mat-error>
        </mat-form-field>
      </div>
      
      <div class="form-row" formGroupName="properties">
        <mat-form-field appearance="outline">
          <mat-label>Fabricante</mat-label>
          <input 
            matInput 
            formControlName="manufacturer" 
            placeholder="Nombre del fabricante">
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Modelo</mat-label>
          <input 
            matInput 
            formControlName="model" 
            placeholder="Modelo específico">
        </mat-form-field>
      </div>
      
      <div class="form-row" formGroupName="properties">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Ubicación detallada</mat-label>
          <textarea 
            matInput 
            formControlName="location" 
            placeholder="Descripción precisa de la ubicación"
            rows="2"></textarea>
          <mat-hint align="end">{{propertiesGroup?.get('location')?.value?.length || 0}}/200</mat-hint>
        </mat-form-field>
      </div>
    </div>
  `,
  styles: [`
    .type-specific-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 8px 0;
    }
    
    .form-section-title {
      font-size: 16px;
      font-weight: 500;
      margin: 8px 0 0;
      color: var(--primary-color, #1976d2);
      border-bottom: 1px solid var(--divider-color, rgba(0,0,0,0.12));
      padding-bottom: 8px;
    }
    
    .form-row {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
      margin-bottom: 8px;
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
    MatIconModule,
    MatTooltipModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OdfFormComponent {
  @Input() parentForm!: FormGroup;
  
  // Exposición de enumeraciones para la plantilla
  ODFType = ODFType;
  
  /**
   * Getter para acceder al grupo de propiedades específicas
   */
  get propertiesGroup(): FormGroup | null {
    return this.parentForm?.get('properties') as FormGroup;
  }
} 