import { OperationType } from './operation-type.enum';

export interface PendingOperation {
  id: string;
  type: OperationType;
  entity: string;
  data: any;
  timestamp: number;
  priority: number;
  attempts: number;
  lastError?: string;
} 