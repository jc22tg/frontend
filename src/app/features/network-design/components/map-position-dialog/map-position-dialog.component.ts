import {
  Component,
  Inject,
  OnInit,
  AfterViewInit,
  ViewChild,
  ElementRef,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogModule,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { MatListModule } from '@angular/material/list';
import { Subject, fromEvent } from 'rxjs';
import { takeUntil, debounceTime, filter } from 'rxjs/operators';

import { GeographicPosition, createPosition } from '../../../../shared/types/geo-position';
import { MapPositionService } from '../../services/map-position.service';
import { NetworkDesignService } from '../../services/network-design.service';
import { NetworkStateService } from '../../services/network-state.service';

// Interfaz extendida para trabajar internamente con lat/lng
interface ExtendedPosition extends GeographicPosition {
  lat: number;
  lng: number;
}

interface DialogData {
  position: GeographicPosition;
  title?: string;
  description?: string;
  elementType?: string;
  maxDistance?: number; // Distancia máxima permitida en metros
  showValidationHint?: boolean; // Mostrar hint de validación
}

// Constantes para validación de coordenadas
const MIN_LATITUDE = -90;
const MAX_LATITUDE = 90;
const MIN_LONGITUDE = -180;
const MAX_LONGITUDE = 180;

// Límites aproximados de República Dominicana
const DR_BOUNDS = {
  north: 19.9302,
  south: 17.4701,
  west: -72.0035,
  east: -68.3200
};

@Component({
  selector: 'app-map-position-dialog',
  templateUrl: './map-position-dialog.component.html',
  styleUrls: ['./map-position-dialog.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    MatSelectModule,
    MatListModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MapPositionDialogComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mapContainer') mapContainer!: ElementRef<HTMLDivElement>;
  
  position: ExtendedPosition;
  searchQuery = '';
  loading = false;
  error: string | null = null;
  isValidPosition = false;
  mapInitialized = false;

  private destroy$ = new Subject<void>();
  private readonly defaultPosition: ExtendedPosition = {
    coordinates: [-70.6946, 19.8006], // Puerto Plata, RD [longitude, latitude]
    lng: -70.6946,
    lat: 19.8006,
    type: 'Point'
  };

  constructor(
    private mapService: MapPositionService,
    private networkDesignService: NetworkDesignService,
    private networkStateService: NetworkStateService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
    public dialogRef: MatDialogRef<MapPositionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {
    this.position = this.convertToExtendedPosition(this.validateInitialPosition(data.position));
  }

  ngOnInit(): void {
    if (!this.position.coordinates || this.position.coordinates.length !== 2) {
      this.position = { ...this.defaultPosition };
    }
    this.validatePosition();
    
    // Notificar al sistema que el selector de posición está activo
    this.networkStateService.setPositionSelectionActive(true);
    
    this.cdr.markForCheck();
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.initializeMap(), 0);
    
    // Escuchar eventos de teclado para accesibilidad
    this.setupKeyboardNavigation();
  }

  ngOnDestroy(): void {
    // Notificar al sistema que el selector de posición está inactivo
    this.networkStateService.setPositionSelectionActive(false);
    
    this.destroy$.next();
    this.destroy$.complete();
    this.mapService.destroyMap();
  }

  private validateInitialPosition(position: GeographicPosition): GeographicPosition {
    if (!position || !position.coordinates || position.coordinates.length !== 2) {
      return { ...this.defaultPosition };
    }
    
    // Validar que las coordenadas estén dentro de los rangos permitidos
    const [lng, lat] = position.coordinates;
    
    if (
      isNaN(lng) || 
      isNaN(lat) || 
      lng < MIN_LONGITUDE || 
      lng > MAX_LONGITUDE || 
      lat < MIN_LATITUDE || 
      lat > MAX_LATITUDE
    ) {
      console.warn('Coordenadas iniciales inválidas, usando posición por defecto');
      return { ...this.defaultPosition };
    }
    
    return { ...position };
  }

  private convertToExtendedPosition(position: GeographicPosition): ExtendedPosition {
    const coords = position.coordinates ?? [this.defaultPosition.lng, this.defaultPosition.lat];
    return {
      ...position,
      lng: coords[0],
      lat: coords[1]
    };
  }

  // Actualiza las coordenadas cuando cambian lat/lng en la interfaz
  updateCoordinates(): void {
    // Validar que los valores sean números válidos
    if (isNaN(this.position.lat) || isNaN(this.position.lng)) {
      this.error = 'Las coordenadas deben ser valores numéricos';
      this.isValidPosition = false;
      this.cdr.markForCheck();
      return;
    }
    
    // Validar rangos de coordenadas
    if (
      this.position.lat < MIN_LATITUDE || 
      this.position.lat > MAX_LATITUDE || 
      this.position.lng < MIN_LONGITUDE || 
      this.position.lng > MAX_LONGITUDE
    ) {
      this.error = `Coordenadas fuera de rango. Latitud debe estar entre ${MIN_LATITUDE} y ${MAX_LATITUDE}, Longitud entre ${MIN_LONGITUDE} y ${MAX_LONGITUDE}`;
      this.isValidPosition = false;
      this.cdr.markForCheck();
      return;
    }
    
    // Formatear a 6 decimales para consistencia
    this.position.lat = parseFloat(this.position.lat.toFixed(6));
    this.position.lng = parseFloat(this.position.lng.toFixed(6));
    
    this.position.coordinates = [this.position.lng, this.position.lat];
    this.validatePosition();
    this.mapService.updateMarkerPosition(this.position);
    
    // Mostrar notificación sutil de actualización
    if (this.isValidPosition) {
      this.showSuccessToast('Coordenadas actualizadas');
    }
    
    this.cdr.markForCheck();
  }

  private setupKeyboardNavigation(): void {
    // Implementar navegación accesible para el mapa
    if (this.mapContainer && this.mapContainer.nativeElement) {
      fromEvent<KeyboardEvent>(this.mapContainer.nativeElement, 'keydown')
        .pipe(
          takeUntil(this.destroy$),
          filter(event => ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key))
        )
        .subscribe(event => {
          event.preventDefault();
          
          // Mover el marcador con las flechas
          const step = 0.0001; // Paso pequeño para movimiento preciso
          let lat = this.position.lat;
          let lng = this.position.lng;
          
          switch (event.key) {
            case 'ArrowUp': lat += step; break;
            case 'ArrowDown': lat -= step; break;
            case 'ArrowLeft': lng -= step; break;
            case 'ArrowRight': lng += step; break;
          }
          
          this.position.lat = lat;
          this.position.lng = lng;
          this.updateCoordinates();
        });
    }
  }

  private initializeMap(): void {
    try {
      if (!this.mapContainer || !this.mapContainer.nativeElement) {
        throw new Error('Contenedor del mapa no disponible');
      }
      
      // Inicializar el mapa con la posición actual
      if (typeof this.mapService.initializeMap === 'function') {
        this.mapService.initializeMap(this.mapContainer.nativeElement, this.position);
        
        // Configurar eventos del mapa
        this.setupMapEvents();
        
        // Mostrar mensaje de éxito cuando el mapa está listo
        this.showSuccessToast('Mapa cargado correctamente');
        this.mapInitialized = true;
        this.cdr.markForCheck();
      } else {
        throw new Error('Método initializeMap no disponible en el servicio de mapa');
      }
    } catch (error) {
      console.error('Error al inicializar el mapa:', error);
      this.error = error instanceof Error ? error.message : 'Error al inicializar el mapa';
      this.snackBar.open('Error al cargar el mapa. Por favor, intente nuevamente.', 'Cerrar', {
        duration: 5000,
        panelClass: ['error-snackbar']
      });
      this.cdr.markForCheck();
    }
  }

  private setupMapEvents(): void {
    try {
      // Configurar evento de clic en el mapa
      if (typeof this.mapService.onMapClick === 'function') {
        this.mapService.onMapClick((position) => {
          this.updatePosition(position);
          // Proporcionar retroalimentación táctil o visual
          this.pulseMarker();
          this.cdr.markForCheck();
        });
      }
      
      // Configurar evento de arrastre de marcador
      if (typeof this.mapService.onMarkerDragEnd === 'function') {
        this.mapService.onMarkerDragEnd((position) => {
          this.updatePosition(position);
          this.showSuccessToast('Posición actualizada');
          this.cdr.markForCheck();
        });
      }
      
      // Suscribirse a cambios en el zoom
      if (typeof this.mapService.onZoomChange === 'function') {
        this.mapService.onZoomChange()
          .pipe(takeUntil(this.destroy$))
          .subscribe(zoom => {
            this.mapInitialized = true;
            this.cdr.markForCheck();
          });
      }
    } catch (error) {
      console.error('Error al configurar eventos del mapa:', error);
    }
  }

  private updatePosition(position: GeographicPosition): void {
    this.position = this.convertToExtendedPosition(position);
    // Formatear a 6 decimales para consistencia
    this.position.lat = parseFloat(this.position.lat.toFixed(6));
    this.position.lng = parseFloat(this.position.lng.toFixed(6));
    this.position.coordinates = [this.position.lng, this.position.lat];
    
    this.validatePosition();
    this.cdr.markForCheck();
  }

  private validatePosition(): void {
    // Primero verificamos que esté dentro de los límites generales
    const isWithinBounds = this.networkDesignService.validatePosition(this.position);
    
    // Luego verificamos si está dentro de República Dominicana
    const isInDR = this.isWithinDominicanRepublic();
    
    this.isValidPosition = isWithinBounds && isInDR;
    
    if (!isWithinBounds) {
      this.error = 'La posición seleccionada está fuera de los límites permitidos';
    } else if (!isInDR) {
      this.error = 'La posición debe estar dentro del territorio de República Dominicana';
    } else {
      this.error = null;
    }
    
    this.cdr.markForCheck();
  }

  async searchLocation(): Promise<void> {
    if (!this.searchQuery.trim()) return;

    this.loading = true;
    this.error = null;
    this.cdr.markForCheck();

    try {
      const position = await this.mapService.searchLocation(this.searchQuery);
      if (position) {
        this.updatePosition(position);
        
        if (!this.isValidPosition) {
          if (!this.isWithinDominicanRepublic()) {
            throw new Error('La ubicación está fuera de República Dominicana');
          } else {
            throw new Error('La ubicación está fuera de los límites permitidos');
          }
        }
        
        // Éxito - mostrar mensaje
        this.showSuccessToast('Ubicación encontrada');
      } else {
        throw new Error('No se encontró la ubicación');
      }
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'Error al buscar la ubicación';
      this.snackBar.open(this.error, 'Cerrar', {
        duration: 4000,
        panelClass: ['error-snackbar']
      });
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  centerMap(): void {
    this.mapService.centerMap();
    this.showSuccessToast('Mapa centrado');
  }

  zoomIn(): void {
    this.mapService.zoomIn();
  }

  zoomOut(): void {
    this.mapService.zoomOut();
  }

  onConfirm(): void {
    if (!this.isValidPosition) {
      this.error = 'La posición seleccionada no es válida';
      this.snackBar.open(this.error, 'Cerrar', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    try {
      // Usar la función utilitaria para crear la posición geográfica
      const result = createPosition(
        [this.position.lng, this.position.lat],
        { altitude: this.position.altitude }
      );

      // Notificar la selección de posición antes de cerrar
      this.networkStateService.setSelectedPosition(result);
      
      // Mostrar animación de éxito en el marcador antes de cerrar
      this.pulseMarker();
      
      // Cerrar con el resultado después de una breve animación
      setTimeout(() => {
        this.dialogRef.close(result);
      }, 300);
    } catch (error) {
      console.error('Error al confirmar posición:', error);
      this.snackBar.open('Error al procesar coordenadas', 'Cerrar', { 
        duration: 3000,
        panelClass: ['error-snackbar']
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  getCoordinatesString(): string {
    return `${this.position.lat.toFixed(6)}, ${this.position.lng.toFixed(6)}`;
  }

  isWithinDominicanRepublic(): boolean {
    return (
      this.position.lat >= DR_BOUNDS.south &&
      this.position.lat <= DR_BOUNDS.north &&
      this.position.lng >= DR_BOUNDS.west &&
      this.position.lng <= DR_BOUNDS.east
    );
  }

  getMapAriaLabel(): string {
    return `Mapa interactivo. Haga clic para seleccionar ubicación. Posición actual: ${this.getCoordinatesString()}`;
  }

  getStatusText(): string {
    return this.isWithinDominicanRepublic()
      ? 'Posición válida dentro de República Dominicana'
      : 'Posición inválida, fuera de República Dominicana';
  }
  
  private showSuccessToast(message: string): void {
    this.snackBar.open(message, '', {
      duration: 2000,
      panelClass: ['success-snackbar'],
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });
  }
  
  private pulseMarker(): void {
    // Esta función se comunica con el servicio de mapa para animar el marcador
    try {
      // Verificar si el método existe antes de llamarlo
      if (typeof (this.mapService as any).pulseMarker === 'function') {
        (this.mapService as any).pulseMarker();
      } else if (typeof this.mapService.centerMap === 'function') {
        // Alternativa - simplemente centrar el mapa en el marcador para dar feedback
        this.mapService.centerMap();
      }
    } catch (error) {
      console.warn('La animación del marcador no está disponible:', error);
    }
  }
}
