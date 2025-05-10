import { Injectable } from '@angular/core';
import { LoggerService } from '../../../core/services/logger.service';
import { NetworkElement } from '../../../shared/types/network.types';

export interface Cluster {
  id: string;
  elements: NetworkElement[];
  centroid: {x: number, y: number};
  radius: number;
  count: number;
}

export interface ClusteringOptions {
  enabled: boolean;
  maxDistance: number;
  minZoomLevel: number;
  maxElementsPerCluster: number;
}

@Injectable({
  providedIn: 'root'
})
export class ElementClusteringService {
  // Configuración por defecto
  private options: ClusteringOptions = {
    enabled: true,
    maxDistance: 50,
    minZoomLevel: 0.7,
    maxElementsPerCluster: 50
  };
  
  // Estado actual
  private currentZoomLevel = 1;
  private cachedClusters = new Map<string, Cluster>();
  private lastClusterTimestamp = 0;
  
  constructor(private logger: LoggerService) {}
  
  /**
   * Configura las opciones de clustering
   */
  setOptions(options: Partial<ClusteringOptions>): void {
    this.options = { ...this.options, ...options };
    this.logger.debug('Opciones de clustering actualizadas:', this.options);
    this.invalidateCache();
  }
  
  /**
   * Actualiza el nivel de zoom actual
   */
  setZoomLevel(zoomLevel: number): void {
    const normalizedZoom = zoomLevel / 100; // Convertir de porcentaje a factor
    if (Math.abs(this.currentZoomLevel - normalizedZoom) > 0.05) {
      this.currentZoomLevel = normalizedZoom;
      this.invalidateCache();
    }
  }
  
  /**
   * Invalida la caché de clusters
   */
  invalidateCache(): void {
    this.cachedClusters.clear();
    this.lastClusterTimestamp = 0;
  }
  
  /**
   * Determina si el clustering debe estar activo según el zoom actual
   */
  isClusteringActive(): boolean {
    return this.options.enabled && this.currentZoomLevel < this.options.minZoomLevel;
  }
  
  /**
   * Genera clusters a partir de los elementos proporcionados
   */
  generateClusters(elements: NetworkElement[]): Cluster[] {
    // Si el clustering no está activo, retornar clusters individuales
    if (!this.isClusteringActive()) {
      return this.createIndividualClusters(elements);
    }
    
    // Verificar si podemos usar la caché
    const currentTime = Date.now();
    if (this.lastClusterTimestamp > 0 && 
        this.cachedClusters.size > 0 && 
        currentTime - this.lastClusterTimestamp < 2000) {
      return Array.from(this.cachedClusters.values());
    }
    
    // Crear nuevos clusters
    const clusters = this.clusterElements(elements);
    
    // Actualizar caché
    this.cachedClusters.clear();
    clusters.forEach(cluster => {
      this.cachedClusters.set(cluster.id, cluster);
    });
    this.lastClusterTimestamp = currentTime;
    
    return clusters;
  }
  
  /**
   * Crea clusters individuales para cada elemento
   */
  private createIndividualClusters(elements: NetworkElement[]): Cluster[] {
    return elements.map(element => {
      // Extraer coordenadas del elemento
      const x = element.position?.coordinates?.[0] || 0;
      const y = element.position?.coordinates?.[1] || 0;
      
      return {
        id: `single-${element.id}`,
        elements: [element],
        centroid: {x, y},
        radius: 15,
        count: 1
      };
    });
  }
  
  /**
   * Realiza el clustering de elementos basado en distancia
   */
  private clusterElements(elements: NetworkElement[]): Cluster[] {
    const clusters: Cluster[] = [];
    const processedIds = new Set<string>();
    
    // Ordenar elementos para procesamiento estable
    const sortedElements = [...elements].sort((a, b) => a.id.localeCompare(b.id));
    
    // Para cada elemento no procesado
    for (const element of sortedElements) {
      if (processedIds.has(element.id)) continue;
      
      // Coordenadas del elemento
      const elementX = element.position?.coordinates?.[0] || 0;
      const elementY = element.position?.coordinates?.[1] || 0;
      
      // Iniciar nuevo cluster
      const clusterElements: NetworkElement[] = [element];
      processedIds.add(element.id);
      
      // Encontrar elementos cercanos
      for (const candidate of sortedElements) {
        if (processedIds.has(candidate.id) || candidate.id === element.id) continue;
        
        // Coordenadas del candidato
        const candidateX = candidate.position?.coordinates?.[0] || 0;
        const candidateY = candidate.position?.coordinates?.[1] || 0;
        
        // Calcular distancia
        const dx = elementX - candidateX;
        const dy = elementY - candidateY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Si está dentro de la distancia máxima, añadir al cluster
        if (distance <= this.options.maxDistance) {
          clusterElements.push(candidate);
          processedIds.add(candidate.id);
          
          // Limitar tamaño del cluster
          if (clusterElements.length >= this.options.maxElementsPerCluster) {
            break;
          }
        }
      }
      
      // Solo crear cluster si tiene más de un elemento
      if (clusterElements.length > 1 || !this.options.enabled) {
        // Calcular centroide
        let sumX = 0, sumY = 0;
        clusterElements.forEach(e => {
          sumX += e.position?.coordinates?.[0] || 0;
          sumY += e.position?.coordinates?.[1] || 0;
        });
        
        const centroidX = sumX / clusterElements.length;
        const centroidY = sumY / clusterElements.length;
        
        // Calcular radio (máxima distancia desde el centroide)
        let maxDistance = 0;
        clusterElements.forEach(e => {
          const elemX = e.position?.coordinates?.[0] || 0;
          const elemY = e.position?.coordinates?.[1] || 0;
          
          const dx = centroidX - elemX;
          const dy = centroidY - elemY;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          maxDistance = Math.max(maxDistance, distance);
        });
        
        // Crear cluster con radio mínimo de 20
        const clusterId = `cluster-${clusterElements[0].id}`;
        clusters.push({
          id: clusterId,
          elements: clusterElements,
          centroid: {x: centroidX, y: centroidY},
          radius: Math.max(20, maxDistance),
          count: clusterElements.length
        });
      } else {
        // Crear cluster individual
        const element = clusterElements[0];
        clusters.push({
          id: `single-${element.id}`,
          elements: [element],
          centroid: {
            x: element.position?.coordinates?.[0] || 0,
            y: element.position?.coordinates?.[1] || 0
          },
          radius: 15,
          count: 1
        });
      }
    }
    
    return clusters;
  }
  
  /**
   * Determina a qué cluster pertenece un elemento
   */
  getClusterForElement(elementId: string): Cluster | null {
    for (const cluster of this.cachedClusters.values()) {
      if (cluster.elements.some(element => element.id === elementId)) {
        return cluster;
      }
    }
    return null;
  }
  
  /**
   * Obtiene todos los elementos de un cluster
   */
  getElementsInCluster(clusterId: string): NetworkElement[] {
    const cluster = this.cachedClusters.get(clusterId);
    return cluster ? cluster.elements : [];
  }
} 