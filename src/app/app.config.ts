import { ApplicationConfig } from '@angular/core';
import { provideRouter, withPreloading } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideStore } from '@ngrx/store';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { provideEffects } from '@ngrx/effects';
import { reducers, appEffects } from './core/store';
import { MATERIAL_SANITY_CHECKS } from '@angular/material/core';

// Importar funciones de interceptor
import { authInterceptorFn } from './core/interceptors/auth.interceptor.fn';
import { errorInterceptorFn } from './core/interceptors/error.interceptor.fn';

// Importar servicios del CoreModule directamente
import { AuthService } from '@core/services/auth.service';
import { HelpService } from '@core/services/help/help.service';
import { LoggerService } from '@core/services/logger.service';
import { LocalStorageService } from '@core/services/local-storage.service';
import { NetworkService } from '@core/services/network.service';
import { UserService } from '@core/services/user.service';
import { AlertService } from '@core/services/alert.service';
import { MonitoringService } from '@core/services/monitoring.service';
import { ReportService } from '@core/services/report.service';
import { ProjectService } from '@core/services/project.service';
import { AuthMapperService } from '@core/services/auth-mapper.service';

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

// Estrategia de precarga personalizada
import { CustomPreloadingStrategy } from './app.config.preload';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      routes,
      withPreloading(CustomPreloadingStrategy)
    ),
    provideHttpClient(withInterceptors([authInterceptorFn, errorInterceptorFn])),
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

    AuthService,
    AuthMapperService,
    HelpService,
    LoggerService,
    LocalStorageService,
    NetworkService,
    UserService,
    AlertService,
    MonitoringService,
    ReportService,
    ProjectService,
    
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
