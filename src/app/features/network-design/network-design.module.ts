import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCardModule } from '@angular/material/card';
import { MatSliderModule } from '@angular/material/slider';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatMenuModule } from '@angular/material/menu';
import { MatListModule } from '@angular/material/list';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { DragDropModule } from '@angular/cdk/drag-drop';

import { SharedModule } from '../../shared/shared.module';
import { NETWORK_DESIGN_ROUTES } from './network-design.routes';
import { ElementEditorComponent } from './components/elements/element-editor/element-editor.component';
import { NetworkDesignLayoutComponent } from './pages/network-design-layout/network-design-layout.component';
import { NetworkMapComponent } from './components/map-container/components/map-view/network-map.component';
import { NetworkToolbarComponent } from './components/network-toolbar/network-toolbar.component';
import { MapContainerComponent } from './components/map-container/map-container.component';
import { LayerControlComponent } from './components/layer-control/layer-control.component';
import { ElementsPanelComponent } from './components/elements/elements-panel/elements-panel.component';
import { ElementPropertiesDialogComponent } from './components/elements/element-details/element-properties-dialog.component';
import { ElementDetailRowComponent } from './components/elements/element-detail-row/element-detail-row.component';
import { MapPositionDialogComponent } from './components/map-position-dialog/map-position-dialog.component';
import { ElementDetailsComponent } from './components/elements/element-details/element-details.component';
import { ConnectionEditorComponent } from './components/connection-editor/connection-editor.component';
import { ElementHistoryComponent } from './components/elements/element-history/element-history.component';
import { ElementHistoryDialogComponent } from './components/elements/element-history-dialog/element-history-dialog.component';

@NgModule({
  declarations: [
    NetworkDesignLayoutComponent,
    NetworkMapComponent,
    NetworkToolbarComponent,
    MapContainerComponent,
    LayerControlComponent,
    ElementsPanelComponent,
    ElementPropertiesDialogComponent,
    ElementDetailRowComponent,
    MapPositionDialogComponent,
    ElementDetailsComponent,
    ElementHistoryComponent,
    ElementHistoryDialogComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(NETWORK_DESIGN_ROUTES),
    HttpClientModule,
    SharedModule,
    // Material modules
    MatDialogModule,
    MatSnackBarModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTabsModule,
    MatCheckboxModule,
    MatSidenavModule,
    MatTooltipModule,
    MatCardModule,
    MatSliderModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatExpansionModule,
    MatMenuModule,
    MatListModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    DragDropModule,
    // Standalone components que se importan aquí para asegurar que estén disponibles
    ElementEditorComponent,
    ConnectionEditorComponent
  ],
  providers: [],
})
export class NetworkDesignModule { } 
