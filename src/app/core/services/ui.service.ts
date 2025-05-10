import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';
import { HelpService } from './help/help.service';

@Injectable({
  providedIn: 'root'
})
export class UiService {
  
  constructor(
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private helpService: HelpService
  ) { }
  
  /**
   * Muestra un mensaje en la barra de notificaciones
   */
  showMessage(message: string, action = 'Cerrar', duration = 5000): void {
    this.snackBar.open(message, action, {
      duration,
      horizontalPosition: 'right',
      verticalPosition: 'bottom'
    });
  }
  
  /**
   * Muestra un diálogo de confirmación con el mensaje proporcionado
   */
  showConfirmDialog(title: string, message: string): Observable<boolean> {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: { title, message },
      width: '400px'
    });
    
    return dialogRef.afterClosed();
  }
  
  /**
   * Muestra el diálogo de ayuda de atajos de teclado
   */
  showShortcutsHelpDialog(): void {
    this.helpService.showKeyboardShortcutsHelp();
  }
} 