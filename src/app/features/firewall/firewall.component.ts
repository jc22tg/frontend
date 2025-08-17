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
import { FirewallService } from './firewall.service';
@Component({
  selector: 'app-firewall',
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
  templateUrl: './firewall.component.html',
  styleUrls: ['./firewall.component.scss']
})
export class FirewallComponent implements OnInit {
  firewalls: FirewallDto[] = [];
  displayedColumns: string[] = [
    'name',
    'type',
    'status',
    'category',
    'buildingId',
    'location',
    'model',
    'manufacturer',
    'managementIp',
    'isActive',
    'actions'
  ];
  loading = false;
  error = '';

  // Enums para el template
  FirewallType = FirewallType;
  FirewallStatus = FirewallStatus;
  FirewallMode = FirewallMode;
  FirewallCategory = FirewallCategory;
  FirewallMountingType = FirewallMountingType;
  FirewallPowerSource = FirewallPowerSource;
  FirewallConnectionType = FirewallConnectionType;

  constructor(private firewallService: FirewallService) {}

  ngOnInit(): void {
    this.loadFirewalls();
  }

  loadFirewalls(): void {
    this.loading = true;
    this.error = '';
    
    this.firewallService.getFirewalls().subscribe({
      next: (firewalls) => {
        this.firewalls = firewalls;
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Error al cargar los firewalls: ' + error.message;
        this.loading = false;
      }
    });
  }

  getStatusColor(status: FirewallStatus): string {
    switch (status) {
      case FirewallStatus.ACTIVE:
        return 'primary';
      case FirewallStatus.INACTIVE:
        return 'warn';
      case FirewallStatus.MAINTENANCE:
        return 'accent';
      case FirewallStatus.FAULTY:
        return 'warn';
      case FirewallStatus.DECOMMISSIONED:
        return 'warn';
      default:
        return 'basic';
    }
  }

  getTypeColor(type: FirewallType): string {
    switch (type) {
      case FirewallType.HARDWARE:
        return 'primary';
      case FirewallType.SOFTWARE:
        return 'accent';
      case FirewallType.VIRTUAL:
        return 'warn';
      case FirewallType.CLOUD:
        return 'primary';
      default:
        return 'basic';
    }
  }

  onEdit(firewall: FirewallDto): void {
    // Implementar lógica de edición
    console.log('Editar firewall:', firewall);
  }

  onDelete(firewall: FirewallDto): void {
    // Implementar lógica de eliminación
    console.log('Eliminar firewall:', firewall);
  }

  onView(firewall: FirewallDto): void {
    // Implementar lógica de visualización
    console.log('Ver firewall:', firewall);
  }

  onCreate(): void {
    // Implementar lógica de creación
    console.log('Crear nuevo firewall');
  }
} 
