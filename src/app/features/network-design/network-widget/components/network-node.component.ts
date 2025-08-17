import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ElementType, ElementStatus } from '../../../../shared/types/network.types';

export interface NodeData {
  x: number;
  y: number;
  color: string;
  tooltip: string;
  type: ElementType;
  status: ElementStatus;
  id: string;
}

@Component({
  selector: 'app-network-node',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatTooltipModule],
  template: `
    <div
      class="network-node"
      [style.left.%]="node.x"
      [style.top.%]="node.y"
      [style.background-color]="node.color"
      [class.node-warning]="node.status === ElementStatus.FAULT"
      [matTooltip]="node.tooltip"
      (click)="onClick.emit(node)"
    >
      <mat-icon class="node-icon">{{ getNodeIcon(node.type) }}</mat-icon>
    </div>
  `,
  styles: [`
    .network-node {
      position: absolute;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      transform: translate(-50%, -50%);
      box-shadow: var(--shadow-sm);
      transition: all 0.3s ease;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2;

      &:hover {
        transform: translate(-50%, -50%) scale(1.2);
        box-shadow: var(--shadow-md);
      }

      &.node-warning {
        background-color: var(--warn-color);
        animation: pulse 2s infinite;
      }

      .node-icon {
        color: white;
        font-size: 14px;
        width: 14px;
        height: 14px;
      }
    }

    @keyframes pulse {
      0% {
        box-shadow: 0 0 0 0 rgba(244, 67, 54, 0.4);
      }
      70% {
        box-shadow: 0 0 0 10px rgba(244, 67, 54, 0);
      }
      100% {
        box-shadow: 0 0 0 0 rgba(244, 67, 54, 0);
      }
    }
  `]
})
export class NetworkNodeComponent {
  @Input() node!: NodeData;
  @Output() onClick = new EventEmitter<NodeData>();
  ElementStatus = ElementStatus;

  getNodeIcon(type: ElementType): string {
    const icons: Partial<Record<ElementType, string>> = {
      [ElementType.FDP]: 'device_hub',
      [ElementType.OLT]: 'router',
      [ElementType.ONT]: 'devices',
      [ElementType.EDFA]: 'settings_input_component',
      [ElementType.SPLITTER]: 'call_split',
      [ElementType.MANGA]: 'fiber_manual_record',
    };
    return icons[type] || 'help';
  }
} 
