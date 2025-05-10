"use strict";
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ElementRepository = void 0;
var core_1 = require("@angular/core");
var rxjs_1 = require("rxjs");
var ElementRepository = function () {
    var _classDecorators = [(0, core_1.Injectable)({
            providedIn: 'root'
        })];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var ElementRepository = _classThis = /** @class */ (function () {
        function ElementRepository_1() {
            this.elements = [];
            this.initializeElements();
        }
        ElementRepository_1.prototype.initializeElements = function () {
            // TODO: Cargar elementos desde backend
        };
        // Métodos CRUD
        ElementRepository_1.prototype.getAll = function () {
            return (0, rxjs_1.of)(this.elements);
        };
        ElementRepository_1.prototype.getById = function (id) {
            var element = this.elements.find(function (e) { return e.id === id; });
            return (0, rxjs_1.of)(element || null);
        };
        ElementRepository_1.prototype.getByType = function (type) {
            return (0, rxjs_1.of)(this.elements.filter(function (e) { return e.type === type; }));
        };
        ElementRepository_1.prototype.getByStatus = function (status) {
            return (0, rxjs_1.of)(this.elements.filter(function (e) { return e.status === status; }));
        };
        ElementRepository_1.prototype.create = function (element) {
            this.elements.push(element);
            return (0, rxjs_1.of)(element);
        };
        ElementRepository_1.prototype.update = function (element) {
            var index = this.elements.findIndex(function (e) { return e.id === element.id; });
            if (index !== -1) {
                this.elements[index] = element;
            }
            return (0, rxjs_1.of)(element);
        };
        ElementRepository_1.prototype.delete = function (id) {
            this.elements = this.elements.filter(function (e) { return e.id !== id; });
            return (0, rxjs_1.of)(void 0);
        };
        // Métodos de búsqueda
        ElementRepository_1.prototype.search = function (query) {
            var searchTerm = query.toLowerCase();
            return (0, rxjs_1.of)(this.elements.filter(function (element) {
                return element.name.toLowerCase().includes(searchTerm) ||
                    (element.id ? element.id.toLowerCase().includes(searchTerm) : false) ||
                    (element.description ? element.description.toLowerCase().includes(searchTerm) : false);
            }));
        };
        // Métodos de filtrado
        ElementRepository_1.prototype.filter = function (filters) {
            var filtered = this.elements;
            if (filters.type) {
                filtered = filtered.filter(function (e) { return e.type === filters.type; });
            }
            if (filters.status) {
                filtered = filtered.filter(function (e) { return e.status === filters.status; });
            }
            if (filters.search) {
                var search_1 = filters.search.toLowerCase();
                filtered = filtered.filter(function (e) {
                    return e.name.toLowerCase().includes(search_1) ||
                        (e.id ? e.id.toLowerCase().includes(search_1) : false) ||
                        (e.description ? e.description.toLowerCase().includes(search_1) : false);
                });
            }
            return (0, rxjs_1.of)(filtered);
        };
        // Métodos de validación
        ElementRepository_1.prototype.validate = function (element) {
            // TODO: Implementar validaciones específicas
            return true;
        };
        // Métodos de exportación
        ElementRepository_1.prototype.export = function () {
            // TODO: Implementar exportación
            return (0, rxjs_1.of)('');
        };
        // Métodos de limpieza
        ElementRepository_1.prototype.clear = function () {
            this.elements = [];
        };
        return ElementRepository_1;
    }());
    __setFunctionName(_classThis, "ElementRepository");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ElementRepository = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ElementRepository = _classThis;
}();
exports.ElementRepository = ElementRepository;
