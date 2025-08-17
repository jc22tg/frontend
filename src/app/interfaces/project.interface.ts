export enum ProjectStatus {
  PLANNED = 'PLANNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export interface Project {
  id: number;
  nombre: string;
  descripcion: string;
  fechaInicio: Date;
  fechaFin?: Date;
  estado: ProjectStatus;
  responsableId: number;
  presupuesto: number;
  ubicacionGeografica?: string;
  createdAt: Date;
  updatedAt: Date;
} 
