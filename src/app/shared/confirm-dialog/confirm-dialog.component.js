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
exports.ConfirmDialogComponent = void 0;
var core_1 = require("@angular/core");
var common_1 = require("@angular/common");
var dialog_1 = require("@angular/material/dialog");
var button_1 = require("@angular/material/button");
var ConfirmDialogComponent = function () {
    var _classDecorators = [(0, core_1.Component)({
            selector: 'app-confirm-dialog',
            standalone: true,
            imports: [common_1.CommonModule, dialog_1.MatDialogModule, button_1.MatButtonModule],
            template: "\n    <h2 mat-dialog-title>{{ data.title }}</h2>\n    <mat-dialog-content>\n      <p>{{ data.message }}</p>\n    </mat-dialog-content>\n    <mat-dialog-actions align=\"end\">\n      <button mat-button (click)=\"onCancel()\">{{ data.cancelText || 'Cancelar' }}</button>\n      <button mat-raised-button color=\"primary\" (click)=\"onConfirm()\">{{ data.confirmText || 'Confirmar' }}</button>\n    </mat-dialog-actions>\n  "
        })];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var ConfirmDialogComponent = _classThis = /** @class */ (function () {
        function ConfirmDialogComponent_1() {
            this.dialogRef = (0, core_1.inject)((dialog_1.MatDialogRef));
            this.data = (0, core_1.inject)(dialog_1.MAT_DIALOG_DATA);
        }
        ConfirmDialogComponent_1.prototype.onConfirm = function () {
            this.dialogRef.close(true);
        };
        ConfirmDialogComponent_1.prototype.onCancel = function () {
            this.dialogRef.close(false);
        };
        return ConfirmDialogComponent_1;
    }());
    __setFunctionName(_classThis, "ConfirmDialogComponent");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ConfirmDialogComponent = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ConfirmDialogComponent = _classThis;
}();
exports.ConfirmDialogComponent = ConfirmDialogComponent;
