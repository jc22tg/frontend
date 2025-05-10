import { Pipe, PipeTransform } from '@angular/core';

/**
 * Pipe para formatear valores numéricos como porcentajes
 * 
 * Ejemplo de uso:
 * {{ valor | formatPercentage }}          // Formato por defecto: "X.X%"
 * {{ valor | formatPercentage:0 }}        // Sin decimales: "X%"
 * {{ valor | formatPercentage:3 }}        // Con 3 decimales: "X.XXX%"
 * {{ valor | formatPercentage:1:true }}   // Con 1 decimal y valor absoluto: "X.X%"
 */
@Pipe({
  name: 'formatPercentage',
  standalone: true
})
export class FormatPercentagePipe implements PipeTransform {
  /**
   * Transforma un valor numérico en una cadena de texto con formato de porcentaje
   * 
   * @param value Valor numérico a formatear
   * @param decimals Número de decimales a mostrar (por defecto: 1)
   * @param absolute Si es true, se usa el valor absoluto (por defecto: false)
   * @returns Cadena formateada como porcentaje (ej: "12.5%")
   */
  transform(value: any, decimals = 1, absolute = false): string {
    if (value === undefined || value === null) {
      return 'N/A';
    }

    let num = parseFloat(value);
    
    if (isNaN(num)) {
      return String(value);
    }
    
    if (absolute) {
      num = Math.abs(num);
    }
    
    return `${num.toFixed(decimals)}%`;
  }
} 