/**
 * Enum que define los estados posibles para un elemento de red
 */
export enum ElementStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  MAINTENANCE = 'MAINTENANCE',
  WARNING = 'WARNING',
  FAULT = 'FAULT',
  PLANNED = 'PLANNED',
  UNKNOWN = 'UNKNOWN'
} 