import { Component, OnInit, OnDestroy, inject, Inject } from '@angular/core';
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
import { MatCardModule } from '@angular/material/card';
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
  NetworkConnection,
  ConnectionType,
  ConnectionStatus,
  FiberType
} from '../../../../shared/types/network.types';
import {
  FiberConnection as DetailedFiberConnection,
  FiberType as ModelFiberType,
  FiberUsageType,
  ConnectorType,
  PolishingType,
  FiberStandard
} from '../../../../shared/models/fiber-connection.model';

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
 * Interfaz extendida de NetworkConnection con propiedades adicionales
 * para el formulario de edición
 */
interface ExtendedNetworkConnection extends NetworkConnection {
  fiberType?: FiberType;
  length?: number;
  capacity?: number;
  label?: string;
  description?: string;
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
    MatChipsModule,
    MatCardModule
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
  FiberUsageType = FiberUsageType;
  ConnectorType = ConnectorType;
  FiberStandard = FiberStandard;
  PolishingType = PolishingType;
  
  // Helper para iterar sobre enums en el template
  objectKeys = Object.keys;
  
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

  // Nueva propiedad para almacenar los detalles de la fibra
  detailedFiberInfo: DetailedFiberConnection | null = null;

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
    this.mode = this.data?.mode || 'edit';
    const connection = this.data?.connection as ExtendedNetworkConnection || null;

    // Inicialización del formulario reactivo con validaciones
    this.connectionForm = this.fb.group({
      id: [connection?.id || this.generateId()],
      sourceElementId: [connection?.sourceElementId || '', Validators.required],
      targetElementId: [connection?.targetElementId || '', Validators.required],
      status: [connection?.status || ElementStatus.ACTIVE, Validators.required],
      fiberType: [connection?.properties?.fiberType || FiberType.SINGLE_MODE],
      length: [
        connection?.properties?.length || 0, 
        [Validators.min(0), Validators.pattern(/^\d+(\.\d{1,2})?$/)]
      ],
      capacity: [
        connection?.properties?.capacity || 10, 
        [Validators.min(0), Validators.pattern(/^\d+(\.\d{1,2})?$/)]
      ],
      label: [connection?.name || ''],
      description: [connection?.properties?.description || ''],
      usageType: [FiberUsageType.DISTRIBUTION],
      connectorType: [ConnectorType.SC],
      standard: [FiberStandard.ITU_T_G_652],
      polishingType: [PolishingType.APC],
      manufacturer: [''],
      modelNumber: [''],
    });
  }

  /**
   * Inicialización del componente
   * Configura observadores para el formulario y carga elementos disponibles
   * 
   * @returns {void}
   */
  ngOnInit(): void {
    console.log('ConnectionEditorComponent inicializado con datos:', this.data);
    
    // Cargar elementos disponibles
    this.loadAvailableElements();
    
    if (this.mode === 'edit' && this.data.connection) {
      const currentConnection = this.data.connection;
      if (currentConnection.type === ConnectionType.FIBER && currentConnection.detailedFiberConnectionId) {
        this.loading = true;
        this.connectionService.getDetailedFiberConnectionById(currentConnection.detailedFiberConnectionId)
          .pipe(
            takeUntil(this.destroy$),
            finalize(() => this.loading = false)
          )
          .subscribe(details => {
            if (details) {
              this.detailedFiberInfo = details;
              console.log('Detailed Fiber Info Cargado:', this.detailedFiberInfo);

              // Poblar el formulario con los detalles de la fibra
              this.connectionForm.patchValue({
                // Los campos que ya estaban en el formulario y ahora vienen de DetailedFiberConnection
                fiberType: this.detailedFiberInfo.fiberType,
                length: this.detailedFiberInfo.networkInfo?.distanceMetrics?.totalLength || this.detailedFiberInfo.metadata?.length || this.connectionForm.value.length || 0,
                capacity: this.detailedFiberInfo.strands?.total || this.connectionForm.value.capacity || 0,
                description: this.detailedFiberInfo.description || this.connectionForm.value.description || '',
                label: this.detailedFiberInfo.name || this.connectionForm.value.label || '',
                // Poblar nuevos campos desde detailedFiberInfo
                usageType: this.detailedFiberInfo.usageType || FiberUsageType.DISTRIBUTION,
                connectorType: this.detailedFiberInfo.connectorType || ConnectorType.SC,
                standard: this.detailedFiberInfo.standard || FiberStandard.ITU_T_G_652,
                polishingType: this.detailedFiberInfo.polishingType || PolishingType.APC,
                manufacturer: this.detailedFiberInfo.manufacturer || '',
                modelNumber: this.detailedFiberInfo.modelNumber || '',
              });
            } else {
              console.warn(`No se pudieron cargar los detalles para detailedFiberConnectionId: ${currentConnection.detailedFiberConnectionId}`);
              // Considerar si se debe hacer fallback a connection.properties si details es null
              // this.connectionForm.patchValue({
              //   fiberType: currentConnection.properties?.fiberType || FiberType.SINGLE_MODE,
              //   length: currentConnection.properties?.length || 0,
              //   capacity: currentConnection.properties?.capacity || 10,
              //   description: currentConnection.properties?.description || '',
              //   label: currentConnection.name || ''
              // });
            }
          });
      }
      // else if (this.mode === 'edit' && this.data.connection) {
      //   // Si es modo edición pero no es fibra o no tiene ID de detalle, usar connection.properties como antes
      //   const connProps = this.data.connection.properties as any;
      //   this.connectionForm.patchValue({
      //     fiberType: connProps?.fiberType || FiberType.SINGLE_MODE,
      //     length: connProps?.length || 0,
      //     capacity: connProps?.capacity || 10,
      //     description: connProps?.description || '',
      //     label: this.data.connection.name || ''
              // });
              // }
    }
    
    // Suscribirse a cambios en el elemento origen para actualizar destinos disponibles
    this.connectionForm.get('sourceElementId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(sourceId => {
        this.updateSourceElement();
        this.updateAvailableTargets(sourceId);
      });
      
    // Suscribirse a cambios en el elemento destino
    this.connectionForm.get('targetElementId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateTargetElement();
      });
      
    // Si hay elementos origen y destino seleccionados, actualizar referencias
    if (this.connectionForm.get('sourceElementId')?.value) {
      this.updateSourceElement();
      this.updateAvailableTargets(this.connectionForm.get('sourceElementId')?.value);
    }
    
    if (this.connectionForm.get('targetElementId')?.value) {
      this.updateTargetElement();
    }
  }

  /**
   * Limpieza al destruir el componente
   * Completa el Subject para cancelar todas las suscripciones
   * 
   * @returns {void}
   */
  ngOnDestroy(): void {
    this.cleanup();
  }

  /**
   * Método para limpiar recursos cuando se destruye el componente
   * Implementa la liberación segura de recursos y cancelación de suscripciones
   * 
   * @private
   * @returns {void}
   */
  private cleanup(): void {
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
    const sourceId = this.connectionForm.get('sourceElementId')?.value;
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
    const targetId = this.connectionForm.get('targetElementId')?.value;
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
    // Mapa de iconos para mejorar mantenibilidad y consistencia
    const iconMap: Partial<Record<ElementType, string>> = {
      [ElementType.ODF]: 'router',
      [ElementType.OLT]: 'settings_input_hdmi',
      [ElementType.ONT]: 'dns',
      [ElementType.EDFA]: 'tune',
      [ElementType.SPLITTER]: 'call_split',
      [ElementType.MANGA]: 'settings_input_component',
      [ElementType.TERMINAL_BOX]: 'archive',
      [ElementType.RACK]: 'domain',
      [ElementType.FIBER_THREAD]: 'timeline',
      [ElementType.FIBER_CONNECTION]: 'timeline',
      [ElementType.SLACK_FIBER]: 'waves',
      [ElementType.CUSTOM]: 'category'
    };

    return iconMap[type] || 'device_unknown';
  }
  
  /**
   * Obtiene el nombre legible del tipo de fibra
   * 
   * @param {FiberType} type - Tipo de fibra óptica
   * @returns {string} Nombre descriptivo del tipo de fibra
   */
  getFiberTypeName(type: FiberType): string {
    // Mapa de nombres para tipos de fibra simplificado
    const fiberTypeMap: Partial<Record<FiberType, string>> = {
      [FiberType.SINGLE_MODE]: 'Monomodo',
      [FiberType.MULTI_MODE]: 'Multimodo'
    };

    return fiberTypeMap[type] || 'Desconocido';
  }
  
  /**
   * Obtiene la clase CSS correspondiente al estado seleccionado
   * para aplicar estilos visuales según el estado
   * 
   * @returns {string} Nombre de la clase CSS
   */
  getStatusClass(): string {
    const status = this.connectionForm.get('status')?.value;
    
    // Mapa de clases CSS para estados
    const statusClassMap: Partial<Record<ElementStatus, string>> = {
      [ElementStatus.ACTIVE]: 'active',
      [ElementStatus.INACTIVE]: 'inactive',
      [ElementStatus.MAINTENANCE]: 'maintenance',
      [ElementStatus.ERROR]: 'fault',
      [ElementStatus.PLANNING]: 'planned'
    };

    return statusClassMap[status] || 'active';
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
      const originalConnection = this.data.connection;

      // Determinar el tipo de conexión (principalmente para saber si es FIBER)
      const connectionType = originalConnection?.type || (formValue.fiberType ? ConnectionType.FIBER : ConnectionType.LOGICAL); // Asumir LOGICAL si no hay fiberType

      if (this.mode === 'edit' && originalConnection) {
        // MODO EDICIÓN
        const connectionToUpdate = this.updateBaseNetworkConnection(originalConnection, formValue);
        connectionToUpdate.type = connectionType; // Asegurar que el tipo se mantenga o se derive

        if (connectionToUpdate.type === ConnectionType.FIBER && this.detailedFiberInfo && originalConnection.detailedFiberConnectionId) {
          // Caso 1: Editar Fibra con Detalles Existentes
          connectionToUpdate.detailedFiberConnectionId = originalConnection.detailedFiberConnectionId;
          
          // Actualizar this.detailedFiberInfo con valores del formulario
          this.detailedFiberInfo.name = formValue.label;
          this.detailedFiberInfo.fiberType = formValue.fiberType;
          this.detailedFiberInfo.description = formValue.description;
          if (!this.detailedFiberInfo.networkInfo) this.detailedFiberInfo.networkInfo = {};
          if (!this.detailedFiberInfo.networkInfo.distanceMetrics) {
            this.detailedFiberInfo.networkInfo.distanceMetrics = { totalLength: 0, splicePoints: 0, maxSpliceLoss: 0, totalLoss: 0 };
          }
          this.detailedFiberInfo.networkInfo.distanceMetrics.totalLength = parseFloat(formValue.length) || 0;
          if (!this.detailedFiberInfo.strands) {
            this.detailedFiberInfo.strands = { total: 0, available: 0, inUse: 0, reserved: 0, damaged: 0 };
          }
          this.detailedFiberInfo.strands.total = parseFloat(formValue.capacity) || 0;
          this.detailedFiberInfo.usageType = formValue.usageType;
          this.detailedFiberInfo.connectorType = formValue.connectorType;
          this.detailedFiberInfo.standard = formValue.standard;
          this.detailedFiberInfo.polishingType = formValue.polishingType;
          this.detailedFiberInfo.manufacturer = formValue.manufacturer;
          this.detailedFiberInfo.modelNumber = formValue.modelNumber;

          this.connectionService.updateDetailedFiberConnection(this.detailedFiberInfo)
            .pipe(
              takeUntil(this.destroy$),
              // No usar finalize aquí para loading, se maneja después de la llamada a updateConnection
            )
            .subscribe({
              next: (updatedFiberDetails) => {
                if (updatedFiberDetails) {
                  console.log('DetailedFiberInfo actualizado en el servicio:', updatedFiberDetails);
                } else {
                  this.showNotification('Advertencia: No se pudieron guardar todos los detalles de la fibra.', 'warning');
                }
                // Después de actualizar los detalles (o si falla levemente), actualiza la conexión base
                this.finalizeUpdateConnection(connectionToUpdate);
              },
              error: (error) => {
                this.handleError(error, 'actualizar detalles de fibra');
                // Incluso si fallan los detalles, intenta actualizar la conexión base
                this.finalizeUpdateConnection(connectionToUpdate);
              }
            });
        } else {
          // Caso 2: Editar conexión que no es de fibra detallada o es de otro tipo
          // (Esto incluye el caso donde era fibra pero no tenía detailedFiberConnectionId, o ahora es otro tipo)
          // En este caso, detailedFiberConnectionId debe ser null o undefined
          connectionToUpdate.detailedFiberConnectionId = undefined; 
          this.finalizeUpdateConnection(connectionToUpdate);
        }

      } else if (this.mode === 'create') {
        // MODO CREACIÓN
        const connectionToCreate = this.createBaseNetworkConnection(formValue);
        connectionToCreate.type = connectionType;

        if (connectionToCreate.type === ConnectionType.FIBER) {
          // Caso 3: Crear nueva conexión de Fibra
          const newDetailedFiberId = this.generateDetailedFiberId();
          connectionToCreate.detailedFiberConnectionId = newDetailedFiberId;

          const newDetailedFiberInfo: DetailedFiberConnection = {
            id: newDetailedFiberId,
            name: formValue.label || `Detalle Fibra ${newDetailedFiberId}`,
            fiberType: formValue.fiberType as ModelFiberType, 
            description: formValue.description || '',
            usageType: formValue.usageType || FiberUsageType.DISTRIBUTION,
            connectorType: formValue.connectorType || ConnectorType.SC,
            standard: formValue.standard || FiberStandard.ITU_T_G_652,
            polishingType: formValue.polishingType || PolishingType.APC,
            manufacturer: formValue.manufacturer || 'N/A',
            modelNumber: formValue.modelNumber || 'N/A',
            insertionLoss: 0, returnLoss: 0, wavelength: 1310, bandwidth: 0, 
            coreDiameter: 9, claddingDiameter: 125, outerDiameter: 3, 
            operatingTemperature: { min: -20, max: 70 }, 
            tensileStrength: 0, 
            manufacturingDate: new Date(), 
            certifications: [], 
            strands: {
              total: parseFloat(formValue.capacity) || 0,
              available: parseFloat(formValue.capacity) || 0,
              inUse: 0, reserved: 0, damaged: 0
            },
            strandConfiguration: { 
              totalStrands: parseFloat(formValue.capacity) || 0,
              strandsPerTube: parseFloat(formValue.capacity) || 0, 
              tubesPerCable: 1, bufferTubes: 1, centralStrengthMember: false
            },
            networkInfo: {
              distanceMetrics: {
                totalLength: parseFloat(formValue.length) || 0,
                splicePoints: 0, maxSpliceLoss: 0, totalLoss: 0
              }
            }
          };

          this.connectionService.createDetailedFiberConnection(newDetailedFiberInfo)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: (createdDetailedFiber) => {
                if (createdDetailedFiber) {
                  console.log('DetailedFiberConnection creado exitosamente:', createdDetailedFiber);
                } else {
                  // Esto es problemático, la conexión base referenciará un ID de detalle que no se creó.
                  this.showNotification('Error: Falló la creación de detalles de fibra. La conexión no se creó completamente.', 'error');
                  connectionToCreate.detailedFiberConnectionId = undefined; // Anular si falla la creación
                  // Considerar no crear la conexión base si los detalles son cruciales
                }
                this.finalizeCreateConnection(connectionToCreate);
              },
              error: (err) => {
                this.handleError(err, 'crear detalles de fibra');
                connectionToCreate.detailedFiberConnectionId = undefined; // Anular si falla la creación
                this.finalizeCreateConnection(connectionToCreate); // Intentar crear base incluso si fallan detalles
              }
            });
        } else {
          // Caso 4: Crear nueva conexión de otro tipo (no fibra)
          this.finalizeCreateConnection(connectionToCreate);
        }
      }
    } else {
      Object.keys(this.connectionForm.controls).forEach(key => {
        this.connectionForm.get(key)?.markAsTouched();
      });
      this.showNotification('Por favor, complete correctamente los campos obligatorios', 'error');
      this.loading = false;
    }
  }

  // Nueva función helper para finalizar la creación
  private finalizeCreateConnection(connection: NetworkConnection): void {
    this.connectionService.createConnection(connection)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => { this.loading = false; })
      )
      .subscribe({
        next: (createdConnection) => {
          this.showNotification('Conexión creada exitosamente', 'success');
          this.dialogRef.close(createdConnection);
        },
        error: (error) => this.handleError(error, 'crear conexión base')
      });
  }

  // Nueva función helper para finalizar la actualización
  private finalizeUpdateConnection(connection: NetworkConnection): void {
    this.connectionService.updateConnection(connection)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => { this.loading = false; })
      )
      .subscribe({
        next: (updatedConnection) => {
          this.showNotification('Conexión actualizada exitosamente', 'success');
          this.dialogRef.close(updatedConnection);
        },
        error: (error) => this.handleError(error, 'actualizar conexión base')
      });
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

  /**
   * Carga los elementos disponibles para la creación de conexiones
   * 
   * @returns {void}
   */
  private loadAvailableElements(): void {
    this.elementManagementService.getElements()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loading = false)
      )
      .subscribe({
        next: (elements) => {
          this.availableElements = elements;
        },
        error: (error) => this.handleError(error, 'cargar elementos')
      });
  }

  /**
   * Actualiza la lista de elementos destino disponibles basados en el elemento origen seleccionado
   * 
   * @param {string} sourceId - ID del elemento origen
   * @returns {void}
   */
  private updateAvailableTargets(sourceElementId: string): void {
    this._availableTargets = this.availableElements.filter(element => 
      element.id !== sourceElementId
    );
  }

  // Nueva función para generar ID para DetailedFiberConnection
  private generateDetailedFiberId(): string {
    return `detailed-fiber-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  // createBaseNetworkConnection y updateBaseNetworkConnection ahora aceptan formValue
  private createBaseNetworkConnection(formValue: any): NetworkConnection {
    const newConnection: ExtendedNetworkConnection = {
      id: formValue.id || this.generateId(),
      sourceElementId: formValue.sourceElementId,
      targetElementId: formValue.targetElementId,
      type: ConnectionType.FIBER, // Asumiendo que este editor es para fibra
      status: formValue.status,
      name: formValue.label, // Mapeo de label a name
      properties: {
        fiberType: formValue.fiberType,
        length: parseFloat(formValue.length) || 0,
        capacity: parseFloat(formValue.capacity) || 0,
        description: formValue.description, // description del form a properties.description
      },
      metadata: { 
        createdBy: 'ConnectionEditor',
        createdAt: new Date().toISOString()
      }
    };
    return newConnection as NetworkConnection;
  }

  private updateBaseNetworkConnection(connection: NetworkConnection, formValue: any): NetworkConnection {
    const updatedConnection: ExtendedNetworkConnection = {
      ...connection, // Preserva los campos existentes de la conexión original
      sourceElementId: formValue.sourceElementId,
      targetElementId: formValue.targetElementId,
      status: formValue.status,
      name: formValue.label, // Mapeo de label a name
      properties: {
        ...(connection.properties || {}), // Preserva las propiedades existentes
        fiberType: formValue.fiberType,
        length: parseFloat(formValue.length) || 0,
        capacity: parseFloat(formValue.capacity) || 0,
        description: formValue.description // description del form a properties.description
      },
      metadata: {
        ...(connection.metadata || {}),
        updatedBy: 'ConnectionEditor',
        updatedAt: new Date().toISOString()
      }
    };
    return updatedConnection as NetworkConnection;
  }

  /**
   * Obtiene el nombre legible para FiberUsageType.
   * @param type Tipo de uso de la fibra.
   * @returns Nombre descriptivo.
   */
  getFiberUsageTypeName(type: FiberUsageType): string {
    const usageTypeMap: Partial<Record<FiberUsageType, string>> = {
      [FiberUsageType.BACKBONE]: 'Troncal (Backbone)',
      [FiberUsageType.DISTRIBUTION]: 'Distribución',
      [FiberUsageType.DROP]: 'Bajante (Drop)',
      [FiberUsageType.JUMPER]: 'Jumper',
      [FiberUsageType.PATCH]: 'Parcheo (Patch)',
      [FiberUsageType.FEEDER]: 'Alimentador (Feeder)',
      [FiberUsageType.ACCESS]: 'Acceso',
      [FiberUsageType.INTERCONNECTION]: 'Interconexión'
    };
    return usageTypeMap[type] || type;
  }
} 
