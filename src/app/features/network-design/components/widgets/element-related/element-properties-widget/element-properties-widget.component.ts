import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';

import { NetworkElement } from '../../../../../../shared/types/network.types';
import { WidgetActionEvent, WidgetErrorEvent, WidgetUpdateEvent } from '../../container/map-widgets-container/map-widgets-container.component';

@Component({
  selector: 'app-element-properties-widget',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatExpansionModule
  ],
  template: `
    <div class="widget-container" *ngIf="selectedElement">
      <ng-content select=".widget-header"></ng-content>
      <div class="widget-content">
        <h3>{{ selectedElement.name || 'Elemento sin nombre' }}</h3>
        
        <mat-divider></mat-divider>
        
        <div class="element-properties">
          <div class="property-row">
            <span class="property-label">ID:</span>
            <span class="property-value">{{ selectedElement.id }}</span>
          </div>
          
          <div class="property-row">
            <span class="property-label">Tipo:</span>
            <span class="property-value">{{ selectedElement.type }}</span>
          </div>
          
          <div class="property-row" *ngIf="selectedElement.description">
            <span class="property-label">Descripción:</span>
            <span class="property-value">{{ selectedElement.description }}</span>
          </div>
          
          <div class="property-row" *ngIf="selectedElement.position">
            <span class="property-label">Posición:</span>
            <span class="property-value">
              {{ selectedElement.position.lat | number:'1.6-6' }}, 
              {{ selectedElement.position.lng | number:'1.6-6' }}
            </span>
          </div>
        </div>
        
        <div class="actions">
          <button mat-button color="primary" (click)="onEditElement()">
            <mat-icon>edit</mat-icon> Editar
          </button>
          <button mat-button color="warn" (click)="onDeleteElement()">
            <mat-icon>delete</mat-icon> Eliminar
          </button>
          <button mat-button (click)="onLocateElement()">
            <mat-icon>my_location</mat-icon> Localizar
          </button>
          <button mat-button (click)="onViewConnections()">
            <mat-icon>link</mat-icon> Ver conexiones
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .widget-container {
      width: 300px;
      max-height: 400px;
      overflow-y: auto;
    }
    
    .widget-content {
      padding: 16px;
    }
    
    h3 {
      margin-top: 0;
      margin-bottom: 12px;
      font-size: 16px;
      font-weight: 500;
      color: #333;
    }
    
    .element-properties {
      margin: 12px 0;
    }
    
    .property-row {
      display: flex;
      margin-bottom: 8px;
    }
    
    .property-label {
      font-weight: 500;
      min-width: 100px;
      color: #555;
    }
    
    .property-value {
      flex: 1;
      word-break: break-word;
    }
    
    .actions {
      display: flex;
      justify-content: space-between;
      margin-top: 16px;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ElementPropertiesWidgetComponent {
  @Input() selectedElement: NetworkElement | null = null;
  
  @Output() widgetAction = new EventEmitter<WidgetActionEvent>();
  @Output() widgetError = new EventEmitter<WidgetErrorEvent>();
  @Output() widgetUpdate = new EventEmitter<WidgetUpdateEvent>();
  @Output() viewConnections = new EventEmitter<string>();
  
  onEditElement(): void {
    if (!this.selectedElement) return;
    
    this.widgetAction.emit({
      source: 'element-properties-widget',
      type: 'action',
      timestamp: new Date(),
      action: 'edit',
      elementId: this.selectedElement.id,
      actionData: { element: this.selectedElement }
    });
  }
  
  onDeleteElement(): void {
    if (!this.selectedElement) return;
    
    this.widgetAction.emit({
      source: 'element-properties-widget',
      type: 'action',
      timestamp: new Date(),
      action: 'delete',
      elementId: this.selectedElement.id,
      actionData: { element: this.selectedElement }
    });
  }
  
  onLocateElement(): void {
    if (!this.selectedElement) return;
    
    this.widgetAction.emit({
      source: 'element-properties-widget',
      type: 'action',
      timestamp: new Date(),
      action: 'locate',
      elementId: this.selectedElement.id,
      actionData: { element: this.selectedElement }
    });
  }
  
  onViewConnections(): void {
    if (this.selectedElement?.id) {
      this.viewConnections.emit(this.selectedElement.id);
    }
  }
} 
