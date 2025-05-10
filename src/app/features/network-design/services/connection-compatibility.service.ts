import { Injectable } from '@angular/core';
import { ElementType } from '../../../shared/types/network.types';

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
      ElementType.MSAN,
      ElementType.ODF, // Antes FDP
      ElementType.WAVELENGTH_ROUTER,
      ElementType.OPTICAL_SWITCH,
      ElementType.ROADM,
      ElementType.OPTICAL_AMPLIFIER,
      ElementType.WDM_FILTER
    ]);
    
    this.compatibilityMatrix.set(ElementType.ONT, [
      ElementType.SPLITTER,
      ElementType.ODF, // Antes FDP
      ElementType.TERMINAL_BOX,
      ElementType.FIBER_THREAD,
      ElementType.WDM_FILTER
    ]);
    
    this.compatibilityMatrix.set(ElementType.SPLITTER, [
      ElementType.OLT, 
      ElementType.ONT, 
      ElementType.ODF, // Antes FDP
      ElementType.SPLITTER,
      ElementType.FIBER_THREAD,
      ElementType.MANGA,
      ElementType.WDM_FILTER
    ]);
    
    // Actualizado: FDP a ODF
    this.compatibilityMatrix.set(ElementType.ODF, [
      ElementType.SPLITTER,
      ElementType.ONT,
      ElementType.FIBER_THREAD,
      ElementType.TERMINAL_BOX,
      ElementType.WDM_FILTER,
      ElementType.COHERENT_TRANSPONDER
    ]);
    
    this.compatibilityMatrix.set(ElementType.EDFA, [
      ElementType.OLT,
      ElementType.SPLITTER,
      ElementType.FIBER_THREAD,
      ElementType.MANGA,
      ElementType.OPTICAL_AMPLIFIER,
      ElementType.ROADM
    ]);
    
    this.compatibilityMatrix.set(ElementType.MANGA, [
      ElementType.OLT,
      ElementType.SPLITTER,
      ElementType.EDFA,
      ElementType.FIBER_THREAD,
      ElementType.WDM_FILTER
    ]);
    
    this.compatibilityMatrix.set(ElementType.TERMINAL_BOX, [
      ElementType.ODF, // Antes FDP
      ElementType.ONT,
      ElementType.FIBER_THREAD
    ]);
    
    this.compatibilityMatrix.set(ElementType.FIBER_THREAD, [
      ElementType.OLT,
      ElementType.ONT,
      ElementType.SPLITTER,
      ElementType.ODF, // Antes FDP
      ElementType.EDFA,
      ElementType.MANGA,
      ElementType.TERMINAL_BOX,
      ElementType.FIBER_THREAD,
      ElementType.WDM_FILTER,
      ElementType.ROADM,
      ElementType.OPTICAL_SWITCH,
      ElementType.WAVELENGTH_ROUTER,
      ElementType.COHERENT_TRANSPONDER
    ]);
    
    this.compatibilityMatrix.set(ElementType.MSAN, [
      ElementType.OLT,
      ElementType.FIBER_THREAD,
      ElementType.TERMINAL_BOX,
      ElementType.ODF // Antes FDP
    ]);
    
    // Compatibilidad para tipos de cables
    this.compatibilityMatrix.set(ElementType.DROP_CABLE, [
      ElementType.TERMINAL_BOX,
      ElementType.ONT,
      ElementType.ODF // Antes FDP
    ]);
    
    this.compatibilityMatrix.set(ElementType.DISTRIBUTION_CABLE, [
      ElementType.TERMINAL_BOX,
      ElementType.ODF, // Antes FDP
      ElementType.SPLITTER,
      ElementType.MANGA
    ]);
    
    this.compatibilityMatrix.set(ElementType.FEEDER_CABLE, [
      ElementType.SPLITTER,
      ElementType.OLT,
      ElementType.MANGA,
      ElementType.EDFA,
      ElementType.MSAN
    ]);
    
    this.compatibilityMatrix.set(ElementType.BACKBONE_CABLE, [
      ElementType.OLT,
      ElementType.EDFA,
      ElementType.MANGA,
      ElementType.MSAN,
      ElementType.ROADM,
      ElementType.OPTICAL_AMPLIFIER
    ]);
    
    // Agregar compatibilidades para nuevos tipos de elementos
    this.compatibilityMatrix.set(ElementType.WDM_FILTER, [
      ElementType.OLT,
      ElementType.ONT,
      ElementType.SPLITTER,
      ElementType.ODF,
      ElementType.FIBER_THREAD,
      ElementType.MANGA,
      ElementType.COHERENT_TRANSPONDER,
      ElementType.WAVELENGTH_ROUTER
    ]);
    
    this.compatibilityMatrix.set(ElementType.COHERENT_TRANSPONDER, [
      ElementType.ODF,
      ElementType.FIBER_THREAD,
      ElementType.WDM_FILTER,
      ElementType.WAVELENGTH_ROUTER,
      ElementType.ROADM
    ]);
    
    this.compatibilityMatrix.set(ElementType.WAVELENGTH_ROUTER, [
      ElementType.OLT,
      ElementType.FIBER_THREAD,
      ElementType.WDM_FILTER,
      ElementType.COHERENT_TRANSPONDER,
      ElementType.ROADM,
      ElementType.OPTICAL_SWITCH
    ]);
    
    this.compatibilityMatrix.set(ElementType.OPTICAL_SWITCH, [
      ElementType.OLT,
      ElementType.FIBER_THREAD,
      ElementType.WAVELENGTH_ROUTER,
      ElementType.ROADM
    ]);
    
    this.compatibilityMatrix.set(ElementType.ROADM, [
      ElementType.FIBER_THREAD,
      ElementType.EDFA,
      ElementType.COHERENT_TRANSPONDER,
      ElementType.WAVELENGTH_ROUTER,
      ElementType.OPTICAL_SWITCH,
      ElementType.BACKBONE_CABLE
    ]);
    
    this.compatibilityMatrix.set(ElementType.OPTICAL_AMPLIFIER, [
      ElementType.OLT,
      ElementType.FIBER_THREAD,
      ElementType.EDFA,
      ElementType.BACKBONE_CABLE
    ]);
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