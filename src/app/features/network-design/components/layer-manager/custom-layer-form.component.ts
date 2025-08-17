import { Component, OnInit, Inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { CustomLayer } from '../../../../shared/types/network.types';

export interface CustomLayerFormData {
  layer?: CustomLayer;
  isEditing: boolean;
  availableElements: { id: string; name: string; type: string }[];
}

@Component({
  selector: 'app-custom-layer-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatIconModule,
    MatTooltipModule,
    MatSlideToggleModule
  ],
  template: `
    <h2 mat-dialog-title>{{ data.isEditing ? 'Editar' : 'Crear' }} Capa Personalizada</h2>
    
    <form [formGroup]="layerForm">
      <div mat-dialog-content>
        <div class="form-row">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Nombre de la capa</mat-label>
            <input matInput formControlName="name" placeholder="Ej: Zona crítica">
            <mat-error *ngIf="layerForm.get('name')?.hasError('required')">
              El nombre es obligatorio
            </mat-error>
          </mat-form-field>
        </div>
        
        <div class="form-row">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Descripción</mat-label>
            <textarea matInput formControlName="description" 
                      placeholder="Describa el propósito de esta capa" rows="3"></textarea>
          </mat-form-field>
        </div>
        
        <div class="form-row color-selection">
          <h4>Color de la capa</h4>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Color</mat-label>
            <input matInput type="color" formControlName="color">
          </mat-form-field>
        </div>
        
        <div class="form-row">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Icono</mat-label>
            <input matInput formControlName="icon" placeholder="Ej: layers">
            <mat-hint>Nombre de icono de Material Design</mat-hint>
            <mat-icon matSuffix *ngIf="layerForm.get('icon')?.value">
              {{ layerForm.get('icon')?.value }}
            </mat-icon>
          </mat-form-field>
        </div>
        
        <div class="form-row">
          <h4>Elementos en esta capa</h4>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Seleccionar elementos</mat-label>
            <mat-select formControlName="elementIds" multiple>
              <mat-option *ngFor="let element of data.availableElements" [value]="element.id">
                {{ element.name }} ({{ element.type }})
              </mat-option>
            </mat-select>
          </mat-form-field>
          <div class="selection-summary" *ngIf="layerForm.get('elementIds')?.value?.length">
            <span>{{ layerForm.get('elementIds')?.value?.length }} elementos seleccionados</span>
          </div>
        </div>
        
        <div class="form-row toggles">
          <mat-slide-toggle formControlName="visible" color="primary">
            Capa visible
          </mat-slide-toggle>
          
          <mat-slide-toggle formControlName="isEditable" color="primary" 
                          [disabled]="data.isEditing === false || (!!data.layer && data.layer.isSystem === true)">
            Permitir edición
          </mat-slide-toggle>
        </div>
        
        <div class="form-row">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Prioridad</mat-label>
            <input matInput type="number" formControlName="priority" min="0" max="100">
            <mat-hint>Mayor número = mayor prioridad de visualización</mat-hint>
          </mat-form-field>
        </div>
      </div>
      
      <div mat-dialog-actions align="end">
        <button mat-button (click)="onCancel()">Cancelar</button>
        <button mat-raised-button color="primary" 
                [disabled]="layerForm.invalid"
                (click)="onSave()">
          {{ data.isEditing ? 'Actualizar' : 'Crear' }}
        </button>
      </div>
    </form>
  `,
  styles: [`
    .full-width {
      width: 100%;
    }
    
    .form-row {
      margin-bottom: 16px;
    }
    
    .color-selection {
      display: flex;
      flex-direction: column;
    }
    
    .toggles {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    
    .selection-summary {
      margin-top: 4px;
      color: rgba(0, 0, 0, 0.6);
      font-size: 12px;
    }
    
    h4 {
      margin-bottom: 8px;
      color: rgba(0, 0, 0, 0.6);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CustomLayerFormComponent implements OnInit {
  layerForm: FormGroup;
  
  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<CustomLayerFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CustomLayerFormData
  ) {
    // Valores por defecto para un nuevo formulario
    const defaults = {
      name: '',
      description: '',
      color: '#3f51b5',
      icon: 'layers',
      elementIds: [],
      visible: true,
      isEditable: true,
      priority: 50
    };
    
    // Si estamos editando, usamos los valores de la capa
    const initialValues = data.isEditing && data.layer 
      ? { ...defaults, ...data.layer }
      : defaults;
    
    this.layerForm = this.fb.group({
      name: [initialValues.name, [Validators.required]],
      description: [initialValues.description],
      color: [initialValues.color, [Validators.required]],
      icon: [initialValues.icon],
      elementIds: [initialValues.elementIds || []],
      visible: [initialValues.visible],
      isEditable: [initialValues.isEditable],
      priority: [initialValues.priority, [Validators.required, Validators.min(0), Validators.max(100)]]
    });
    
    // Si es una capa del sistema, deshabilitamos algunos campos
    if (data.isEditing && data.layer && data.layer.isSystem) {
      this.layerForm.get('name')?.disable();
      
      if (!data.layer.isEditable) {
        this.layerForm.get('description')?.disable();
        this.layerForm.get('color')?.disable();
        this.layerForm.get('icon')?.disable();
        this.layerForm.get('elementIds')?.disable();
        this.layerForm.get('priority')?.disable();
      }
    }
  }

  ngOnInit(): void {}

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.layerForm.invalid) {
      return;
    }
    
    const formValues = this.layerForm.value;
    
    // Para capas existentes mantenemos el ID y createdAt originales
    if (this.data.isEditing && this.data.layer) {
      this.dialogRef.close({
        ...this.data.layer,
        ...formValues,
        updatedAt: new Date()
      });
    } else {
      // Para capas nuevas, el servicio asignará el ID y createdAt
      this.dialogRef.close(formValues);
    }
  }
} 
