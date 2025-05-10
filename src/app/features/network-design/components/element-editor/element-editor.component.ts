import { Component, ChangeDetectionStrategy, ChangeDetectorRef, EventEmitter, Output, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatStepperModule } from '@angular/material/stepper';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { STEPPER_GLOBAL_OPTIONS } from '@angular/cdk/stepper';

import { takeUntil, finalize, filter, distinctUntilChanged, debounceTime } from 'rxjs/operators';
import { BehaviorSubject } from 'rxjs';

import { fadeAnimation, scaleAnimation } from '../../animations';
import { NetworkElement, ElementType, ElementStatus } from '../../../../shared/types/network.types';
import { ConfirmDialogComponent } from '../../../../shared/confirm-dialog/confirm-dialog.component';

// Servicios
import { ElementEditorService } from '../../services/element-editor.service';
import { MapService } from '../../services/map.service';
import { NetworkStateService } from '../../services/network-state.service';
import { ErrorHandlingService } from '../../services/error-handling.service';
import { HelpDialogService } from '../../services/help-dialog.service';

// Componente base
import { BaseEditorComponent } from '../base-editor.component';

// Componentes específicos
import { ElementTypeSelectorComponent } from './element-type-selector/element-type-selector.component';
import { MapPositionSelectorComponent } from './map-position-selector/map-position-selector.component';
import { OltFormComponent } from './element-type-form/olt-form.component';
import { OdfFormComponent } from './element-type-form/odf-form.component';
import { OntFormComponent } from './element-type-form/ont-form.component';
import { SplitterFormComponent } from './element-type-form/splitter-form.component';
import { EdfaFormComponent } from './element-type-form/edfa-form.component';
import { MangaFormComponent } from './element-type-form/manga-form.component';
import { TerminalBoxFormComponent } from './element-type-form/terminal-box-form.component';

/**
 * Componente principal para la creación y edición de elementos de red.
 * 
 * Este componente actúa como un contenedor y orquestador para los 
 * subcomponentes especializados, gestionando el flujo general y
 * la comunicación con los servicios.
 */
@Component({
  selector: 'app-element-editor',
  templateUrl: './element-editor.component.html',
  styleUrls: ['./element-editor.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatStepperModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    ElementTypeSelectorComponent,
    MapPositionSelectorComponent,
    OltFormComponent,
    OdfFormComponent,
    OntFormComponent,
    SplitterFormComponent,
    EdfaFormComponent,
    MangaFormComponent,
    TerminalBoxFormComponent
  ],
  providers: [
    {
      provide: STEPPER_GLOBAL_OPTIONS,
      useValue: { showError: true }
    }
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [fadeAnimation, scaleAnimation]
})
export class ElementEditorComponent extends BaseEditorComponent {
  // Estado local específico
  private readonly currentStep$ = new BehaviorSubject<number>(0);
  
  // Formulario principal
  elementForm!: FormGroup;
  protected override get form(): FormGroup {
    return this.elementForm;
  }
  
  // Estado de edición
  isEditMode = false;
  elementId: string | null = null;
  elementTypes: ElementType[] = [];
  
  // Enumeraciones para usar en la plantilla
  ElementType = ElementType;
  ElementStatus = ElementStatus;
  
  // Getter para plantilla
  get currentStep(): number {
    return this.currentStep$.value;
  }
  
  // Eventos para comunicación con el componente padre
  @Output() saveCompleted = new EventEmitter<NetworkElement>();
  @Output() cancelEditing = new EventEmitter<void>();
  
  // Control de teclas para atajos
  @HostListener('document:keydown.escape', ['$event'])
  handleEscapeKey(event: KeyboardEvent): void {
    // Solo manejar si hay cambios sin guardar
    if (this.networkStateService.getIsDirty()) {
      // Mostrar diálogo de confirmación
      this.confirmDiscardChanges();
    }
  }
  
  @HostListener('document:keydown.control.s', ['$event'])
  handleSaveShortcut(event: KeyboardEvent): void {
    event.preventDefault();
    if (this.elementForm.valid) {
      this.saveElement();
    } else {
      this.markFormGroupTouched(this.elementForm);
      this.errorHandlingService.handleError(
        'ElementEditor', 
        new Error('Por favor, completa todos los campos requeridos antes de guardar')
      );
    }
  }
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private formBuilder: FormBuilder,
    private elementEditorService: ElementEditorService,
    private mapService: MapService,
    private networkStateService: NetworkStateService,
    private errorHandlingService: ErrorHandlingService,
    private dialog: MatDialog,
    private helpDialogService: HelpDialogService,
    snackBar: MatSnackBar,
    cdr: ChangeDetectorRef
  ) {
    super(snackBar, cdr);
  }
  
  /**
   * Inicializa el formulario base
   */
  protected override initializeForm(): void {
    this.elementForm = this.elementEditorService.createBaseElementForm();
  }
  
  /**
   * Inicializa el estado del componente
   */
  protected override initializeState(): void {
    // Obtener tipos de elementos disponibles
    // Filtrar tipos obsoletos (como FDP que ha sido sustituido por ODF)
    this.elementTypes = this.elementEditorService.getElementTypes()
      .filter(type => type !== ElementType.FDP); // Filtrar FDP obsoleto
    
    // Checkear si estamos en modo edición
    this.route.paramMap.pipe(
      takeUntil(this.destroy$)
    ).subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.isEditMode = true;
        this.elementId = id;
        this.loadElement(id);
      }
    });
    
    // Notificar al estado compartido que estamos en modo editor
    this.networkStateService.setCurrentViewMode('editor');
  }
  
  /**
   * Configura las suscripciones a observables
   */
  protected override subscribeToChanges(): void {
    // Suscribirse a cambios en el estado de carga y error
    this.elementEditorService.getLoadingState()
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => {
        this.setLoading(loading);
      });
      
    this.elementEditorService.getErrorState()
      .pipe(takeUntil(this.destroy$))
      .subscribe(error => {
        if (error) {
          this.errorHandlingService.handleError('ElementEditor', new Error(error));
        }
        this.error$.next(error);
        this.cdr?.markForCheck();
      });
    
    // Suscribirse a cambios de posición desde el mapa
    this.subscribeToMapPositionChanges();
    
    // Suscribirse a cambios en el formulario
    this.watchFormChanges();
    
    // Activar modo de selección de posición en el mapa cuando estemos en el paso 3
    this.currentStep$.pipe(
      takeUntil(this.destroy$),
      distinctUntilChanged()
    ).subscribe(step => {
      this.handleStepChange(step);
    });
  }
  
  override ngOnDestroy(): void {
    // Restaurar el estado del mapa
    this.mapService.disablePositionSelection();
    this.networkStateService.setCurrentViewMode('map');
    this.networkStateService.setIsDirty(false);
    
    // Notificar fin de edición
    this.networkStateService.setEditingElement(null);
    
    // Limpiar previsualización
    this.mapService.clearPreview();
    this.networkStateService.clearElementPreview();
    
    // Limpiar suscripciones (llamada a la clase base)
    super.ngOnDestroy();
    
    // Limpiar estados específicos
    this.currentStep$.complete();
  }
  
  /**
   * Carga un elemento existente para edición
   */
  private loadElement(elementId: string): void {
    this.setLoading(true);
    
    this.elementEditorService.loadElement(elementId).pipe(
      takeUntil(this.destroy$),
      finalize(() => {
        this.setLoading(false);
      })
    ).subscribe({
      next: (element) => {
        if (!element) {
          this.showErrorMessage('Elemento no encontrado');
          this.router.navigate(['../'], { relativeTo: this.route });
          return;
        }
        
        // Migración automática: Convertir FDP a ODF si es necesario
        if (element.type === ElementType.FDP) {
          element.type = ElementType.ODF; // Cambiar tipo a ODF
          
          // Migrar propiedades específicas si existen
          if ('fdpType' in element) {
            (element as any).odfType = (element as any).fdpType;
            // Consideramos el resto de propiedades compatibles entre FDP y ODF
          }
        }
        
        this.elementEditorService.patchElementForm(this.elementForm, element);
        this.cdr?.markForCheck();
      },
      error: (error) => {
        console.error('Error al cargar elemento', error);
        this.showErrorMessage('Error al cargar el elemento');
      }
    });
  }
  
  /**
   * Maneja la selección de tipo de elemento
   */
  onElementTypeSelected(type: ElementType): void {
    // Actualizar propiedades específicas según el tipo
    this.elementEditorService.updateFormForElementType(this.elementForm, type);
    
    // Actualizar visualización previa
    this.previewCurrentElement();
  }
  
  /**
   * Maneja el cambio de paso en el stepper
   */
  onStepChange(stepIndex: number): void {
    this.currentStep$.next(stepIndex);
  }
  
  /**
   * Maneja lógica específica al cambiar de paso
   */
  private handleStepChange(step: number): void {
    // Lógica específica para cada paso
    if (step === 2) { // Paso de ubicación
      // Activar selección en mapa cuando llegamos a ese paso
      this.mapService.enablePositionSelection();
      
      // Obtener coordenadas actuales si existen
      const position = this.elementForm.get('position.coordinates')?.value;
      if (position && position.lat !== undefined && position.lng !== undefined) {
        // Centrar el mapa en la posición actual
        this.mapService.centerOnCoordinates({ x: position.lng, y: position.lat });
      }
    } else {
      // Desactivar selección en mapa para otros pasos
      this.mapService.disablePositionSelection();
    }
    
    // Previsualizar el elemento en cada paso
    this.previewCurrentElement();
  }
  
  /**
   * Previsualiza el elemento actual en el mapa
   */
  private previewCurrentElement(): void {
    if (this.elementForm.valid && this.elementForm.get('position.coordinates')?.valid) {
      const previewElement = this.elementEditorService.createElementFromForm(
        this.elementForm, 
        this.isEditMode ? this.elementId || undefined : undefined
      );
      
      // Usar el servicio compartido para actualizar la vista previa
      this.networkStateService.updateElementPreview(previewElement, 'preview');
      
      // También actualizar el mapa directamente
      this.mapService.previewElement(previewElement);
    } else {
      // Limpiar previsualización si el formulario no es válido
      this.mapService.clearPreview();
      this.networkStateService.clearElementPreview();
    }
  }
  
  /**
   * Se suscribe a cambios de posición desde el servicio de mapa
   */
  private subscribeToMapPositionChanges(): void {
    this.mapService.getSelectedPosition()
      .pipe(
        takeUntil(this.destroy$),
        filter(position => !!position)
      )
      .subscribe(position => {
        if (position && position.lat !== undefined && position.lng !== undefined) {
          // Actualizar el formulario con la nueva posición
          const positionGroup = this.elementForm.get('position');
          if (positionGroup) {
            positionGroup.patchValue({
              coordinates: position
            });
            this.cdr?.markForCheck();
          }
          
          // Previsualizar el elemento en la nueva posición
          this.previewCurrentElement();
        }
      });
  }
  
  /**
   * Monitorea cambios en el formulario para actualizar el estado
   */
  private watchFormChanges(): void {
    // Vigilar cambios en el tipo
    this.elementForm.get('type')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((type: ElementType) => {
        if (type) {
          // Actualizar validadores según el tipo seleccionado
          this.elementEditorService.updateFormForElementType(this.elementForm, type);
        }
      });
    
    // Vigilar cambios en todo el formulario para marcar como sucio
    this.elementForm.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        // Evitar múltiples emisiones en un corto período
        debounceTime(300)
      )
      .subscribe(() => {
        // Notificar cambios sin guardar
        this.networkStateService.setIsDirty(this.elementForm.dirty);
        
        // Actualizar previsualización con los datos actuales
        this.previewCurrentElement();
      });
  }
  
  /**
   * Guarda el elemento
   */
  saveElement(): void {
    if (this.elementForm.invalid) {
      this.markFormGroupTouched(this.elementForm);
      this.errorHandlingService.handleError(
        'ElementEditor', 
        new Error('Por favor, complete todos los campos obligatorios')
      );
      return;
    }
    
    // Mostrar loader
    this.setLoading(true);
    
    // Crear objeto elemento desde formulario
    const element = this.elementEditorService.createElementFromForm(
      this.elementForm, 
      this.isEditMode ? this.elementId || undefined : undefined
    );
    
    // Actualizar el estado con el elemento que se está guardando
    this.networkStateService.updateElementPreview(element, 'update');
    
    // Guardar elemento
    this.elementEditorService.saveElement(element, !this.isEditMode)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.setLoading(false);
        })
      )
      .subscribe({
        next: (savedElement) => {
          // Mostrar mensaje de éxito
          this.showSuccessMessage(
            this.isEditMode
              ? `El elemento "${savedElement.name}" ha sido actualizado correctamente`
              : `El elemento "${savedElement.name}" ha sido creado correctamente`
          );
          
          // Resetear estado de "sucio"
          this.networkStateService.setIsDirty(false);
          
          // Notificar al padre a través del EventEmitter
          this.saveCompleted.emit(savedElement);
          
          // Si estamos en una ruta de edición, redirigir al mapa
          if (this.route.snapshot.paramMap.has('id')) {
            this.router.navigate(['/network-design']);
          } else {
            // Resetear el formulario para crear un nuevo elemento
            this.elementForm.reset({
              status: ElementStatus.ACTIVE,
              position: { type: 'Point', coordinates: [] }
            });
            
            // Volver al primer paso
            this.currentStep$.next(0);
            this.cdr?.markForCheck();
          }
        },
        error: (error) => {
          console.error('Error al guardar elemento', error);
          this.showErrorMessage(`Error al ${this.isEditMode ? 'actualizar' : 'crear'} el elemento: ${error.message}`);
        }
      });
  }
  
  /**
   * Cancela la edición actual
   */
  cancel(): void {
    // Verificar si hay cambios sin guardar
    if (this.elementForm.dirty || this.networkStateService.getIsDirty()) {
      this.confirmDiscardChanges();
    } else {
      // Si no hay cambios, simplemente cancelar
      this.performCancel();
    }
  }
  
  /**
   * Realiza la cancelación después de confirmación
   */
  private performCancel(): void {
    // Limpiar estados
    this.networkStateService.setIsDirty(false);
    this.mapService.clearPreview();
    this.networkStateService.clearElementPreview();
    
    // Notificar a través del EventEmitter
    this.cancelEditing.emit();
    
    // Si estamos en una ruta de edición, redirigir al mapa
    if (this.route.snapshot.paramMap.has('id')) {
      this.router.navigate(['/network-design']);
    }
  }
  
  /**
   * Muestra un diálogo de confirmación para descartar cambios
   */
  private confirmDiscardChanges(): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Descartar cambios',
        message: '¿Está seguro que desea descartar los cambios sin guardar?',
        confirmText: 'Descartar',
        cancelText: 'Continuar editando',
        confirmButtonColor: 'warn'
      }
    });
    
    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        if (result === true) {
          this.performCancel();
        }
      });
  }
  
  /**
   * Muestra el diálogo de ayuda
   */
  showHelp(): void {
    this.helpDialogService.openHelpDialog(ElementType.ODF, true);
  }
}
