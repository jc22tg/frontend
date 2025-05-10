import { Component, Input, OnChanges, SimpleChanges, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { ElementType, NetworkElement } from '../../../../shared/types/network.types';
import { ConnectionCompatibilityService } from '../../services/connection-compatibility.service';
import { fadeAnimation, listAnimation } from '../../animations';

/**
 * Componente para mostrar las listas de compatibilidad entre elementos de red
 * 
 * Muestra dos listas visuales que indican con qué elementos es compatible y con cuáles
 * no es compatible un elemento seleccionado. Se actualiza automáticamente cuando
 * cambia la selección de elemento o tipo de elemento.
 * 
 * @implements {OnInit}
 * @implements {OnChanges}
 */
@Component({
  selector: 'app-element-compatibility-list',
  templateUrl: './element-compatibility-list.component.html',
  styleUrls: ['./element-compatibility-list.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatListModule,
    MatDividerModule,
    MatProgressSpinnerModule
  ],
  animations: [fadeAnimation, listAnimation]
})
export class ElementCompatibilityListComponent implements OnChanges, OnInit {
  /**
   * Elemento de red seleccionado para analizar compatibilidad
   * Puede ser nulo si no hay elemento seleccionado
   * 
   * @type {NetworkElement | null}
   */
  @Input() selectedElement: NetworkElement | null = null;
  
  /**
   * Tipo de elemento seleccionado, se usa cuando no hay un elemento específico
   * Permite mostrar compatibilidad basada solo en el tipo
   * 
   * @type {ElementType | null}
   */
  @Input() selectedElementType: ElementType | null = null;

  /**
   * Lista de tipos de elementos compatibles con el elemento/tipo seleccionado
   * 
   * @type {ElementType[]}
   */
  compatibleTypes: ElementType[] = [];
  
  /**
   * Lista de tipos de elementos incompatibles con el elemento/tipo seleccionado
   * 
   * @type {ElementType[]}
   */
  incompatibleTypes: ElementType[] = [];
  
  /**
   * Indicador de estado de carga para mostrar skeleton UI
   * 
   * @type {boolean}
   */
  isLoading = false;
  
  /**
   * Constructor con inyección de dependencias
   * 
   * @param {ConnectionCompatibilityService} compatibilityService - Servicio para verificar compatibilidad entre elementos
   */
  constructor(private compatibilityService: ConnectionCompatibilityService) {}

  /**
   * Inicializa el componente y carga estado inicial
   * 
   * @returns {void}
   */
  ngOnInit(): void {
    // Actualizamos directamente, sin simular carga para mejor rendimiento
    this.updateCompatibilityLists();
  }

  /**
   * Detecta cambios en las propiedades de entrada y actualiza las listas
   * 
   * @param {SimpleChanges} changes - Cambios detectados por Angular
   * @returns {void}
   */
  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['selectedElement'] && this.selectedElement) || 
        (changes['selectedElementType'] && this.selectedElementType)) {
      this.isLoading = true;
      // Optimizamos eliminando el timeout artificial
      this.updateCompatibilityLists();
      this.isLoading = false;
    }
  }

  /**
   * Actualiza las listas de compatibilidad basadas en el elemento o tipo seleccionado
   * 
   * @private
   * @returns {void}
   */
  private updateCompatibilityLists(): void {
    // Determinar qué tipo de elemento usar para la comparación
    const elementType = this.selectedElement?.type || this.selectedElementType;
    
    if (!elementType) {
      this.resetLists();
      return;
    }

    // Obtener todos los tipos de elementos excepto el actual
    const allTypes = Object.values(ElementType).filter(
      type => typeof type === 'string' && type !== elementType
    ) as ElementType[];

    // Separar en compatibles e incompatibles usando el servicio
    this.compatibleTypes = allTypes.filter(
      type => this.compatibilityService.isCompatible(elementType, type)
    );
    
    this.incompatibleTypes = allTypes.filter(
      type => !this.compatibilityService.isCompatible(elementType, type)
    );
  }

  /**
   * Limpia ambas listas de compatibilidad
   * 
   * @private
   * @returns {void}
   */
  private resetLists(): void {
    this.compatibleTypes = [];
    this.incompatibleTypes = [];
  }

  /**
   * Verifica si hay elementos compatibles para mostrar
   * 
   * @returns {boolean} true si hay al menos un tipo compatible
   */
  hasCompatibleTypes(): boolean {
    return this.compatibleTypes.length > 0;
  }

  /**
   * Verifica si hay elementos incompatibles para mostrar
   * 
   * @returns {boolean} true si hay al menos un tipo incompatible
   */
  hasIncompatibleTypes(): boolean {
    return this.incompatibleTypes.length > 0;
  }

  /**
   * Obtiene el nombre descriptivo y legible de un tipo de elemento
   * 
   * @param {ElementType} type - Tipo de elemento a convertir a texto
   * @returns {string} Nombre descriptivo del tipo de elemento
   */
  getElementTypeName(type: ElementType): string {
    switch (type) {
      case ElementType.ODF: return 'ODF'; // Reemplaza a FDP
      case ElementType.OLT: return 'OLT';
      case ElementType.ONT: return 'ONT';
      case ElementType.EDFA: return 'EDFA';
      case ElementType.SPLITTER: return 'Splitter';
      case ElementType.MANGA: return 'Manga';
      case ElementType.TERMINAL_BOX: return 'Caja Terminal';
      case ElementType.FIBER_THREAD: return 'Hilo de Fibra';
      case ElementType.DROP_CABLE: return 'Cable de Acometida';
      case ElementType.DISTRIBUTION_CABLE: return 'Cable de Distribución';
      case ElementType.FEEDER_CABLE: return 'Cable Alimentador';
      case ElementType.BACKBONE_CABLE: return 'Cable Troncal';
      case ElementType.MSAN: return 'MSAN';
      case ElementType.ROUTER: return 'Router';
      case ElementType.RACK: return 'Rack';
      case ElementType.NETWORK_GRAPH: return 'Gráfico de Red';
      // Nuevos tipos añadidos
      case ElementType.WDM_FILTER: return 'Filtro WDM';
      case ElementType.COHERENT_TRANSPONDER: return 'Transpondedor Coherente';
      case ElementType.WAVELENGTH_ROUTER: return 'Router de Longitud de Onda';
      case ElementType.OPTICAL_SWITCH: return 'Switch Óptico';
      case ElementType.ROADM: return 'ROADM';
      case ElementType.OPTICAL_AMPLIFIER: return 'Amplificador Óptico';
      // Tipos obsoletos mantenidos por compatibilidad
      case ElementType.FIBER_CONNECTION: return 'Conexión de Fibra';
      case ElementType.FIBER_SPLICE: return 'Empalme de Fibra';
      case ElementType.FIBER_CABLE: return 'Cable de Fibra';
      case ElementType.FIBER_STRAND: return 'Hebra de Fibra';
      case ElementType.FDP: return 'ODF (FDP obsoleto)';
      default: return 'Elemento Desconocido';
    }
  }

  /**
   * Obtiene el nombre del icono de Material correspondiente al tipo de elemento
   * 
   * @param {ElementType} type - Tipo de elemento
   * @returns {string} Nombre del icono de Material Icons
   */
  getElementTypeIcon(type: ElementType): string {
    switch (type) {
      case ElementType.ODF: return 'router'; // Reemplaza a FDP
      case ElementType.OLT: return 'settings_input_hdmi';
      case ElementType.ONT: return 'dns';
      case ElementType.EDFA: return 'tune';
      case ElementType.SPLITTER: return 'call_split';
      case ElementType.MANGA: return 'settings_input_component';
      case ElementType.TERMINAL_BOX: return 'archive';
      case ElementType.MSAN: return 'storage';
      case ElementType.ROUTER: return 'router';
      case ElementType.RACK: return 'domain';
      case ElementType.NETWORK_GRAPH: return 'share';
      // Nuevos tipos añadidos
      case ElementType.WDM_FILTER: return 'filter_alt';
      case ElementType.COHERENT_TRANSPONDER: return 'import_export';
      case ElementType.WAVELENGTH_ROUTER: return 'waves';
      case ElementType.OPTICAL_SWITCH: return 'swap_calls';
      case ElementType.ROADM: return 'settings_ethernet';
      case ElementType.OPTICAL_AMPLIFIER: return 'trending_up';
      // Agrupar casos similares para mejor mantenibilidad
      case ElementType.FIBER_THREAD:
      case ElementType.FIBER_CONNECTION: 
      case ElementType.FIBER_SPLICE:
      case ElementType.FIBER_CABLE:
      case ElementType.FIBER_STRAND:
      case ElementType.DROP_CABLE:
      case ElementType.DISTRIBUTION_CABLE:
      case ElementType.FEEDER_CABLE:
      case ElementType.BACKBONE_CABLE: 
        return 'timeline';
      case ElementType.FDP: return 'router'; // Obsoleto, usar ODF
      default: return 'device_unknown';
    }
  }

  /**
   * Obtiene el nombre del elemento o tipo seleccionado actualmente
   * 
   * @returns {string} Nombre del tipo de elemento seleccionado
   */
  getSelectedElementTypeName(): string {
    if (this.selectedElement) {
      return this.getElementTypeName(this.selectedElement.type);
    } else if (this.selectedElementType !== null) {
      return this.getElementTypeName(this.selectedElementType);
    }
    return 'Elemento';
  }
} 