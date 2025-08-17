import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ShortcutsHelpDialogComponent } from '../../../shared/components/shortcuts-help-dialog/shortcuts-help-dialog.component';

@Injectable({
  providedIn: 'root'
})
export class HelpService {

  constructor(private dialog: MatDialog) {
    // Escuchar eventos de atajo de teclado para mostrar ayuda
    document.addEventListener('app-shortcut', ((event: CustomEvent) => {
      if (event.detail && event.detail.id === 'help') {
        this.showKeyboardShortcutsHelp();
      }
    }) as EventListener);
  }

  /**
   * Muestra el diálogo de ayuda con los atajos de teclado
   */
  showKeyboardShortcutsHelp(): void {
    this.dialog.open(ShortcutsHelpDialogComponent, {
      width: '600px',
      maxWidth: '90vw',
      maxHeight: '80vh',
      panelClass: 'shortcuts-dialog-container'
    });
  }
} 
