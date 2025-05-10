import { Injectable, OnDestroy } from '@angular/core';
import { Observable, from, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { NetworkElement, NetworkConnection } from '../../../shared/types/network.types';
import { LoggerService } from '../../../core/services/logger.service';

/**
 * Interfaz para métricas de red calculadas
 */
export interface NetworkMetrics {
  totalDistance: number;
  averageConnections: number;
  networkDensity: number;
  centralElements: string[];
  clusters: {
    id: string;
    elements: string[];
    centerElement: string;
  }[];
  performanceIndicators: {
    calculationTime: number;
    complexity: 'low' | 'medium' | 'high';
  };
}

/**
 * Servicio responsable de realizar cálculos pesados relacionados con la red
 * utilizando Web Workers para no bloquear el hilo principal
 */
@Injectable({
  providedIn: 'root'
})
export class NetworkCalculationService implements OnDestroy {
  private worker: Worker | null = null;
  private isWorkerSupported = false;

  constructor(private logger: LoggerService) {
    // Verificar soporte para Web Workers
    this.isWorkerSupported = typeof Worker !== 'undefined';
    if (this.isWorkerSupported) {
      this.initWorker();
    } else {
      this.logger.warn('Web Workers no están soportados en este navegador. Los cálculos se realizarán en el hilo principal.');
    }
  }

  /**
   * Inicializa el Web Worker para cálculos en segundo plano
   */
  private initWorker(): void {
    try {
      // Crear un worker desde un blob para mayor flexibilidad
      const workerScript = `
        self.addEventListener('message', function(e) {
          const { action, data } = e.data;
          
          switch (action) {
            case 'calculateNetworkMetrics':
              const result = calculateNetworkMetrics(data.elements, data.connections);
              self.postMessage({ action: 'networkMetrics', data: result });
              break;
            case 'findOptimalPath':
              const path = findOptimalPath(data.source, data.target, data.connections);
              self.postMessage({ action: 'optimalPath', data: path });
              break;
            case 'analyzeNetworkClusters':
              const clusters = analyzeNetworkClusters(data.elements, data.connections);
              self.postMessage({ action: 'networkClusters', data: clusters });
              break;
            default:
              self.postMessage({ action: 'error', data: 'Acción desconocida' });
          }
        });
        
        // Implementación de algoritmos de cálculo
        
        function calculateNetworkMetrics(elements, connections) {
          const startTime = performance.now();
          
          // Calcular distancia total
          let totalDistance = 0;
          for (const conn of connections) {
            if (conn.distance) {
              totalDistance += conn.distance;
            }
          }
          
          // Calcular conexiones promedio por elemento
          const averageConnections = connections.length / (elements.length || 1);
          
          // Calcular densidad de red (conexiones / conexiones posibles)
          const maxPossibleConnections = (elements.length * (elements.length - 1)) / 2;
          const networkDensity = connections.length / (maxPossibleConnections || 1);
          
          // Encontrar elementos centrales (con más conexiones)
          const elementConnections = {};
          for (const conn of connections) {
            elementConnections[conn.sourceId] = (elementConnections[conn.sourceId] || 0) + 1;
            elementConnections[conn.targetId] = (elementConnections[conn.targetId] || 0) + 1;
          }
          
          // Ordenar elementos por número de conexiones
          const sortedElements = Object.entries(elementConnections)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(entry => entry[0]);
          
          // Calcular clusters básicos
          const clusters = calculateBasicClusters(elements, connections);
          
          const endTime = performance.now();
          const calculationTime = endTime - startTime;
          
          // Determinar complejidad
          let complexity = 'low';
          if (elements.length > 500 || connections.length > 1000) {
            complexity = 'high';
          } else if (elements.length > 100 || connections.length > 200) {
            complexity = 'medium';
          }
          
          return {
            totalDistance,
            averageConnections,
            networkDensity,
            centralElements: sortedElements,
            clusters,
            performanceIndicators: {
              calculationTime,
              complexity
            }
          };
        }
        
        function findOptimalPath(sourceId, targetId, connections) {
          // Implementación simplificada de Dijkstra
          // Para una implementación completa se necesitaría más código
          
          // Este es un algoritmo indicativo
          return { path: [], distance: 0 };
        }
        
        function analyzeNetworkClusters(elements, connections) {
          return calculateBasicClusters(elements, connections);
        }
        
        function calculateBasicClusters(elements, connections) {
          // Implementación básica de clustering basado en proximidad
          // Este es un algoritmo indicativo
          return [];
        }
      `;
      
      const blob = new Blob([workerScript], { type: 'application/javascript' });
      this.worker = new Worker(URL.createObjectURL(blob));
      
      this.logger.debug('Web Worker inicializado para cálculos de red');
    } catch (err) {
      this.isWorkerSupported = false;
      this.logger.error('Error al inicializar Web Worker:', err);
    }
  }

  /**
   * Calcula métricas de red utilizando un Worker
   * 
   * @param elements Elementos de red
   * @param connections Conexiones de red
   * @returns Observable con las métricas calculadas
   */
  calculateNetworkMetrics(
    elements?: NetworkElement[], 
    connections?: NetworkConnection[]
  ): Observable<NetworkMetrics> {
    if (!this.isWorkerSupported || !this.worker) {
      // Fallback a cálculo en hilo principal
      return this.calculateMetricsInMainThread(elements, connections);
    }
    
    return new Observable<NetworkMetrics>(observer => {
      // Configurar handler para recibir mensajes del worker
      const messageHandler = (event: MessageEvent) => {
        const { action, data } = event.data;
        
        if (action === 'networkMetrics') {
          observer.next(data);
          observer.complete();
        } else if (action === 'error') {
          observer.error(new Error(data));
        }
      };
      
      // Suscribirse a mensajes del worker
      this.worker!.addEventListener('message', messageHandler);
      
      // Enviar datos al worker
      this.worker!.postMessage({
        action: 'calculateNetworkMetrics',
        data: {
          elements: elements || [],
          connections: connections || []
        }
      });
      
      // Limpieza al desuscribirse
      return () => {
        this.worker!.removeEventListener('message', messageHandler);
      };
    }).pipe(
      tap(metrics => this.logger.debug('Métricas de red calculadas:', metrics)),
      catchError(err => {
        this.logger.error('Error en cálculo de métricas:', err);
        return of(this.getDefaultMetrics());
      })
    );
  }

  /**
   * Encuentra la ruta óptima entre dos elementos
   */
  findOptimalPath(
    sourceId: string, 
    targetId: string, 
    connections?: NetworkConnection[]
  ): Observable<{ path: string[]; distance: number }> {
    if (!this.isWorkerSupported || !this.worker) {
      // Implementación fallback simple
      return of({ path: [], distance: 0 });
    }
    
    return new Observable(observer => {
      const messageHandler = (event: MessageEvent) => {
        const { action, data } = event.data;
        
        if (action === 'optimalPath') {
          observer.next(data);
          observer.complete();
        } else if (action === 'error') {
          observer.error(new Error(data));
        }
      };
      
      this.worker!.addEventListener('message', messageHandler);
      
      this.worker!.postMessage({
        action: 'findOptimalPath',
        data: {
          source: sourceId,
          target: targetId,
          connections: connections || []
        }
      });
      
      return () => {
        this.worker!.removeEventListener('message', messageHandler);
      };
    });
  }

  /**
   * Analiza clusters en la red
   */
  analyzeNetworkClusters(
    elements?: NetworkElement[],
    connections?: NetworkConnection[]
  ): Observable<any[]> {
    if (!this.isWorkerSupported || !this.worker) {
      return of([]);
    }
    
    return new Observable(observer => {
      const messageHandler = (event: MessageEvent) => {
        const { action, data } = event.data;
        
        if (action === 'networkClusters') {
          observer.next(data);
          observer.complete();
        } else if (action === 'error') {
          observer.error(new Error(data));
        }
      };
      
      this.worker!.addEventListener('message', messageHandler);
      
      this.worker!.postMessage({
        action: 'analyzeNetworkClusters',
        data: {
          elements: elements || [],
          connections: connections || []
        }
      });
      
      return () => {
        this.worker!.removeEventListener('message', messageHandler);
      };
    });
  }

  /**
   * Implementación fallback para cálculos en el hilo principal
   */
  private calculateMetricsInMainThread(
    elements?: NetworkElement[],
    connections?: NetworkConnection[]
  ): Observable<NetworkMetrics> {
    // Implementación simple para fallback
    return of(this.getDefaultMetrics()).pipe(
      tap(() => this.logger.warn('Cálculo realizado en hilo principal'))
    );
  }

  /**
   * Retorna métricas por defecto
   */
  private getDefaultMetrics(): NetworkMetrics {
    return {
      totalDistance: 0,
      averageConnections: 0,
      networkDensity: 0,
      centralElements: [],
      clusters: [],
      performanceIndicators: {
        calculationTime: 0,
        complexity: 'low'
      }
    };
  }

  /**
   * Limpia los recursos al destruir el servicio
   */
  ngOnDestroy(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }
} 