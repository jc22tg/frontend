# Diagramas de Interacción entre Componentes

## Diagrama 1: Interacción Principal de Componentes

```
+---------------------+     +---------------------+     +---------------------+
|  NetworkToolbar     |---->|    NetworkMap       |---->| ElementDetails      |
+---------------------+     +---------------------+     +---------------------+
         |                         ^   |                         |
         |                         |   |                         |
         v                         |   v                         v
+---------------------+     +---------------------+     +---------------------+
|  ElementCreator     |---->|  ElementEditor      |---->| ElementHistory      |
+---------------------+     +---------------------+     +---------------------+
                                    ^   |
                                    |   |
                                    |   v
+---------------------+     +---------------------+     +---------------------+
| MapPositionDialog   |<----|ConnectionEditor     |---->|ElementCompatibility |
+---------------------+     +---------------------+     +---------------------+
```

## Diagrama 2: Flujo de Datos entre Componentes

```
+-------------------+    +-------------------+    +-------------------+
| UI Components     |    | Facades           |    | Services          |
+-------------------+    +-------------------+    +-------------------+
| NetworkMap        |--->| NetworkFacade     |--->| ElementService    |
| NetworkToolbar    |    |                   |    | MapService        |
| ElementEditor     |--->|                   |--->| MonitoringService |
| ConnectionEditor  |    |                   |    | ConnectionService |
+-------------------+    +-------------------+    +-------------------+
         |                        |                        |
         v                        v                        v
+-------------------+    +-------------------+    +-------------------+
| Widget Components |    | State Management  |    | API Communication |
+-------------------+    +-------------------+    +-------------------+
| StatusWidget      |<---| Store             |<---| Repositories      |
| MetricsWidget     |    | Effects           |    | HTTP Clients      |
| HealthWidget      |<---|                   |<---| WebSocket         |
| AlertWidget       |    |                   |    | Real-time Updates |
+-------------------+    +-------------------+    +-------------------+
```

## Diagrama 3: Jerarquía de Componentes

```
NetworkDesignComponent
├── NetworkDesignLayout
│   ├── NavigationSidebar
│   └── ContentArea
│       ├── MapContainer
│       │   ├── NetworkMap
│       │   │   ├── LayerManager
│       │   │   ├── ElementCreator
│       │   │   ├── ConnectionCreator
│       │   │   └── MapMenu
│       │   └── NetworkToolbar
│       └── SidePanels
│           ├── ElementDetails
│           │   └── ElementDetailRow(s)
│           ├── ElementQuickView
│           └── SearchResults
│               └── ElementDetailRow(s)
└── Dialogs
    ├── ElementEditor
    ├── ConnectionEditor
    ├── MapPositionDialog
    ├── BatchElementEditor
    └── HelpDialog
```

## Diagrama 4: Flujos de Eventos

```
[Usuario] --> (Clic en elemento) --> [NetworkMap]
                                       |
                                       v
[ElementQuickView] <-- (Emite selección) --> [ElementDetails]
        |                                           |
        v                                           v
(Clic en "Editar") ----> [ElementEditor] <---- (Clic en "Editar")
        |                       |
        |                       v
        |               (Guarda cambios)
        |                       |
        v                       v
[NetworkMap] <------- (Actualización de UI) <-- [Servicios]
```

## Diagrama 5: Ciclo de Vida de Elementos

```
+-------------+     +-------------+     +-------------+     +-------------+
| Creación    |---->| Monitoreo   |---->| Edición     |---->| Historial   |
+-------------+     +-------------+     +-------------+     +-------------+
      |                   |                   |                   |
      v                   v                   v                   v
+-------------+     +-------------+     +-------------+     +-------------+
|ElementCreator|     |StatusWidgets|     |ElementEditor|     |ElementHistory|
|MapPosition   |     |HealthWidgets|     |BatchEditor  |     |              |
|ElementEditor |     |AlertWidgets |     |QuickActions |     |              |
+-------------+     +-------------+     +-------------+     +-------------+
```

## Diagrama 6: Interacción con Servicios

```
+------------------+        +------------------+         +------------------+
| Components       |        | Facades          |         | Services         |
+------------------+        +------------------+         +------------------+
| NetworkMap       |------->| NetworkFacade    |-------->| ElementService   |
| ElementEditor    |<-------|                  |<--------|                  |
+------------------+        +------------------+         +------------------+
                                    |                             |
                                    v                             v
+------------------+        +------------------+         +------------------+
| State Components |        | Effects          |         | API              |
+------------------+        +------------------+         +------------------+
| AlertWidgets     |<-------|                  |<--------|                  |
| StatusWidgets    |        |                  |         |                  |
+------------------+        +------------------+         +------------------+
```

## Diagrama 7: Flujo de Monitoreo

```
MonitoringService ---> StatusWidget ---> (Alerta detectada) ---> AlertWidget
       |                                                              |
       v                                                              v
NetworkMap <---------- (Filtrado automático) <------ (Clic en alerta)
   |
   v
(Elementos problemáticos destacados)
   |
   v
ElementDetails <--- (Clic en elemento) <--- Usuario
   |
   v
(Acciones correctivas)
```

## Diagrama 8: Patrón de Comunicación Observable

```
+------------+        +------------+        +------------+
| Component  |        | Facade     |        | Service    |
+------------+        +------------+        +------------+
| NetworkMap |        | Network    |        | Element    |
|            |------->| Facade     |------->| Service    |
|            |        |            |        |            |
+------------+        +------------+        +------------+
      ^                    |                     |
      |                    v                     v
+------------+        +------------+        +------------+
| Component  |        | Store      |        | Repository |
+------------+        +------------+        +------------+
| Widget     |<-------| State      |<-------| API Client |
|            |        | Management |        |            |
+------------+        +------------+        +------------+
```

## Diagrama 9: Interacción de Usuario con Mapa

```
+-------------+        +--------------+        +-------------+
| Acción      |        | Evento       |        | Componente  |
+-------------+        +--------------+        +-------------+
| Clic        |------->| Selección    |------->| NetworkMap  |
| Arrastre    |------->| Movimiento   |------->|             |
| Doble Clic  |------->| Creación     |------->|             |
+-------------+        +--------------+        +-------------+
                              |
                              v
+-------------+        +--------------+        +-------------+
| Subcomponente|        | Acción       |        | Resultado   |
+-------------+        +--------------+        +-------------+
| ElementCreat|<-------|Mostrar editor|------->| Nuevo elem. |
| MapMenu     |<-------|Mostrar menú  |------->| Acciones    |
| QuickView   |<-------|Mostrar info  |------->| Información |
+-------------+        +--------------+        +-------------+
```

## Diagrama 10: Ciclo de Actualización de Componentes

```
  +--------------------------------------+
  |            NetworkFacade             |
  +--------------------------------------+
          ^                     |
          |                     v
+-----------------+    +-----------------+
| Acciones        |    | Actualizaciones |
| del usuario     |    | de estado       |
+-----------------+    +-----------------+
          ^                     |
          |                     v
+-------------------------------------------+
|              Componentes UI               |
| NetworkMap, Widgets, Editors, Dialogs     |
+-------------------------------------------+
          ^                     |
          |                     v
+------------------+   +------------------+
| Input Usuario    |   | Renderizado UI   |
+------------------+   +------------------+
``` 