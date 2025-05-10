import { Injectable } from '@angular/core';
import { ElementStatus, ElementType, GeographicPosition } from '../../../shared/types/network.types';

@Injectable({
  providedIn: 'root'
})
export class MapUtilsService {
  constructor() {}

  /**
   * Calcula la distancia entre dos puntos geográficos en metros
   */
  calculateDistance(point1: GeographicPosition, point2: GeographicPosition): number {
    if (!point1 || !point2) return 0;

    const lat1 = point1.coordinates[1];
    const lon1 = point1.coordinates[0];
    const lat2 = point2.coordinates[1];
    const lon2 = point2.coordinates[0];

    // Fórmula de Haversine para calcular distancia entre coordenadas
    const R = 6371000; // Radio de la Tierra en metros
    const φ1 = this.toRadians(lat1);
    const φ2 = this.toRadians(lat2);
    const Δφ = this.toRadians(lat2 - lat1);
    const Δλ = this.toRadians(lon2 - lon1);

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }

  /**
   * Convierte grados a radianes
   */
  private toRadians(degrees: number): number {
    return degrees * Math.PI / 180;
  }

  /**
   * Obtiene el color para un tipo de elemento
   */
  getColorForElementType(type: ElementType): string {
    switch (type) {
      case ElementType.FDP:
        return '#2196f3';
      case ElementType.OLT:
        return '#4caf50';
      case ElementType.ONT:
        return '#ff9800';
      case ElementType.SPLITTER:
        return '#9c27b0';
      case ElementType.EDFA:
        return '#f44336';
      case ElementType.MANGA:
        return '#795548';
      default:
        return '#757575';
    }
  }

  /**
   * Obtiene el color para un estado de elemento
   */
  getColorForElementStatus(status: ElementStatus): string {
    switch (status) {
      case ElementStatus.ACTIVE:
        return '#4caf50';
      case ElementStatus.WARNING:
        return '#ff9800';
      case ElementStatus.CRITICAL:
        return '#f44336';
      case ElementStatus.INACTIVE:
        return '#9e9e9e';
      case ElementStatus.FAULT:
        return '#d32f2f';
      case ElementStatus.MAINTENANCE:
        return '#2196f3';
      default:
        return '#757575';
    }
  }

  /**
   * Genera un ID único
   */
  generateUniqueId(): string {
    return 'id-' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Redondea un número al decimal especificado
   */
  roundToDecimals(value: number, decimals = 2): number {
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
  }

  /**
   * Convierte una posición geográfica a un punto en el mapa
   */
  geoPositionToMapPoint(position: GeographicPosition): [number, number] {
    return [position.coordinates[1], position.coordinates[0]];
  }

  /**
   * Convierte un punto del mapa a posición geográfica
   */
  mapPointToGeoPosition(lat: number, lng: number): GeographicPosition {
    return {
      coordinates: [lng, lat],
      type: 'Point',
      lat: lat,
      lng: lng
    };
  }

  /**
   * Determina si dos posiciones están cercanas entre sí
   */
  arePositionsNear(pos1: GeographicPosition, pos2: GeographicPosition, threshold = 10): boolean {
    return this.calculateDistance(pos1, pos2) <= threshold;
  }
} 