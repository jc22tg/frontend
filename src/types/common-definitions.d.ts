// Declaración de módulo para common-definitions
declare module '@common-definitions' {
  // Re-exportar los principales tipos desde common-definitions
  export * from '@common-definitions/enums';
  export * from '@common-definitions/dtos';
  export * from '@common-definitions/interfaces';
}

declare module '@common-definitions/enums' {
  export * from '@common-definitions/enums/common.enums';
  export * from '@common-definitions/enums/network.enums';
  export * from '@common-definitions/enums/gpon.enums';
}

declare module '@common-definitions/dtos' {
  export * from '@common-definitions/dtos/common/geographic-position.dto';
}

declare module '@common-definitions/interfaces' {
  export * from '@common-definitions/interfaces/base-categories.interface';
}

declare module '@common-definitions/enums/common.enums' {
  export enum ElementType {
    DEVICE = 'DEVICE',
    CABLE = 'CABLE',
    CONNECTOR = 'CONNECTOR',
    PORT = 'PORT',
    SPLITTER = 'SPLITTER',
    AMPLIFIER = 'AMPLIFIER',
    SWITCH = 'SWITCH',
    OPTICAL_SWITCH = 'OPTICAL_SWITCH',
    ROUTER = 'ROUTER',
    OLT = 'OLT',
    ONT = 'ONT',
    ODF = 'ODF',
    FDP = 'FDP',
    CHAMBER = 'CHAMBER',
    POLE = 'POLE',
    BUILDING = 'BUILDING',
    FIBER_CONNECTION = 'FIBER_CONNECTION'
  }
}

declare module '@common-definitions/enums/network.enums' {
  export enum ElementStatus {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
    MAINTENANCE = 'MAINTENANCE',
    FAULT = 'FAULT',
    TESTING = 'TESTING',
    OPERATIONAL = 'OPERATIONAL',
    NON_OPERATIONAL = 'NON_OPERATIONAL',
    DEGRADED = 'DEGRADED',
    UNKNOWN = 'UNKNOWN'
  }
  
  export enum FiberType {
    SINGLE_MODE = 'SINGLE_MODE',
    MULTI_MODE = 'MULTI_MODE'
  }
  
  export enum CableType {
    FEEDER = 'FEEDER',
    DISTRIBUTION = 'DISTRIBUTION',
    DROP = 'DROP'
  }
  
  export enum ConnectorType {
    SC = 'SC',
    LC = 'LC',
    FC = 'FC',
    ST = 'ST'
  }
}

declare module '@common-definitions/enums/gpon.enums' {
  export enum PONStandard {
    GPON = 'GPON',
    EPON = 'EPON',
    XG_PON = 'XG_PON',
    XGS_PON = 'XGS_PON',
    NG_PON2 = 'NG_PON2'
  }
  
  export enum PONAuthenticationMethod {
    SERIAL_NUMBER = 'SERIAL_NUMBER',
    PASSWORD = 'PASSWORD',
    MAC_ADDRESS = 'MAC_ADDRESS'
  }
  
  export enum PONEncryptionMethod {
    AES = 'AES',
    DES = 'DES',
    NONE = 'NONE'
  }
}

declare module '@common-definitions/dtos/common/geographic-position.dto' {
  export class GeographicPositionDto {
    latitude?: number;
    longitude?: number;
    altitude?: number;
  }
}

declare module '@common-definitions/*' {
  const content: any;
  export = content;
}
