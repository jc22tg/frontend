/**
 * Configuración de entorno para producción
 */
export const environment = {
  production: true,
  apiUrl: '/api',
  mapbox: {
    accessToken: 'pk.placeholder_token_for_production',
    style: 'mapbox://styles/mapbox/streets-v11'
  },
  defaultMapCenter: {
    lat: 18.735693,
    lng: -70.162651
  },
  defaultMapZoom: 8,
  featureFlags: {
    enableMockData: false,
    enableOfflineMode: true,
    enableDebugTools: false
  }
}; 