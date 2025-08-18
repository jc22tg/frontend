# Script directo para corregir errores específicos de compilación
Write-Host "Aplicando correcciones directas..." -ForegroundColor Yellow

# 1. Corregir export types en media-converter-types.ts
$file1 = "src\generated\common-definitions\dtos\media-converter\media-converter-types.ts"
if (Test-Path $file1) {
    $content = Get-Content $file1 -Raw
    $content = $content -replace "export \{([^}]*IGeographicPosition[^}]*)\}", "export type { `$1 }"
    Set-Content -Path $file1 -Value $content -Encoding UTF8
    Write-Host "Corregido: $file1" -ForegroundColor Green
}

# 2. Corregir export types en modulator-types.ts
$file2 = "src\generated\common-definitions\dtos\modulator\modulator-types.ts"
if (Test-Path $file2) {
    $content = Get-Content $file2 -Raw
    $content = $content -replace "export \{([^}]*IGeographicPosition[^}]*as GeographicPosition[^}]*)\}", "export type { `$1 }"
    Set-Content -Path $file2 -Value $content -Encoding UTF8
    Write-Host "Corregido: $file2" -ForegroundColor Green
}

# 3. Corregir problemas de tipo 'object' en decoradores
$files = Get-ChildItem -Path "src\generated\common-definitions" -Recurse -Include "*.ts" | Where-Object { $_.Name -like "*gpon-vlan*" -or $_.Name -like "*gpon-wdm*" -or $_.Name -like "*central-office*" -or $_.Name -like "*site*" -or $_.Name -like "*ip-gateway*" }

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    if ($content) {
        $originalContent = $content
        $content = $content -replace "type:\s*'object'", "type: Object"
        $content = $content -replace "required:\s*false", "required: []"
        
        if ($content -ne $originalContent) {
            Set-Content -Path $file.FullName -Value $content -Encoding UTF8
            Write-Host "Corregido decoradores: $($file.Name)" -ForegroundColor Green
        }
    }
}

# 4. Corregir arrays never[] específicamente
$problemFiles = @(
    "src\generated\common-definitions\dtos\fiber-closure\create-fiber-closure.dto.ts",
    "src\generated\common-definitions\dtos\fiber-closure\fiber-closure.dto.ts",
    "src\generated\common-definitions\dtos\fiber-closure\update-fiber-closure.dto.ts",
    "src\generated\common-definitions\dtos\fiber-joint\create-fiber-joint.dto.ts",
    "src\generated\common-definitions\dtos\gpon-splitter\create-gpon-splitter.dto.ts",
    "src\generated\common-definitions\dtos\gpon-splitter\update-gpon-splitter.dto.ts"
)

foreach ($file in $problemFiles) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        if ($content) {
            # Agregar tipado explícito a arrays al inicio de métodos
            $content = $content -replace "(\s+)(const\s+(?:parts|fields|specs|changes)\s*=\s*\[\])", "`$1`$2 as string[]"
            Set-Content -Path $file -Value $content -Encoding UTF8
            Write-Host "Corregido arrays: $(Split-Path $file -Leaf)" -ForegroundColor Green
        }
    }
}

# 5. Agregar decoradores Angular a clases de ejemplo
$exampleFiles = @(
    "src\generated\common-definitions\dtos\task\task-frontend-example.ts",
    "src\generated\common-definitions\dtos\terminal-box\terminal-box-frontend-example.ts",
    "src\generated\common-definitions\dtos\transformer\transformer-frontend-example.ts"
)

foreach ($file in $exampleFiles) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        if ($content) {
            # Agregar import de Component si no existe
            if ($content -notmatch "import.*Component.*from.*@angular/core") {
                $content = "import { Component } from '@angular/core';`n" + $content
            }
            
            # Agregar decorador @Component a las clases
            $content = $content -replace "(export class \w*ComponentExample)", "@Component({`n  selector: 'app-example',`n  template: '<div>Example Component</div>'`n})`n`$1"
            
            Set-Content -Path $file -Value $content -Encoding UTF8
            Write-Host "Agregado decorador Angular: $(Split-Path $file -Leaf)" -ForegroundColor Green
        }
    }
}

Write-Host "Correcciones aplicadas. Compilando..." -ForegroundColor Yellow
npm run build
