import { TestBed } from '@angular/core/testing';
import { WidgetStateService, WidgetState } from './widget-state.service';

describe('WidgetStateService', () => {
  let service: WidgetStateService;
  const testWidgetId = 'test-widget';

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WidgetStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should create default state for new widget', (done) => {
    service.getWidgetState(testWidgetId).subscribe((state: WidgetState) => {
      expect(state.id).toBe(testWidgetId);
      expect(state.isVisible).toBeTrue();
      expect(state.isCollapsed).toBeFalse();
      done();
    });
  });

  it('should update widget state', (done) => {
    service.updateWidgetState(testWidgetId, { isCollapsed: true });
    
    service.getWidgetState(testWidgetId).subscribe((state: WidgetState) => {
      expect(state.isCollapsed).toBeTrue();
      done();
    });
  });

  it('should toggle widget collapse state', (done) => {
    // Primero verificamos que está desplegado por defecto
    expect(service.getCurrentWidgetState(testWidgetId).isCollapsed).toBeFalse();
    
    // Alternamos a colapsado
    service.toggleWidgetCollapse(testWidgetId);
    expect(service.getCurrentWidgetState(testWidgetId).isCollapsed).toBeTrue();
    
    // Alternamos de nuevo a desplegado
    service.toggleWidgetCollapse(testWidgetId);
    
    service.getWidgetState(testWidgetId).subscribe((state: WidgetState) => {
      expect(state.isCollapsed).toBeFalse();
      done();
    });
  });

  it('should set widget visibility', (done) => {
    // Ocultar widget
    service.setWidgetVisibility(testWidgetId, false);
    
    service.getWidgetState(testWidgetId).subscribe((state: WidgetState) => {
      expect(state.isVisible).toBeFalse();
      
      // Mostrar widget
      service.setWidgetVisibility(testWidgetId, true);
      
      service.getWidgetState(testWidgetId).subscribe((updatedState: WidgetState) => {
        expect(updatedState.isVisible).toBeTrue();
        done();
      });
    });
  });

  it('should update widget position', (done) => {
    const position = { x: 100, y: 200 };
    service.updateWidgetPosition(testWidgetId, position);
    
    service.getWidgetState(testWidgetId).subscribe((state: WidgetState) => {
      expect(state.position).toEqual(position);
      done();
    });
  });

  it('should get visible widgets', (done) => {
    // Crear varios widgets
    service.getWidgetState('widget1');
    service.getWidgetState('widget2');
    service.getWidgetState('widget3');
    
    // Ocultar uno
    service.setWidgetVisibility('widget2', false);
    
    service.getVisibleWidgets().subscribe((visibleWidgets: string[]) => {
      expect(visibleWidgets.length).toBe(2);
      expect(visibleWidgets).toContain('widget1');
      expect(visibleWidgets).toContain('widget3');
      expect(visibleWidgets).not.toContain('widget2');
      done();
    });
  });

  it('should reset all widgets', (done) => {
    // Configurar varios widgets con estados personalizados
    service.updateWidgetState('widget1', { isCollapsed: true, isVisible: false });
    service.updateWidgetState('widget2', { isCollapsed: true });
    
    // Resetear todos
    service.resetAllWidgets();
    
    // Comprobar que todos volvieron a su estado original
    service.getWidgetState('widget1').subscribe((state1: WidgetState) => {
      expect(state1.isVisible).toBeTrue();
      expect(state1.isCollapsed).toBeFalse();
      
      service.getWidgetState('widget2').subscribe((state2: WidgetState) => {
        expect(state2.isVisible).toBeTrue();
        expect(state2.isCollapsed).toBeFalse();
        done();
      });
    });
  });
}); 