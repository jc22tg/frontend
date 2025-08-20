# ================================================================
# SCRIPT PARA ELIMINAR SINCRONIZACIÓN PROBLEMÁTICA
# ================================================================
# Elimina todas las definiciones generadas y deja solo lo que el frontend necesita

Write-Host "=== LIMPIANDO SINCRONIZACIÓN PROBLEMÁTICA ===" -ForegroundColor Cyan

# 1. Eliminar completamente el directorio generated
$generatedPath = ".\src\generated"
if (Test-Path $generatedPath) {
    Write-Host "Eliminando directorio generated completo..." -ForegroundColor Yellow
    Remove-Item $generatedPath -Recurse -Force
    Write-Host "✓ Directorio generated eliminado" -ForegroundColor Green
}

# 2. Verificar que el frontend use solo sus propios tipos
$frontendTypesPath = ".\src\app\shared\types"
if (Test-Path $frontendTypesPath) {
    Write-Host "✓ Frontend usa sus propios tipos en: $frontendTypesPath" -ForegroundColor Green
    Get-ChildItem $frontendTypesPath -Filter "*.ts" | ForEach-Object {
        Write-Host "  - $($_.Name)" -ForegroundColor Gray
    }
} else {
    Write-Host "❌ No se encontraron tipos del frontend" -ForegroundColor Red
}

# 3. Crear archivo de configuración para evitar futuras sincronizaciones
$noSyncFile = ".\NO-SYNC-COMMON-DEFINITIONS.md"
$noSyncContent = @"
# NO SINCRONIZAR COMMON-DEFINITIONS

## ❌ PROBLEMA IDENTIFICADO

El frontend Angular tiene su propia arquitectura de tipos y no debe sincronizar automáticamente desde common-definitions del backend porque:

1. **Diferentes propósitos**: 
   - Backend: Entidades TypeORM con decoradores @ApiProperty
   - Frontend: Interfaces TypeScript simples

2. **Conflictos de decoradores**:
   - @ApiProperty no existe en Angular
   - class-validator es innecesario en frontend

3. **Arquitectura diferente**:
   - Frontend usa tipos en src/app/shared/types/
   - Backend usa common-definitions/

## ✅ SOLUCIÓN IMPLEMENTADA

**Frontend mantiene sus propios tipos:**
- `src/app/shared/types/network.types.ts`
- `src/app/shared/types/geographic-position.ts`
- `src/app/shared/types/common-definitions.d.ts`

**Backend mantiene common-definitions:**
- `backend/src/shared/common-definitions/`

## 🔄 SINCRONIZACIÓN MANUAL

Si necesitas sincronizar un tipo específico:
1. Copia SOLO la interface (sin decoradores)
2. Adapta para frontend (sin @ApiProperty, etc.)
3. Coloca en src/app/shared/types/

## 🚫 NO EJECUTAR

- NO ejecutar sync-definitions.ps1
- NO copiar archivos automáticamente
- NO usar generated/ directory
"@

Set-Content -Path $noSyncFile -Value $noSyncContent -Encoding UTF8
Write-Host "✓ Creado archivo de documentación: $noSyncFile" -ForegroundColor Green

# 4. Modificar package.json para remover scripts problemáticos
$packageJsonPath = ".\package.json"
if (Test-Path $packageJsonPath) {
    Write-Host "Actualizando package.json..." -ForegroundColor Yellow
    
    $packageContent = Get-Content $packageJsonPath | ConvertFrom-Json
    
    # Remover scripts problemáticos
    if ($packageContent.scripts."sync-definitions") {
        $packageContent.scripts.PSObject.Properties.Remove("sync-definitions")
        Write-Host "✓ Removido script sync-definitions" -ForegroundColor Green
    }
    
    # Remover dependencias de common-definitions si existen
    if ($packageContent.dependencies."@network-map/common-definitions") {
        $packageContent.dependencies.PSObject.Properties.Remove("@network-map/common-definitions")
        Write-Host "✓ Removida dependencia @network-map/common-definitions" -ForegroundColor Green
    }
    
    $packageContent | ConvertTo-Json -Depth 10 | Set-Content $packageJsonPath -Encoding UTF8
}

# 5. Listar tipos actuales del frontend
Write-Host "`n=== TIPOS ACTUALES DEL FRONTEND ===" -ForegroundColor Cyan
Get-ChildItem $frontendTypesPath -Filter "*.ts" -Recurse | ForEach-Object {
    $relativePath = $_.FullName.Replace((Get-Location).Path, ".")
    Write-Host "✓ $relativePath" -ForegroundColor Green
}

Write-Host "`n=== LIMPIEZA COMPLETADA ===" -ForegroundColor Green
Write-Host "El frontend ahora usa solo sus propios tipos definidos." -ForegroundColor Green
Write-Host "NO sincronizar common-definitions en el futuro." -ForegroundColor Yellow
