import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { NgOptimizedImage } from '@angular/common';

import { AppComponent } from './app.component';
import { routes } from './app.routes';
import { AuthInterceptor } from './core/interceptors/auth.interceptor';
// import { CoreModule } from './core/core.module'; // Comentado porque no se encuentra
import { reducers, appEffects } from './core/store';
import { environment } from '../environments/environment';
// import { SharedModule } from './shared/shared.module'; // Comentado porque no se encuentra
import { OfflineModule } from './offline/offline.module';

// Servicios de mapa
import { MapService } from './features/network-design/services/map.service';
import { NetworkStateService } from './features/network-design/services/network-state.service';
import { MapElementService } from './features/network-design/services/map-element.service';
import { NetworkDesignService } from './features/network-design/services/network-design.service';
import { NetworkEventBusService } from './features/network-design/services/network-event-bus.service';

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
    RouterModule.forRoot(routes),
    StoreModule.forRoot(reducers),
    EffectsModule.forRoot(appEffects),
    StoreDevtoolsModule.instrument({
      maxAge: 25,
      logOnly: environment.production
    }),
    // CoreModule, // Comentado porque no se encuentra
    // SharedModule, // Comentado porque no se encuentra
    OfflineModule,
    MatSidenavModule,
    MatToolbarModule,
    MatTabsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatPaginatorModule,
    MatCheckboxModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatSnackBarModule,
    ReactiveFormsModule,
    FormsModule,
    NgOptimizedImage
  ],
  providers: [
    // Servicios fundamentales
    NetworkEventBusService,
    
    // Proveedores con tokens para desacoplar servicios
    { provide: MAP_SERVICE_TOKEN, useExisting: MapService },
    { provide: NETWORK_STATE_SERVICE_TOKEN, useExisting: NetworkStateService },
    { provide: MAP_ELEMENT_SERVICE_TOKEN, useExisting: MapElementService },
    { provide: NETWORK_DESIGN_SERVICE_TOKEN, useExisting: NetworkDesignService },
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { } 
