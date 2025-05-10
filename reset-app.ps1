# Script para limpiar la caché y reiniciar la aplicación Angular

Write-Host "Iniciando limpieza y reinicio de la aplicación..." -ForegroundColor Cyan

# Detener servidores si están ejecutándose
Write-Host "Buscando procesos de Angular que puedan estar en ejecución..." -ForegroundColor Yellow
$angularProcesses = Get-Process | Where-Object { $_.ProcessName -eq "node" -and $_.CommandLine -like "*ng serve*" }
if ($angularProcesses) {
    Write-Host "Deteniendo procesos de Angular en ejecución..." -ForegroundColor Yellow
    $angularProcesses | ForEach-Object { Stop-Process -Id $_.Id -Force }
}

# Limpiar caché
Write-Host "Limpiando caché de Angular..." -ForegroundColor Yellow
if (Test-Path ".angular/cache") {
    Remove-Item -Recurse -Force ".angular/cache"
    Write-Host "Caché de Angular eliminada correctamente." -ForegroundColor Green
}

# Limpiar node_modules (opcional)
$cleanNodeModules = Read-Host "¿Desea eliminar node_modules y reinstalar? (s/n)"
if ($cleanNodeModules -eq "s") {
    Write-Host "Eliminando node_modules..." -ForegroundColor Yellow
    if (Test-Path "node_modules") {
        Remove-Item -Recurse -Force "node_modules"
        Write-Host "node_modules eliminados correctamente." -ForegroundColor Green
    }
    
    Write-Host "Instalando dependencias..." -ForegroundColor Yellow
    npm install
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Dependencias instaladas correctamente." -ForegroundColor Green
    } else {
        Write-Host "Error al instalar dependencias. Código de salida: $LASTEXITCODE" -ForegroundColor Red
        exit 1
    }
}

# Ejecutar el servidor de desarrollo de Angular
Write-Host "Iniciando servidor de desarrollo Angular..." -ForegroundColor Yellow
Write-Host "Para detener el servidor, presione Ctrl+C" -ForegroundColor Yellow
ng serve --open

# Este código se ejecutará cuando se detenga el servidor
Write-Host "Servidor detenido." -ForegroundColor Yellow 