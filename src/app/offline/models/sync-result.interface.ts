export interface SyncResult {
  success: boolean;
  completed: number;
  failed: number;
  timestamp: number;
  errors?: {
    operationId: string;
    entity: string;
    error: string;
  }[];
} 