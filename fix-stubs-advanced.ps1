# ================================================================
# SCRIPT MEJORADO: Stubs avanzados para class-validator y class-transformer
# ================================================================

# Crear stubs más completos que acepten parámetros como en el backend

$nodeModulesPath = "c:\angular\proyecto\network-map\frontend\node_modules"

# === STUB AVANZADO PARA class-validator ===
$classValidatorPath = "$nodeModulesPath\class-validator"
if (-not (Test-Path $classValidatorPath)) {
    New-Item -ItemType Directory -Path $classValidatorPath -Force | Out-Null
}

$classValidatorAdvanced = @"
// Stub avanzado para class-validator en frontend
// Compatible con sintaxis del backend

export const IsString = (...args: any[]): any => () => {};
export const IsOptional = (...args: any[]): any => () => {};
export const IsEnum = (...args: any[]): any => () => {};
export const IsBoolean = (...args: any[]): any => () => {};
export const IsNumber = (...args: any[]): any => () => {};
export const IsArray = (...args: any[]): any => () => {};
export const IsEmail = (...args: any[]): any => () => {};
export const MinLength = (...args: any[]): any => () => {};
export const IsNotEmpty = (...args: any[]): any => () => {};
export const ValidateNested = (...args: any[]): any => () => {};
export const IsDateString = (...args: any[]): any => () => {};
export const IsIP = (...args: any[]): any => () => {};
export const IsIn = (...args: any[]): any => () => {};
export const IsObject = (...args: any[]): any => () => {};
export const Min = (...args: any[]): any => () => {};
export const Max = (...args: any[]): any => () => {};
export const IsUUID = (...args: any[]): any => () => {};
export const IsISO8601 = (...args: any[]): any => () => {};
export const ArrayMinSize = (...args: any[]): any => () => {};

// Exportar como default también para compatibilidad
export default {
    IsString, IsOptional, IsEnum, IsBoolean, IsNumber, 
    IsArray, IsEmail, MinLength, IsNotEmpty, ValidateNested,
    IsDateString, IsIP, IsIn, IsObject, Min, Max, IsUUID,
    IsISO8601, ArrayMinSize
};
"@

$classValidatorAdvanced | Out-File -FilePath "$classValidatorPath\index.d.ts" -Encoding UTF8
$classValidatorAdvanced | Out-File -FilePath "$classValidatorPath\index.js" -Encoding UTF8

# === STUB AVANZADO PARA class-transformer ===
$classTransformerPath = "$nodeModulesPath\class-transformer"
if (-not (Test-Path $classTransformerPath)) {
    New-Item -ItemType Directory -Path $classTransformerPath -Force | Out-Null
}

$classTransformerAdvanced = @"
// Stub avanzado para class-transformer en frontend
// Compatible con sintaxis del backend

export const Type = (...args: any[]): any => () => {};
export const Exclude = (...args: any[]): any => () => {};
export const Transform = (...args: any[]): any => () => {};

// Exportar como default también para compatibilidad
export default {
    Type, Exclude, Transform
};
"@

$classTransformerAdvanced | Out-File -FilePath "$classTransformerPath\index.d.ts" -Encoding UTF8
$classTransformerAdvanced | Out-File -FilePath "$classTransformerPath\index.js" -Encoding UTF8

# === STUB AVANZADO PARA bcrypt ===
$bcryptPath = "$nodeModulesPath\bcrypt"
if (-not (Test-Path $bcryptPath)) {
    New-Item -ItemType Directory -Path $bcryptPath -Force | Out-Null
}

$bcryptAdvanced = @"
// Stub avanzado para bcrypt en frontend
// Compatible con sintaxis del backend

export const hash = async (data: string, saltOrRounds: number): Promise<string> => {
    return data; // Stub implementation
};

export const compare = async (data: string, hash: string): Promise<boolean> => {
    return data === hash; // Stub implementation  
};

export const genSalt = async (rounds?: number): Promise<string> => {
    return 'stub-salt'; // Stub implementation
};

export default {
    hash, compare, genSalt
};
"@

$bcryptAdvanced | Out-File -FilePath "$bcryptPath\index.d.ts" -Encoding UTF8
$bcryptAdvanced | Out-File -FilePath "$bcryptPath\index.js" -Encoding UTF8

Write-Host "✅ Stubs avanzados actualizados exitosamente" -ForegroundColor Green
