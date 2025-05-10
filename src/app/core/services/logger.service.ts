import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR'
}

@Injectable({
  providedIn: 'root'
})
export class LoggerService {
  private logLevel: LogLevel = LogLevel.INFO; // Nivel por defecto
  
  constructor() {
    // Establecer el nivel de log según el entorno
    if (!environment.production) {
      this.logLevel = LogLevel.DEBUG;
    }
  }
  
  /**
   * Establece el nivel mínimo de log
   */
  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }
  
  /**
   * Log de nivel debug
   */
  debug(message: string, ...args: any[]): void {
    this.log(LogLevel.DEBUG, message, args);
  }
  
  /**
   * Log de nivel info
   */
  info(message: string, ...args: any[]): void {
    this.log(LogLevel.INFO, message, args);
  }
  
  /**
   * Log de nivel warning
   */
  warn(message: string, ...args: any[]): void {
    this.log(LogLevel.WARN, message, args);
  }
  
  /**
   * Log de nivel error
   */
  error(message: string, ...args: any[]): void {
    this.log(LogLevel.ERROR, message, args);
  }
  
  /**
   * Método principal de log
   */
  private log(level: LogLevel, message: string, data: any[]): void {
    // Verificar si debemos mostrar este nivel de log
    if (!this.shouldLog(level)) return;
    
    const timestamp = new Date().toISOString();
    const formattedMessage = `[${timestamp}] [${level}] ${message}`;
    
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(formattedMessage, ...data);
        break;
      case LogLevel.INFO:
        console.info(formattedMessage, ...data);
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage, ...data);
        break;
      case LogLevel.ERROR:
        console.error(formattedMessage, ...data);
        break;
    }
  }
  
  /**
   * Determina si un nivel de log debe ser mostrado
   */
  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const requestedLevelIndex = levels.indexOf(level);
    
    return requestedLevelIndex >= currentLevelIndex;
  }
}
