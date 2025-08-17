/**
 * Interfaces y utilidades para la manipulación de coordenadas geográficas
 * Este archivo centraliza todas las definiciones relacionadas con posiciones geográficas
 */

// Re-exportar la nueva definición compatible
export type { GeographicPosition } from './geographic-position';
export { createGeographicPosition, fromGeoJSON, toGeoJSON } from './geographic-position';
import { createGeographicPosition as _createGeographicPosition } from './geographic-position';

/**
 * Alias para mantener compatibilidad con código existente
 * @deprecated Usar GeographicPosition en su lugar
 */
export type GeoPosition = import('./geographic-position').GeographicPosition;

/**
 * Crea un objeto de posición geográfica validado
 * @param coordinates - Arreglo [longitude, latitude]
 * @param options - Opciones adicionales
 * @returns GeographicPosition
 */
export function createPosition(
  coordinates: [number, number],
  options: { altitude?: number } = {}
): import('./geographic-position').GeographicPosition {
  // Validar coordenadas
  const [longitude, latitude] = coordinates;
  
  if (isNaN(longitude) || isNaN(latitude)) {
    throw new Error('Las coordenadas deben ser valores numéricos');
  }
  
  if (longitude < -180 || longitude > 180) {
    throw new Error('La longitud debe estar entre -180 y 180');
  }
  
  if (latitude < -90 || latitude > 90) {
    throw new Error('La latitud debe estar entre -90 y 90');
  }

  return _createGeographicPosition(latitude, longitude, options.altitude);
}

/**
 * Convierte GeographicPosition a formato {lat, lng}
 * @param position - Posición geográfica
 * @returns Objeto con lat y lng
 */
export function toLatLng(position: import('./geographic-position').GeographicPosition): { lat: number; lng: number } {
  return {
    lat: position.lat,
    lng: position.lng
  };
}

/**
 * Convierte de formato {lat, lng} a GeographicPosition
 * @param latLng - Objeto con lat y lng
 * @returns GeographicPosition
 */
export function fromLatLng(latLng: { lat: number; lng: number }): import('./geographic-position').GeographicPosition {
  return _createGeographicPosition(latLng.lat, latLng.lng);
}

/**
 * Calcula la distancia entre dos posiciones geográficas usando la fórmula Haversine
 * @param position1 - Primera posición
 * @param position2 - Segunda posición
 * @returns Distancia en metros
 */
export function calculateDistance(
  position1: import('./geographic-position').GeographicPosition,
  position2: import('./geographic-position').GeographicPosition
): number {
  const R = 6371000; // Radio de la Tierra en metros
  const lat1Rad = position1.lat * Math.PI / 180;
  const lat2Rad = position2.lat * Math.PI / 180;
  const deltaLatRad = (position2.lat - position1.lat) * Math.PI / 180;
  const deltaLngRad = (position2.lng - position1.lng) * Math.PI / 180;

  const a = Math.sin(deltaLatRad/2) * Math.sin(deltaLatRad/2) +
            Math.cos(lat1Rad) * Math.cos(lat2Rad) *
            Math.sin(deltaLngRad/2) * Math.sin(deltaLngRad/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
}

/**
 * Valida si una posición está dentro de los límites válidos
 * @param position - Posición a validar
 * @returns true si es válida
 */
export function isValidPosition(position: any): position is import('./geographic-position').GeographicPosition {
  return position &&
         typeof position.lat === 'number' &&
         typeof position.lng === 'number' &&
         position.lat >= -90 && position.lat <= 90 &&
         position.lng >= -180 && position.lng <= 180;
} 
