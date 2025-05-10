import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Importación de animaciones
import { fadeAnimation, listAnimation, scaleAnimation } from '../../animations';

import { NetworkDesignService } from '../../services/network-design.service';
import { NetworkElement, ElementType, ElementStatus } from '../../../../shared/types/network.types';

/**
 * Interfaz para las opciones de plantillas de elementos
 * 
 * @property {string} id - Identificador único de la plantilla
 * @property {string} name - Nombre descriptivo de la plantilla
 * @property {ElementType} type - Tipo de elemento al que aplica la plantilla
 */
interface ElementTemplate {
  id: string;
  name: string;
  type: ElementType;
}

/**
 * Interfaz para los datos específicos de plantillas ODF
 */
interface OdfTemplateData {
  odfType: 'PRIMARY' | 'SECONDARY' | 'TERTIARY';
  totalPortCapacity: number;
  usedPorts: number;
  manufacturer: string;
  model: string;
  installationDate: Date | null;
  mountingType: string;
}

/**
 * Interfaz para los datos específicos de plantillas de caja terminal
 */
interface TerminalBoxTemplateData {
  capacity: number;
  usedPorts: number;
  cableType: string;
  indoorOutdoor: 'indoor' | 'outdoor';
  enclosureType: string;
  mountingType: string;
  ipRating: string;
}

/**
 * Tipo de unión para todos los datos de plantillas
 */
type TemplateData = OdfTemplateData | TerminalBoxTemplateData;

/**
 * Tipos de notificación soportados por el componente
 */
type NotificationType = 'success' | 'error' | 'info' | 'warning';

/**
 * Componente para la creación y edición por lotes de elementos de red
 * 
 * Permite crear múltiples elementos del mismo tipo de forma eficiente,
 * aplicando plantillas predefinidas y generando códigos automáticamente.
 * Incluye validación de formularios y feedback visual al usuario.
 * 
 * @implements {OnInit}
 * @implements {OnDestroy}
 */
@Component({
  selector: 'app-batch-element-editor',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatTableModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatSnackBarModule
  ],
  templateUrl: './batch-element-editor.component.html',
  styleUrls: ['./batch-element-editor.component.scss'],
  animations: [
    fadeAnimation,
    listAnimation,
    scaleAnimation
  ]
})
export class BatchElementEditorComponent implements OnInit, OnDestroy {
  /**
   * Formulario principal para la creación por lotes de elementos
   * Contiene la configuración general y un FormArray con los elementos individuales
   * 
   * @type {FormGroup}
   */
  batchForm!: FormGroup;
  
  /**
   * Tipo de elemento a crear en el proceso por lotes
   * Se obtiene de los parámetros de la ruta
   * 
   * @type {ElementType}
   * @default ElementType.ODF
   */
  elementType: ElementType = ElementType.ODF;
  
  /**
   * Indicador de estado de carga para mostrar spinner
   * Se activa durante las operaciones asíncronas
   * 
   * @type {boolean}
   * @default false
   */
  loading = false;
  
  /**
   * Mensaje de error para mostrar al usuario
   * Se actualiza cuando ocurre un error en la validación o al guardar
   * 
   * @type {string}
   * @default ''
   */
  errorMessage = '';
  
  /**
   * Opciones de plantillas disponibles para el tipo de elemento actual
   * Se filtran según el tipo de elemento seleccionado
   * 
   * @type {ElementTemplate[]}
   * @default []
   */
  templateOptions: ElementTemplate[] = [];
  
  /**
   * Columnas a mostrar en la tabla de elementos (cuando se implemente)
   * 
   * @type {string[]}
   */
  displayedColumns: string[] = ['select', 'code', 'name', 'status', 'actions'];
  
  /**
   * Subject para gestión de suscripciones y evitar memory leaks
   * Se completa en el método ngOnDestroy
   * 
   * @private
   * @type {Subject<void>}
   */
  private destroy$ = new Subject<void>();

  /**
   * Constructor con inyección de dependencias necesarias
   * 
   * @param {FormBuilder} fb - Servicio para crear formularios reactivos
   * @param {Router} router - Servicio para navegación
   * @param {ActivatedRoute} route - Servicio para acceder a parámetros de ruta
   * @param {NetworkDesignService} networkDesignService - Servicio para operaciones de red
   * @param {MatSnackBar} snackBar - Servicio para mostrar notificaciones
   */
  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private networkDesignService: NetworkDesignService,
    private snackBar: MatSnackBar
  ) {}

  /**
   * Inicialización del componente
   * Configura suscripciones, obtiene parámetros e inicializa formulario
   * 
   * @returns {void}
   */
  ngOnInit(): void {
    // Suscribirse a los parámetros de ruta para obtener el tipo de elemento
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      // Extraer y validar el tipo de elemento desde los parámetros
      const typeParam = params['type'];
      this.elementType = Object.values(ElementType).includes(typeParam) 
        ? typeParam as ElementType 
        : ElementType.ODF;
      
      // Inicializar el formulario y cargar datos
      this.initForm();
      this.loadElementTemplates();
      this.addElement();
    });
  }

  /**
   * Inicializa el formulario principal con su estructura y validaciones
   * Configura los cambios reactivos para la selección de plantillas
   * 
   * @returns {void}
   */
  initForm(): void {
    this.batchForm = this.fb.group({
      template: [null],
      elementType: [this.elementType, Validators.required],
      prefix: ['', [Validators.pattern(/^[A-Za-z0-9_-]*$/)]],
      startNumber: [1, [Validators.required, Validators.min(1)]],
      digits: [3, [Validators.required, Validators.min(1), Validators.max(10)]],
      elements: this.fb.array([])
    });

    // Reaccionar a cambios en la selección de plantilla
    this.batchForm.get('template')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(templateId => {
        if (templateId) {
          this.applyTemplate(templateId);
          this.showNotification('Plantilla aplicada correctamente', 'success');
        }
      });
  }

  /**
   * Accede al FormArray de elementos como propiedad calculada
   * 
   * @returns {FormArray} Array de formularios de elementos
   */
  get elementsArray(): FormArray {
    return this.batchForm.get('elements') as FormArray;
  }

  /**
   * Carga las plantillas disponibles según el tipo de elemento seleccionado
   * En una implementación real, estas plantillas se obtendrían del servicio
   * 
   * @returns {void}
   */
  loadElementTemplates(): void {
    // En una implementación real, cargarías las plantillas desde el servicio
    // Ejemplo: this.networkDesignService.getElementTemplates(this.elementType)
    const allTemplates: ElementTemplate[] = [
      { id: 'odf_primary', name: 'ODF Primario', type: ElementType.ODF },
      { id: 'odf_secondary', name: 'ODF Secundario', type: ElementType.ODF },
      { id: 'terminal_box_8', name: 'Terminal Box 8 puertos', type: ElementType.TERMINAL_BOX },
      { id: 'terminal_box_16', name: 'Terminal Box 16 puertos', type: ElementType.TERMINAL_BOX }
    ];
    
    // Filtrar las plantillas según el tipo de elemento actual
    this.templateOptions = allTemplates.filter(t => t.type === this.elementType);
  }

  /**
   * Aplica los valores de una plantilla a todos los elementos del batch
   * Los valores se aplican solo a los campos correspondientes, sin sobrescribir otros
   * 
   * @param {string} templateId - Identificador único de la plantilla a aplicar
   * @returns {void}
   */
  applyTemplate(templateId: string): void {
    // En una implementación real, cargarías los datos de la plantilla desde el servicio
    // Ejemplo: this.networkDesignService.getTemplateData(templateId)
    let templateData: TemplateData | null = null;
    
    // Simular carga de datos basados en el ID de plantilla
    switch(templateId) {
      case 'odf_primary':
        templateData = {
          odfType: 'PRIMARY',
          totalPortCapacity: 144,
          usedPorts: 0,
          manufacturer: 'Huawei',
          model: 'ODF-144',
          installationDate: new Date(),
          mountingType: 'rack'
        } as OdfTemplateData;
        break;
      case 'odf_secondary':
        templateData = {
          odfType: 'SECONDARY',
          totalPortCapacity: 72,
          usedPorts: 0,
          manufacturer: 'ZTE',
          model: 'ODF-72',
          installationDate: new Date(),
          mountingType: 'wall'
        } as OdfTemplateData;
        break;
      case 'terminal_box_8':
        templateData = {
          capacity: 8,
          usedPorts: 0,
          cableType: 'Fibra óptica',
          indoorOutdoor: 'outdoor',
          enclosureType: 'Plástico',
          mountingType: 'pole',
          ipRating: 'IP65'
        } as TerminalBoxTemplateData;
        break;
      case 'terminal_box_16':
        templateData = {
          capacity: 16,
          usedPorts: 0,
          cableType: 'Fibra óptica',
          indoorOutdoor: 'outdoor',
          enclosureType: 'Metálico',
          mountingType: 'wall',
          ipRating: 'IP67'
        } as TerminalBoxTemplateData;
        break;
    }
    
    if (!templateData) {
      this.showNotification('Plantilla no encontrada', 'error');
      return;
    }
    
    // Aplicar los datos de la plantilla a todos los elementos
    const elements = this.elementsArray.controls;
    elements.forEach(element => {
      // Solo actualiza los campos específicos de la plantilla
      Object.keys(templateData as object).forEach(key => {
        if (element.get(key)) {
          element.get(key)?.setValue((templateData as any)[key]);
        }
      });
    });
  }

  /**
   * Agrega un nuevo elemento al lote de elementos a crear
   * Inicializa el elemento con un código generado automáticamente
   * 
   * @returns {void}
   */
  addElement(): void {
    const baseElementForm = this.createElementFormGroup();
    this.generateCode(baseElementForm, this.elementsArray.length);
    this.elementsArray.push(baseElementForm);
  }

  /**
   * Elimina un elemento del lote según su índice
   * 
   * @param {number} index - Índice del elemento a eliminar
   * @returns {void}
   */
  removeElement(index: number): void {
    if (index < 0 || index >= this.elementsArray.length) {
      return;
    }
    
    this.elementsArray.removeAt(index);
    this.showNotification('Elemento eliminado', 'info');
  }

  /**
   * Duplica un elemento existente, manteniendo sus valores
   * pero generando un nuevo código único
   * 
   * @param {number} index - Índice del elemento a duplicar
   * @returns {void}
   */
  duplicateElement(index: number): void {
    if (index < 0 || index >= this.elementsArray.length) {
      return;
    }
    
    const original = this.elementsArray.at(index).value;
    const copy = this.createElementFormGroup();
    
    // Copia todos los valores excepto el código
    Object.keys(original).forEach(key => {
      if (key !== 'code' && copy.get(key)) {
        copy.get(key)?.setValue(original[key]);
      }
    });
    
    // Genera un nuevo código
    this.generateCode(copy, this.elementsArray.length);
    
    this.elementsArray.push(copy);
    this.showNotification('Elemento duplicado', 'success');
  }

  /**
   * Crea un FormGroup para un nuevo elemento con la estructura y validaciones
   * apropiadas según el tipo de elemento seleccionado
   * 
   * @returns {FormGroup} FormGroup configurado según el tipo de elemento
   */
  createElementFormGroup(): FormGroup {
    // Crear un FormGroup base con campos comunes a todos los tipos
    const baseForm = this.fb.group({
      code: ['', [Validators.required, Validators.maxLength(20), Validators.pattern(/^[A-Za-z0-9_-]+$/)]],
      name: ['', Validators.maxLength(100)],
      status: [ElementStatus.ACTIVE, Validators.required],
      position: this.fb.group({
        coordinates: [[0, 0], Validators.required]
      }),
      notes: ['', Validators.maxLength(500)]
    }) as FormGroup;
    
    // Añadir campos específicos según el tipo de elemento seleccionado
    switch (this.elementType) {
      case ElementType.ODF:
        baseForm.setControl('odfType', this.fb.control('PRIMARY', Validators.required));
        baseForm.setControl('totalPortCapacity', this.fb.control(0, [Validators.required, Validators.min(0)]));
        baseForm.setControl('usedPorts', this.fb.control(0, [Validators.min(0)]));
        baseForm.setControl('manufacturer', this.fb.control('', Validators.maxLength(50)));
        baseForm.setControl('model', this.fb.control('', Validators.maxLength(50)));
        baseForm.setControl('installationDate', this.fb.control(null));
        baseForm.setControl('mountingType', this.fb.control('wall', Validators.required));
        break;
      case ElementType.TERMINAL_BOX:
        baseForm.setControl('capacity', this.fb.control(8, [Validators.required, Validators.min(0)]));
        baseForm.setControl('usedPorts', this.fb.control(0, [Validators.min(0)]));
        baseForm.setControl('cableType', this.fb.control('Fibra óptica'));
        baseForm.setControl('indoorOutdoor', this.fb.control('outdoor'));
        baseForm.setControl('enclosureType', this.fb.control('Plástico'));
        baseForm.setControl('mountingType', this.fb.control('wall'));
        baseForm.setControl('ipRating', this.fb.control('IP65'));
        break;
      // Otros tipos de elementos pueden agregarse aquí con sus campos específicos
    }
    
    return baseForm;
  }

  /**
   * Regenera los códigos de todos los elementos del lote
   * utilizando la configuración actual (prefijo, número inicial, dígitos)
   * 
   * @returns {void}
   */
  generateAllCodes(): void {
    const prefix = this.batchForm.get('prefix')?.value || '';
    const startNumber = this.batchForm.get('startNumber')?.value || 1;
    const digits = this.batchForm.get('digits')?.value || 3;
    
    // Validar que los valores sean válidos
    if (startNumber < 1 || digits < 1 || digits > 10) {
      this.showNotification('Configuración de códigos inválida', 'error');
      return;
    }
    
    this.elementsArray.controls.forEach((element, index) => {
      this.generateCode(element as FormGroup, index, prefix, startNumber, digits);
    });
    
    this.showNotification('Códigos regenerados', 'info');
  }

  /**
   * Genera un código único para un elemento basado en su tipo y posición
   * El formato es: [PREFIJO_TIPO]-[PREFIJO_USUARIO][NÚMERO_SECUENCIAL]
   * 
   * @param {FormGroup} formGroup - FormGroup del elemento
   * @param {number} index - Índice del elemento en el array
   * @param {string} [prefix] - Prefijo personalizado (opcional)
   * @param {number} [startNumber] - Número inicial (opcional)
   * @param {number} [digits] - Cantidad de dígitos para el número (opcional)
   * @returns {void}
   */
  generateCode(
    formGroup: FormGroup, 
    index: number, 
    prefix?: string, 
    startNumber?: number, 
    digits?: number
  ): void {
    const elementPrefix = prefix !== undefined ? prefix : this.batchForm.get('prefix')?.value || '';
    const elementStartNumber = startNumber !== undefined ? startNumber : this.batchForm.get('startNumber')?.value || 1;
    const elementDigits = digits !== undefined ? digits : this.batchForm.get('digits')?.value || 3;
    
    const typePrefix = this.getElementTypePrefix();
    const number = elementStartNumber + index;
    const paddedNumber = number.toString().padStart(elementDigits, '0');
    
    const code = `${typePrefix}${elementPrefix ? '-' + elementPrefix : ''}${paddedNumber}`;
    formGroup.get('code')?.setValue(code);
  }

  /**
   * Obtiene el prefijo estandarizado correspondiente al tipo de elemento actual
   * Estos prefijos se utilizan para la generación de códigos
   * 
   * @returns {string} Prefijo del tipo de elemento
   */
  getElementTypePrefix(): string {
    switch (this.elementType) {
      case ElementType.ODF:
        return 'ODF';
      case ElementType.TERMINAL_BOX:
        return 'TBX';
      case ElementType.SPLITTER:
        return 'SPL';
      case ElementType.ONT:
        return 'ONT';
      case ElementType.OLT:
        return 'OLT';
      case ElementType.EDFA:
        return 'EDF';
      default:
        return 'ELE';
    }
  }

  /**
   * Obtiene el nombre descriptivo y legible del tipo de elemento actual
   * para mostrar en la interfaz de usuario
   * 
   * @returns {string} Nombre descriptivo del tipo de elemento
   */
  getElementTypeName(): string {
    switch (this.elementType) {
      case ElementType.ODF:
        return 'Distribuidores de Fibra (ODF)';
      case ElementType.TERMINAL_BOX:
        return 'Cajas Terminales';
      case ElementType.SPLITTER:
        return 'Splitters';
      case ElementType.ONT:
        return 'Terminales Ópticas (ONT)';
      case ElementType.OLT:
        return 'Terminales de Línea Óptica (OLT)';
      case ElementType.EDFA:
        return 'Amplificadores EDFA';
      default:
        return 'Elementos';
    }
  }

  /**
   * Obtiene el nombre del icono de Material Icons correspondiente
   * al tipo de elemento actual
   * 
   * @returns {string} Nombre del icono de Material Icons
   */
  getElementTypeIcon(): string {
    switch (this.elementType) {
      case ElementType.ODF:
        return 'settings_input_hdmi';
      case ElementType.TERMINAL_BOX:
        return 'inbox';
      case ElementType.SPLITTER:
        return 'call_split';
      case ElementType.ONT:
        return 'router';
      case ElementType.OLT:
        return 'dns';
      case ElementType.EDFA:
        return 'settings_input_antenna';
      default:
        return 'devices_other';
    }
  }

  /**
   * Calcula la capacidad total sumando las capacidades individuales
   * de todos los elementos del lote
   * 
   * @returns {number} Suma total de las capacidades
   */
  getTotalCapacity(): number {
    let total = 0;
    
    this.elementsArray.controls.forEach(element => {
      switch (this.elementType) {
        case ElementType.ODF:
          total += Number(element.get('totalPortCapacity')?.value || 0);
          break;
        case ElementType.TERMINAL_BOX:
          total += Number(element.get('capacity')?.value || 0);
          break;
        // Se pueden agregar más casos para otros tipos de elementos
      }
    });
    
    return total;
  }

  /**
   * Envía el formulario para crear los elementos en lote
   * Valida el formulario y prepara los datos para enviarlos al servicio
   * 
   * @returns {void}
   */
  onSubmit(): void {
    if (this.batchForm.valid) {
      this.loading = true;
      this.errorMessage = '';
      
      // Preparar los datos para enviar al servicio
      const elements = this.elementsArray.value.map((element: any) => ({
        ...element,
        type: this.elementType
      }));
      
      // En una implementación real, enviarías los datos al servicio
      // usando el servicio de inyección de dependencias NetworkDesignService
      setTimeout(() => {
        this.loading = false;
        this.showNotification(`Se han creado ${elements.length} elementos exitosamente`, 'success');
        
        // Navegar de vuelta a la vista de elementos
        this.router.navigate(['../..'], { relativeTo: this.route });
      }, 1500);
      
      // Implementación real usando el servicio (comentada por ahora)
      /*
      this.networkDesignService.createBatchElements(elements)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.loading = false;
            this.showNotification(`Se han creado ${elements.length} elementos exitosamente`, 'success');
            this.router.navigate(['../..'], { relativeTo: this.route });
          },
          error: (error) => {
            this.loading = false;
            this.errorMessage = error.message || 'Error al crear los elementos';
            this.showNotification(this.errorMessage, 'error');
          }
        });
      */
    } else {
      // Marcar todos los campos como touched para mostrar errores
      this.markFormGroupTouched(this.batchForm);
      this.errorMessage = 'Por favor, complete correctamente todos los campos obligatorios';
      this.showNotification(this.errorMessage, 'error');
    }
  }

  /**
   * Cancela la operación y regresa a la vista anterior
   * 
   * @returns {void}
   */
  onCancel(): void {
    this.router.navigate(['../..'], { relativeTo: this.route });
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
   * Marca todos los controles de un FormGroup como touched
   * para activar la visualización de errores de validación
   * 
   * @param {FormGroup} formGroup - Formulario a marcar
   * @returns {void}
   */
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      
      // Si el control es otro FormGroup, aplicar recursivamente
      if ((control as any).controls) {
        this.markFormGroupTouched(control as FormGroup);
      }
    });
  }

  /**
   * Limpia recursos al destruir el componente
   * Completa el Subject para cancelar todas las suscripciones
   * 
   * @returns {void}
   */
  ngOnDestroy(): void {
    // Completar el subject para evitar memory leaks
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Trunca un texto para mostrar, añadiendo elipsis si es necesario
   * Útil para mostrar textos largos en espacios limitados
   * 
   * @param {string} text - Texto a truncar
   * @param {number} [length=20] - Longitud máxima deseada
   * @returns {string} Texto truncado o el original si es menor que la longitud
   */
  truncateText(text: string, length = 20): string {
    if (!text) return '';
    return text.length > length ? text.substring(0, length - 3) + '...' : text;
  }

  /**
   * Calcula el porcentaje de uso de puertos de un elemento
   * 
   * @param {AbstractControl} element - Control del elemento
   * @returns {number} Porcentaje de uso (0-100)
   */
  getPortUsagePercentage(element: AbstractControl): number {
    if (!element) return 0;
    
    let total = 0;
    let used = 0;
    
    switch (this.elementType) {
      case ElementType.ODF:
        total = Number(element.get('totalPortCapacity')?.value || 0);
        used = Number(element.get('usedPorts')?.value || 0);
        break;
      case ElementType.TERMINAL_BOX:
        total = Number(element.get('capacity')?.value || 0);
        used = Number(element.get('usedPorts')?.value || 0);
        break;
      default:
        return 0;
    }
    
    if (total <= 0) return 0;
    
    const percentage = (used / total) * 100;
    return Math.min(Math.round(percentage), 100); // Asegurar que no exceda el 100%
  }

  /**
   * Obtiene el porcentaje de uso general para mostrar el color adecuado
   * Delegando al método específico según el tipo de elemento
   * 
   * @param {AbstractControl} element - Control del elemento
   * @returns {number} Porcentaje de uso (0-100)
   */
  getUsagePercentage(element: AbstractControl): number {
    if (!element) return 0;
    
    switch (this.elementType) {
      case ElementType.ODF:
      case ElementType.TERMINAL_BOX:
        return this.getPortUsagePercentage(element);
      // Se pueden agregar más casos para otros tipos de elementos
      default:
        return 0;
    }
  }
} 