import { Injectable } from '@angular/core';
import { LoggerService } from '../../../core/services/logger.service';
import { NetworkElement, NetworkConnection, ElementType, ElementStatus } from '../../../shared/types/network.types';
import * as THREE from 'three';
import { IMapRenderService } from '../interfaces/map-render.interface';
import { D3Node, D3LinkData } from './map-types';

@Injectable({
  providedIn: 'root'
})
export class MapWebglRendererService implements IMapRenderService {
  // Propiedades de Three.js
  private renderer: THREE.WebGLRenderer | null = null;
  private scene: THREE.Scene | null = null;
  private camera: THREE.OrthographicCamera | null = null;
  private nodeObjects = new Map<string, THREE.Object3D>();
  private linkObjects = new Map<string, THREE.Line>();
  private textLabels = new Map<string, HTMLDivElement>();
  private containerElement: HTMLElement | null = null;
  
  // Dimensiones y estado
  private width = 0;
  private height = 0;
  private isDarkMode = false;
  private isInitialized = false;
  private selectedElementId: string | null = null;
  
  // Configuración de clustering
  private clusteringEnabled = false;
  private clusterDistance = 50;
  private clusters = new Map<string, any[]>();
  private minZoomForDetail = 0.7;
  private currentZoomLevel = 1;
  
  // Propiedades para el manejo de conectividad entre clusters
  private sourceClusterId = '';
  private targetClusterId = '';
  
  // Límites para renderizado progresivo
  private maxElementsPerFrame = 1000;
  private visibleRect = new THREE.Box2();
  
  constructor(private logger: LoggerService) {}
  
  /**
   * Convierte elementos de red a nodos D3
   */
  convertToD3Nodes(elements: NetworkElement[]): D3Node[] {
    return elements.map(element => {
      // Obtener coordenadas del elemento
      const x = element.position?.coordinates?.[0] || 0;
      const y = element.position?.coordinates?.[1] || 0;
      
      return {
        ...element,
        x: x,
        y: y,
        fx: null,
        fy: null,
        vx: 0,
        vy: 0
      } as D3Node;
    });
  }
  
  /**
   * Convierte conexiones de red a enlaces D3
   */
  convertToD3Links(connections: NetworkConnection[], elements: NetworkElement[]): D3LinkData[] {
    // Crear un mapa para búsqueda rápida de elementos por ID
    const elementMap = new Map(elements.map(e => [e.id, e]));
    
    return connections.map(connection => {
      // Calcular la fuerza del enlace
      const strength = this.getLinkStrength(connection);
      
      return {
        ...connection,
        source: connection.sourceId,
        target: connection.targetId,
        value: strength
      } as D3LinkData;
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
   * Inicializa el renderizador WebGL
   */
  initializeRender(
    container: HTMLElement,
    width: number, 
    height: number
  ): void {
    if (!width || !height) {
      this.logger.error('No se pueden inicializar dimensiones inválidas para el renderizador WebGL');
      return;
    }
    
    this.width = width;
    this.height = height;
    this.containerElement = container;
    
    try {
      // Crear escena
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(this.isDarkMode ? 0x212121 : 0xf5f5f5);
      
      // Crear cámara ortográfica
      const aspectRatio = width / height;
      const frustumSize = 1000;
      this.camera = new THREE.OrthographicCamera(
        frustumSize * aspectRatio / -2, 
        frustumSize * aspectRatio / 2, 
        frustumSize / 2, 
        frustumSize / -2, 
        1, 
        10000
      );
      this.camera.position.z = 1000;
      this.camera.lookAt(0, 0, 0);
      
      // Crear renderizador WebGL
      this.renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        alpha: true
      });
      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(window.devicePixelRatio);
      
      // Añadir el canvas al contenedor
      container.appendChild(this.renderer.domElement);
      
      // Crear capa para las etiquetas de texto
      const labelsContainer = document.createElement('div');
      labelsContainer.className = 'map-labels-container';
      labelsContainer.style.position = 'absolute';
      labelsContainer.style.top = '0';
      labelsContainer.style.left = '0';
      labelsContainer.style.width = '100%';
      labelsContainer.style.height = '100%';
      labelsContainer.style.pointerEvents = 'none';
      container.appendChild(labelsContainer);
      
      this.isInitialized = true;
      this.logger.debug('Renderizador WebGL inicializado con éxito');
      
      // Iniciar bucle de renderizado
      this.animate();
      
    } catch (error) {
      this.logger.error('Error al inicializar el renderizador WebGL:', error);
    }
  }
  
  /**
   * Bucle de animación para renderizado continuo
   */
  private animate(): void {
    if (!this.isInitialized || !this.renderer || !this.scene || !this.camera) return;
    
    requestAnimationFrame(() => this.animate());
    this.renderer.render(this.scene, this.camera);
    this.updateLabelPositions();
  }
  
  /**
   * Actualiza las posiciones de las etiquetas de texto
   */
  private updateLabelPositions(): void {
    if (!this.camera || !this.containerElement) return;
    
    // Actualizar posición de las etiquetas basado en la posición 3D
    this.textLabels.forEach((label, id) => {
      const object = this.nodeObjects.get(id);
      if (object) {
        // Proyectar posición 3D a coordenadas de pantalla
        const position = new THREE.Vector3();
        position.setFromMatrixPosition(object.matrixWorld);
        position.project(this.camera as THREE.Camera);
        
        // Convertir coordenadas normalizadas a pixels
        const widthHalf = this.width / 2;
        const heightHalf = this.height / 2;
        const x = (position.x * widthHalf) + widthHalf;
        const y = -(position.y * heightHalf) + heightHalf;
        
        // Actualizar posición de la etiqueta
        label.style.left = `${x}px`;
        label.style.top = `${y + 30}px`; // 30px debajo del nodo
      }
    });
  }
  
  /**
   * Actualiza los nodos en el renderizador
   */
  updateNodes(nodes: any[]): void {
    if (!this.isInitialized || !this.scene) return;
    
    try {
      // Limpiar nodos actuales
      this.nodeObjects.forEach((object) => {
        this.scene?.remove(object);
      });
      this.nodeObjects.clear();
      
      // Limpiar etiquetas
      this.textLabels.forEach((label) => {
        label.remove();
      });
      this.textLabels.clear();
      
      // Si hay clustering habilitado y el zoom es menor que el mínimo para detalle
      if (this.clusteringEnabled && this.currentZoomLevel < this.minZoomForDetail) {
        this.renderClusters(nodes);
      } else {
        this.renderNodes(nodes);
      }
      
    } catch (error) {
      this.logger.error('Error al actualizar nodos WebGL:', error);
    }
  }
  
  /**
   * Renderiza nodos individuales
   */
  private renderNodes(nodes: any[]): void {
    if (!this.scene || !this.camera || !this.containerElement) return;
    
    // Filtrar nodos a renderizar basado en la vista actual
    const nodesToRender = this.getVisibleElements(nodes);
    
    // Limitar el número de nodos por frame
    const limitedNodes = nodesToRender.slice(0, this.maxElementsPerFrame);
    
    // Obtener el contenedor de etiquetas
    const labelsContainer = this.containerElement.querySelector('.map-labels-container');
    if (!labelsContainer) return;
    
    // Crear geometría y material para nodos
    const nodeGeometry = new THREE.CircleGeometry(15, 32);
    
    // Crear nodos
    limitedNodes.forEach(node => {
      // Crear material con el color correspondiente
      const nodeMaterial = new THREE.MeshBasicMaterial({
        color: new THREE.Color(node.color || this.getElementColor(node.type, node.status))
      });
      
      // Crear malla
      const nodeMesh = new THREE.Mesh(nodeGeometry, nodeMaterial);
      nodeMesh.position.set(node.x || 0, node.y || 0, 0);
      
      // Añadir borde
      const edgeGeometry = new THREE.CircleGeometry(15, 32);
      const edgeMaterial = new THREE.LineBasicMaterial({
        color: node.id === this.selectedElementId ? 0x4285F4 : 0xFFFFFF,
        linewidth: node.id === this.selectedElementId ? 3 : 1
      });
      const edge = new THREE.LineLoop(edgeGeometry, edgeMaterial);
      
      // Crear grupo para el nodo y su borde
      const nodeGroup = new THREE.Group();
      nodeGroup.add(nodeMesh);
      nodeGroup.add(edge);
      nodeGroup.position.set(node.x || 0, node.y || 0, 0);
      
      // Almacenar referencia y añadir a la escena
      this.nodeObjects.set(node.id, nodeGroup);
      this.scene?.add(nodeGroup);
      
      // Crear etiqueta de texto
      if (node.name) {
        const label = document.createElement('div');
        label.className = 'map-node-label';
        label.textContent = node.name;
        label.style.position = 'absolute';
        label.style.color = this.isDarkMode ? '#e0e0e0' : '#333333';
        label.style.fontSize = '12px';
        label.style.textAlign = 'center';
        label.style.transform = 'translate(-50%, 0)';
        label.style.whiteSpace = 'nowrap';
        label.style.pointerEvents = 'none';
        
        labelsContainer.appendChild(label);
        this.textLabels.set(node.id, label);
      }
    });
    
    // Si hubo limitación, informar
    if (limitedNodes.length < nodesToRender.length) {
      this.logger.warn(`Se limitaron ${nodesToRender.length - limitedNodes.length} elementos para mantener el rendimiento`);
    }
  }
  
  /**
   * Renderiza nodos agrupados en clusters
   */
  private renderClusters(nodes: any[]): void {
    if (!this.scene || !this.camera) return;
    
    // Crear clusters
    this.clusters = this.generateClusters(nodes);
    
    // Obtener el contenedor de etiquetas
    const labelsContainer = this.containerElement?.querySelector('.map-labels-container');
    if (!labelsContainer) return;
    
    // Renderizar cada cluster
    this.clusters.forEach((clusterNodes, clusterId) => {
      // Calcular posición promedio
      const avgX = clusterNodes.reduce((sum, node) => sum + (node.x || 0), 0) / clusterNodes.length;
      const avgY = clusterNodes.reduce((sum, node) => sum + (node.y || 0), 0) / clusterNodes.length;
      
      // Crear geometría para el cluster
      const clusterSize = Math.min(30, 15 + Math.sqrt(clusterNodes.length) * 3);
      const clusterGeometry = new THREE.CircleGeometry(clusterSize, 32);
      
      // Crear material para el cluster
      const clusterMaterial = new THREE.MeshBasicMaterial({
        color: new THREE.Color(0x2196F3)
      });
      
      // Crear malla para el cluster
      const clusterMesh = new THREE.Mesh(clusterGeometry, clusterMaterial);
      clusterMesh.position.set(avgX, avgY, 0);
      
      // Añadir borde
      const edgeGeometry = new THREE.CircleGeometry(clusterSize, 32);
      const edgeMaterial = new THREE.LineBasicMaterial({
        color: 0xFFFFFF,
        linewidth: 2
      });
      const edge = new THREE.LineLoop(edgeGeometry, edgeMaterial);
      
      // Crear grupo para el cluster y su borde
      const clusterGroup = new THREE.Group();
      clusterGroup.add(clusterMesh);
      clusterGroup.add(edge);
      clusterGroup.position.set(avgX, avgY, 0);
      
      // Almacenar referencia y añadir a la escena
      this.nodeObjects.set(clusterId, clusterGroup);
      this.scene?.add(clusterGroup);
      
      // Crear etiqueta de texto con el número de elementos
      if (labelsContainer) {
        const label = document.createElement('div');
        label.className = 'map-cluster-label';
        label.textContent = `${clusterNodes.length}`;
        label.style.position = 'absolute';
        label.style.color = '#FFFFFF';
        label.style.fontWeight = 'bold';
        label.style.fontSize = '14px';
        label.style.textAlign = 'center';
        label.style.transform = 'translate(-50%, -50%)';
        label.style.pointerEvents = 'none';
        
        labelsContainer.appendChild(label);
        this.textLabels.set(clusterId, label);
      }
    });
  }
  
  /**
   * Genera clusters basados en la proximidad de los nodos
   */
  private generateClusters(nodes: any[]): Map<string, any[]> {
    const clusters = new Map<string, any[]>();
    const processed = new Set<string>();
    
    nodes.forEach(node => {
      if (processed.has(node.id)) return;
      
      // Nuevo cluster con este nodo
      const clusterId = `cluster-${node.id}`;
      const clusterNodes: any[] = [node];
      
      // Marcar como procesado
      processed.add(node.id);
      
      // Buscar nodos cercanos
      nodes.forEach(otherNode => {
        if (node.id === otherNode.id || processed.has(otherNode.id)) return;
        
        // Calcular distancia
        const dx = (node.x || 0) - (otherNode.x || 0);
        const dy = (node.y || 0) - (otherNode.y || 0);
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Si está dentro de la distancia de clustering, añadir al cluster
        if (distance <= this.clusterDistance) {
          clusterNodes.push(otherNode);
          processed.add(otherNode.id);
        }
      });
      
      // Guardar cluster
      clusters.set(clusterId, clusterNodes);
    });
    
    return clusters;
  }
  
  /**
   * Filtra elementos que están dentro del viewport visible
   */
  private getVisibleElements(elements: any[]): any[] {
    if (!this.camera) return elements;
    
    // Calcular los límites visibles
    this.updateVisibleRect();
    
    // Filtrar elementos que están dentro de los límites visibles
    return elements.filter(element => {
      return this.visibleRect.containsPoint(new THREE.Vector2(element.x || 0, element.y || 0));
    });
  }
  
  /**
   * Actualiza el rectángulo de área visible
   */
  private updateVisibleRect(): void {
    if (!this.camera) return;
    
    // Obtener los límites de la cámara
    const cameraFrustum = new THREE.Frustum();
    cameraFrustum.setFromProjectionMatrix(
      new THREE.Matrix4().multiplyMatrices(
        this.camera.projectionMatrix,
        this.camera.matrixWorldInverse
      )
    );
    
    // Convertir a un rectángulo 2D
    const halfWidth = this.width / 2 / this.currentZoomLevel;
    const halfHeight = this.height / 2 / this.currentZoomLevel;
    
    // Estimar la posición central de la cámara en el plano XY
    const center = new THREE.Vector3(0, 0, 0);
    center.applyMatrix4(this.camera.matrixWorld);
    
    this.visibleRect.min.set(center.x - halfWidth, center.y - halfHeight);
    this.visibleRect.max.set(center.x + halfWidth, center.y + halfHeight);
  }
  
  /**
   * Actualiza los enlaces en el renderizador
   */
  updateLinks(links: any[]): void {
    if (!this.isInitialized || !this.scene) return;
    
    try {
      // Limpiar enlaces actuales
      this.linkObjects.forEach((object) => {
        this.scene?.remove(object);
      });
      this.linkObjects.clear();
      
      // Si el clustering está habilitado y el zoom es bajo, renderizar conexiones entre clusters
      if (this.clusteringEnabled && this.currentZoomLevel < this.minZoomForDetail) {
        this.renderClusterLinks(links);
      } else {
        this.renderLinks(links);
      }
      
    } catch (error) {
      this.logger.error('Error al actualizar enlaces WebGL:', error);
    }
  }
  
  /**
   * Renderiza enlaces individuales
   */
  private renderLinks(links: any[]): void {
    if (!this.scene) return;
    
    // Renderizar solo enlaces visibles
    links.forEach(link => {
      // Verificar que existan nodos de origen y destino
      const sourceNode = this.nodeObjects.get(link.source);
      const targetNode = this.nodeObjects.get(link.target);
      
      if (!sourceNode || !targetNode) return;
      
      // Obtener posiciones
      const sourcePosition = new THREE.Vector3();
      sourcePosition.setFromMatrixPosition(sourceNode.matrixWorld);
      
      const targetPosition = new THREE.Vector3();
      targetPosition.setFromMatrixPosition(targetNode.matrixWorld);
      
      // Crear geometría de línea
      const geometry = new THREE.BufferGeometry().setFromPoints([
        sourcePosition,
        targetPosition
      ]);
      
      // Crear material de línea
      let lineMaterial;
      if (link.dashed) {
        lineMaterial = new THREE.LineDashedMaterial({
          color: new THREE.Color(link.color || 0x999999),
          linewidth: link.width || 1,
          dashSize: 5,
          gapSize: 5
        });
      } else {
        lineMaterial = new THREE.LineBasicMaterial({
          color: new THREE.Color(link.color || 0x999999),
          linewidth: link.width || 1
        });
      }
      
      // Crear línea
      const line = new THREE.Line(geometry, lineMaterial);
      
      if (link.dashed) {
        line.computeLineDistances(); // Necesario para líneas punteadas
      }
      
      // Almacenar referencia y añadir a la escena
      const linkId = `${link.source}-${link.target}`;
      this.linkObjects.set(linkId, line);
      if (this.scene) {
        this.scene.add(line);
      }
    });
  }
  
  /**
   * Renderiza enlaces entre clusters
   */
  private renderClusterLinks(links: any[]): void {
    if (!this.scene) return;
    
    // Mapa para mantener seguimiento de conexiones entre clusters
    const clusterConnections = new Map<string, {
      count: number,
      source: THREE.Vector3,
      target: THREE.Vector3
    }>();
    
    // Iterar sobre todos los enlaces
    links.forEach(link => {
      // Determinar a qué clusters pertenecen los nodos de origen y destino
      let sourceClusterId: string | null = null;
      let targetClusterId: string | null = null;
      
      // Buscar en los clusters
      this.clusters.forEach((nodes, clusterId) => {
        if (nodes.some(node => node.id === link.source)) {
          sourceClusterId = clusterId;
        }
        if (nodes.some(node => node.id === link.target)) {
          targetClusterId = clusterId;
        }
      });
      
      // Si ambos nodos están en clusters y son diferentes clusters
      if (sourceClusterId && targetClusterId && sourceClusterId !== targetClusterId) {
        const connectionKey = `${sourceClusterId}-${targetClusterId}`;
        const reverseKey = `${targetClusterId}-${sourceClusterId}`;
        
        // Usar la clave existente si ya existe una conexión en la dirección opuesta
        const key = clusterConnections.has(reverseKey) ? reverseKey : connectionKey;
        
        if (!clusterConnections.has(key)) {
          // Obtener posiciones de los clusters
          const sourceObj = this.nodeObjects.get(sourceClusterId);
          const targetObj = this.nodeObjects.get(targetClusterId);
          
          if (sourceObj && targetObj) {
            const sourcePos = new THREE.Vector3();
            sourcePos.setFromMatrixPosition(sourceObj.matrixWorld);
            
            const targetPos = new THREE.Vector3();
            targetPos.setFromMatrixPosition(targetObj.matrixWorld);
            
            clusterConnections.set(key, {
              count: 1,
              source: sourcePos,
              target: targetPos
            });
          }
        } else {
          // Incrementar contador de conexiones
          const connection = clusterConnections.get(key);
          if (connection) {
            connection.count++;
          }
        }
      }
    });
    
    // Renderizar las conexiones entre clusters
    clusterConnections.forEach((connection, key) => {
      // Crear geometría de línea
      const geometry = new THREE.BufferGeometry().setFromPoints([
        connection.source,
        connection.target
      ]);
      
      // Ancho de línea proporcional al número de conexiones
      const lineWidth = Math.min(5, 1 + Math.log2(connection.count));
      
      // Crear material de línea
      const lineMaterial = new THREE.LineBasicMaterial({
        color: new THREE.Color(0x2196F3),
        linewidth: lineWidth
      });
      
      // Crear línea
      const line = new THREE.Line(geometry, lineMaterial);
      
      // Almacenar referencia y añadir a la escena
      this.linkObjects.set(key, line);
      this.scene?.add(line);
    });
  }
  
  /**
   * Actualiza las posiciones de todos los elementos
   */
  updatePositions(): void {
    // No necesaria con Three.js - las posiciones se actualizan al crear/mover objetos
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
   * Resalta el elemento seleccionado
   */
  highlightSelectedElement(elementId: string | null): void {
    this.selectedElementId = elementId;
    
    // Actualizar bordes de todos los nodos
    this.nodeObjects.forEach((object, id) => {
      // Buscar el borde (segundo hijo)
      if (object.children.length >= 2) {
        const edge = object.children[1] as THREE.Line;
        if (edge && edge instanceof THREE.Line) {
          // Cambiar color y grosor del borde
          const material = edge.material as THREE.LineBasicMaterial;
          material.color.set(
            id === elementId ? 0x4285F4 : 0xFFFFFF
          );
          // No podemos cambiar el grosor de línea dinámicamente en WebGL
        }
      }
    });
  }
  
  /**
   * Limpia el renderizador
   */
  clearRender(): void {
    // Limpiar nodos
    this.nodeObjects.forEach((object) => {
      this.scene?.remove(object);
    });
    this.nodeObjects.clear();
    
    // Limpiar enlaces
    this.linkObjects.forEach((line) => {
      this.scene?.remove(line);
    });
    this.linkObjects.clear();
    
    // Limpiar etiquetas
    this.textLabels.forEach((label) => {
      label.remove();
    });
    this.textLabels.clear();
    
    // Limpiar clusters
    this.clusters.clear();
  }
  
  /**
   * Actualiza el tamaño del renderizador
   */
  refreshRenderSize(width: number, height: number): void {
    if (!this.isInitialized || !this.renderer || !this.camera) return;
    
    this.width = width;
    this.height = height;
    
    // Actualizar tamaño del renderizador
    this.renderer.setSize(width, height);
    
    // Actualizar cámara
    const aspectRatio = width / height;
    const frustumSize = 1000;
    
    if (this.camera instanceof THREE.OrthographicCamera) {
      this.camera.left = frustumSize * aspectRatio / -2;
      this.camera.right = frustumSize * aspectRatio / 2;
      this.camera.top = frustumSize / 2;
      this.camera.bottom = frustumSize / -2;
      this.camera.updateProjectionMatrix();
    }
  }
  
  /**
   * Establece el modo oscuro
   */
  setDarkMode(isDarkMode: boolean): void {
    this.isDarkMode = isDarkMode;
    
    // Actualizar color de fondo
    if (this.scene) {
      this.scene.background = new THREE.Color(isDarkMode ? 0x212121 : 0xf5f5f5);
    }
    
    // Actualizar color de las etiquetas
    this.textLabels.forEach((label) => {
      if (!label.classList.contains('map-cluster-label')) {
        label.style.color = isDarkMode ? '#e0e0e0' : '#333333';
      }
    });
  }
  
  /**
   * Configura el zoom actual
   */
  setZoomLevel(zoomLevel: number): void {
    this.currentZoomLevel = zoomLevel / 100; // Convertir de porcentaje a factor
    
    // Actualizar la cámara según el zoom
    if (this.camera) {
      const scale = 1 / this.currentZoomLevel;
      
      if (this.camera instanceof THREE.OrthographicCamera) {
        const aspectRatio = this.width / this.height;
        const frustumSize = 1000 * scale;
        
        this.camera.left = frustumSize * aspectRatio / -2;
        this.camera.right = frustumSize * aspectRatio / 2;
        this.camera.top = frustumSize / 2;
        this.camera.bottom = frustumSize / -2;
        this.camera.updateProjectionMatrix();
      }
    }
    
    // Activar/desactivar clustering según el nivel de zoom
    this.clusteringEnabled = this.currentZoomLevel < this.minZoomForDetail;
  }
  
  /**
   * Habilita o deshabilita el clustering
   */
  setClusteringEnabled(enabled: boolean): void {
    this.clusteringEnabled = enabled;
  }
  
  /**
   * Configura la distancia de clustering
   */
  setClusterDistance(distance: number): void {
    this.clusterDistance = distance;
  }
  
  /**
   * Configurar límite de elementos a renderizar por frame
   */
  setMaxElementsPerFrame(maxElements: number): void {
    this.maxElementsPerFrame = maxElements;
  }
} 