/**
 * Helper de migración para GeographicPosition
 * Este archivo facilita la transición entre el formato frontend {lat, lng} 
 * y el formato backend usado en common-definitions
 */

import { createUnifiedPosition, UnifiedGeographicPosition } from '../types/common-imports';

/**
 * Convierte un objeto simple {lat, lng} al formato unificado
 * Utilizado para migrar el código existente
 */
export function migrateLatLngToUnified(latLng: { lat: number; lng: number }): UnifiedGeographicPosition {
  return createUnifiedPosition(latLng.lat, latLng.lng);
}

/**
 * Array de helpers para conversión masiva
 */
export function migrateLatLngArrayToUnified(latLngArray: { lat: number; lng: number }[]): UnifiedGeographicPosition[] {
  return latLngArray.map(migrateLatLngToUnified);
}

/**
 * Convierte formato unificado a formato simple {lat, lng} para compatibilidad con Leaflet
 */
export function unifiedToLatLng(position: UnifiedGeographicPosition): { lat: number; lng: number } {
  return {
    lat: position.lat,
    lng: position.lng
  };
}

/**
 * Posiciones comunes para República Dominicana (para testing y defaults)
 */
export const DefaultPositions = {
  origin: () => createUnifiedPosition(0, 0),
  santoMingo: () => createUnifiedPosition(18.4821, -69.9312),
  santiago: () => createUnifiedPosition(19.4516, -70.6977),
  laRomana: () => createUnifiedPosition(18.4273, -68.9728),
  puertoPlata: () => createUnifiedPosition(19.7892, -70.6929),
  barahona: () => createUnifiedPosition(18.2085, -71.1009)
};

/**
 * Validador para posiciones en República Dominicana
 */
export function isValidDominicanPosition(position: { lat: number; lng: number }): boolean {
  const DR_BOUNDS = {
    north: 19.93,
    south: 17.47,
    west: -72.01,
    east: -68.32
  };
  
  return position.lat >= DR_BOUNDS.south && 
         position.lat <= DR_BOUNDS.north &&
         position.lng >= DR_BOUNDS.west && 
         position.lng <= DR_BOUNDS.east;
}

/**
 * Corrige posiciones inválidas usando el centro de República Dominicana
 */
export function correctInvalidPosition(position: { lat: number; lng: number }): UnifiedGeographicPosition {
  if (isValidDominicanPosition(position)) {
    return createUnifiedPosition(position.lat, position.lng);
  }
  
  console.warn('Posición inválida corregida a Santo Domingo:', position);
  return DefaultPositions.santoMingo();
}
