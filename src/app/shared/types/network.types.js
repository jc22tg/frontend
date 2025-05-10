"use strict";
/**
 * Interfaces unificadas para el módulo de diseño de red
 * Estas interfaces representan los tipos y estructuras de datos comunes
 * utilizados en toda la aplicación.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectorType = exports.CableType = exports.PONEncryptionMethod = exports.PONAuthenticationMethod = exports.StrandColor = exports.SpliceType = exports.SplitterOutputType = exports.SplitterType = exports.ODFType = exports.PortType = exports.FiberType = exports.PONStandard = exports.ElementStatus = exports.ElementType = void 0;
/**
 * Enumeración de tipos de elementos de red
 */
var ElementType;
(function (ElementType) {
    ElementType["ODF"] = "ODF";
    ElementType["OLT"] = "OLT";
    ElementType["ONT"] = "ONT";
    ElementType["SPLITTER"] = "SPLITTER";
    ElementType["EDFA"] = "EDFA";
    ElementType["MANGA"] = "MANGA";
    ElementType["TERMINAL_BOX"] = "TERMINAL_BOX";
    ElementType["FIBER_THREAD"] = "FIBER_THREAD";
    ElementType["DROP_CABLE"] = "DROP_CABLE";
    ElementType["DISTRIBUTION_CABLE"] = "DISTRIBUTION_CABLE";
    ElementType["FEEDER_CABLE"] = "FEEDER_CABLE";
    ElementType["BACKBONE_CABLE"] = "BACKBONE_CABLE";
    ElementType["MSAN"] = "MSAN";
    ElementType["ROUTER"] = "ROUTER";
    ElementType["RACK"] = "RACK";
    ElementType["NETWORK_GRAPH"] = "NETWORK_GRAPH";
    // Nuevos tipos para redes PON avanzadas
    ElementType["WDM_FILTER"] = "WDM_FILTER";
    ElementType["COHERENT_TRANSPONDER"] = "COHERENT_TRANSPONDER";
    ElementType["WAVELENGTH_ROUTER"] = "WAVELENGTH_ROUTER";
    ElementType["OPTICAL_SWITCH"] = "OPTICAL_SWITCH";
    ElementType["ROADM"] = "ROADM";
    ElementType["OPTICAL_AMPLIFIER"] = "OPTICAL_AMPLIFIER";
    // Tipos obsoletos mantenidos por compatibilidad
    ElementType["FIBER_CONNECTION"] = "FIBER_CONNECTION";
    ElementType["FIBER_SPLICE"] = "FIBER_SPLICE";
    ElementType["FIBER_CABLE"] = "FIBER_CABLE";
    ElementType["FIBER_STRAND"] = "FIBER_STRAND";
    ElementType["FDP"] = "FDP"; // Fiber Distribution Point (obsoleto, usar ODF)
})(ElementType || (exports.ElementType = ElementType = {}));
/**
 * Enumeración de estados de elementos de red
 */
var ElementStatus;
(function (ElementStatus) {
    ElementStatus["ACTIVE"] = "ACTIVE";
    ElementStatus["INACTIVE"] = "INACTIVE";
    ElementStatus["MAINTENANCE"] = "MAINTENANCE";
    ElementStatus["FAULT"] = "FAULT";
    ElementStatus["PLANNED"] = "PLANNED";
    ElementStatus["BUILDING"] = "BUILDING";
    ElementStatus["RESERVED"] = "RESERVED";
    ElementStatus["DECOMMISSIONED"] = "DECOMMISSIONED";
    // Estados obsoletos mantenidos por compatibilidad
    ElementStatus["WARNING"] = "WARNING";
    ElementStatus["CRITICAL"] = "CRITICAL";
    ElementStatus["UNKNOWN"] = "UNKNOWN";
})(ElementStatus || (exports.ElementStatus = ElementStatus = {}));
/**
 * Estándares PON soportados en el sistema
 */
var PONStandard;
(function (PONStandard) {
    PONStandard["GPON"] = "GPON";
    PONStandard["EPON"] = "EPON";
    PONStandard["XGS_PON"] = "XGS_PON";
    PONStandard["XG_PON"] = "XG_PON";
    PONStandard["TEN_EPON"] = "10G_EPON";
    PONStandard["TWENTYFIVE_GS_PON"] = "25GS_PON";
    PONStandard["FIFTY_G_PON"] = "50G_PON";
    PONStandard["HUNDRED_G_PON"] = "100G_PON"; // 100 Gigabit PON / Coherent PON (Futura)
})(PONStandard || (exports.PONStandard = PONStandard = {}));
/**
 * Tipos de fibra óptica
 */
var FiberType;
(function (FiberType) {
    FiberType["SINGLE_MODE"] = "SINGLE_MODE";
    FiberType["MULTI_MODE"] = "MULTI_MODE";
    FiberType["SINGLE_MODE_LOOSE_TUBE"] = "SINGLE_MODE_LOOSE_TUBE";
    FiberType["SINGLE_MODE_RIBBON"] = "SINGLE_MODE_RIBBON";
    FiberType["MULTI_MODE_OM3"] = "MULTI_MODE_OM3";
    FiberType["MULTI_MODE_OM4"] = "MULTI_MODE_OM4"; // Multimodo OM4
})(FiberType || (exports.FiberType = FiberType = {}));
/**
 * Tipos de puertos para elementos de red
 */
var PortType;
(function (PortType) {
    PortType["PON_DISTRIBUTION"] = "PON_DISTRIBUTION";
    PortType["DEDICATED_SERVICE"] = "DEDICATED_SERVICE";
    PortType["UPLINK"] = "UPLINK";
    PortType["MANAGEMENT"] = "MANAGEMENT";
    PortType["SPARE"] = "SPARE";
    PortType["UNUSED"] = "UNUSED"; // Puerto sin uso asignado
})(PortType || (exports.PortType = PortType = {}));
/**
 * Tipos de ODF (antes FDP types)
 */
var ODFType;
(function (ODFType) {
    ODFType["PRIMARY"] = "PRIMARY";
    ODFType["SECONDARY"] = "SECONDARY";
    ODFType["TERTIARY"] = "TERTIARY"; // Terciario
})(ODFType || (exports.ODFType = ODFType = {}));
/**
 * Tipos de splitter
 */
var SplitterType;
(function (SplitterType) {
    SplitterType["DISTRIBUTION"] = "DISTRIBUTION";
    SplitterType["TERMINAL"] = "TERMINAL"; // Splitter terminal
})(SplitterType || (exports.SplitterType = SplitterType = {}));
/**
 * Tipos de salida para splitters
 */
var SplitterOutputType;
(function (SplitterOutputType) {
    SplitterOutputType["BALANCED"] = "BALANCED";
    SplitterOutputType["UNBALANCED"] = "UNBALANCED"; // Salida no balanceada (diferente potencia por puerto)
})(SplitterOutputType || (exports.SplitterOutputType = SplitterOutputType = {}));
// Nuevo enum para tipos de empalme
var SpliceType;
(function (SpliceType) {
    SpliceType["FUSION"] = "fusion";
    SpliceType["MECHANICAL"] = "mechanical";
})(SpliceType || (exports.SpliceType = SpliceType = {}));
// Nuevo enum para colores de hilos
var StrandColor;
(function (StrandColor) {
    StrandColor["BLUE"] = "blue";
    StrandColor["ORANGE"] = "orange";
    StrandColor["GREEN"] = "green";
    StrandColor["BROWN"] = "brown";
    StrandColor["SLATE"] = "slate";
    StrandColor["WHITE"] = "white";
    StrandColor["RED"] = "red";
    StrandColor["BLACK"] = "black";
    StrandColor["YELLOW"] = "yellow";
    StrandColor["VIOLET"] = "violet";
    StrandColor["PINK"] = "pink";
    StrandColor["AQUA"] = "aqua";
})(StrandColor || (exports.StrandColor = StrandColor = {}));
/**
 * Métodos de autenticación para dispositivos en redes PON
 */
var PONAuthenticationMethod;
(function (PONAuthenticationMethod) {
    PONAuthenticationMethod["NONE"] = "NONE";
    PONAuthenticationMethod["PASSWORD"] = "PASSWORD";
    PONAuthenticationMethod["SERIAL_NUMBER"] = "SERIAL_NUMBER";
    PONAuthenticationMethod["LOID"] = "LOID";
    PONAuthenticationMethod["OMCI"] = "OMCI";
    PONAuthenticationMethod["CERTIFICATE"] = "CERTIFICATE";
    PONAuthenticationMethod["RADIUS"] = "RADIUS";
    PONAuthenticationMethod["MAC_ADDRESS"] = "MAC_ADDRESS";
    PONAuthenticationMethod["HYBRID"] = "HYBRID"; // Combinación de métodos
})(PONAuthenticationMethod || (exports.PONAuthenticationMethod = PONAuthenticationMethod = {}));
/**
 * Mecanismos de cifrado para redes PON
 */
var PONEncryptionMethod;
(function (PONEncryptionMethod) {
    PONEncryptionMethod["NONE"] = "NONE";
    PONEncryptionMethod["AES"] = "AES";
    PONEncryptionMethod["AES_128"] = "AES_128";
    PONEncryptionMethod["AES_256"] = "AES_256";
    PONEncryptionMethod["FEC"] = "FEC";
    PONEncryptionMethod["QUANTUM"] = "QUANTUM";
    PONEncryptionMethod["CUSTOM"] = "CUSTOM"; // Cifrado propietario
})(PONEncryptionMethod || (exports.PONEncryptionMethod = PONEncryptionMethod = {}));
var CableType;
(function (CableType) {
    CableType["AERIAL"] = "aerial";
    CableType["UNDERGROUND"] = "underground";
    CableType["INDOOR"] = "indoor";
    CableType["DUCT"] = "duct";
})(CableType || (exports.CableType = CableType = {}));
var ConnectorType;
(function (ConnectorType) {
    ConnectorType["SC"] = "SC";
    ConnectorType["LC"] = "LC";
    ConnectorType["FC"] = "FC";
    ConnectorType["ST"] = "ST";
    ConnectorType["MTP"] = "MTP";
})(ConnectorType || (exports.ConnectorType = ConnectorType = {}));
