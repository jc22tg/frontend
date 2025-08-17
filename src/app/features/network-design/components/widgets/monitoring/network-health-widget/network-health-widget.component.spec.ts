import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { BehaviorSubject, of, throwError } from 'rxjs';

import { NetworkHealthWidgetComponent } from './network-health-widget.component';
import { WidgetStateService } from '../../../../services/widget-state.service';
import { WidgetDataService } from '../../../../services/widget-data.service';
import { ErrorDisplayComponent } from '../../../../../../shared/components/error-display/error-display.component';
import { WidgetRenderService } from '../../../../services/widget-render.service';

describe('NetworkHealthWidgetComponent', () => {
  let component: NetworkHealthWidgetComponent;
  let fixture: ComponentFixture<NetworkHealthWidgetComponent>;
  let widgetStateServiceMock: jasmine.SpyObj<WidgetStateService>;
  let widgetDataServiceMock: jasmine.SpyObj<WidgetDataService>;
  let widgetRenderServiceMock: jasmine.SpyObj<WidgetRenderService>;
  const widgetState$ = new BehaviorSubject({ 
    id: 'network-health-widget', 
    isVisible: true, 
    isCollapsed: false 
  });

  beforeEach(async () => {
    widgetStateServiceMock = jasmine.createSpyObj('WidgetStateService', [
      'getWidgetState',
      'getCurrentWidgetState',
      'updateWidgetState',
      'setWidgetVisibility',
      'toggleWidgetCollapse',
      'clearWidgetError',
      'registerWidgetError',
      'refreshWidgetsRequest$'
    ]);
    
    widgetRenderServiceMock = jasmine.createSpyObj('WidgetRenderService', [
      'initializeWidget',
      'setupDraggableWidget',
      'showWidgetError'
    ]);
    
    widgetDataServiceMock = jasmine.createSpyObj('WidgetDataService', [
      'fetchNetworkMetrics'
    ]);
    
    widgetStateServiceMock.getWidgetState.and.returnValue(widgetState$);
    widgetStateServiceMock.getCurrentWidgetState.and.returnValue(widgetState$.value);
    widgetRenderServiceMock.initializeWidget.and.returnValue({ success: true });
    widgetStateServiceMock.refreshWidgetsRequest$ = of({ source: 'test' });
    widgetDataServiceMock.fetchNetworkMetrics.and.returnValue(of({
      elementCount: 100,
      connectionCount: 50,
      utilization: 75,
      health: 85
    }));

    await TestBed.configureTestingModule({
      imports: [
        CommonModule, 
        MatIconModule,
        MatButtonModule,
        MatDividerModule,
        MatProgressSpinnerModule,
        NoopAnimationsModule
      ],
      declarations: [
        NetworkHealthWidgetComponent,
        ErrorDisplayComponent
      ],
      providers: [
        { provide: WidgetStateService, useValue: widgetStateServiceMock },
        { provide: WidgetDataService, useValue: widgetDataServiceMock },
        { provide: WidgetRenderService, useValue: widgetRenderServiceMock }
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NetworkHealthWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load network metrics on init', () => {
    component.ngOnInit();
    expect(widgetDataServiceMock.fetchNetworkMetrics).toHaveBeenCalled();
    expect(component.networkMetrics).toBeTruthy();
    expect(component.networkMetrics?.elementCount).toBe(100);
    expect(component.networkMetrics?.connectionCount).toBe(50);
    expect(component.networkMetrics?.health).toBe(85);
  });

  it('should return correct health color based on health value', () => {
    expect(component.getHealthColor(25)).toBe('warn');
    expect(component.getHealthColor(50)).toBe('accent');
    expect(component.getHealthColor(85)).toBe('primary');
  });

  it('should clear widget error and reload data when refreshData is called', () => {
    spyOn(component.widgetUpdate, 'emit');
    component.refreshData();
    
    expect(widgetStateServiceMock.clearWidgetError).toHaveBeenCalledWith('network-health-widget');
    expect(widgetDataServiceMock.fetchNetworkMetrics).toHaveBeenCalled();
    expect(component.isLoading).toBeFalsy(); // Should become false after data loads
  });

  it('should handle errors when fetching metrics fails', () => {
    // Mock the fetchNetworkMetrics to return an error
    widgetDataServiceMock.fetchNetworkMetrics.and.returnValue(
      throwError(() => new Error('Network error'))
    );
    
    // Spy on error handling methods
    const handleErrorSpy = spyOn<any>(component, 'handleError');
    
    // Set some initial stats
    component.elementStats = { 
      total: 10, 
      active: 8, 
      warning: 1, 
      error: 1, 
      maintenance: 0, 
      inactive: 0 
    };
    
    // Call refreshData to trigger the error
    component.refreshData();
    fixture.detectChanges();
    
    // Verify error handling
    expect(handleErrorSpy).toHaveBeenCalled();
    expect(widgetStateServiceMock.registerWidgetError).toHaveBeenCalledWith(
      'network-health-widget',
      jasmine.objectContaining({
        code: 'FETCH_METRICS_ERROR',
        message: 'Error al cargar métricas de red'
      })
    );
    
    // Should set fallback data using elementStats
    expect(component.networkMetrics?.elementCount).toBe(10);
  });

  it('should emit update event when data is loaded successfully', () => {
    spyOn(component.widgetUpdate, 'emit');
    
    component.refreshData();
    
    expect(component.widgetUpdate.emit).toHaveBeenCalled();
  });
}); 
