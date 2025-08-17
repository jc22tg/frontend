import { Injectable } from '@angular/core';
import { NetworkElement, ElementType, ElementStatus } from '../../../shared/types/network.types';

@Injectable({
  providedIn: 'root'
})
export class MockDataService {

  constructor() { }

  /**
   * Genera datos de prueba para un elemento Manga
   */
  getMockMangaElement(): NetworkElement {
    return {
      id: 'mock-manga-' + Date.now(),
      name: 'Manga de prueba',
      description: 'Manga generada para pruebas',
      type: ElementType.MANGA,
      status: ElementStatus.ACTIVE,
      position: {
        lat: 19.783750, 
        lng: -70.676666,
        coordinates: [-70.676666, 19.783750],
        type: 'Point'
      },
      // Propiedades específicas del tipo MANGA
      properties: {
        manufacturer: 'Fabricante Prueba',
        model: 'Modelo Prueba',
        fiberType: 'SINGLEMODE',
        fiberCount: 12,
        length: 1.5,
        diameter: 20,
        color: 'Negro',
        sealType: 'Termocontraíble',
        installationType: 'Aérea',
        mountingType: 'pole',
        location: 'Ubicación de prueba',
        capacity: 24,
        spliceCount: 24,
        usedSplices: 0,
        serialNumber: 'SN123456789',
        installationDate: new Date(),
        installationTechnician: 'Técnico de prueba',
        technicianId: 'TECH-001',
        workOrderNumber: 'WO-123456',
        spliceType: 'fusion',
        inputFiberThreadIds: '1,2,3',
        outputFiberThreadIds: '4,5,6',
        usedCapacity: 0
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Obtiene un conjunto de datos de elementos de prueba para el editor
   */
  getMockElements(): NetworkElement[] {
    return [
      this.getMockMangaElement(),
      // Aquí puedes añadir más elementos de otros tipos si es necesario
    ];
  }
}
