/**
 * Configuración global de la aplicación
 * 
 * Este archivo centraliza todas las constantes de configuración
 * para mantener la consistencia en toda la aplicación.
 */
export const AppConfig = {
  api: {
    baseUrl: '/api/v1',
    timeout: 30000, // ms
    retryAttempts: 3,
    backendUrl: 'http://localhost:3000/api',
    maxPageSize: 100,
    defaultPageSize: 20
  },
  
  map: {
    initialZoom: 6,
    maxZoom: 18,
    minZoom: 4,
    defaultCenter: [0, 0],
    tileLayers: {
      default: {
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      },
      satellite: {
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
      },
      dark: {
        url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
      }
    },
    gridSize: 100, // pixels
    clusteringThreshold: 20, // elementos
    elementIcons: {
      size: {
        default: 32,
        small: 24,
        large: 48
      },
      scaleFactor: 1.2
    },
    debug: false, // Mostrar información de depuración en el mapa
    loadTimeout: 10000, // ms
    renderLimitPerFrame: 50 // elementos por frame
  },
  
  cache: {
    defaultExpiryTime: 5 * 60 * 1000, // 5 minutos
    storagePrefix: 'network-app-',
    maxLocalStorageSize: 5 * 1024 * 1024, // 5MB
    localStorageKeys: {
      user: 'user',
      theme: 'theme',
      elements: 'elements',
      elementTypes: 'element-types',
      mapState: 'map-state',
      mapPosition: 'map-position',
      lastProject: 'last-project'
    }
  },
  
  ui: {
    snackbarDuration: 3000,
    confirmDialogWidth: '400px',
    tooltipDelay: 500,
    animations: {
      enabled: true,
      duration: {
        short: 200,
        medium: 300,
        long: 500
      }
    },
    debounceTime: 300,
    themeModes: {
      light: 'light-theme',
      dark: 'dark-theme'
    },
    defaultLanguage: 'es',
    dateFormat: 'dd/MM/yyyy',
    dateTimeFormat: 'dd/MM/yyyy HH:mm'
  },
  
  features: {
    offlineMode: true,
    mapLayerSettings: true,
    elementHistory: true,
    connections: true,
    connectionTypes: true,
    projects: true,
    reports: true,
    monitoring: true,
    userManagement: true,
    networkGraph: true,
    batchOperations: true,
    importExport: true,
    diagnostics: true
  },
  
  debugging: {
    logLevel: 'info', // 'debug' | 'info' | 'warn' | 'error'
    enableDevTools: true,
    componentBoundaries: false, // Mostrar límites de componentes en desarrollo
    measurePerformance: true,
    trackMemory: false
  }
}; 
