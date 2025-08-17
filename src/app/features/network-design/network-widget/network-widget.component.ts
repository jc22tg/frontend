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
import { FiberConnection as DetailedFiberConnectionModel } from '../../../shared/models/fiber-connection.model';
import { ElementType, ElementStatus, NetworkElement, NetworkConnection, NetworkAlert, ConnectionStatus } from '../../../shared/types/network.types';
import { NetworkStatsComponent } from './components/network-stats.component';
import { NetworkPreviewComponent } from './components/network-preview.component';
import { NodeData } from './components/network-node.component';
import { ConnectionData } from './components/network-connection.component';
import { MapRenderService } from '../services/map-render.service';

interface NetworkStateFromReducer { // Representa el State de network.reducer.ts
  fdps?: NetworkElement[];
  olts?: NetworkElement[];
  onts?: NetworkElement[];
  edfas?: NetworkElement[];
  splitters?: NetworkElement[];
  mangas?: NetworkElement[];
  fiberConnections?: DetailedFiberConnectionModel[];
  alerts?: NetworkAlert[];
  error?: any;
  loading?: boolean;
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

    this.store.select((state: AppState) => state.network)
      .pipe(
        take(1),
        map((networkState: NetworkStateFromReducer) => {
          if (networkState.error) {
            this.error = 'Error al cargar los datos de la red';
            this.loading = false;
            return { elements: [], connectionsCount: 0, connectionsForPreview: [], warnings: 0 };
          }

          const allElements: NetworkElement[] = [
            ...(networkState.fdps || []),
            ...(networkState.olts || []),
            ...(networkState.onts || []),
            ...(networkState.edfas || []),
            ...(networkState.splitters || []),
            ...(networkState.mangas || []),
          ];
          
          const detailedFiberConnections = networkState.fiberConnections || [];
          // En el store no hay un NetworkConnection[] consolidado, así que connectionsForPreview se quedará vacío por ahora.
          // Si se implementara un selector en el store que devuelva NetworkConnection[], se podría usar aquí.
          const connectionsForPreview: NetworkConnection[] = []; 

          return {
            elements: allElements,
            connectionsCount: detailedFiberConnections.length, // Conteo basado en lo que hay
            connectionsForPreview: connectionsForPreview, // Para dibujar, actualmente vacío
            warnings: allElements.filter(e => 
              e.status === ElementStatus.FAULT || 
              e.status === ElementStatus.ERROR || 
              e.status === ElementStatus.WARNING || 
              e.status === ElementStatus.CRITICAL
            ).length || 0,
          };
        })
      )
      .subscribe({
        next: (data) => {
          this.elementsCount$ = of(data.elements.length);
          this.connectionsCount$ = of(data.connectionsCount || 0); // Asegurar que sea número
          this.warningCount$ = of(data.warnings || 0);
          this.previewNodes$ = of(data.elements.map(element => this.createNodeData(element)));
          this.previewConnections$ = of(
            (data.connectionsForPreview || []) // Asegurar que no sea undefined
              .map(conn => this.createConnectionDataForPreview(conn, data.elements))
              .filter((c): c is ConnectionData => c !== null) // Type guard
          );
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Error al procesar datos de la red';
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
        map((networkState: NetworkStateFromReducer) => (networkState.fiberConnections || []).length), // Usar fiberConnections
        distinctUntilChanged()
      )
      .subscribe(() => this.loadNetworkData()); // Recargar datos si cambia el número de conexiones
    this.subscriptions.push(refreshSub);
  }

  onNodeClick(node: NodeData): void {
    // Implementar navegación a los detalles del elemento
  }

  refreshPreview(): void {
    this.loadNetworkData();
  }

  private createConnectionDataForPreview(
    conn: NetworkConnection, 
    elements: NetworkElement[]
  ): ConnectionData | null {
    const sourceNode = elements.find(e => e.id === conn.sourceElementId);
    const targetNode = elements.find(e => e.id === conn.targetElementId);

    if (!sourceNode || !targetNode) return null;
    if (!sourceNode.position?.coordinates || !targetNode.position?.coordinates) return null;

    const x1 = sourceNode.position.coordinates[0]; 
    const y1 = sourceNode.position.coordinates[1];
    const x2 = targetNode.position.coordinates[0];
    const y2 = targetNode.position.coordinates[1];
    
    const dx = x2 - x1;
    const dy = y2 - y1;
    const width = Math.sqrt(dx * dx + dy * dy) * 0.5; // Ajustar multiplicador para la escala de vista previa
    const rotation = Math.atan2(dy, dx) * (180 / Math.PI);
    const componentX = x1; // Posición del componente de la línea
    const componentY = y1; // Posición del componente de la línea

    let statusString: 'active' | 'inactive' = 'inactive';
    if (conn.status === ConnectionStatus.ACTIVE) { // ConnectionStatus importado y usado
      statusString = 'active';
    }

    // Devuelve un objeto que coincide con la interfaz ConnectionData
    return {
      x: componentX, 
      y: componentY,
      width: width,
      rotation: `rotate(${rotation}deg)`,
      status: statusString
    };
  }

  private createNodeData(element: NetworkElement): NodeData {
    const posX = element.position?.coordinates?.[0] || (Math.random() * 90 + 5); // Evitar bordes exactos
    const posY = element.position?.coordinates?.[1] || (Math.random() * 90 + 5);
    
    return {
      id: element.id!,
      x: posX % 100,
      y: posY % 100,
      color: this.getElementColor(element),
      tooltip: `${element.name} (${element.type}) - ${element.status}`,
      type: element.type,
      status: element.status 
    };
  }

  private getElementColor(element: NetworkElement): string {
    if (element.status === ElementStatus.ERROR || element.status === ElementStatus.FAULT) return 'var(--error-color)';
    if (element.status === ElementStatus.WARNING) return 'var(--warn-color)';
    if (element.status === ElementStatus.ACTIVE) return 'var(--success-color)';
    return 'var(--neutral-color)';
  }
}
