import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MapStateManagerService } from './map-state-manager.service';
import { MapElementManagerService } from './map-element-manager.service';
import { MapRenderingService } from './map-rendering.service';
import { MapInteractionService } from './map-interaction.service';

/**
 * Módulo para registrar y proveer todos los servicios relacionados con el mapa
 * 
 * Este módulo facilita la importación de todos los servicios de mapa en un único punto,
 * mejorando la organización del código y reduciendo las dependencias individuales.
 */
@NgModule({
  imports: [
    CommonModule
  ],
  providers: [
    MapStateManagerService,
    MapElementManagerService,
    MapRenderingService,
    MapInteractionService
  ]
})
export class MapServicesModule {} 