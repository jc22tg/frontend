# Script para corregir los errores finales de compilación TypeScript
Write-Host "Iniciando corrección de errores finales de compilación..." -ForegroundColor Yellow

# Función para corregir re-exportaciones de tipos
function Fix-TypeReexports {
    Write-Host "Corrigiendo re-exportaciones de tipos..." -ForegroundColor Cyan
    
    $files = Get-ChildItem -Path "src\generated\common-definitions" -Recurse -Include "*.ts" | Where-Object { $_.Name -notlike "*.spec.ts" }
    
    foreach ($file in $files) {
        $content = Get-Content $file.FullName -Raw
        if ($content) {
            # Corregir re-exportaciones específicas encontradas en los errores
            $content = $content -replace "export \{([^}]*DemultiplexorDto[^}]*)\}", "export type { `$1 }"
            $content = $content -replace "export \{([^}]*DemultiplexorSpecifications[^}]*)\}", "export type { `$1 }"
            $content = $content -replace "export \{([^}]*DemultiplexorSignalLevels[^}]*)\}", "export type { `$1 }"
            $content = $content -replace "export \{([^}]*DemultiplexorEnvironmentalConditions[^}]*)\}", "export type { `$1 }"
            $content = $content -replace "export \{([^}]*DemultiplexorRegulatoryCompliance[^}]*)\}", "export type { `$1 }"
            $content = $content -replace "export \{([^}]*CreateDemultiplexorDto[^}]*)\}", "export type { `$1 }"
            $content = $content -replace "export \{([^}]*UpdateDemultiplexorDto[^}]*)\}", "export type { `$1 }"
            $content = $content -replace "export \{([^}]*ValidationResult[^}]*)\}", "export type { `$1 }"
            $content = $content -replace "export \{([^}]*IGeographicPosition[^}]*)\}", "export type { `$1 }"
            $content = $content -replace "export \{([^}]*GeographicPosition[^}]*)\}", "export type { `$1 }"
            
            Set-Content -Path $file.FullName -Value $content -Encoding UTF8
        }
    }
}

# Función para corregir declaraciones de arrays never[]
function Fix-NeverArrays {
    Write-Host "Corrigiendo arrays declarados como never[]..." -ForegroundColor Cyan
    
    $files = Get-ChildItem -Path "src\generated\common-definitions" -Recurse -Include "*.ts" | Where-Object { $_.Name -notlike "*.spec.ts" }
    
    foreach ($file in $files) {
        $content = Get-Content $file.FullName -Raw
        if ($content) {
            # Buscar y corregir declaraciones de arrays como never[]
            $content = $content -replace "const\s+(\w+):\s*never\[\]\s*=\s*\[\]", "const `$1: string[] = []"
            $content = $content -replace "let\s+(\w+):\s*never\[\]\s*=\s*\[\]", "let `$1: string[] = []"
            $content = $content -replace "(\w+):\s*never\[\]", "`$1: string[]"
            
            # Corregir específicamente los arrays de parts, fields, specs, changes
            $content = $content -replace "const\s+parts\s*=\s*\[\]", "const parts: string[] = []"
            $content = $content -replace "const\s+fields\s*=\s*\[\]", "const fields: string[] = []"
            $content = $content -replace "const\s+specs\s*=\s*\[\]", "const specs: string[] = []"
            $content = $content -replace "const\s+changes\s*=\s*\[\]", "const changes: string[] = []"
            
            Set-Content -Path $file.FullName -Value $content -Encoding UTF8
        }
    }
}

# Función para corregir tipos en decoradores
function Fix-DecoratorTypes {
    Write-Host "Corrigiendo tipos en decoradores..." -ForegroundColor Cyan
    
    $files = Get-ChildItem -Path "src\generated\common-definitions" -Recurse -Include "*.ts" | Where-Object { $_.Name -notlike "*.spec.ts" }
    
    foreach ($file in $files) {
        $content = Get-Content $file.FullName -Raw
        if ($content) {
            # Corregir tipo 'object' en decoradores
            $content = $content -replace "type:\s*'object'", "type: Object"
            
            # Corregir required: false a required: []
            $content = $content -replace "required:\s*false", "required: []"
            
            Set-Content -Path $file.FullName -Value $content -Encoding UTF8
        }
    }
}

# Función para agregar decoradores Angular a clases de ejemplo
function Fix-AngularDecorators {
    Write-Host "Agregando decoradores Angular a clases de ejemplo..." -ForegroundColor Cyan
    
    # Archivos específicos que necesitan decoradores
    $exampleFiles = @(
        "src\generated\common-definitions\dtos\task\task-frontend-example.ts",
        "src\generated\common-definitions\dtos\terminal-box\terminal-box-frontend-example.ts",
        "src\generated\common-definitions\dtos\transformer\transformer-frontend-example.ts"
    )
    
    foreach ($filePath in $exampleFiles) {
        if (Test-Path $filePath) {
            $content = Get-Content $filePath -Raw
            if ($content) {
                # Agregar import de Component si no existe
                if ($content -notmatch "import.*Component.*from.*@angular/core") {
                    $content = "import { Component } from '@angular/core';`n" + $content
                }
                
                # Agregar decorador @Component a las clases de ejemplo
                $content = $content -replace "export class (\w*ComponentExample)", "@Component({`n  selector: 'app-example',`n  template: '<div>Example Component</div>'`n})`nexport class `$1"
                
                Set-Content -Path $filePath -Value $content -Encoding UTF8
            }
        }
    }
}

# Ejecutar todas las correcciones
Write-Host "=== INICIANDO CORRECCIONES ===" -ForegroundColor Green

Fix-TypeReexports
Fix-NeverArrays
Fix-DecoratorTypes
Fix-AngularDecorators

Write-Host "=== CORRECCIONES COMPLETADAS ===" -ForegroundColor Green
Write-Host "Intentando compilación nuevamente..." -ForegroundColor Yellow

# Intentar compilación
npm run build
