import { Injectable } from '@angular/core';
import { CanDeactivate } from '@angular/router';
import { Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { ElementEditorComponent } from '../components/element-editor/element-editor.component';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog/confirm-dialog.component';
import { NetworkStateService } from '../services/network-state.service';

/**
 * Guard que protege la navegación cuando hay cambios sin guardar en formularios
 */
@Injectable({
  providedIn: 'root'
})
export class PendingChangesGuard implements CanDeactivate<ElementEditorComponent> {
  constructor(
    private dialog: MatDialog,
    private networkStateService: NetworkStateService
  ) {}
  
  /**
   * Verifica si se puede desactivar la ruta actual
   * @param component Componente que se está desactivando
   * @returns Observable<boolean> que indica si la navegación puede continuar
   */
  canDeactivate(component: ElementEditorComponent): Observable<boolean> {
    // Si no hay cambios sin guardar, permitir la navegación
    if (!component.elementForm?.dirty) {
      this.networkStateService.setIsDirty(false);
      return of(true);
    }
    
    // Mostrar diálogo de confirmación
    return this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: { 
        title: 'Cambios sin guardar',
        message: '¿Estás seguro de que deseas salir? Los cambios no guardados se perderán.',
        confirmText: 'Salir sin guardar',
        cancelText: 'Continuar editando',
        confirmButtonColor: 'warn'
      }
    }).afterClosed().pipe(
      switchMap(result => {
        // Actualizar estado de cambios pendientes
        this.networkStateService.setIsDirty(!result);
        return of(!!result);
      })
    );
  }
} 