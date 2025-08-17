import { Component, OnDestroy, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { Subject, BehaviorSubject } from 'rxjs';

/**
 * Componente base abstracto para vistas y páginas
 * 
 * Esta clase proporciona funcionalidad común para todos los componentes
 * de visualización, asegurando consistencia en el manejo de estados,
 * ciclo de vida y gestión de recursos.
 */
@Component({
  template: ''
})
export abstract class BaseViewComponent implements OnInit, OnDestroy {
  // Control de ciclo de vida
  protected destroy$ = new Subject<void>();
  
  // Estado común
  protected loading = false;
  protected error$ = new BehaviorSubject<string | null>(null);
  
  protected cdr = inject(ChangeDetectorRef);
  
  // Getters para plantilla
  get error(): string | null {
    return this.error$.value;
  }
  
  constructor() {}
  
  ngOnInit(): void {
    this.initializeState();
    this.subscribeToChanges();
  }
  
  ngOnDestroy(): void {
    this.cleanupResources();
    this.destroy$.next();
    this.destroy$.complete();
    this.error$.complete();
  }
  
  /**
   * Método protegido para separar la lógica de limpieza
   * Las clases hijas deberían sobrescribir este método en lugar
   * de ngOnDestroy para evitar problemas con las llamadas a super
   */
  protected cleanupResources(): void {
    // Limpiar suscripciones para evitar memory leaks
    this.destroy$.next();
    this.destroy$.complete();
    this.error$.complete();
  }
  
  /**
   * Inicializa el estado - a implementar por las clases hijas
   */
  protected abstract initializeState(): void;
  
  /**
   * Configura suscripciones a observables - a implementar por las clases hijas
   */
  protected abstract subscribeToChanges(): void;
  
  /**
   * Establece el estado de carga
   */
  protected setLoading(isLoading: boolean): void {
    this.loading = isLoading;
    this.cdr.markForCheck();
  }
} 
