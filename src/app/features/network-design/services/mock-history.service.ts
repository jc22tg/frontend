import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

// Tipos de cambios
export enum ChangeType {
  CREATED = 'CREATED',
  UPDATED = 'UPDATED',
  DELETED = 'DELETED',
  MAINTENANCE = 'MAINTENANCE',
  STATUS_CHANGE = 'STATUS_CHANGE'
}

// Tipos de mantenimiento
export enum MaintenanceType {
  PREVENTIVE = 'PREVENTIVE',
  CORRECTIVE = 'CORRECTIVE',
  INSTALLATION = 'INSTALLATION',
  UPGRADE = 'UPGRADE'
}

// Interfaz para representar un cambio en un campo específico
export interface FieldChange {
  fieldName: string;
  displayName: string;
  oldValue: any;
  newValue: any;
}

// Interfaz para representar un cambio en un elemento
export interface ElementChange {
  id: string;
  elementId: string;
  timestamp: Date;
  userId: string;
  userName: string;
  changeType: ChangeType;
  changes: FieldChange[];
}

// Interfaz para un evento de mantenimiento
export interface MaintenanceEvent {
  id: string;
  elementId: string;
  timestamp: Date;
  userId: string;
  userName: string;
  type: MaintenanceType;
  description: string;
  details: Record<string, any>;
  completed: boolean;
  completedDate?: Date;
  completedBy?: string;
}

/**
 * Servicio para proporcionar datos mock para el historial de elementos
 * 
 * Este servicio es temporal y debería reemplazarse por una implementación
 * real que obtenga los datos del backend cuando esté disponible.
 */
@Injectable({
  providedIn: 'root'
})
export class MockHistoryService {
  
  constructor() { }
  
  /**
   * Obtiene cambios de historial simulados para un elemento
   */
  getElementChanges(elementId: string): Observable<ElementChange[]> {
    return of(this.generateMockChanges(elementId)).pipe(
      delay(1000) // Simular latencia de red
    );
  }
  
  /**
   * Obtiene eventos de mantenimiento simulados para un elemento
   */
  getMaintenanceEvents(elementId: string): Observable<MaintenanceEvent[]> {
    return of(this.generateMockMaintenanceEvents(elementId)).pipe(
      delay(1200) // Simular latencia de red
    );
  }
  
  /**
   * Genera cambios de historial simulados
   */
  private generateMockChanges(elementId: string): ElementChange[] {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    return [
      {
        id: '1',
        elementId: elementId,
        timestamp: new Date(),
        userId: 'user1',
        userName: 'Administrador del Sistema',
        changeType: ChangeType.UPDATED,
        changes: [
          {
            fieldName: 'status',
            displayName: 'Estado',
            oldValue: 'INACTIVE',
            newValue: 'ACTIVE'
          },
          {
            fieldName: 'description',
            displayName: 'Descripción',
            oldValue: 'Punto de distribución principal',
            newValue: 'Punto de distribución principal (actualizado)'
          }
        ]
      },
      {
        id: '2',
        elementId: elementId,
        timestamp: yesterday,
        userId: 'user2',
        userName: 'Técnico de Red',
        changeType: ChangeType.MAINTENANCE,
        changes: [
          {
            fieldName: 'lastMaintenance',
            displayName: 'Último mantenimiento',
            oldValue: null,
            newValue: yesterday.toISOString()
          },
          {
            fieldName: 'maintenanceNotes',
            displayName: 'Notas de mantenimiento',
            oldValue: '',
            newValue: 'Mantenimiento preventivo realizado'
          }
        ]
      },
      {
        id: '3',
        elementId: elementId,
        timestamp: twoWeeksAgo,
        userId: 'user3',
        userName: 'Ingeniero de Proyecto',
        changeType: ChangeType.STATUS_CHANGE,
        changes: [
          {
            fieldName: 'status',
            displayName: 'Estado',
            oldValue: 'PLANNED',
            newValue: 'INACTIVE'
          }
        ]
      },
      {
        id: '4',
        elementId: elementId,
        timestamp: threeMonthsAgo,
        userId: 'user1',
        userName: 'Administrador del Sistema',
        changeType: ChangeType.CREATED,
        changes: [
          {
            fieldName: 'id',
            displayName: 'ID',
            oldValue: null,
            newValue: elementId
          },
          {
            fieldName: 'name',
            displayName: 'Nombre',
            oldValue: null,
            newValue: 'Nuevo elemento'
          },
          {
            fieldName: 'type',
            displayName: 'Tipo',
            oldValue: null,
            newValue: 'OLT'
          },
          {
            fieldName: 'status',
            displayName: 'Estado',
            oldValue: null,
            newValue: 'PLANNED'
          }
        ]
      }
    ];
  }
  
  /**
   * Genera eventos de mantenimiento simulados
   */
  private generateMockMaintenanceEvents(elementId: string): MaintenanceEvent[] {
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
    
    return [
      {
        id: '1',
        elementId: elementId,
        timestamp: lastWeek,
        userId: 'tech1',
        userName: 'Técnico de Mantenimiento',
        type: MaintenanceType.PREVENTIVE,
        description: 'Mantenimiento preventivo programado',
        details: {
          'Temperatura': '35°C',
          'Humedad': '45%',
          'Limpieza': 'Realizada',
          'Conexiones': 'Verificadas'
        },
        completed: true,
        completedDate: new Date(),
        completedBy: 'Técnico de Mantenimiento'
      },
      {
        id: '2',
        elementId: elementId,
        timestamp: lastMonth,
        userId: 'tech2',
        userName: 'Ingeniero de Red',
        type: MaintenanceType.CORRECTIVE,
        description: 'Reparación de fuente de alimentación',
        details: {
          'Problema detectado': 'Fallo en la fuente de alimentación',
          'Componentes reemplazados': 'Fuente de alimentación (modelo XYZ-123)',
          'Causa raíz': 'Sobretensión'
        },
        completed: true,
        completedDate: lastMonth,
        completedBy: 'Ingeniero de Red'
      },
      {
        id: '3',
        elementId: elementId,
        timestamp: twoMonthsAgo,
        userId: 'tech3',
        userName: 'Equipo de Instalación',
        type: MaintenanceType.INSTALLATION,
        description: 'Instalación inicial del equipo',
        details: {
          'Modelos instalados': 'OLT-8800, PSU-1200',
          'Configuración inicial': 'Completada',
          'Pruebas': 'Exitosas',
          'Conexiones realizadas': '48 puertos'
        },
        completed: true,
        completedDate: twoMonthsAgo,
        completedBy: 'Equipo de Instalación'
      },
      {
        id: '4',
        elementId: elementId,
        timestamp: new Date(),
        userId: 'tech4',
        userName: 'Equipo de Actualización',
        type: MaintenanceType.UPGRADE,
        description: 'Actualización de firmware programada',
        details: {
          'Versión actual': '2.3.1',
          'Versión objetivo': '3.0.2',
          'Tiempo estimado': '2 horas',
          'Ventana de mantenimiento': '22:00 - 01:00'
        },
        completed: false
      }
    ];
  }
} 