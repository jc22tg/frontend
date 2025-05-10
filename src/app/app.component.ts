import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { KeyboardShortcutsService } from '@shared/services/keyboard-shortcuts.service';
import { HelpService } from './core/services/help/help.service';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'Network Map';
  private routerSubscription: Subscription | undefined;

  constructor(
    private keyboardService: KeyboardShortcutsService,
    private helpService: HelpService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Suscribirse a cambios de ruta para actualizar contextos de atajos
    this.routerSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.updateKeyboardContexts(event.url);
    });
    
    // Configurar escucha de eventos de atajo
    this.setupShortcutListeners();
  }
  
  ngOnDestroy(): void {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  private updateKeyboardContexts(url: string): void {
    if (url.includes('/network-design/map')) {
      this.keyboardService.setActiveContext('map');
    } else if (url.includes('/network-design/element/') && url.includes('/edit/')) {
      this.keyboardService.setActiveContext('editor');
    } else if (url.includes('/network-design/element/') && url.includes('/batch')) {
      this.keyboardService.setActiveContext('batch-editor');
    } else if (url.includes('/network-design/element/history/')) {
      this.keyboardService.setActiveContext('detail-view');
    } else {
      this.keyboardService.setActiveContext('global');
    }
  }

  private setupShortcutListeners(): void {
    // Registrar escucha de eventos de atajos de teclado para acciones globales
    document.addEventListener('app-shortcut', ((event: CustomEvent) => {
      const shortcutId = event.detail?.id;
      
      switch (shortcutId) {
        case 'help':
          this.helpService.showKeyboardShortcutsHelp();
          break;
          
        case 'refresh':
          window.location.reload();
          break;
      }
    }) as EventListener);
  }
}
