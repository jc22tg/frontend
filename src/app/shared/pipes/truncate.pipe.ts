import { Pipe, PipeTransform } from '@angular/core';

/**
 * Pipe para truncar texto a una longitud específica
 * 
 * Ejemplo de uso:
 * {{ 'Texto largo para mostrar' | truncate:10 }}         // "Texto lar..."
 * {{ 'Texto largo' | truncate:5:' >>' }}                // "Texto >>"
 */
@Pipe({
  name: 'truncate',
  standalone: true
})
export class TruncatePipe implements PipeTransform {
  /**
   * Trunca un texto a la longitud especificada y agrega un sufijo
   * 
   * @param value Texto a truncar
   * @param limit Longitud máxima del texto (por defecto: 20)
   * @param suffix Sufijo a agregar al texto truncado (por defecto: '...')
   * @returns Texto truncado con el sufijo
   */
  transform(value: string, limit = 20, suffix = '...'): string {
    if (!value) {
      return '';
    }
    
    if (value.length <= limit) {
      return value;
    }
    
    return value.substring(0, limit).trim() + suffix;
  }
} 
