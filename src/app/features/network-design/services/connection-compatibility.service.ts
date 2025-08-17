import { Injectable } from '@angular/core';
import { ElementType } from '../../../shared/types/network.types';
import {
  OLT,
  ONT,
  ODF,
  EDFA,
  Splitter,
  Manga,
  TerminalBox,
  SlackFiber,
  FiberThread,
  Rack
} from '../interfaces/element.interface';

/**
 * Servicio que gestiona la compatibilidad de conexiones entre diferentes tipos de elementos de red
 */
@Injectable({
  providedIn: 'root'
})
export class ConnectionCompatibilityService {
  private compatibilityMatrix: Map<ElementType, ElementType[]>;

  constructor() {
    this.compatibilityMatrix = new Map<ElementType, ElementType[]>();
    
    // Inicialización de la matriz de compatibilidad
    this.compatibilityMatrix.set(ElementType.OLT, [
      ElementType.SPLITTER,
      ElementType.FIBER_THREAD,
      ElementType.EDFA,
      ElementType.MANGA,
      ElementType.ODF
    ]);
    
    this.compatibilityMatrix.set(ElementType.ONT, [
      ElementType.SPLITTER,
      ElementType.ODF,
      ElementType.TERMINAL_BOX,
      ElementType.FIBER_THREAD
    ]);
    
    this.compatibilityMatrix.set(ElementType.SPLITTER, [
      ElementType.OLT,
      ElementType.ONT,
      ElementType.ODF,
      ElementType.SPLITTER,
      ElementType.FIBER_THREAD,
      ElementType.MANGA
    ]);
    
    this.compatibilityMatrix.set(ElementType.ODF, [
      ElementType.SPLITTER,
      ElementType.ONT,
      ElementType.FIBER_THREAD,
      ElementType.TERMINAL_BOX
    ]);
    
    this.compatibilityMatrix.set(ElementType.EDFA, [
      ElementType.OLT,
      ElementType.SPLITTER,
      ElementType.FIBER_THREAD,
      ElementType.MANGA
    ]);
    
    this.compatibilityMatrix.set(ElementType.MANGA, [
      ElementType.OLT,
      ElementType.SPLITTER,
      ElementType.EDFA,
      ElementType.FIBER_THREAD
    ]);
    
    this.compatibilityMatrix.set(ElementType.TERMINAL_BOX, [
      ElementType.ODF,
      ElementType.ONT,
      ElementType.FIBER_THREAD
    ]);
    
    this.compatibilityMatrix.set(ElementType.FIBER_THREAD, [
      ElementType.OLT,
      ElementType.ONT,
      ElementType.SPLITTER,
      ElementType.ODF,
      ElementType.EDFA,
      ElementType.MANGA,
      ElementType.TERMINAL_BOX,
      ElementType.FIBER_THREAD
    ]);
    
    // Compatibilidad para tipos de cables y otros tipos no válidos eliminada
    // Solo quedan los set para los tipos válidos definidos arriba.
  }

  /**
   * Verifica si dos tipos de elementos son compatibles para conexión
   * @param sourceType Tipo de elemento origen
   * @param targetType Tipo de elemento destino
   * @returns true si los elementos son compatibles, false en caso contrario
   */
  isCompatible(sourceType: ElementType, targetType: ElementType): boolean {
    // Si algún tipo no está en la matriz, devolver false
    if (!this.compatibilityMatrix.has(sourceType) || !this.compatibilityMatrix.has(targetType)) {
      return false;
    }
    
    // Verificar compatibilidad en ambas direcciones
    return (
      (this.compatibilityMatrix.get(sourceType)?.includes(targetType) === true) ||
      (this.compatibilityMatrix.get(targetType)?.includes(sourceType) === true)
    );
  }

  /**
   * Obtiene un array de tipos de elementos compatibles con un tipo específico
   * @param elementType Tipo de elemento para el cual buscar compatibles
   * @returns Array de tipos de elementos compatibles
   */
  getCompatibleTypes(elementType: ElementType): ElementType[] {
    return this.compatibilityMatrix.get(elementType) || [];
  }
} 
