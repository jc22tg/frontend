import { Routes } from '@angular/router';
import { MapContainerComponent } from './map-container.component';

/**
 * Configuración de rutas para el componente del contenedor del mapa.
 * Se utiliza para cargar el componente principal del mapa de forma perezosa.
 */
export const MAP_CONTAINER_ROUTES: Routes = [
  {
    path: '',
    component: MapContainerComponent
  }
]; 