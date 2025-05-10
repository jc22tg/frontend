import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { ElementType } from '../../../../shared/types/network.types';
import { BaseElementFormComponent } from '../element-editor/element-type-form/base-element-form.component';

/**
 * Interfaz para definir las opciones de tipos de elementos
 */
interface TypeOption {
  value: ElementType;
  displayName: string;
  description: string;
  icon: string;
}

/**
 * Componente para seleccionar el tipo de elemento de red
 * 
 * Este componente muestra una grilla de tarjetas para seleccionar
 * el tipo específico de elemento a crear. Extiende BaseElementFormComponent
 * para mantener consistencia con otros componentes de formulario.
 * 
 * @example
 * <app-element-type-selector 
 *   [parentForm]="myForm"
 *   [elementTypes]="allowedTypes"
 *   (typeSelected)="onTypeSelected($event)">
 * </app-element-type-selector>
 */
@Component({
  selector: 'app-element-type-selector',
  template: `
    <div class="element-type-container" [formGroup]="parentForm">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Seleccione el tipo de elemento</mat-card-title>
          <mat-card-subtitle>
            Elija el tipo de elemento que desea crear
          </mat-card-subtitle>
        </mat-card-header>
        
        <mat-card-content>
          <div class="type-grid">
            <div
              *ngFor="let typeOption of typeOptions"
              class="type-card"
              [class.selected]="isSelected(typeOption.value)"
              (click)="selectType(typeOption.value)"
              [matTooltip]="typeOption.description"
              matTooltipPosition="above">
              <div class="icon-container">
                <mat-icon class="type-icon">{{ typeOption.icon }}</mat-icon>
              </div>
              <div class="name">{{ typeOption.displayName }}</div>
            </div>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .element-type-container {
      margin-bottom: 1rem;
    }
    
    .type-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
      gap: 1rem;
      margin-top: 1rem;
    }
    
    .type-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 1rem;
      border-radius: 8px;
      background-color: #f5f5f5;
      cursor: pointer;
      transition: all 0.2s ease;
      border: 2px solid transparent;
      
      &:hover {
        background-color: #e0e0e0;
        transform: translateY(-2px);
      }
      
      &.selected {
        background-color: #e3f2fd;
        border-color: #2196f3;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }
      
      .icon-container {
        background-color: #fff;
        border-radius: 50%;
        width: 50px;
        height: 50px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 0.5rem;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }
      
      .type-icon {
        font-size: 24px;
        color: #2196f3;
      }
      
      .name {
        font-size: 14px;
        font-weight: 500;
        text-align: center;
      }
    }
    
    @media (max-width: 600px) {
      .type-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
  `],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatGridListModule,
    MatIconModule,
    MatTooltipModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ElementTypeSelectorComponent extends BaseElementFormComponent {
  @Input() elementTypes: ElementType[] = [];
  @Output() typeSelected = new EventEmitter<ElementType>();
  
  /**
   * Lista de opciones de tipos disponibles con su información asociada
   */
  typeOptions: TypeOption[] = [
    {
      value: ElementType.OLT,
      displayName: 'OLT',
      description: 'Terminal de Línea Óptica para redes PON',
      icon: 'router'
    },
    {
      value: ElementType.ODF,
      displayName: 'ODF',
      description: 'Distribución de Fibra Óptica',
      icon: 'view_comfy'
    },
    {
      value: ElementType.ONT,
      displayName: 'ONT',
      description: 'Terminal de Red Óptica para usuario final',
      icon: 'desktop_windows'
    },
    {
      value: ElementType.SPLITTER,
      displayName: 'Splitter',
      description: 'Divisor óptico para redes PON',
      icon: 'device_hub'
    },
    {
      value: ElementType.EDFA,
      displayName: 'EDFA',
      description: 'Amplificador de Fibra Dopada con Erbio',
      icon: 'amp_stories'
    },
    {
      value: ElementType.MANGA,
      displayName: 'Manga',
      description: 'Manga para empalmes de fibra óptica',
      icon: 'linear_scale'
    },
    {
      value: ElementType.TERMINAL_BOX,
      displayName: 'Caja Terminal',
      description: 'Caja terminal para conexiones de fibra',
      icon: 'ballot'
    }
  ];
  
  /**
   * Subject para manejar la cancelación de suscripciones
   * @private
   */
  private destroy$ = new Subject<void>();
  
  /**
   * Inicializa el componente y filtra los tipos disponibles
   * según la lista elementTypes proporcionada
   */
  protected override initializeFormGroups(): void {
    // Filtrar las opciones de tipo basadas en los tipos permitidos
    if (this.elementTypes && this.elementTypes.length > 0) {
      this.typeOptions = this.typeOptions.filter(option => 
        this.elementTypes.includes(option.value)
      );
    }
    
    // Suscribirnos a cambios en el tipo si es necesario
    if (this.parentForm.get('type')) {
      this.parentForm.get('type')?.valueChanges
        .pipe(takeUntil(this.destroy$))
        .subscribe(type => {
          // Podríamos realizar acciones adicionales cuando cambia el tipo
        });
    }
  }
  
  /**
   * Limpieza de recursos al destruir el componente
   */
  protected override cleanupResources(): void {
    this.destroy$.next();
    this.destroy$.complete();
    
    // Llamar a la implementación base
    super.cleanupResources();
  }
  
  /**
   * Selecciona un tipo de elemento y emite el evento correspondiente
   * 
   * @param type El tipo de elemento seleccionado
   */
  selectType(type: ElementType): void {
    this.parentForm.get('type')?.setValue(type);
    this.typeSelected.emit(type);
  }
  
  /**
   * Verifica si un tipo está seleccionado actualmente
   * 
   * @param type El tipo de elemento a verificar
   * @returns true si el tipo está seleccionado, false en caso contrario
   */
  isSelected(type: ElementType): boolean {
    return this.parentForm.get('type')?.value === type;
  }
} 