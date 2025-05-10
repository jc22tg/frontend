import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-mini-map-widget',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule, 
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ],
  template: `
    <mat-card class="mini-map-widget">
      <mat-card-header>
        <mat-card-title>{{ title }}</mat-card-title>
        <button mat-icon-button (click)="refreshMap()">
          <mat-icon>refresh</mat-icon>
        </button>
      </mat-card-header>
      <mat-card-content>
        <div class="map-container" [style.height.px]="height">
          <!-- Aquí se renderizaría el mapa -->
          <div *ngIf="loading" class="loading-indicator">
            <mat-spinner diameter="30"></mat-spinner>
          </div>
          
          <div *ngIf="error" class="error-message">
            <mat-icon color="warn">error</mat-icon>
            <span>{{ errorMessage }}</span>
            <button mat-button color="primary" (click)="refreshMap()">Reintentar</button>
          </div>
          
          <div *ngIf="!mapLoaded && !loading && !error" class="map-placeholder">
            <mat-icon>map</mat-icon>
            <span>Cargando mapa...</span>
          </div>
        </div>
      </mat-card-content>
      <mat-card-actions align="end" *ngIf="showActions">
        <button mat-button color="primary" (click)="openFullMap()">
          <mat-icon>open_in_new</mat-icon> {{ openMapButtonText }}
        </button>
      </mat-card-actions>
    </mat-card>
  `,
  styles: [`
    .mini-map-widget {
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .map-container {
      flex: 1;
      background-color: #f5f5f5;
      border-radius: 4px;
      position: relative;
      overflow: hidden;
    }

    .map-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: #9e9e9e;
    }

    .map-placeholder mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 8px;
    }
    
    .loading-indicator {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      justify-content: center;
      align-items: center;
      background-color: rgba(255, 255, 255, 0.7);
      z-index: 1;
    }
    
    .error-message {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: #f44336;
      gap: 8px;
      text-align: center;
      padding: 0 16px;
    }
  `]
})
export class MiniMapWidgetComponent implements OnInit {
  @Input() height = 200;
  @Input() showActions = true;
  @Input() title = 'Vista Miniatura';
  @Input() openMapButtonText = 'Ver mapa completo';
  @Input() centerCoordinates?: { lat: number; lng: number };
  @Input() zoomLevel = 12;
  
  @Output() mapReady = new EventEmitter<boolean>();
  @Output() errorOccurred = new EventEmitter<Error>();
  @Output() mapClicked = new EventEmitter<{lat: number, lng: number}>();
  @Output() fullMapRequested = new EventEmitter<void>();
  
  mapLoaded = false;
  loading = false;
  error = false;
  errorMessage = 'Error al cargar el mapa.';
  
  constructor() {}
  
  ngOnInit(): void {
    this.loadMap();
  }
  
  refreshMap(): void {
    this.mapLoaded = false;
    this.error = false;
    this.loadMap();
  }
  
  openFullMap(): void {
    // Emitir evento para informar al componente padre
    this.fullMapRequested.emit();
    
    // Mostrar indicación visual al usuario
    this.loading = true;
    
    // Mensaje detallado en consola para ayudar en depuración
    console.log('[MiniMapWidget] Evento fullMapRequested emitido para abrir mapa completo');
    
    // Simular tiempo de carga
    setTimeout(() => {
      this.loading = false;
    }, 500);
  }
  
  private loadMap(): void {
    this.loading = true;
    
    // Simulación de carga del mapa
    setTimeout(() => {
      try {
        // Simulación de éxito al cargar el mapa
        this.mapLoaded = true;
        this.loading = false;
        this.error = false;
        this.mapReady.emit(true);
        
        // Si se hubiera implementado un mapa real, se inicializaría aquí
        // Por ejemplo, utilizando Leaflet o Google Maps
      } catch (error) {
        this.handleError(error);
      }
    }, 1500);
  }
  
  private handleError(error: any): void {
    this.loading = false;
    this.error = true;
    this.mapLoaded = false;
    this.errorMessage = error?.message || 'Error al cargar el mapa.';
    this.errorOccurred.emit(error);
  }
} 