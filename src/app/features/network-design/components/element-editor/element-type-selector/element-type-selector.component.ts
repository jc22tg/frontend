import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ElementType } from '../../../../../shared/types/network.types';

/**
 * Interfaz para configuración de tipos de elementos
 */
export interface ElementTypeConfig {
  type: ElementType;
  name: string;
  icon: string;
  isObsolete?: boolean;
  replacedBy?: ElementType;
  description?: string;
}

/**
 * Componente para la selección visual del tipo de elemento
 */
@Component({
  selector: 'app-element-type-selector',
  template: `
    <mat-card class="type-selector-card" [formGroup]="parentForm">
      <mat-card-header>
        <mat-card-title>Selecciona el tipo de elemento</mat-card-title>
        <mat-card-subtitle>Selecciona el tipo de elemento que deseas crear</mat-card-subtitle>
      </mat-card-header>
      
      <mat-card-content>
        <div class="type-grid" role="radiogroup" aria-label="Tipos de elementos disponibles">
          <button 
            *ngFor="let type of elementTypes" 
            type="button"
            class="type-button" 
            [class.selected]="isSelected(type)"
            [class.obsolete]="isObsolete(type)"
            (click)="selectType(type)"
            [attr.aria-pressed]="isSelected(type)"
            [attr.aria-label]="getAriaLabel(type)"
            [matTooltip]="getTooltip(type)"
            role="radio"
          >
            <mat-icon>{{ getIconForType(type) }}</mat-icon>
            <span>{{ getTypeName(type) }}</span>
            <span class="obsolete-badge" *ngIf="isObsolete(type)">Obsoleto</span>
          </button>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .type-selector-card {
      margin-bottom: 20px;
    }
    
    .type-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
      gap: 16px;
      margin-top: 16px;
    }
    
    .type-button {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 16px;
      border: 1px solid #ccc;
      border-radius: 8px;
      background: white;
      cursor: pointer;
      transition: all 0.2s ease;
      position: relative;
      
      &:hover {
        background: #f5f5f5;
        transform: translateY(-2px);
      }
      
      &.selected {
        background: var(--primary-light, #e3f2fd);
        border-color: var(--primary-color, #2196f3);
        color: var(--primary-color, #2196f3);
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
      
      &.obsolete {
        opacity: 0.7;
        border-style: dashed;
        background-color: #f5f5f5;
        
        &:hover {
          background-color: #ebebeb;
        }
      }
      
      mat-icon {
        font-size: 32px;
        height: 32px;
        width: 32px;
        margin-bottom: 8px;
      }
      
      .obsolete-badge {
        position: absolute;
        top: 5px;
        right: 5px;
        font-size: 10px;
        padding: 2px 5px;
        background-color: #ff9800;
        color: white;
        border-radius: 8px;
        font-weight: bold;
      }
    }
    
    @media screen and (max-width: 768px) {
      .type-grid {
        grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
      }
      
      .type-button {
        padding: 12px;
        
        mat-icon {
          font-size: 24px;
          height: 24px;
          width: 24px;
        }
        
        span {
          font-size: 12px;
        }
      }
    }
  `],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ElementTypeSelectorComponent {
  @Input() parentForm!: FormGroup;
  @Input() elementTypes: ElementType[] = [];
  @Output() typeSelected = new EventEmitter<ElementType>();
  
  // Mapa de configuración de tipos para mejor escalabilidad
  private readonly typeConfigMap: Map<ElementType, ElementTypeConfig> = new Map([
    [ElementType.OLT, { 
      type: ElementType.OLT, 
      name: 'OLT', 
      icon: 'router',
      description: 'Optical Line Terminal - Equipo central que controla la red'
    }],
    [ElementType.ONT, { 
      type: ElementType.ONT, 
      name: 'ONT', 
      icon: 'devices',
      description: 'Optical Network Terminal - Equipo terminal en el lado del cliente'
    }],
    [ElementType.FDP, { 
      type: ElementType.FDP, 
      name: 'FDP', 
      icon: 'hub',
      isObsolete: true,
      replacedBy: ElementType.ODF,
      description: 'Fiber Distribution Point (OBSOLETO) - Reemplazado por ODF'
    }],
    [ElementType.ODF, { 
      type: ElementType.ODF, 
      name: 'ODF', 
      icon: 'dashboard',
      description: 'Optical Distribution Frame - Distribuidor de fibra óptica'
    }],
    [ElementType.EDFA, { 
      type: ElementType.EDFA, 
      name: 'EDFA', 
      icon: 'signal_cellular_alt',
      description: 'Erbium Doped Fiber Amplifier - Amplificador de fibra dopada con erbio'
    }],
    [ElementType.SPLITTER, { 
      type: ElementType.SPLITTER, 
      name: 'Splitter', 
      icon: 'call_split',
      description: 'Divisor de señal óptica'
    }],
    [ElementType.MANGA, { 
      type: ElementType.MANGA, 
      name: 'Manga', 
      icon: 'construction',
      description: 'Manga de empalme para fibras ópticas'
    }],
    [ElementType.TERMINAL_BOX, { 
      type: ElementType.TERMINAL_BOX, 
      name: 'Caja Terminal', 
      icon: 'view_module',
      description: 'Caja de terminación para conexiones de fibra'
    }],
    [ElementType.FIBER_THREAD, { 
      type: ElementType.FIBER_THREAD, 
      name: 'Hilo de Fibra', 
      icon: 'linear_scale',
      description: 'Hilo individual de fibra óptica'
    }],
    [ElementType.DROP_CABLE, { 
      type: ElementType.DROP_CABLE, 
      name: 'Cable Drop', 
      icon: 'cable',
      description: 'Cable de acometida al cliente'
    }],
    [ElementType.DISTRIBUTION_CABLE, { 
      type: ElementType.DISTRIBUTION_CABLE, 
      name: 'Cable Distribución', 
      icon: 'cable',
      description: 'Cable de distribución en la red'
    }],
    [ElementType.FEEDER_CABLE, { 
      type: ElementType.FEEDER_CABLE, 
      name: 'Cable Alimentador', 
      icon: 'cable',
      description: 'Cable alimentador principal'
    }],
    [ElementType.BACKBONE_CABLE, { 
      type: ElementType.BACKBONE_CABLE, 
      name: 'Cable Troncal', 
      icon: 'cable',
      description: 'Cable troncal de la red'
    }],
    [ElementType.MSAN, { 
      type: ElementType.MSAN, 
      name: 'MSAN', 
      icon: 'router',
      description: 'Multi-Service Access Node'
    }],
    [ElementType.ROUTER, { 
      type: ElementType.ROUTER, 
      name: 'Router', 
      icon: 'router',
      description: 'Enrutador de red'
    }],
    [ElementType.RACK, { 
      type: ElementType.RACK, 
      name: 'Rack', 
      icon: 'inventory_2',
      description: 'Armario para equipos'
    }],
    [ElementType.NETWORK_GRAPH, { 
      type: ElementType.NETWORK_GRAPH, 
      name: 'Grafo de Red', 
      icon: 'account_tree',
      description: 'Representación gráfica de la red'
    }],
    [ElementType.WDM_FILTER, { 
      type: ElementType.WDM_FILTER, 
      name: 'Filtro WDM', 
      icon: 'filter_alt',
      description: 'Filtro para multiplexación por división de longitudes de onda'
    }],
    [ElementType.COHERENT_TRANSPONDER, { 
      type: ElementType.COHERENT_TRANSPONDER, 
      name: 'Transponder Coherente', 
      icon: 'settings_input_hdmi',
      description: 'Transponder para transmisiones ópticas coherentes'
    }],
    [ElementType.WAVELENGTH_ROUTER, { 
      type: ElementType.WAVELENGTH_ROUTER, 
      name: 'Router de Longitud', 
      icon: 'router',
      description: 'Enrutador de longitudes de onda'
    }],
    [ElementType.OPTICAL_SWITCH, { 
      type: ElementType.OPTICAL_SWITCH, 
      name: 'Switch Óptico', 
      icon: 'swap_calls',
      description: 'Conmutador óptico'
    }],
    [ElementType.ROADM, { 
      type: ElementType.ROADM, 
      name: 'ROADM', 
      icon: 'tune',
      description: 'Reconfigurable Optical Add-Drop Multiplexer'
    }],
    [ElementType.OPTICAL_AMPLIFIER, { 
      type: ElementType.OPTICAL_AMPLIFIER, 
      name: 'Amplificador Óptico', 
      icon: 'trending_up',
      description: 'Amplificador general para señales ópticas'
    }],
    [ElementType.FIBER_CONNECTION, { 
      type: ElementType.FIBER_CONNECTION, 
      name: 'Conexión de Fibra', 
      icon: 'swap_horiz',
      description: 'Conexión entre elementos de fibra'
    }],
    [ElementType.FIBER_SPLICE, { 
      type: ElementType.FIBER_SPLICE, 
      name: 'Empalme de Fibra', 
      icon: 'connect_without_contact',
      description: 'Empalme entre hilos de fibra'
    }],
    [ElementType.FIBER_CABLE, { 
      type: ElementType.FIBER_CABLE, 
      name: 'Cable de Fibra', 
      icon: 'cable',
      description: 'Cable general de fibra óptica'
    }],
    [ElementType.FIBER_STRAND, { 
      type: ElementType.FIBER_STRAND, 
      name: 'Hebra de Fibra', 
      icon: 'line_style',
      description: 'Hebra individual de fibra'
    }]
  ]);
  
  /**
   * Selecciona un tipo de elemento
   */
  selectType(type: ElementType): void {
    this.parentForm.get('type')?.setValue(type);
    this.typeSelected.emit(type);
  }
  
  /**
   * Verifica si un tipo está seleccionado
   */
  isSelected(type: ElementType): boolean {
    return this.parentForm.get('type')?.value === type;
  }
  
  /**
   * Verifica si un tipo está marcado como obsoleto
   */
  isObsolete(type: ElementType): boolean {
    return this.getTypeConfig(type)?.isObsolete || false;
  }
  
  /**
   * Obtiene la configuración de un tipo específico
   */
  private getTypeConfig(type: ElementType): ElementTypeConfig | undefined {
    return this.typeConfigMap.get(type);
  }
  
  /**
   * Obtiene el nombre legible del tipo
   */
  getTypeName(type: ElementType): string {
    return this.getTypeConfig(type)?.name || `Tipo ${type}`;
  }
  
  /**
   * Obtiene el icono apropiado para el tipo
   */
  getIconForType(type: ElementType): string {
    return this.getTypeConfig(type)?.icon || 'help';
  }
  
  /**
   * Obtiene la descripción para el tooltip
   */
  getTooltip(type: ElementType): string {
    const config = this.getTypeConfig(type);
    if (!config) return '';
    
    let tooltip = config.description || '';
    
    if (config.isObsolete && config.replacedBy) {
      const replacement = this.getTypeConfig(config.replacedBy);
      tooltip += ` - Este tipo está obsoleto. Utiliza ${replacement?.name || config.replacedBy} en su lugar.`;
    }
    
    return tooltip;
  }
  
  /**
   * Obtiene la etiqueta aria para accesibilidad
   */
  getAriaLabel(type: ElementType): string {
    const config = this.getTypeConfig(type);
    let label = `Tipo de elemento: ${config?.name || type}`;
    
    if (config?.isObsolete) {
      label += ' (obsoleto)';
    }
    
    if (this.isSelected(type)) {
      label += ' - Seleccionado';
    }
    
    return label;
  }
} 