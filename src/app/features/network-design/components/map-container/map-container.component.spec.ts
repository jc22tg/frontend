import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { By } from '@angular/platform-browser';
import { Router } from '@angular/router';

import { MapContainerComponent } from './map-container.component';
import { NetworkToolbarComponent } from '../network-toolbar/network-toolbar.component';
import { MapStateManagerService } from '../../services/map/map-state-manager.service';
import { MapService } from '../../services/map.service';
import { MapToolsService } from '../../services/map/map-tools.service';
import { MapStateService } from '../../services/map/state/map-state.service';
import { MapPerformanceService } from '../../services/map/map-performance.service';
import { StandaloneAdapterService } from '../../services/map/standalone-adapter.service';
import { MapElementManagerAdapter } from '../../services/map/standalone-adapters/map-element-manager-adapter';

describe('MapContainerComponent', () => {
  let component: MapContainerComponent;
  let fixture: ComponentFixture<MapContainerComponent>;
  let mapStateManagerServiceSpy: jasmine.SpyObj<MapStateManagerService>;
  let mapElementManagerAdapterSpy: jasmine.SpyObj<MapElementManagerAdapter>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;

  beforeEach(async () => {
    // Crear servicios mock
    const mapStateManagerSpy = jasmine.createSpyObj('MapStateManagerService', ['setTool', 'getCurrentTool']);
    mapStateManagerSpy.currentTool = of('pan');
    
    const mapServiceSpy = jasmine.createSpyObj('MapService', ['initialize']);
    mapServiceSpy.isReady$ = of(true);
    
    const mapToolsServiceSpy = jasmine.createSpyObj('MapToolsService', ['getAvailableTools']);
    
    const mapStateServiceSpy = jasmine.createSpyObj('MapStateService', [
      'setZoom', 'setCenter', 'setActiveTool', 'getState', 'toggleLayer'
    ]);
    mapStateServiceSpy.mapState$ = of({
      zoom: 16,
      center: [19.783750, -70.676666],
      bounds: [[19.77, -70.68], [19.79, -70.67]]
    });
    mapStateServiceSpy.getState.and.returnValue({
      zoom: 16,
      center: [19.783750, -70.676666],
      bounds: [[19.77, -70.68], [19.79, -70.67]]
    });
    
    const mapPerformanceServiceSpy = jasmine.createSpyObj('MapPerformanceService', ['initialize']);
    
    const standaloneAdapterServiceSpy = jasmine.createSpyObj('StandaloneAdapterService', ['getFeatureFlag']);
    standaloneAdapterServiceSpy.featureFlags = of({ enableStandaloneMode: true });
    standaloneAdapterServiceSpy.getFeatureFlag.and.returnValue(true);
    
    mapElementManagerAdapterSpy = jasmine.createSpyObj('MapElementManagerAdapter', [
      'selectElement', 'deselectElement', 'getSelectedElement', 'getSelectedElements'
    ]);
    mapElementManagerAdapterSpy.elementsChanged = of([]);
    mapElementManagerAdapterSpy.getSelectedElements.and.returnValue([]);

    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        MatSnackBarModule,
        NoopAnimationsModule,
        MapContainerComponent
      ],
      providers: [
        { provide: MapStateManagerService, useValue: mapStateManagerSpy },
        { provide: MapService, useValue: mapServiceSpy },
        { provide: MapToolsService, useValue: mapToolsServiceSpy },
        { provide: MapStateService, useValue: mapStateServiceSpy },
        { provide: MapPerformanceService, useValue: mapPerformanceServiceSpy },
        { provide: StandaloneAdapterService, useValue: standaloneAdapterServiceSpy },
        { provide: MapElementManagerAdapter, useValue: mapElementManagerAdapterSpy }
      ]
    }).compileComponents();

    mapStateManagerServiceSpy = TestBed.inject(MapStateManagerService) as jasmine.SpyObj<MapStateManagerService>;
    
    fixture = TestBed.createComponent(MapContainerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debería crear el componente', () => {
    expect(component).toBeTruthy();
  });

  it('debería inicializar en modo standalone cuando la bandera está habilitada', () => {
    expect(component.useStandaloneComponents).toBeTrue();
  });

  it('debería cambiar de herramienta correctamente al llamar a setTool', () => {
    component.setTool('measure');
    expect(mapStateManagerServiceSpy.setTool).toHaveBeenCalledWith('measure');
  });

  it('debería manejar la selección de elementos correctamente', () => {
    const mockElement = { id: 'test-element-123', type: 'splitter', name: 'Test Splitter' };
    component.onElementSelected(mockElement);
    expect(mapElementManagerAdapterSpy.selectElement).toHaveBeenCalledWith('test-element-123');
  });

  it('debería manejar la deselección de elementos correctamente', () => {
    component.deselectElement();
    expect(mapElementManagerAdapterSpy.deselectElement).toHaveBeenCalled();
  });

  it('debería obtener el elemento seleccionado del adaptador', () => {
    component.getSelectedElement();
    expect(mapElementManagerAdapterSpy.getSelectedElement).toHaveBeenCalled();
  });

  it('debería manejar los eventos del mouse en el mapa', () => {
    // Espiar el método console.log para verificar que se llama
    spyOn(console, 'log');
    
    const mockEvent = new MouseEvent('mousedown');
    component.onMapMouseDown(mockEvent);
    expect(console.log).toHaveBeenCalledWith('MapContainer: Evento mousedown en mapa');
  });

  it('debería procesar correctamente la solicitud de añadir elemento', () => {
    // Espiar el router para verificar la navegación
    const router = TestBed.inject(Router);
    spyOn(router, 'navigate');
    
    component.onAddElement();
    expect(router.navigate).toHaveBeenCalled();
  });

  // Este test verifica la integración con NetworkToolbar
  it('debería tener acceso al evento exportMap desde NetworkToolbar', () => {
    spyOn(component, 'onExportMap');
    
    // Buscar el componente NetworkToolbar y simular evento
    const networkToolbarDebug = fixture.debugElement.query(By.directive(NetworkToolbarComponent));
    if (networkToolbarDebug) {
      const networkToolbarComponent = networkToolbarDebug.componentInstance;
      networkToolbarComponent.exportMap.emit();
      expect(component.onExportMap).toHaveBeenCalled();
    }
  });
}); 
