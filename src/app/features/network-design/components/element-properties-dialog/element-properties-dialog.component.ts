import { Component, Inject, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators, ValidatorFn, AbstractControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NetworkElement, ElementStatus, ElementType, PONStandard, FiberType, ODFType, SplitterType } from '../../../../shared/types/network.types';
import { ElementService } from '../../services/element.service';
import { ElementValidatorsService } from '../../services/element-validators.service';
import { BaseViewComponent } from '../base-view.component';
import { takeUntil, finalize } from 'rxjs/operators';

interface DialogData {
  elementId: string;
  element?: NetworkElement;
}

@Component({
  selector: 'app-element-properties-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatIconModule,
    MatDividerModule,
    MatExpansionModule,
    MatProgressSpinnerModule
  ],
  template: `
    <h2 mat-dialog-title>Propiedades del Elemento {{ element?.type ? '(' + getElementTypeName(element.type) + ')' : '' }}</h2>
    
    <ng-container *ngIf="loading; else formContent">
      <div class="loading-container">
        <mat-spinner diameter="40"></mat-spinner>
        <p>Cargando datos del elemento...</p>
      </div>
    </ng-container>
    
    <ng-template #formContent>
      <div *ngIf="error" class="error-message">
        <mat-icon>error</mat-icon>
        <span>{{ error }}</span>
      </div>
      
    <form [formGroup]="elementForm" (ngSubmit)="onSubmit()">
      <div mat-dialog-content>
          <!-- Sección de campos comunes -->
          <div class="form-section">
            <h3>Información básica</h3>
            
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Nombre</mat-label>
          <input matInput formControlName="name" placeholder="Nombre del elemento">
              <mat-error *ngIf="hasError('name', 'required')">
            El nombre es obligatorio
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Código</mat-label>
          <input matInput formControlName="code" placeholder="Código de identificación">
              <mat-error *ngIf="hasError('code', 'required')">
            El código es obligatorio
          </mat-error>
              <mat-error *ngIf="hasError('code', 'pattern')">
                El código debe contener solo letras, números, puntos, guiones y guiones bajos
              </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Descripción</mat-label>
          <textarea matInput formControlName="description" rows="3" placeholder="Descripción detallada"></textarea>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Estado</mat-label>
          <mat-select formControlName="status">
            <mat-option [value]="elementStatuses.ACTIVE">Activo</mat-option>
            <mat-option [value]="elementStatuses.INACTIVE">Inactivo</mat-option>
            <mat-option [value]="elementStatuses.MAINTENANCE">Mantenimiento</mat-option>
            <mat-option [value]="elementStatuses.FAULT">Fallo</mat-option>
                <mat-option [value]="elementStatuses.PLANNED">Planificado</mat-option>
                <mat-option [value]="elementStatuses.BUILDING">En construcción</mat-option>
                <mat-option [value]="elementStatuses.RESERVED">Reservado</mat-option>
                <mat-option [value]="elementStatuses.DECOMMISSIONED">Fuera de servicio</mat-option>
          </mat-select>
        </mat-form-field>
          </div>
          
          <!-- Sección de campos específicos según el tipo de elemento -->
          <div *ngIf="additionalFields.length > 0" class="form-section">
            <mat-divider class="section-divider"></mat-divider>
            
            <h3>Propiedades específicas</h3>
            
            <ng-container *ngFor="let field of additionalFields">
              <!-- Campos de texto -->
              <mat-form-field *ngIf="field.type === 'text'" appearance="outline" class="full-width">
                <mat-label>{{ field.label }}</mat-label>
                <input matInput [formControlName]="field.name" [placeholder]="field.label">
                <mat-error *ngIf="hasError(field.name, 'required')">
                  Este campo es obligatorio
                </mat-error>
                <mat-error *ngIf="hasError(field.name, 'pattern')">
                  Formato inválido
                </mat-error>
                <mat-error *ngIf="hasError(field.name, 'maxlength')">
                  Excede la longitud máxima permitida
                </mat-error>
              </mat-form-field>
              
              <!-- Campos numéricos -->
              <mat-form-field *ngIf="field.type === 'number'" appearance="outline" class="full-width">
                <mat-label>{{ field.label }}</mat-label>
                <input matInput type="number" [formControlName]="field.name" [placeholder]="field.label">
                <mat-error *ngIf="hasError(field.name, 'required')">
                  Este campo es obligatorio
                </mat-error>
                <mat-error *ngIf="hasError(field.name, 'min')">
                  El valor debe ser mayor que {{ getErrorValue(field.name, 'min', 'min') }}
                </mat-error>
                <mat-error *ngIf="hasError(field.name, 'max')">
                  El valor debe ser menor que {{ getErrorValue(field.name, 'max', 'max') }}
                </mat-error>
              </mat-form-field>
              
              <!-- Campos de selección -->
              <mat-form-field *ngIf="field.type === 'select'" appearance="outline" class="full-width">
                <mat-label>{{ field.label }}</mat-label>
                <mat-select [formControlName]="field.name">
                  <mat-option *ngFor="let option of field.options" [value]="option">
                    {{ option }}
                  </mat-option>
                </mat-select>
                <mat-error *ngIf="hasError(field.name, 'required')">
                  Este campo es obligatorio
                </mat-error>
              </mat-form-field>
              
              <!-- Campos de selección múltiple -->
              <mat-form-field *ngIf="field.type === 'multiselect'" appearance="outline" class="full-width">
                <mat-label>{{ field.label }}</mat-label>
                <mat-select [formControlName]="field.name" multiple>
                  <mat-option *ngFor="let option of field.options" [value]="option">
                    {{ option }}
                  </mat-option>
                </mat-select>
                <mat-error *ngIf="hasError(field.name, 'required')">
                  Este campo es obligatorio
                </mat-error>
              </mat-form-field>
              
              <!-- Campos de checkbox -->
              <div *ngIf="field.type === 'checkbox'" class="checkbox-field">
                <mat-checkbox [formControlName]="field.name">{{ field.label }}</mat-checkbox>
              </div>
              
              <!-- Campos de colección (FormArray) -->
              <div *ngIf="field.type === 'array'" class="array-field-container">
                <h4>{{ field.label }}</h4>
                
                <div [formArrayName]="field.name">
                  <div *ngFor="let item of getFormArray(field.name).controls; let i = index" class="array-item">
                    <div [formGroupName]="i" class="array-item-content">
                      <ng-container *ngFor="let subField of field.subFields">
                        <mat-form-field appearance="outline" class="full-width">
                          <mat-label>{{ subField.label }}</mat-label>
                          <input matInput [formControlName]="subField.name" [placeholder]="subField.label">
                          <mat-error *ngIf="hasNestedError(field.name, i, subField.name, 'required')">
                            Este campo es obligatorio
                          </mat-error>
                        </mat-form-field>
                      </ng-container>
                      
                      <button mat-icon-button type="button" (click)="removeArrayItem(field.name, i)" 
                          class="remove-item-btn" aria-label="Eliminar elemento">
                        <mat-icon>delete</mat-icon>
                      </button>
                    </div>
                  </div>
                  
                  <button mat-stroked-button type="button" (click)="addArrayItem(field.name, field.subFields)" 
                      class="add-item-btn" color="primary">
                    <mat-icon>add</mat-icon> Añadir {{ field.itemLabel || 'elemento' }}
                  </button>
                </div>
              </div>
            </ng-container>
          </div>
          
          <!-- Errores de validación a nivel de formulario -->
          <div *ngIf="formErrors.length > 0" class="form-errors">
            <mat-error *ngFor="let error of formErrors">
              {{ error }}
            </mat-error>
          </div>
      </div>
      
      <div mat-dialog-actions align="end">
          <button mat-button type="button" (click)="onCancel()" [disabled]="saving">Cancelar</button>
          <button mat-raised-button color="primary" type="submit" [disabled]="elementForm.invalid || saving || formErrors.length > 0">
            <mat-spinner *ngIf="saving" diameter="20" class="button-spinner"></mat-spinner>
            <span *ngIf="!saving">Guardar</span>
        </button>
      </div>
    </form>
    </ng-template>
  `,
  styles: [`
    .full-width {
      width: 100%;
      margin-bottom: 12px;
    }
    
    mat-dialog-content {
      min-height: 250px;
      max-height: 65vh;
    }
    
    .form-section {
      margin-bottom: 24px;
    }
    
    .section-divider {
      margin: 12px 0 24px 0;
    }
    
    h3 {
      margin-top: 0;
      margin-bottom: 16px;
      color: rgba(0, 0, 0, 0.7);
      font-weight: 500;
      font-size: 16px;
    }
    
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      min-height: 200px;
    }
    
    .loading-container p {
      margin-top: 1rem;
      color: rgba(0, 0, 0, 0.6);
    }
    
    .error-message {
      display: flex;
      align-items: center;
      background-color: #ffebee;
      color: #c62828;
      padding: 10px 16px;
      border-radius: 4px;
      margin-bottom: 16px;
    }
    
    .error-message mat-icon {
      margin-right: 8px;
    }
    
    .button-spinner {
      display: inline-block;
      margin-right: 8px;
    }
    
    .checkbox-field {
      margin-bottom: 16px;
    }
    
    .form-errors {
      margin-top: 16px;
      padding: 12px;
      background-color: #fff8e1;
      border-radius: 4px;
      border-left: 4px solid #ffc107;
    }
    
    .form-errors mat-error {
      display: block;
      margin-bottom: 8px;
      color: #e65100;
    }
    
    .form-errors mat-error:last-child {
      margin-bottom: 0;
    }
    
    .array-field-container {
      margin-bottom: 24px;
    }
    
    .array-field-container h4 {
      margin-top: 8px;
      margin-bottom: 12px;
      font-weight: 500;
    }
    
    .array-item {
      background-color: #f9f9f9;
      border-radius: 4px;
      margin-bottom: 8px;
      position: relative;
    }
    
    .array-item-content {
      padding: 12px;
      padding-right: 48px;
    }
    
    .remove-item-btn {
      position: absolute;
      top: 8px;
      right: 8px;
      color: #e53935;
    }
    
    .add-item-btn {
      margin-top: 8px;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ElementPropertiesDialogComponent extends BaseViewComponent implements OnInit {
  elementForm: FormGroup;
  elementStatuses = ElementStatus;
  element?: NetworkElement;
  saving = false;
  additionalFields: { name: string, type: string, label: string, required: boolean, options?: unknown[], subFields?: any[], itemLabel?: string }[] = [];
  formErrors: string[] = [];
  
  // Inyección de dependencias modernas
  private fb = inject(FormBuilder);
  private elementService = inject(ElementService);
  private validatorsService = inject(ElementValidatorsService);
  public dialogRef = inject(MatDialogRef<ElementPropertiesDialogComponent>);
  public data = inject<DialogData>(MAT_DIALOG_DATA);
  
  constructor(protected cdr: ChangeDetectorRef) {
    super(cdr);
    
    // Inicializar formulario vacío con campos básicos
    this.elementForm = this.fb.group({
      name: ['', Validators.required],
      code: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9_\-.]+$/)]],
      description: [''],
      status: [ElementStatus.INACTIVE]
    });
  }

  /**
   * Inicializa el estado del componente
   */
  protected initializeState(): void {
    // Iniciar carga si tenemos ID
    if (this.data.elementId) {
      this.loadElement(this.data.elementId);
    } 
    // Si recibimos un elemento directamente, usarlo
    else if (this.data.element) {
      this.element = this.data.element;
      this.setupFormForElementType();
      this.populateForm();
      this.setLoading(false);
    } 
    // No hay datos para cargar
    else {
      this.updateError('No se proporcionó un ID de elemento válido');
    }
  }
  
  /**
   * Configura el formulario para el tipo de elemento específico
   */
  private setupFormForElementType(): void {
    if (!this.element) return;
    
    // Obtener los campos adicionales para este tipo de elemento
    this.additionalFields = this.validatorsService.getAdditionalFieldsForType(this.element.type);
    
    // Crear controles para los campos adicionales
    const additionalControls: { [key: string]: any } = {};
    
    this.additionalFields.forEach(field => {
      // Manejar campos tipo array de forma especial
      if (field.type === 'array') {
        // Crear un FormArray vacío
        additionalControls[field.name] = this.fb.array([]);
      } else {
        // Para campos normales, usar la lógica existente
        const validators = this.validatorsService.getValidatorsForType(this.element!.type)[field.name] || [];
        additionalControls[field.name] = ['', validators];
      }
    });
    
    // Añadir los controles adicionales al formulario
    this.elementForm = this.fb.group({
      ...this.elementForm.controls,
      ...additionalControls
    });
    
    // Añadir validador a nivel de formulario si existe
    const formValidator = this.validatorsService.getCustomFormValidators(this.element.type);
    if (formValidator) {
      this.elementForm.setValidators(formValidator);
    }
    
    // Suscribirse a cambios en el formulario para detectar errores a nivel de formulario
    this.elementForm.statusChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.updateFormErrors();
      this.cdr.markForCheck();
    });
  }
  
  /**
   * Actualiza la lista de errores a nivel de formulario
   */
  private updateFormErrors(): void {
    this.formErrors = [];
    const formErrors = this.elementForm.errors;
    
    if (formErrors) {
      Object.keys(formErrors).forEach(key => {
        // Cada error puede tener un mensaje personalizado o usar la clave como mensaje
        const errorDetail = formErrors[key];
        if (errorDetail && errorDetail.message) {
          this.formErrors.push(errorDetail.message);
        } else {
          this.formErrors.push(`Error de validación: ${key}`);
        }
      });
    }
    
    this.cdr.markForCheck();
  }
  
  /**
   * Configura suscripciones a observables
   */
  protected subscribeToChanges(): void {
    // No hay suscripciones continuas para configurar en este componente
  }
  
  /**
   * Carga los datos del elemento desde el servicio
   */
  private loadElement(elementId: string): void {
    this.setLoading(true);
    this.cdr.markForCheck();
    
    this.elementService.getElementById(elementId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.setLoading(false);
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (element) => {
          this.element = element;
          this.setupFormForElementType();
          this.populateForm();
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.updateError(`Error al cargar el elemento: ${err.message || 'Error desconocido'}`);
          this.cdr.markForCheck();
        }
      });
  }
  
  /**
   * Obtiene el valor de una propiedad anidada a partir de un path (ej: 'bandwidth.downstreamCapacity')
   * @param obj Objeto que contiene la propiedad
   * @param path Ruta de acceso a la propiedad con notación de puntos
   * @returns El valor de la propiedad o undefined si no existe
   */
  private getNestedProperty(obj: any, path: string): any {
    if (!obj || !path) return undefined;
    
    const parts = path.split('.');
    let value = obj;
    
    for (const part of parts) {
      if (value === undefined || value === null) return undefined;
      value = value[part];
    }
    
    return value;
  }
  
  /**
   * Establece el valor de una propiedad anidada a partir de un path
   * @param obj Objeto en el que se establecerá la propiedad
   * @param path Ruta de acceso a la propiedad con notación de puntos
   * @param value Valor a establecer
   */
  private setNestedProperty(obj: any, path: string, value: any): void {
    if (!obj || !path) return;
    
    const parts = path.split('.');
    let target = obj;
    
    // Navegar hasta el penúltimo nivel y crear objetos intermedios si no existen
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (target[part] === undefined || target[part] === null) {
        target[part] = {};
      }
      target = target[part];
    }
    
    // Establecer el valor en la propiedad final
    const lastPart = parts[parts.length - 1];
    target[lastPart] = value;
  }
  
  /**
   * Rellena el formulario con los datos del elemento
   */
  private populateForm(): void {
    if (!this.element) return;
    
    // Rellenar campos básicos
    const basicValues = {
      name: this.element.name,
      code: this.element.code,
      description: this.element.description || '',
      status: this.element.status
    };
    
    // Crear objeto con todos los valores
    let formValues: { [key: string]: any } = { ...basicValues };
    
    // Añadir valores específicos según el tipo de elemento
    this.additionalFields.forEach(field => {
      // Manejar campos de tipo array de forma especial
      if (field.type === 'array' && field.subFields) {
        // Obtener el array de datos
        const arrayData = this.getNestedProperty(this.element, field.name) || [];
        
        // Obtener el FormArray
        const formArray = this.getFormArray(field.name);
        
        // Limpiar el FormArray existente
        while (formArray.length) {
          formArray.removeAt(0);
        }
        
        // Añadir elementos al FormArray
        arrayData.forEach((item: any) => {
          // Crear un grupo para el item
          const group: { [key: string]: any } = {};
          
          // Configurar controles para cada subField
          if (field.subFields) {
            field.subFields.forEach((subField: any) => {
              const validators = subField.required ? [Validators.required] : [];
              if (subField.validators) {
                validators.push(...subField.validators);
              }
              
              group[subField.name] = [item[subField.name] || '', validators];
            });
          }
          
          // Añadir el grupo al FormArray
          formArray.push(this.fb.group(group));
        });
      } else {
        // Para campos normales, usar la lógica existente
        formValues[field.name] = this.getNestedProperty(this.element, field.name) ?? '';
      }
    });
    
    // Actualizar formulario con todos los valores
    this.elementForm.patchValue(formValues);
    
    // Ejecutar validación para detectar errores iniciales
    this.elementForm.updateValueAndValidity();
    this.updateFormErrors();
    this.cdr.markForCheck();
  }
  
  /**
   * Actualiza o guarda el elemento
   */
  onSubmit(): void {
    if (this.elementForm.valid && this.element) {
      this.saving = true;
      this.cdr.markForCheck();
      
      // Obtener valores del formulario
      const formValues = this.elementForm.value;
      
      // Crear una copia del elemento como base
      const updatedElement = { ...this.element };
      
      // Actualizar propiedades básicas
      updatedElement.name = formValues.name;
      updatedElement.code = formValues.code;
      updatedElement.description = formValues.description;
      updatedElement.status = formValues.status;
      updatedElement.updatedAt = new Date();
      
      // Actualizar propiedades específicas
      this.additionalFields.forEach(field => {
        // Manejar campos de tipo array de forma especial
        if (field.type === 'array') {
          // Obtener los valores del FormArray
          const arrayData = formValues[field.name];
          
          // Establecer la propiedad anidada
          this.setNestedProperty(updatedElement, field.name, arrayData);
        } else {
          // Para campos normales, usar la lógica existente
          this.setNestedProperty(updatedElement, field.name, formValues[field.name]);
        }
      });
      
      // Si es un elemento existente, actualizarlo
      if (this.element.id) {
        this.elementService.updateElement(this.element.id, updatedElement)
          .pipe(
            takeUntil(this.destroy$),
            finalize(() => {
              this.saving = false;
              this.cdr.markForCheck();
            })
          )
          .subscribe({
            next: (element) => {
              this.dialogRef.close(element);
            },
            error: (err) => {
              this.updateError(`Error al guardar el elemento: ${err.message || 'Error desconocido'}`);
            }
          });
      } else {
        // Si no tiene ID, es un elemento nuevo
      this.dialogRef.close(updatedElement);
      }
    }
  }
  
  /**
   * Obtiene el nombre legible del tipo de elemento
   */
  getElementTypeName(type: ElementType): string {
    switch (type) {
      case ElementType.OLT:
        return 'Terminal de Línea Óptica';
      case ElementType.ONT:
        return 'Terminal de Red Óptica';
      case ElementType.ODF:
        return 'Distribuidor de Fibra Óptica';
      case ElementType.SPLITTER:
        return 'Divisor Óptico';
      case ElementType.EDFA:
        return 'Amplificador de Fibra Dopada con Erbio';
      case ElementType.MANGA:
        return 'Manga de Empalme';
      case ElementType.FIBER_THREAD:
        return 'Hilo de Fibra';
      case ElementType.RACK:
        return 'Rack';
      default:
        return type.toString();
    }
  }
  
  /**
   * Comprueba si un campo del formulario tiene un error específico
   * @param controlName Nombre del control
   * @param errorName Nombre del error
   * @returns true si el control tiene el error especificado
   */
  hasError(controlName: string, errorName: string): boolean {
    const control = this.elementForm.get(controlName);
    if (!control) return false;
    
    return control.touched && control.hasError(errorName);
  }
  
  /**
   * Obtiene el valor de un error específico
   * @param controlName Nombre del control
   * @param errorName Nombre del error
   * @param propertyName Nombre de la propiedad del error a obtener
   * @returns Valor de la propiedad del error
   */
  getErrorValue(controlName: string, errorName: string, propertyName: string): any {
    const control = this.elementForm.get(controlName);
    if (!control || !control.hasError(errorName)) return null;
    
    const error = control.getError(errorName);
    return error[propertyName];
  }
  
  /**
   * Establece un mensaje de error
   */
  private updateError(message: string): void {
    this.error$.next(message);
    this.setLoading(false);
    this.cdr.markForCheck();
  }

  /**
   * Cierra el diálogo sin guardar
   */
  onCancel(): void {
    this.dialogRef.close();
  }

  /**
   * Obtiene un FormArray del formulario
   * @param name Nombre del FormArray
   * @returns El FormArray solicitado
   */
  getFormArray(name: string): FormArray {
    return this.elementForm.get(name) as FormArray;
  }
  
  /**
   * Verifica si un control de un FormArray tiene un error
   * @param arrayName Nombre del FormArray
   * @param index Índice del elemento
   * @param controlName Nombre del control
   * @param errorName Nombre del error
   * @returns true si el control tiene el error especificado
   */
  hasNestedError(arrayName: string, index: number, controlName: string, errorName: string): boolean {
    const array = this.getFormArray(arrayName);
    if (!array || !array.controls[index]) return false;
    
    const group = array.controls[index] as FormGroup;
    const control = group.get(controlName);
    if (!control) return false;
    
    return control.touched && control.hasError(errorName);
  }
  
  /**
   * Añade un nuevo elemento a un FormArray
   * @param arrayName Nombre del FormArray
   * @param subFields Configuración de los campos que debe contener cada elemento
   */
  addArrayItem(arrayName: string, subFields: any[]): void {
    const array = this.getFormArray(arrayName);
    
    // Crear un formGroup para el nuevo elemento
    const group: { [key: string]: any } = {};
    
    // Configurar los controles según los subFields
    if (subFields && subFields.length > 0) {
      subFields.forEach(subField => {
        const validators = subField.required ? [Validators.required] : [];
        // Añadir otros validadores según configuración
        if (subField.validators) {
          validators.push(...subField.validators);
        }
        
        group[subField.name] = ['', validators];
      });
    }
    
    // Añadir el nuevo grupo al array
    array.push(this.fb.group(group));
    this.cdr.markForCheck();
  }
  
  /**
   * Elimina un elemento de un FormArray
   * @param arrayName Nombre del FormArray
   * @param index Índice del elemento a eliminar
   */
  removeArrayItem(arrayName: string, index: number): void {
    const array = this.getFormArray(arrayName);
    array.removeAt(index);
    this.cdr.markForCheck();
  }
} 