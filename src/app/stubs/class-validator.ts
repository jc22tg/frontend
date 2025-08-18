// Stub completo para class-validator - Frontend only
export function IsNotEmpty(...args: any[]): any {
  return function (target: any, propertyKey?: string | symbol): void {};
}

export function IsString(...args: any[]): any {
  return function (target: any, propertyKey?: string | symbol): void {};
}

export function IsNumber(...args: any[]): any {
  return function (target: any, propertyKey?: string | symbol): void {};
}

export function IsBoolean(...args: any[]): any {
  return function (target: any, propertyKey?: string | symbol): void {};
}

export function IsArray(...args: any[]): any {
  return function (target: any, propertyKey?: string | symbol): void {};
}

export function IsEmail(...args: any[]): any {
  return function (target: any, propertyKey?: string | symbol): void {};
}

export function IsDate(...args: any[]): any {
  return function (target: any, propertyKey?: string | symbol): void {};
}

export function IsOptional(...args: any[]): any {
  return function (target: any, propertyKey?: string | symbol): void {};
}

export function IsEnum(...args: any[]): any {
  return function (target: any, propertyKey?: string | symbol): void {};
}

export function IsUUID(...args: any[]): any {
  return function (target: any, propertyKey?: string | symbol): void {};
}

export function ValidateNested(...args: any[]): any {
  return function (target: any, propertyKey?: string | symbol): void {};
}

export function IsInt(...args: any[]): any {
  return function (target: any, propertyKey?: string | symbol): void {};
}

export function IsPositive(...args: any[]): any {
  return function (target: any, propertyKey?: string | symbol): void {};
}

export function Min(...args: any[]): any {
  return function (target: any, propertyKey?: string | symbol): void {};
}

export function Max(...args: any[]): any {
  return function (target: any, propertyKey?: string | symbol): void {};
}

export function Length(...args: any[]): any {
  return function (target: any, propertyKey?: string | symbol): void {};
}

export function Matches(...args: any[]): any {
  return function (target: any, propertyKey?: string | symbol): void {};
}

export function IsUrl(...args: any[]): any {
  return function (target: any, propertyKey?: string | symbol): void {};
}

export function IsIP(...args: any[]): any {
  return function (target: any, propertyKey?: string | symbol): void {};
}

export function ArrayMaxSize(...args: any[]): any {
  return function (target: any, propertyKey?: string | symbol): void {};
}

export function ArrayMinSize(...args: any[]): any {
  return function (target: any, propertyKey?: string | symbol): void {};
}

export function IsObject(...args: any[]): any {
  return function (target: any, propertyKey?: string | symbol): void {};
}

export function IsISO8601(...args: any[]): any {
  return function (target: any, propertyKey?: string | symbol): void {};
}

export function IsDefined(...args: any[]): any {
  return function (target: any, propertyKey?: string | symbol): void {};
}

export function MaxLength(...args: any[]): any {
  return function (target: any, propertyKey?: string | symbol): void {};
}

export function MinLength(...args: any[]): any {
  return function (target: any, propertyKey?: string | symbol): void {};
}

export function IsPort(...args: any[]): any {
  return function (target: any, propertyKey?: string | symbol): void {};
}

export function IsPhoneNumber(...args: any[]): any {
  return function (target: any, propertyKey?: string | symbol): void {};
}

export function IsDateString(...args: any[]): any {
  return function (target: any, propertyKey?: string | symbol): void {};
}

export function IsIn(...args: any[]): any {
  return function (target: any, propertyKey?: string | symbol): void {};
}

// Interfaces y tipos
export class ValidationError {
  property?: string;
  value?: any;
  constraints?: { [type: string]: string };
  children?: ValidationError[];
}

export interface ValidationOptions {
  message?: string | ((validationArguments: ValidationArguments) => string);
  groups?: string[];
  always?: boolean;
  each?: boolean;
  context?: any;
}

export interface ValidationArguments {
  value: any;
  constraints: any[];
  targetName: string;
  object: any;
  property: string;
}

// Funciones
export function validate(object: object, validatorOptions?: any): Promise<ValidationError[]> {
  return Promise.resolve([]);
}

export function validateSync(object: object, validatorOptions?: any): ValidationError[] {
  return [];
}

export function registerDecorator(options: any): PropertyDecorator {
  return function (target: any, propertyKey?: string | symbol): void {};
}

// Decoradores de validación específicos faltantes
export function ValidatorConstraint(options?: any): ClassDecorator {
  return function (target: any): void {};
}

// Interfaces faltantes
export interface ValidatorConstraintInterface {
  validate(value: any, args?: ValidationArguments): boolean | Promise<boolean>;
  defaultMessage?(args?: ValidationArguments): string;
}
