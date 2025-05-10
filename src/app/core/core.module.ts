import { NgModule, Optional, SkipSelf } from '@angular/core';
import { HTTP_INTERCEPTORS } from '@angular/common/http';

// Servicios
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

// Interceptores
import { AuthInterceptor } from '@core/interceptors/auth.interceptor';
import { ErrorInterceptor } from '@core/interceptors/error.interceptor';

/**
 * Módulo Core para servicios singleton y configuración global
 * Solo debe ser importado en AppModule
 */
@NgModule({
  providers: [
    // Servicios
    AuthService,
    HelpService,
    LoggerService,
    LocalStorageService,
    NetworkService,
    UserService,
    AlertService,
    MonitoringService,
    ReportService,
    ProjectService,
    
    // Interceptores
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true }
  ]
})
export class CoreModule {
  /**
   * Constructor con protección contra importaciones múltiples
   */
  constructor(@Optional() @SkipSelf() parentModule: CoreModule) {
    if (parentModule) {
      throw new Error(
        'CoreModule ya ha sido cargado. Importarlo solo en AppModule.'
      );
    }
  }
} 