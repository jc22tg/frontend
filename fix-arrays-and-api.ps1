Write-Host "🔧 Corrigiendo arrays tipados como never[]..."

# Buscar todos los archivos DTOs con problemas de arrays
$dtoFiles = Get-ChildItem -Path "src\generated\common-definitions\dtos" -Recurse -Filter "*.ts"

$fixedFiles = 0

foreach ($file in $dtoFiles) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    
    # Corregir declaraciones de arrays sin tipo explícito
    $content = $content -replace '(\s+)(const\s+\w+\s*=\s*\[\];)', '$1$2 // string[]'
    $content = $content -replace '(\s+)(const\s+parts\s*=\s*\[\]);', '$1const parts: string[] = [];'
    $content = $content -replace '(\s+)(const\s+fields\s*=\s*\[\]);', '$1const fields: string[] = [];'
    $content = $content -replace '(\s+)(const\s+specs\s*=\s*\[\]);', '$1const specs: string[] = [];'
    $content = $content -replace '(\s+)(const\s+changes\s*=\s*\[\]);', '$1const changes: string[] = [];'
    $content = $content -replace '(\s+)(const\s+info\s*=\s*\[\]);', '$1const info: string[] = [];'
    
    if ($content -ne $originalContent) {
        Set-Content $file.FullName -Value $content
        $fixedFiles++
        Write-Host "Corrigido: $($file.Name)"
    }
}

Write-Host "✅ Arrays corregidos en $fixedFiles archivos"

# Corregir ApiProperty con type: 'object' problemático
Write-Host "🔧 Corrigiendo ApiProperty type: 'object'..."

foreach ($file in $dtoFiles) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    
    # Reemplazar type: 'object' con type: Object
    $content = $content -replace "type:\s*'object'", 'type: Object'
    
    # Corregir required: boolean con required: string[]
    $content = $content -replace "required:\s*false", 'required: []'
    $content = $content -replace "required:\s*true", 'required: ["required"]'
    
    if ($content -ne $originalContent) {
        Set-Content $file.FullName -Value $content
        Write-Host "ApiProperty corregido: $($file.Name)"
    }
}

Write-Host "✅ Correcciones de ApiProperty completadas"
