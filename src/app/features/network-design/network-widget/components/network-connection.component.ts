import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ConnectionData {
  x: number;
  y: number;
  width: number;
  rotation: string;
  status: 'active' | 'inactive';
}

@Component({
  selector: 'app-network-connection',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="network-connection"
      [style.left.%]="connection.x"
      [style.top.%]="connection.y"
      [style.width.px]="connection.width"
      [style.transform]="connection.rotation"
      [class.connection-inactive]="connection.status === 'inactive'"
    ></div>
  `,
  styles: [`
    .network-connection {
      position: absolute;
      height: 2px;
      background-color: var(--primary-color);
      transform-origin: left center;
      opacity: 0.6;
      transition: all 0.3s ease;

      &.connection-inactive {
        background-color: var(--text-color);
        opacity: 0.3;
      }
    }
  `]
})
export class NetworkConnectionComponent {
  @Input() connection!: ConnectionData;
} 