# ================================================================
# SOLUCIÓN API-FIRST: Generación Automática de Types Frontend
# ================================================================

## CONCEPTO
Generar automáticamente los tipos TypeScript del frontend desde el backend NestJS usando OpenAPI/Swagger.

## VENTAJAS
✅ Single Source of Truth (backend define todo)
✅ Tipos siempre sincronizados con API
✅ Generación automática
✅ No duplicación de código
✅ Integración con CI/CD

## IMPLEMENTACIÓN

### 1. Configurar Swagger en Backend
```typescript
// backend/src/main.ts
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

const config = new DocumentBuilder()
  .setTitle('Network Map API')
  .setDescription('API para gestión de redes de fibra óptica')
  .setVersion('1.0')
  .addBearerAuth()
  .build();
  
const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('api/docs', app, document);

// Exportar esquema JSON
await writeFileSync('./openapi-spec.json', JSON.stringify(document));
```

### 2. Script de Generación
```bash
# frontend/generate-types.ps1
npx @openapitools/openapi-generator-cli generate `
  -i ../backend/openapi-spec.json `
  -g typescript-angular `
  -o src/generated-api `
  --additional-properties=npmName=network-map-api
```

### 3. Integración en Frontend
```typescript
// frontend/src/app/services/api.service.ts
import { Injectable } from '@angular/core';
import { AuthApi, NetworkElementApi } from '../generated-api';

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(
    private authApi: AuthApi,
    private networkApi: NetworkElementApi
  ) {}
}
```

## FLUJO DE TRABAJO
1. Desarrollador modifica backend
2. Script regenera tipos automáticamente
3. Frontend usa tipos actualizados
4. Error de compilación si hay incompatibilidades

## IMPLEMENTACIÓN GRADUAL
1. ✅ Configurar Swagger en backend
2. ✅ Generar primera versión de tipos
3. ✅ Migrar servicios frontend gradualmente
4. ✅ Automatizar en pipeline CI/CD
