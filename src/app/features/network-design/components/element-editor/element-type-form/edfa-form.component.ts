import { Component, ChangeDetectionStrategy } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { BaseElementFormComponent } from './base-element-form.component';
import { ElementFormSharedModule } from './element-form-shared.module';

/**
 * Componente para el formulario específico de elementos EDFA
 * 
 * Este componente recibe un FormGroup del componente padre
 * y gestiona los controles específicos para este tipo de elemento.
 */
@Component({
  selector: 'app-edfa-form',
  templateUrl: './edfa-form.component.html',
  styleUrls: ['./shared-form-styles.scss'],
  standalone: true,
  imports: [ElementFormSharedModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EdfaFormComponent extends BaseElementFormComponent {
  // FormGroups para rangos de potencia
  inputPowerRangeGroup!: FormGroup;
  outputPowerRangeGroup!: FormGroup;
  
  /**
   * Inicializa los FormGroups cuando el componente se inicializa
   * Sobrescribe el método de la clase base
   */
  protected override initializeFormGroups(): void {
    if (this.propertiesGroup) {
      this.inputPowerRangeGroup = this.getSubgroup('inputPowerRange') as FormGroup;
      this.outputPowerRangeGroup = this.getSubgroup('outputPowerRange') as FormGroup;
    }
  }
} 