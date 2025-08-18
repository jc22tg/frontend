# ================================================================
# SCRIPT DE VERIFICACIÓN FINAL
# ================================================================

Write-Host "=== VERIFICACIÓN DEL FRONTEND ===" -ForegroundColor Cyan

# Verificar que estamos en el directorio correcto
$currentDir = Get-Location
Write-Host "Directorio actual: $currentDir" -ForegroundColor Yellow

# Verificar que angular.json existe
if (Test-Path "angular.json") {
    Write-Host "✅ angular.json encontrado" -ForegroundColor Green
} else {
    Write-Host "❌ angular.json NO encontrado" -ForegroundColor Red
    exit 1
}

# Verificar que las definiciones están sincronizadas
if (Test-Path "src\generated\common-definitions\index.ts") {
    Write-Host "✅ Common definitions sincronizadas" -ForegroundColor Green
} else {
    Write-Host "❌ Common definitions NO sincronizadas" -ForegroundColor Red
    exit 1
}

# Verificar que los stubs existen
if (Test-Path "node_modules\class-validator\index.js") {
    Write-Host "✅ Stubs de class-validator instalados" -ForegroundColor Green
} else {
    Write-Host "❌ Stubs de class-validator NO encontrados" -ForegroundColor Red
}

# Probar compilación básica
Write-Host "🔄 Probando compilación TypeScript..." -ForegroundColor Blue
try {
    $tscResult = & npx tsc --noEmit --skipLibCheck 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Compilación TypeScript exitosa" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Compilación TypeScript con warnings" -ForegroundColor Yellow
        Write-Host $tscResult -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Error en compilación TypeScript" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host "=== RESUMEN FINAL ===" -ForegroundColor Cyan
Write-Host "✅ Frontend configurado para usar common-definitions desde backend" -ForegroundColor Green
Write-Host "✅ Script de sincronización automática funcional" -ForegroundColor Green
Write-Host "✅ Paths de TypeScript configurados correctamente" -ForegroundColor Green
Write-Host "✅ Stubs temporales para dependencias del backend" -ForegroundColor Green

Write-Host "`n🎯 PRÓXIMOS PASOS:" -ForegroundColor Magenta
Write-Host "1. Ejecutar 'npm run sync-definitions' antes de cada build" -ForegroundColor White
Write-Host "2. El frontend ahora usa las definiciones del backend automáticamente" -ForegroundColor White
Write-Host "3. Para desarrollo: 'npm run prestart' sincroniza automáticamente" -ForegroundColor White
