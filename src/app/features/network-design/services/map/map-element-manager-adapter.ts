import { Injectable } from '@angular/core';
import { Observable, of, Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import { NetworkElement, NetworkConnection } from '../../../../shared/types/network.types';
import { MapElementManagerService } from './map-element-manager.service';
import { LoggerService } from '../../../../core/services/logger.service';
import * as L from 'leaflet';
// Asumimos que no hay una interfaz IMapElementManagerAdapter por ahora, 
// la clase la definirá implícitamente.

@Injectable({
  providedIn: 'root'
})
export class MapElementManagerAdapter {
  
  public elementsChanged: Observable<void>;
  public elementSelected: Observable<NetworkElement | null>; // Permitir null si el servicio puede emitir eso
  public connectionsChanged: Observable<void>; // Nuevo observable

  constructor(
    private elementManagerService: MapElementManagerService,
    private logger: LoggerService
  ) {
    this.logger.debug('[MapElementManagerAdapter] Inicializado');
    this.elementsChanged = this.elementManagerService.elementsChanged;
    // MapElementManagerService.elementSelected emite NetworkElement, si se necesita null, se ajusta aquí o en el servicio.
    // Por ahora, lo mantenemos como NetworkElement según el servicio.
    this.elementSelected = this.elementManagerService.elementSelected.pipe(
        map(element => element ? element : null) // Aseguramos que puede ser null
    );
    this.connectionsChanged = this.elementManagerService.connectionsChanged; // Propagar observable
  }

  addElement(element: NetworkElement): Observable<NetworkElement> {
    this.logger.debug('[MapElementManagerAdapter] addElement', element);
    // addElement en el servicio es void. El servicio ya maneja la creación del ID si es necesario.
    this.elementManagerService.addElement(element); 
    return of(element); // Devolvemos el elemento (con ID si fue generado)
  }

  updateElement(element: NetworkElement): Observable<NetworkElement | null> {
    this.logger.debug('[MapElementManagerAdapter] updateElement', element);
    const success = this.elementManagerService.updateElement(element);
    return of(success ? element : null); 
  }

  removeElement(elementId: string): Observable<boolean> {
    this.logger.debug('[MapElementManagerAdapter] removeElement', elementId);
    const success = this.elementManagerService.removeElement(elementId);
    return of(success);
  }

  getElementById(id: string): Observable<NetworkElement | undefined> {
    this.logger.debug('[MapElementManagerAdapter] getElementById', id);
    const element = this.elementManagerService.getElementById(id);
    return of(element);
  }

  getAllElements(): Observable<NetworkElement[]> {
    this.logger.debug('[MapElementManagerAdapter] getAllElements');
    const elements = this.elementManagerService.getAllElements();
    return of(elements);
  }
  
  getElementsInBounds(bounds: L.LatLngBounds): Observable<NetworkElement[]> {
    this.logger.debug('[MapElementManagerAdapter] getElementsInBounds');
    const elements = this.elementManagerService.getElementsInBounds(bounds);
    return of(elements);
  }

  getAllConnections(): Observable<NetworkConnection[]> {
    this.logger.debug('[MapElementManagerAdapter] getAllConnections');
    const connections = this.elementManagerService.getAllConnections();
    return of(connections);
  }

  addConnection(connection: NetworkConnection): Observable<NetworkConnection> {
    this.logger.debug('[MapElementManagerAdapter] addConnection', connection);
    this.elementManagerService.addConnection(connection);
    return of(connection); // Devolvemos la conexión
  }

  // Podríamos añadir un método para cargar elementos si el adaptador lo necesita
  loadElementsProgressively(options: import('./map-element-manager.service').ElementLoadOptions): Observable<import('./map-element-manager.service').ElementLoadResult> {
    this.logger.debug('[MapElementManagerAdapter] loadElementsProgressively', options);
    return this.elementManagerService.loadElementsProgressively(options);
  }

  clearAllElements(): Observable<void> {
    this.logger.debug('[MapElementManagerAdapter] clearAllElements');
    this.elementManagerService.clear();
    return of(undefined);
  }

  selectElement(elementId: string): void {
    this.logger.debug('[MapElementManagerAdapter] selectElement', elementId);
    this.elementManagerService.selectElement(elementId);
  }
}

/**
 * Filtra elementos utilizando un DTO de filtros.
 */ 
