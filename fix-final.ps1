# Script final para resolver errores restantes
Write-Host "Aplicando correcciones finales..." -ForegroundColor Yellow

# Corregir problemas específicos de decoradores ApiProperty que no se corrigieron
$problematicFiles = @(
    "src\generated\common-definitions\dtos\gpon-vlan\*.ts",
    "src\generated\common-definitions\dtos\gpon-wdm\*.ts",
    "src\generated\common-definitions\dtos\infrastructure\*.ts",
    "src\generated\common-definitions\dtos\ip-gateway\*.ts",
    "src\generated\common-definitions\dtos\network-alert\*.ts"
)

foreach ($pattern in $problematicFiles) {
    $files = Get-ChildItem -Path $pattern -ErrorAction SilentlyContinue
    foreach ($file in $files) {
        $content = Get-Content $file.FullName -Raw
        if ($content) {
            $originalContent = $content
            
            # Reemplazar type: "object" en decoradores @ApiProperty
            $content = $content -replace 'type:\s*"object"', 'type: Object'
            
            # Reemplazar required: false en decoradores @ApiProperty
            $content = $content -replace 'required:\s*false,?', 'required: [],'
            
            if ($content -ne $originalContent) {
                Set-Content -Path $file.FullName -Value $content -Encoding UTF8
                Write-Host "Corregido decoradores: $($file.Name)" -ForegroundColor Green
            }
        }
    }
}

# Corregir problema específico en base.dto.ts
$baseFile = "src\generated\common-definitions\dtos\common\base.dto.ts"
if (Test-Path $baseFile) {
    $content = Get-Content $baseFile -Raw
    $content = $content -replace "override\s+type!", "declare type"
    Set-Content -Path $baseFile -Value $content -Encoding UTF8
    Write-Host "Corregido override en base.dto.ts" -ForegroundColor Green
}

# Corregir problema específico en map-view.component.ts
$mapFile = "src\app\features\network-design\components\map-container\components\map-view\map-view.component.ts"
if (Test-Path $mapFile) {
    $content = Get-Content $mapFile -Raw
    $content = $content -replace "protected\s+zone:\s*NgZone;", "declare protected zone: NgZone;"
    Set-Content -Path $mapFile -Value $content -Encoding UTF8
    Write-Host "Corregido override en map-view.component.ts" -ForegroundColor Green
}

# Corregir clases de ejemplo Angular
$exampleFiles = @(
    "src\generated\common-definitions\dtos\task\task-frontend-example.ts",
    "src\generated\common-definitions\dtos\terminal-box\terminal-box-frontend-example.ts",
    "src\generated\common-definitions\dtos\transformer\transformer-frontend-example.ts"
)

foreach ($file in $exampleFiles) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        if ($content) {
            # Asegurar que tiene el import de Component
            if ($content -notmatch "import.*Component.*from.*@angular/core") {
                $content = "import { Component } from '@angular/core';`n" + $content
            }
            
            # Agregar decorador @Component antes de la clase si no existe
            if ($content -notmatch "@Component\s*\(\s*\{") {
                $content = $content -replace "(export\s+class\s+\w*ComponentExample)", "@Component({`n  selector: 'app-example',`n  template: '<div>Example Component</div>'`n})`n`$1"
            }
            
            Set-Content -Path $file -Value $content -Encoding UTF8
            Write-Host "Agregado decorador Angular: $(Split-Path $file -Leaf)" -ForegroundColor Green
        }
    }
}

Write-Host "Correcciones finales aplicadas. Compilando..." -ForegroundColor Yellow
npm run build
