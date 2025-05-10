import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatOptionModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';

// Importación de animaciones compartidas
import { fadeAnimation } from '../../animations';

import { ElementManagementService } from '../../services/element-management.service';
import { ConnectionService } from '../../services/connection.service';
import { ElementService } from '../../services/element.service';
import { ELEMENT_LABELS } from '../../services/map.constants';
import { 
  NetworkElement, 
  ElementType, 
  ElementStatus, 
  FiberType,
  NetworkConnection
} from '../../../../shared/types/network.types';

/**
 * Modos de operación del editor de conexiones
 */
type ConnectionEditorMode = 'create' | 'edit';

/**
 * Tipos de notificación soportados por el componente
 */
type NotificationType = 'success' | 'error' | 'info' | 'warning';

/**
 * Interfaz para los datos del diálogo de conexión
 * 
 * @property {NetworkConnection | null} connection - Conexión a editar o null si es nueva
 * @property {ConnectionEditorMode} mode - Modo de operación: crear o editar
 */
interface ConnectionDialogData {
  connection: NetworkConnection | null;
  mode: ConnectionEditorMode;
}

/**
 * Componente editor de conexiones
 * 
 * Permite crear y editar conexiones entre elementos de red,
 * mostrando un formulario con las propiedades de la conexión.
 * Proporciona selección de elementos origen y destino, tipo de fibra,
 * capacidad, longitud y otros parámetros relevantes.
 * 
 * @implements {OnInit}
 * @implements {OnDestroy}
 */
@Component({
  selector: 'app-connection-editor',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatOptionModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatChipsModule
  ],
  templateUrl: './connection-editor.component.html',
  styleUrls: ['./connection-editor.component.scss'],
  animations: [fadeAnimation]
})
export class ConnectionEditorComponent implements OnInit, OnDestroy {
  /**
   * Formulario reactivo para la edición de conexiones
   * Contiene todos los campos necesarios para configurar una conexión
   * 
   * @type {FormGroup}
   */
  connectionForm: FormGroup;
  
  /**
   * Modo de operación del editor: crear nueva conexión o editar existente
   * Determina el comportamiento del formulario y las operaciones disponibles
   * 
   * @type {ConnectionEditorMode}
   * @default 'create'
   */
  mode: ConnectionEditorMode = 'create';
  
  /**
   * Referencias a enumeraciones para uso en la plantilla
   * Permite acceder a los valores de las enumeraciones desde el HTML
   */
  ElementStatus = ElementStatus;
  FiberType = FiberType;
  
  /**
   * Lista de elementos de red disponibles para crear conexiones
   * Se carga al inicializar el componente
   * 
   * @type {NetworkElement[]}
   * @default []
   */
  availableElements: NetworkElement[] = [];
  
  /**
   * Elemento de red seleccionado como origen de la conexión
   * Se actualiza cuando cambia la selección en el formulario
   * 
   * @type {NetworkElement | null}
   * @default null
   */
  sourceElement: NetworkElement | null = null;
  
  /**
   * Elemento de red seleccionado como destino de la conexión
   * Se actualiza cuando cambia la selección en el formulario
   * 
   * @type {NetworkElement | null}
   * @default null
   */
  targetElement: NetworkElement | null = null;
  
  /**
   * Indicador de estado de carga para mostrar spinner
   * Se activa durante las operaciones asíncronas
   * 
   * @type {boolean}
   * @default false
   */
  loading = false;
  
  /**
   * Elementos destino disponibles basados en la selección de origen
   * Se filtran para evitar seleccionar el mismo elemento como origen y destino
   * 
   * @private
   * @type {NetworkElement[]}
   * @default []
   */
  private _availableTargets: NetworkElement[] = [];
  
  /**
   * Subject para gestión de suscripciones y prevención de memory leaks
   * Se completa en el método ngOnDestroy
   * 
   * @private
   * @type {Subject<void>}
   */
  private destroy$ = new Subject<void>();

  // Inyección de dependencias usando el nuevo API de Angular
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<ConnectionEditorComponent>);
  private elementManagementService = inject(ElementManagementService);
  private connectionService = inject(ConnectionService);
  private elementService = inject(ElementService);
  private snackBar = inject(MatSnackBar);
  public data = inject<ConnectionDialogData>(MAT_DIALOG_DATA);

  /**
   * Constructor del componente
   * Inicializa el formulario con los valores por defecto o los de la conexión existente
   */
  constructor() {
    this.mode = this.data.mode;

    // Inicialización del formulario reactivo con validaciones
    this.connectionForm = this.fb.group({
      id: [this.data.connection?.id || this.generateId()],
      sourceId: [this.data.connection?.sourceId || '', Validators.required],
      targetId: [this.data.connection?.targetId || '', Validators.required],
      status: [this.data.connection?.status || ElementStatus.ACTIVE, Validators.required],
      fiberType: [this.data.connection?.fiberType || FiberType.SINGLE_MODE],
      length: [
        this.data.connection?.length || 0, 
        [Validators.min(0), Validators.pattern(/^\d+(\.\d{1,2})?$/)]
      ],
      capacity: [
        this.data.connection?.capacity || 10, 
        [Validators.min(0), Validators.pattern(/^\d+(\.\d{1,2})?$/)]
      ],
      label: [this.data.connection?.label || ''],
      description: [this.data.connection?.description || '']
    });
  }

  /**
   * Inicialización del componente
   * Configura observadores para el formulario y carga elementos disponibles
   * 
   * @returns {void}
   */
  ngOnInit(): void {
    this.loading = true;
    
    // Configurar observadores para cambios reactivos en sourceId y targetId
    this.connectionForm.get('sourceId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.updateSourceElement());
      
    this.connectionForm.get('targetId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.updateTargetElement());
    
    // Cargar elementos disponibles para conexiones desde el servicio
    this.elementManagementService.getElements()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loading = false)
      )
      .subscribe({
        next: (elements) => {
          this.availableElements = elements;
          
          // Si hay datos iniciales, actualizar selectores
          if (this.data.connection) {
            this.updateSourceElement();
            this.updateTargetElement();
          }
        },
        error: (error) => this.handleError(error, 'cargar elementos')
      });
  }

  /**
   * Limpieza al destruir el componente
   * Completa el Subject para cancelar todas las suscripciones
   * 
   * @returns {void}
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Actualiza el elemento origen seleccionado
   * También actualiza la lista de elementos destino disponibles
   * 
   * @returns {void}
   */
  updateSourceElement(): void {
    const sourceId = this.connectionForm.get('sourceId')?.value;
    if (sourceId) {
      this.sourceElement = this.availableElements.find(el => el.id === sourceId) || null;
      
      // Actualizar los targets disponibles cuando cambia la fuente
      // excluyendo el elemento seleccionado como origen
      this._availableTargets = this.availableElements.filter(element => 
        element.id !== sourceId
      );
    }
  }

  /**
   * Actualiza el elemento destino seleccionado
   * 
   * @returns {void}
   */
  updateTargetElement(): void {
    const targetId = this.connectionForm.get('targetId')?.value;
    if (targetId) {
      this.targetElement = this.availableElements.find(el => el.id === targetId) || null;
    }
  }

  /**
   * Obtiene los elementos destino disponibles para la selección
   * 
   * @returns {NetworkElement[]} Lista de elementos disponibles como destino
   */
  getAvailableTargets(): NetworkElement[] {
    return this._availableTargets;
  }

  /**
   * Obtiene el nombre descriptivo del tipo de elemento
   * 
   * @param {ElementType} type - Tipo de elemento
   * @returns {string} Nombre legible del tipo de elemento
   */
  getElementTypeName(type: ElementType): string {
    return this.elementService.getElementTypeName(type);
  }
  
  /**
   * Obtiene el icono correspondiente al tipo de elemento
   * para mostrar en la interfaz
   * 
   * @param {ElementType} type - Tipo de elemento
   * @returns {string} Nombre del icono de Material Icons
   */
  getElementTypeIcon(type: ElementType): string {
    switch (type) {
      case ElementType.OLT:
        return 'router';
      case ElementType.ONT:
        return 'device_hub';
      case ElementType.ODF:
        return 'settings_input_hdmi';
      case ElementType.FDP:
        return 'cable';
      case ElementType.SPLITTER:
        return 'call_split';
      case ElementType.MANGA:
        return 'settings_input_component';
      case ElementType.TERMINAL_BOX:
        return 'inbox';
      case ElementType.EDFA:
        return 'settings_input_antenna';
      case ElementType.MSAN:
        return 'router';
      case ElementType.ROUTER:
        return 'wifi_tethering';
      case ElementType.RACK:
        return 'dns';
      case ElementType.FIBER_THREAD:
        return 'timeline';
      case ElementType.DROP_CABLE:
      case ElementType.DISTRIBUTION_CABLE:
      case ElementType.FEEDER_CABLE:
      case ElementType.BACKBONE_CABLE:
        return 'cable';
      default:
        return 'device_unknown';
    }
  }
  
  /**
   * Obtiene el nombre legible del tipo de fibra
   * 
   * @param {FiberType} type - Tipo de fibra óptica
   * @returns {string} Nombre descriptivo del tipo de fibra
   */
  getFiberTypeName(type: FiberType): string {
    switch (type) {
      case FiberType.SINGLE_MODE:
        return 'Monomodo';
      case FiberType.MULTI_MODE:
        return 'Multimodo';
      case FiberType.SINGLE_MODE_RIBBON:
        return 'Cinta';
      default:
        return 'Desconocido';
    }
  }
  
  /**
   * Obtiene la clase CSS correspondiente al estado seleccionado
   * para aplicar estilos visuales según el estado
   * 
   * @returns {string} Nombre de la clase CSS
   */
  getStatusClass(): string {
    const status = this.connectionForm.get('status')?.value;
    switch (status) {
      case ElementStatus.ACTIVE:
        return 'active';
      case ElementStatus.INACTIVE:
        return 'inactive';
      case ElementStatus.MAINTENANCE:
        return 'maintenance';
      case ElementStatus.FAULT:
        return 'fault';
      case ElementStatus.PLANNED:
        return 'planned';
      case ElementStatus.BUILDING:
        return 'building';
      case ElementStatus.RESERVED:
        return 'reserved';
      case ElementStatus.DECOMMISSIONED:
        return 'decommissioned';
      default:
        return 'active';
    }
  }

  /**
   * Genera un ID único para la conexión
   * utilizando timestamp y número aleatorio
   * 
   * @returns {string} ID único para la conexión
   */
  generateId(): string {
    return `conn-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }

  /**
   * Cierra el diálogo sin guardar cambios
   * 
   * @returns {void}
   */
  onCancel(): void {
    this.dialogRef.close();
  }

  /**
   * Guarda los cambios en la conexión
   * Valida el formulario y envía los datos al servicio correspondiente
   * 
   * @returns {void}
   */
  onSave(): void {
    if (this.connectionForm.valid) {
      this.loading = true;
      const formValue = this.connectionForm.value;
      
      // Construir objeto de conexión con los valores del formulario
      const connection: NetworkConnection = {
        ...formValue,
        type: 'fiber', // Por defecto todo es fibra
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Lógica condicional según el modo (crear o editar)
      if (this.mode === 'create') {
        this.connectionService.createConnection(connection)
          .pipe(
            takeUntil(this.destroy$),
            finalize(() => this.loading = false)
          )
          .subscribe({
            next: () => {
              this.showNotification('Conexión creada exitosamente', 'success');
              this.dialogRef.close(connection);
            },
            error: (error) => this.handleError(error, 'crear')
          });
      } else {
        this.connectionService.updateConnection(connection)
          .pipe(
            takeUntil(this.destroy$),
            finalize(() => this.loading = false)
          )
          .subscribe({
            next: () => {
              this.showNotification('Conexión actualizada exitosamente', 'success');
              this.dialogRef.close(connection);
            },
            error: (error) => this.handleError(error, 'actualizar')
          });
      }
    } else {
      // Si el formulario no es válido, marcar campos como touched para mostrar errores
      Object.keys(this.connectionForm.controls).forEach(key => {
        const control = this.connectionForm.get(key);
        control?.markAsTouched();
      });
      
      this.showNotification('Por favor, complete correctamente los campos obligatorios', 'error');
    }
  }
  
  /**
   * Muestra una notificación al usuario usando MatSnackBar
   * 
   * @param {string} message - Mensaje a mostrar
   * @param {NotificationType} type - Tipo de notificación (success, error, info, warning)
   * @returns {void}
   */
  showNotification(message: string, type: NotificationType): void {
    const panelClass = `${type}-snackbar`;
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: [panelClass]
    });
  }

  /**
   * Maneja los errores de las operaciones asíncronas
   * Extrae el mensaje de error y lo muestra al usuario
   * 
   * @private
   * @param {any} error - Error capturado
   * @param {string} operation - Descripción de la operación que falló
   * @returns {void}
   */
  private handleError(error: any, operation: string): void {
    this.loading = false;
    let errorMessage = 'Error desconocido';
    
    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    this.showNotification(`Error al ${operation} la conexión: ${errorMessage}`, 'error');
    console.error(`${operation} failed:`, error);
  }
} 