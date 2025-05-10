import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { HelpDialogComponent } from '../components/help-dialog/help-dialog.component';
import { ElementType } from '../../../shared/types/network.types';

@Injectable({
  providedIn: 'root'
})
export class HelpDialogService {
  constructor(private dialog: MatDialog) {}

  /**
   * Abre el diálogo de ayuda con información contextual según el tipo de elemento
   * @param elementType Tipo de elemento para mostrar ayuda específica
   * @param isNewElement Indica si se está creando un nuevo elemento (true) o editando uno existente (false)
   */
  openHelpDialog(elementType: ElementType, isNewElement = true) {
    return this.dialog.open(HelpDialogComponent, {
      width: '650px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: {
        elementType,
        isNewElement
      },
      panelClass: 'help-dialog'
    });
  }

  /**
   * Abre un diálogo de ayuda general sobre el diseño de red
   */
  openGeneralHelp() {
    return this.dialog.open(HelpDialogComponent, {
      width: '650px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: {
        elementType: null,
        isNewElement: false
      },
      panelClass: 'help-dialog'
    });
  }
} 