import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, ElementRef, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BehaviorSubject, of } from 'rxjs';

import { BaseWidgetComponent } from './base-widget.component';
import { WidgetStateService } from '../../../services/widget-state.service';
import { WidgetRenderService } from '../../../services/widget-render.service';

@Component({
  selector: 'app-test-widget',
  template: `
    <div class="widget-container">
      <div class="widget-header">
        <h3>Test Widget</h3>
        <div class="widget-controls">
          <button (click)="toggleCollapse()">Toggle</button>
          <button (click)="closeWidget()">Close</button>
        </div>
      </div>
      <div class="widget-content" *ngIf="!isCollapsed">
        <p>Widget Content</p>
      </div>
    </div>
  `,
})
class TestWidgetComponent extends BaseWidgetComponent {
  constructor() {
    super();
    this.widgetId = 'test-widget';
    this.title = 'Test Widget';
  }

  override refreshData(): void {
    this.emitUpdateEvent('data', { refreshed: true });
  }
}

describe('BaseWidgetComponent', () => {
  let component: TestWidgetComponent;
  let fixture: ComponentFixture<TestWidgetComponent>;
  let widgetStateServiceMock: jasmine.SpyObj<WidgetStateService>;
  let widgetRenderServiceMock: jasmine.SpyObj<WidgetRenderService>;
  const widgetState$ = new BehaviorSubject({ 
    id: 'test-widget', 
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
      'clearWidgetError'
    ]);
    
    widgetRenderServiceMock = jasmine.createSpyObj('WidgetRenderService', [
      'initializeWidget',
      'setupDraggableWidget',
      'showWidgetError'
    ]);
    
    widgetStateServiceMock.getWidgetState.and.returnValue(widgetState$);
    widgetStateServiceMock.getCurrentWidgetState.and.returnValue(widgetState$.value);
    widgetRenderServiceMock.initializeWidget.and.returnValue({ success: true });

    await TestBed.configureTestingModule({
      imports: [CommonModule],
      declarations: [TestWidgetComponent],
      providers: [
        { provide: WidgetStateService, useValue: widgetStateServiceMock },
        { provide: WidgetRenderService, useValue: widgetRenderServiceMock },
        {
          provide: ElementRef,
          useValue: {
            nativeElement: document.createElement('div')
          }
        },
        {
          provide: Renderer2,
          useValue: {
            createElement: () => document.createElement('div'),
            appendChild: () => {},
            removeChild: () => {},
            addClass: () => {},
            removeClass: () => {},
            setAttribute: () => {},
            setStyle: () => {}
          }
        }
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TestWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize widget state on init', () => {
    component.ngOnInit();
    expect(widgetStateServiceMock.getWidgetState).toHaveBeenCalledWith('test-widget');
    expect(widgetRenderServiceMock.initializeWidget).toHaveBeenCalled();
  });

  it('should toggle collapse state', () => {
    const emitSpy = spyOn(component.widgetUpdate, 'emit');
    component.toggleCollapse();
    expect(widgetStateServiceMock.toggleWidgetCollapse).toHaveBeenCalledWith('test-widget');
    expect(emitSpy).toHaveBeenCalled();
  });

  it('should close widget', () => {
    const emitSpy = spyOn(component.widgetUpdate, 'emit');
    component.closeWidget();
    expect(widgetStateServiceMock.setWidgetVisibility).toHaveBeenCalledWith('test-widget', false);
    expect(emitSpy).toHaveBeenCalled();
  });

  it('should show widget', () => {
    const emitSpy = spyOn(component.widgetUpdate, 'emit');
    component.showWidget();
    expect(widgetStateServiceMock.setWidgetVisibility).toHaveBeenCalledWith('test-widget', true);
    expect(emitSpy).toHaveBeenCalled();
  });

  it('should emit events when refreshData is called', () => {
    const emitSpy = spyOn(component.widgetUpdate, 'emit');
    component.refreshData();
    expect(emitSpy).toHaveBeenCalled();
    const emitCall = emitSpy.calls.mostRecent()?.args[0];
    expect(emitCall).toBeDefined();
    expect(emitCall?.updateType).toBe('data');
    expect(emitCall?.currentState).toEqual({ refreshed: true });
  });

  it('should emit action events', () => {
    const emitSpy = spyOn(component.widgetAction, 'emit');
    component['emitActionEvent']('edit', '123', { name: 'Test' });
    expect(emitSpy).toHaveBeenCalled();
    const emitCall = emitSpy.calls.mostRecent()?.args[0];
    expect(emitCall).toBeDefined();
    expect(emitCall?.action).toBe('edit');
    expect(emitCall?.elementId).toBe('123');
    expect(emitCall?.actionData).toEqual({ name: 'Test' });
  });

  it('should emit error events', () => {
    const emitSpy = spyOn(component.widgetError, 'emit');
    component['emitErrorEvent']('test', { 
      code: 'TEST_ERROR', 
      message: 'Test error message' 
    });
    expect(emitSpy).toHaveBeenCalled();
    const emitCall = emitSpy.calls.mostRecent()?.args[0];
    expect(emitCall).toBeDefined();
    expect(emitCall?.error.code).toBe('TEST_ERROR');
    expect(emitCall?.error.message).toBe('Test error message');
  });

  it('should handle errors properly', () => {
    const errorSpy = spyOn<any>(component, 'emitErrorEvent');
    const consoleErrorSpy = spyOn(console, 'error');
    
    component['handleError']('testOperation', new Error('Test error'));
    
    expect(errorSpy).toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalled();
  });
}); 