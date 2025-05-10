# Optimización de Rendimiento para Mapa de Red

Este documento describe las optimizaciones de rendimiento implementadas para manejar grandes volúmenes de elementos en el mapa de red.

## Características Implementadas

### 1. Renderizado WebGL con Three.js

Se ha implementado un nuevo servicio de renderizado usando WebGL a través de Three.js para reemplazar el renderizado basado en SVG/D3 cuando hay muchos elementos:

- **MapWebglRendererService**: Servicio que implementa la interfaz `IMapRenderService` usando Three.js
- Características:
  - Uso de geometrías y materiales optimizados
  - Renderizado en GPU para mejor rendimiento
  - Sistema de etiquetas HTML sobrepuestas para minimizar el impacto en rendimiento
  - Compatibilidad con modos claro/oscuro

### 2. Clustering Dinámico de Elementos

Se ha implementado un sistema de clustering que agrupa elementos cercanos cuando hay muchos en pantalla:

- **ElementClusteringService**: Servicio que maneja la agrupación dinámica de elementos
- Características:
  - Clustering basado en distancia
  - Agrupación dinámica dependiente del nivel de zoom
  - Visualización del número de elementos en cada cluster
  - Optimización para reducir recálculos innecesarios con sistema de caché

### 3. Carga Progresiva de Elementos

Se ha implementado un sistema de carga progresiva que solo carga y renderiza los elementos visibles en el viewport actual:

- **MapLoaderService**: Servicio que gestiona qué elementos cargar basado en la vista actual
- Características:
  - Carga solo elementos visibles en el viewport actual
  - Precarga de elementos en áreas cercanas al viewport
  - Sistema de métricas para monitorear elementos cargados/visibles
  - Carga en fragmentos para evitar bloqueos del hilo principal

## Cómo Funciona

### Flujo de Renderizado WebGL

1. Se inicializa un renderizador Three.js que crea un canvas WebGL
2. Los elementos de red se convierten a objetos 3D (círculos para nodos, líneas para conexiones)
3. Se establecen colores y estilos basados en las propiedades de los elementos
4. El renderizado se ejecuta en un bucle continuo usando `requestAnimationFrame`
5. Las etiquetas de texto se renderizan como elementos HTML posicionados sobre sus nodos correspondientes

### Funcionamiento del Clustering

1. Cuando hay muchos elementos y el usuario está en un nivel de zoom bajo:
   - Se calcula la distancia entre elementos cercanos
   - Los elementos que están a menos de X unidades se agrupan en un cluster
   - Se muestra un único nodo por cluster con el conteo de elementos
   - Las conexiones entre clusters se simplifican a una única conexión

2. Al hacer zoom:
   - Los clusters se desagregan progresivamente
   - Se muestran elementos individuales cuando el zoom supera el umbral configurado

### Carga Progresiva

1. Se mantiene un registro de todos los elementos en memoria
2. Cuando el usuario navega o hace zoom:
   - Se calculan los límites visibles del viewport
   - Solo se renderizan los elementos dentro de esos límites más un margen
   - Se priorizan elementos importantes o seleccionados

## Configuración

Las optimizaciones pueden habilitarse/deshabilitarse mediante controles en la interfaz de usuario:

- **WebGL**: Activa/desactiva el renderizado WebGL
- **Clustering**: Activa/desactiva la agrupación dinámica de elementos
- **Carga Progresiva**: Activa/desactiva la carga bajo demanda

## Métricas de Rendimiento

El sistema muestra métricas en tiempo real:

- **FPS**: Cuadros por segundo actuales
- **Elementos Totales**: Número total de elementos en el mapa
- **Elementos Visibles**: Número de elementos actualmente renderizados
- **Memoria**: Uso aproximado de memoria para la visualización

## Requisitos del Sistema

- Navegador con soporte para WebGL (la mayoría de navegadores modernos)
- Para volúmenes muy grandes (>10,000 elementos), se recomienda:
  - 8GB+ RAM
  - Tarjeta gráfica dedicada o integrada reciente
  - Procesador multi-núcleo

## Limitaciones Conocidas

- El renderizado WebGL no soporta todos los efectos visuales disponibles en SVG
- La interacción con clusters puede ser menos precisa que con elementos individuales
- En dispositivos de gama muy baja, puede haber latencia al interactuar con clusters grandes

## Trabajo Futuro

- Implementar sistema de LOD (Level of Detail) para simplificar geometrías a distancia
- Añadir worker threads para cálculos de clustering en segundo plano
- Implementar técnicas de culling más avanzadas para grandes volúmenes de datos
- Optimizar la interacción y selección en modo WebGL 