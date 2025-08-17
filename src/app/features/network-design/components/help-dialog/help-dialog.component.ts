import { Component, Inject, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { ElementType } from '../../../../shared/types/network.types';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { inject } from '@angular/core';

/**
 * Interfaz para los datos de entrada del diálogo de ayuda
 */
interface HelpDialogData {
  /** Tipo de elemento para el que se muestra la ayuda */
  elementType: ElementType;
  /** Indica si es un elemento nuevo o uno existente */
  isNewElement: boolean;
}

/**
 * Interfaz para atajos de teclado
 */
interface KeyboardShortcut {
  /** Combinación de teclas para el atajo */
  key: string;
  /** Descripción de la acción que realiza el atajo */
  desc: string;
}

/**
 * Interfaz para campos requeridos
 */
interface RequiredField {
  /** Icono que representa el campo */
  icon: string;
  /** Nombre del campo */
  name: string;
  /** Descripción del campo */
  desc: string;
}

/**
 * Interfaz para consejos (tips)
 */
interface Tip {
  /** Icono que representa el consejo */
  icon: string;
  /** Título del consejo */
  title: string;
  /** Descripción detallada del consejo */
  description: string;
}

/**
 * Componente de diálogo para mostrar ayuda contextual sobre los elementos de red
 * 
 * Este componente muestra información específica para cada tipo de elemento,
 * incluyendo descripciones, campos requeridos, atajos de teclado y consejos útiles.
 * 
 * @example
 * const dialogRef = this.dialog.open(HelpDialogComponent, {
 *   data: {
 *     elementType: ElementType.OLT,
 *     isNewElement: true
 *   }
 * });
 */
@Component({
  selector: 'app-help-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatDividerModule,
    MatTooltipModule,
    MatDialogModule
  ],
  template: `
    <div class="help-dialog-container">
      <div class="help-header">
        <h2 mat-dialog-title>
          <mat-icon class="header-icon">help_outline</mat-icon>
          Ayuda - {{ getElementTypeName() }}
        </h2>
        <button mat-icon-button (click)="close()" matTooltip="Cerrar" class="close-button">
          <mat-icon>close</mat-icon>
        </button>
      </div>
      
      <mat-divider></mat-divider>
      
      <mat-tab-group animationDuration="300ms" class="help-tabs">
        <mat-tab label="Información">
          <div class="tab-content">
            <div class="section">
              <div class="section-header">
                <mat-icon class="section-icon">keyboard</mat-icon>
                <h3>Atajos</h3>
              </div>
              <div class="section-content">
                <div class="shortcuts-grid">
                  <div class="shortcut-card" *ngFor="let shortcut of getKeyboardShortcuts()">
                    <div class="shortcut-key">{{ shortcut.key }}</div>
                    <div class="shortcut-desc">{{ shortcut.desc }}</div>
                  </div>
                </div>
              </div>
            </div>
            
            <mat-divider></mat-divider>
            
            <div class="section">
              <div class="section-header">
                <mat-icon class="section-icon">info</mat-icon>
                <h3>Información</h3>
              </div>
              <div class="section-content">
                <h3>{{ data.isNewElement ? 'Creación' : 'Edición' }} de {{ getElementTypeName() }}</h3>
                <p class="element-description">
                  {{ getElementDescription() }}
                </p>
                <img *ngIf="getElementImage()" [src]="getElementImage()" [alt]="getElementTypeName()" class="element-image">
              </div>
            </div>
          </div>
        </mat-tab>
        
        <mat-tab label="Requisitos">
          <div class="tab-content">
            <div class="section">
              <div class="section-header">
                <mat-icon class="section-icon">check_circle</mat-icon>
                <h3>Requisitos</h3>
              </div>
              <div class="section-content">
                <h3>Campos requeridos</h3>
                <div class="required-fields">
                  <div class="field-card">
                    <mat-icon>code</mat-icon>
                    <div class="field-name">Código</div>
                    <div class="field-desc">Identificador único del elemento</div>
                  </div>
                  
                  <div class="field-card">
                    <mat-icon>location_on</mat-icon>
                    <div class="field-name">Ubicación</div>
                    <div class="field-desc">Coordenadas geográficas del elemento</div>
                  </div>
                  
                  <ng-container *ngFor="let field of getRequiredFieldsList()">
                    <div class="field-card">
                      <mat-icon>{{ field.icon }}</mat-icon>
                      <div class="field-name">{{ field.name }}</div>
                      <div class="field-desc">{{ field.desc }}</div>
                    </div>
                  </ng-container>
                </div>
              </div>
            </div>
          </div>
        </mat-tab>
        
        <mat-tab label="Consejos" *ngIf="getTips().length > 0">
          <div class="tab-content">
            <div class="section">
              <div class="section-header">
                <mat-icon class="section-icon">lightbulb</mat-icon>
                <h3>Consejos</h3>
              </div>
              <div class="section-content">
                <div class="tips-container">
                  <div class="tip-card" *ngFor="let tip of getTips()">
                    <mat-icon class="tip-icon">{{ tip.icon }}</mat-icon>
                    <div class="tip-content">
                      <h4>{{ tip.title }}</h4>
                      <p>{{ tip.description }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </mat-tab>
      </mat-tab-group>
      
      <div mat-dialog-actions class="dialog-actions">
        <button mat-button color="primary" (click)="close()">Cerrar</button>
      </div>
    </div>
  `,
  styles: [`
    .help-dialog-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      max-width: 650px;
      position: relative;
    }
    
    .help-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 0 var(--spacing-sm) 0;
    }
    
    .header-icon {
      margin-right: var(--spacing-sm);
      color: var(--primary-color);
    }
    
    .close-button {
      margin-right: -8px;
    }
    
    .help-tabs {
      flex: 1;
      margin-top: var(--spacing-md);
    }
    
    .tab-icon {
      margin-right: var(--spacing-sm);
    }
    
    .tab-content {
      padding: var(--spacing-lg) var(--spacing-sm);
    }
    
    h3 {
      color: var(--primary-color);
      margin-bottom: var(--spacing-md);
      font-weight: 500;
    }
    
    .help-content {
      flex: 1;
      overflow: auto;
      margin-top: var(--spacing-md);
    }
    
    .section {
      padding: var(--spacing-md) 0;
    }
    
    .section-header {
      display: flex;
      align-items: center;
      margin-bottom: var(--spacing-md);
    }
    
    .section-icon {
      margin-right: var(--spacing-sm);
      color: var(--primary-color);
    }
    
    .section-content {
      padding: 0 var(--spacing-sm) var(--spacing-md) var(--spacing-sm);
    }
    
    .shortcuts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: var(--spacing-md);
    }
    
    .shortcut-card {
      display: flex;
      align-items: center;
      padding: var(--spacing-sm) var(--spacing-md);
      background-color: var(--background-color);
      border-radius: var(--border-radius-md);
      transition: background-color var(--transition-fast);
    }
    
    .shortcut-card:hover {
      background-color: rgba(0, 0, 0, 0.04);
    }
    
    .shortcut-key {
      display: inline-block;
      padding: var(--spacing-xs) var(--spacing-sm);
      background-color: var(--primary-color);
      color: white;
      border-radius: var(--border-radius-sm);
      font-weight: 500;
      margin-right: var(--spacing-md);
      min-width: 80px;
      text-align: center;
    }
    
    .shortcut-desc {
      flex: 1;
    }
    
    .element-description {
      line-height: 1.6;
      margin-bottom: var(--spacing-md);
      color: var(--text-color);
    }
    
    .element-image {
      max-width: 100%;
      height: auto;
      border-radius: var(--border-radius-md);
      margin-top: var(--spacing-md);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    
    .required-fields {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: var(--spacing-md);
      margin-top: var(--spacing-md);
    }
    
    .field-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: var(--spacing-md);
      background-color: var(--background-color);
      border-radius: var(--border-radius-md);
      transition: background-color var(--transition-fast);
      text-align: center;
    }
    
    .field-card:hover {
      background-color: rgba(0, 0, 0, 0.04);
    }
    
    .field-card mat-icon {
      font-size: 28px;
      height: 28px;
      width: 28px;
      margin-bottom: var(--spacing-sm);
      color: var(--primary-color);
    }
    
    .field-name {
      font-weight: 500;
      margin-bottom: var(--spacing-xs);
      color: var(--text-color);
    }
    
    .field-desc {
      font-size: 14px;
      color: var(--text-secondary-color);
      line-height: 1.4;
    }
    
    .tips-container {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
    }
    
    .tip-card {
      display: flex;
      padding: var(--spacing-md);
      background-color: var(--background-color);
      border-radius: var(--border-radius-md);
      transition: background-color var(--transition-fast);
    }
    
    .tip-card:hover {
      background-color: rgba(0, 0, 0, 0.04);
    }
    
    .tip-icon {
      font-size: 24px;
      color: var(--color-success);
      margin-right: var(--spacing-md);
      align-self: flex-start;
    }
    
    .tip-content h4 {
      margin: 0 0 var(--spacing-sm) 0;
      color: var(--color-success);
    }
    
    .tip-content p {
      margin: 0;
      color: var(--text-color);
    }
    
    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      padding: var(--spacing-sm) 0;
      margin-top: var(--spacing-md);
    }
    
    /* Soporte para modo oscuro */
    :host-context(.dark-theme) {
      .shortcut-card, .field-card {
        background-color: var(--dark-bg-secondary);
      }
      
      .element-description, .field-name, .field-desc, .tip-content p {
        color: var(--dark-text-primary);
      }
      
      h3 {
        color: var(--primary-color);
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HelpDialogComponent implements OnInit, OnDestroy {
  /**
   * Subject para manejar la cancelación de suscripciones
   * @private
   */
  private destroy$ = new Subject<void>();

  /**
   * Datos de entrada para el diálogo
   */
  public data = inject<HelpDialogData>(MAT_DIALOG_DATA);

  /**
   * Referencia al diálogo para poder cerrarlo
   */
  private dialogRef = inject<MatDialogRef<HelpDialogComponent>>(MatDialogRef);

  /**
   * Constructor del componente
   */
  constructor() {}

  /**
   * Método del ciclo de vida OnInit
   * Se ejecuta cuando el componente ha sido inicializado
   */
  ngOnInit(): void {
    try {
      // Suscripciones a eventos del diálogo
      this.dialogRef.backdropClick()
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => this.close());
      
      // Otros inicializadores podrían ir aquí
    } catch (error) {
      console.error('Error al inicializar el componente de ayuda:', error);
    }
  }

  /**
   * Método del ciclo de vida OnDestroy
   * Se ejecuta cuando el componente va a ser destruido
   */
  ngOnDestroy(): void {
    this.cleanup();
  }

  /**
   * Limpia recursos cuando se destruye el componente
   * @private
   */
  private cleanup(): void {
    // Limpiar recursos al destruir el componente
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Cierra el diálogo actual
   */
  close(): void {
    this.dialogRef.close();
  }

  /**
   * Obtiene la lista de atajos de teclado disponibles
   * @returns Lista de atajos de teclado con sus descripciones
   */
  getKeyboardShortcuts(): KeyboardShortcut[] {
    return [
      { key: 'Ctrl + S', desc: 'Guardar cambios' },
      { key: 'ESC', desc: 'Cancelar y volver' },
      { key: 'Alt + 1', desc: 'Ir a Información Básica' },
      { key: 'Alt + 2', desc: 'Ir a Ubicación' },
      { key: 'Alt + 3', desc: 'Ir a Configuración' },
      { key: 'Alt + 4', desc: 'Ir a Conexiones' },
      { key: 'F1', desc: 'Mostrar esta ayuda' },
      { key: 'Tab', desc: 'Navegar entre campos' },
      { key: 'Ctrl + Z', desc: 'Deshacer último cambio' },
      { key: 'Ctrl + Y', desc: 'Rehacer cambio' }
    ];
  }

  /**
   * Obtiene el nombre descriptivo del tipo de elemento seleccionado
   * @returns Nombre completo del tipo de elemento
   */
  getElementTypeName(): string {
    switch (this.data.elementType) {
      case ElementType.ODF:
        return 'Distribuidor de Fibra Óptica (ODF)';
      case ElementType.OLT:
        return 'Terminal de Línea Óptica (OLT)';
      case ElementType.ONT:
        return 'Terminal de Red Óptica (ONT)';
      case ElementType.EDFA:
        return 'Amplificador de Fibra Dopada con Erbio (EDFA)';
      case ElementType.SPLITTER:
        return 'Divisor Óptico (Splitter)';
      case ElementType.MANGA:
        return 'Manga de Empalme';
      case ElementType.TERMINAL_BOX:
        return 'Caja Terminal';
      default:
        return 'Elemento de Red';
    }
  }

  /**
   * Obtiene la descripción detallada del tipo de elemento seleccionado
   * @returns Descripción textual del elemento
   */
  getElementDescription(): string {
    switch (this.data.elementType) {
      case ElementType.ODF:
        return 'El ODF (Distribuidor de Fibra Óptica) es un elemento pasivo que permite organizar y distribuir los hilos de fibra óptica. Facilita la administración, mantenimiento y distribución de conexiones de fibra dentro de la red, sirviendo como punto central de interconexión.';
      case ElementType.OLT:
        return 'La OLT (Terminal de Línea Óptica) es el equipo que controla el flujo de información a través de la red de fibra óptica. Actúa como punto de origen para la red PON y gestiona la transmisión de datos, voz y video hacia los usuarios finales, además de monitorear y controlar las ONTs conectadas.';
      case ElementType.ONT:
        return 'La ONT (Terminal de Red Óptica) se instala en el lugar del cliente y sirve como punto de demarcación entre la red del operador y la red del cliente. Convierte las señales ópticas a eléctricas para entregar servicios de internet, telefonía y televisión al usuario final.';
      case ElementType.EDFA:
        return 'El EDFA (Amplificador de Fibra Dopada con Erbio) amplifica señales ópticas sin necesidad de conversión a señales eléctricas. Es fundamental en redes de larga distancia para compensar la atenuación de la señal, permitiendo transmisiones sobre grandes extensiones sin regeneración.';
      case ElementType.SPLITTER:
        return 'El Splitter (Divisor Óptico) divide la señal óptica para distribuirla a múltiples destinos. Es un componente pasivo esencial en redes PON que permite que una única fibra sirva a múltiples usuarios finales, optimizando la infraestructura de la red.';
      case ElementType.MANGA:
        return 'La Manga de Empalme protege y organiza las fusiones de fibra óptica, permitiendo la continuidad de la red. Proporciona un ambiente seguro para las conexiones de fibra, protegiéndolas de factores ambientales y facilitando futuras intervenciones de mantenimiento.';
      case ElementType.TERMINAL_BOX:
        return 'La Caja Terminal permite la conexión de los cables de distribución con los cables de acometida hacia los usuarios finales. Facilita la organización y protección de las conexiones ópticas en el último tramo de la red, cercano al cliente.';
      default:
        return 'Este elemento forma parte de la infraestructura de la red de fibra óptica y contribuye al funcionamiento eficiente del sistema de telecomunicaciones.';
    }
  }

  /**
   * Obtiene la ruta de la imagen representativa del tipo de elemento
   * @returns Ruta de la imagen o cadena vacía si no hay imagen disponible
   */
  getElementImage(): string {
    switch (this.data.elementType) {
      case ElementType.ODF:
        return 'assets/images/network-elements/odf.jpg';
      case ElementType.OLT:
        return 'assets/images/network-elements/olt.jpg';
      case ElementType.ONT:
        return 'assets/images/network-elements/ont.jpg';
      case ElementType.SPLITTER:
        return 'assets/images/network-elements/splitter.jpg';
      case ElementType.MANGA:
        return 'assets/images/network-elements/manga.jpg';
      case ElementType.TERMINAL_BOX:
        return 'assets/images/network-elements/terminal-box.jpg';
      case ElementType.EDFA:
        return 'assets/images/network-elements/edfa.jpg';
      default:
        return '';
    }
  }

  /**
   * Obtiene la lista de campos requeridos específicos para el tipo de elemento
   * @returns Lista de campos requeridos con su icono, nombre y descripción
   */
  getRequiredFieldsList(): RequiredField[] {
    switch (this.data.elementType) {
      case ElementType.ODF:
        return [
          { icon: 'category', name: 'Tipo', desc: 'Clasificación del ODF' },
          { icon: 'grid_view', name: 'Capacidad', desc: 'Número total de puertos' }
        ];
      case ElementType.OLT:
        return [
          { icon: 'devices', name: 'Modelo', desc: 'Fabricante y modelo del equipo' },
          { icon: 'settings_input_component', name: 'Capacidad', desc: 'Número de puertos PON' }
        ];
      case ElementType.ONT:
        return [
          { icon: 'person', name: 'Cliente', desc: 'Usuario asociado a la ONT' }
        ];
      case ElementType.SPLITTER:
        return [
          { icon: 'call_split', name: 'Ratio', desc: 'Relación de división (ej: 1:8)' }
        ];
      case ElementType.MANGA:
        return [
          { icon: 'cable', name: 'Capacidad', desc: 'Número de empalmes posibles' }
        ];
      case ElementType.TERMINAL_BOX:
        return [
          { icon: 'home', name: 'Sector', desc: 'Área de cobertura' }
        ];
      case ElementType.EDFA:
        return [
          { icon: 'speed', name: 'Ganancia', desc: 'Nivel de amplificación en dB' }
        ];
      default:
        return [];
    }
  }

  /**
   * Obtiene la lista de consejos útiles para el tipo de elemento
   * @returns Lista de consejos con su icono, título y descripción
   */
  getTips(): Tip[] {
    const commonTips: Tip[] = [
      {
        icon: 'save',
        title: 'Guarde frecuentemente',
        description: 'Utilice Ctrl+S regularmente para evitar pérdida de información durante la configuración.'
      },
      {
        icon: 'edit',
        title: 'Nombres descriptivos',
        description: 'Use códigos y nombres que identifiquen claramente la función y ubicación del elemento.'
      }
    ];
    
    switch (this.data.elementType) {
      case ElementType.OLT:
        return [
          ...commonTips,
          {
            icon: 'router',
            title: 'Configuración IP',
            description: 'Asegúrese de asignar una dirección IP estática para gestión remota del equipo.'
          }
        ];
      case ElementType.SPLITTER:
        return [
          ...commonTips,
          {
            icon: 'account_tree',
            title: 'Balance de cargas',
            description: 'Distribuya las conexiones uniformemente entre los puertos para optimizar el rendimiento.'
          }
        ];
      default:
        return commonTips;
    }
  }
} 
