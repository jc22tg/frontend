import { NetworkConnection, ElementStatus, ElementType, FiberType } from '../../../shared/types/network.types';

/**
 * Datos mock para conexiones de red
 * Estos datos se utilizarán cuando el servidor no esté disponible o haya problemas con el endpoint
 */
export const MOCK_CONNECTIONS: NetworkConnection[] = [
  {
    id: 'conn-001',
    label: 'Conexión OLT-1 a Splitter-1',
    type: ElementType.FIBER_CONNECTION,
    sourceId: 'olt-001',
    targetId: 'splitter-001',
    status: ElementStatus.ACTIVE,
    fiberType: FiberType.SINGLE_MODE,
    length: 1250, // metros
    lastUpdated: new Date('2023-01-15')
  },
  {
    id: 'conn-002',
    label: 'Conexión Splitter-1 a FDP-1',
    type: ElementType.FIBER_CONNECTION,
    sourceId: 'splitter-001',
    targetId: 'fdp-001',
    status: ElementStatus.ACTIVE,
    fiberType: FiberType.SINGLE_MODE,
    length: 850, // metros
    lastUpdated: new Date('2023-01-15')
  },
  {
    id: 'conn-003',
    label: 'Conexión FDP-1 a ONT-1',
    type: ElementType.FIBER_CONNECTION,
    sourceId: 'fdp-001',
    targetId: 'ont-001',
    status: ElementStatus.ACTIVE,
    fiberType: FiberType.SINGLE_MODE_LOOSE_TUBE,
    length: 120, // metros
    lastUpdated: new Date('2023-01-16')
  },
  {
    id: 'conn-004',
    label: 'Conexión OLT-1 a EDFA-1',
    type: ElementType.FIBER_CONNECTION,
    sourceId: 'olt-001',
    targetId: 'edfa-001',
    status: ElementStatus.ACTIVE,
    fiberType: FiberType.SINGLE_MODE,
    length: 5600, // metros
    lastUpdated: new Date('2023-02-01')
  },
  {
    id: 'conn-005',
    label: 'Conexión EDFA-1 a Manga-1',
    type: ElementType.FIBER_CONNECTION,
    sourceId: 'edfa-001',
    targetId: 'manga-001',
    status: ElementStatus.ACTIVE,
    fiberType: FiberType.SINGLE_MODE,
    length: 2300, // metros
    lastUpdated: new Date('2023-02-15')
  }
]; 