# Script para iniciar la aplicación Angular en PowerShell
Write-Host "Iniciando aplicación Angular..." -ForegroundColor Cyan

# Limpiar la caché siempre
Write-Host "Limpiando caché de Angular..." -ForegroundColor Yellow
Remove-Item -Recurse -Force -Path ".angular/cache" -ErrorAction SilentlyContinue

# Instalar dependencias si es necesario
if ($args -contains "-install") {
    Write-Host "Instalando dependencias..." -ForegroundColor Green
    npm install
}

# Iniciar la aplicación
Write-Host "Iniciando servidor de desarrollo..." -ForegroundColor Green
npm run start -- --verbose 