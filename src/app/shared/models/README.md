# Modelos Extendidos para Elementos de Red

Este directorio contiene modelos, interfaces y tipos que definen la estructura de los elementos de la red de fibra óptica, siguiendo estándares y buenas prácticas de la industria.

## Estructura de modelos extendidos

Se han implementado modelos extendidos para los principales elementos de la red FTTH/PON:

### Interfaces Base

- `ExtendedNetworkElement`: Interfaz base mejorada con todos los campos comunes para cualquier elemento de red
- `Certification`: Certificaciones de elementos (OTDR, Power Meter, etc.)
- `AuditEntry`: Historial de cambios para auditoría
- `ExtendedAttachment`: Archivos adjuntos mejorados (fotos, documentación, etc.)

### Tipos y Enumeraciones Extendidas

- `ExtendedConnectorType`: Tipos de conectores (SC, LC, SC/APC, etc.)
- `ExtendedFiberType`: Tipos de fibra según estándares ITU-T (G.652.D, G.657.A1, etc.)
- `ExtendedSplitterType`: Tipos de divisores ópticos (PLC, FBT, etc.)
- `ExtendedCableType`: Tipos de cables detallados
- `SpliceMethodType`: Métodos de empalme de fibra

### Elementos de Red Principales

- `ExtendedSite`: Sitio o nodo central, con especificaciones detalladas para energía, refrigeración, seguridad, etc.
- `ExtendedRack`: Rack mejorado con gestión de U, energía, refrigeración y elementos montados
- `ExtendedOLT`: Terminal de línea óptica con detalles de potencia óptica, gestión, seguridad, etc.
- `ExtendedFDP`: Punto de distribución de fibra con jerarquía, protección ambiental, conexiones, etc.
- `ExtendedManga`: Caja de empalme mejorada con bandejas, ordenamiento de fibras, sellado, etc.

## Compatibilidad con Estándares

Los modelos están diseñados en concordancia con:

- **ITU-T G.984**: Estándar GPON
- **ITU-T G.9807**: Estándar XGS-PON
- **ITU-T G.989**: Estándar NG-PON2
- **ITU-T G.652.D/G.657**: Estándares para fibras ópticas monomodo
- **TIA-568**: Estándares de cableado 
- **TIA-606-C**: Estándares de etiquetado y administración
- **IEC 61280-4**: Estándares para pruebas de fibra óptica

## Relaciones entre Elementos

Los elementos tienen relaciones jerárquicas y de conexión que permiten modelar completamente una red PON:

```
SITE (Sitio)
 ├── RACK (Bastidor)
 │    ├── OLT (Terminal de Línea Óptica)
 │    ├── ODF (Distribuidor de Fibra Óptica)
 │    └── Equipos adicionales
 ├── MANGA (Cajas de Empalme)
 └── FDP (Puntos de Distribución)
      └── Splitters (Divisores Ópticos)
           └── ONT (Terminales de Red)
```

## Uso de los Modelos

Para utilizar estos modelos extendidos en los componentes:

```typescript
import { 
  ExtendedNetworkElement, 
  ExtendedSite,
  ExtendedOLT,
  ExtendedFDP,
  ExtendedManga 
} from '@shared/types';

// Ejemplo de elemento de tipo OLT extendido
const oltElement: ExtendedOLT = {
  id: '123',
  code: 'OLT-001',
  name: 'OLT Central',
  type: ElementType.OLT,
  status: ElementStatus.ACTIVE,
  // ...otros campos específicos
};
```

## Ventajas

- **Compatibilidad con estándares**: Conforme a mejores prácticas y normas internacionales
- **Detalle técnico**: Incluye parámetros clave para el despliegue y mantenimiento real
- **Soporte para mediciones**: Estructura para almacenar pruebas OTDR, potencia óptica, etc.
- **Flexibilidad**: Permite modelar diferentes arquitecturas y topologías PON
- **Trazabilidad**: Soporte para auditoría de cambios e historial de intervenciones 