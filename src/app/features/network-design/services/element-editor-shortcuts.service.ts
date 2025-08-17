import { Injectable, OnDestroy } from '@angular/core';
import { KeyboardShortcutsService } from '../../../shared/services/keyboard-shortcuts.service';
import { Subject } from 'rxjs';

/**
 * Servicio para manejar los atajos de teclado específicos para el editor de elementos
 */
@Injectable({
  providedIn: 'root'
})
export class ElementEditorShortcutsService implements OnDestroy {
  // Observables para los eventos de atajos de teclado
  private save$ = new Subject<void>();
  private cancel$ = new Subject<void>();
  private undo$ = new Subject<void>();
  private redo$ = new Subject<void>();
  
  constructor(private keyboardShortcutsService: KeyboardShortcutsService) {
    this.setupShortcutListeners();
  }
  
  ngOnDestroy(): void {
    this.save$.complete();
    this.cancel$.complete();
    this.undo$.complete();
    this.redo$.complete();
  }
  
  /**
   * Configura los listeners para los eventos de atajos de teclado
   */
  private setupShortcutListeners(): void {
    document.addEventListener('app-shortcut', ((event: CustomEvent) => {
      const shortcutId = event.detail?.id;
      
      switch (shortcutId) {
        case 'save':
          this.save$.next();
          break;
          
        case 'cancel':
          this.cancel$.next();
          break;
          
        case 'undo':
          this.undo$.next();
          break;
          
        case 'redo':
          this.redo$.next();
          break;
      }
    }) as EventListener);
  }
  
  /**
   * Observable para el evento de guardar
   */
  get onSave() {
    return this.save$.asObservable();
  }
  
  /**
   * Observable para el evento de cancelar
   */
  get onCancel() {
    return this.cancel$.asObservable();
  }
  
  /**
   * Observable para el evento de deshacer
   */
  get onUndo() {
    return this.undo$.asObservable();
  }
  
  /**
   * Observable para el evento de rehacer
   */
  get onRedo() {
    return this.redo$.asObservable();
  }
} 
