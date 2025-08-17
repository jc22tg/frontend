import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { skip } from 'rxjs/operators';

import { MonitoringDashboardFacade } from './monitoring-dashboard.facade';
import { ElementService } from '../services/element.service';
import { ConnectionService } from '../services/connection.service';
import { MonitoringService } from '../services/monitoring.service';
import { WidgetStateService } from '../services/widget-state.service';
import { WidgetDataService } from '../services/widget-data.service';
import { LoggerService } from '../../../core/services/logger.service';

describe('MonitoringDashboardFacade', () => {
  let facade: MonitoringDashboardFacade;
  let elementServiceMock: jasmine.SpyObj<ElementService>;
  let connectionServiceMock: jasmine.SpyObj<ConnectionService>;
  let monitoringServiceMock: jasmine.SpyObj<MonitoringService>;
  let widgetStateServiceMock: jasmine.SpyObj<WidgetStateService>;
  let widgetDataServiceMock: jasmine.SpyObj<WidgetDataService>;
  let loggerServiceMock: jasmine.SpyObj<LoggerService>;

  beforeEach(() => {
    elementServiceMock = jasmine.createSpyObj('ElementService', ['getElements']);
    connectionServiceMock = jasmine.createSpyObj('ConnectionService', ['getConnections']);
    monitoringServiceMock = jasmine.createSpyObj('MonitoringService', ['getMetrics', 'getAlerts']);
    widgetStateServiceMock = jasmine.createSpyObj('WidgetStateService', [
      'refreshAllWidgetsData',
      'refreshWidgetsData'
    ]);
    widgetDataServiceMock = jasmine.createSpyObj('WidgetDataService', [
      'fetchNetworkMetrics',
      'fetchConnectionStatus',
      'fetchRecentAlerts'
    ]);
    loggerServiceMock = jasmine.createSpyObj('LoggerService', ['error', 'debug', 'info']);

    // Setup mock returns
    widgetDataServiceMock.fetchNetworkMetrics.and.returnValue(of({
      elementCount: 100,
      connectionCount: 50,
      utilization: 75,
      health: 85
    }));
    
    widgetDataServiceMock.fetchConnectionStatus.and.returnValue(of({
      total: 50,
      active: 45,
      inactive: 3,
      warning: 1,
      error: 1
    }));
    
    widgetDataServiceMock.fetchRecentAlerts.and.returnValue(of([]));

    TestBed.configureTestingModule({
      providers: [
        MonitoringDashboardFacade,
        { provide: ElementService, useValue: elementServiceMock },
        { provide: ConnectionService, useValue: connectionServiceMock },
        { provide: MonitoringService, useValue: monitoringServiceMock },
        { provide: WidgetStateService, useValue: widgetStateServiceMock },
        { provide: WidgetDataService, useValue: widgetDataServiceMock },
        { provide: LoggerService, useValue: loggerServiceMock }
      ]
    });

    facade = TestBed.inject(MonitoringDashboardFacade);
  });

  it('should be created', () => {
    expect(facade).toBeTruthy();
  });

  it('should initialize dashboard and load data', (done) => {
    // Subscribe to loading observable to test changes
    facade.loading$.pipe(skip(1)).subscribe(loading => {
      expect(loading).toBeFalse();
      done();
    });

    // Call initialize and check result
    facade.initializeDashboard().subscribe(result => {
      expect(result).toBeTrue();
    });

    // Check that services were called
    expect(widgetDataServiceMock.fetchNetworkMetrics).toHaveBeenCalled();
    expect(widgetDataServiceMock.fetchConnectionStatus).toHaveBeenCalled();
    expect(widgetDataServiceMock.fetchRecentAlerts).toHaveBeenCalled();
  });

  it('should handle initialization errors', (done) => {
    // Set up error condition
    widgetDataServiceMock.fetchNetworkMetrics.and.returnValue(
      throwError(() => new Error('Network error'))
    );

    // Subscribe to error observable
    facade.error$.pipe(skip(1)).subscribe(error => {
      expect(error.hasError).toBeTrue();
      expect(error.errorCode).toBe('INIT_ERROR');
      done();
    });

    // Call initialize and check result
    facade.initializeDashboard().subscribe(result => {
      expect(result).toBeFalse();
    });

    // Check that logger was called
    expect(loggerServiceMock.error).toHaveBeenCalled();
  });

  it('should refresh dashboard and request widget updates', (done) => {
    // Subscribe to loading observable
    facade.loading$.pipe(skip(1)).subscribe(loading => {
      expect(loading).toBeFalse();
      done();
    });

    // Call refresh and check result
    facade.refreshDashboard().subscribe(result => {
      expect(result).toBeTrue();
    });

    // Check that widget updates were requested
    expect(widgetStateServiceMock.refreshAllWidgetsData).toHaveBeenCalledWith('monitoring-dashboard');
    expect(widgetDataServiceMock.fetchNetworkMetrics).toHaveBeenCalled();
  });

  it('should toggle auto-refresh', () => {
    // Start with no auto-refresh
    expect(facade['autoRefreshActive'].value).toBeFalse();
    
    // Enable auto-refresh
    facade.toggleAutoRefresh(true, 30000);
    expect(facade['autoRefreshActive'].value).toBeTrue();
    expect(facade['autoRefreshInterval']).toBe(30000);
    
    // Make sure subscription exists
    expect(facade['autoRefreshSubscription']).toBeTruthy();
    
    // Disable auto-refresh
    facade.toggleAutoRefresh(false);
    expect(facade['autoRefreshActive'].value).toBeFalse();
    expect(facade['autoRefreshSubscription']).toBeNull();
  });

  it('should clean up resources on destroy', () => {
    // Setup auto-refresh
    facade.toggleAutoRefresh(true);
    expect(facade['autoRefreshSubscription']).toBeTruthy();
    
    // Call destroy
    facade.destroy();
    expect(facade['autoRefreshSubscription']).toBeNull();
    expect(facade['autoRefreshActive'].value).toBeFalse();
  });
}); 
