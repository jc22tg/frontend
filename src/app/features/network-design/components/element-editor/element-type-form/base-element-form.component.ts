import { Directive, Input, OnInit, OnDestroy } from '@angular/core';
import { FormGroup } from '@angular/forms';

/**
 * Componente base abstracto para los formularios de tipos específicos de elementos
 * 
 * Esta clase proporciona funcionalidad común para todos los formularios
 * de tipos de elementos, asegurando una estructura consistente y
 * estandarizando el acceso a los grupos de formularios.
 * 
 * Diseñado para funcionar con componentes standalone.
 */
@Directive()
export abstract class BaseElementFormComponent implements OnInit, OnDestroy {
  @Input() parentForm!: FormGroup;
  
  /**
   * Getter para acceder al grupo de propiedades específicas
   */
  get propertiesGroup(): FormGroup | null {
    return this.parentForm?.get('properties') as FormGroup;
  }
  
  /**
   * Inicializa los grupos de formulario internos
   */
  ngOnInit(): void {
    this.initializeFormGroups();
  }
  
  /**
   * Limpia recursos cuando el componente se destruye
   * Las clases hijas pueden sobrescribir este método
   * 
   * NOTA: Esta implementación ahora es segura para ser llamada
   * desde las clases hijas. Si necesitas extender este método,
   * asegúrate de usar override y llamar a super.ngOnDestroy().
   */
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
    // Implementación base vacía - las clases hijas pueden sobrescribir
  }
  
  /**
   * Método para inicializar subgrupos dentro del formulario
   * Las clases hijas pueden sobrescribir este método si necesitan
   * inicialización específica
   */
  protected initializeFormGroups(): void {
    // Implementación base vacía
  }
  
  /**
   * Comprueba si un campo tiene un error específico
   */
  hasError(controlPath: string, errorType: string): boolean {
    const control = this.propertiesGroup?.get(controlPath);
    return control?.hasError(errorType) && (control?.touched || control?.dirty) || false;
  }
  
  /**
   * Accede a un subgrupo de propiedades específicas
   */
  getSubgroup(subgroupName: string): FormGroup | null {
    return this.propertiesGroup?.get(subgroupName) as FormGroup;
  }
} 