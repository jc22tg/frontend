import { ClientType, ElementStatus, ElementType } from '../types/network.types';
import { Point } from 'geojson';

/**
 * Modelo para representar un cliente en el sistema, alineado con ClientResponseDto del backend.
 */
export interface Client {
  id: string;
  code: string;
  name: string;
  type: ClientType;
  status: ElementStatus;
  location?: Point;
  contactInfo?: {
    email: string;
    phone: string;
    alternativePhone?: string;
    address: {
      street: string;
      number: string;
      city: string;
      state: string;
      country: string;
      postalCode: string;
      coordinates?: [number, number];
    };
  };
  serviceInfo?: {
    plan: string;
    bandwidth: {
      downstream: number;
      upstream: number;
    };
    activationDate: Date | string;
    lastModification?: Date | string;
    contractEndDate?: Date | string;
    serviceLevel: 'basic' | 'premium' | 'enterprise';
  };
  networkElements?: {
    id: string;
    type: ElementType;
    name: string;
    status: string;
    installationDate: Date | string;
  }[];
  billing?: {
    accountNumber: string;
    paymentMethod: string;
    billingCycle: string;
    lastPaymentDate?: Date | string;
    balance: number;
  };
  technicalInfo?: {
    ontSerialNumber?: string;
    routerMacAddress?: string;
    ipAddress?: string;
    vlanId?: number;
    ponPort?: string;
  };
  createdAt: Date | string;
  updatedAt: Date | string;
} 
