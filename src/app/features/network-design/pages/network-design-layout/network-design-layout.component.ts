import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, RouterOutlet, ActivatedRoute, NavigationEnd } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { trigger, transition, style, animate, query, group } from '@angular/animations';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';

import { ElementQuickViewComponent } from '../../components/element-quick-view/element-quick-view.component';
import { NetworkStateService } from '../../services/network-state.service';
import { LoggerService } from '../../../../core/services/logger.service';
import { ElementType, NetworkElement } from '../../../../shared/types/network.types';

@Component({
  selector: 'app-network-design-layout',
  templateUrl: './network-design-layout.component.html',
  styleUrls: ['./network-design-layout.component.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    ElementQuickViewComponent
  ],
  animations: [
    trigger('routeAnimations', [
      // Transición específica para el mapa
      transition('map <=> editor', [
        style({ position: 'relative' }),
        query(':enter, :leave', [
          style({
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
          })
        ], { optional: true }),
        query(':enter', [style({ opacity: 0 })], { optional: true }),
        group([
          query(':leave', [animate('200ms ease-out', style({ opacity: 0 }))], { optional: true }),
          query(':enter', [animate('200ms ease-in', style({ opacity: 1 }))], { optional: true })
        ])
      ]),
      // Transición para el resto de páginas
      transition('* <=> *', [
        style({ position: 'relative' }),
        query(':enter, :leave', [
          style({
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
          })
        ], { optional: true }),
        query(':enter', [style({ opacity: 0 })], { optional: true }),
        group([
          query(':leave', [animate('200ms ease-out', style({ opacity: 0 }))], { optional: true }),
          query(':enter', [animate('300ms ease-in', style({ opacity: 1 }))], { optional: true })
        ])
      ])
    ])
  ]
})
export class NetworkDesignLayoutComponent implements OnInit, OnDestroy {
  @ViewChild(RouterOutlet) routerOutlet!: RouterOutlet;
  
  // Tipos de elementos que pueden ser creados
  elementTypes = [
    { id: 'fdp', name: 'Punto de Distribución (FDP)' },
    { id: 'olt', name: 'Terminal de Línea Óptica (OLT)' },
    { id: 'ont', name: 'Terminal de Red Óptica (ONT)' },
    { id: 'edfa', name: 'Amplificador Óptico (EDFA)' },
    { id: 'splitter', name: 'Divisor Óptico (Splitter)' },
    { id: 'manga', name: 'Caja de Empalme (Manga)' },
    { id: 'fiber_connection', name: 'Conexión de Fibra' }
  ];
  
  // Variables para la gestión de la interfaz
  animationState = 'map';
  isLoading = false;
  mapVisible = true;
  selectedElement: NetworkElement | null = null;
  showSearchWidget = true;
  showElementsPanel = true;
  
  // Subject para gestionar desuscripciones
  private destroy$ = new Subject<void>();
  
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private networkStateService: NetworkStateService,
    private logger: LoggerService
  ) {}
  
  ngOnInit(): void {
    this.setupRouteListener();
    this.subscribeToStateChanges();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  /**
   * Escucha cambios en la ruta para actualizar el estado de animación
   */
  private setupRouteListener(): void {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      const currentRoute = this.route.firstChild;
      if (currentRoute) {
        this.animationState = currentRoute.snapshot.data['animation'] || 'map';
        this.logger.debug(`Estado de animación actualizado: ${this.animationState}`);
      }
    });
  }
  
  /**
   * Se suscribe a los cambios de estado compartido
   */
  private subscribeToStateChanges(): void {
    // Suscribirse a cambios en el elemento seleccionado
    this.networkStateService.getEditingElement()
      .pipe(takeUntil(this.destroy$))
      .subscribe(element => {
        this.selectedElement = element;
        if (element) {
          this.logger.debug(`Elemento seleccionado: ${element.name} (${element.id})`);
        }
      });
    
    // Suscribirse a cambios en la visibilidad del mapa
    this.networkStateService.getMapVisibility()
      .pipe(takeUntil(this.destroy$))
      .subscribe(visible => {
        this.mapVisible = visible;
        this.logger.debug(`Visibilidad del mapa: ${visible ? 'visible' : 'oculto'}`);
      });
    
    // Actualizar el estado de visibilidad en el servicio
    this.networkStateService.setShowSearchWidget(this.showSearchWidget);
    this.networkStateService.setShowElementsPanel(this.showElementsPanel);
  }
  
  /**
   * Determina el estado de la animación de ruta
   */
  prepareRoute(outlet: RouterOutlet): string {
    return outlet && outlet.activatedRouteData && outlet.activatedRouteData['animation']
      ? outlet.activatedRouteData['animation']
      : 'map';
  }
  
  /**
   * Alterna la visibilidad del widget de búsqueda
   */
  toggleSearchWidget(): void {
    this.showSearchWidget = !this.showSearchWidget;
    this.networkStateService.setShowSearchWidget(this.showSearchWidget);
  }
  
  /**
   * Alterna la visibilidad del panel de elementos
   */
  toggleElementsPanel(): void {
    this.showElementsPanel = !this.showElementsPanel;
    this.networkStateService.setShowElementsPanel(this.showElementsPanel);
  }
} 