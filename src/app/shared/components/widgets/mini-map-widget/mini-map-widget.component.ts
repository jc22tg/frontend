import { Component, Input, OnInit, Output, EventEmitter, OnDestroy, NgZone, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subscription } from 'rxjs';
import { MapService } from '../../.././../features/network-design/services/map.service';
import * as L from 'leaflet';

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
        <div #mapContainer class="map-container" [style.height.px]="height">
          <div *ngIf="loading" class="loading-indicator">
            <mat-spinner diameter="30"></mat-spinner>
          </div>
          
          <div *ngIf="error" class="error-message">
            <mat-icon color="warn">error</mat-icon>
            <span>{{ errorMessage }}</span>
            <button mat-button color="primary" (click)="refreshMap()">Reintentar</button>
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
      z-index: 999;
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
export class MiniMapWidgetComponent implements OnInit, OnDestroy {
  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef;
  
  @Input() height = 200;
  @Input() showActions = true;
  @Input() title = 'Vista Miniatura';
  @Input() openMapButtonText = 'Ver mapa completo';
  @Input() centerCoordinates?: { lat: number; lng: number };
  @Input() zoomLevel = 12;
  
  @Output() mapReady = new EventEmitter<boolean>();
  @Output() errorOccurred = new EventEmitter<any>();
  @Output() mapClicked = new EventEmitter<{lat: number, lng: number}>();
  @Output() fullMapRequested = new EventEmitter<{center?: L.LatLng, zoom?: number} | null>();
  
  mapLoaded = false;
  loading = false;
  error = false;
  errorMessage = 'Error al cargar el mapa.';
  
  private map: L.Map | null = null;
  private mapReadySubscription: Subscription | null = null;
  private defaultCoordinates = { lat: 19.78374989863946, lng: -70.67666561349361 }; // República Dominicana
  
  constructor(
    private mapService: MapService,
    private zone: NgZone,
    private el: ElementRef
  ) {}
  
  ngOnInit(): void {
    this.loadMap();
  }
  
  ngOnDestroy(): void {
    if (this.mapReadySubscription) {
      this.mapReadySubscription.unsubscribe();
    }
    
    // Limpiar recursos del mapa
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }
  
  refreshMap(): void {
    this.mapLoaded = false;
    this.error = false;
    
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
    
    this.loadMap();
  }
  
  openFullMap(): void {
    // Guardar estado actual del mapa si existe
    const currentState = this.map ? {
      center: this.map.getCenter(),
      zoom: this.map.getZoom()
    } : null;
    
    // Emitir evento para informar al componente padre, incluyendo el estado del mapa
    this.fullMapRequested.emit(currentState);
    
    // Mostrar indicación visual al usuario
    this.loading = true;
    
    // Mensaje detallado en consola para ayudar en depuración
    console.log('[MiniMapWidget] Evento fullMapRequested emitido para abrir mapa completo');
    console.log('[MiniMapWidget] Estado actual del mapa:', currentState);
    
    // Simular brevemente carga para mejor feedback visual
    setTimeout(() => {
      this.loading = false;
    }, 300);
  }
  
  private loadMap(): void {
    this.loading = true;
    
    // Asegurarse de que el elemento contenedor existe
    if (!this.mapContainer || !this.mapContainer.nativeElement) {
      this.handleError(new Error('Contenedor del mapa no encontrado'));
      return;
    }
    
    // Ejecutar fuera de la zona Angular para mejor rendimiento
    this.zone.runOutsideAngular(() => {
      try {
        // Crear mapa Leaflet directamente
        // Nota: No usamos MapService.initialize() aquí porque es más eficiente
        // crear una instancia simple directamente para el mini-mapa
        const container = this.mapContainer.nativeElement;
        const coords = this.centerCoordinates || this.defaultCoordinates;
        
        // Crear el mapa
        this.map = L.map(container, {
          center: [coords.lat, coords.lng],
          zoom: this.zoomLevel,
          zoomControl: false,
          attributionControl: false,
          dragging: true,
          scrollWheelZoom: false, // Desactivar zoom con rueda para mini-mapa
          doubleClickZoom: false
        });
        
        // Añadir capa base (simplificada para el mini-mapa)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          minZoom: 3,
          maxZoom: 18
        }).addTo(this.map);
        
        // Añadir marcador en la ubicación actual (siempre mostrar un marcador)
        const marker = L.marker([coords.lat, coords.lng], {
          title: 'Ubicación actual',
          alt: 'Marcador de ubicación'
        }).addTo(this.map);
        
        // Añadir un pequeño popup con información
        marker.bindPopup(`
          <strong>Coordenadas</strong><br>
          Lat: ${coords.lat.toFixed(6)}<br>
          Lng: ${coords.lng.toFixed(6)}
        `).openPopup();
        
        // Configurar eventos
        this.setupMapEvents();
        
        // Volver a la zona Angular para actualizar estado
        this.zone.run(() => {
          this.mapLoaded = true;
          this.loading = false;
          this.error = false;
          this.mapReady.emit(true);
        });
      } catch (error) {
        // Volver a la zona Angular para manejar el error
        this.zone.run(() => {
          this.handleError(error);
        });
      }
    });
  }
  
  private setupMapEvents(): void {
    if (!this.map) return;
    
    // Evento de clic en el mapa
    this.map.on('click', (e: L.LeafletMouseEvent) => {
      this.zone.run(() => {
        this.mapClicked.emit({
          lat: e.latlng.lat,
          lng: e.latlng.lng
        });
      });
    });
    
    // Invalidar tamaño para asegurar renderizado correcto
    setTimeout(() => {
      if (this.map) {
        this.map.invalidateSize();
      }
    }, 100);
  }
  
  private handleError(error: any): void {
    console.error('[MiniMapWidget] Error al cargar el mapa:', error);
    this.loading = false;
    this.error = true;
    this.mapLoaded = false;
    this.errorMessage = error?.message || 'Error al cargar el mapa.';
    this.errorOccurred.emit(error);
  }
} 
