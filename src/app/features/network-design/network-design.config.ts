import { InjectionToken } from '@angular/core';

/**
 * Configuración del módulo de diseño de red
 */
export interface NetworkDesignConfig {
  /**
   * Configuración del mapa
   */
  map: {
    /**
     * Nivel de zoom inicial
     */
    initialZoom: number;
    /**
     * Centro inicial del mapa [lat, lng]
     */
    initialCenter: [number, number];
    /**
     * Límites de zoom [min, max]
     */
    zoomLimits: [number, number];
    /**
     * URL del tile layer
     */
    tileLayerUrl: string;
  };

  /**
   * Configuración de elementos
   */
  elements: {
    /**
     * Tamaño de los elementos en el mapa
     */
    size: {
      /**
       * Tamaño mínimo
       */
      min: number;
      /**
       * Tamaño máximo
       */
      max: number;
    };
    /**
     * Colores por tipo de elemento
     */
    colors: Record<string, string>;
  };

  /**
   * Configuración de monitoreo
   */
  monitoring: {
    /**
     * Intervalo de actualización en milisegundos
     */
    updateInterval: number;
    /**
     * Umbrales de alerta
     */
    thresholds: Record<string, number>;
  };

  /**
   * Configuración de animaciones
   */
  animations: {
    /**
     * Duración de las animaciones en milisegundos
     */
    duration: number;
    /**
     * Curva de animación
     */
    easing: string;
  };
}

/**
 * Valores por defecto de la configuración
 */
export const DEFAULT_NETWORK_DESIGN_CONFIG: NetworkDesignConfig = {
  map: {
    initialZoom: 16,
    initialCenter: [19.783750, -70.676666],
    zoomLimits: [5, 18],
    tileLayerUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
  },
  elements: {
    size: {
      min: 5,
      max: 20
    },
    colors: {
      OLT: '#4CAF50',
      ONT: '#2196F3',
      ODF: '#FFC107',
      EDFA: '#9C27B0',
      SPLITTER: '#FF5722',
      MANGA: '#607D8B',
      TERMINAL_BOX: '#FF9800',
      SLACK_FIBER: '#80DEEA'
    }
  },
  monitoring: {
    updateInterval: 5000,
    thresholds: {
      bandwidth: 80,
      latency: 100,
      packetLoss: 5,
      temperature: 45,
      power: 90
    }
  },
  animations: {
    duration: 300,
    easing: 'ease-in-out'
  }
};

/**
 * Token de inyección para la configuración
 */
export const NETWORK_DESIGN_CONFIG = new InjectionToken<NetworkDesignConfig>('NetworkDesignConfig'); 
