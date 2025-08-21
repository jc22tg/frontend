// Stub completo para class-transformer - Frontend only
export function Type(...args: any[]): any {
  return function (target: any, propertyKey?: string | symbol): void {};
}

export function Transform(...args: any[]): any {
  return function (target: any, propertyKey?: string | symbol): void {};
}

export function Exclude(...args: any[]): any {
  return function (target: any, propertyKey?: string | symbol): void {};
}

export function Expose(...args: any[]): any {
  return function (target: any, propertyKey?: string | symbol): void {};
}

export function plainToClass(cls: any, plain: any, options?: any): any {
  return plain;
}

export function classToPlain(object: any, options?: any): any {
  return object;
}

export function plainToClassFromExist(clsObject: any, plain: any, options?: any): any {
  return clsObject;
}

export function classToClass(object: any, options?: any): any {
  return object;
}

export function serialize(object: any, options?: any): string {
  return JSON.stringify(object);
}

export function deserialize(cls: any, json: string, options?: any): any {
  return JSON.parse(json);
}

export function deserializeArray(cls: any, json: string, options?: any): any[] {
  return JSON.parse(json);
}

// Interfaces
export interface TransformOptions {
  toClassOnly?: boolean;
  toPlainOnly?: boolean;
  excludeExtraneousValues?: boolean;
  groups?: string[];
  version?: number;
  excludePrefixes?: string[];
  strategy?: 'excludeAll' | 'exposeAll';
  enableImplicitConversion?: boolean;
  enableCircularCheck?: boolean;
  ignoreDecorators?: boolean;
}

export interface TypeOptions {
  keepDiscriminatorProperty?: boolean;
  discriminator?: {
    property: string;
    subTypes: Array<{value: any, name: string}>;
  };
}

export interface TypeHelpOptions {
  newObject: any;
  object: any;
  property: string;
}
