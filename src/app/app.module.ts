import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';

import { AppComponent } from './app.component';
import { CoreModule } from './core/core.module';
import { reducers, appEffects } from './core/store';
import { environment } from '../environments/environment';

// Servicios de mapa
import { MapService } from './features/network-design/services/map.service';
import { NetworkStateService } from './features/network-design/services/network-state.service';
import { MapElementService } from './features/network-design/services/map-element.service';
import { NetworkDesignService } from './features/network-design/services/network-design.service';
import { NetworkEventBusService } from './features/network-design/services/network-event-bus.service';
import { NetworkDiagnosticsService } from './features/network-design/services/network-diagnostics.service';

// Tokens de inyección para evitar dependencias circulares
import { 
  MAP_SERVICE_TOKEN, 
  NETWORK_STATE_SERVICE_TOKEN, 
  MAP_ELEMENT_SERVICE_TOKEN,
  NETWORK_DESIGN_SERVICE_TOKEN
} from './features/network-design/services/event-tokens';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    RouterModule.forRoot([]),
    StoreModule.forRoot(reducers),
    EffectsModule.forRoot(appEffects),
    StoreDevtoolsModule.instrument({
      maxAge: 25,
      logOnly: environment.production
    }),
    CoreModule
  ],
  providers: [
    // Servicios fundamentales
    NetworkEventBusService,
    NetworkDiagnosticsService,
    
    // Proveedores con tokens para desacoplar servicios
    { provide: MAP_SERVICE_TOKEN, useExisting: MapService },
    { provide: NETWORK_STATE_SERVICE_TOKEN, useExisting: NetworkStateService },
    { provide: MAP_ELEMENT_SERVICE_TOKEN, useExisting: MapElementService },
    { provide: NETWORK_DESIGN_SERVICE_TOKEN, useExisting: NetworkDesignService }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { } 