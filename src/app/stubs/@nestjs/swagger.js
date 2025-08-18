module.exports = {
  ApiProperty: (options) => (target, key) => {},
  ApiTags: (tags) => (target) => {},
  ApiResponse: (options) => (target, key) => {},
  ApiOperation: (options) => (target, key) => {},
  ApiParam: (options) => (target, key) => {},
  ApiQuery: (options) => (target, key) => {},
  ApiBody: (options) => (target, key) => {},
  ApiHeader: (options) => (target, key) => {},
  ApiBearerAuth: (name) => (target) => {},
  ApiSecurity: (name) => (target) => {},
  DocumentBuilder: class {
    setTitle() { return this; }
    setDescription() { return this; }
    setVersion() { return this; }
    addTag() { return this; }
    build() { return {}; }
  },
  SwaggerModule: {
    createDocument: () => ({}),
    setup: () => {}
  }
};
