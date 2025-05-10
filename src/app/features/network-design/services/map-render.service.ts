import { Injectable } from '@angular/core';
import * as d3 from 'd3';
import { LoggerService } from '../../../core/services/logger.service';
import { NetworkElement, NetworkConnection, ElementType, ElementStatus } from '../../../shared/types/network.types';
import { D3Node, D3LinkData } from '../types/network.types';
import { IMapRenderService } from '../interfaces/map-render.interface';

// Extender la interfaz D3Node para que implemente SimulationNodeDatum y permitir propiedades adicionales
interface ExtendedD3Node extends d3.SimulationNodeDatum {
  id: string; // ID es requerido para D3
  name?: string; // Nombre del nodo
  type?: string; // Tipo del elemento
  status?: string; // Estado del elemento
  x?: number; // Posición X
  y?: number; // Posición Y
  fx?: number | null; // Posición X fija (si existe)
  fy?: number | null; // Posición Y fija (si existe)
  vx?: number; // Velocidad en X
  vy?: number; // Velocidad en Y
  index?: number; // Índice en el arreglo de nodos
  fixed?: boolean; // Si el nodo está fijo
  isPreview?: boolean; // Si es un nodo de vista previa
  color?: string; // Color del nodo
  data?: any; // Datos adicionales
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
      // Obtener coordenadas del elemento
      const x = element.position?.coordinates?.[0] || 0;
      const y = element.position?.coordinates?.[1] || 0;
      
      // Convierte coordenadas geográficas (si están en ese formato) a píxeles
      // Este es un mapeo simplificado, en una implementación real
      // se usaría una proyección cartográfica adecuada
      const screenX = this.width / 2 + x * 10000;
      const screenY = this.height / 2 - y * 10000;
      
      return {
        id: element.id,
        name: element.name,
        type: element.type,
        status: element.status,
        x: screenX,
        y: screenY,
        fx: element.metadata?.fixed ? screenX : undefined,
        fy: element.metadata?.fixed ? screenY : undefined,
        color: this.getElementColor(element.type, element.status),
        data: element
      } as ExtendedD3Node;
    });
  }
  
  /**
   * Convierte conexiones de red a enlaces D3
   */
  convertToD3Links(connections: NetworkConnection[], elements: NetworkElement[]): D3LinkData[] {
    // Crear un mapa para búsqueda rápida de elementos por ID
    const elementMap = new Map(elements.map(e => [e.id, e]));
    
    return connections.map(connection => {
      // Obtener elementos fuente y destino
      const source = elementMap.get(connection.sourceId);
      const target = elementMap.get(connection.targetId);
      
      if (!source || !target) {
        this.logger.warn(`No se pudo encontrar elemento para la conexión: ${connection.id}`);
        return {
          source: connection.sourceId,
          target: connection.targetId,
          id: connection.id,
          type: connection.type,
          status: connection.status,
          strength: 0.1,
          distance: 100,
          color: '#999',
          width: 1
        };
      }
      
      // Configurar propiedades visuales según el tipo de conexión
      let color = '#999';
      const distance = 100;
      let width = 1;
      let dashed = false;
      
      switch (connection.status) {
        case ElementStatus.ACTIVE:
          color = '#4CAF50';
          width = 2;
          break;
        case ElementStatus.INACTIVE:
          color = '#9E9E9E';
          dashed = true;
          break;
        case ElementStatus.MAINTENANCE:
          color = '#FF9800';
          width = 2;
          dashed = true;
          break;
        case ElementStatus.FAULT:
          color = '#F44336';
          width = 3;
          break;
        case ElementStatus.PLANNED:
          color = '#2196F3';
          dashed = true;
          break;
      }
      
      // Calcular la fuerza del enlace
      const strength = this.getLinkStrength(connection);
      
      return {
        source: connection.sourceId,
        target: connection.targetId,
        id: connection.id,
        type: connection.type,
        status: connection.status,
        strength,
        distance,
        color,
        width,
        dashed,
        data: connection
      };
    });
  }
  
  /**
   * Obtiene la fuerza de enlace para una conexión específica
   */
  getLinkStrength(connection: NetworkConnection): number {
    switch (connection.type) {
      case 'fiber':
        return 0.2;
      case 'copper':
        return 0.3;
      case 'wireless':
        return 0.1;
      case 'logical':
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
        case ElementStatus.ACTIVE:
          return '#4CAF50'; // Verde
        case ElementStatus.INACTIVE:
          return '#9E9E9E'; // Gris
        case ElementStatus.FAULT:
          return '#F44336'; // Rojo
        case ElementStatus.MAINTENANCE:
          return '#FF9800'; // Naranja
        case ElementStatus.PLANNED:
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
} 