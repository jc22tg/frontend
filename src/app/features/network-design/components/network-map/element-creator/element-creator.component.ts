import { Component, OnInit, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatCardModule } from '@angular/material/card';
import { FormsModule } from '@angular/forms';
import { ElementType } from '../../../../../shared/types/network.types';
import { trigger, transition, style, animate } from '@angular/animations';
import { NetworkStateService } from '../../../services/network-state.service';

@Component({
  selector: 'app-element-creator',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatExpansionModule,
    MatTooltipModule,
    MatDividerModule,
    MatCardModule,
    FormsModule
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
    <div class="element-creator" [@fadeIn] [class.dark-theme]="isDarkTheme">
      <h3 class="creator-title">Insertar Elementos</h3>
      
      <mat-expansion-panel class="creator-panel">
        <mat-expansion-panel-header>
          <mat-panel-title>
            <mat-icon class="panel-icon">router</mat-icon>
            <span>Elementos de Distribución</span>
          </mat-panel-title>
        </mat-expansion-panel-header>
        
        <div class="element-buttons">
          <button mat-raised-button color="primary" 
            (click)="addElement(ElementType.OLT)" 
            matTooltip="Agregar un OLT al mapa"
            class="element-button">
            <mat-icon>hub</mat-icon>
            <span>OLT</span>
          </button>
          
          <button mat-raised-button color="primary" 
            (click)="addElement(ElementType.FDP)" 
            matTooltip="Agregar un FDP al mapa"
            class="element-button">
            <mat-icon>router</mat-icon>
            <span>FDP</span>
          </button>
          
          <button mat-stroked-button 
            (click)="addBatchElements(ElementType.FDP)" 
            matTooltip="Agregar múltiples FDPs al mapa"
            class="element-button">
            <mat-icon>library_add</mat-icon>
            <span>FDPs (Batch)</span>
          </button>
        </div>
      </mat-expansion-panel>
      
      <mat-expansion-panel class="creator-panel">
        <mat-expansion-panel-header>
          <mat-panel-title>
            <mat-icon class="panel-icon">devices</mat-icon>
            <span>Equipos de Cliente</span>
          </mat-panel-title>
        </mat-expansion-panel-header>
        
        <div class="element-buttons">
          <button mat-raised-button color="primary" 
            (click)="addElement(ElementType.ONT)" 
            matTooltip="Agregar un ONT al mapa"
            class="element-button">
            <mat-icon>devices</mat-icon>
            <span>ONT</span>
          </button>
          
          <button mat-stroked-button 
            (click)="addBatchElements(ElementType.ONT)" 
            matTooltip="Agregar múltiples ONTs al mapa"
            class="element-button">
            <mat-icon>library_add</mat-icon>
            <span>ONTs (Batch)</span>
          </button>
        </div>
      </mat-expansion-panel>
      
      <mat-expansion-panel class="creator-panel">
        <mat-expansion-panel-header>
          <mat-panel-title>
            <mat-icon class="panel-icon">settings</mat-icon>
            <span>Componentes de Red</span>
          </mat-panel-title>
        </mat-expansion-panel-header>
        
        <div class="element-buttons">
          <button mat-raised-button color="primary" 
            (click)="addElement(ElementType.SPLITTER)" 
            matTooltip="Agregar un Splitter al mapa"
            class="element-button">
            <mat-icon>call_split</mat-icon>
            <span>Splitter</span>
          </button>
          
          <button mat-raised-button color="primary" 
            (click)="addElement(ElementType.EDFA)" 
            matTooltip="Agregar un EDFA al mapa"
            class="element-button">
            <mat-icon>electrical_services</mat-icon>
            <span>EDFA</span>
          </button>
          
          <button mat-raised-button color="primary" 
            (click)="addElement(ElementType.MANGA)" 
            matTooltip="Agregar una Manga al mapa"
            class="element-button">
            <mat-icon>cable</mat-icon>
            <span>Manga</span>
          </button>
        </div>
      </mat-expansion-panel>
      
      <mat-expansion-panel class="creator-panel">
        <mat-expansion-panel-header>
          <mat-panel-title>
            <mat-icon class="panel-icon">dashboard</mat-icon>
            <span>Equipamiento Central</span>
          </mat-panel-title>
        </mat-expansion-panel-header>
        
        <div class="element-buttons">
          <button mat-raised-button color="primary" 
            (click)="addElement(ElementType.ODF)" 
            matTooltip="Agregar un ODF al mapa"
            class="element-button">
            <mat-icon>dashboard</mat-icon>
            <span>ODF</span>
          </button>
          
          <button mat-raised-button color="primary" 
            (click)="addElement(ElementType.MSAN)" 
            matTooltip="Agregar un MSAN al mapa"
            class="element-button">
            <mat-icon>device_hub</mat-icon>
            <span>MSAN</span>
          </button>
          
          <button mat-raised-button color="primary" 
            (click)="addElement(ElementType.TERMINAL_BOX)" 
            matTooltip="Agregar una Caja Terminal al mapa"
            class="element-button">
            <mat-icon>unarchive</mat-icon>
            <span>Caja Terminal</span>
          </button>
        </div>
      </mat-expansion-panel>
      
      <mat-divider class="section-divider"></mat-divider>
      
      <div class="quick-actions">
        <h4 class="section-subtitle">Elementos Recientes</h4>
        <div class="recent-elements">
          <mat-card *ngIf="recentElements.length === 0" class="empty-message">
            <mat-card-content>
              No hay elementos recientes
            </mat-card-content>
          </mat-card>
          
          <button *ngFor="let type of recentElements" 
            mat-stroked-button 
            (click)="addElement(type)"
            class="recent-element-button">
            <mat-icon>{{ getElementIcon(type) }}</mat-icon>
            <span>{{ getElementTypeName(type) }}</span>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .element-creator {
      background-color: white;
      border-radius: var(--border-radius-md);
      box-shadow: var(--shadow-md);
      padding: var(--spacing-md);
      margin-bottom: var(--spacing-md);
      transition: all var(--transition-normal);
    }
    
    .creator-title {
      font-size: var(--font-size-lg);
      margin-top: 0;
      margin-bottom: var(--spacing-md);
      color: var(--primary-color);
      font-weight: 500;
      border-bottom: 1px solid var(--dark-border-color);
      padding-bottom: var(--spacing-sm);
    }
    
    .creator-panel {
      margin-bottom: var(--spacing-sm);
    }
    
    .panel-icon {
      margin-right: var(--spacing-sm);
      color: var(--primary-color);
    }
    
    .element-buttons {
      display: flex;
      flex-wrap: wrap;
      gap: var(--spacing-sm);
      padding: var(--spacing-sm) 0;
    }
    
    .element-button {
      flex: 1 1 calc(33.33% - var(--spacing-sm));
      min-width: 100px;
      display: flex;
      align-items: center;
      justify-content: flex-start;
    }
    
    .element-button mat-icon {
      margin-right: var(--spacing-sm);
    }
    
    .section-divider {
      margin: var(--spacing-md) 0;
    }
    
    .section-subtitle {
      font-size: var(--font-size-md);
      margin-top: var(--spacing-sm);
      margin-bottom: var(--spacing-sm);
      color: var(--primary-color);
      font-weight: 500;
    }
    
    .recent-elements {
      display: flex;
      flex-wrap: wrap;
      gap: var(--spacing-sm);
    }
    
    .recent-element-button {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      min-width: 120px;
    }
    
    .recent-element-button mat-icon {
      margin-right: var(--spacing-xs);
    }
    
    .empty-message {
      width: 100%;
      text-align: center;
      color: var(--text-color);
      background-color: var(--background-color);
      padding: var(--spacing-sm);
    }

    /* Soporte para tema oscuro */
    :host-context(.dark-theme) .element-creator,
    .element-creator.dark-theme {
      background-color: var(--dark-bg-secondary);
    }
    
    :host-context(.dark-theme) .creator-title,
    .dark-theme .creator-title {
      color: var(--primary-color);
      border-bottom-color: var(--dark-border-color);
    }
    
    :host-context(.dark-theme) .section-subtitle,
    .dark-theme .section-subtitle {
      color: var(--primary-color);
    }
    
    :host-context(.dark-theme) .panel-icon,
    .dark-theme .panel-icon {
      color: var(--primary-color);
    }
    
    :host-context(.dark-theme) .empty-message,
    .dark-theme .empty-message {
      background-color: var(--dark-bg-primary);
      color: var(--dark-text-primary);
    }
    
    :host-context(.dark-theme) mat-expansion-panel,
    .dark-theme mat-expansion-panel {
      background-color: var(--dark-bg-primary);
    }
    
    :host-context(.dark-theme) mat-panel-title,
    .dark-theme mat-panel-title {
      color: var(--dark-text-primary);
    }
  `]
})
export class ElementCreatorComponent implements OnInit {
  @Output() onAddElement = new EventEmitter<{type: ElementType, batch: boolean}>();
  
  readonly ElementType = ElementType;
  recentElements: ElementType[] = [];
  
  // Tema oscuro
  isDarkTheme = false;
  
  constructor(private networkStateService: NetworkStateService) {}
  
  ngOnInit(): void {
    // Suscribirse a cambios de tema
    this.networkStateService.state$.subscribe(state => {
      this.isDarkTheme = state.isDarkMode;
    });
  }
  
  addElement(type: ElementType): void {
    this.addToRecentElements(type);
    this.onAddElement.emit({type, batch: false});
  }
  
  addBatchElements(type: ElementType): void {
    this.addToRecentElements(type);
    this.onAddElement.emit({type, batch: true});
  }
  
  private addToRecentElements(type: ElementType): void {
    // Evitar duplicados
    if (!this.recentElements.includes(type)) {
      // Agregar al principio
      this.recentElements.unshift(type);
      
      // Limitar a máximo 4 elementos recientes
      if (this.recentElements.length > 4) {
        this.recentElements.pop();
      }
    } else {
      // Si ya existe, moverlo al principio
      this.recentElements = this.recentElements.filter(t => t !== type);
      this.recentElements.unshift(type);
    }
  }
  
  getElementIcon(type: ElementType): string {
    switch (type) {
      case ElementType.OLT:
        return 'hub';
      case ElementType.ONT:
        return 'devices';
      case ElementType.FDP:
        return 'router';
      case ElementType.SPLITTER:
        return 'call_split';
      case ElementType.EDFA:
        return 'electrical_services';
      case ElementType.MANGA:
        return 'cable';
      case ElementType.ODF:
        return 'dashboard';
      case ElementType.MSAN:
        return 'device_hub';
      case ElementType.TERMINAL_BOX:
        return 'unarchive';
      default:
        return 'device_unknown';
    }
  }
  
  getElementTypeName(type: ElementType): string {
    switch (type) {
      case ElementType.OLT:
        return 'OLT';
      case ElementType.ONT:
        return 'ONT';
      case ElementType.FDP:
        return 'FDP';
      case ElementType.SPLITTER:
        return 'Splitter';
      case ElementType.EDFA:
        return 'EDFA';
      case ElementType.MANGA:
        return 'Manga';
      case ElementType.ODF:
        return 'ODF';
      case ElementType.MSAN:
        return 'MSAN';
      case ElementType.TERMINAL_BOX:
        return 'Caja Terminal';
      default:
        return 'Elemento';
    }
  }
} 