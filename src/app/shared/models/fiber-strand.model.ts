export enum StrandStatus {
    AVAILABLE = 'AVAILABLE',
    IN_USE = 'IN_USE',
    RESERVED = 'RESERVED',
    DAMAGED = 'DAMAGED',
    TESTING = 'TESTING',
    MAINTENANCE = 'MAINTENANCE'
  }
  
  export enum StrandColor {
    BLUE = 'BLUE',
    ORANGE = 'ORANGE',
    GREEN = 'GREEN',
    BROWN = 'BROWN',
    SLATE = 'SLATE',
    WHITE = 'WHITE',
    RED = 'RED',
    BLACK = 'BLACK',
    YELLOW = 'YELLOW',
    VIOLET = 'VIOLET',
    ROSE = 'ROSE',
    AQUA = 'AQUA'
  }
  
  export interface FiberStrand {
    id: string;
    connectionId: string; // Referencia a la conexión padre
    strandNumber: number; // Número del hilo en el cable
    color: StrandColor;
    status: StrandStatus;
    
    // Características técnicas
    attenuation: number; // dB/km
    length: number; // metros
    testResults?: {
      date: Date;
      attenuation: number;
      returnLoss: number;
      notes?: string;
    }[];
    
    // Información de uso
    assignedTo?: {
      projectId?: string;
      customerId?: string;
      serviceId?: string;
      assignedDate: Date;
      notes?: string;
    };
    
    // Historial de mantenimiento
    maintenanceHistory?: {
      date: Date;
      type: string;
      description: string;
      technician: string;
      results: string;
    }[];
    
    // Metadatos
    metadata?: {
      installationDate?: Date;
      lastTestDate?: Date;
      nextMaintenanceDate?: Date;
      location?: {
        latitude: number;
        longitude: number;
        elevation?: number;
      };
      [key: string]: any;
    };
  }
  
  export interface FiberStrandCreate {
    connectionId: string;
    strandNumber: number;
    color: StrandColor;
    status: StrandStatus;
    attenuation: number;
    length: number;
    metadata?: any;
  }
  
  export interface FiberStrandUpdate {
    status?: StrandStatus;
    attenuation?: number;
    length?: number;
    assignedTo?: {
      projectId?: string;
      customerId?: string;
      serviceId?: string;
      notes?: string;
    };
    metadata?: any;
  } 
