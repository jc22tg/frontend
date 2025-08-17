import { NetworkConnection, ConnectionStatus, ConnectionType, FiberType } from '../../../shared/types/network.types';

/**
 * Datos mock para conexiones de red
 * Estos datos se utilizarán cuando el servidor no esté disponible o haya problemas con el endpoint
 */
export const MOCK_CONNECTIONS: NetworkConnection[] = [
  {
    id: 'conn-001',
    name: 'Conexión OLT-1 a Splitter-1',
    type: ConnectionType.FIBER,
    sourceElementId: 'olt-001',
    targetElementId: 'splitter-001',
    status: ConnectionStatus.ACTIVE,
    properties: {
      fiberType: FiberType.SINGLE_MODE,
      length: 1250, // metros
      lastUpdated: new Date('2023-01-15')
    }
  },
  {
    id: 'conn-002',
    name: 'Conexión Splitter-1 a FDP-1',
    type: ConnectionType.FIBER,
    sourceElementId: 'splitter-001',
    targetElementId: 'fdp-001',
    status: ConnectionStatus.ACTIVE,
    properties: {
      fiberType: FiberType.SINGLE_MODE,
      length: 850, // metros
      lastUpdated: new Date('2023-01-15')
    }
  },
  {
    id: 'conn-003',
    name: 'Conexión FDP-1 a ONT-1',
    type: ConnectionType.FIBER,
    sourceElementId: 'fdp-001',
    targetElementId: 'ont-001',
    status: ConnectionStatus.ACTIVE,
    properties: {
      fiberType: FiberType.SINGLE_MODE,
      length: 120, // metros
      lastUpdated: new Date('2023-01-16')
    }
  },
  {
    id: 'conn-004',
    name: 'Conexión OLT-1 a EDFA-1',
    type: ConnectionType.FIBER,
    sourceElementId: 'olt-001',
    targetElementId: 'edfa-001',
    status: ConnectionStatus.ACTIVE,
    properties: {
      fiberType: FiberType.SINGLE_MODE,
      length: 5600, // metros
      lastUpdated: new Date('2023-02-01')
    }
  },
  {
    id: 'conn-005',
    name: 'Conexión EDFA-1 a Manga-1',
    type: ConnectionType.FIBER,
    sourceElementId: 'edfa-001',
    targetElementId: 'manga-001',
    status: ConnectionStatus.ACTIVE,
    properties: {
      fiberType: FiberType.SINGLE_MODE,
      length: 2300, // metros
      lastUpdated: new Date('2023-02-15')
    }
  }
]; 
