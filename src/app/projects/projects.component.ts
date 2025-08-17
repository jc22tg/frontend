import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Project, ProjectStatus } from '../interfaces/project.interface';
import { ProjectFormComponent } from './project-form/project-form.component';
import { ConfirmDialogComponent } from '@shared/confirm-dialog/confirm-dialog.component';
import { ProjectDetailsDialogComponent } from './project-details-dialog/project-details-dialog.component';
import { ExportDialogComponent } from './export-dialog/export-dialog.component';
import { ProjectService } from '@core/services/project.service';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatPaginatorModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTooltipModule,
    ProjectFormComponent,
    MatDialogModule
  ],
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.scss']
})
export class ProjectsComponent implements OnInit {
  projects: Project[] = [];
  filteredProjects: Project[] = [];
  selectedProject: Project | null = null;
  isCreating = false;
  isLoading = false;
  error: string | null = null;

  // Filtros
  searchTerm = '';
  selectedStatus: ProjectStatus | 'ALL' = 'ALL';
  startDate: Date | null = null;
  endDate: Date | null = null;
  maxBudget: number | null = null;
  sortField: keyof Project = 'nombre';
  sortDirection: 'asc' | 'desc' = 'asc';

  statusOptions = [
    { value: 'ALL', label: 'Todos' },
    { value: ProjectStatus.PLANNED, label: 'Planificado' },
    { value: ProjectStatus.IN_PROGRESS, label: 'En Progreso' },
    { value: ProjectStatus.COMPLETED, label: 'Completado' },
    { value: ProjectStatus.CANCELLED, label: 'Cancelado' }
  ];

  // Paginación
  pageSize = 6;
  pageIndex = 0;
  pageSizeOptions = [6, 12, 24];
  paginatedProjects: Project[] = [];

  constructor(
    private projectService: ProjectService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadProjects();
  }

  loadProjects(): void {
    this.isLoading = true;
    this.error = null;
    
    this.projectService.getProjects().subscribe({
      next: projects => {
        this.projects = projects;
        this.applyFilters();
        this.isLoading = false;
      },
      error: error => {
        this.error = 'Error al cargar los proyectos';
        this.isLoading = false;
        this.showError('No se pudieron cargar los proyectos');
      }
    });
  }

  applyFilters(): void {
    this.filteredProjects = this.projects.filter(project => {
      const matchesSearch = project.nombre.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                          project.descripcion.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchesStatus = this.selectedStatus === 'ALL' || project.estado === this.selectedStatus;
      const matchesDate = (!this.startDate || (project.fechaInicio && project.fechaInicio >= this.startDate)) &&
                         (!this.endDate || (project.fechaFin && project.fechaFin <= this.endDate));
      const matchesBudget = !this.maxBudget || project.presupuesto <= this.maxBudget;
      
      return matchesSearch && matchesStatus && matchesDate && matchesBudget;
    });

    this.sortProjects();
    this.updatePaginatedProjects();
  }

  sortProjects(): void {
    this.filteredProjects.sort((a, b) => {
      const valueA = a[this.sortField];
      const valueB = b[this.sortField];
      
      if (valueA === valueB) return 0;
      
      const comparison = (valueA ?? '') < (valueB ?? '') ? -1 : 1;
      return this.sortDirection === 'asc' ? comparison : -comparison;
    });
  }

  updatePaginatedProjects(): void {
    const startIndex = this.pageIndex * this.pageSize;
    this.paginatedProjects = this.filteredProjects.slice(startIndex, startIndex + this.pageSize);
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updatePaginatedProjects();
  }

  onSearchChange(): void {
    this.pageIndex = 0;
    this.applyFilters();
  }

  onStatusChange(): void {
    this.pageIndex = 0;
    this.applyFilters();
  }

  onDateChange(): void {
    this.pageIndex = 0;
    this.applyFilters();
  }

  onBudgetChange(): void {
    this.pageIndex = 0;
    this.applyFilters();
  }

  onSortChange(): void {
    this.applyFilters();
  }

  toggleSortDirection(): void {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    this.applyFilters();
  }

  selectProject(project: Project): void {
    this.selectedProject = project;
    this.isCreating = false;
  }

  createProject(): void {
    this.selectedProject = null;
    this.isCreating = true;
  }

  onProjectSaved(): void {
    this.loadProjects();
    this.selectedProject = null;
    this.isCreating = false;
    this.showSuccess('Proyecto guardado exitosamente');
  }

  viewProjectDetails(project: Project): void {
    this.dialog.open(ProjectDetailsDialogComponent, {
      width: '600px',
      data: { project }
    });
  }

  deleteProject(id: number): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Confirmar eliminación',
        message: '¿Estás seguro de que deseas eliminar este proyecto? Esta acción no se puede deshacer.',
        confirmText: 'Eliminar',
        cancelText: 'Cancelar'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.isLoading = true;
        this.projectService.deleteProject(id).subscribe({
          next: () => {
            this.loadProjects();
            this.selectedProject = null;
            this.showSuccess('Proyecto eliminado exitosamente');
          },
          error: error => {
            this.isLoading = false;
            this.showError('Error al eliminar el proyecto');
          }
        });
      }
    });
  }

  getTotalBudget(): number {
    return this.filteredProjects.reduce((total, project) => total + project.presupuesto, 0);
  }

  getProjectsByStatus(status: ProjectStatus): number {
    return this.filteredProjects.filter(project => project.estado === status).length;
  }

  exportProjects(): void {
    const dialogRef = this.dialog.open(ExportDialogComponent, {
      width: '500px',
      data: { 
        projects: this.filteredProjects,
        totalBudget: this.getTotalBudget(),
        projectsByStatus: this.statusOptions.slice(1).map(status => ({
          status: status.value as ProjectStatus,
          count: this.getProjectsByStatus(status.value as ProjectStatus)
        }))
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.showSuccess('Proyectos exportados exitosamente');
      }
    });
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      panelClass: ['error-snackbar']
    });
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
} 
