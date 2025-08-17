import { Pipe, PipeTransform } from '@angular/core';
import { ElementType } from '../../shared/types/network.types';

/**
 * Pipe para filtrar un array de elementos de red por su tipo
 * 
 * Ejemplo de uso:
 * {{ elementos | filterByType:ElementType.OLT }}
 * {{ elementos | filterByType:[ElementType.OLT, ElementType.ODF] }}
 */
@Pipe({
  name: 'filterByType',
  standalone: true
})
export class FilterByTypePipe implements PipeTransform {
  /**
   * Filtra un array de elementos por el tipo o tipos especificados
   * 
   * @param elements Array de elementos a filtrar
   * @param type Un tipo específico o array de tipos para filtrar
   * @returns Array filtrado de elementos que coinciden con el tipo o tipos
   */
  transform(elements: any[], type: ElementType | ElementType[]): any[] {
    if (!elements || !type) {
      return elements;
    }
    
    if (Array.isArray(type)) {
      return elements.filter(element => 
        type.includes(element.type)
      );
    } else {
      return elements.filter(element => 
        element.type === type
      );
    }
  }
} 
