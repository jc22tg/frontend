/**
 * Interfaz de posición geográfica compatible con frontend y backend
 * Soporta tanto el formato GeoJSON como el formato lat/lng del frontend
 */

/**
 * Definición base que será compatible con common-definitions cuando esté disponible
 */
interface BaseGeographicPosition {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
  altitude?: number;
}

/**
 * Interfaz que combina backend (GeoJSON) y frontend (lat/lng)
 */
export interface GeographicPosition extends BaseGeographicPosition {
  // Propiedades adicionales para compatibilidad con frontend
  lat: number;
  lng: number;
}

/**
 * Crea una posición geográfica compatible con ambos sistemas
 */
export function createGeographicPosition(lat: number, lng: number, altitude?: number): GeographicPosition {
  return {
    type: 'Point',
    coordinates: [lng, lat], // GeoJSON: [longitude, latitude]
    altitude,
    lat,  // Frontend format
    lng   // Frontend format
  };
}

/**
 * Convierte de formato GeoJSON a formato frontend
 */
export function fromGeoJSON(geoJson: BaseGeographicPosition): GeographicPosition {
  const [lng, lat] = geoJson.coordinates;
  return {
    ...geoJson,
    lat,
    lng
  };
}

/**
 * Convierte de formato frontend a GeoJSON
 */
export function toGeoJSON(position: { lat: number; lng: number; altitude?: number }): BaseGeographicPosition {
  return {
    type: 'Point',
    coordinates: [position.lng, position.lat],
    altitude: position.altitude
  };
}
