import { Injectable } from '@angular/core';

/**
 * Servicio para ayudar a mejorar la calidad del código
 * Proporciona utilidades para reemplazar 'any' y para verificar código no utilizado
 */
@Injectable({
  providedIn: 'root'
})
export class CodeQualityService {
  // Lista de importaciones que no se utilizan en el proyecto
  private unusedImports = new Map<string, string[]>();
  
  constructor() {
    // Inicializar con algunas importaciones conocidas que no se utilizan
    this.populateUnusedImports();
  }
  
  /**
   * Verifica si una importación está en la lista de no utilizadas
   * @param modulePath Ruta del módulo
   * @param importName Nombre de la importación
   */
  isUnusedImport(modulePath: string, importName: string): boolean {
    const unusedInModule = this.unusedImports.get(modulePath);
    return unusedInModule ? unusedInModule.includes(importName) : false;
  }
  
  /**
   * Obtiene todas las importaciones no utilizadas de un módulo
   * @param modulePath Ruta del módulo
   */
  getUnusedImports(modulePath: string): string[] {
    return this.unusedImports.get(modulePath) || [];
  }
  
  /**
   * Registra una nueva importación no utilizada
   * @param modulePath Ruta del módulo
   * @param importNames Nombres de las importaciones
   */
  registerUnusedImports(modulePath: string, importNames: string[]): void {
    const existing = this.unusedImports.get(modulePath) || [];
    this.unusedImports.set(modulePath, [...existing, ...importNames]);
  }
  
  /**
   * Recomendaciones para reemplazar 'any'
   * @param context Contexto en el que se usa 'any'
   */
  getSuggestionForAny(context: 'parameter' | 'return' | 'variable' | 'generic'): string {
    switch (context) {
      case 'parameter':
        return 'Considera usar tipos genéricos o interfaces específicas para los parámetros';
      case 'return':
        return 'Define un tipo explícito para el valor de retorno';
      case 'variable':
        return 'Usa tipos específicos o inferencia de tipos para variables';
      case 'generic':
        return 'Reemplaza any en genéricos con tipos más específicos o unknown';
      default:
        return 'Evita usar any; define tipos específicos';
    }
  }
  
  /**
   * Genera sugerencias para mejorar un archivo
   * @param fileContent Contenido del archivo
   */
  analyzeFile(fileContent: string): {
    unusedImports: string[];
    anyUsages: {line: number; suggestion: string}[];
    accessibilityIssues: {line: number; issue: string; suggestion: string}[];
  } {
    const lines = fileContent.split('\n');
    const result = {
      unusedImports: [] as string[],
      anyUsages: [] as {line: number; suggestion: string}[],
      accessibilityIssues: [] as {line: number; issue: string; suggestion: string}[]
    };
    
    // Detectar importaciones no utilizadas
    const importRegex = /import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/g;
    let match: RegExpExecArray | null;
    
    while ((match = importRegex.exec(fileContent)) !== null) {
      const imports = match[1].split(',').map(imp => imp.trim());
      const modulePath = match[2];
      
      imports.forEach(importName => {
        if (this.isUnusedImport(modulePath, importName)) {
          result.unusedImports.push(`${importName} from ${modulePath}`);
        }
      });
    }
    
    // Detectar usos de 'any'
    const anyRegex = /:\s*any\b|<any>|\bas\s+any\b|any\[\]/g;
    
    lines.forEach((line, index) => {
      while ((match = anyRegex.exec(line)) !== null) {
        const context = this.determineAnyContext(match[0]);
        result.anyUsages.push({
          line: index + 1,
          suggestion: this.getSuggestionForAny(context)
        });
      }
    });
    
    // Detectar problemas de accesibilidad
    const clickWithoutKeyboardRegex = /(click)\s*=\s*["'](?!.*keydown)(?!.*keyup)(?!.*keypress)/;
    const interactiveWithoutFocusRegex = /\b(click|mousedown|mouseover)\b(?!.*tabindex)(?!.*button)(?!.*input)/;
    
    lines.forEach((line, index) => {
      if (clickWithoutKeyboardRegex.test(line)) {
        result.accessibilityIssues.push({
          line: index + 1,
          issue: 'Evento click sin evento de teclado asociado',
          suggestion: 'Añade (keydown.enter) o (keydown.space) para mejorar la accesibilidad'
        });
      }
      
      if (interactiveWithoutFocusRegex.test(line)) {
        result.accessibilityIssues.push({
          line: index + 1,
          issue: 'Elemento interactivo sin posibilidad de foco',
          suggestion: 'Añade tabindex="0" o utiliza un elemento focusable nativo (button, a, input)'
        });
      }
    });
    
    return result;
  }
  
  /**
   * Determina el contexto en el que se usa 'any'
   */
  private determineAnyContext(anyMatch: string): 'parameter' | 'return' | 'variable' | 'generic' {
    if (anyMatch.includes('<')) {
      return 'generic';
    } else if (anyMatch.includes(':')) {
      return anyMatch.includes('function') || anyMatch.includes(')') ? 'return' : 'parameter';
    } else {
      return 'variable';
    }
  }
  
  /**
   * Poblar la lista de importaciones conocidas que no se utilizan
   */
  private populateUnusedImports(): void {
    // Angular core
    this.registerUnusedImports('@angular/core', [
      'AfterContentChecked', 'AfterContentInit', 'AfterViewChecked', 'DoCheck',
      'forwardRef', 'ViewEncapsulation', 'Pipe', 'SkipSelf', 'Renderer', 'ModuleWithProviders'
    ]);
    
    // RxJS
    this.registerUnusedImports('rxjs', [
      'Observable', 'Subject', 'BehaviorSubject', 'ReplaySubject', 'of', 'from', 'interval',
      'timer', 'throwError', 'combineLatest', 'merge', 'concat', 'race', 'iif', 'defer', 'range'
    ]);
    
    this.registerUnusedImports('rxjs/operators', [
      'map', 'filter', 'tap', 'take', 'takeUntil', 'takeWhile', 'first', 'skip',
      'skipUntil', 'skipWhile', 'debounceTime', 'throttleTime', 'distinctUntilChanged',
      'switchMap', 'mergeMap', 'concatMap', 'exhaustMap', 'catchError', 'retry', 'share',
      'shareReplay', 'startWith', 'withLatestFrom', 'delay', 'finalize'
    ]);
  }
} 
