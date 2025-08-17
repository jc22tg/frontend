import { Injectable } from '@angular/core';
import { AppConfig } from '../config/app.config';

@Injectable({
  providedIn: 'root'
})
export class UtilsService {

  /**
   * Formatea un tamaño de archivo en bytes a una representación legible
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
  
  /**
   * Calcula la distancia entre dos puntos geográficos usando la fórmula de Haversine
   */
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radio de la Tierra en km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const distance = R * c; // Distancia en km
    return distance;
  }
  
  /**
   * Convierte grados a radianes
   */
  private deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }
  
  /**
   * Valida coordenadas geográficas
   */
  validateCoordinates(lat: number, lon: number): boolean {
    return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
  }
  
  /**
   * Genera un ID único
   */
  generateUniqueId(prefix = 'id'): string {
    return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  }
  
  /**
   * Trunca un texto a una longitud máxima añadiendo puntos suspensivos
   */
  truncateText(text: string, maxLength = 100): string {
    if (!text) return '';
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  }
  
  /**
   * Formatea una fecha según el formato configurado
   */
  formatDate(date: Date | string | number): string {
    if (!date) return '';
    const dateObj = typeof date === 'object' ? date : new Date(date);
    return dateObj.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
  
  /**
   * Formatea una fecha con hora según el formato configurado
   */
  formatDateTime(date: Date | string | number): string {
    if (!date) return '';
    const dateObj = typeof date === 'object' ? date : new Date(date);
    return dateObj.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  /**
   * Genera un color aleatorio en formato hexadecimal
   */
  getRandomColor(): string {
    return `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;
  }
  
  /**
   * Comprueba si un objeto es vacío
   */
  isEmptyObject(obj: any): boolean {
    return obj && Object.keys(obj).length === 0 && obj.constructor === Object;
  }
  
  /**
   * Crea un deep copy de un objeto
   */
  deepCopy<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  }
  
  /**
   * Convierte un objeto a su representación de consulta URL
   */
  objectToQueryParams(obj: any): string {
    return Object.keys(obj)
      .filter(key => obj[key] !== undefined && obj[key] !== null)
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(obj[key])}`)
      .join('&');
  }
  
  /**
   * Retorna un objeto con solo las propiedades especificadas
   */
  pickProperties<T extends object, K extends keyof T>(obj: T, props: K[]): Pick<T, K> {
    return props.reduce((result, prop) => {
      if (prop in obj) {
        result[prop] = obj[prop];
      }
      return result;
    }, {} as Pick<T, K>);
  }
  
  /**
   * Retorna un valor con una unidad de medida
   */
  formatWithUnit(value: number, unit: string, decimals = 2): string {
    return `${value.toFixed(decimals)} ${unit}`;
  }
} 
