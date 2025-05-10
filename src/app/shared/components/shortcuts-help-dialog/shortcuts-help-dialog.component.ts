import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { KeyboardShortcutsService, ShortcutConfig } from '../../services/keyboard-shortcuts.service';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';

// Interfaz para grupos de atajos
interface ShortcutGroup {
  name: string;
  shortcuts: ShortcutConfig[];
}

@Component({
  selector: 'app-shortcuts-help-dialog',
  templateUrl: './shortcuts-help-dialog.component.html',
  styleUrls: ['./shortcuts-help-dialog.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    MatExpansionModule,
    MatChipsModule,
    MatTooltipModule
  ]
})
export class ShortcutsHelpDialogComponent implements OnInit {
  shortcutGroups: ShortcutGroup[] = [];
  activeContexts: string[] = [];
  showAllShortcuts = false;

  constructor(
    private dialogRef: MatDialogRef<ShortcutsHelpDialogComponent>,
    private keyboardShortcutsService: KeyboardShortcutsService
  ) { }

  ngOnInit(): void {
    this.activeContexts = this.keyboardShortcutsService.getActiveContexts();
    this.loadShortcuts();
  }

  /**
   * Carga todos los atajos registrados y los agrupa por categoría
   */
  loadShortcuts(): void {
    const shortcuts = this.showAllShortcuts 
      ? this.keyboardShortcutsService.getAllShortcuts()
      : this.keyboardShortcutsService.getActiveShortcuts();
    
    const groupMap = new Map<string, ShortcutConfig[]>();
    
    // Agrupar los atajos por categoría
    shortcuts.forEach(shortcut => {
      if (!groupMap.has(shortcut.group)) {
        groupMap.set(shortcut.group, []);
      }
      groupMap.get(shortcut.group)?.push(shortcut);
    });
    
    // Convertir el mapa en un array de grupos
    this.shortcutGroups = Array.from(groupMap.entries())
      .map(([name, shortcuts]) => ({ name, shortcuts }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Formatea la combinación de teclas para mostrarla
   */
  formatKeyCombo(shortcut: ShortcutConfig): string {
    const modifiers = shortcut.modifiers || {};
    const parts: string[] = [];
    
    // Agregar modificadores en orden
    if (modifiers.ctrl) parts.push('Ctrl');
    if (modifiers.alt) parts.push('Alt');
    if (modifiers.shift) parts.push('Shift');
    if (modifiers.meta) parts.push('Meta');
    
    // Agregar la tecla principal con formato adecuado
    const key = this.formatKey(shortcut.key);
    parts.push(key);
    
    return parts.join(' + ');
  }
  
  /**
   * Formatea nombres de teclas especiales para mejor legibilidad
   */
  private formatKey(key: string): string {
    const specialKeys: Record<string, string> = {
      'arrowup': '↑',
      'arrowdown': '↓',
      'arrowleft': '←',
      'arrowright': '→',
      'enter': 'Enter',
      'escape': 'Esc',
      'space': 'Espacio',
      'delete': 'Delete',
      'backspace': 'Backspace',
      'tab': 'Tab'
    };
    
    const lowerKey = key.toLowerCase();
    
    return specialKeys[lowerKey] || key.toUpperCase();
  }

  /**
   * Alterna entre mostrar todos los atajos o solo los activos
   */
  toggleShowAllShortcuts(): void {
    this.showAllShortcuts = !this.showAllShortcuts;
    this.loadShortcuts();
  }

  /**
   * Verifica si un atajo pertenece a los contextos activos
   */
  isShortcutActive(shortcut: ShortcutConfig): boolean {
    if (!shortcut.contexts || shortcut.contexts.length === 0) {
      return true;
    }
    return shortcut.contexts.some(ctx => this.activeContexts.includes(ctx));
  }

  /**
   * Obtiene la lista de contextos como texto
   */
  getContextsLabel(shortcut: ShortcutConfig): string {
    if (!shortcut.contexts || shortcut.contexts.length === 0) {
      return 'General';
    }
    return shortcut.contexts.join(', ');
  }

  /**
   * Cierra el diálogo
   */
  close(): void {
    this.dialogRef.close();
  }
} 