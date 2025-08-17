import { NgModule } from '@angular/core';
import { ConnectionService } from './services/connection.service';
import { OfflineStorageService } from './services/offline-storage.service';
import { SyncService } from './services/sync.service';

/**
 * Configuración para los servicios de funcionamiento offline
 * Nota: Los servicios se proporcionan ahora directamente en los archivos de servicio
 * con provideIn: 'root', y los componentes son standalone.
 */
@NgModule()
export class OfflineModule {
  // Se mantiene como una clase vacía para compatibilidad hasta que se elimine por completo
} 
