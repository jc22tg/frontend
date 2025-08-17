import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';

interface Breadcrumb {
  label: string;
  url: string;
  icon?: string;
}

@Component({
  selector: 'app-breadcrumbs',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule
  ],
  template: `
    <nav class="breadcrumbs" aria-label="migas de pan">
      <ol class="breadcrumb-list">
        <li class="breadcrumb-item">
          <a [routerLink]="['/']" class="breadcrumb-link home">
            <mat-icon>home</mat-icon>
            <span class="sr-only">Inicio</span>
          </a>
        </li>
        <li *ngFor="let breadcrumb of breadcrumbs; let last = last" class="breadcrumb-item">
          <span class="separator" aria-hidden="true">/</span>
          <a 
            *ngIf="!last" 
            [routerLink]="[breadcrumb.url]" 
            class="breadcrumb-link"
          >
            <mat-icon *ngIf="breadcrumb.icon">{{breadcrumb.icon}}</mat-icon>
            {{breadcrumb.label}}
          </a>
          <span *ngIf="last" class="current-page" aria-current="page">
            <mat-icon *ngIf="breadcrumb.icon">{{breadcrumb.icon}}</mat-icon>
            {{breadcrumb.label}}
          </span>
        </li>
      </ol>
    </nav>
  `,
  styles: [`
    .breadcrumbs {
      padding: 8px 16px;
      background-color: #f5f5f5;
      border-radius: 4px;
      margin-bottom: 16px;
    }
    
    .breadcrumb-list {
      display: flex;
      flex-wrap: wrap;
      list-style: none;
      padding: 0;
      margin: 0;
      align-items: center;
    }
    
    .breadcrumb-item {
      display: flex;
      align-items: center;
    }
    
    .separator {
      margin: 0 8px;
      color: #757575;
    }
    
    .breadcrumb-link {
      color: #3f51b5;
      text-decoration: none;
      display: flex;
      align-items: center;
      
      &:hover {
        text-decoration: underline;
      }
      
      &.home {
        color: #3f51b5;
      }
      
      mat-icon {
        font-size: 18px;
        height: 18px;
        width: 18px;
        margin-right: 4px;
      }
    }
    
    .current-page {
      color: #424242;
      font-weight: 500;
      display: flex;
      align-items: center;
      
      mat-icon {
        font-size: 18px;
        height: 18px;
        width: 18px;
        margin-right: 4px;
      }
    }
    
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }
    
    @media (max-width: 768px) {
      .breadcrumbs {
        padding: 4px 8px;
        font-size: 13px;
      }
      
      .breadcrumb-link mat-icon,
      .current-page mat-icon {
        font-size: 16px;
        height: 16px;
        width: 16px;
      }
    }
  `]
})
export class BreadcrumbsComponent implements OnInit, OnDestroy {
  breadcrumbs: Breadcrumb[] = [];
  private destroy$ = new Subject<void>();
  
  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {}
  
  ngOnInit(): void {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.breadcrumbs = this.createBreadcrumbs(this.activatedRoute.root);
    });
    
    // Inicializar las migas de pan con la ruta actual
    this.breadcrumbs = this.createBreadcrumbs(this.activatedRoute.root);
  }
  
  private createBreadcrumbs(route: ActivatedRoute, url = '', breadcrumbs: Breadcrumb[] = []): Breadcrumb[] {
    // Obtener la configuración de la ruta actual
    const routeConfig = route.routeConfig;
    const path = routeConfig?.path || '';
    
    // Construir la URL
    const nextUrl = path ? `${url}/${path}` : url;
    
    // Obtener datos de ruta
    const data = route.snapshot.data;
    
    // Si hay datos de ruta con un título, crear una nueva miga de pan
    if (data['breadcrumb']) {
      const breadcrumb: Breadcrumb = {
        label: data['breadcrumb'],
        url: nextUrl,
        icon: data['icon']
      };
      breadcrumbs.push(breadcrumb);
    }
    
    // Procesar rutas especiales basadas en parámetros
    if (path.includes(':')) {
      const paramName = path.split(':')[1];
      const paramValue = route.snapshot.params[paramName];
      
      if (paramValue) {
        // Determinar el tipo de elemento para rutas de elementos
        if (paramName === 'type' && route.snapshot.url.some(segment => segment.path === 'element')) {
          const elementType = this.getReadableElementType(paramValue);
          const action = route.snapshot.url.find(segment => 
            ['new', 'edit', 'batch', 'history'].includes(segment.path)
          )?.path || '';
          
          let label = elementType;
          let icon = this.getElementTypeIcon(paramValue);
          
          if (action === 'new') {
            label = `Nuevo ${elementType}`;
          } else if (action === 'edit') {
            label = `Editar ${elementType}`;
          } else if (action === 'batch') {
            label = `Crear múltiples ${elementType}`;
            icon = 'library_add';
          } else if (action === 'history') {
            label = `Historial`;
            icon = 'history';
          }
          
          breadcrumbs.push({
            label,
            url: nextUrl,
            icon
          });
        }
        // Para IDs en rutas de historial
        else if (paramName === 'id' && route.snapshot.url.some(segment => segment.path === 'history')) {
          breadcrumbs.push({
            label: `ID: ${paramValue.substring(0, 8)}...`,
            url: nextUrl
          });
        }
      }
    }
    
    // Continuar con las rutas hijas
    if (route.firstChild) {
      return this.createBreadcrumbs(route.firstChild, nextUrl, breadcrumbs);
    }
    
    return breadcrumbs;
  }
  
  private getReadableElementType(type: string): string {
    switch (type) {
      case 'ODF': return 'ODF';
      case 'OLT': return 'OLT';
      case 'ONT': return 'ONT';
      case 'EDFA': return 'EDFA';
      case 'SPLITTER': return 'Splitter';
      case 'MANGA': return 'Manga';
      case 'TERMINAL_BOX': return 'Terminal Box';
      default: return type;
    }
  }
  
  private getElementTypeIcon(type: string): string {
    switch (type) {
      case 'ODF': return 'router';
      case 'OLT': return 'hub';
      case 'ONT': return 'settings_input_hdmi';
      case 'EDFA': return 'electrical_services';
      case 'SPLITTER': return 'call_split';
      case 'MANGA': return 'cable';
      case 'TERMINAL_BOX': return 'unarchive';
      default: return 'device_hub';
    }
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
} 
