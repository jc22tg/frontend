import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { NetworkNodeComponent, NodeData } from './network-node.component';
import { NetworkConnectionComponent, ConnectionData } from './network-connection.component';

@Component({
  selector: 'app-network-preview',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    NetworkNodeComponent,
    NetworkConnectionComponent
  ],
  template: `
    <div class="network-preview">
      <mat-spinner *ngIf="loading" diameter="40"></mat-spinner>
      <div *ngIf="error" class="error-message">
        <mat-icon>error_outline</mat-icon>
        {{ error }}
      </div>
      <div class="preview-placeholder" *ngIf="!loading && !error">
        <div class="network-grid"></div>
        <app-network-node
          *ngFor="let node of nodes"
          [node]="node"
          (onClick)="onNodeClick.emit($event)"
        ></app-network-node>
        <app-network-connection
          *ngFor="let connection of connections"
          [connection]="connection"
        ></app-network-connection>
      </div>
    </div>
  `,
  styles: [`
    .network-preview {
      flex: 1;
      overflow: hidden;
      position: relative;
      background: var(--background-color);
      border-radius: var(--border-radius-md);
      margin-bottom: var(--spacing-md);
      display: flex;
      justify-content: center;
      align-items: center;
      transition: all 0.3s ease;
    }

    .preview-placeholder {
      width: 100%;
      height: 100%;
      position: relative;
    }

    .network-grid {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-image: linear-gradient(
          to right,
          var(--grid-color) 1px,
          transparent 1px
        ),
        linear-gradient(to bottom, var(--grid-color) 1px, transparent 1px);
      background-size: 20px 20px;
      opacity: 0.3;
    }

    .error-message {
      color: var(--warn-color);
      text-align: center;
      padding: var(--spacing-md);
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
    }
  `]
})
export class NetworkPreviewComponent {
  @Input() loading = false;
  @Input() error: string | null = null;
  @Input() nodes: NodeData[] = [];
  @Input() connections: ConnectionData[] = [];
  @Output() onNodeClick = new EventEmitter<NodeData>();
} 
