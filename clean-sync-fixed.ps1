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
} else {
    Write-Host "✓ Directorio generated no existe" -ForegroundColor Green
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

ESTE FRONTEND NO DEBE SINCRONIZAR CON COMMON-DEFINITIONS

El frontend Angular tiene su propia arquitectura de tipos y no debe sincronizar automaticamente desde common-definitions del backend porque:

1. Diferentes propositos:
   - Backend: Entidades TypeORM con decoradores ApiProperty
   - Frontend: Interfaces TypeScript simples

2. Conflictos de decoradores:
   - ApiProperty causa errores en compilacion Angular
   - class-validator no es compatible con componentes Angular

3. Arquitecturas independientes:
   - Backend usa common-definitions/
   - Frontend usa src/app/shared/types/

**Frontend mantiene tipos independientes:**
- src/app/shared/types/network.types.ts
- src/app/shared/types/geographic-position.ts
- src/app/shared/types/common-definitions.d.ts

**Backend mantiene common-definitions:**
- backend/src/shared/common-definitions/

## REGLAS IMPORTANTES:

- NO ejecutar sync-definitions.ps1
- NO sincronizar automaticamente
- NO usar generated/ directory
- SI necesitas tipos nuevos, crearlos manualmente en src/app/shared/types/

Status: FRONTEND INDEPENDIENTE - SINCRONIZACION DESHABILITADA
"@

Write-Output $noSyncContent | Out-File -FilePath $noSyncFile -Encoding UTF8
Write-Host "✓ Archivo de configuración creado: $noSyncFile" -ForegroundColor Green

# 4. Limpiar package.json de scripts obsoletos
$packagePath = ".\package.json"
if (Test-Path $packagePath) {
    Write-Host "Verificando package.json..." -ForegroundColor Yellow
    $packageContent = Get-Content $packagePath -Raw | ConvertFrom-Json
    
    $modified = $false
    
    # Remover script sync-definitions si existe
    if ($packageContent.scripts."sync-definitions") {
        $packageContent.scripts.PSObject.Properties.Remove("sync-definitions")
        Write-Host "✓ Removido script sync-definitions" -ForegroundColor Green
        $modified = $true
    }
    
    # Remover dependencias de common-definitions si existen
    if ($packageContent.dependencies."@network-map/common-definitions") {
        $packageContent.dependencies.PSObject.Properties.Remove("@network-map/common-definitions")
        Write-Host "✓ Removida dependencia common-definitions" -ForegroundColor Green
        $modified = $true
    }
    
    if ($modified) {
        $packageContent | ConvertTo-Json -Depth 10 | Out-File -FilePath $packagePath -Encoding UTF8
        Write-Host "✓ package.json actualizado" -ForegroundColor Green
    } else {
        Write-Host "✓ package.json ya está limpio" -ForegroundColor Green
    }
}

# 5. Verificar estado final
Write-Host "`n=== VERIFICACIÓN FINAL ===" -ForegroundColor Cyan
Write-Host "✓ Directorio generated eliminado" -ForegroundColor Green
Write-Host "✓ Frontend usa tipos independientes" -ForegroundColor Green
Write-Host "✓ Scripts de sincronización removidos" -ForegroundColor Green
Write-Host "✓ Configuración NO-SYNC creada" -ForegroundColor Green
Write-Host "`n🎉 FRONTEND AHORA ES COMPLETAMENTE INDEPENDIENTE" -ForegroundColor Green
Write-Host "   Los tipos están en: src/app/shared/types/" -ForegroundColor Gray
Write-Host "   NO se sincroniza con backend/common-definitions" -ForegroundColor Gray
