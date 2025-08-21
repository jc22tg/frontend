import { validate, ValidationError } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsString, IsDate, IsOptional, IsObject, IsISO8601, IsEnum } from 'class-validator';

/**
 * DTO Base para todos los elementos de red
 * Proporciona campos comunes y validación para todos los DTOs
 */

/**
 * Clase base abstracta para todos los DTOs
 * Proporciona funcionalidad común como validación asíncrona
 */
export abstract class BaseDto {
  /**
   * Valida el DTO usando class-validator
   * @returns Promise con array de errores de validación
   */
  async validate(): Promise<ValidationError[]> {
    return await validate(this);
  }

  /**
   * Verifica si el DTO es válido
   * @returns Promise<boolean> true si no hay errores de validación
   */
  async isValid(): Promise<boolean> {
    const errors = await this.validate();
    return errors.length === 0;
  }

  /**
   * Obtiene los mensajes de error de validación
   * @returns Promise<string[]> Array de mensajes de error
   */
  async getValidationErrors(): Promise<string[]> {
    const errors = await this.validate();
    const messages: string[] = [];
    
    errors.forEach(error => {
      if (error.constraints) {
        Object.values(error.constraints).forEach(message => {
          messages.push(message);
        });
      }
    });
    
    return messages;
  }
}

/**
 * Interface para metadatos de timestamp
 */
export interface TimestampFields {
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Interface para campos de identificación
 */
export interface IdentificationFields {
  id: string;
  name: string;
  description?: string;
}

/**
 * DTO base para entidades con timestamp
 */
export abstract class TimestampDto extends BaseDto implements TimestampFields {
  @ApiProperty({
    description: 'Fecha de creación del registro',
    example: '2023-01-01T00:00:00.000Z',
    type: 'string',
    format: 'date-time'
  })
  @IsISO8601()
  @IsOptional()
  createdAt!: Date;

  @ApiProperty({
    description: 'Fecha de última actualización del registro',
    example: '2023-01-01T00:00:00.000Z',
    type: 'string',
    format: 'date-time'
  })
  @IsISO8601()
  @IsOptional()
  updatedAt!: Date;
}

/**
 * DTO base para entidades con identificación completa
 */
export abstract class IdentifiableDto extends TimestampDto implements IdentificationFields {
  @ApiProperty({
    description: 'Identificador único UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
    type: 'string',
    format: 'uuid'
  })
  @IsUUID()
  id!: string;

  @ApiProperty({
    description: 'Nombre del elemento',
    example: 'Elemento de Red',
    type: 'string',
    minLength: 1,
    maxLength: 255
  })
  @IsString()
  name!: string;

  @ApiProperty({
    description: 'Descripción opcional del elemento',
    example: 'Descripción detallada del elemento de red',
    type: 'string',
    required: false
  })
  @IsString()
  @IsOptional()
  description?: string;
}

/**
 * Tipos de status comunes para elementos de red
 */
export enum NetworkElementStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  MAINTENANCE = 'maintenance',
  ERROR = 'error',
  UNKNOWN = 'unknown'
}

/**
 * DTO base para elementos de red con status
 */
export abstract class NetworkElementDto extends IdentifiableDto {
  @ApiProperty({
    description: 'Estado del elemento de red',
    example: NetworkElementStatus.ACTIVE,
    enum: NetworkElementStatus,
    type: 'string'
  })
  @IsEnum(NetworkElementStatus)
  @IsOptional()
  status?: NetworkElementStatus;

  @ApiProperty({
    description: 'Información adicional del elemento como objeto JSON'
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

// Exports para compatibilidad
export { 
  ApiProperty, 
  IsUUID, 
  IsString, 
  IsDate, 
  IsOptional, 
  IsObject, 
  IsISO8601, 
  IsEnum 
};


