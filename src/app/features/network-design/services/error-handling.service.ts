import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * Servicio para el manejo centralizado de errores
 * 
 * Proporciona métodos y estado compartido para gestionar errores
 * de manera consistente en toda la aplicación.
 */
@Injectable({
  providedIn: 'root'
})
export class ErrorHandlingService {
  private lastError = new BehaviorSubject<string | null>(null);
  private errorCount = 0;
  
  constructor(private snackBar: MatSnackBar) {}
  
  /**
   * Maneja un error y muestra un mensaje al usuario
   */
  handleError(context: string, error: Error | string, showSnackbar = true): void {
    // Incrementar contador de errores
    this.errorCount++;
    
    // Preparar mensaje de error
    const errorMessage = typeof error === 'string' 
      ? error 
      : error.message || 'Error desconocido';
    
    // Formatear mensaje con contexto
    const formattedMessage = `[${context}] ${errorMessage}`;
    
    // Actualizar el último error
    this.lastError.next(formattedMessage);
    
    // Registrar el error en la consola
    console.error(`Error #${this.errorCount} - ${formattedMessage}`, error);
    
    // Mostrar snackbar si se requiere
    if (showSnackbar) {
      this.showErrorSnackbar(errorMessage);
    }
  }
  
  /**
   * Obtiene el último mensaje de error
   */
  getLastErrorMessage(): string | null {
    return this.lastError.value;
  }
  
  /**
   * Observa cambios en el estado de error
   */
  getErrorState(): Observable<string | null> {
    return this.lastError.asObservable();
  }
  
  /**
   * Limpia el estado de error actual
   */
  clearError(): void {
    this.lastError.next(null);
  }
  
  /**
   * Muestra un snackbar de error
   */
  private showErrorSnackbar(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 5000,
      panelClass: ['error-snackbar'],
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });
  }
  
  /**
   * Muestra un snackbar de éxito
   */
  showSuccessMessage(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      panelClass: ['success-snackbar'],
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });
  }
} 