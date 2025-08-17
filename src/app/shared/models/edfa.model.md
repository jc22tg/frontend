# Implementación y Alineación del Módulo EDFA (Backend-Frontend)

Este documento resume los pasos realizados para implementar y alinear la gestión de elementos EDFA (Erbium Doped Fiber Amplifier) entre el backend y el frontend de la aplicación.

## 1. Backend (`network-map/backend`)

### 1.1. Estructura del Módulo EDFA (`src/network/edfa/`)

*   **Controlador (`controllers/edfa.controller.ts`):**
    *   Expone endpoints RESTful para operaciones CRUD sobre EDFAs.
    *   Endpoints adicionales para configurar longitudes de onda, obtener datos de monitoreo, estadísticas de rendimiento y recomendaciones.
    *   Ruta base: `/edfas`.
    *   Protegido con `JwtAuthGuard`.
*   **Servicios:**
    *   `services/edfa.service.ts`: Lógica de negocio principal para CRUD de `EdfaEntity`. Emite eventos para creación, actualización y eliminación.
    *   `services/edfa-wavelength.service.ts`: Lógica para validar configuraciones de longitud de onda, calcular métricas de rendimiento (SNR, OSNR, etc.) y generar recomendaciones de optimización.
    *   `services/edfa-monitoring.service.ts`: Maneja el registro de datos de monitoreo (actualmente en memoria), la verificación y emisión de alarmas, y la obtención de historial y estadísticas de rendimiento.
*   **DTOs (`dtos/`):**
    *   `edfa-response.dto.ts`: Define `EdfaResponseDto` para estandarizar los datos de EDFA devueltos por el controlador.
    *   `wavelength-config.dto.ts`: Define `WavelengthConfigDto` para la configuración de longitudes de onda (usado tanto para entrada como en `EdfaResponseDto`).
    *   `monitoring-response.dto.ts`: Define `MonitoringResponseDto` para la estructura de los datos de monitoreo.
    *   DTOs para creación y actualización (`CreateEdfaDto`, `UpdateEdfaDto`) se referencian desde `src/network/dtos-new/edfa.dto`.
*   **Entidad (`src/network/entities/edfa.entity.ts`):**
    *   `EdfaEntity` define la estructura de datos de un EDFA en la base de datos, incluyendo propiedades como `code`, `name`, `position` (GeoJSON Point), `status`, configuraciones de longitud de onda, parámetros ópticos, etc.
*   **Módulo (`edfa.module.ts`):**
    *   Ensambla el controlador, los servicios y la entidad `EdfaEntity` (importada de TypeORM).
    *   Importa `EventEmitterModule` para la comunicación basada en eventos.

### 1.2. Alineación de DTOs y Servicios en Backend

1.  **`EdfaResponseDto` Creado:**
    *   Se definió `EdfaResponseDto` en `backend/src/network/edfa/dtos/edfa-response.dto.ts` para estandarizar las respuestas del API para los EDFAs. Este DTO incluye campos relevantes de `EdfaEntity` y usa `WavelengthConfigDto` para las configuraciones de longitud de onda.
2.  **Actualización de `EdfaController`:**
    *   Los métodos CRUD en `EdfaController` (`findAll`, `findById`, `create`, `update`) fueron actualizados para usar `EdfaResponseDto` (o `PaginatedResponse<EdfaResponseDto>`) en sus tipos de retorno y decoradores `@ApiResponse`.
3.  **Actualización de `EdfaService`:**
    *   Los métodos CRUD correspondientes en `EdfaService` fueron modificados para devolver `EdfaResponseDto` (o `PaginatedResponse<EdfaResponseDto>`).
    *   Se implementaron funciones de mapeo (`mapEntityToDto`, `mapEntitiesToDtos`) dentro del servicio para convertir `EdfaEntity` a `EdfaResponseDto`.

## 2. Frontend (`network-map/frontend`)

### 2.1. Modelos de Datos (`src/app/shared/models/`)

1.  **`wavelength-config.model.ts` Creado:**
    *   Se definió la interfaz `WavelengthConfig` para el frontend, alineada con `WavelengthConfigDto` del backend.
    *   Campos: `wavelength`, `inputPowerDbm`, `outputPowerDbm`, `gainDb`, `noiseFactorDb`.
2.  **`edfa.model.ts` Creado:**
    *   Se definió la interfaz `EDFA` para el frontend, alineada con `EdfaResponseDto` del backend.
    *   Importa y utiliza la interfaz `WavelengthConfig` local.
    *   Utiliza `GeographicPosition` (de `src/app/shared/types/geo-position.ts`) para la propiedad `position`.
        *   **Nota:** Esto requiere una transformación en el servicio del frontend al recibir datos del backend, ya que el backend envía `position` como un `Point` GeoJSON.
    *   Incluye todos los campos relevantes de `EdfaResponseDto`.

### 2.2. Tipos y Enums Compartidos (`src/app/shared/types/`)

1.  **`network.types.ts` Actualizado:**
    *   Se añadieron los siguientes enums, asegurando consistencia con `backend/src/shared/enums/network.enums.ts`:
        *   `PortStatus`
        *   `WavelengthType`
        *   `AmplifierType`
        *   `NetworkHierarchy`
    *   Se verificó que `ElementType` y `ElementStatus` fueran compatibles con las necesidades del módulo EDFA.
2.  **`geo-position.ts`:**
    *   Define `GeographicPosition` que se utiliza en el modelo `EDFA` del frontend. Se requiere una transformación desde el `Point` GeoJSON del backend.

### 2.3. Adaptación de Servicios y Componentes

1.  **`ElementService` (`src/app/features/network-design/services/element.service.ts`):**
    *   Se actualizó la importación de la interfaz `EDFA` para que apunte al nuevo modelo en `src/app/shared/models/edfa.model.ts` en lugar de la definición local en `element.interface.ts`.
    *   El type guard `isEDFA` fue ajustado para usar la nueva interfaz `EDFA`.
2.  **`IElementService` (`src/app/features/network-design/interfaces/element.interface.ts`):**
    *   Se actualizó la firma del método `isEDFA` para que el type guard utilice la interfaz `EDFA` correcta de `src/app/shared/models/edfa.model.ts` (usando un alias `SharedEDFA`).
    *   Se eliminó la definición duplicada y obsoleta de la interfaz `EDFA` de este archivo.

## 3. Puntos Pendientes y Consideraciones

*   **Transformación de `Point` a `GeographicPosition` en el Frontend:** El servicio del frontend que consume los datos de EDFA del backend debe implementar la lógica para convertir el campo `position` (que llega como `Point` GeoJSON) al tipo `GeographicPosition` utilizado en el modelo `EDFA` del frontend.
*   **Adaptación de Componentes del Frontend:** Los componentes que muestran o interactúan con datos de EDFA deben ser actualizados para utilizar la nueva interfaz `EDFA` y `WavelengthConfig`, y los enums correspondientes. Esto incluye el manejo de la nueva estructura de datos en plantillas HTML y lógica de componentes.
*   **Consistencia de `WavelengthConfig` en Backend:** En el backend, `EdfaEntity` define una clase `WavelengthConfig` anidada. Se debe asegurar que esta estructura sea totalmente compatible o se mapee correctamente a `WavelengthConfigDto` dentro de `EdfaService` para evitar problemas al convertir a `EdfaResponseDto.wavelengthConfigs`. El uso de `as any` en el mapeo actual de `wavelengthConfigs` en `EdfaService` es una solución temporal.
*   **Persistencia de Datos de Monitoreo:** `EdfaMonitoringService` en el backend actualmente guarda el historial de monitoreo en memoria. Para producción, se recomienda una solución de persistencia (base de datos, sistema de series temporales).
*   **Endpoint `GET /:id/performance`:** Este endpoint en `EdfaController` está marcado como pendiente de implementación.

Este proceso de alineación asegura que el backend y el frontend tengan una comprensión clara y consistente de la estructura de datos para los EDFAs, facilitando el desarrollo y reduciendo errores.

Ejemplo de transformación en el servicio (conceptual):
Si tuvieras un método en ElementService como getEdfaById(id: string): Observable<EDFA>:

// En ElementService.ts o un servicio similar
import { map } from 'rxjs/operators';
import { Point } from 'geojson'; // Para tipar la respuesta del backend antes de mapear
import { GeographicPosition, fromLatLng /* o una nueva función de transformación */ } from '../../../shared/types/geo-position';

// ...

getEdfaById(id: string): Observable<EDFA> {
  // Asumiendo que el endpoint devuelve algo compatible con EdfaResponseDto
  return this.http.get<any /* O un tipo intermedio que tenga position: Point */>(`${this.edfaApiUrl}/${id}`)
    .pipe(
      map(backendEdfa => {
        // Transformar la posición
        let frontendPosition: GeographicPosition;
        if (backendEdfa.position && backendEdfa.position.type === 'Point' && backendEdfa.position.coordinates) {
          frontendPosition = fromLatLng({ // O una función geoJsonPointToGeographicPosition
            lng: backendEdfa.position.coordinates[0],
            lat: backendEdfa.position.coordinates[1]
          });
          if (backendEdfa.position.coordinates.length > 2) {
            frontendPosition.altitude = backendEdfa.position.coordinates[2];
          }
        } else {
          // Manejar el caso donde la posición no viene como se espera o es nula
          frontendPosition = { lat: 0, lng: 0 }; // O undefined, o lanzar error
        }

        return {
          ...backendEdfa, // Resto de las propiedades del backendEdfa
          position: frontendPosition // La propiedad 'position' transformada
        } as EDFA; // Asegurarse de que el objeto final cumpla con la interfaz EDFA
      }),
      catchError(this.handleError<EDFA>(`getEdfaById id=${id}`))
    );
}

// ...