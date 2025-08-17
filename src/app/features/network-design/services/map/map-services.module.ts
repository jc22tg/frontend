import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MapService } from '../map.service';
import { MapPerformanceService } from './map-performance.service';
import { MapStateService } from './state/map-state.service';
import { MapToolsService } from './map-tools.service';
import { StandaloneAdapterService } from './standalone-adapter.service';
import { MapElementManagerAdapter } from './standalone-adapters/map-element-manager-adapter';
import { MapStateManagerService } from './map-state-manager.service';

/**
 * Módulo que contiene todos los servicios relacionados con el mapa
 */
@NgModule({
  imports: [
    CommonModule
  ],
  providers: [
    MapService,
    MapStateService,
    MapPerformanceService,
    MapToolsService,
    StandaloneAdapterService,
    MapElementManagerAdapter,
    MapStateManagerService
  ]
})
export class MapServicesModule { } 
