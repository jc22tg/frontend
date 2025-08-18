export const ApiProperty = (options?: any) => (target: any, key?: string) => {};
export const ApiTags = (tags: string) => (target: any) => {};
export const ApiResponse = (options: any) => (target: any, key?: string) => {};
export const ApiOperation = (options: any) => (target: any, key?: string) => {};
export const ApiParam = (options: any) => (target: any, key?: string) => {};
export const ApiQuery = (options: any) => (target: any, key?: string) => {};
export const ApiBody = (options: any) => (target: any, key?: string) => {};
export const ApiHeader = (options: any) => (target: any, key?: string) => {};
export const ApiBearerAuth = (name?: string) => (target: any) => {};
export const ApiSecurity = (name: string) => (target: any) => {};
export const DocumentBuilder = class {
  setTitle() { return this; }
  setDescription() { return this; }
  setVersion() { return this; }
  addTag() { return this; }
  build() { return {}; }
};
export const SwaggerModule = {
  createDocument: () => ({}),
  setup: () => {}
};
