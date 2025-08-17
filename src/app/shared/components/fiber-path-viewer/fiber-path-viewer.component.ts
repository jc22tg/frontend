import { Component, Input, OnInit, OnChanges, SimpleChanges, ViewChild, ElementRef, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { NetworkConnection } from '../../types/network.types';
import { NetworkService } from '../../../core/services/network.service';

@Component({
  selector: 'app-fiber-path-viewer',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>Visualizador de Ruta de Fibra</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <!-- Contenido del visualizador -->
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class FiberPathViewerComponent implements OnInit, OnChanges {
  @Input() startType = '';
  @Input() startId = '';
  @Input() endType = '';
  @Input() endId = '';
  @Input() showLossCalculation = true;
  @Input() showSimulation = false;

  @Output() pathChanged = new EventEmitter<NetworkConnection[]>();
  @Output() opticalLossCalculated = new EventEmitter<{
    totalLossDb: number,
    distance: number,
    details: {
      elementType: string,
      lossDb: number,
      description: string
    }[]
  }>();

  @ViewChild('pathCanvas') pathCanvas!: ElementRef<HTMLCanvasElement>;

  path: NetworkConnection[] = [];
  opticalLossData: any = null;
  loading = false;
  error: string | null = null;
  
  // Opciones para simulación de fallos
  simulationOptions = {
    deviceTypes: ['olt', 'edfa', 'fdp', 'splitter', 'ont', 'manga', 'fiber_connection'],
    failureTypes: ['power_loss', 'cut', 'degradation', 'high_temperature', 'low_signal'],
    severityLevels: ['info', 'warning', 'error', 'critical']
  };
  
  selectedSimulation = {
    deviceType: '',
    deviceId: '',
    connectionId: '',
    failureType: '',
    severity: 'warning'
  };

  constructor(private networkService: NetworkService) { }

  ngOnInit(): void {
    if (this.startType && this.startId && this.endType && this.endId) {
      this.calculatePath();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['startType'] || changes['startId'] || changes['endType'] || changes['endId']) && 
        this.startType && this.startId && this.endType && this.endId) {
      this.calculatePath();
    }
  }

  calculatePath(): void {
    this.loading = true;
    this.error = null;
    
    if (this.showLossCalculation) {
      this.calculateOpticalLoss();
    } else {
      this.findPath();
    }
  }

  findPath(): void {
    this.networkService.getConnections().subscribe({
      next: (connections) => {
        this.path = connections.filter(conn => 
          (conn.sourceId === this.startId && conn.targetId === this.endId) ||
          (conn.sourceId === this.endId && conn.targetId === this.startId)
        );
        this.pathChanged.emit(this.path);
        this.loading = false;
        this.renderPath();
      },
      error: (err) => {
        this.error = err.message;
        this.loading = false;
      }
    });
  }

  calculateOpticalLoss(): void {
    // Implementar cálculo de pérdida óptica
    this.loading = false;
  }

  simulateFailure(): void {
    if (!this.selectedSimulation.deviceType || 
        (!this.selectedSimulation.deviceId && !this.selectedSimulation.connectionId) || 
        !this.selectedSimulation.failureType) {
      this.error = 'Por favor complete todos los campos para la simulación';
      return;
    }

    this.loading = true;
    this.error = null;

    this.networkService.simulateFailure({
      deviceType: this.selectedSimulation.deviceType,
      deviceId: this.selectedSimulation.deviceId,
      connectionId: this.selectedSimulation.connectionId,
      failureType: this.selectedSimulation.failureType,
      severity: this.selectedSimulation.severity
    }).subscribe({
      next: () => {
        this.loading = false;
        this.calculatePath();
      },
      error: (err) => {
        this.error = err.message;
        this.loading = false;
      }
    });
  }

  renderPath(): void {
    if (!this.pathCanvas || this.path.length === 0) return;
    
    const canvas = this.pathCanvas.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#0066CC';
    ctx.lineWidth = 3;
    
    ctx.beginPath();
    
    let startX = 50;
    const y = canvas.height / 2;
    const segmentWidth = (canvas.width - 100) / this.path.length;
    
    this.path.forEach((segment, index) => {
      if (index === 0) {
        ctx.moveTo(startX, y);
      }
      startX += segmentWidth;
      ctx.lineTo(startX, y);
      
      ctx.fillStyle = this.getNodeColor(segment.type);
      ctx.beginPath();
      ctx.arc(startX, y, 6, 0, Math.PI * 2);
      ctx.fill();
    });
    
    ctx.stroke();
  }

  getNodeColor(type: string): string {
    switch (type) {
      case 'olt': return '#FF0000';
      case 'fdp': return '#00FF00';
      case 'splitter': return '#0000FF';
      case 'ont': return '#FF00FF';
      case 'edfa': return '#FFFF00';
      case 'manga': return '#00FFFF';
      default: return '#888888';
    }
  }

  resetSimulation(): void {
    this.selectedSimulation = {
      deviceType: '',
      deviceId: '',
      connectionId: '',
      failureType: '',
      severity: 'warning'
    };
  }
} 
