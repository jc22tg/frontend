import { Injectable } from '@angular/core';

/**
 * Servicio para el manejo de almacenamiento local del navegador
 */
@Injectable({
  providedIn: 'root'
})
export class LocalStorageService {
  
  /**
   * Guarda un valor en el almacenamiento local
   * @param key Clave para almacenar el valor
   * @param value Valor a almacenar (será convertido a JSON)
   */
  set(key: string, value: any): void {
    try {
      const serializedValue = JSON.stringify(value);
      localStorage.setItem(key, serializedValue);
    } catch (error) {
      console.error('Error al guardar en localStorage:', error);
    }
  }

  /**
   * Obtiene un valor desde el almacenamiento local
   * @param key Clave del valor a obtener
   * @param defaultValue Valor por defecto si la clave no existe
   * @returns El valor almacenado o el valor por defecto
   */
  get<T>(key: string, defaultValue: T | null = null): T | null {
    try {
      const item = localStorage.getItem(key);
      if (item === null) {
        return defaultValue;
      }
      return JSON.parse(item);
    } catch (error) {
      console.error('Error al leer de localStorage:', error);
      return defaultValue;
    }
  }

  /**
   * Elimina un valor del almacenamiento local
   * @param key Clave del valor a eliminar
   */
  remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error al eliminar de localStorage:', error);
    }
  }

  /**
   * Limpia todo el almacenamiento local
   */
  clear(): void {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error al limpiar localStorage:', error);
    }
  }

  /**
   * Verifica si existe una clave en el almacenamiento local
   * @param key Clave a verificar
   * @returns true si la clave existe, false en caso contrario
   */
  has(key: string): boolean {
    return localStorage.getItem(key) !== null;
  }

  /**
   * Obtiene todas las claves presentes en el almacenamiento local
   * @returns Array con todas las claves
   */
  keys(): string[] {
    return Object.keys(localStorage);
  }

  /**
   * Obtiene el tamaño aproximado del almacenamiento local en uso (en bytes)
   * @returns Tamaño aproximado en bytes
   */
  size(): number {
    let totalSize = 0;
    for (const key of this.keys()) {
      const value = localStorage.getItem(key);
      if (value) {
        totalSize += key.length + value.length;
      }
    }
    return totalSize * 2; // aproximación del tamaño en bytes (cada carácter ocupa 2 bytes en UTF-16)
  }
} 