import { Injectable } from '@angular/core';
import * as d3 from 'd3';
import { LoggerService } from '../../../core/services/logger.service';
import { NetworkElement, NetworkConnection, ElementType, ElementStatus, ConnectionStatus, ConnectionType, PONStandard } from '../../../shared/types/network.types';
import { GeographicPosition } from '../../../shared/types/geo-position';
import { D3Node, D3LinkData } from './map-types';
import { IMapRenderService } from '../interfaces/map-render.interface';

// Extender la interfaz D3Node para que implemente SimulationNodeDatum y permitir propiedades adicionales
interface ExtendedD3Node extends d3.SimulationNodeDatum, NetworkElement {
  id: string; // ID es requerido para D3, ya está en NetworkElement
  position: GeographicPosition; // Asegurar que position esté definida
  x?: number; // Posición X para D3
  y?: number; // Posición Y para D3
  fx?: number | null; // Posición X fija (si existe)
  fy?: number | null; // Posición Y fija (si existe)
  vx?: number; // Velocidad en X
  vy?: number; // Velocidad en Y
  fixed?: boolean; // Si el nodo está fijo
  isPreview?: boolean; // Si es un nodo de vista previa
  color?: string; // Color del nodo
  data?: any; // Datos adicionales (podría ser el NetworkElement original)
}

@Injectable({
  providedIn: 'root'
})
export class MapRenderService implements IMapRenderService {
  // Variables para el renderizado
  private svg: d3.Selection<SVGSVGElement, unknown, null, undefined> | null = null;
  private mainGroup: d3.Selection<SVGGElement, unknown, null, undefined> | null = null;
  private nodesGroup: d3.Selection<SVGGElement, unknown, null, undefined> | null = null;
  private linksGroup: d3.Selection<SVGGElement, unknown, null, undefined> | null = null;
  private simulation: d3.Simulation<ExtendedD3Node, d3.SimulationLinkDatum<ExtendedD3Node>> | null = null;
  private width = 0;
  private height = 0;
  private selectedElementId: string | null = null;
  private isDarkMode = false;
  
  constructor(private logger: LoggerService) {}
  
  /**
   * Inicializa los componentes de renderizado en el mapa
   */
  initializeRender(
    svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
    mainGroup: d3.Selection<SVGGElement, unknown, null, undefined>,
    width: number, 
    height: number
  ): void {
    this.svg = svg;
    this.mainGroup = mainGroup;
    this.width = width;
    this.height = height;
    
    // Crear grupos para nodos y enlaces
    this.linksGroup = mainGroup.append('g').attr('class', 'links');
    this.nodesGroup = mainGroup.append('g').attr('class', 'nodes');
    
    // Inicializar simulación física
    this.initializeSimulation();
    
    this.logger.debug('Componentes de renderizado inicializados');
  }
  
  /**
   * Actualiza los nodos en el mapa
   */
  updateNodes(nodes: D3Node[]): void {
    if (!this.nodesGroup || !this.simulation) return;
    
    // Actualizar los datos de la simulación
    this.simulation.nodes(nodes as ExtendedD3Node[]);
    
    // Unir los datos a los elementos visuales
    const node = this.nodesGroup
      .selectAll('.node')
      .data(nodes, d => (d as ExtendedD3Node).id);
    
    // Eliminar elementos que ya no existen
    node.exit().remove();
    
    // Crear nuevos nodos
    const nodeEnter = node.enter()
      .append('g')
      .attr('class', 'node')
      .attr('id', d => `node-${(d as ExtendedD3Node).id}`)
      .call(this.configureDrag() as any);
    
    // Añadir círculos para representar los nodos
    nodeEnter.append('circle')
      .attr('r', d => (d as ExtendedD3Node).isPreview ? 8 : 15)
      .attr('fill', d => this.getElementColor((d as ExtendedD3Node).type || '', (d as ExtendedD3Node).status || ''))
      .attr('stroke', d => (d as ExtendedD3Node).isPreview ? '#FF4081' : '#ffffff')
      .attr('stroke-width', d => (d as ExtendedD3Node).isPreview ? 2 : 1)
      .attr('class', d => (d as ExtendedD3Node).isPreview ? 'preview-node' : '');
    
    // Añadir etiquetas para los nodos
    nodeEnter.append('text')
      .attr('dy', '.35em')
      .attr('y', 30)
      .style('text-anchor', 'middle')
      .style('fill', this.isDarkMode ? '#e0e0e0' : '#333333')
      .style('font-size', '12px')
      .style('pointer-events', 'none')
      .text(d => (d as ExtendedD3Node).name || '');
    
    // Unir nodos existentes y nuevos para actualizaciones posteriores
    this.nodesGroup.selectAll('.node').each(function(d: any) {
      const element = d3.select(this);
      
      // Actualizar colores según estado
      element.select('circle')
        .attr('fill', d.isPreview ? '#FF4081' : d.color || '#4CAF50')
        .attr('stroke', d.isPreview ? '#FF4081' : '#ffffff');
      
      // Actualizar texto
      element.select('text')
        .text(d.name || '');
    });
  }
  
  /**
   * Actualiza los enlaces en el mapa
   */
  updateLinks(links: D3LinkData[]): void {
    if (!this.linksGroup || !this.simulation) return;
    
    // Actualizar fuerzas de enlaces
    this.simulation.force('link', d3.forceLink<ExtendedD3Node, d3.SimulationLinkDatum<ExtendedD3Node>>(links as d3.SimulationLinkDatum<ExtendedD3Node>[])
      .id(d => d.id)
      .distance(d => (d as any).distance || 100)
      .strength(d => (d as any).strength || 0.1));
    
    // Unir los datos a los elementos visuales
    const link = this.linksGroup
      .selectAll('.link')
      .data(links, d => `${(d as any).source.id || (d as any).source}-${(d as any).target.id || (d as any).target}`);
    
    // Eliminar enlaces que ya no existen
    link.exit().remove();
    
    // Crear nuevos enlaces
    const linkEnter = link.enter()
      .append('line')
      .attr('class', 'link')
      .attr('stroke', d => (d as any).color || '#999')
      .attr('stroke-width', d => (d as any).width || 1)
      .attr('stroke-dasharray', d => (d as any).dashed ? '5, 5' : 'none');
    
    // Unir enlaces existentes y nuevos para actualizaciones posteriores
    this.linksGroup.selectAll('.link').each(function(d: any) {
      const element = d3.select(this);
      
      // Actualizar estilos de enlace
      element
        .attr('stroke', d.color || '#999')
        .attr('stroke-width', d.width || 1)
        .attr('stroke-dasharray', d.dashed ? '5, 5' : 'none');
    });
  }
  
  /**
   * Actualiza las posiciones de todos los elementos
   */
  updatePositions(): void {
    if (!this.nodesGroup || !this.linksGroup) return;
    
    this.nodesGroup.selectAll('.node')
      .attr('transform', (d: any) => `translate(${d.x || 0},${d.y || 0})`);
    
    this.linksGroup.selectAll('.link')
      .attr('x1', (d: any) => d.source.x || 0)
      .attr('y1', (d: any) => d.source.y || 0)
      .attr('x2', (d: any) => d.target.x || 0)
      .attr('y2', (d: any) => d.target.y || 0);
  }
  
  /**
   * Convierte elementos de red a nodos D3
   */
  convertToD3Nodes(elements: NetworkElement[]): D3Node[] {
    return elements.map(element => {
      const x = element.position?.coordinates?.[0] || 0;
      const y = element.position?.coordinates?.[1] || 0;
      
      // Mapeo simplificado, ajustar si es necesario una proyección real
      const screenX = this.width / 2 + x * (this.width / 360); // Ejemplo de escalado
      const screenY = this.height / 2 - y * (this.height / 180); // Ejemplo de escalado
      
      const d3Node: D3Node = {
        ...element, // Copiar todas las propiedades de NetworkElement, incluyendo id, name, type, status, position
        x: screenX,
        y: screenY,
        fx: element.metadata?.fixed ? screenX : null,
        fy: element.metadata?.fixed ? screenY : null,
        // vx, vy son gestionados por la simulación D3
      };
      return d3Node;
    });
  }
  
  /**
   * Convierte conexiones de red a enlaces D3
   */
  convertToD3Links(connections: NetworkConnection[], elements: NetworkElement[]): D3LinkData[] {
    const elementMap = new Map(elements.map(e => [e.id, e]));
    
    return connections.reduce((acc, connection) => {
      const sourceNode = elementMap.get(connection.sourceElementId);
      const targetNode = elementMap.get(connection.targetElementId);
      
      if (!sourceNode || !targetNode) {
        this.logger.warn(`Elemento fuente o destino no encontrado para la conexión: ${connection.id ?? 'N/A'}. Saltando conexión.`);
        return acc; // No incluir este enlace si falta un nodo
      }

      // Crear el D3LinkData con todas las propiedades requeridas
      const linkData: D3LinkData = {
        ...connection, // Copia propiedades de NetworkConnection (id, name, type, status, properties, etc.)
        source: sourceNode.id!, // D3LinkData espera D3Node o string (id) para source/target en la simulación
        target: targetNode.id!,
        sourceId: connection.sourceElementId, // Asegurar que sourceId esté presente
        targetId: connection.targetElementId, // Asegurar que targetId esté presente
        value: connection.properties?.weight || this.getLinkStrength(connection) || 1, // Calcular o asignar un valor por defecto
        // name ya debería estar en connection si es parte de NetworkConnection
      };
      
      acc.push(linkData);
      return acc;
    }, [] as D3LinkData[]);
  }
  
  /**
   * Obtiene la fuerza de enlace para una conexión específica
   */
  getLinkStrength(connection: NetworkConnection): number {
    switch (connection.type) {
      case ConnectionType.FIBER:
        return 0.2;
      case ConnectionType.COPPER:
        return 0.3;
      case ConnectionType.WIRELESS:
        return 0.1;
      case ConnectionType.LOGICAL:
        return 0.05;
      default:
        return 0.15;
    }
  }
  
  /**
   * Resalta el elemento seleccionado
   */
  highlightSelectedElement(elementId: string | null): void {
    if (!this.nodesGroup) return;
    
    // Guardar el ID seleccionado
    this.selectedElementId = elementId;
    
    // Quitar cualquier resaltado previo
    this.nodesGroup.selectAll('.node circle')
      .classed('selected', false)
      .attr('stroke-width', 1)
      .attr('r', d => (d as any).isPreview ? 8 : 15);
    
    // Si hay un elemento seleccionado, resaltarlo
    if (elementId) {
      this.nodesGroup.selectAll('.node')
        .filter(d => (d as any).id === elementId)
        .select('circle')
        .classed('selected', true)
        .attr('stroke-width', 3)
        .attr('r', 18);
    }
  }
  
  /**
   * Obtiene el color para un tipo de elemento y estado
   */
  getElementColor(type: string, status?: string): string {
    // Si hay un estado definido, priorizar ese color
    if (status) {
      switch (status) {
        case ConnectionStatus.ACTIVE:
          return '#4CAF50'; // Verde
        case ConnectionStatus.INACTIVE:
          return '#9E9E9E'; // Gris
        case ConnectionStatus.FAILED:
          return '#F44336'; // Rojo
        case ConnectionStatus.DEGRADED:
          return '#FF9800'; // Naranja
        case ConnectionStatus.PLANNED:
          return '#2196F3'; // Azul
      }
    }
    
    // Colores por tipo de elemento
    switch (type) {
      case ElementType.OLT:
        return '#4CAF50'; // Verde
      case ElementType.ONT:
        return '#FF9800'; // Naranja
      case ElementType.FDP:
        return '#2196F3'; // Azul
      case ElementType.SPLITTER:
        return '#9C27B0'; // Púrpura
      case ElementType.EDFA:
        return '#F44336'; // Rojo
      case ElementType.MANGA:
        return '#795548'; // Marrón
      case ElementType.MSAN:
        return '#009688'; // Verde azulado
      case ElementType.TERMINAL_BOX:
        return '#607D8B'; // Azul grisáceo
      case ElementType.SLACK_FIBER:
        return '#80DEEA'; // Turquesa claro
      default:
        return '#673AB7'; // Índigo (color por defecto)
    }
  }
  
  /**
   * Limpia el mapa
   */
  clearRender(): void {
    if (this.nodesGroup) this.nodesGroup.selectAll('*').remove();
    if (this.linksGroup) this.linksGroup.selectAll('*').remove();
    
    // Detener simulación
    if (this.simulation) this.simulation.stop();
  }
  
  /**
   * Actualiza el tamaño del mapa
   */
  refreshRenderSize(width: number, height: number): void {
    if (!this.svg || !this.simulation) return;
    
    this.width = width;
    this.height = height;
    
    // Actualizar tamaño del SVG
    this.svg
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`);
    
    // Actualizar fuerzas centrales con type assertion para evitar error
    this.simulation.force('center', d3.forceCenter<ExtendedD3Node>(width / 2, height / 2));
    
    // Reiniciar simulación
    this.simulation.alpha(0.3).restart();
  }
  
  /**
   * Establece el modo oscuro
   */
  setDarkMode(isDarkMode: boolean): void {
    this.isDarkMode = isDarkMode;
    
    // Actualizar estilos de texto y otros elementos
    if (this.nodesGroup) {
      this.nodesGroup.selectAll('.node text')
        .style('fill', isDarkMode ? '#e0e0e0' : '#333333');
    }
  }
  
  /**
   * Inicializa la simulación D3 force
   */
  private initializeSimulation(): void {
    try {
      // Crear la simulación con configuración segura
      this.simulation = d3.forceSimulation<ExtendedD3Node>()
        .force('link', d3.forceLink<ExtendedD3Node, d3.SimulationLinkDatum<ExtendedD3Node>>()
          .id(d => d.id)
          .distance(100))
        .force('charge', d3.forceManyBody<ExtendedD3Node>().strength(-300))
        .force('center', d3.forceCenter<ExtendedD3Node>(this.width / 2, this.height / 2))
        .on('tick', () => this.updatePositions());
      
      this.logger.debug('Simulación D3 inicializada con éxito');
    } catch (error) {
      this.logger.error('Error al inicializar la simulación D3:', error);
    }
  }
  
  /**
   * Configura el comportamiento de arrastre para los nodos
   */
  private configureDrag(): d3.DragBehavior<Element, ExtendedD3Node, any> {
    if (!this.simulation) {
      return d3.drag<Element, ExtendedD3Node>();
    }
    
    return d3.drag<Element, ExtendedD3Node>()
      .on('start', (event, d) => {
        if (!event.active) this.simulation?.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on('drag', (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on('end', (event, d) => {
        if (!event.active) this.simulation?.alphaTarget(0);
        // Solo limpiar fx/fy si el nodo no estaba fijo previamente
        if (!d.fixed) {
          d.fx = null;
          d.fy = null;
        }
      });
  }
  
  /**
   * Obtiene el estilo para una conexión según su estado
   */
  private getConnectionStyleByStatus(connection: NetworkConnection): any {
    let color = '#2196f3';
    let strokeWidth = 1;
    let dashArray = '';
    let strokeOpacity = 0.8;
    
    switch (connection.status) {
      case ConnectionStatus.ACTIVE:
        color = '#4caf50';
        strokeWidth = 2;
        break;
      case ConnectionStatus.INACTIVE:
        color = '#9e9e9e';
        strokeWidth = 1;
        dashArray = '3,3';
        strokeOpacity = 0.5;
        break;
      case ConnectionStatus.DEGRADED:
        color = '#ff9800';
        strokeWidth = 2;
        dashArray = '5,2';
        break;
      case ConnectionStatus.FAILED:
        color = '#f44336';
        strokeWidth = 2;
        break;
      case ConnectionStatus.PLANNED:
        color = '#9c27b0';
        strokeWidth = 1.5;
        dashArray = '5,5';
        strokeOpacity = 0.6;
        break;
      default:
        color = '#2196f3';
        strokeWidth = 1;
    }
    
    return {
      stroke: color,
      strokeWidth,
      strokeOpacity,
      strokeDasharray: dashArray
    };
  }

  /**
   * Obtiene el color para un tipo de conexión
   */
  private getConnectionColorByType(connection: NetworkConnection): string {
    switch (connection.type) {
      case ConnectionType.FIBER:
        return '#03a9f4'; // Azul para fibra
      case ConnectionType.COPPER:
        return '#ff5722'; // Naranja para cobre
      case ConnectionType.WIRELESS:
        return '#8bc34a'; // Verde para inalámbrico
      case ConnectionType.LOGICAL:
        return '#9c27b0'; // Púrpura para lógico
      default:
        return '#2196f3'; // Azul por defecto
    }
  }
} 
