/**
 * Script para detectar importaciones no utilizadas en el proyecto
 * 
 * Este script analiza los archivos TypeScript del proyecto y detecta importaciones
 * que no se utilizan en el código, ayudando a mejorar la calidad del código.
 * 
 * Uso: node unused-imports-finder.js [--fix] [--path=ruta/específica]
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
};

// Contador de estadísticas
const stats = {
  filesScanned: 0,
  filesModified: 0,
  importsFound: 0,
  unusedImportsFound: 0,
  unusedImportsRemoved: 0,
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
 * Extrae las importaciones de un archivo
 */
function extractImports(content) {
  const importRegex = /import\s+{([^}]+)}\s+from\s+['"]([^'"]+)['"]/g;
  const imports = [];
  let match;
  
  while ((match = importRegex.exec(content)) !== null) {
    const importNames = match[1].split(',').map(name => name.trim().split(' as ')[0]);
    const modulePath = match[2];
    const fullMatch = match[0];
    const startIndex = match.index;
    const endIndex = startIndex + fullMatch.length;
    
    imports.push({
      fullMatch,
      importNames,
      modulePath,
      startIndex,
      endIndex
    });
  }
  
  return imports;
}

/**
 * Verifica si una importación se utiliza en el contenido del archivo
 */
function checkUnusedImports(content, imports) {
  const unusedImports = [];
  
  imports.forEach(importObj => {
    const unusedNames = [];
    
    importObj.importNames.forEach(name => {
      // Excluir nombres de la verificación si son muy cortos (pueden dar falsos positivos)
      if (name.length <= 1) {
        return;
      }
      
      // Buscar el uso del nombre en el contenido, excluyendo la propia declaración de importación
      const contentWithoutImport = 
        content.substring(0, importObj.startIndex) + 
        content.substring(importObj.endIndex);
      
      // Patrones para detectar usos (como variable, tipo, en JSX, etc.)
      const patterns = [
        new RegExp(`\\b${name}\\b`, 'g'),
        new RegExp(`<${name}\\b`, 'g'),
        new RegExp(`</${name}>`, 'g'),
        new RegExp(`@${name}\\b`, 'g'),
        new RegExp(`extends\\s+${name}\\b`, 'g'),
        new RegExp(`implements\\s+${name}\\b`, 'g'),
      ];
      
      // Si no se encuentra ningún uso según los patrones, se considera no utilizado
      const isUnused = !patterns.some(pattern => pattern.test(contentWithoutImport));
      
      if (isUnused) {
        unusedNames.push(name);
      }
    });
    
    if (unusedNames.length > 0) {
      unusedImports.push({
        ...importObj,
        unusedNames
      });
    }
  });
  
  return unusedImports;
}

/**
 * Elimina las importaciones no utilizadas de un archivo
 */
function removeUnusedImports(content, unusedImports) {
  let modifiedContent = content;
  let offset = 0;
  
  unusedImports.forEach(importObj => {
    const { fullMatch, importNames, unusedNames, startIndex, endIndex } = importObj;
    
    // Si todas las importaciones están sin usar, eliminar toda la línea
    if (unusedNames.length === importNames.length) {
      const lineStartIndex = modifiedContent.lastIndexOf('\n', startIndex - offset) + 1;
      const lineEndIndex = modifiedContent.indexOf('\n', endIndex - offset);
      
      modifiedContent = 
        modifiedContent.substring(0, lineStartIndex) + 
        modifiedContent.substring(lineEndIndex === -1 ? modifiedContent.length : lineEndIndex);
      
      offset += (lineEndIndex === -1 ? modifiedContent.length : lineEndIndex) - lineStartIndex;
      stats.unusedImportsRemoved += unusedNames.length;
    } 
    // Si solo algunas importaciones están sin usar, modificar la línea
    else {
      const usedNames = importNames.filter(name => !unusedNames.includes(name));
      const newImport = `import { ${usedNames.join(', ')} } from '${importObj.modulePath}'`;
      
      modifiedContent = 
        modifiedContent.substring(0, startIndex - offset) + 
        newImport + 
        modifiedContent.substring(endIndex - offset);
      
      offset += fullMatch.length - newImport.length;
      stats.unusedImportsRemoved += unusedNames.length;
    }
  });
  
  return modifiedContent;
}

/**
 * Procesa un archivo TypeScript para detectar importaciones no utilizadas
 */
function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const imports = extractImports(content);
    stats.importsFound += imports.reduce((total, imp) => total + imp.importNames.length, 0);
    
    if (imports.length === 0) {
      return;
    }
    
    const unusedImports = checkUnusedImports(content, imports);
    const unusedCount = unusedImports.reduce((total, imp) => total + imp.unusedNames.length, 0);
    stats.unusedImportsFound += unusedCount;
    
    if (unusedCount === 0) {
      return;
    }
    
    console.log(`🔍 ${path.relative(config.rootDir, filePath)}: ${unusedCount} importaciones no utilizadas`);
    unusedImports.forEach(imp => {
      console.log(`  - De '${imp.modulePath}': ${imp.unusedNames.join(', ')}`);
    });
    
    if (config.shouldFix) {
      const modifiedContent = removeUnusedImports(content, unusedImports);
      fs.writeFileSync(filePath, modifiedContent, 'utf8');
      stats.filesModified++;
      console.log(`  ✅ Importaciones no utilizadas eliminadas`);
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
  console.log(`${config.shouldFix ? '🛠️ Eliminando' : '🔍 Detectando'} importaciones no utilizadas...`);
  tsFiles.forEach(file => {
    processFile(file);
    stats.filesScanned++;
  });
  
  // Mostrar estadísticas
  console.log('\n📊 Estadísticas:');
  console.log(`- Archivos escaneados: ${stats.filesScanned}`);
  console.log(`- Total de importaciones encontradas: ${stats.importsFound}`);
  console.log(`- Importaciones no utilizadas detectadas: ${stats.unusedImportsFound}`);
  
  if (config.shouldFix) {
    console.log(`- Archivos modificados: ${stats.filesModified}`);
    console.log(`- Importaciones no utilizadas eliminadas: ${stats.unusedImportsRemoved}`);
  }
  
  if (stats.errors > 0) {
    console.log(`- Errores: ${stats.errors}`);
  }
  
  // Instrucciones finales
  if (!config.shouldFix && stats.unusedImportsFound > 0) {
    console.log('\n💡 Para eliminar automáticamente las importaciones no utilizadas, ejecuta:');
    console.log('  node scripts/unused-imports-finder.js --fix');
  } else if (config.shouldFix && stats.unusedImportsRemoved > 0) {
    console.log('\n⚠️ Recomendación: Ejecuta "ng lint" para verificar que no se hayan introducido nuevos errores.');
  }
}

// Ejecutar script
main(); 