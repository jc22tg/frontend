/**
 * Script para verificar y mejorar la accesibilidad en componentes Angular
 * 
 * Este script analiza los archivos HTML y TypeScript de los componentes
 * y detecta problemas comunes de accesibilidad.
 * 
 * Uso: node accessibility-check.js [--fix] [--path=ruta/específica]
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
  fileExtensions: ['.html', '.component.ts'],
  maxFilesToProcess: 50, // Limitar la cantidad de archivos para evitar sobrecarga
};

// Contador de estadísticas
const stats = {
  filesScanned: 0,
  filesModified: 0,
  issuesFound: 0,
  issuesFixed: 0,
  errors: 0
};

// Reglas de accesibilidad
const accessibilityRules = [
  {
    name: 'click-events-have-key-events',
    description: 'Los eventos de clic deben tener eventos de teclado correspondientes',
    pattern: /(click)\s*=\s*["'](?!.*keydown)(?!.*keyup)(?!.*keypress)/g,
    fix: (match) => match.replace(/\(click\)="([^"]+)"/g, '(click)="$1" (keydown.enter)="$1"'),
    applyToFiles: ['.html', '.component.ts']
  },
  {
    name: 'interactive-supports-focus',
    description: 'Los elementos interactivos deben poder recibir foco',
    pattern: /<div\b[^>]*\(click\)[^>]*>|<span\b[^>]*\(click\)[^>]*>/g,
    fix: (match) => {
      if (match.includes('tabindex')) {
        return match;
      }
      return match.replace(/(<div|<span)([^>]*)(>)/, '$1$2 tabindex="0"$3');
    },
    applyToFiles: ['.html']
  },
  {
    name: 'missing-aria-labels',
    description: 'Elementos interactivos sin etiquetas ARIA',
    pattern: /<(button|a)[^>]*(?!aria-label)(?!aria-labelledby)[^>]*>/g,
    fix: null, // No hay fix automático, requiere revisión manual
    applyToFiles: ['.html']
  },
  {
    name: 'img-missing-alt',
    description: 'Imágenes sin atributo alt',
    pattern: /<img[^>]*(?!alt=)[^>]*>/g,
    fix: (match) => {
      if (match.includes('alt=')) {
        return match;
      }
      // Intentar extraer un nombre de archivo para usar como alt
      const srcMatch = match.match(/src\s*=\s*["']([^"']+)["']/);
      const altText = srcMatch ? path.basename(srcMatch[1], path.extname(srcMatch[1])).replace(/[-_]/g, ' ') : 'imagen';
      return match.replace(/(<img[^>]*)>/, `$1 alt="${altText}">`);
    },
    applyToFiles: ['.html']
  },
  {
    name: 'form-missing-labels',
    description: 'Campos de formulario sin etiquetas',
    pattern: /<(input|textarea|select)[^>]*(?!aria-label)(?!aria-labelledby)(?!hidden)[^>]*>/g,
    fix: null, // No hay fix automático, requiere revisión manual
    applyToFiles: ['.html']
  },
  {
    name: 'no-output-native',
    description: 'Output bindings con nombres nativos del DOM',
    pattern: /@Output\(\)\s+(click|focus|blur|change|input|submit|reset|load|unload|error)\s*:/g,
    fix: (match, eventName) => match.replace(`@Output() ${eventName}`, `@Output() ${eventName}Change`),
    applyToFiles: ['.component.ts']
  },
  {
    name: 'no-output-on-prefix',
    description: 'Output bindings con prefijo "on"',
    pattern: /@Output\(\)\s+on[A-Z]/g,
    fix: (match) => {
      const eventName = match.match(/@Output\(\)\s+(on[A-Z]\w*)/)[1];
      const newName = eventName.slice(2, 3).toLowerCase() + eventName.slice(3);
      return match.replace(eventName, newName);
    },
    applyToFiles: ['.component.ts']
  },
  {
    name: 'accessible-routing-links',
    description: 'Enlaces de navegación sin texto accesible',
    pattern: /<a\s+[^>]*routerLink[^>]*>(?!.*\S+.*)<\/a>/g,
    fix: null, // No hay fix automático, requiere revisión manual
    applyToFiles: ['.html']
  }
];

/**
 * Encuentra todos los archivos en el directorio especificado
 */
function findFiles(dir, fileList = []) {
  if (config.excludeDirs.some(excluded => dir.includes(excluded))) {
    return fileList;
  }
  
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      findFiles(filePath, fileList);
    } else if (config.fileExtensions.some(ext => file.includes(ext))) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

/**
 * Procesa un archivo para detectar problemas de accesibilidad
 */
function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const fileExt = path.extname(filePath);
    const isComponent = filePath.includes('.component.ts');
    
    let hasIssues = false;
    let modifiedContent = content;
    const issues = [];
    
    // Aplicar reglas aplicables a este tipo de archivo
    accessibilityRules.forEach(rule => {
      const fileType = isComponent ? '.component.ts' : fileExt;
      if (!rule.applyToFiles.includes(fileType)) {
        return;
      }
      
      const matches = content.match(rule.pattern);
      if (!matches) {
        return;
      }
      
      hasIssues = true;
      stats.issuesFound += matches.length;
      
      issues.push({
        rule: rule.name,
        description: rule.description,
        count: matches.length
      });
      
      // Aplicar corrección si está habilitada y hay un método de corrección disponible
      if (config.shouldFix && rule.fix) {
        modifiedContent = modifiedContent.replace(rule.pattern, (match, ...args) => {
          stats.issuesFixed++;
          return rule.fix(match, ...args);
        });
      }
    });
    
    if (hasIssues) {
      console.log(`🔍 ${path.relative(config.rootDir, filePath)}:`);
      issues.forEach(issue => {
        console.log(`  - ${issue.rule}: ${issue.description} (${issue.count} ocurrencias)`);
      });
      
      if (config.shouldFix && modifiedContent !== content) {
        fs.writeFileSync(filePath, modifiedContent, 'utf8');
        stats.filesModified++;
        console.log(`  ✅ Problemas corregidos automáticamente`);
      } else if (config.shouldFix) {
        console.log(`  ⚠️ Algunos problemas requieren corrección manual`);
      }
    }
    
    return hasIssues;
  } catch (error) {
    stats.errors++;
    console.error(`❌ Error procesando ${filePath}:`, error.message);
    return false;
  }
}

/**
 * Función principal
 */
function main() {
  console.log('🔍 Buscando archivos de componentes...');
  
  // Determinar directorio de inicio
  const startDir = config.specificPath 
    ? path.resolve(config.rootDir, config.specificPath)
    : config.rootDir;
  
  // Encontrar archivos
  let files = findFiles(startDir);
  
  // Limitar cantidad de archivos si es necesario
  if (files.length > config.maxFilesToProcess) {
    console.log(`⚠️ Encontrados ${files.length} archivos. Limitando a ${config.maxFilesToProcess} para evitar sobrecarga.`);
    files = files.slice(0, config.maxFilesToProcess);
  } else {
    console.log(`🔍 Encontrados ${files.length} archivos para análisis.`);
  }
  
  // Procesar archivos
  console.log(`${config.shouldFix ? '🛠️ Corrigiendo' : '🔍 Detectando'} problemas de accesibilidad...`);
  
  const filesWithIssues = files.filter(file => {
    const hasIssues = processFile(file);
    stats.filesScanned++;
    return hasIssues;
  });
  
  // Mostrar estadísticas
  console.log('\n📊 Estadísticas:');
  console.log(`- Archivos escaneados: ${stats.filesScanned}`);
  console.log(`- Archivos con problemas: ${filesWithIssues.length}`);
  console.log(`- Problemas encontrados: ${stats.issuesFound}`);
  
  if (config.shouldFix) {
    console.log(`- Archivos modificados: ${stats.filesModified}`);
    console.log(`- Problemas corregidos: ${stats.issuesFixed}`);
    console.log(`- Problemas pendientes: ${stats.issuesFound - stats.issuesFixed}`);
  }
  
  if (stats.errors > 0) {
    console.log(`- Errores: ${stats.errors}`);
  }
  
  // Recomendaciones finales
  if (!config.shouldFix && stats.issuesFound > 0) {
    console.log('\n💡 Para corregir automáticamente los problemas, ejecuta:');
    console.log('  node scripts/accessibility-check.js --fix');
    console.log('\n⚠️ Nota: Algunos problemas requieren corrección manual.');
  } else if (stats.issuesFound - stats.issuesFixed > 0) {
    console.log('\n⚠️ Algunos problemas requieren corrección manual. Revisa los archivos marcados.');
  }
  
  // Mostrar conformidad WCAG si corresponde
  if (filesWithIssues.length === 0) {
    console.log('\n✅ ¡Felicidades! No se encontraron problemas de accesibilidad en los archivos analizados.');
  } else {
    console.log('\n📋 Recomendaciones generales para accesibilidad:');
    console.log('- Asegúrate de que todos los elementos interactivos sean accesibles mediante teclado');
    console.log('- Proporciona textos alternativos para imágenes y elementos visuales');
    console.log('- Utiliza roles ARIA y etiquetas adecuadas para explicar la funcionalidad');
    console.log('- Verifica el contraste de colores para texto y controles');
    console.log('- Asegúrate de que la navegación sea lógica en el orden de tabulación');
  }
}

// Ejecutar script
main(); 