import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { ElementManagementService } from '../../services/element-management.service';
import { NetworkElement, ElementType, ElementStatus } from '../../../../shared/types/network.types';

@Component({
  selector: 'app-element-management',
  templateUrl: './element-management.component.html',
  styleUrls: ['./element-management.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule
  ]
})
export class ElementManagementComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  elements: NetworkElement[] = [];
  selectedElement: NetworkElement | null = null;
  searchQuery = '';
  selectedType: ElementType | null = null;
  selectedStatus: ElementStatus | null = null;

  displayedColumns: string[] = ['id', 'name', 'type', 'status', 'actions'];

  constructor(private elementManagementService: ElementManagementService) {}

  ngOnInit(): void {
    this.subscribeToElements();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private subscribeToElements(): void {
    // Suscribirse a los elementos
    this.elementManagementService.getElements()
      .pipe(takeUntil(this.destroy$))
      .subscribe(elements => {
        this.elements = elements;
      });

    // Suscribirse al elemento seleccionado
    this.elementManagementService.getSelectedElement()
      .pipe(takeUntil(this.destroy$))
      .subscribe(element => {
        this.selectedElement = element;
      });
  }

  onSearch(): void {
    if (this.searchQuery) {
      this.elementManagementService.searchElements(this.searchQuery)
        .pipe(takeUntil(this.destroy$))
        .subscribe(elements => {
          this.elements = elements;
        });
    } else {
      this.elementManagementService.getElements()
        .pipe(takeUntil(this.destroy$))
        .subscribe(elements => {
          this.elements = elements;
        });
    }
  }

  onFilter(): void {
    this.elementManagementService.filterElements({
      type: this.selectedType || undefined,
      status: this.selectedStatus || undefined,
      search: this.searchQuery || undefined
    })
    .pipe(takeUntil(this.destroy$))
    .subscribe(elements => {
      this.elements = elements;
    });
  }

  onSelectElement(element: NetworkElement): void {
    this.elementManagementService.selectElement(element);
  }

  onDeleteElement(element: NetworkElement): void {
    if (element.id && confirm(`¿Está seguro de eliminar el elemento ${element.name}?`)) {
      this.elementManagementService.deleteElement(element.id);
    }
  }

  onExportElements(): void {
    this.elementManagementService.exportElements();
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.selectedType = null;
    this.selectedStatus = null;
    this.onFilter();
  }
} 
