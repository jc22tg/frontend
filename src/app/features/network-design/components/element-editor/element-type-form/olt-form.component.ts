import { Component, ChangeDetectionStrategy } from '@angular/core';
import { BaseElementFormComponent } from './base-element-form.component';
import { ElementFormSharedModule } from './element-form-shared.module';
import { ElementType } from '../../../../../shared/types/network.types';

/**
 * Componente para el formulario específico de elementos OLT
 * 
 * Este componente recibe un FormGroup del componente padre
 * y gestiona los controles específicos para este tipo de elemento.
 */
@Component({
  selector: 'app-olt-form',
  template: `
    <div class="type-specific-form" [formGroup]="parentForm">
      <div class="form-row" formGroupName="properties">
        <mat-form-field appearance="outline">
          <mat-label>Fabricante</mat-label>
          <input matInput formControlName="manufacturer" placeholder="Fabricante">
          <mat-error *ngIf="hasError('manufacturer', 'required')">
            El fabricante es obligatorio
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Modelo</mat-label>
          <input matInput formControlName="model" placeholder="Modelo">
          <mat-error *ngIf="hasError('model', 'required')">
            El modelo es obligatorio
          </mat-error>
        </mat-form-field>
      </div>

      <div class="form-row" formGroupName="properties">
        <mat-form-field appearance="outline">
          <mat-label>Número de Serie</mat-label>
          <input matInput formControlName="serialNumber" placeholder="Número de Serie">
          <mat-error *ngIf="hasError('serialNumber', 'required')">
            El número de serie es obligatorio
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Dirección IP</mat-label>
          <input matInput formControlName="ipAddress" placeholder="Ej. 192.168.1.1">
          <mat-icon matSuffix>lan</mat-icon>
          <mat-error *ngIf="hasError('ipAddress', 'pattern')">
            Formato de IP inválido
          </mat-error>
        </mat-form-field>
      </div>

      <div class="form-row" formGroupName="properties">
        <mat-form-field appearance="outline">
          <mat-label>Puertos Totales</mat-label>
          <input matInput type="number" formControlName="totalPorts" min="1" max="128" placeholder="Número total de puertos">
          <mat-error *ngIf="hasError('totalPorts', 'required')">
            El número de puertos es obligatorio
          </mat-error>
          <mat-error *ngIf="hasError('totalPorts', 'min')">
            Debe tener al menos 1 puerto
          </mat-error>
          <mat-error *ngIf="hasError('totalPorts', 'max')">
            El máximo es 128 puertos
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Puertos Utilizados</mat-label>
          <input matInput type="number" formControlName="usedPorts" min="0" placeholder="Puertos en uso">
          <mat-error *ngIf="hasError('usedPorts', 'min')">
            No puede ser un valor negativo
          </mat-error>
        </mat-form-field>
      </div>
    </div>
  `,
  styleUrls: ['./shared-form-styles.scss'],
  standalone: true,
  imports: [ElementFormSharedModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OltFormComponent extends BaseElementFormComponent {
  // Exponer ElementType para la plantilla si es necesario
  ElementType = ElementType;
  
  /**
   * Inicializa valores adicionales si es necesario
   */
  protected override initializeFormGroups(): void {
    // Implementación puede ser expandida según necesidades
  }
} 