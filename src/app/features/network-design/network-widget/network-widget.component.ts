/**
 * @description Componente widget para visualización previa de la red
 * @author Tu Nombre
 * @version 1.0.0
 *
 * Este componente muestra una vista previa simplificada de la red de fibra óptica,
 * incluyendo contadores de elementos y conexiones, y una representación visual
 * de la topología de la red.
 *
 * @example
 * ```html
 * <app-network-widget></app-network-widget>
 * ```
 */
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Store } from '@ngrx/store';
import { map, take, distinctUntilChanged } from 'rxjs/operators';
import { Observable, of, Subscription } from 'rxjs';
import { AppState } from '../../../core/store';
import { ElementType, ElementStatus, NetworkElement, NetworkConnection } from '../../../shared/types/network.types';
import { NetworkStatsComponent } from './components/network-stats.component';
import { NetworkPreviewComponent } from './components/network-preview.component';
import { NodeData } from './components/network-node.component';
import { ConnectionData } from './components/network-connection.component';
import { MapRenderService } from '../services/map-render.service';

// Para evitar errores con propiedades no definidas en el tipo State
interface NetworkState {
  fdps?: NetworkElement[];
  olts?: NetworkElement[];
  onts?: NetworkElement[];
  edfas?: NetworkElement[];
  splitters?: NetworkElement[];
  mangas?: NetworkElement[];
  elements?: NetworkElement[];
  fiberConnections?: NetworkConnection[];
  connections?: NetworkConnection[];
  error?: any;
}

@Component({
  selector: 'app-network-widget',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    NetworkStatsComponent,
    NetworkPreviewComponent,
  ],
  template: `
    <div class="network-widget">
      <div class="widget-header">
        <div class="header-content">
          <mat-icon class="header-icon">network_check</mat-icon>
          <h3>Vista Previa de Red</h3>
        </div>
        <app-network-stats
          [elementsCount]="(elementsCount$ | async) || 0"
          [connectionsCount]="(connectionsCount$ | async) || 0"
          [warningCount]="(warningCount$ | async) || 0"
        ></app-network-stats>
      </div>

      <app-network-preview
        [loading]="loading"
        [error]="error"
        [nodes]="(previewNodes$ | async) || []"
        [connections]="(previewConnections$ | async) || []"
        (onNodeClick)="onNodeClick($event)"
      ></app-network-preview>

      <div class="widget-footer">
        <button mat-button color="primary" [routerLink]="['/network-design']">
          <mat-icon>map</mat-icon>
          Ver Mapa Completo
        </button>
        <button mat-button color="accent" (click)="refreshPreview()">
          <mat-icon>refresh</mat-icon>
          Actualizar
        </button>
      </div>
    </div>
  `,
  styles: [`
    .network-widget {
      display: flex;
      flex-direction: column;
      height: 100%;
      padding: var(--spacing-md);
      background: var(--background-color);
      border-radius: var(--border-radius-md);
      box-shadow: var(--shadow-md);
      transition: all 0.3s ease;
    }

    .widget-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--spacing-md);
      padding-bottom: var(--spacing-sm);
      border-bottom: 1px solid var(--border-color);
    }

    .header-content {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
    }

    .header-icon {
      color: var(--primary-color);
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .widget-footer {
      display: flex;
      justify-content: space-between;
      padding-top: var(--spacing-sm);
      border-top: 1px solid var(--border-color);
    }
  `]
})
export class NetworkWidgetComponent implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = [];

  elementsCount$: Observable<number> = of(0);
  connectionsCount$: Observable<number> = of(0);
  warningCount$: Observable<number> = of(0);
  previewNodes$: Observable<NodeData[]> = of([]);
  previewConnections$: Observable<ConnectionData[]> = of([]);
  loading = true;
  error: string | null = null;

  constructor(
    private store: Store<AppState>,
    private renderService: MapRenderService
  ) {}

  ngOnInit(): void {
    this.loadNetworkData();
    this.setupAutoRefresh();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private loadNetworkData(): void {
    this.loading = true;
    this.error = null;

    this.store.select(state => state.network)
      .pipe(
        take(1),
        map((networkState: NetworkState) => {
          if (networkState.error) {
            this.error = 'Error al cargar los datos de la red';
            return;
          }

          // Usando el modelo de datos actualizado para obtener todos los elementos
          const allElements = networkState.elements || [];

          // Si no hay elementos, intentar obtenerlos de la forma anterior (compatibilidad)
          if (!allElements || allElements.length === 0) {
            const legacyElements = [
              ...(networkState.fdps || []),
              ...(networkState.olts || []),
              ...(networkState.onts || []),
              ...(networkState.edfas || []),
              ...(networkState.splitters || []),
              ...(networkState.mangas || []),
            ];
            
            if (legacyElements.length > 0) {
              this.elementsCount$ = of(legacyElements.length);
              this.connectionsCount$ = of(networkState.fiberConnections?.length || 0);
              this.warningCount$ = of(
                legacyElements.filter(e => e.status === ElementStatus.FAULT).length || 0
              );

              this.previewNodes$ = of(legacyElements.map(element => this.createNodeData(element)));
              
              const connections = (networkState.fiberConnections || [])
                .map(conn => this.createConnectionData(conn, legacyElements))
                .filter((conn): conn is ConnectionData => conn !== null);

              this.previewConnections$ = of(connections);
            } else {
              // Si tampoco hay elementos en el modelo anterior, poner contadores a 0
              this.elementsCount$ = of(0);
              this.connectionsCount$ = of(0);
              this.warningCount$ = of(0);
              this.previewNodes$ = of([]);
              this.previewConnections$ = of([]);
            }
          } else {
            // Usar los datos del nuevo modelo
            this.elementsCount$ = of(allElements.length);
            this.connectionsCount$ = of(networkState.connections?.length || 0);
            this.warningCount$ = of(
              allElements.filter(e => e.status === ElementStatus.FAULT).length || 0
            );

            this.previewNodes$ = of(allElements.map(element => this.createNodeData(element)));
            
            const connections = (networkState.connections || [])
              .map(conn => this.createConnectionData(conn, allElements))
              .filter((conn): conn is ConnectionData => conn !== null);

            this.previewConnections$ = of(connections);
          }
        })
      )
      .subscribe({
        complete: () => {
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Error al cargar los datos de la red';
          this.loading = false;
          this.elementsCount$ = of(0);
          this.connectionsCount$ = of(0);
          this.warningCount$ = of(0);
          this.previewNodes$ = of([]);
          this.previewConnections$ = of([]);
        }
      });
  }

  private setupAutoRefresh(): void {
    const refreshSub = this.store
      .select(state => state.network)
      .pipe(
        map((networkState: NetworkState) => (networkState.connections || networkState.fiberConnections || []).length),
        distinctUntilChanged()
      )
      .subscribe(() => {
        this.loadNetworkData();
      });

    this.subscriptions.push(refreshSub);
  }

  onNodeClick(node: NodeData): void {
    // Implementar navegación a los detalles del elemento
  }

  refreshPreview(): void {
    this.loadNetworkData();
  }

  /**
   * Crea los datos de nodo para la visualización a partir de un elemento de red
   * @param element Elemento de red
   * @returns Datos del nodo para visualización
   */
  private createNodeData(element: NetworkElement): NodeData {
    return {
      x: Math.random() * 100, // Posición aleatoria para el widget
      y: Math.random() * 100,
      color: this.getElementColor(element),
      tooltip: `${element.type}: ${element.name}`,
      type: element.type as ElementType,
      status: element.status as ElementStatus,
      id: element.id.toString()
    };
  }

  /**
   * Crea los datos de conexión para la visualización
   * @param conn Conexión de red
   * @param elements Lista de elementos disponibles
   * @returns Datos de conexión o null si no se puede crear
   */
  private createConnectionData(
    conn: any, 
    elements: NetworkElement[]
  ): ConnectionData | null {
    const sourceId = conn.sourceId || conn.source;
    const targetId = conn.targetId || conn.target;
    
    if (!sourceId || !targetId) return null;
    
    const startNode = elements.find(e => e.id.toString() === sourceId.toString());
    const endNode = elements.find(e => e.id.toString() === targetId.toString());
    
    if (!startNode || !endNode) return null;
    
    // Obtener coordenadas o usar valores aleatorios si no existen
    const startX = startNode.position?.coordinates?.[0] || Math.random() * 100;
    const startY = startNode.position?.coordinates?.[1] || Math.random() * 100;
    const endX = endNode.position?.coordinates?.[0] || Math.random() * 100;
    const endY = endNode.position?.coordinates?.[1] || Math.random() * 100;
    
    const dx = endX - startX;
    const dy = endY - startY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;
    
    return {
      x: startX,
      y: startY,
      width: distance || 20, // Valor mínimo para evitar conexiones invisibles
      rotation: `rotate(${angle}deg)`,
      status: (conn.status === ElementStatus.ACTIVE) ? 'active' : 'inactive'
    };
  }

  /**
   * Obtiene el color para un elemento según su tipo y estado
   * @param element Elemento de red
   * @returns Color CSS para el elemento
   */
  private getElementColor(element: NetworkElement): string {
    // Usar el servicio compartido que ya implementa esta lógica
    return this.renderService.getElementColor(element.type, element.status);
  }
}
