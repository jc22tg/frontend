export enum OperationType {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE'
}

export interface OfflineOperation {
  id: string;
  timestamp: number;
  storeName: string;
  type: OperationType;
  key: string;
  data?: any;
  priority: number;
  attempts: number;
  lastAttempt?: number;
} 