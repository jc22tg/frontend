// Stubs for class-validator in frontend
export interface ValidationOptions {
  message?: string;
  groups?: string[];
  always?: boolean;
  each?: boolean;
}

export interface ValidateNestedOptions {
  message?: string;
  each?: boolean;
}

export function IsString(validationOptions?: ValidationOptions): PropertyDecorator {
  return function(target: any, propertyName: string | symbol) {};
}

export function IsNumber(validationOptions?: ValidationOptions): PropertyDecorator {
  return function(target: any, propertyName: string | symbol) {};
}

export function IsOptional(validationOptions?: ValidationOptions): PropertyDecorator {
  return function(target: any, propertyName: string | symbol) {};
}

export function IsBoolean(validationOptions?: ValidationOptions): PropertyDecorator {
  return function(target: any, propertyName: string | symbol) {};
}

export function IsArray(validationOptions?: ValidationOptions): PropertyDecorator {
  return function(target: any, propertyName: string | symbol) {};
}

export function IsUUID(version?: string, validationOptions?: ValidationOptions): PropertyDecorator {
  return function(target: any, propertyName: string | symbol) {};
}

export function IsEmail(validationOptions?: ValidationOptions): PropertyDecorator {
  return function(target: any, propertyName: string | symbol) {};
}

export function IsDate(validationOptions?: ValidationOptions): PropertyDecorator {
  return function(target: any, propertyName: string | symbol) {};
}

export function ValidateNested(validationOptions?: ValidateNestedOptions): PropertyDecorator {
  return function(target: any, propertyName: string | symbol) {};
}

export function IsInt(validationOptions?: ValidationOptions): PropertyDecorator {
  return function(target: any, propertyName: string | symbol) {};
}

export function IsPositive(validationOptions?: ValidationOptions): PropertyDecorator {
  return function(target: any, propertyName: string | symbol) {};
}

export function Min(minValue: number, validationOptions?: ValidationOptions): PropertyDecorator {
  return function(target: any, propertyName: string | symbol) {};
}

export function Max(maxValue: number, validationOptions?: ValidationOptions): PropertyDecorator {
  return function(target: any, propertyName: string | symbol) {};
}

export function ArrayMaxSize(max: number, validationOptions?: ValidationOptions): PropertyDecorator {
  return function(target: any, propertyName: string | symbol) {};
}

export function ArrayMinSize(min: number, validationOptions?: ValidationOptions): PropertyDecorator {
  return function(target: any, propertyName: string | symbol) {};
}

export function IsEnum(entity: object, validationOptions?: ValidationOptions): PropertyDecorator {
  return function(target: any, propertyName: string | symbol) {};
}

export function IsObject(validationOptions?: ValidationOptions): PropertyDecorator {
  return function(target: any, propertyName: string | symbol) {};
}

export function IsISO8601(validationOptions?: ValidationOptions): PropertyDecorator {
  return function(target: any, propertyName: string | symbol) {};
}

export function IsNotEmpty(validationOptions?: ValidationOptions): PropertyDecorator {
  return function(target: any, propertyName: string | symbol) {};
}

export function Length(min: number, max?: number, validationOptions?: ValidationOptions): PropertyDecorator {
  return function(target: any, propertyName: string | symbol) {};
}

export function IsIP(version?: '4' | '6', validationOptions?: ValidationOptions): PropertyDecorator {
  return function(target: any, propertyName: string | symbol) {};
}

export function IsUrl(validationOptions?: ValidationOptions): PropertyDecorator {
  return function(target: any, propertyName: string | symbol) {};
}

export function Matches(pattern: RegExp | string, validationOptions?: ValidationOptions): PropertyDecorator {
  return function(target: any, propertyName: string | symbol) {};
}

export function IsDefined(validationOptions?: ValidationOptions): PropertyDecorator {
  return function(target: any, propertyName: string | symbol) {};
}
