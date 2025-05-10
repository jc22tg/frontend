import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { Project } from '../../interfaces/project.interface';
import { ProjectStatus } from '../../interfaces/project-status.interface';
import { Workbook } from 'exceljs';

@Component({
  selector: 'app-export-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatDialogModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatSelectModule,
    FormsModule
  ],
  template: `
    <h2 mat-dialog-title>Exportar Proyectos</h2>
    <mat-dialog-content>
      <div class="export-options">
        <mat-form-field appearance="outline">
          <mat-label>Formato de exportación</mat-label>
          <mat-select [(ngModel)]="selectedFormat">
            <mat-option value="csv">CSV</mat-option>
            <mat-option value="excel">Excel</mat-option>
          </mat-select>
        </mat-form-field>

        <div class="fields-selection">
          <h3>Campos a exportar</h3>
          @for (field of availableFields; track field.value) {
            <div class="field-option">
              <mat-checkbox [(ngModel)]="selectedFields[field.value]">
                {{ field.label }}
              </mat-checkbox>
            </div>
          }
        </div>

        <mat-checkbox [(ngModel)]="includeStats">
          Incluir estadísticas
        </mat-checkbox>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button [mat-dialog-close]="false">Cancelar</button>
      <button mat-raised-button color="primary" (click)="export()" [disabled]="!hasSelectedFields()">
        Exportar
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .export-options {
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .fields-selection {
      h3 {
        margin: 0 0 8px;
        color: #666;
      }
    }

    .field-option {
      margin-bottom: 8px;
    }
  `]
})
export class ExportDialogComponent {
  private dialogRef = inject(MatDialogRef<ExportDialogComponent>);
  private data = inject(MAT_DIALOG_DATA) as { 
    projects: Project[];
    totalBudget: number;
    projectsByStatus: { status: ProjectStatus; count: number }[];
  };

  projects: Project[];
  totalBudget: number;
  projectsByStatus: { status: ProjectStatus; count: number }[];
  selectedFormat: 'csv' | 'excel' = 'csv';
  selectedFields: Record<string, boolean> = {};
  includeStats = true;
  
  availableFields = [
    { value: 'nombre', label: 'Nombre' },
    { value: 'descripcion', label: 'Descripción' },
    { value: 'estado', label: 'Estado' },
    { value: 'fechaInicio', label: 'Fecha de inicio' },
    { value: 'fechaFin', label: 'Fecha de fin' },
    { value: 'responsableId', label: 'Responsable' },
    { value: 'presupuesto', label: 'Presupuesto' },
    { value: 'ubicacionGeografica', label: 'Ubicación' }
  ];

  constructor() {
    this.projects = this.data.projects;
    this.totalBudget = this.data.totalBudget;
    this.projectsByStatus = this.data.projectsByStatus;
    this.availableFields.forEach(field => {
      this.selectedFields[field.value] = true;
    });
  }

  hasSelectedFields(): boolean {
    return Object.values(this.selectedFields).some(selected => selected);
  }

  async export(): Promise<void> {
    const selectedFieldNames = Object.entries(this.selectedFields)
      .filter(([_, selected]) => selected)
      .map(([field]) => field);

    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet('Proyectos');

    // Configurar encabezados
    worksheet.columns = selectedFieldNames.map(field => ({
      header: this.getFieldLabel(field),
      key: field,
      width: 20
    }));

    // Agregar datos
    this.projects.forEach(project => {
      const row: any = {};
      selectedFieldNames.forEach(field => {
        if (field === 'fechaInicio' || field === 'fechaFin') {
          row[field] = project[field as keyof Project] 
            ? new Date(project[field as keyof Project] as string)
            : '';
        } else if (field === 'estado') {
          row[field] = this.getStatusLabel(project[field as keyof Project] as ProjectStatus);
        } else if (field === 'presupuesto') {
          row[field] = project[field as keyof Project];
        } else {
          row[field] = project[field as keyof Project];
        }
      });
      worksheet.addRow(row);
    });

    // Formatear números y fechas
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) { // Saltar encabezados
        selectedFieldNames.forEach((field, colNumber) => {
          const cell = row.getCell(colNumber + 1);
          if (field === 'presupuesto') {
            cell.numFmt = '"€"#,##0.00';
          } else if (field === 'fechaInicio' || field === 'fechaFin') {
            cell.numFmt = 'dd/mm/yyyy';
          }
        });
      }
    });

    if (this.includeStats) {
      const statsWorksheet = workbook.addWorksheet('Estadísticas');
      
      // Agregar estadísticas
      statsWorksheet.addRow(['Estadísticas de Proyectos']);
      statsWorksheet.addRow(['Total de Proyectos', this.projects.length]);
      statsWorksheet.addRow(['Presupuesto Total', this.totalBudget]);
      statsWorksheet.addRow([]);
      statsWorksheet.addRow(['Proyectos por Estado']);
      
      this.projectsByStatus.forEach(({ status, count }) => {
        statsWorksheet.addRow([this.getStatusLabel(status), count]);
      });

      // Formatear números
      statsWorksheet.getCell('B2').numFmt = '0';
      statsWorksheet.getCell('B3').numFmt = '"€"#,##0.00';
      statsWorksheet.getCell('B7').numFmt = '0';
    }

    // Guardar archivo
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `proyectos_${new Date().toISOString().split('T')[0]}.${this.selectedFormat}`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    this.dialogRef.close(true);
  }

  private getFieldLabel(field: string): string {
    const fieldInfo = this.availableFields.find(f => f.value === field);
    return fieldInfo ? fieldInfo.label : field;
  }

  private getStatusLabel(status: ProjectStatus): string {
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