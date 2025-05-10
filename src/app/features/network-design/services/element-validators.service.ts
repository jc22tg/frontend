import { Injectable } from '@angular/core';
import { ValidatorFn, AbstractControl, ValidationErrors, FormGroup, Validators } from '@angular/forms';
import { ElementType, PONStandard, FiberType, ODFType, SplitterType } from '../../../shared/types/network.types';

@Injectable({
  providedIn: 'root'
})
export class ElementValidatorsService {

  constructor() { 
    // Constructor vacío requerido por Angular
  }

  /**
   * Obtiene validadores según el tipo de elemento
   * @param elementType Tipo de elemento
   * @returns Objeto con los validadores específicos
   */
  getValidatorsForType(elementType: ElementType): Record<string, ValidatorFn[]> {
    const commonValidators = {
      'name': [Validators.required, Validators.maxLength(100)],
      'code': [Validators.required, Validators.maxLength(50), Validators.pattern(/^[A-Za-z0-9_\-.]+$/)],
      'description': [Validators.maxLength(500)]
    };

    switch (elementType) {
      case ElementType.OLT:
        return {
          ...commonValidators,
          'manufacturer': [Validators.required, Validators.maxLength(100)],
          'model': [Validators.required, Validators.maxLength(100)],
          'portCount': [Validators.required, Validators.min(0), Validators.max(1000)],
          'slotCount': [Validators.required, Validators.min(0), Validators.max(100)],
          'ponPorts': [Validators.required, Validators.min(0), Validators.max(1000)],
          'distributionPorts': [Validators.required, Validators.min(0), Validators.max(1000)],
          'uplinkPorts': [Validators.required, Validators.min(0), Validators.max(100)],
          'supportedPONStandards': [Validators.required],
          'firmwareVersion': [Validators.maxLength(50)],
          'ipAddress': [Validators.pattern(/^(\d{1,3}\.){3}\d{1,3}$/)],
          'macAddress': [Validators.pattern(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/)],
          'ports': []  // Para el FormArray de puertos
        };

      case ElementType.ONT:
        return {
          ...commonValidators,
          'manufacturer': [Validators.required, Validators.maxLength(100)],
          'model': [Validators.required, Validators.maxLength(100)],
          'serialNumber': [Validators.required, Validators.maxLength(100)],
          'ponStandard': [Validators.required],
          'clientId': [Validators.maxLength(100)],
          'oltId': [Validators.maxLength(100)],
          'ipAddress': [Validators.pattern(/^(\d{1,3}\.){3}\d{1,3}$/)],
          'macAddress': [Validators.pattern(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/)],
          'signalStrength': [Validators.min(-50), Validators.max(10)],
          'transmitPower': [Validators.min(-20), Validators.max(10)],
          'receivePower': [Validators.min(-40), Validators.max(0)],
          'bandwidth.downstreamCapacity': [Validators.required, Validators.min(0)],
          'bandwidth.upstreamCapacity': [Validators.required, Validators.min(0)],
          'userPorts': []  // Para el FormArray de puertos de usuario
        };

      case ElementType.ODF:
        return {
          ...commonValidators,
          'manufacturer': [Validators.required, Validators.maxLength(100)],
          'model': [Validators.required, Validators.maxLength(100)],
          'totalPortCapacity': [Validators.required, Validators.min(0), Validators.max(10000)],
          'usedPorts': [Validators.required, Validators.min(0)],
          'mountingType': [Validators.required],
          'odfType': [Validators.required]
        };

      case ElementType.SPLITTER:
        return {
          ...commonValidators,
          'manufacturer': [Validators.required, Validators.maxLength(100)],
          'model': [Validators.maxLength(100)],
          'inputPorts': [Validators.required, Validators.min(1), Validators.max(8)],
          'outputPorts': [Validators.required, Validators.min(2), Validators.max(128)],
          'splitRatio': [Validators.required, Validators.pattern(/^1:(\d+)$/)],
          'insertionLoss': [Validators.required, Validators.min(0), Validators.max(30)],
          'splitterType': [Validators.required],
          'connectorType': [Validators.maxLength(50)],
          'wavelengthRange': [Validators.maxLength(100)]
        };

      case ElementType.EDFA:
        return {
          ...commonValidators,
          'manufacturer': [Validators.required, Validators.maxLength(100)],
          'model': [Validators.required, Validators.maxLength(100)],
          'gainDb': [Validators.required, Validators.min(0), Validators.max(50)],
          'maxOutputPower': [Validators.required, Validators.min(0), Validators.max(30)],
          'operatingWavelength': [Validators.required, Validators.min(1000), Validators.max(1700)],
          'pumpLaserType': [Validators.maxLength(100)],
          'noiseLevel': [Validators.min(0), Validators.max(10)]
        };

      case ElementType.FIBER_THREAD:
        return {
          ...commonValidators,
          'fiberType': [Validators.required],
          'length': [Validators.required, Validators.min(0), Validators.max(1000000)],
          'attenuationDb': [Validators.required, Validators.min(0), Validators.max(100)],
          'sourceElementId': [Validators.required],
          'targetElementId': [Validators.required],
          'wavelength': [Validators.min(800), Validators.max(2000)]
        };

      case ElementType.RACK:
        return {
          ...commonValidators,
          'manufacturer': [Validators.required, Validators.maxLength(100)],
          'model': [Validators.maxLength(100)],
          'heightUnits': [Validators.required, Validators.min(1), Validators.max(52)],
          'width': [Validators.required, Validators.min(100), Validators.max(1000)],
          'depth': [Validators.required, Validators.min(100), Validators.max(1500)],
          'totalU': [Validators.required, Validators.min(1), Validators.max(52)],
          'usedU': [Validators.required, Validators.min(0)],
          'roomName': [Validators.required, Validators.maxLength(100)]
        };

      default:
        return commonValidators;
    }
  }

  /**
   * Obtiene campos adicionales específicos para cada tipo de elemento
   * @param elementType Tipo de elemento
   * @returns Lista de campos adicionales
   */
  getAdditionalFieldsForType(elementType: ElementType): { name: string, type: string, label: string, required: boolean, options?: unknown[], subFields?: any[], itemLabel?: string }[] {
    switch (elementType) {
      case ElementType.OLT:
        return [
          { name: 'manufacturer', type: 'text', label: 'Fabricante', required: true },
          { name: 'model', type: 'text', label: 'Modelo', required: true },
          { name: 'portCount', type: 'number', label: 'Cantidad de puertos', required: true },
          { name: 'slotCount', type: 'number', label: 'Cantidad de slots', required: true },
          { name: 'ponPorts', type: 'number', label: 'Puertos PON', required: true },
          { name: 'distributionPorts', type: 'number', label: 'Puertos de distribución', required: true },
          { name: 'uplinkPorts', type: 'number', label: 'Puertos de uplink', required: true },
          { 
            name: 'supportedPONStandards', 
            type: 'multiselect', 
            label: 'Estándares PON soportados', 
            required: true,
            options: Object.values(PONStandard)
          },
          { name: 'firmwareVersion', type: 'text', label: 'Versión de firmware', required: false },
          { name: 'ipAddress', type: 'text', label: 'Dirección IP', required: false },
          { name: 'macAddress', type: 'text', label: 'Dirección MAC', required: false },
          { 
            name: 'ports', 
            type: 'array', 
            label: 'Configuración de puertos', 
            required: false,
            itemLabel: 'Puerto',
            subFields: [
              { name: 'portNumber', label: 'Número de puerto', type: 'number', required: true },
              { name: 'type', label: 'Tipo de puerto', type: 'select', required: true, 
                options: ['PON', 'Uplink', 'Distribution'] },
              { name: 'status', label: 'Estado', type: 'select', required: true,
                options: ['active', 'inactive', 'fault', 'reserved'] },
              { name: 'slotNumber', label: 'Número de slot', type: 'number', required: false }
            ]
          }
        ];

      case ElementType.ONT:
        return [
          { name: 'manufacturer', type: 'text', label: 'Fabricante', required: true },
          { name: 'model', type: 'text', label: 'Modelo', required: true },
          { name: 'serialNumber', type: 'text', label: 'Número de serie', required: true },
          { 
            name: 'ponStandard', 
            type: 'select', 
            label: 'Estándar PON', 
            required: true,
            options: Object.values(PONStandard)
          },
          { name: 'clientId', type: 'text', label: 'ID de cliente', required: false },
          { name: 'oltId', type: 'text', label: 'ID de OLT', required: false },
          { name: 'ipAddress', type: 'text', label: 'Dirección IP', required: false },
          { name: 'macAddress', type: 'text', label: 'Dirección MAC', required: false },
          { name: 'signalStrength', type: 'number', label: 'Fuerza de señal (dBm)', required: false },
          { name: 'transmitPower', type: 'number', label: 'Potencia de transmisión (dBm)', required: false },
          { name: 'receivePower', type: 'number', label: 'Potencia de recepción (dBm)', required: false },
          { name: 'bandwidth.downstreamCapacity', type: 'number', label: 'Capacidad de bajada (Gbps)', required: true },
          { name: 'bandwidth.upstreamCapacity', type: 'number', label: 'Capacidad de subida (Gbps)', required: true },
          { 
            name: 'userPorts', 
            type: 'array', 
            label: 'Puertos de usuario', 
            required: false,
            itemLabel: 'Puerto',
            subFields: [
              { name: 'portNumber', label: 'Número de puerto', type: 'number', required: true },
              { name: 'type', label: 'Tipo de puerto', type: 'select', required: true, 
                options: ['Ethernet', 'POTS', 'Wifi', 'USB', 'CATV'] },
              { name: 'status', label: 'Estado', type: 'select', required: true,
                options: ['active', 'inactive', 'fault'] },
              { name: 'speed', label: 'Velocidad (Mbps)', type: 'number', required: false }
            ]
          }
        ];

      case ElementType.ODF:
        return [
          { name: 'manufacturer', type: 'text', label: 'Fabricante', required: true },
          { name: 'model', type: 'text', label: 'Modelo', required: true },
          { name: 'totalPortCapacity', type: 'number', label: 'Capacidad total de puertos', required: true },
          { name: 'usedPorts', type: 'number', label: 'Puertos utilizados', required: true },
          { 
            name: 'mountingType', 
            type: 'select', 
            label: 'Tipo de montaje', 
            required: true,
            options: ['rack', 'wall', 'pole', 'aerial', 'underground', 'cabinet']
          },
          { 
            name: 'odfType', 
            type: 'select', 
            label: 'Tipo de ODF', 
            required: true,
            options: Object.values(ODFType)
          }
        ];

      case ElementType.SPLITTER:
        return [
          { name: 'manufacturer', type: 'text', label: 'Fabricante', required: true },
          { name: 'model', type: 'text', label: 'Modelo', required: false },
          { name: 'inputPorts', type: 'number', label: 'Puertos de entrada', required: true },
          { name: 'outputPorts', type: 'number', label: 'Puertos de salida', required: true },
          { name: 'splitRatio', type: 'text', label: 'Relación de división', required: true },
          { name: 'insertionLoss', type: 'number', label: 'Pérdida de inserción (dB)', required: true },
          { 
            name: 'splitterType', 
            type: 'select', 
            label: 'Tipo de splitter', 
            required: true,
            options: Object.values(SplitterType)
          },
          { name: 'connectorType', type: 'text', label: 'Tipo de conector', required: false },
          { name: 'wavelengthRange', type: 'text', label: 'Rango de longitud de onda', required: false }
        ];

      case ElementType.EDFA:
        return [
          { name: 'manufacturer', type: 'text', label: 'Fabricante', required: true },
          { name: 'model', type: 'text', label: 'Modelo', required: true },
          { name: 'gainDb', type: 'number', label: 'Ganancia (dB)', required: true },
          { name: 'maxOutputPower', type: 'number', label: 'Potencia máxima de salida (dBm)', required: true },
          { name: 'operatingWavelength', type: 'number', label: 'Longitud de onda de operación (nm)', required: true },
          { name: 'pumpLaserType', type: 'text', label: 'Tipo de láser de bombeo', required: false },
          { name: 'noiseLevel', type: 'number', label: 'Nivel de ruido (dB)', required: false }
        ];

      case ElementType.FIBER_THREAD:
        return [
          { 
            name: 'fiberType', 
            type: 'select', 
            label: 'Tipo de fibra', 
            required: true,
            options: Object.values(FiberType)
          },
          { name: 'length', type: 'number', label: 'Longitud (metros)', required: true },
          { name: 'attenuationDb', type: 'number', label: 'Atenuación (dB)', required: true },
          { name: 'sourceElementId', type: 'text', label: 'ID de elemento origen', required: true },
          { name: 'targetElementId', type: 'text', label: 'ID de elemento destino', required: true },
          { name: 'wavelength', type: 'number', label: 'Longitud de onda (nm)', required: false }
        ];

      case ElementType.RACK:
        return [
          { name: 'manufacturer', type: 'text', label: 'Fabricante', required: true },
          { name: 'model', type: 'text', label: 'Modelo', required: false },
          { name: 'heightUnits', type: 'number', label: 'Altura (unidades U)', required: true },
          { name: 'width', type: 'number', label: 'Ancho (mm)', required: true },
          { name: 'depth', type: 'number', label: 'Profundidad (mm)', required: true },
          { name: 'totalU', type: 'number', label: 'Total unidades U', required: true },
          { name: 'usedU', type: 'number', label: 'Unidades U utilizadas', required: true },
          { name: 'roomName', type: 'text', label: 'Nombre de sala', required: true }
        ];

      default:
        return [];
    }
  }

  /**
   * Obtiene validadores personalizados a nivel de formulario
   * @param elementType Tipo de elemento
   * @returns Función validadora para el formulario
   */
  getCustomFormValidators(elementType: ElementType): ValidatorFn {
    switch (elementType) {
      case ElementType.OLT:
        return this.validateOltForm;
      
      case ElementType.ONT:
        return this.validateOntForm;
      
      case ElementType.SPLITTER:
        return this.validateSplitterForm;
        
      case ElementType.ODF:
        return this.validateOdfForm;
        
      case ElementType.FIBER_THREAD:
        return this.validateFiberThreadForm;
        
      case ElementType.RACK:
        return this.validateRackForm;
        
      default:
        return () => null;
    }
  }
  
  /**
   * Validador personalizado para OLT
   */
  private validateOltForm(formGroup: AbstractControl): ValidationErrors | null {
    const form = formGroup as FormGroup;
    const portCount = form.get('portCount')?.value ?? 0;
    const ponPorts = form.get('ponPorts')?.value ?? 0;
    const distributionPorts = form.get('distributionPorts')?.value ?? 0;
    const uplinkPorts = form.get('uplinkPorts')?.value ?? 0;
    
    // Validar que la suma de todos los puertos específicos no exceda el total
    const totalSpecificPorts = ponPorts + distributionPorts + uplinkPorts;
    
    if (totalSpecificPorts > portCount) {
      return { 
        portCountExceeded: { 
          actual: totalSpecificPorts, 
          max: portCount,
          message: `La suma de puertos específicos (${totalSpecificPorts}) excede el total de puertos (${portCount})`
        } 
      };
    }
    
    return null;
  }
  
  /**
   * Validador personalizado para ONT
   */
  private validateOntForm(formGroup: AbstractControl): ValidationErrors | null {
    const form = formGroup as FormGroup;
    
    // Si hay transmitPower y receivePower, validar que tienen sentido
    const transmitPower = form.get('transmitPower')?.value;
    const receivePower = form.get('receivePower')?.value;
    
    if (transmitPower !== undefined && receivePower !== undefined) {
      // En general, la potencia de transmisión debería ser mayor que la de recepción
      if (transmitPower < receivePower) {
        return { 
          invalidPowerValues: { 
            message: 'La potencia de transmisión debería ser mayor que la de recepción' 
          } 
        };
      }
    }
    
    return null;
  }
  
  /**
   * Validador personalizado para Splitter
   */
  private validateSplitterForm(formGroup: AbstractControl): ValidationErrors | null {
    const form = formGroup as FormGroup;
    const outputPorts = form.get('outputPorts')?.value ?? 0;
    const splitRatio = form.get('splitRatio')?.value ?? '';
    
    // Validar que el ratio coincide con los puertos de salida
    if (splitRatio) {
      const match = splitRatio.match(/^1:(\d+)$/);
      if (match) {
        const ratioOutputs = parseInt(match[1], 10);
        if (ratioOutputs !== outputPorts) {
          return { 
            invalidSplitRatio: { 
              actual: outputPorts, 
              expected: ratioOutputs,
              message: `El número de puertos de salida (${outputPorts}) debe coincidir con la relación de división ${splitRatio}`
            } 
          };
        }
      }
    }
    
    return null;
  }
  
  /**
   * Validador personalizado para ODF
   */
  private validateOdfForm(formGroup: AbstractControl): ValidationErrors | null {
    const form = formGroup as FormGroup;
    const totalPortCapacity = form.get('totalPortCapacity')?.value ?? 0;
    const usedPorts = form.get('usedPorts')?.value ?? 0;
    
    // Validar que los puertos utilizados no exceden la capacidad total
    if (usedPorts > totalPortCapacity) {
      return { 
        usedPortsExceeded: { 
          actual: usedPorts, 
          max: totalPortCapacity,
          message: `Los puertos utilizados (${usedPorts}) exceden la capacidad total (${totalPortCapacity})`
        } 
      };
    }
    
    return null;
  }
  
  /**
   * Validador personalizado para FiberThread
   */
  private validateFiberThreadForm(formGroup: AbstractControl): ValidationErrors | null {
    const form = formGroup as FormGroup;
    const sourceElementId = form.get('sourceElementId')?.value;
    const targetElementId = form.get('targetElementId')?.value;
    
    // Validar que origen y destino no son el mismo
    if (sourceElementId && targetElementId && sourceElementId === targetElementId) {
      return { 
        sameSourceAndTarget: { 
          message: 'El elemento origen y destino no pueden ser el mismo' 
        } 
      };
    }
    
    return null;
  }
  
  /**
   * Validador personalizado para Rack
   */
  private validateRackForm(formGroup: AbstractControl): ValidationErrors | null {
    const form = formGroup as FormGroup;
    const totalU = form.get('totalU')?.value ?? 0;
    const usedU = form.get('usedU')?.value ?? 0;
    const heightUnits = form.get('heightUnits')?.value ?? 0;
    
    // Validar que las unidades utilizadas no exceden el total
    if (usedU > totalU) {
      return { 
        usedUnitsExceeded: { 
          actual: usedU, 
          max: totalU,
          message: `Las unidades utilizadas (${usedU}) exceden el total disponible (${totalU})`
        } 
      };
    }
    
    // Validar que el total de unidades no excede la altura física
    if (totalU > heightUnits) {
      return { 
        totalUnitsExceeded: { 
          actual: totalU, 
          max: heightUnits,
          message: `El total de unidades (${totalU}) excede la altura física del rack (${heightUnits}U)`
        } 
      };
    }
    
    return null;
  }
} 