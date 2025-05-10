import { ApplicationConfig, inject, Injectable } from '@angular/core';
import { provideRouter, withPreloading, PreloadingStrategy, Route } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideStore } from '@ngrx/store';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { provideEffects } from '@ngrx/effects';
import { reducers, appEffects } from './core/store';
import { MATERIAL_SANITY_CHECKS } from '@angular/material/core';
import { Observable, of } from 'rxjs';
import { importProvidersFrom } from '@angular/core';
import { CoreModule } from './core/core.module';

// Servicios del diseñador de red
import { NetworkEventBusService } from '@features/network-design/services/network-event-bus.service';
import { MapComponentInitializerService } from '@features/network-design/services/map-component-initializer.service';
import { NetworkStateService } from '@features/network-design/services/network-state.service';
import { MapService } from '@features/network-design/services/map.service';
import { LayerService } from '@features/network-design/services/layer.service';
import { ElementService } from '@features/network-design/services/element.service';
import { MapFacadeService } from '@features/network-design/services/map-facade.service';
import { PanelManagerService } from '@features/network-design/services/panel-manager.service';
import { MapShortcutsService } from '@features/network-design/services/map-shortcuts.service';
import { NetworkMapStateService } from '@features/network-design/services/network-map-state.service';
import { NetworkMapRendererService } from '@features/network-design/services/network-map-renderer.service';
import { VirtualizationService } from '@features/network-design/services/virtualization.service';
import { MapEventsService } from '@features/network-design/services/map-events.service';
import { LayerManagerService } from '@features/network-design/services/layer-manager.service';
import { WidgetStateService } from '@features/network-design/services/widget-state.service';
import { MapConfigService } from '@features/network-design/services/map-config.service';
import { HardwareDetectionService } from '@features/network-design/services/hardware-detection.service';
import { NetworkCalculationService } from '@features/network-design/services/network-calculation.service';
import { MapPositionService } from '@features/network-design/services/map-position.service';
import { MapExportService } from '@features/network-design/services/map-export.service';

// Estrategia de precarga personalizada para cargar módulos marcados como "preload: true"
@Injectable({
  providedIn: 'root'
})
export class CustomPreloadingStrategy implements PreloadingStrategy {
  preload(route: Route, load: () => Observable<any>): Observable<any> {
    return route.data?.['preload'] === true ? load() : of(null);
  }
}

export const appConfig: ApplicationConfig = {
  providers: [
    // Importar el CoreModule para servicios e interceptores centrales
    importProvidersFrom(CoreModule),
    
    provideRouter(
      routes,
      withPreloading(CustomPreloadingStrategy) // Usar estrategia personalizada
    ),
    provideHttpClient(),
    provideAnimations(),
    provideStore(reducers),
    provideEffects(appEffects),
    provideStoreDevtools({
      maxAge: 25,
      logOnly: false,
      autoPause: true,
      trace: false,
      traceLimit: 75,
    }),
    { provide: MATERIAL_SANITY_CHECKS, useValue: true },
    
    // Proveedores para el diseño de red
    // El bus de eventos debe registrarse primero para estar disponible a todos los servicios
    NetworkEventBusService,
    MapComponentInitializerService,
    NetworkStateService,
    MapService,
    LayerService,
    ElementService,
    MapFacadeService,
    PanelManagerService,
    MapShortcutsService,
    NetworkMapStateService,
    NetworkMapRendererService,
    VirtualizationService,
    MapEventsService,
    LayerManagerService,
    WidgetStateService,
    MapConfigService,
    HardwareDetectionService,
    NetworkCalculationService,
    MapPositionService,
    MapExportService
  ]
};
