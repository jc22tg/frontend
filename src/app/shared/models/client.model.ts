import { ClientType } from '../types/network.types';

/**
 * Modelo para representar un cliente en el sistema
 */
export interface Client {
  id: string;
  name: string;
  type: ClientType;
  address: string;
  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;
  associatedElementIds?: string[];
} 