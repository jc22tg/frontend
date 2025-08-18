# ================================================================
# SOLUCIÓN TEMPORAL: Stub para class-validator y class-transformer
# ================================================================
# Crear archivos temporales para resolver las importaciones

# Crear directorio node_modules si no existe
$nodeModulesPath = "c:\angular\proyecto\network-map\frontend\node_modules"
if (-not (Test-Path $nodeModulesPath)) {
    New-Item -ItemType Directory -Path $nodeModulesPath -Force | Out-Null
}

# Crear stub para class-validator
$classValidatorPath = "$nodeModulesPath\class-validator"
if (-not (Test-Path $classValidatorPath)) {
    New-Item -ItemType Directory -Path $classValidatorPath -Force | Out-Null
}

$classValidatorIndex = @"
// Stub temporal para class-validator en frontend
// Solo exporta tipos básicos sin implementación

export const IsString = (): any => () => {};
export const IsOptional = (): any => () => {};
export const IsEnum = (): any => () => {};
export const IsBoolean = (): any => () => {};
export const IsNumber = (): any => () => {};
export const IsArray = (): any => () => {};
export const IsEmail = (): any => () => {};
export const MinLength = (): any => () => {};
export const IsNotEmpty = (): any => () => {};
export const ValidateNested = (): any => () => {};
export const IsDateString = (): any => () => {};
export const IsIP = (): any => () => {};
export const IsIn = (): any => () => {};
export const IsObject = (): any => () => {};

// Exportar como default también
export default {
    IsString, IsOptional, IsEnum, IsBoolean, IsNumber, 
    IsArray, IsEmail, MinLength, IsNotEmpty, ValidateNested,
    IsDateString, IsIP, IsIn, IsObject
};
"@

$classValidatorIndex | Out-File -FilePath "$classValidatorPath\index.d.ts" -Encoding UTF8
$classValidatorIndex | Out-File -FilePath "$classValidatorPath\index.js" -Encoding UTF8

# Crear package.json para class-validator
@"
{
  "name": "class-validator",
  "version": "0.0.0-stub",
  "main": "index.js",
  "types": "index.d.ts"
}
"@ | Out-File -FilePath "$classValidatorPath\package.json" -Encoding UTF8

# Crear stub para class-transformer
$classTransformerPath = "$nodeModulesPath\class-transformer"
if (-not (Test-Path $classTransformerPath)) {
    New-Item -ItemType Directory -Path $classTransformerPath -Force | Out-Null
}

$classTransformerIndex = @"
// Stub temporal para class-transformer en frontend
// Solo exporta tipos básicos sin implementación

export const Type = (): any => () => {};
export const Exclude = (): any => () => {};
export const Transform = (): any => () => {};

// Exportar como default también
export default {
    Type, Exclude, Transform
};
"@

$classTransformerIndex | Out-File -FilePath "$classTransformerPath\index.d.ts" -Encoding UTF8
$classTransformerIndex | Out-File -FilePath "$classTransformerPath\index.js" -Encoding UTF8

# Crear package.json para class-transformer
@"
{
  "name": "class-transformer", 
  "version": "0.0.0-stub",
  "main": "index.js",
  "types": "index.d.ts"
}
"@ | Out-File -FilePath "$classTransformerPath\package.json" -Encoding UTF8

# Crear stub para bcrypt
$bcryptPath = "$nodeModulesPath\bcrypt"
if (-not (Test-Path $bcryptPath)) {
    New-Item -ItemType Directory -Path $bcryptPath -Force | Out-Null
}

$bcryptIndex = @"
// Stub temporal para bcrypt en frontend
// Solo exporta tipos básicos sin implementación

export const hash = async (data: string, saltOrRounds: number): Promise<string> => {
    return data; // Stub implementation
};

export const compare = async (data: string, hash: string): Promise<boolean> => {
    return data === hash; // Stub implementation  
};

export default {
    hash, compare
};
"@

$bcryptIndex | Out-File -FilePath "$bcryptPath\index.d.ts" -Encoding UTF8
$bcryptIndex | Out-File -FilePath "$bcryptPath\index.js" -Encoding UTF8

# Crear package.json para bcrypt
@"
{
  "name": "bcrypt",
  "version": "0.0.0-stub", 
  "main": "index.js",
  "types": "index.d.ts"
}
"@ | Out-File -FilePath "$bcryptPath\package.json" -Encoding UTF8

Write-Host "✅ Stubs creados exitosamente para resolver importaciones del frontend" -ForegroundColor Green
