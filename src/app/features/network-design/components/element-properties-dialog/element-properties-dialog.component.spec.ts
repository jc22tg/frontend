import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

import { ElementPropertiesDialogComponent } from './element-properties-dialog.component';
import { ElementService } from '../../services/element.service';
import { ElementValidatorsService } from '../../services/element-validators.service';
import { NetworkElement, ElementType, ElementStatus } from '../../../../shared/types/network.types';

describe('ElementPropertiesDialogComponent', () => {
  let component: ElementPropertiesDialogComponent;
  let fixture: ComponentFixture<ElementPropertiesDialogComponent>;
  let elementServiceSpy: jasmine.SpyObj<ElementService>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<ElementPropertiesDialogComponent>>;

  const mockElement: NetworkElement = {
    id: 'test-id',
    name: 'Test Element',
    code: 'TEST-01',
    description: 'Element for testing',
    type: ElementType.OLT,
    status: ElementStatus.ACTIVE,
    position: { 
      coordinates: [0, 0],
      lat: 0, 
      lng: 0 
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    metadata: {
      manufacturer: 'Test Manufacturer',
      model: 'Test Model',
      portCount: 24,
      slotCount: 4,
      ponPorts: 16,
      distributionPorts: 4,
      uplinkPorts: 4,
      supportedPONStandards: ['GPON', 'XGPON'],
      firmwareVersion: '1.0.0'
    }
  };

  beforeEach(async () => {
    // Crear spies para los servicios
    elementServiceSpy = jasmine.createSpyObj('ElementService', ['getElementById', 'updateElement']);
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    // Configurar respuestas de los spies
    elementServiceSpy.getElementById.and.returnValue(of(mockElement));
    elementServiceSpy.updateElement.and.returnValue(of(mockElement));

    await TestBed.configureTestingModule({
      imports: [
        ReactiveFormsModule,
        NoopAnimationsModule,
        ElementPropertiesDialogComponent
      ],
      providers: [
        FormBuilder,
        ElementValidatorsService,
        { provide: ElementService, useValue: elementServiceSpy },
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: { elementId: 'test-id' } }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ElementPropertiesDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load element data on init', () => {
    expect(elementServiceSpy.getElementById).toHaveBeenCalledWith('test-id');
    expect(component.element).toEqual(mockElement);
  });

  it('should populate form with element data', () => {
    // Esperar a que se carguen los datos
    fixture.detectChanges();
    
    // Comprobar valores básicos
    expect(component.elementForm.get('name')?.value).toBe(mockElement.name);
    expect(component.elementForm.get('code')?.value).toBe(mockElement.code);
    expect(component.elementForm.get('description')?.value).toBe(mockElement.description);
    expect(component.elementForm.get('status')?.value).toBe(mockElement.status);
    
    // Comprobar valores específicos del tipo OLT usando metadata
    expect(component.elementForm.get('metadata.manufacturer')?.value).toBe(mockElement.metadata!.manufacturer);
    expect(component.elementForm.get('metadata.model')?.value).toBe(mockElement.metadata!.model);
    expect(component.elementForm.get('metadata.portCount')?.value).toBe(mockElement.metadata!.portCount);
  });

  it('should handle nested properties correctly', () => {
    // Crear un elemento con propiedades anidadas
    const nestedElement: NetworkElement = {
      ...mockElement,
      metadata: {
        ...mockElement.metadata,
        bandwidth: {
          downstreamCapacity: 10,
          upstreamCapacity: 5
        }
      }
    };
    
    // Establecer el elemento con propiedades anidadas
    component.element = nestedElement;
    
    // Simular que el tipo es ONT para tener campos de ancho de banda
    component.element.type = ElementType.ONT;
    
    // Configurar y popular el formulario
    component['setupFormForElementType']();
    component['populateForm']();
    
    // Comprobar que las propiedades anidadas se han establecido correctamente
    expect(component.elementForm.get('metadata.bandwidth.downstreamCapacity')?.value).toBe(10);
    expect(component.elementForm.get('metadata.bandwidth.upstreamCapacity')?.value).toBe(5);
  });

  it('should handle form array properties correctly', () => {
    // Crear un elemento con un array de propiedades
    const elementWithArray: NetworkElement = {
      ...mockElement,
      metadata: {
        ...mockElement.metadata,
        ports: [
          { portNumber: 1, status: 'active', type: 'PON' },
          { portNumber: 2, status: 'inactive', type: 'PON' }
        ]
      }
    };
    
    // Establecer el elemento y tipo
    component.element = elementWithArray;
    
    // Simular que hay un campo de tipo array en additionalFields
    component.additionalFields = [
      {
        name: 'metadata.ports',
        type: 'array',
        label: 'Puertos',
        required: true,
        itemLabel: 'Puerto',
        subFields: [
          { name: 'portNumber', label: 'Número', type: 'number', required: true },
          { name: 'status', label: 'Estado', type: 'text', required: true },
          { name: 'type', label: 'Tipo', type: 'text', required: true }
        ]
      }
    ];
    
    // Crear FormArray en el formulario
    component.elementForm.addControl('metadata.ports', component['fb'].array([]));
    
    // Poblar el formulario
    component['populateForm']();
    
    // Comprobar que el FormArray tiene el número correcto de elementos
    const portsArray = component.getFormArray('metadata.ports');
    expect(portsArray.length).toBe(2);
    
    // Comprobar que los valores se han establecido correctamente
    expect(portsArray.at(0).get('portNumber')?.value).toBe(1);
    expect(portsArray.at(0).get('status')?.value).toBe('active');
    expect(portsArray.at(1).get('portNumber')?.value).toBe(2);
    expect(portsArray.at(1).get('status')?.value).toBe('inactive');
  });

  it('should handle form submission with updated data', () => {
    // Configurar el formulario con valores actualizados
    component.elementForm.patchValue({
      name: 'Updated Element',
      code: 'UPD-01',
      metadata: {
        manufacturer: 'Updated Manufacturer'
      }
    });
    
    // Simular envío del formulario
    component.onSubmit();
    
    // Comprobar que se ha llamado al servicio para actualizar
    expect(elementServiceSpy.updateElement).toHaveBeenCalled();
    
    // Comprobar que se han pasado los datos actualizados
    const updateArgs = elementServiceSpy.updateElement.calls.mostRecent().args;
    expect(updateArgs[0]).toBe('test-id');
    expect(updateArgs[1].name).toBe('Updated Element');
    expect(updateArgs[1].code).toBe('UPD-01');
    expect(updateArgs[1].metadata!.manufacturer).toBe('Updated Manufacturer');
  });

  it('should handle error when loading element', () => {
    // Configurar el spy para devolver un error
    elementServiceSpy.getElementById.and.returnValue(throwError(() => new Error('Error de carga')));
    
    // Crear componente con el spy configurado
    fixture = TestBed.createComponent(ElementPropertiesDialogComponent);
    component = fixture.componentInstance;
    
    // Inicializar componente
    fixture.detectChanges();
    
    // Comprobar que se muestra un error
    expect(component.error).toContain('Error de carga');
  });

  it('should handle form validation errors correctly', () => {
    // Limpiar valores requeridos
    component.elementForm.patchValue({
      name: '',
      code: ''
    });
    
    // Marcar como tocado para activar validación
    component.elementForm.get('name')?.markAsTouched();
    component.elementForm.get('code')?.markAsTouched();
    
    // Comprobar detección de errores
    expect(component.hasError('name', 'required')).toBeTrue();
    expect(component.hasError('code', 'required')).toBeTrue();
  });

  it('should close dialog when cancel is clicked', () => {
    component.onCancel();
    expect(dialogRefSpy.close).toHaveBeenCalled();
  });
}); 