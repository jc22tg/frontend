import { Directive, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Subject, BehaviorSubject } from 'rxjs';

/**
 * Componente base abstracto para vistas y páginas
 * 
 * Esta clase proporciona funcionalidad común para todos los componentes
 * de visualización, asegurando consistencia en el manejo de estados,
 * ciclo de vida y gestión de recursos.
 */
@Directive()
export abstract class BaseViewComponent implements OnInit, OnDestroy {
  // Control de ciclo de vida
  protected readonly destroy$ = new Subject<void>();
  
  // Estado común
  protected readonly loading$ = new BehaviorSubject<boolean>(false);
  protected readonly error$ = new BehaviorSubject<string | null>(null);
  
  // Getters para plantilla
  get loading(): boolean {
    return this.loading$.value;
  }
  
  get error(): string | null {
    return this.error$.value;
  }
  
  constructor(
    protected cdr?: ChangeDetectorRef
  ) {}
  
  ngOnInit(): void {
    this.initializeState();
    this.subscribeToChanges();
  }
  
  ngOnDestroy(): void {
    // Implementación base segura
    this.cleanupResources();
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
    this.loading$.complete();
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
    this.loading$.next(isLoading);
    if (this.cdr) this.cdr.markForCheck();
  }
} 