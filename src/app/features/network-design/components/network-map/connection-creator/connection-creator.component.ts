import { Component, OnInit, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ElementStatus, NetworkElement, NetworkConnection } from '../../../../../shared/types/network.types';
import { trigger, transition, style, animate } from '@angular/animations';
import { NetworkStateService } from '../../../services/network-state.service';

@Component({
  selector: 'app-connection-creator',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatDividerModule, 
    MatSelectModule,
    MatTooltipModule,
    FormsModule,
    ReactiveFormsModule
  ],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('200ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ],
  template: `
    <div class="connection-creator" [@fadeIn] [class.dark-theme]="isDarkTheme">
      <div class="creator-header">
        <h3 class="creator-title">Crear Conexión</h3>
        <button mat-icon-button color="warn" (click)="onCancel.emit()" matTooltip="Cancelar">
          <mat-icon>close</mat-icon>
        </button>
      </div>
      
      <mat-divider></mat-divider>
      
      <div class="connection-status">
        <div class="source-element" [ngClass]="{'selected': sourceElement !== null}">
          <mat-icon>fiber_manual_record</mat-icon>
          <div class="element-label">
            <span class="label-title">Origen:</span>
            <span class="element-name">{{ sourceElement ? sourceElement.name : 'Seleccione elemento origen' }}</span>
          </div>
        </div>
        
        <div class="connection-arrow">
          <mat-icon>arrow_downward</mat-icon>
        </div>
        
        <div class="target-element" [ngClass]="{'selected': targetElement !== null}">
          <mat-icon>fiber_manual_record</mat-icon>
          <div class="element-label">
            <span class="label-title">Destino:</span>
            <span class="element-name">{{ targetElement ? targetElement.name : 'Seleccione elemento destino' }}</span>
          </div>
        </div>
      </div>
      
      <mat-divider></mat-divider>
      
      <div class="connection-settings" *ngIf="sourceElement && targetElement">
        <div class="form-field">
          <label>Tipo de Conexión:</label>
          <mat-select [(ngModel)]="connectionType">
            <mat-option value="fiber">Fibra Óptica</mat-option>
            <mat-option value="copper">Cable de Cobre</mat-option>
            <mat-option value="wireless">Inalámbrica</mat-option>
            <mat-option value="logical">Lógica</mat-option>
          </mat-select>
        </div>
        
        <div class="form-field">
          <label>Estado:</label>
          <mat-select [(ngModel)]="connectionStatus">
            <mat-option [value]="ElementStatus.ACTIVE">Activo</mat-option>
            <mat-option [value]="ElementStatus.INACTIVE">Inactivo</mat-option>
            <mat-option [value]="ElementStatus.MAINTENANCE">Mantenimiento</mat-option>
            <mat-option [value]="ElementStatus.PLANNED">Planificado</mat-option>
          </mat-select>
        </div>
        
        <div class="form-field">
          <label>Capacidad:</label>
          <div class="capacity-input">
            <input type="number" [(ngModel)]="connectionCapacity" min="1">
            <mat-select [(ngModel)]="connectionCapacityUnit">
              <mat-option value="Mbps">Mbps</mat-option>
              <mat-option value="Gbps">Gbps</mat-option>
              <mat-option value="Tbps">Tbps</mat-option>
            </mat-select>
          </div>
        </div>
      </div>
      
      <div class="connection-message" *ngIf="!sourceElement || !targetElement">
        <mat-card>
          <mat-card-content>
            <p class="message-text">
              <mat-icon>info</mat-icon>
              {{ !sourceElement ? 'Haga clic en un elemento para seleccionarlo como origen' : 
                 'Haga clic en otro elemento para crear la conexión' }}
            </p>
          </mat-card-content>
        </mat-card>
      </div>
      
      <div class="connection-actions">
        <button 
          mat-raised-button 
          color="primary" 
          [disabled]="!sourceElement || !targetElement"
          (click)="createConnection()"
          matTooltip="Crear la conexión con los parámetros seleccionados">
          <mat-icon>add_link</mat-icon>
          <span>Crear Conexión</span>
        </button>
        
        <button 
          mat-raised-button 
          (click)="resetSelection()"
          matTooltip="Reiniciar selección de elementos">
          <mat-icon>refresh</mat-icon>
          <span>Reiniciar</span>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .connection-creator {
      background-color: white;
      border-radius: var(--border-radius-md);
      box-shadow: var(--shadow-md);
      padding: var(--spacing-md);
      margin-bottom: var(--spacing-md);
      max-width: 500px;
      transition: all var(--transition-normal);
    }
    
    .creator-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--spacing-md);
    }
    
    .creator-title {
      font-size: var(--font-size-lg);
      margin: 0;
      color: var(--primary-color);
      font-weight: 500;
    }
    
    .connection-status {
      padding: var(--spacing-md) var(--spacing-sm);
      display: flex;
      flex-direction: column;
      gap: var(--spacing-sm);
      align-items: center;
    }
    
    .source-element, .target-element {
      display: flex;
      align-items: center;
      padding: var(--spacing-sm);
      border-radius: var(--border-radius-sm);
      background-color: var(--background-color);
      width: 100%;
      opacity: 0.7;
      transition: all var(--transition-fast);
    }
    
    .source-element.selected, .target-element.selected {
      background-color: rgba(33, 150, 243, 0.1);
      border-left: 4px solid var(--primary-color);
      opacity: 1;
    }
    
    .source-element mat-icon, .target-element mat-icon {
      margin-right: var(--spacing-sm);
      color: #9e9e9e;
    }
    
    .source-element.selected mat-icon {
      color: var(--status-active);
    }
    
    .target-element.selected mat-icon {
      color: var(--status-inactive);
    }
    
    .element-label {
      display: flex;
      flex-direction: column;
    }
    
    .label-title {
      font-size: var(--font-size-xs);
      color: var(--text-color);
    }
    
    .element-name {
      font-weight: 500;
      color: var(--text-color);
    }
    
    .connection-arrow {
      height: 40px;
      display: flex;
      align-items: center;
      color: var(--primary-color);
    }
    
    .connection-settings {
      padding: var(--spacing-md) var(--spacing-sm);
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
    }
    
    .form-field {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xs);
    }
    
    .form-field label {
      font-size: var(--font-size-sm);
      color: var(--text-color);
    }
    
    .capacity-input {
      display: flex;
      gap: var(--spacing-sm);
    }
    
    .capacity-input input {
      flex: 1;
      padding: var(--spacing-sm);
      border: 1px solid var(--dark-border-color);
      border-radius: var(--border-radius-sm);
    }
    
    .connection-message {
      margin: var(--spacing-md) 0;
    }
    
    .message-text {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      margin: 0;
      color: var(--text-color);
    }
    
    .message-text mat-icon {
      color: var(--color-info);
    }
    
    .connection-actions {
      display: flex;
      justify-content: space-between;
      margin-top: var(--spacing-md);
      gap: var(--spacing-sm);
    }
    
    button {
      display: flex;
      align-items: center;
      gap: var(--spacing-xs);
    }

    :host-context(.dark-theme) .connection-creator,
    .connection-creator.dark-theme {
      background-color: var(--dark-bg-secondary);
    }

    :host-context(.dark-theme) .creator-title,
    .dark-theme .creator-title {
      color: var(--primary-color);
    }
    
    :host-context(.dark-theme) .source-element,
    :host-context(.dark-theme) .target-element,
    .dark-theme .source-element,
    .dark-theme .target-element {
      background-color: var(--dark-bg-primary);
    }
    
    :host-context(.dark-theme) .source-element.selected,
    :host-context(.dark-theme) .target-element.selected,
    .dark-theme .source-element.selected,
    .dark-theme .target-element.selected {
      background-color: rgba(33, 150, 243, 0.2);
    }
    
    :host-context(.dark-theme) .label-title,
    :host-context(.dark-theme) .element-name,
    :host-context(.dark-theme) .form-field label,
    :host-context(.dark-theme) .message-text,
    .dark-theme .label-title,
    .dark-theme .element-name,
    .dark-theme .form-field label,
    .dark-theme .message-text {
      color: var(--dark-text-primary);
    }
    
    :host-context(.dark-theme) .capacity-input input,
    .dark-theme .capacity-input input {
      background-color: var(--dark-bg-primary);
      color: var(--dark-text-primary);
      border-color: var(--dark-border-color);
    }
  `]
})
export class ConnectionCreatorComponent implements OnInit {
  @Input() sourceElement: NetworkElement | null = null;
  @Input() targetElement: NetworkElement | null = null;
  
  @Output() onCreateConnection = new EventEmitter<NetworkConnection>();
  @Output() onCancel = new EventEmitter<void>();
  @Output() onReset = new EventEmitter<void>();
  
  connectionType = 'fiber';
  connectionStatus = ElementStatus.ACTIVE;
  connectionCapacity = 1;
  connectionCapacityUnit = 'Gbps';
  
  readonly ElementStatus = ElementStatus;
  
  // Tema oscuro
  isDarkTheme = false;
  
  constructor(private networkStateService: NetworkStateService) {}
  
  ngOnInit(): void {
    // Suscribirse a cambios de tema
    this.networkStateService.state$.subscribe(state => {
      this.isDarkTheme = state.isDarkMode;
    });
  }
  
  createConnection(): void {
    if (this.sourceElement && this.targetElement) {
      // Convertir la capacidad a un número según la unidad seleccionada
      let capacityValue = this.connectionCapacity;
      
      // Si es necesario, aplicar conversiones (por ejemplo, de Gbps a Mbps)
      if (this.connectionCapacityUnit === 'Gbps') {
        capacityValue = this.connectionCapacity * 1000; // Convertir a Mbps
      } else if (this.connectionCapacityUnit === 'Tbps') {
        capacityValue = this.connectionCapacity * 1000000; // Convertir a Mbps
      }
      
      const connection: NetworkConnection = {
        id: `conn-${Date.now()}`,
        sourceId: this.sourceElement.id,
        targetId: this.targetElement.id,
        type: this.connectionType,
        status: this.connectionStatus,
        capacity: capacityValue,
        bandwidth: capacityValue,
        label: `${this.connectionCapacity} ${this.connectionCapacityUnit}`,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      this.onCreateConnection.emit(connection);
    }
  }
  
  resetSelection(): void {
    this.sourceElement = null;
    this.targetElement = null;
    this.onReset.emit();
  }
} 