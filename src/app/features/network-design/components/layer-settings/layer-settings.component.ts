import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ElementType } from '../../../../shared/types/network.types';
import { LayerManagerService } from '../../services/layer-manager.service';
import { LoggerService } from '../../../../core/services/logger.service';
import { BehaviorSubject, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

/**
 * Constantes utilizadas en el componente
 */
const CONSTANTS = {
  /** Clave para almacenar presets en localStorage */
  USER_PRESETS_STORAGE_KEY: 'network-map:layer-presets',
  /** Colores utilizados en estilos */
  COLORS: {
    TEXT_SECONDARY: '#666',
  },
  /** Límite de capas a mostrar antes de indicar "+X más" */
  MAX_VISIBLE_LAYERS_IN_PRESET: 3,
  /** Estilos y espaciados */
  SPACING: {
    DEFAULT: '16px',
    SMALL: '8px',
    XSMALL: '4px',
  }
};

/**
 * Interfaz para un preset de capas guardado
 */
export interface LayerPreset {
  /** Identificador único del preset */
  id: string;
  /** Nombre descriptivo del preset */
  name: string;
  /** Descripción opcional del preset */
  description?: string;
  /** Lista de tipos de elementos incluidos en la capa */
  layers: ElementType[];
  /** Fecha de creación (timestamp) */
  createdAt: number;
  /** Fecha de última actualización (timestamp) */
  updatedAt: number;
}

/**
 * Componente para gestionar la configuración de capas del mapa de red
 * 
 * Este componente permite a los usuarios ver y administrar qué capas (tipos de elementos)
 * se muestran en el mapa. Incluye funcionalidades para guardar configuraciones predefinidas (presets),
 * cargarlas posteriormente y restaurar la configuración por defecto.
 * 
 * @example
 * const dialogRef = this.dialog.open(LayerSettingsComponent, {
 *   width: '650px',
 *   height: 'auto'
 * });
 */
@Component({
  selector: 'app-layer-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatChipsModule,
    MatListModule,
    MatDividerModule,
    MatTooltipModule
  ],
  template: `
    <div class="layer-settings-container">
      <h2 mat-dialog-title>Configuración de Capas</h2>
      
      <mat-dialog-content>
        <div class="current-layers-section">
          <h3>Capas Actuales</h3>
          <mat-chip-listbox>
            <mat-chip *ngFor="let layer of activeLayers" 
              [matTooltip]="getLayerName(layer)">
              <mat-icon class="layer-icon">{{getLayerIcon(layer)}}</mat-icon>
              {{getLayerName(layer)}}
            </mat-chip>
          </mat-chip-listbox>
          
          <p *ngIf="activeLayers.length === 0" class="empty-state">
            No hay capas activas. Activa algunas capas en el mapa.
          </p>
        </div>
        
        <mat-divider></mat-divider>
        
        <div class="presets-section">
          <h3>Presets Guardados</h3>
          
          <div class="preset-actions">
            <mat-form-field class="preset-name-field" appearance="outline">
              <mat-label>Nombre del Preset</mat-label>
              <input matInput [(ngModel)]="newPresetName" placeholder="Mi configuración">
            </mat-form-field>
            
            <mat-form-field class="preset-description-field" appearance="outline">
              <mat-label>Descripción (opcional)</mat-label>
              <input matInput [(ngModel)]="newPresetDescription" placeholder="Descripción del preset...">
            </mat-form-field>
            
            <button mat-raised-button color="primary" 
              [disabled]="!newPresetName || activeLayers.length === 0"
              (click)="saveCurrentAsPreset()">
              <mat-icon>save</mat-icon>
              Guardar Actual
            </button>
          </div>
          
          <mat-list role="list">
            <mat-list-item role="listitem" *ngFor="let preset of presets" class="preset-item">
              <div class="preset-details">
                <div class="preset-header">
                  <h4>{{preset.name}}</h4>
                  <span class="preset-date">
                    {{formatDate(preset.updatedAt)}}
                  </span>
                </div>
                
                <p class="preset-description" *ngIf="preset.description">
                  {{preset.description}}
                </p>
                
                <mat-chip-listbox>
                  <mat-chip *ngFor="let layer of preset.layers.slice(0, CONSTANTS.MAX_VISIBLE_LAYERS_IN_PRESET)" 
                    [matTooltip]="getLayerName(layer)">
                    <mat-icon class="layer-icon">{{getLayerIcon(layer)}}</mat-icon>
                    {{getLayerName(layer)}}
                  </mat-chip>
                  <mat-chip *ngIf="preset.layers.length > CONSTANTS.MAX_VISIBLE_LAYERS_IN_PRESET">
                    +{{preset.layers.length - CONSTANTS.MAX_VISIBLE_LAYERS_IN_PRESET}} más
                  </mat-chip>
                </mat-chip-listbox>
              </div>
              
              <div class="preset-actions">
                <button mat-icon-button matTooltip="Cargar preset" 
                  (click)="loadPreset(preset)">
                  <mat-icon>play_arrow</mat-icon>
                </button>
                <button mat-icon-button matTooltip="Eliminar preset" 
                  (click)="deletePreset(preset)">
                  <mat-icon>delete</mat-icon>
                </button>
              </div>
            </mat-list-item>
          </mat-list>
          
          <p *ngIf="presets.length === 0" class="empty-state">
            No hay presets guardados. Guarda tu configuración actual para comenzar.
          </p>
        </div>
      </mat-dialog-content>
      
      <mat-dialog-actions align="end">
        <button mat-button (click)="resetToDefault()">
          Restablecer Predeterminado
        </button>
        <button mat-button mat-dialog-close cdkFocusInitial>
          Cerrar
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .layer-settings-container {
      padding: 0;
      max-width: 600px;
      width: 100%;
    }
    
    .current-layers-section,
    .presets-section {
      margin: 16px 0;
    }
    
    h3 {
      font-size: 16px;
      font-weight: 500;
      margin-bottom: 12px;
    }
    
    .layer-icon {
      margin-right: 4px;
      font-size: 16px;
      height: 16px;
      width: 16px;
      vertical-align: middle;
    }
    
    mat-chip-listbox {
      margin-bottom: 12px;
    }
    
    .preset-actions {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      margin-bottom: 16px;
      gap: 8px;
    }
    
    .preset-name-field {
      flex: 2;
      min-width: 200px;
    }
    
    .preset-description-field {
      flex: 3;
      min-width: 250px;
    }
    
    .preset-item {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
    }
    
    .preset-details {
      flex: 1;
    }
    
    .preset-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .preset-header h4 {
      margin: 0;
      font-weight: 500;
    }
    
    .preset-date {
      font-size: 12px;
      color: var(--text-secondary-color, #666);
    }
    
    .preset-description {
      font-size: 14px;
      color: var(--text-secondary-color, #666);
      margin: 4px 0 8px;
    }
    
    .empty-state {
      color: var(--text-secondary-color, #666);
      font-style: italic;
      text-align: center;
      padding: 16px;
    }
    
    mat-divider {
      margin: 16px 0;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LayerSettingsComponent implements OnInit, OnDestroy {
  /** Constantes expuestas al template */
  readonly CONSTANTS = CONSTANTS;
  
  /** Lista de capas activas en el mapa */
  activeLayers: ElementType[] = [];
  
  /** Lista de presets guardados */
  presets: LayerPreset[] = [];
  
  /** Nombre para el nuevo preset a guardar */
  newPresetName = '';
  
  /** Descripción opcional para el nuevo preset */
  newPresetDescription = '';
  
  /** Subject para gestionar desuscripciones al destruir el componente */
  private destroy$ = new Subject<void>();
  
  /**
   * Constructor del componente
   * 
   * @param layerManager Servicio para gestionar las capas del mapa
   * @param logger Servicio para registro de logs
   * @param dialogRef Referencia al diálogo para poder cerrarlo
   * @param cdr Detector de cambios para actualizar la vista manualmente
   */
  constructor(
    private layerManager: LayerManagerService,
    private logger: LoggerService,
    private dialogRef: MatDialogRef<LayerSettingsComponent>,
    private cdr: ChangeDetectorRef
  ) {}
  
  /**
   * Método del ciclo de vida OnInit
   * Se ejecuta cuando el componente ha sido inicializado
   */
  ngOnInit(): void {
    // Cargar capas activas y suscribirse a cambios
    this.layerManager.getActiveLayers()
      .pipe(takeUntil(this.destroy$))
      .subscribe(layers => {
        this.activeLayers = layers;
        this.cdr.markForCheck();
      });
    
    // Cargar presets guardados
    this.loadPresets();
  }
  
  /**
   * Método del ciclo de vida OnDestroy
   * Se ejecuta cuando el componente va a ser destruido
   */
  ngOnDestroy(): void {
    // Limpieza de suscripciones
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  /**
   * Formatea una fecha timestamp a string para mostrar
   * 
   * @param timestamp Fecha en formato timestamp (milisegundos)
   * @returns Fecha formateada como string localizado
   */
  formatDate(timestamp: number): string {
    const date = new Date(timestamp);
    return date.toLocaleDateString();
  }
  
  /**
   * Obtiene el nombre descriptivo de un tipo de elemento
   * 
   * @param type Tipo de elemento a consultar
   * @returns Nombre descriptivo del tipo de elemento
   */
  getLayerName(type: ElementType): string {
    return ElementType[type] || `Tipo ${type}`;
  }
  
  /**
   * Obtiene el icono representativo para un tipo de elemento
   * 
   * @param type Tipo de elemento a consultar
   * @returns Nombre del icono de Material a mostrar
   */
  getLayerIcon(type: ElementType): string {
    return this.layerManager.getLayerIcon(type);
  }
  
  /**
   * Guarda la configuración actual de capas como un nuevo preset
   * 
   * @returns void
   */
  saveCurrentAsPreset(): void {
    if (!this.newPresetName || this.activeLayers.length === 0) {
      return;
    }
    
    try {
      const now = Date.now();
      const newPreset: LayerPreset = {
        id: `preset_${now}`,
        name: this.newPresetName,
        description: this.newPresetDescription || undefined,
        layers: [...this.activeLayers],
        createdAt: now,
        updatedAt: now
      };
      
      // Añadir a la lista de presets
      this.presets.push(newPreset);
      
      // Guardar en localStorage
      this.savePresets();
      
      // Limpiar campos
      this.newPresetName = '';
      this.newPresetDescription = '';
      
      this.logger.debug('Nuevo preset guardado', newPreset);
      this.cdr.markForCheck();
    } catch (error) {
      this.logger.error('Error al guardar preset', error);
    }
  }
  
  /**
   * Carga un preset guardado, activando sus capas en el mapa
   * 
   * @param preset Preset a cargar
   * @returns void
   */
  loadPreset(preset: LayerPreset): void {
    try {
      // Primero desactivar todas las capas
      this.layerManager.deactivateLayers(this.activeLayers);
      
      // Luego activar las capas del preset
      this.layerManager.activateLayers(preset.layers);
      
      this.logger.debug('Preset cargado', preset);
      
      // Actualizar fecha de último uso
      preset.updatedAt = Date.now();
      this.savePresets();
      this.cdr.markForCheck();
    } catch (error) {
      this.logger.error('Error al cargar preset', error);
    }
  }
  
  /**
   * Elimina un preset guardado
   * 
   * @param preset Preset a eliminar
   * @returns void
   */
  deletePreset(preset: LayerPreset): void {
    try {
      const index = this.presets.findIndex(p => p.id === preset.id);
      if (index !== -1) {
        this.presets.splice(index, 1);
        this.savePresets();
        this.logger.debug('Preset eliminado', preset);
        this.cdr.markForCheck();
      }
    } catch (error) {
      this.logger.error('Error al eliminar preset', error);
    }
  }
  
  /**
   * Restablece las capas a la configuración predeterminada
   * 
   * @returns void
   */
  resetToDefault(): void {
    try {
      this.layerManager.resetToDefaultLayers();
      this.logger.debug('Capas restablecidas a valores predeterminados');
    } catch (error) {
      this.logger.error('Error al restablecer capas', error);
    }
  }
  
  /**
   * Carga los presets guardados desde localStorage
   * 
   * @private
   * @returns void
   */
  private loadPresets(): void {
    try {
      const storedPresets = localStorage.getItem(CONSTANTS.USER_PRESETS_STORAGE_KEY);
      if (storedPresets) {
        this.presets = JSON.parse(storedPresets);
        this.logger.debug('Presets cargados desde localStorage', this.presets);
        this.cdr.markForCheck();
      }
    } catch (error) {
      this.logger.error('Error al cargar presets', error);
      this.presets = [];
      this.cdr.markForCheck();
    }
  }
  
  /**
   * Guarda los presets en localStorage
   * 
   * @private
   * @returns void
   */
  private savePresets(): void {
    try {
      localStorage.setItem(CONSTANTS.USER_PRESETS_STORAGE_KEY, JSON.stringify(this.presets));
      this.logger.debug('Presets guardados en localStorage');
    } catch (error) {
      this.logger.error('Error al guardar presets', error);
    }
  }
} 