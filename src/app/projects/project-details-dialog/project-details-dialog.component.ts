import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { Project, ProjectStatus } from '../../interfaces/project.interface';

export interface ProjectDetailsDialogData {
  project: Project;
}

@Component({
  selector: 'app-project-details-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatDividerModule
  ],
  template: `
    <h2 mat-dialog-title>{{ project.nombre }}</h2>
    <mat-dialog-content>
      <div class="project-details">
        <div class="detail-section">
          <h3>Información General</h3>
          <div class="detail-item">
            <mat-icon>description</mat-icon>
            <span>{{ project.descripcion }}</span>
          </div>
          <div class="detail-item">
            <mat-icon>person</mat-icon>
            <span>Responsable: {{ project.responsableId }}</span>
          </div>
          <div class="detail-item">
            <mat-icon>location_on</mat-icon>
            <span>{{ project.ubicacionGeografica }}</span>
          </div>
        </div>

        <mat-divider></mat-divider>

        <div class="detail-section">
          <h3>Estado y Presupuesto</h3>
          <div class="detail-item">
            <mat-icon>{{ getStatusIcon(project.estado) }}</mat-icon>
            <span>{{ getStatusLabel(project.estado) }}</span>
          </div>
          <div class="detail-item">
            <mat-icon>attach_money</mat-icon>
            <span>Presupuesto: {{ project.presupuesto | currency }}</span>
          </div>
        </div>

        <mat-divider></mat-divider>

        <div class="detail-section">
          <h3>Fechas</h3>
          <div class="detail-item">
            <mat-icon>event</mat-icon>
            <span>Inicio: {{ project.fechaInicio | date:'mediumDate' }}</span>
          </div>
          <div class="detail-item">
            <mat-icon>event_available</mat-icon>
            <span>Fin: {{ project.fechaFin | date:'mediumDate' }}</span>
          </div>
        </div>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button [mat-dialog-close]="false">Cerrar</button>
      <button mat-raised-button color="primary" [mat-dialog-close]="true" (click)="editProject()">
        <mat-icon>edit</mat-icon>
        Editar
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .project-details {
      padding: 16px;
    }

    .detail-section {
      margin-bottom: 16px;

      h3 {
        margin: 0 0 8px;
        color: #666;
      }
    }

    .detail-item {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
      color: #333;

      mat-icon {
        color: #9e9e9e;
      }
    }

    mat-divider {
      margin: 16px 0;
    }
  `]
})
export class ProjectDetailsDialogComponent {
  private dialogRef = inject(MatDialogRef<ProjectDetailsDialogComponent>);
  private dialogData = inject<ProjectDetailsDialogData>(MAT_DIALOG_DATA);
  
  project: Project;

  constructor() {
    this.project = this.dialogData.project;
  }

  getStatusIcon(status: ProjectStatus): string {
    switch (status) {
      case ProjectStatus.PLANNED:
        return 'schedule';
      case ProjectStatus.IN_PROGRESS:
        return 'play_circle';
      case ProjectStatus.COMPLETED:
        return 'check_circle';
      case ProjectStatus.CANCELLED:
        return 'cancel';
      default:
        return 'help';
    }
  }

  getStatusLabel(status: ProjectStatus): string {
    switch (status) {
      case ProjectStatus.PLANNED:
        return 'Planificado';
      case ProjectStatus.IN_PROGRESS:
        return 'En Progreso';
      case ProjectStatus.COMPLETED:
        return 'Completado';
      case ProjectStatus.CANCELLED:
        return 'Cancelado';
      default:
        return 'Desconocido';
    }
  }

  editProject(): void {
    this.dialogRef.close({ edit: true, project: this.project });
  }
} 
