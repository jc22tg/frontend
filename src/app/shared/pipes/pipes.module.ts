import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FormatPercentagePipe } from './format-percentage.pipe';
import { FilterByTypePipe } from './filter-by-type.pipe';
import { TruncatePipe } from './truncate.pipe';

/**
 * Módulo que agrupa todos los pipes personalizados de la aplicación
 */
@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    // Importar los pipes standalone
    FormatPercentagePipe,
    FilterByTypePipe,
    TruncatePipe
  ],
  exports: [
    // Exportar los pipes para que estén disponibles en los módulos que importen este
    FormatPercentagePipe,
    FilterByTypePipe,
    TruncatePipe
  ]
})
export class PipesModule { } 