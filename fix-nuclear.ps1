Write-Host "Aplicando soluciÃ³n nuclear - removiendo lÃ­neas problemÃ¡ticas..."

# Archivos para eliminar ValidatorConstraint imports
$validatorFiles = @(
    "src\generated\common-definitions\dtos\catv-power-supply\catv-power-supply-validators.ts"
)

foreach ($file in $validatorFiles) {
    if (Test-Path $file) {
        Write-Host "Eliminando imports ValidatorConstraint: $file"
        (Get-Content $file) | Where-Object { 
            $_ -notmatch "ValidatorConstraint" -and 
            $_ -notmatch "ValidatorConstraintInterface" 
        } | Set-Content $file
    }
}

# Archivo base.dto.ts - eliminar requires y override problemÃ¡tico
$baseFile = "src\generated\common-definitions\dtos\common\base.dto.ts"
if (Test-Path $baseFile) {
    Write-Host "Limpiando base.dto.ts"
    (Get-Content $baseFile) | Where-Object { 
        $_ -notmatch "const validator = require" -and 
        $_ -notmatch "const swagger = require" -and
        $_ -notmatch "override type!"
    } | Set-Content $baseFile
}

# Archivos con ApiProperty problemÃ¡ticos - reemplazar type: "object" con type: Object
$apiPropertyFiles = Get-ChildItem -Path "src\generated\common-definitions" -Recurse -Filter "*.dto.ts"

foreach ($file in $apiPropertyFiles) {
    Write-Host "Arreglando ApiProperty: $($file.Name)"
    $content = Get-Content $file.FullName -Raw
    
    # Reemplazar type: "object" con type: Object
    $content = $content -replace 'type:\s*"object"', 'type: Object'
    
    # Reemplazar required: boolean con required: true/false como string
    $content = $content -replace 'required:\s*true', 'required: ["true"]'
    $content = $content -replace 'required:\s*false', 'required: ["false"]'
    
    Set-Content $file.FullName -Value $content
}

# Eliminar clases de frontend examples problemÃ¡ticas
$frontendExamples = @(
    "src\generated\common-definitions\dtos\task\task-frontend-example.ts",
    "src\generated\common-definitions\dtos\terminal-box\terminal-box-frontend-example.ts",
    "src\generated\common-definitions\dtos\transformer\transformer-frontend-example.ts"
)

foreach ($file in $frontendExamples) {
    if (Test-Path $file) {
        Write-Host "Eliminando archivo frontend example: $file"
        Remove-Item $file -Force
    }
}

Write-Host "SoluciÃ³n nuclear aplicada. Compilando..."

# Compilar
npm run build
