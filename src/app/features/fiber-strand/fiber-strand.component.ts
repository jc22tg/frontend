import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTabsModule } from '@angular/material/tabs';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatStepperModule } from '@angular/material/stepper';
import { MatRadioModule } from '@angular/material/radio';
import { MatSliderModule } from '@angular/material/slider';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatChipInputEvent, MatChipsModule } from '@angular/material/chips';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { FiberStrandService } from './fiber-strand.service';
@Component({
  selector: 'app-fiber-strand',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatProgressBarModule,
    MatDialogModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCheckboxModule,
    MatSlideToggleModule,
    MatExpansionModule,
    MatTabsModule,
    MatBadgeModule,
    MatTooltipModule,
    MatMenuModule,
    MatPaginatorModule,
    MatSortModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatListModule,
    MatGridListModule,
    MatStepperModule,
    MatRadioModule,
    MatSliderModule,
    MatAutocompleteModule,
    ReactiveFormsModule,
    FormsModule,
  ],
  templateUrl: './fiber-strand.component.html',
  styleUrls: ['./fiber-strand.component.scss']
})
export class FiberStrandComponent implements OnInit {
  fiberStrands: FiberStrandDto[] = [];
  displayedColumns: string[] = [
    'name',
    'type',
    'status',
    'color',
    'condition',
    'buildingId',
    'fiberCableId',
    'strandNumber',
    'model',
    'manufacturer',
    'totalLength',
    'isActive',
    'actions'
  ];
  loading = false;
  error = '';

  // Enums para el template
  FiberStrandType = FiberStrandType;
  FiberStrandStatus = FiberStrandStatus;
  FiberStrandColor = FiberStrandColor;
  FiberStrandCondition = FiberStrandCondition;
  FiberStrandBufferType = FiberStrandBufferType;
  FiberStrandCoatingType = FiberStrandCoatingType;
  FiberStrandProtection = FiberStrandProtection;

  constructor(private fiberStrandService: FiberStrandService) {}

  ngOnInit(): void {
    this.loadFiberStrands();
  }

  loadFiberStrands(): void {
    this.loading = true;
    this.error = '';
    
    this.fiberStrandService.getFiberStrands().subscribe({
      next: (fiberStrands) => {
        this.fiberStrands = fiberStrands;
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Error al cargar los hilos de fibra: ' + error.message;
        this.loading = false;
      }
    });
  }

  getStatusColor(status: FiberStrandStatus): string {
    switch (status) {
      case FiberStrandStatus.ACTIVE:
        return 'primary';
      case FiberStrandStatus.INACTIVE:
        return 'warn';
      case FiberStrandStatus.MAINTENANCE:
        return 'accent';
      case FiberStrandStatus.FAULTY:
        return 'warn';
      case FiberStrandStatus.DECOMMISSIONED:
        return 'warn';
      default:
        return 'basic';
    }
  }

  getTypeColor(type: FiberStrandType): string {
    switch (type) {
      case FiberStrandType.SINGLE_MODE:
        return 'primary';
      case FiberStrandType.MULTI_MODE:
        return 'accent';
      case FiberStrandType.PATCH_CORD:
        return 'warn';
      case FiberStrandType.PIGTAIL:
        return 'primary';
      default:
        return 'basic';
    }
  }

  getColorColor(color: FiberStrandColor): string {
    switch (color) {
      case FiberStrandColor.BLUE:
        return 'primary';
      case FiberStrandColor.ORANGE:
        return 'accent';
      case FiberStrandColor.GREEN:
        return 'primary';
      case FiberStrandColor.BROWN:
        return 'accent';
      default:
        return 'basic';
    }
  }

  getConditionColor(condition: FiberStrandCondition): string {
    switch (condition) {
      case FiberStrandCondition.EXCELLENT:
        return 'primary';
      case FiberStrandCondition.GOOD:
        return 'primary';
      case FiberStrandCondition.FAIR:
        return 'accent';
      case FiberStrandCondition.POOR:
        return 'warn';
      case FiberStrandCondition.DAMAGED:
        return 'warn';
      case FiberStrandCondition.BROKEN:
        return 'warn';
      default:
        return 'basic';
    }
  }

  onEdit(fiberStrand: FiberStrandDto): void {
    // Implementar lógica de edición
    console.log('Editar hilo de fibra:', fiberStrand);
  }

  onDelete(fiberStrand: FiberStrandDto): void {
    // Implementar lógica de eliminación
    console.log('Eliminar hilo de fibra:', fiberStrand);
  }

  onView(fiberStrand: FiberStrandDto): void {
    // Implementar lógica de visualización
    console.log('Ver hilo de fibra:', fiberStrand);
  }

  onCreate(): void {
    // Implementar lógica de creación
    console.log('Crear nuevo hilo de fibra');
  }
} 
