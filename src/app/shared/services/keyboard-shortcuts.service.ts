import { Injectable, OnDestroy } from '@angular/core';
import { fromEvent, Subject, Subscription, Observable } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';

// Interfaz para los modificadores de teclas
export interface KeyModifiers {
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  meta?: boolean;
}

// Interfaz para la configuración de un atajo de teclado
export interface ShortcutConfig {
  id: string;           // Identificador único del atajo
  key: string;          // Tecla principal (a, b, enter, etc.)
  modifiers?: KeyModifiers; // Modificadores (ctrl, alt, etc.)
  description: string;  // Descripción de la acción
  group: string;        // Grupo al que pertenece el atajo (navegación, edición, etc.)
  disabled?: boolean;   // Si el atajo está deshabilitado
  contexts?: string[];  // Contextos en los que este atajo está activo
}

@Injectable({
  providedIn: 'root'
})
export class KeyboardShortcutsService implements OnDestroy {
  private shortcuts: ShortcutConfig[] = [];
  private keydownSubscription: Subscription;
  private destroy$ = new Subject<void>();
  private activeContexts = new Set<string>(['global']);
  private shortcutsChanged$ = new Subject<ShortcutConfig[]>();
  
  constructor() {
    this.keydownSubscription = fromEvent<KeyboardEvent>(document, 'keydown')
      .pipe(
        takeUntil(this.destroy$),
        filter(event => !this.isInputElement(event.target as HTMLElement))
      )
      .subscribe(event => this.handleKeyDown(event));
    
    // Registrar atajos predeterminados
    this.registerDefaultShortcuts();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    
    if (this.keydownSubscription) {
      this.keydownSubscription.unsubscribe();
    }
  }
  
  /**
   * Registra un nuevo atajo de teclado
   */
  registerShortcut(config: ShortcutConfig): void {
    // Verificar si ya existe un atajo con el mismo ID
    const existingIndex = this.shortcuts.findIndex(s => s.id === config.id);
    
    if (existingIndex >= 0) {
      // Actualizar el atajo existente
      this.shortcuts[existingIndex] = { ...config };
    } else {
      // Agregar nuevo atajo
      this.shortcuts.push({ ...config });
    }
    
    this.shortcutsChanged$.next(this.shortcuts);
  }
  
  /**
   * Registra múltiples atajos a la vez
   */
  registerShortcuts(configs: ShortcutConfig[]): void {
    configs.forEach(config => this.registerShortcut(config));
  }
  
  /**
   * Elimina un atajo de teclado por su ID
   */
  unregisterShortcut(id: string): void {
    this.shortcuts = this.shortcuts.filter(s => s.id !== id);
    this.shortcutsChanged$.next(this.shortcuts);
  }
  
  /**
   * Habilita o deshabilita un atajo de teclado
   */
  setShortcutEnabled(id: string, enabled: boolean): void {
    const shortcut = this.shortcuts.find(s => s.id === id);
    if (shortcut) {
      shortcut.disabled = !enabled;
      this.shortcutsChanged$.next(this.shortcuts);
    }
  }
  
  /**
   * Retorna todos los atajos registrados
   */
  getAllShortcuts(): ShortcutConfig[] {
    return [...this.shortcuts];
  }
  
  /**
   * Obtener atajos activos según el contexto actual
   */
  getActiveShortcuts(): ShortcutConfig[] {
    return this.shortcuts.filter(shortcut => 
      !shortcut.disabled && this.isShortcutInActiveContext(shortcut)
    );
  }
  
  /**
   * Establecer contextos activos
   */
  setActiveContext(context: string | string[]): void {
    this.activeContexts.clear();
    this.activeContexts.add('global'); // Siempre mantener el contexto global
    
    if (Array.isArray(context)) {
      context.forEach(ctx => this.activeContexts.add(ctx));
    } else {
      this.activeContexts.add(context);
    }
    
    this.shortcutsChanged$.next(this.shortcuts);
  }
  
  /**
   * Añadir un contexto a los activos
   */
  addActiveContext(context: string): void {
    this.activeContexts.add(context);
    this.shortcutsChanged$.next(this.shortcuts);
  }
  
  /**
   * Eliminar un contexto de los activos
   */
  removeActiveContext(context: string): void {
    if (context !== 'global') {
      this.activeContexts.delete(context);
      this.shortcutsChanged$.next(this.shortcuts);
    }
  }
  
  /**
   * Obtener los contextos activos
   */
  getActiveContexts(): string[] {
    return Array.from(this.activeContexts);
  }
  
  /**
   * Observable para escuchar cambios en los atajos
   */
  getShortcutsChanges(): Observable<ShortcutConfig[]> {
    return this.shortcutsChanged$.asObservable();
  }
  
  /**
   * Maneja el evento keydown y ejecuta la acción asociada al atajo
   */
  private handleKeyDown(event: KeyboardEvent): void {
    // Buscar un atajo que coincida con la combinación de teclas
    const matchedShortcut = this.findMatchingShortcut(event);
    
    if (matchedShortcut) {
      // Prevenir el comportamiento predeterminado si se encontró un atajo
      event.preventDefault();
      event.stopPropagation();
      
      // Disparar el evento personalizado
      this.triggerShortcutEvent(matchedShortcut.id);
    }
  }
  
  /**
   * Busca un atajo que coincida con el evento de teclado
   */
  private findMatchingShortcut(event: KeyboardEvent): ShortcutConfig | null {
    const key = event.key.toLowerCase();
    const activeShortcuts = this.shortcuts.filter(shortcut => 
      !shortcut.disabled && this.isShortcutInActiveContext(shortcut)
    );
    
    return activeShortcuts.find(shortcut => {
      // Verificar la tecla principal
      if (shortcut.key.toLowerCase() !== key) return false;
      
      // Verificar modificadores
      const modifiers = shortcut.modifiers || {};
      
      if (modifiers.ctrl !== undefined && modifiers.ctrl !== event.ctrlKey) return false;
      if (modifiers.alt !== undefined && modifiers.alt !== event.altKey) return false;
      if (modifiers.shift !== undefined && modifiers.shift !== event.shiftKey) return false;
      if (modifiers.meta !== undefined && modifiers.meta !== event.metaKey) return false;
      
      return true;
    }) || null;
  }
  
  /**
   * Verifica si el atajo está en un contexto activo
   */
  private isShortcutInActiveContext(shortcut: ShortcutConfig): boolean {
    if (!shortcut.contexts || shortcut.contexts.length === 0) {
      return true; // Si no tiene contextos, está activo siempre
    }
    
    return shortcut.contexts.some(ctx => this.activeContexts.has(ctx));
  }
  
  /**
   * Dispara un evento personalizado para el atajo activado
   */
  private triggerShortcutEvent(id: string): void {
    const event = new CustomEvent('app-shortcut', {
      detail: { id },
      bubbles: true
    });
    
    document.dispatchEvent(event);
  }
  
  /**
   * Verifica si el elemento es un campo de entrada de texto
   */
  private isInputElement(element: HTMLElement | null): boolean {
    if (!element) return false;
    
    const tagName = element.tagName.toLowerCase();
    const isTextField = tagName === 'input' || tagName === 'textarea';
    const isEditable = element.isContentEditable;
    
    // Si es un campo de texto, verificar que no sea de tipo button, checkbox, etc.
    if (isTextField) {
      const inputType = (element as HTMLInputElement).type?.toLowerCase();
      return !['button', 'checkbox', 'radio', 'submit', 'reset'].includes(inputType);
    }
    
    return isEditable;
  }
  
  /**
   * Registra los atajos de teclado predeterminados
   */
  private registerDefaultShortcuts(): void {
    const defaultShortcuts: ShortcutConfig[] = [
      {
        id: 'help',
        key: 'h',
        modifiers: { ctrl: true, shift: true },
        description: 'Mostrar esta ayuda',
        group: 'General',
        contexts: ['global']
      },
      {
        id: 'zoom-in',
        key: '=',
        modifiers: { ctrl: true },
        description: 'Acercar',
        group: 'Visualización',
        contexts: ['map']
      },
      {
        id: 'zoom-out',
        key: '-',
        modifiers: { ctrl: true },
        description: 'Alejar',
        group: 'Visualización',
        contexts: ['map']
      },
      {
        id: 'zoom-reset',
        key: '0',
        modifiers: { ctrl: true },
        description: 'Restablecer zoom',
        group: 'Visualización',
        contexts: ['map']
      },
      {
        id: 'fit-screen',
        key: 'f',
        description: 'Ajustar a la pantalla',
        group: 'Visualización',
        contexts: ['map']
      },
      {
        id: 'pan-mode',
        key: 'p',
        description: 'Modo panorámico',
        group: 'Herramientas',
        contexts: ['map']
      },
      {
        id: 'select-mode',
        key: 's',
        description: 'Modo selección',
        group: 'Herramientas',
        contexts: ['map']
      },
      {
        id: 'save',
        key: 's',
        modifiers: { ctrl: true },
        description: 'Guardar cambios',
        group: 'Edición',
        contexts: ['editor', 'batch-editor']
      },
      {
        id: 'cancel',
        key: 'Escape',
        description: 'Cancelar operación actual',
        group: 'General',
        contexts: ['global']
      },
      {
        id: 'delete',
        key: 'Delete',
        description: 'Eliminar elemento seleccionado',
        group: 'Edición',
        contexts: ['editor', 'map']
      },
      {
        id: 'undo',
        key: 'z',
        modifiers: { ctrl: true },
        description: 'Deshacer',
        group: 'Edición',
        contexts: ['editor', 'map', 'batch-editor']
      },
      {
        id: 'redo',
        key: 'y',
        modifiers: { ctrl: true },
        description: 'Rehacer',
        group: 'Edición',
        contexts: ['editor', 'map', 'batch-editor']
      },
      {
        id: 'refresh',
        key: 'r',
        modifiers: { ctrl: true },
        description: 'Actualizar datos',
        group: 'Datos',
        contexts: ['global']
      }
    ];
    
    // Registrar todos los atajos predeterminados
    this.registerShortcuts(defaultShortcuts);
  }
} 
