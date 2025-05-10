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
exports.ElementSearchWidgetComponent = void 0;
var core_1 = require("@angular/core");
var common_1 = require("@angular/common");
var card_1 = require("@angular/material/card");
var input_1 = require("@angular/material/input");
var form_field_1 = require("@angular/material/form-field");
var select_1 = require("@angular/material/select");
var button_1 = require("@angular/material/button");
var icon_1 = require("@angular/material/icon");
var autocomplete_1 = require("@angular/material/autocomplete");
var progress_spinner_1 = require("@angular/material/progress-spinner");
var snack_bar_1 = require("@angular/material/snack-bar");
var tooltip_1 = require("@angular/material/tooltip");
var chips_1 = require("@angular/material/chips");
var forms_1 = require("@angular/forms");
var rxjs_1 = require("rxjs");
var operators_1 = require("rxjs/operators");
var network_types_1 = require("../../../../shared/types/network.types");
var ElementSearchWidgetComponent = function () {
    var _classDecorators = [(0, core_1.Component)({
            selector: 'app-element-search-widget',
            templateUrl: './element-search-widget.component.html',
            styleUrls: ['./element-search-widget.component.scss'],
            standalone: true,
            imports: [
                common_1.CommonModule,
                card_1.MatCardModule,
                input_1.MatInputModule,
                form_field_1.MatFormFieldModule,
                select_1.MatSelectModule,
                button_1.MatButtonModule,
                icon_1.MatIconModule,
                autocomplete_1.MatAutocompleteModule,
                progress_spinner_1.MatProgressSpinnerModule,
                snack_bar_1.MatSnackBarModule,
                tooltip_1.MatTooltipModule,
                chips_1.MatChipsModule,
                forms_1.ReactiveFormsModule
            ],
            changeDetection: core_1.ChangeDetectionStrategy.OnPush
        })];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var ElementSearchWidgetComponent = _classThis = /** @class */ (function () {
        function ElementSearchWidgetComponent_1(networkFacade, snackBar, cdr, networkStateService) {
            this.networkFacade = networkFacade;
            this.snackBar = snackBar;
            this.cdr = cdr;
            this.networkStateService = networkStateService;
            this.destroy$ = new rxjs_1.Subject();
            this.searchControl = new forms_1.FormControl('');
            this.elements = [];
            this.filteredElements = [];
            this.currentFilters = {};
            // Estados de UI
            this.loading = false;
            this.searchLoading = false;
            this.exportLoading = false;
            this.error = null;
            // Mejoras de UX
            this.searchHistory = [];
            this.showNoResultsMessage = false;
            this.isFirstSearch = true;
            this.elementTypes = Object.values(network_types_1.ElementType);
            this.elementStatuses = Object.values(network_types_1.ElementStatus);
        }
        ElementSearchWidgetComponent_1.prototype.ngOnInit = function () {
            this.loadSearchHistory();
            this.subscribeToElements();
            this.setupSearchControl();
        };
        ElementSearchWidgetComponent_1.prototype.ngOnDestroy = function () {
            this.destroy$.next();
            this.destroy$.complete();
        };
        ElementSearchWidgetComponent_1.prototype.loadSearchHistory = function () {
            var savedHistory = localStorage.getItem('elementSearchHistory');
            if (savedHistory) {
                this.searchHistory = JSON.parse(savedHistory).slice(0, 5); // Limitamos a 5 búsquedas recientes
            }
        };
        ElementSearchWidgetComponent_1.prototype.saveSearchToHistory = function (term) {
            if (!term || term.trim() === '')
                return;
            // Evitar duplicados y mantener los términos más recientes al inicio
            this.searchHistory = this.searchHistory.filter(function (item) { return item !== term; });
            this.searchHistory.unshift(term);
            // Limitar a las 5 búsquedas más recientes
            if (this.searchHistory.length > 5) {
                this.searchHistory = this.searchHistory.slice(0, 5);
            }
            localStorage.setItem('elementSearchHistory', JSON.stringify(this.searchHistory));
        };
        ElementSearchWidgetComponent_1.prototype.useHistoryTerm = function (term) {
            this.searchControl.setValue(term);
        };
        ElementSearchWidgetComponent_1.prototype.clearSearchHistory = function () {
            this.searchHistory = [];
            localStorage.removeItem('elementSearchHistory');
            this.snackBar.open('Historial de búsqueda eliminado', 'Cerrar', {
                duration: 3000
            });
        };
        ElementSearchWidgetComponent_1.prototype.subscribeToElements = function () {
            var _this = this;
            this.loading = true;
            this.error = null;
            this.cdr.markForCheck();
            this.networkFacade.getElements()
                .pipe((0, operators_1.takeUntil)(this.destroy$), (0, operators_1.finalize)(function () {
                _this.loading = false;
                _this.cdr.markForCheck();
            }), (0, operators_1.catchError)(function (error) {
                _this.handleError('Error al cargar elementos de red', error);
                return (0, rxjs_1.of)([]);
            }))
                .subscribe({
                next: function (elements) {
                    _this.elements = elements;
                    _this.applyFilters();
                }
            });
        };
        ElementSearchWidgetComponent_1.prototype.setupSearchControl = function () {
            var _this = this;
            this.searchControl.valueChanges
                .pipe((0, operators_1.takeUntil)(this.destroy$), (0, operators_1.debounceTime)(300), (0, operators_1.distinctUntilChanged)())
                .subscribe(function (value) {
                if (value) {
                    _this.currentFilters.search = value;
                    _this.isFirstSearch = false;
                }
                else {
                    delete _this.currentFilters.search;
                }
                _this.applyFilters();
            });
        };
        ElementSearchWidgetComponent_1.prototype.applyFilters = function () {
            var _this = this;
            this.searchLoading = true;
            this.error = null;
            this.showNoResultsMessage = false;
            this.cdr.markForCheck();
            // Guardar el término de búsqueda en el historial si existe
            if (this.currentFilters.search) {
                this.saveSearchToHistory(this.currentFilters.search);
            }
            this.networkFacade.searchElements(this.currentFilters)
                .pipe((0, operators_1.takeUntil)(this.destroy$), (0, operators_1.finalize)(function () {
                _this.searchLoading = false;
                _this.cdr.markForCheck();
            }), (0, operators_1.catchError)(function (error) {
                _this.handleError('Error al filtrar elementos', error);
                return (0, rxjs_1.of)([]);
            }))
                .subscribe({
                next: function (elements) {
                    _this.filteredElements = elements;
                    _this.showNoResultsMessage = _this.filteredElements.length === 0 && !_this.isFirstSearch;
                    // Compartir los resultados con el estado global
                    _this.networkStateService.updateSearchResults(elements);
                }
            });
        };
        ElementSearchWidgetComponent_1.prototype.onTypeChange = function (type) {
            if (type) {
                this.currentFilters.type = type;
            }
            else {
                delete this.currentFilters.type;
            }
            this.applyFilters();
        };
        ElementSearchWidgetComponent_1.prototype.onStatusChange = function (status) {
            if (status) {
                this.currentFilters.status = status;
            }
            else {
                delete this.currentFilters.status;
            }
            this.applyFilters();
        };
        ElementSearchWidgetComponent_1.prototype.onClearFilters = function () {
            this.currentFilters = {};
            this.searchControl.setValue('', { emitEvent: false });
            this.isFirstSearch = true;
            this.showNoResultsMessage = false;
            this.applyFilters();
            this.snackBar.open('Filtros restablecidos', 'Cerrar', {
                duration: 3000
            });
        };
        ElementSearchWidgetComponent_1.prototype.onExportResults = function () {
            var _this = this;
            if (this.filteredElements.length === 0) {
                this.snackBar.open('No hay elementos para exportar', 'Cerrar', {
                    duration: 3000,
                    panelClass: ['warning-snackbar']
                });
                return;
            }
            this.exportLoading = true;
            this.cdr.markForCheck();
            this.networkFacade.exportElements()
                .pipe((0, operators_1.takeUntil)(this.destroy$), (0, operators_1.finalize)(function () {
                _this.exportLoading = false;
                _this.cdr.markForCheck();
            }), (0, operators_1.catchError)(function (error) {
                _this.handleError('Error al exportar elementos', error);
                return (0, rxjs_1.of)(null);
            }))
                .subscribe({
                next: function (result) {
                    if (result) {
                        _this.snackBar.open('Elementos exportados exitosamente', 'Cerrar', {
                            duration: 3000,
                            panelClass: ['success-snackbar']
                        });
                    }
                }
            });
        };
        ElementSearchWidgetComponent_1.prototype.handleError = function (message, error) {
            var _a;
            console.error("".concat(message, ":"), error);
            var errorMsg = message;
            // Extraer detalles más específicos del error si están disponibles
            if ((_a = error.error) === null || _a === void 0 ? void 0 : _a.message) {
                errorMsg += ": ".concat(error.error.message);
            }
            else if (error.status) {
                var statusMessages = {
                    0: 'No hay conexión al servidor',
                    404: 'Recurso no encontrado',
                    403: 'Acceso denegado',
                    500: 'Error interno del servidor'
                };
                errorMsg += " (".concat(statusMessages[error.status] || "Error ".concat(error.status), ")");
            }
            this.error = errorMsg;
            this.snackBar.open(errorMsg, 'Cerrar', {
                duration: 5000,
                panelClass: ['error-snackbar']
            });
        };
        ElementSearchWidgetComponent_1.prototype.getElementTypeName = function (type) {
            var _a;
            // Obtener nombre más descriptivo del tipo
            var typeNames = (_a = {},
                _a[network_types_1.ElementType.OLT] = 'Terminal de Línea Óptica',
                _a[network_types_1.ElementType.ONT] = 'Terminal de Red Óptica',
                _a[network_types_1.ElementType.FDP] = 'Punto de Distribución de Fibra',
                _a[network_types_1.ElementType.EDFA] = 'Amplificador de Fibra',
                _a[network_types_1.ElementType.SPLITTER] = 'Divisor Óptico',
                _a[network_types_1.ElementType.MANGA] = 'Manga',
                _a[network_types_1.ElementType.TERMINAL_BOX] = 'Caja Terminal',
                _a[network_types_1.ElementType.FIBER_THREAD] = 'Hilo de Fibra',
                _a[network_types_1.ElementType.FIBER_CONNECTION] = 'Conexión de Fibra',
                _a[network_types_1.ElementType.FIBER_SPLICE] = 'Empalme de Fibra',
                _a[network_types_1.ElementType.FIBER_CABLE] = 'Cable de Fibra',
                _a[network_types_1.ElementType.FIBER_STRAND] = 'Hilo de Fibra',
                _a[network_types_1.ElementType.DROP_CABLE] = 'Cable de Acometida',
                _a[network_types_1.ElementType.DISTRIBUTION_CABLE] = 'Cable de Distribución',
                _a[network_types_1.ElementType.FEEDER_CABLE] = 'Cable Alimentador',
                _a[network_types_1.ElementType.BACKBONE_CABLE] = 'Cable Troncal',
                _a);
            return typeNames[type] || type.toLowerCase();
        };
        ElementSearchWidgetComponent_1.prototype.getElementStatusClass = function (status) {
            return "status-".concat(status.toLowerCase());
        };
        ElementSearchWidgetComponent_1.prototype.getResultsCount = function () {
            return this.filteredElements.length;
        };
        ElementSearchWidgetComponent_1.prototype.hasAnyFilter = function () {
            return Object.keys(this.currentFilters).length > 0;
        };
        /**
         * Acción al seleccionar un elemento de la lista de resultados
         */
        ElementSearchWidgetComponent_1.prototype.selectElement = function (element) {
            if (!element)
                return;
            // Notificar al estado global sobre el elemento seleccionado
            this.networkStateService.selectElementFromSearch(element);
            this.snackBar.open("Elemento \"".concat(element.name, "\" seleccionado"), 'Cerrar', {
                duration: 3000,
                panelClass: ['info-snackbar']
            });
        };
        /**
         * Acción para ver los detalles de un elemento
         */
        ElementSearchWidgetComponent_1.prototype.viewElementDetails = function (element) {
            if (!element)
                return;
            // Primero seleccionamos el elemento
            this.networkStateService.selectElementFromSearch(element);
            // Luego notificamos que queremos ver los detalles
            this.networkStateService.setCurrentViewMode('details');
        };
        /**
         * Acción para editar un elemento
         */
        ElementSearchWidgetComponent_1.prototype.editElement = function (element) {
            if (!element)
                return;
            // Primero seleccionamos el elemento
            this.networkStateService.selectElementFromSearch(element);
            // Luego notificamos que queremos editar
            this.networkStateService.setCurrentViewMode('editor');
        };
        /**
         * Obtiene una representación textual de la ubicación del elemento
         */
        ElementSearchWidgetComponent_1.prototype.getElementLocation = function (element) {
            if (!element.position || !element.position.coordinates) {
                return 'No especificada';
            }
            // Las coordenadas están en formato [longitud, latitud]
            var _a = element.position.coordinates, longitude = _a[0], latitude = _a[1];
            // Formato con 5 decimales para mostrar precisión pero no demasiados dígitos
            return "".concat(latitude.toFixed(5), ", ").concat(longitude.toFixed(5));
        };
        return ElementSearchWidgetComponent_1;
    }());
    __setFunctionName(_classThis, "ElementSearchWidgetComponent");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ElementSearchWidgetComponent = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ElementSearchWidgetComponent = _classThis;
}();
exports.ElementSearchWidgetComponent = ElementSearchWidgetComponent;
