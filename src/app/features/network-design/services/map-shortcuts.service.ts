import { Injectable, OnDestroy } from '@angular/core';
import { KeyboardShortcutsService } from '../../../shared/services/keyboard-shortcuts.service';
import { Subject } from 'rxjs';

/**
 * Servicio para manejar los atajos de teclado y acciones específicas del mapa de red
 */
@Injectable({
  providedIn: 'root'
})
export class MapShortcutsService implements OnDestroy {
  // Observables para los eventos de atajos de teclado
  private zoomIn$ = new Subject<void>();
  private zoomOut$ = new Subject<void>();
  private zoomReset$ = new Subject<void>();
  private fitScreen$ = new Subject<void>();
  private panMode$ = new Subject<void>();
  private selectMode$ = new Subject<void>();
  private delete$ = new Subject<void>();
  
  constructor(private keyboardShortcutsService: KeyboardShortcutsService) {
    this.setupShortcutListeners();
  }
  
  ngOnDestroy(): void {
    this.zoomIn$.complete();
    this.zoomOut$.complete();
    this.zoomReset$.complete();
    this.fitScreen$.complete();
    this.panMode$.complete();
    this.selectMode$.complete();
    this.delete$.complete();
  }
  
  /**
   * Configura los listeners para los eventos de atajos de teclado
   */
  private setupShortcutListeners(): void {
    document.addEventListener('app-shortcut', ((event: CustomEvent) => {
      const shortcutId = event.detail?.id;
      
      switch (shortcutId) {
        case 'zoom-in':
          this.zoomIn$.next();
          break;
          
        case 'zoom-out':
          this.zoomOut$.next();
          break;
          
        case 'zoom-reset':
          this.zoomReset$.next();
          break;
          
        case 'fit-screen':
          this.fitScreen$.next();
          break;
          
        case 'pan-mode':
          this.panMode$.next();
          break;
          
        case 'select-mode':
          this.selectMode$.next();
          break;
          
        case 'delete':
          this.delete$.next();
          break;
      }
    }) as EventListener);
  }
  
  /**
   * Observable para el evento de zoom in
   */
  get onZoomIn() {
    return this.zoomIn$.asObservable();
  }
  
  /**
   * Observable para el evento de zoom out
   */
  get onZoomOut() {
    return this.zoomOut$.asObservable();
  }
  
  /**
   * Observable para el evento de restablecer zoom
   */
  get onZoomReset() {
    return this.zoomReset$.asObservable();
  }
  
  /**
   * Observable para el evento de ajustar a la pantalla
   */
  get onFitScreen() {
    return this.fitScreen$.asObservable();
  }
  
  /**
   * Observable para el evento de cambiar a modo panorámico
   */
  get onPanMode() {
    return this.panMode$.asObservable();
  }
  
  /**
   * Observable para el evento de cambiar a modo selección
   */
  get onSelectMode() {
    return this.selectMode$.asObservable();
  }
  
  /**
   * Observable para el evento de eliminar elemento seleccionado
   */
  get onDelete() {
    return this.delete$.asObservable();
  }
} 
