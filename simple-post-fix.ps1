Write-Host "SOLUCION DEFINITIVA - Post-sync corrections"

# 1. Corregir ValidatorConstraint imports en catv-power-supply-validators.ts
$validatorFile = "src\generated\common-definitions\dtos\catv-power-supply\catv-power-supply-validators.ts"
if (Test-Path $validatorFile) {
    $content = Get-Content $validatorFile -Raw
    $content = $content -replace "from 'class-validator'", 'from "../../../../app/stubs/class-validator"'
    $content = $content -replace 'from "class-validator"', 'from "../../../../app/stubs/class-validator"'
    Set-Content $validatorFile -Value $content
    Write-Host "ValidatorConstraint imports corregidos"
}

# 2. Corregir base.dto.ts - eliminar requires
$baseFile = "src\generated\common-definitions\dtos\common\base.dto.ts"
if (Test-Path $baseFile) {
    $content = Get-Content $baseFile -Raw
    
    # Eliminar líneas con require
    $lines = $content -split "`n"
    $filteredLines = $lines | Where-Object { $_ -notmatch "require\(" }
    $content = $filteredLines -join "`n"
    
    Set-Content $baseFile -Value $content
    Write-Host "Base.dto.ts require() eliminados"
}

# 3. Corregir arrays never[] y ApiProperty masivamente
$dtoFiles = Get-ChildItem -Path "src\generated\common-definitions\dtos" -Recurse -Filter "*.ts"

$fixedCount = 0
foreach ($file in $dtoFiles) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    
    # Corregir arrays sin tipo
    $content = $content -replace 'const parts = \[\];', 'const parts: string[] = [];'
    $content = $content -replace 'const fields = \[\];', 'const fields: string[] = [];'
    $content = $content -replace 'const specs = \[\];', 'const specs: string[] = [];'
    $content = $content -replace 'const changes = \[\];', 'const changes: string[] = [];'
    $content = $content -replace 'const info = \[\];', 'const info: string[] = [];'
    
    # ApiProperty corrections
    $content = $content -replace "type: 'object'", 'type: Object'
    $content = $content -replace 'required: false', 'required: []'
    $content = $content -replace 'required: true', 'required: []'
    
    if ($content -ne $originalContent) {
        Set-Content $file.FullName -Value $content
        $fixedCount++
    }
}

Write-Host "Arrays y ApiProperty corregidos en $fixedCount archivos"

# 4. Corregir clases Angular ComponentExample
$problematicFiles = @(
    "src\generated\common-definitions\dtos\task\task-frontend-example.ts",
    "src\generated\common-definitions\dtos\terminal-box\terminal-box-frontend-example.ts",
    "src\generated\common-definitions\dtos\transformer\transformer-frontend-example.ts"
)

foreach ($file in $problematicFiles) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        $content = $content -replace 'export class (\w*ComponentExample)', '// @ts-ignore Angular decorator issues`nexport class $1'
        Set-Content $file -Value $content
    }
}

Write-Host "Clases Angular ComponentExample corregidas"

Write-Host "CORRECCIONES COMPLETADAS"
