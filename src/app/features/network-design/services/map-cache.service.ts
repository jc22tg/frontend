import { Injectable } from '@angular/core';
import { NetworkElement } from '../../../shared/types/network.types';

interface CachedPosition {
  x: number;
  y: number;
}

/**
 * Servicio para cachear elementos y posiciones del mapa
 * y mejorar el rendimiento evitando recálculos innecesarios
 */
@Injectable({
  providedIn: 'root'
})
export class MapCacheService {
  // Caché de elementos
  private elementsCache = new Map<string, NetworkElement>();
  
  // Caché de posiciones
  private positionsCache = new Map<string, CachedPosition>();
  
  // Cache expiry settings
  private cacheExpiry = 5 * 60 * 1000; // 5 minutes
  private lastCacheCleanup = Date.now();
  
  constructor() {
    // Setup cache cleanup interval
    setInterval(() => this.cleanupExpiredCache(), 60 * 1000); // Cleanup check every minute
  }
  
  /**
   * Get element from cache
   */
  getElement(id: string): NetworkElement | undefined {
    return this.elementsCache.get(id);
  }
  
  /**
   * Store element in cache
   */
  setElement(element: NetworkElement): void {
    this.elementsCache.set(element.id, element);
  }
  
  /**
   * Get position from cache
   */
  getPosition(id: string): CachedPosition | undefined {
    return this.positionsCache.get(id);
  }
  
  /**
   * Store position in cache
   */
  setPosition(id: string, position: CachedPosition): void {
    this.positionsCache.set(id, position);
  }
  
  /**
   * Clear cache for an element and its position
   */
  clearElementCache(id: string): void {
    this.elementsCache.delete(id);
    this.positionsCache.delete(id);
  }
  
  /**
   * Clear entire cache
   */
  clearCache(): void {
    this.elementsCache.clear();
    this.positionsCache.clear();
  }
  
  /**
   * Cleanup expired cache entries
   */
  private cleanupExpiredCache(): void {
    const now = Date.now();
    
    // Skip if not enough time has passed since last cleanup
    if (now - this.lastCacheCleanup < this.cacheExpiry / 2) {
      return;
    }
    
    // Cleanup logic would go here if we had timestamps per entry
    // For now just record the time
    this.lastCacheCleanup = now;
  }
  
  /**
   * Check if element exists in cache
   */
  hasElement(id: string): boolean {
    return this.elementsCache.has(id);
  }
  
  /**
   * Check if position exists in cache
   */
  hasPosition(id: string): boolean {
    return this.positionsCache.has(id);
  }
  
  /**
   * Get cache statistics
   */
  getCacheStats(): { elements: number, positions: number } {
    return {
      elements: this.elementsCache.size,
      positions: this.positionsCache.size
    };
  }
  
  /**
   * Updates a cached element
   */
  updateElement(id: string, updates: Partial<NetworkElement>): void {
    const element = this.elementsCache.get(id);
    if (element) {
      this.elementsCache.set(id, { ...element, ...updates });
    }
  }
  
  /**
   * Updates a cached position
   */
  updatePosition(id: string, updates: Partial<CachedPosition>): void {
    const position = this.positionsCache.get(id);
    if (position) {
      this.positionsCache.set(id, { ...position, ...updates });
    }
  }
} 