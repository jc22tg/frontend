/**
 * Utilidades de migración para la integración de common-definitions
 * Este archivo contiene helpers temporales para facilitar la migración
 */

import { createGeographicPosition, type GeographicPosition } from '../types/geographic-position';

/**
 * Convierte un objeto {lat, lng} al nuevo formato GeographicPosition
 * Función helper para la migración
 */
export function migrateLatLngToPosition(latLng: { lat: number; lng: number }): GeographicPosition {
  return createGeographicPosition(latLng.lat, latLng.lng);
}

/**
 * Convierte múltiples objetos lat/lng
 */
export function migrateLatLngArray(latLngArray: { lat: number; lng: number }[]): GeographicPosition[] {
  return latLngArray.map(migrateLatLngToPosition);
}

/**
 * Helper para crear posiciones comunes
 */
export const CommonPositions = {
  origin: () => createGeographicPosition(0, 0),
  domincanRepublic: () => createGeographicPosition(18.735693, -70.162651),
  santo_domingo: () => createGeographicPosition(18.4821, -69.9312)
};
