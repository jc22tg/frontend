import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule, Router, Route } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Subscription } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';

// Importar widgets compartidos
import { 
  NetworkHealthWidgetComponent,
  MetricsWidgetComponent,
  SystemAlertsWidgetComponent,
  MiniMapWidgetComponent
} from '../../shared/components/widgets';
import { DashboardFacade } from './facades/dashboard.facade';
import { NetworkWidgetComponent } from '../../features/network-design/network-widget/network-widget.component';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatGridListModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatToolbarModule,
    MatDividerModule,
    MatButtonToggleModule,
    MatTooltipModule,
    RouterModule,
    // Importamos los componentes de widgets compartidos
    NetworkHealthWidgetComponent,
    MetricsWidgetComponent,
    SystemAlertsWidgetComponent,
    MiniMapWidgetComponent,
    NetworkWidgetComponent
  ],
  templateUrl: './dashboard-layout.component.html',
  styleUrls: ['./dashboard-layout.component.scss']
})
export class DashboardLayoutComponent implements OnInit, OnDestroy {
  private subscriptions = new Subscription();
  isCompactView = false;
  isCustomizationEnabled = false;
  selectedPeriod = 'day';
  hiddenSections: string[] = [];
  isNavigating = false;
  
  constructor(
    private breakpointObserver: BreakpointObserver,
    private dashboardFacade: DashboardFacade,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}
  
  get loading$() {
    return this.dashboardFacade.loading$;
  }
  
  ngOnInit(): void {
    this.subscriptions.add(
      this.breakpointObserver.observe([Breakpoints.Handset, Breakpoints.Small])
        .subscribe(result => {
          this.isCompactView = result.matches;
        })
    );

    // Inicializar carga de datos
    this.dashboardFacade.loadDashboardData();
    
    // Precarga la ruta de network-design para asegurar que esté disponible
    this.preconfigureNetworkDesignRoute();
  }
  
  /**
   * Preconfigurar la ruta de network-design para mejorar el rendimiento
   */
  private preconfigureNetworkDesignRoute(): void {
    let networkDesignRoute: Route | undefined;
    
    // Buscar la ruta de network-design
    this.router.config.forEach(route => {
      if (route.path === '' && route.children) {
        networkDesignRoute = route.children.find(r => r.path === 'network-design');
        if (networkDesignRoute) {
          console.log('Encontrada ruta network-design para precarga');
          
          // Asegurar que tiene datos y preload=true
          if (!networkDesignRoute.data) {
            networkDesignRoute.data = {};
          }
          networkDesignRoute.data = { 
            ...networkDesignRoute.data, 
            preload: true,
            priority: 'high'
          };
          
          // Verificar que la ruta tenga loadChildren y no component para precargar correctamente
          if (!networkDesignRoute.loadChildren && !networkDesignRoute.component) {
            console.warn('La ruta network-design no tiene loadChildren o component configurado correctamente');
          }
        }
      }
    });
    
    if (!networkDesignRoute) {
      console.warn('No se encontró la ruta network-design para precargar');
    }
  }
  
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
  
  refreshDashboard(): void {
    this.dashboardFacade.refreshAll();
  }
  
  refreshSection(section: string): void {
    this.dashboardFacade.refreshSection(section);
  }
  
  toggleSection(section: string): void {
    const index = this.hiddenSections.indexOf(section);
    if (index === -1) {
      this.hiddenSections.push(section);
    } else {
      this.hiddenSections.splice(index, 1);
    }
  }
  
  changePeriod(period: string): void {
    this.selectedPeriod = period;
    this.dashboardFacade.setPeriod(period);
  }
  
  toggleCustomization(): void {
    this.isCustomizationEnabled = !this.isCustomizationEnabled;
  }
  
  exportDashboard(format: 'pdf' | 'excel'): void {
    this.dashboardFacade.exportDashboard(format);
  }
  
  navegarAMapaCompleto(): void {
    if (this.isNavigating) {
      return; // Evitar múltiples navegaciones
    }
    
    // Marcar como navegando para evitar múltiples clicks
    this.isNavigating = true;
    
    // SOLUCIÓN RADICAL: Crear un iframe invisible que cargue primero el módulo
    // Esto evita que el hilo principal se congele durante la carga
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '10px';
    iframe.style.height = '10px';
    iframe.style.opacity = '0.01';
    iframe.style.zIndex = '-1000';
    iframe.style.pointerEvents = 'none';
    
    // Mostrar indicador de carga
    const navegacionSnack = this.snackBar.open('Preparando mapa de red...', '', {
      duration: 0,
      panelClass: ['info-snackbar']
    });
    
    // Agregar el iframe al DOM
    document.body.appendChild(iframe);
    
    // Timer de seguridad (máximo 6 segundos)
    const seguridadTimer = setTimeout(() => {
      console.log('Timer de seguridad activado, usando navegación directa');
      // Eliminar el iframe
      try { document.body.removeChild(iframe); } catch (e) {}
      
      // Navegación directa como fallback
      this.router.navigate(['/network-design/map']).then(
        () => this.completarNavegacion(navegacionSnack),
        () => {
          navegacionSnack.dismiss();
          this.snackBar.open('No se pudo cargar el mapa, intentando nuevamente en modo básico...', '', { 
            duration: 3000,
            panelClass: ['warning-snackbar']
          });
          
          // Último intento con enfoque minimalista
          this.router.navigate(['/network-design'], { 
            queryParams: { mode: 'minimal' } 
          }).catch(() => this.isNavigating = false);
        }
      );
    }, 6000);
    
    // Escuchar mensajes del iframe (no implementado aún, pero podría usarse para coordinación)
    const messageHandler = (event: MessageEvent) => {
      if (event.data === 'map-assets-loaded') {
        clearTimeout(seguridadTimer);
        window.removeEventListener('message', messageHandler);
        // Continuar con la navegación real
        this.procederAMapaReal(iframe, navegacionSnack);
      }
    };
    window.addEventListener('message', messageHandler);
    
    // Iniciar la carga "ligera" del módulo a través del iframe
    // Usamos una URL que no interfiera con la navegación principal
    try {
      if (iframe.contentWindow) {
        // Primero intentamos navegar dentro del iframe a una página simple
        iframe.contentWindow.location.href = '/assets/loading-map.html';
        
        // Después de un breve período, intentamos precargar el módulo real
        setTimeout(() => {
          try {
            // Esta URL debería devolver una página pequeña o un recurso liviano 
            // relacionado con el módulo network-design
            if (iframe.contentWindow) {
              iframe.contentWindow.location.href = '/network-design?preload=true';
            }
          } catch (e) {
            console.error('Error en precarga iframe:', e);
          }
          
          // Después de un breve retraso, procedemos con la navegación real
          // independientemente de si el iframe tuvo éxito o no
          setTimeout(() => {
            this.procederAMapaReal(iframe, navegacionSnack);
          }, 1500);
        }, 1000);
      }
    } catch (e) {
      console.error('Error configurando iframe:', e);
      
      // Si falla el enfoque del iframe, usar navegación directa
      clearTimeout(seguridadTimer);
      document.body.removeChild(iframe);
      this.router.navigate(['/network-design/map']).catch(() => this.isNavigating = false);
    }
  }
  
  /**
   * Procede a la navegación real después de la precarga
   */
  private procederAMapaReal(iframe: HTMLIFrameElement, snackBar: any): void {
    // Mostrar mensaje de progreso
    snackBar.dismiss();
    const loadingSnack = this.snackBar.open('Cargando mapa...', '', {
      duration: 0,
      panelClass: ['info-snackbar']
    });
    
    // Eliminar el iframe de precarga
    try { document.body.removeChild(iframe); } catch (e) {}
    
    // Usar navigationExtras para indicar que venimos de una precarga
    // Esto podría ser detectado en el componente de destino para optimizar la carga
    this.router.navigate(['/network-design/map'], {
      queryParams: { preloaded: 'true' }
    }).then(
      () => {
        loadingSnack.dismiss();
        this.isNavigating = false;
        
        // Mostrar mensaje de éxito breve
        this.snackBar.open('Mapa cargado correctamente', '', {
          duration: 1500,
          panelClass: ['success-snackbar']
        });
      },
      (error) => {
        console.error('Error en navegación final:', error);
        loadingSnack.dismiss();
        this.isNavigating = false;
        
        // Último intento con modo básico
        this.snackBar.open('Error al cargar el mapa completo. Cargando versión básica...', '', {
          duration: 3000,
          panelClass: ['warning-snackbar']
        });
        
        // Navegar a una versión "básica" que no cause problemas
        this.router.navigate(['/network-design'], {
          queryParams: { mode: 'minimal' }
        });
      }
    );
  }
  
  /**
   * Completa el proceso de navegación
   */
  private completarNavegacion(snackBar: any): void {
    console.log('Navegación completada');
    
    // Cerrar snackbar de carga
    if (snackBar) {
      snackBar.dismiss();
    }
    
    // Restablecer el estado
    setTimeout(() => {
      this.isNavigating = false;
    }, 1000); // Evitar múltiples navegaciones en 1 segundo
  }
} 