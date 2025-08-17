/**
 * Script para ayudar a corregir automáticamente los tipos 'any' en el proyecto
 * 
 * Este script analiza los archivos TypeScript del proyecto y sugiere reemplazos
 * para los tipos 'any' encontrados, basándose en patrones comunes.
 * 
 * Uso: node fix-any-types.js [--fix] [--path=ruta/específica]
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuración
const config = {
  rootDir: path.resolve(__dirname, '..'),
  shouldFix: process.argv.includes('--fix'),
  specificPath: process.argv.find(arg => arg.startsWith('--path='))?.split('=')[1],
  excludeDirs: ['node_modules', 'dist', '.angular'],
  fileExtensions: ['.ts'],
  maxFilesToProcess: 50, // Limitar la cantidad de archivos para evitar sobrecarga
  anyTypesToReplace: [
    { pattern: /:\s*any(\[\])?(?!\s*=)/g, replacement: ': unknown$1' },
    { pattern: /as\s+any/g, replacement: 'as unknown' },
    { pattern: /<any>/g, replacement: '<unknown>' },
    { pattern: /Promise<any>/g, replacement: 'Promise<unknown>' },
    { pattern: /Observable<any>/g, replacement: 'Observable<unknown>' },
    { pattern: /:\s*any\s*=\s*\{/g, replacement: ': Record<string, unknown> = {' },
    { pattern: /:\s*any\[\]\s*=\s*\[/g, replacement: ': unknown[] = [' },
    { pattern: /Map<string,\s*any>/g, replacement: 'Map<string, unknown>' },
    { pattern: /Record<string,\s*any>/g, replacement: 'Record<string, unknown>' }
  ],
  commonInterfaces: {
    'error': 'Error',
    'err': 'Error',
    'e': 'Error',
    'exception': 'Error',
    'response': 'Response',
    'res': 'Response',
    'request': 'Request',
    'req': 'Request',
    'options': 'Options',
    'config': 'Config',
    'data': 'Data',
    'result': 'Result',
    'item': 'Item',
    'element': 'Element',
    'event': 'Event',
    'payload': 'Payload',
    'params': 'Params',
    'args': 'Args',
    'props': 'Props',
    'state': 'State',
    'context': 'Context'
  }
};

// Contador de estadísticas
const stats = {
  filesScanned: 0,
  filesModified: 0,
  anyTypesFound: 0,
  anyTypesReplaced: 0,
  errors: 0
};

/**
 * Encuentra todos los archivos TypeScript en el directorio especificado
 */
function findTypeScriptFiles(dir, fileList = []) {
  if (config.excludeDirs.some(excluded => dir.includes(excluded))) {
    return fileList;
  }
  
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      findTypeScriptFiles(filePath, fileList);
    } else if (config.fileExtensions.some(ext => file.endsWith(ext))) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

/**
 * Procesa un archivo TypeScript para reemplazar tipos 'any'
 */
function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    let anyCount = 0;
    let replacedCount = 0;
    
    // Contar ocurrencias de 'any'
    const anyMatches = content.match(/:\s*any\b|<any>|\bas\s+any\b|any\[\]/g);
    anyCount = anyMatches ? anyMatches.length : 0;
    stats.anyTypesFound += anyCount;
    
    if (anyCount === 0) {
      return;
    }
    
    // Aplicar reemplazos basados en patrones
    config.anyTypesToReplace.forEach(({ pattern, replacement }) => {
      const matches = content.match(pattern);
      if (matches) {
        content = content.replace(pattern, replacement);
        replacedCount += matches.length;
      }
    });
    
    // Intentar inferir tipos basados en nombres de variables
    Object.entries(config.commonInterfaces).forEach(([varName, interfaceName]) => {
      const varPattern = new RegExp(`(const|let|var|function|\\(|,)\\s*(${varName})\\s*:\\s*any\\b`, 'g');
      const matches = content.match(varPattern);
      if (matches) {
        content = content.replace(varPattern, `$1 $2: ${interfaceName}`);
        replacedCount += matches.length;
      }
    });
    
    // Guardar cambios si se hicieron reemplazos y estamos en modo fix
    if (content !== originalContent && config.shouldFix) {
      fs.writeFileSync(filePath, content, 'utf8');
      stats.filesModified++;
      stats.anyTypesReplaced += replacedCount;
      console.log(`✅ Modificado: ${path.relative(config.rootDir, filePath)} (${replacedCount}/${anyCount} tipos any reemplazados)`);
    } else if (anyCount > 0) {
      console.log(`🔍 Analizado: ${path.relative(config.rootDir, filePath)} (${anyCount} tipos any encontrados)`);
    }
  } catch (error) {
    stats.errors++;
    console.error(`❌ Error procesando ${filePath}:`, error.message);
  }
}

/**
 * Función principal
 */
function main() {
  console.log('🔍 Buscando archivos TypeScript...');
  
  // Determinar directorio de inicio
  const startDir = config.specificPath 
    ? path.resolve(config.rootDir, config.specificPath)
    : config.rootDir;
  
  // Encontrar archivos TypeScript
  let tsFiles = findTypeScriptFiles(startDir);
  
  // Limitar cantidad de archivos si es necesario
  if (tsFiles.length > config.maxFilesToProcess) {
    console.log(`⚠️ Encontrados ${tsFiles.length} archivos. Limitando a ${config.maxFilesToProcess} para evitar sobrecarga.`);
    tsFiles = tsFiles.slice(0, config.maxFilesToProcess);
  } else {
    console.log(`🔍 Encontrados ${tsFiles.length} archivos TypeScript.`);
  }
  
  // Procesar archivos
  console.log(`${config.shouldFix ? '🛠️ Corrigiendo' : '🔍 Analizando'} tipos 'any'...`);
  tsFiles.forEach(file => {
    processFile(file);
    stats.filesScanned++;
  });
  
  // Mostrar estadísticas
  console.log('\n📊 Estadísticas:');
  console.log(`- Archivos escaneados: ${stats.filesScanned}`);
  console.log(`- Archivos con 'any': ${stats.filesModified}`);
  console.log(`- Total de tipos 'any' encontrados: ${stats.anyTypesFound}`);
  
  if (config.shouldFix) {
    console.log(`- Tipos 'any' reemplazados: ${stats.anyTypesReplaced}`);
    console.log(`- Porcentaje corregido: ${Math.round((stats.anyTypesReplaced / stats.anyTypesFound) * 100)}%`);
  }
  
  if (stats.errors > 0) {
    console.log(`- Errores: ${stats.errors}`);
  }
  
  // Instrucciones finales
  if (!config.shouldFix && stats.anyTypesFound > 0) {
    console.log('\n💡 Para corregir automáticamente los tipos, ejecuta:');
    console.log('  node scripts/fix-any-types.js --fix');
  } else if (config.shouldFix && stats.anyTypesReplaced > 0) {
    console.log('\n⚠️ Recomendación: Ejecuta "ng lint" para verificar que no se hayan introducido nuevos errores.');
  }
}

// Ejecutar script
main(); 