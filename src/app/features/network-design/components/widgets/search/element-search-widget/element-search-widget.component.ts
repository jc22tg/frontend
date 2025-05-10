import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';

import { NetworkElement } from '../../../../../../shared/types/network.types';

@Component({
  selector: 'app-element-search-widget',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatListModule
  ],
  templateUrl: './element-search-widget.component.html',
  styleUrls: ['./element-search-widget.component.scss']
})
export class ElementSearchWidgetComponent {
  @Output() onSearch = new EventEmitter<string>();
  @Output() onSelectElement = new EventEmitter<NetworkElement>();
  
  searchTerm = '';
  searchResults: NetworkElement[] = [];
  
  // Método básico para búsqueda
  search(): void {
    if (this.searchTerm.trim().length > 0) {
      this.onSearch.emit(this.searchTerm);
    }
  }
  
  // Método para seleccionar un elemento de los resultados
  selectElement(element: NetworkElement): void {
    this.onSelectElement.emit(element);
  }
} 