import { Injectable } from '@angular/core';
import { GeographicPosition } from '../../../shared/types/geo-position';

@Injectable({
  providedIn: 'root'
})
export class GeoUtilsService {
  // Límites de la República Dominicana
  private readonly DOMINICAN_REPUBLIC_BOUNDS = {
    north: 19.9,
    south: 17.5,
    east: -68.3,
    west: -72.0
  };

  /**
   * Valida si una posición está dentro de los límites de la República Dominicana
   */
  validatePosition(position: GeographicPosition): boolean {
    if (!position.coordinates || position.coordinates.length !== 2) {
      return false;
    }
    
    return (
      position.coordinates[1] >= this.DOMINICAN_REPUBLIC_BOUNDS.south &&
      position.coordinates[1] <= this.DOMINICAN_REPUBLIC_BOUNDS.north &&
      position.coordinates[0] >= this.DOMINICAN_REPUBLIC_BOUNDS.west &&
      position.coordinates[0] <= this.DOMINICAN_REPUBLIC_BOUNDS.east
    );
  }

  /**
   * Calcula la distancia entre dos puntos usando la fórmula de Haversine
   */
  calculateDistance(point1: GeographicPosition, point2: GeographicPosition): number {
    if (!point1.coordinates || !point2.coordinates || 
        point1.coordinates.length !== 2 || point2.coordinates.length !== 2) {
      // Si no hay coordenadas disponibles, usar lat/lng directamente
      return this.calculateDistanceFromLatLng(
        point1.lat, point1.lng, 
        point2.lat, point2.lng
      );
    }
    
    const R = 6371; // Radio de la Tierra en km
    const dLat = this.toRad(point2.coordinates[1] - point1.coordinates[1]);
    const dLon = this.toRad(point2.coordinates[0] - point1.coordinates[0]);
    const lat1 = this.toRad(point1.coordinates[1]);
    const lat2 = this.toRad(point2.coordinates[1]);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
  
  /**
   * Calcula la distancia usando los valores de lat/lng directamente
   */
  private calculateDistanceFromLatLng(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Radio de la Tierra en km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lng2 - lng1);
    const radLat1 = this.toRad(lat1);
    const radLat2 = this.toRad(lat2);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(radLat1) * Math.cos(radLat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Convierte grados a radianes
   */
  private toRad(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }

  /**
   * Calcula el punto medio entre dos posiciones
   */
  calculateMidpoint(point1: GeographicPosition, point2: GeographicPosition): GeographicPosition {
    // Obtener las coordenadas, o usar lat/lng si no están disponibles
    const lng1 = point1.coordinates?.[0] ?? point1.lng;
    const lat1 = point1.coordinates?.[1] ?? point1.lat;
    const lng2 = point2.coordinates?.[0] ?? point2.lng;
    const lat2 = point2.coordinates?.[1] ?? point2.lat;
    
    const midLng = (lng1 + lng2) / 2;
    const midLat = (lat1 + lat2) / 2;
    
    return {
      type: 'Point',
      coordinates: [midLng, midLat],
      lat: midLat,
      lng: midLng
    };
  }

  /**
   * Verifica si un punto está dentro de un radio específico de otro punto
   */
  isPointInRadius(
    center: GeographicPosition,
    point: GeographicPosition,
    radiusKm: number
  ): boolean {
    return this.calculateDistance(center, point) <= radiusKm;
  }
} 
