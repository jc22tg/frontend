import { Directive, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, BehaviorSubject } from 'rxjs';

/**
 * Componente base abstracto para editores
 * 
 * Esta clase encapsula funcionalidad común para todos los componentes
 * de edición, asegurando una estructura consistente y estandarizando
 * el manejo de estados, formularios y recursos.
 */
@Directive()
export abstract class BaseEditorComponent implements OnInit, OnDestroy {
  // Control de ciclo de vida
  protected readonly destroy$ = new Subject<void>();
  
  // Estado común
  protected readonly loading$ = new BehaviorSubject<boolean>(false);
  protected readonly error$ = new BehaviorSubject<string | null>(null);
  
  // Formulario base
  protected abstract form: FormGroup;
  
  // Getters para plantilla
  get loading(): boolean {
    return this.loading$.value;
  }
  
  get error(): string | null {
    return this.error$.value;
  }
  
  constructor(
    protected snackBar?: MatSnackBar,
    protected cdr?: ChangeDetectorRef
  ) {}
  
  ngOnInit(): void {
    this.initializeForm();
    this.initializeState();
    this.subscribeToChanges();
  }
  
  ngOnDestroy(): void {
    // Limpiar suscripciones para evitar memory leaks
    this.destroy$.next();
    this.destroy$.complete();
    this.loading$.complete();
    this.error$.complete();
  }
  
  /**
   * Inicializa el formulario base - a implementar por las clases hijas
   */
  protected abstract initializeForm(): void;
  
  /**
   * Inicializa el estado - a implementar por las clases hijas
   */
  protected abstract initializeState(): void;
  
  /**
   * Configura suscripciones a observables - a implementar por las clases hijas
   */
  protected abstract subscribeToChanges(): void;
  
  /**
   * Muestra un mensaje de error
   */
  protected showErrorMessage(message: string): void {
    if (this.snackBar) {
      this.snackBar.open(message, 'Cerrar', {
        duration: 5000,
        panelClass: ['error-snackbar'],
        horizontalPosition: 'center',
        verticalPosition: 'bottom'
      });
    }
    
    this.error$.next(message);
    if (this.cdr) this.cdr.markForCheck();
  }
  
  /**
   * Muestra un mensaje de éxito
   */
  protected showSuccessMessage(message: string): void {
    if (this.snackBar) {
      this.snackBar.open(message, 'Cerrar', {
        duration: 3000,
        panelClass: ['success-snackbar'],
        horizontalPosition: 'center',
        verticalPosition: 'bottom'
      });
    }
    
    this.error$.next(null);
    if (this.cdr) this.cdr.markForCheck();
  }
  
  /**
   * Marca todos los controles del formulario como tocados para mostrar errores
   */
  protected markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }
  
  /**
   * Establece el estado de carga
   */
  protected setLoading(isLoading: boolean): void {
    this.loading$.next(isLoading);
    if (this.cdr) this.cdr.markForCheck();
  }
} 
