import { Injectable } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidatorFn, FormArray } from '@angular/forms';
import { Observable, of, BehaviorSubject, throwError, from } from 'rxjs';
import { catchError, map, switchMap, tap, filter, finalize } from 'rxjs/operators';

import { NetworkFacade } from '../facades/network.facade';
import { ElementService } from './element.service';
import { MapService } from './map.service';
import { NetworkValidationService } from './network-validation.service';

import { 
  NetworkElement, 
  ElementType, 
  ElementStatus
} from '../../../shared/types/network.types';

import {
  OLT,
  ONT,
  ODF,
  Splitter,
  TerminalBox,
  SlackFiber,
  FiberThread,
  Rack
} from '../interfaces/element.interface';
import { EDFA } from '../../../shared/models/edfa.model';
import { Manga as SharedManga } from '../../../shared/models/manga.model';

// Interfaz para manejar propiedades temporales en elementos
interface ExtendedNetworkElement extends NetworkElement {
  tags?: string[];
  properties?: any;
}

/**
 * Función auxiliar para filtrar valores nulos en Observables
 */
function filterNotNull<T>() {
  return filter((value: T | null): value is T => value !== null);
}

@Injectable({
  providedIn: 'root'
})
export class ElementEditorService {
  private readonly elementTypes = Object.values(ElementType).filter(v => typeof v === 'number');
  
  // BehaviorSubjects para estados compartidos
  private loading$ = new BehaviorSubject<boolean>(false);
  private error$ = new BehaviorSubject<string | null>(null);

  constructor(
    private formBuilder: FormBuilder,
    private networkFacade: NetworkFacade,
    private elementService: ElementService,
    private mapService: MapService,
    private validationService: NetworkValidationService
  ) {}

  /**
   * Obtiene el estado de carga actual
   */
  getLoadingState(): Observable<boolean> {
    return this.loading$.asObservable();
  }

  /**
   * Obtiene el estado de error actual
   */
  getErrorState(): Observable<string | null> {
    return this.error$.asObservable();
  }

  /**
   * Actualiza el estado de carga
   */
  setLoading(isLoading: boolean): void {
    this.loading$.next(isLoading);
  }

  /**
   * Actualiza el estado de error
   */
  setError(error: string | null): void {
    this.error$.next(error);
  }

  /**
   * Obtiene los tipos de elementos disponibles
   */
  getElementTypes(): ElementType[] {
    return this.elementTypes as ElementType[];
  }

  /**
   * Carga un elemento para edición
   */
  loadElement(elementId: string): Observable<NetworkElement> {
    this.setLoading(true);
    this.setError(null);
    
    return this.networkFacade.getElementById(elementId).pipe(
      map(element => {
        if (!element) {
          throw new Error(`Elemento con ID ${elementId} no encontrado`);
        }
        return element;
      }),
      catchError(error => {
        this.setError(`Error al cargar el elemento: ${error.message}`);
        return throwError(() => error as Error);
      }),
      finalize(() => this.setLoading(false))
    );
  }

  /**
   * Crea un formulario base para cualquier tipo de elemento
   */
  createBaseElementForm(): FormGroup {
    return this.formBuilder.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      code: ['', [Validators.required, Validators.pattern(/^[A-Z0-9-_]{3,20}$/)]],
      description: ['', Validators.maxLength(500)],
      status: [ElementStatus.ACTIVE, Validators.required],
      type: [null, Validators.required],
      position: this.formBuilder.group({
        coordinates: this.formBuilder.array([
          [null, [Validators.required, this.coordinateValidator()]],
          [null, [Validators.required, this.coordinateValidator()]]
        ])
      }),
      tags: this.formBuilder.array([]),
      properties: this.formBuilder.group({})
    });
  }

  /**
   * Actualiza el formulario según el tipo de elemento seleccionado
   * @param form Formulario a actualizar
   * @param type Tipo de elemento
   */
  updateFormForElementType(form: FormGroup, type: ElementType): void {
    // Resetear solo el grupo de propiedades específicas
    const propertiesGroup = form.get('properties') as FormGroup;
    if (propertiesGroup) {
      // Mantener los valores comunes
      const commonValues = form.value;
      
      // Crear el nuevo grupo de propiedades según el tipo
      let newPropertiesGroup: FormGroup;
      
      switch (type) {
        case ElementType.OLT:
          newPropertiesGroup = this.formBuilder.group({
            manufacturer: ['', Validators.required],
            model: ['', Validators.required],
            serialNumber: ['', Validators.required],
            ipAddress: ['', [Validators.pattern(/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/)]],
            portCount: [16, [Validators.required, Validators.min(1), Validators.max(128)]],
            ponPorts: [4, [Validators.required, Validators.min(1)]],
            macAddress: ['', [Validators.pattern(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/)]],
            firmwareVersion: [''],
            rackId: ['']
          });
          break;
          
        case ElementType.ONT:
          newPropertiesGroup = this.formBuilder.group({
            manufacturer: ['', Validators.required],
            model: ['', Validators.required],
            serialNumber: ['', Validators.required],
            clientId: [''],
            ipAddress: ['', [Validators.pattern(/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/)]],
            macAddress: ['', [Validators.pattern(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/)]],
            firmwareVersion: [''],
            ponStandard: ['GPON', Validators.required],
            dualRateSupport: [false],
            bandwidth: this.formBuilder.group({
              downstreamCapacity: [2.5, [Validators.required, Validators.min(0.1)]],
              upstreamCapacity: [1.25, [Validators.required, Validators.min(0.1)]]
            })
          });
          break;
          
        case ElementType.SPLITTER:
          newPropertiesGroup = this.formBuilder.group({
            splitterType: ['DISTRIBUTION', Validators.required],
            splitRatio: ['1:8', Validators.required],
            insertionLossDb: [10.5, [Validators.required, Validators.min(0)]],
            level: [1, [Validators.required, Validators.min(1), Validators.max(3)]],
            totalPorts: [8, [Validators.required, Validators.min(2)]],
            usedPorts: [0, [Validators.min(0)]],
            outputType: ['BALANCED', Validators.required],
            manufacturer: [''],
            model: [''],
            serialNumber: [''],
            supportedPONStandards: [[]]
          });
          break;
        
        case ElementType.SLACK_FIBER:
          newPropertiesGroup = this.formBuilder.group({
            length: [50, [Validators.required, Validators.min(1)]],
            stockLength: [10, [Validators.min(0)]],
            fiberConnectionId: [''],
            fiberType: ['SINGLE_MODE'],
            manufacturer: [''],
            model: [''],
            installationDate: [null],
            diameter: [2, [Validators.min(0.1)]],
            mountingType: ['aerial'],
            color: ['Azul'],
            location: ['', [Validators.maxLength(200)]],
            notes: ['']
          });
          break;
          
        case ElementType.EDFA:
          newPropertiesGroup = this.formBuilder.group({
            manufacturer: ['', Validators.required],
            model: ['', Validators.required],
            gainDb: [20, [Validators.required, Validators.min(5), Validators.max(40)]],
            inputPowerDbm: [-25, [Validators.required]],
            outputPowerDbm: [-5, [Validators.required]],
            operatingTemperature: [25, [Validators.required]],
            inputPowerRange: this.formBuilder.group({
              min: [-30, [Validators.required]],
              max: [-10, [Validators.required]],
              optimal: [-20, [Validators.required]]
            }),
            outputPowerRange: this.formBuilder.group({
              min: [-10, [Validators.required]],
              max: [5, [Validators.required]],
              optimal: [0, [Validators.required]]
            })
          });
          break;
          
        case ElementType.MANGA:
          newPropertiesGroup = this.formBuilder.group({
            manufacturer: ['', Validators.required],
            model: ['', Validators.required],
            fiberType: ['SINGLEMODE', Validators.required],
            fiberCount: [12, [Validators.required, Validators.min(1)]],
            length: [1, [Validators.required, Validators.min(0.1)]],
            diameter: [20, [Validators.required, Validators.min(1)]],
            color: ['Negro', Validators.required],
            sealType: ['Termocontraíble', Validators.required],
            installationType: ['Aérea', Validators.required],
            mountingType: ['pole'],
            location: ['', Validators.required],
            capacity: [24, [Validators.required, Validators.min(1)]],
            spliceCount: [24, [Validators.required, Validators.min(1)]],
            usedSplices: [0, [Validators.min(0)]],
            serialNumber: [''],
            installationDate: [new Date(), Validators.required],
            installationTechnician: [''],
            technicianId: [''],
            workOrderNumber: [''],
            spliceType: ['fusion'],
            inputFiberThreadIds: [''],
            outputFiberThreadIds: ['']
          });
          break;
          
        case ElementType.TERMINAL_BOX:
          newPropertiesGroup = this.formBuilder.group({
            capacity: [8, [Validators.required, Validators.min(1)]],
            usedPorts: [0, [Validators.min(0)]],
            vendor: ['', Validators.required],
            model: [''],
            serialNumber: [''],
            cableType: ['Fibra óptica', Validators.required],
            indoorOutdoor: ['outdoor', Validators.required],
            enclosureType: ['Plástico reforzado', Validators.required],
            mountingType: ['wall', Validators.required],
            ipRating: ['IP65', Validators.required],
            dimensions: this.formBuilder.group({
              width: [200, [Validators.required, Validators.min(1)]],
              height: [300, [Validators.required, Validators.min(1)]],
              depth: [100, [Validators.required, Validators.min(1)]]
            }),
            installationDate: [new Date(), Validators.required],
            nextMaintenanceDate: [null],
            monitoringEnabled: [false],
            fiberType: ['SINGLEMODE'],
            maxBandwidth: [null],
            isWeatherproof: [true],
            locationDescription: [''],
            accessInstructions: ['']
          });
          break;
          
        default:
          newPropertiesGroup = this.formBuilder.group({});
          break;
      }
      
      // Reemplazar el grupo de propiedades en el formulario
      form.setControl('properties', newPropertiesGroup);
      
      // Restaurar los valores comunes
      if (commonValues) {
        // Solo restaurar propiedades que no sean específicas del tipo
        const { properties, ...commonFields } = commonValues;
        form.patchValue(commonFields);
      }
    }
    
    // Actualizar el valor del tipo
    form.get('type')?.setValue(type);
  }

  /**
   * Rellena un formulario con los datos de un elemento
   */
  patchElementForm(form: FormGroup, element: NetworkElement): void {
    // Aplicar valores comunes
    form.patchValue({
      name: element.name,
      description: element.description || '',
      status: element.status,
      type: element.type
    });
    // Asignar posición (lat/lng)
    if (element.position && typeof element.position.lat === 'number' && typeof element.position.lng === 'number') {
      const positionGroup = form.get('position') as FormGroup;
      if (positionGroup) {
        positionGroup.patchValue({
          lat: element.position.lat,
          lng: element.position.lng
        });
      }
    }
    // Aplicar propiedades específicas según el tipo usando type guards
    switch (element.type) {
      case ElementType.OLT:
        // Cast seguro a OLT
        form.get('properties')?.patchValue(element as OLT);
        break;
      case ElementType.ONT:
        form.get('properties')?.patchValue(element as ONT);
        break;
      case ElementType.ODF:
        form.get('properties')?.patchValue(element as ODF);
        break;
      case ElementType.EDFA:
        form.get('properties')?.patchValue(element as EDFA);
        break;
      case ElementType.SPLITTER:
        form.get('properties')?.patchValue(element as Splitter);
        break;
      case ElementType.MANGA:
        form.get('properties')?.patchValue(element as SharedManga);
        break;
      case ElementType.TERMINAL_BOX:
        form.get('properties')?.patchValue(element as TerminalBox);
        break;
      case ElementType.SLACK_FIBER:
        form.get('properties')?.patchValue(element as SlackFiber);
        break;
      case ElementType.FIBER_THREAD:
        form.get('properties')?.patchValue(element as FiberThread);
        break;
      case ElementType.RACK:
        form.get('properties')?.patchValue(element as Rack);
        break;
      default:
        // Si no es un tipo concreto, aplicar las propiedades genéricas
        if ((element as any).properties) {
          form.get('properties')?.patchValue((element as any).properties);
        }
        break;
    }
  }

  /**
   * Crea un objeto de elemento a partir de un formulario
   */
  createElementFromForm(form: FormGroup, existingId?: string): NetworkElement {
    const formValue = form.value;
    // Crear elemento base
    let element: NetworkElement;
    switch (formValue.type) {
      case ElementType.OLT:
        element = {
          ...(formValue as OLT),
          id: existingId || '',
          updatedAt: new Date(),
          createdAt: existingId ? formValue.createdAt : new Date()
        };
        break;
      case ElementType.ONT:
        element = {
          ...(formValue as ONT),
          id: existingId || '',
          updatedAt: new Date(),
          createdAt: existingId ? formValue.createdAt : new Date()
        };
        break;
      case ElementType.ODF:
        element = {
          ...(formValue as ODF),
          id: existingId || '',
          updatedAt: new Date(),
          createdAt: existingId ? formValue.createdAt : new Date()
        };
        break;
      case ElementType.EDFA:
        element = {
          ...(formValue as EDFA),
          id: existingId || '',
          updatedAt: new Date(),
          createdAt: existingId ? formValue.createdAt : new Date()
        };
        break;
      case ElementType.SPLITTER:
        element = {
          ...(formValue as Splitter),
          id: existingId || '',
          updatedAt: new Date(),
          createdAt: existingId ? formValue.createdAt : new Date()
        };
        break;
      case ElementType.MANGA:
        element = {
          ...(formValue as SharedManga),
          id: existingId || '',
          updatedAt: new Date(),
          createdAt: existingId ? formValue.createdAt : new Date()
        };
        break;
      case ElementType.TERMINAL_BOX:
        element = {
          ...(formValue as TerminalBox),
          id: existingId || '',
          updatedAt: new Date(),
          createdAt: existingId ? formValue.createdAt : new Date()
        };
        break;
      case ElementType.SLACK_FIBER:
        element = {
          ...(formValue as SlackFiber),
          id: existingId || '',
          updatedAt: new Date(),
          createdAt: existingId ? formValue.createdAt : new Date()
        };
        break;
      case ElementType.FIBER_THREAD:
        element = {
          ...(formValue as FiberThread),
          id: existingId || '',
          updatedAt: new Date(),
          createdAt: existingId ? formValue.createdAt : new Date()
        };
        break;
      case ElementType.RACK:
        element = {
          ...(formValue as Rack),
          id: existingId || '',
          updatedAt: new Date(),
          createdAt: existingId ? formValue.createdAt : new Date()
        };
        break;
      default:
        element = {
          ...formValue,
          id: existingId || '',
          updatedAt: new Date(),
          createdAt: existingId ? formValue.createdAt : new Date()
        };
        break;
    }
    return element;
  }

  /**
   * Guarda un elemento (nuevo o existente)
   */
  saveElement(element: NetworkElement, isNew: boolean): Observable<NetworkElement> {
    this.setLoading(true);
    this.setError(null);
    
    const operation = isNew 
      ? this.networkFacade.createElement(element) 
      : this.networkFacade.updateElement(element);
    
    return operation.pipe(
      // Asegurarnos de que siempre sea un NetworkElement no nulo
      map(savedElement => {
        if (!savedElement) {
          throw new Error(`Error al ${isNew ? 'crear' : 'actualizar'} el elemento: respuesta vacía`);
        }
        return savedElement;
      }),
      tap(savedElement => {
        // Actualizar visualización en el mapa
        if (isNew) {
          this.mapService.addElementAtPosition(
            savedElement,
            savedElement.position?.lat || 0,
            savedElement.position?.lng || 0
          );
        } else {
          this.mapService.updateMapElements([savedElement], []);
        }
      }),
      catchError(error => {
        this.setError(`Error al guardar el elemento: ${error.message}`);
        return throwError(() => error as Error);
      }),
      finalize(() => {
        this.setLoading(false);
      })
    );
  }

  /**
   * Elimina un elemento
   */
  deleteElement(elementId: string): Observable<boolean> {
    this.setLoading(true);
    this.setError(null);
    
    return this.networkFacade.deleteElement(elementId).pipe(
      map(() => true),
      catchError(error => {
        this.setError(`Error al eliminar el elemento: ${error.message}`);
        return throwError(() => error);
      }),
      tap(() => this.setLoading(false))
    );
  }

  /**
   * Validador personalizado para coordenadas
   */
  private coordinateValidator(): ValidatorFn {
    return (control: AbstractControl): Record<string, any> | null => {
      const value = control.value;
      
      if (value === null || value === undefined) {
        return null; // Otros validadores manejarán required
      }
      
      if (isNaN(value) || !isFinite(value)) {
        return { 'invalidCoordinate': { value } };
      }
      
      return null;
    };
  }
} 
