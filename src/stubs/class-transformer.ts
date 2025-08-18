// Stubs for class-transformer in frontend
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

export function Type(typeFunction?: (type?: TypeHelpOptions) => Function, options?: TypeOptions): PropertyDecorator {
  return function(target: any, propertyName: string | symbol) {};
}

export function Transform(transformFn: (params: any) => any, options?: TransformOptions): PropertyDecorator {
  return function(target: any, propertyName: string | symbol) {};
}

export function Exclude(options?: TransformOptions): PropertyDecorator {
  return function(target: any, propertyName: string | symbol) {};
}

export function Expose(options?: TransformOptions): PropertyDecorator {
  return function(target: any, propertyName: string | symbol) {};
}

export function plainToClass<T, V>(cls: new (...args: any[]) => T, plain: V[], options?: TransformOptions): T[];
export function plainToClass<T, V>(cls: new (...args: any[]) => T, plain: V, options?: TransformOptions): T;
export function plainToClass<T, V>(cls: new (...args: any[]) => T, plain: V | V[], options?: TransformOptions): T | T[] {
  return plain as any;
}

export function classToPlain<T>(object: T, options?: TransformOptions): any;
export function classToPlain<T>(object: T[], options?: TransformOptions): any[];
export function classToPlain<T>(object: T | T[], options?: TransformOptions): any | any[] {
  return object as any;
}

export function plainToClassFromExist<T, V>(clsObject: T, plain: V, options?: TransformOptions): T {
  return clsObject;
}

export function classToClass<T>(object: T, options?: TransformOptions): T;
export function classToClass<T>(object: T[], options?: TransformOptions): T[];
export function classToClass<T>(object: T | T[], options?: TransformOptions): T | T[] {
  return object;
}

export interface TypeHelpOptions {
  newObject: any;
  object: any;
  property: string;
}

export function serialize<T>(object: T, options?: TransformOptions): string {
  return JSON.stringify(object);
}

export function deserialize<T>(cls: new (...args: any[]) => T, json: string, options?: TransformOptions): T {
  return JSON.parse(json);
}

export function deserializeArray<T>(cls: new (...args: any[]) => T, json: string, options?: TransformOptions): T[] {
  return JSON.parse(json);
}
