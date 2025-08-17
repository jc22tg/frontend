/**
 * Importaciones centralizadas de common-definitions
 * Este archivo maneja la migración gradual desde tipos locales a common-definitions
 * Usando importación desde el index principal como fallback
 */

// Importar desde el archivo shared que ya funciona
import * as CommonDefs from '../common-definitions';

// Crear mapeo de tipos para migración
export const CommonTypes = {
  // Placeholder hasta que las importaciones directas funcionen
  ElementType: {
    DEVICE: 'DEVICE',
    CABLE: 'CABLE',
    CONNECTOR: 'CONNECTOR',
    PORT: 'PORT',
    SPLITTER: 'SPLITTER',
    AMPLIFIER: 'AMPLIFIER',
    SWITCH: 'SWITCH',
    OPTICAL_SWITCH: 'OPTICAL_SWITCH',
    ROUTER: 'ROUTER',
    OLT: 'OLT',
    ONT: 'ONT',
    ODF: 'ODF',
    FDP: 'FDP',
    CHAMBER: 'CHAMBER',
    POLE: 'POLE',
    BUILDING: 'BUILDING',
    FIBER_CONNECTION: 'FIBER_CONNECTION'
  } as const,
  
  ElementStatus: {
    ACTIVE: 'ACTIVE',
    INACTIVE: 'INACTIVE',
    MAINTENANCE: 'MAINTENANCE',
    FAULT: 'FAULT',
    TESTING: 'TESTING',
    OPERATIONAL: 'OPERATIONAL',
    NON_OPERATIONAL: 'NON_OPERATIONAL',
    DEGRADED: 'DEGRADED',
    UNKNOWN: 'UNKNOWN'
  } as const,
  
  FiberType: {
    SINGLE_MODE: 'SINGLE_MODE',
    MULTI_MODE: 'MULTI_MODE'
  } as const,
  
  CableType: {
    FEEDER: 'FEEDER',
    DISTRIBUTION: 'DISTRIBUTION',
    DROP: 'DROP'
  } as const
};

// Alias para compatibilidad
export type CommonElementType = keyof typeof CommonTypes.ElementType;
export type CommonElementStatus = keyof typeof CommonTypes.ElementStatus;
export type CommonFiberType = keyof typeof CommonTypes.FiberType;
export type CommonCableType = keyof typeof CommonTypes.CableType;

// Adapter para GeographicPosition básico
export interface UnifiedGeographicPosition {
  // Formato backend (GeoJSON style)
  latitude?: number;
  longitude?: number;
  altitude?: number;
  
  // Formato frontend (Leaflet style)  
  lat: number;
  lng: number;
  
  // Formato GeoJSON completo
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

/**
 * Helper para crear posición unificada desde lat/lng simples
 */
export function createUnifiedPosition(lat: number, lng: number, altitude?: number): UnifiedGeographicPosition {
  return {
    latitude: lat,
    longitude: lng,
    altitude,
    lat,
    lng,
    type: 'Point',
    coordinates: [lng, lat]
  };
}
