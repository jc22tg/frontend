# NO SINCRONIZAR COMMON-DEFINITIONS

ESTE FRONTEND NO DEBE SINCRONIZAR CON COMMON-DEFINITIONS

El frontend Angular tiene su propia arquitectura de tipos y no debe sincronizar automáticamente desde common-definitions del backend porque:

1. **Diferentes propósitos**:
   - Backend: Entidades TypeORM con decoradores @ApiProperty
   - Frontend: Interfaces TypeScript simples

2. **Conflictos de decoradores**:
   - @ApiProperty causa errores en compilación Angular
   - class-validator no es compatible con componentes Angular

3. **Arquitecturas independientes**:
   - Backend usa common-definitions/
   - Frontend usa src/app/shared/types/

## Frontend mantiene tipos independientes:
- `src/app/shared/types/network.types.ts`
- `src/app/shared/types/geographic-position.ts`
- `src/app/shared/types/network-elements.ts`
- `src/app/shared/types/unified-network-types.ts`
- Y otros archivos de tipos específicos

## Backend mantiene common-definitions:
- `backend/src/shared/common-definitions/`

## REGLAS IMPORTANTES:

❌ **NO EJECUTAR**:
- sync-definitions.ps1
- Scripts de sincronización automática
- Comandos que copien desde backend/common-definitions

❌ **NO USAR**:
- Directorio src/generated/
- Dependencias de @network-map/common-definitions

✅ **SÍ HACER**:
- Crear tipos manualmente en src/app/shared/types/
- Mantener interfaces TypeScript simples
- Usar tipos optimizados para Angular

**Status: FRONTEND INDEPENDIENTE - SINCRONIZACIÓN DESHABILITADA**

Fecha de implementación: 13 Enero 2025
Arquitectura validada: ✅ Compilación exitosa en 25-31 segundos
