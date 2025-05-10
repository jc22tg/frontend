# Widgets del Diseño de Red

Esta carpeta contiene todos los componentes widget utilizados en la aplicación de diseño de red. Los widgets están organizados por categorías funcionales.

## Estructura de Carpetas

```
widgets/
├── container/               # Contenedor principal de widgets
│   └── map-widgets-container/
├── connectivity/           # Widgets relacionados con la conectividad
│   └── connection-status-widget/
├── element-related/        # Widgets relacionados con elementos de red
├── map-related/            # Widgets relacionados con el mapa
│   └── mini-map-widget/
├── monitoring/             # Widgets de monitorización
│   ├── alert-management-widget/
│   ├── network-health-widget/
│   └── network-metrics-widget/
└── search/                 # Widgets de búsqueda
    └── element-search-widget/
```

## Categorías

### Container
Componentes contenedores que gestionan la distribución de múltiples widgets.

### Connectivity
Widgets relacionados con las conexiones entre elementos de red.

### Element-related
Widgets que muestran o permiten manipular elementos de red individuales.

### Map-related
Widgets que proporcionan funcionalidades o visualizaciones relacionadas con el mapa.

### Monitoring
Widgets que muestran estadísticas, métricas o estados de la red.

### Search
Widgets para buscar y filtrar elementos en la red.

## Uso

Para importar todos los widgets en un componente, puedes utilizar el archivo barrel index.ts:

```typescript
import * as Widgets from '../../components/widgets';
```

O bien, puedes importar categorías específicas:

```typescript
import { MiniMapWidgetComponent } from '../../components/widgets/map-related';
import { NetworkHealthWidgetComponent } from '../../components/widgets/monitoring';
```

## Creación de Nuevos Widgets

Al crear un nuevo widget, sigue estas pautas:

1. Ubícalo en la carpeta correspondiente según su función
2. Exporta el componente en el archivo index.ts de su categoría
3. Sigue el patrón de nomenclatura: `[nombre]-widget`
4. Implementa la interfaz estándar de widgets 