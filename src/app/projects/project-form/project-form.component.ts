import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatNativeDateModule } from '@angular/material/core';
import { ProjectService } from '../../services/project.service';
import { Project, ProjectStatus } from '../../interfaces/project.interface';

@Component({
  selector: 'app-project-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatNativeDateModule
  ],
  templateUrl: './project-form.component.html',
  styleUrls: ['./project-form.component.scss']
})
export class ProjectFormComponent implements OnInit {
  @Input() project: Project | null = null;
  @Output() saved = new EventEmitter<void>();

  projectForm: FormGroup;
  projectStatus = ProjectStatus;

  constructor(
    private fb: FormBuilder,
    private projectService: ProjectService
  ) {
    this.projectForm = this.fb.group({
      nombre: ['', Validators.required],
      descripcion: ['', Validators.required],
      fechaInicio: ['', Validators.required],
      fechaFin: [''],
      estado: [ProjectStatus.PLANNED, Validators.required],
      responsableId: ['', Validators.required],
      presupuesto: [0, [Validators.required, Validators.min(0)]],
      ubicacionGeografica: ['']
    });
  }

  ngOnInit(): void {
    if (this.project) {
      this.projectForm.patchValue(this.project);
    }
  }

  onSubmit(): void {
    if (this.projectForm.valid) {
      const projectData = this.projectForm.value;
      
      if (this.project) {
        this.projectService.updateProject(this.project.id, projectData).subscribe(
          () => this.saved.emit(),
          error => console.error('Error updating project:', error)
        );
      } else {
        this.projectService.createProject(projectData).subscribe(
          () => this.saved.emit(),
          error => console.error('Error creating project:', error)
        );
      }
    }
  }
} 