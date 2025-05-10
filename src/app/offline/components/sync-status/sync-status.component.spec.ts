import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { BehaviorSubject } from 'rxjs';

import { SyncStatusComponent } from './sync-status.component';
import { SyncService } from '../../services/sync.service';
import { OfflineStorageService } from '../../services/offline-storage.service';
import { ConnectionService } from '../../services/connection.service';
import { SyncStatus } from '../../models/sync-status.enum';

describe('SyncStatusComponent', () => {
  let component: SyncStatusComponent;
  let fixture: ComponentFixture<SyncStatusComponent>;
  let syncServiceMock: jasmine.SpyObj<SyncService>;
  let offlineStorageMock: jasmine.SpyObj<OfflineStorageService>;
  let connectionServiceMock: jasmine.SpyObj<ConnectionService>;
  
  // Subjects para controlar los observables en las pruebas
  let onlineSubject: BehaviorSubject<boolean>;
  let syncStatusSubject: BehaviorSubject<SyncStatus>;
  let operationsCountSubject: BehaviorSubject<number>;

  beforeEach(async () => {
    // Crear mocks de servicios
    onlineSubject = new BehaviorSubject<boolean>(true);
    syncStatusSubject = new BehaviorSubject<SyncStatus>(SyncStatus.SYNCED);
    operationsCountSubject = new BehaviorSubject<number>(0);
    
    syncServiceMock = jasmine.createSpyObj('SyncService', ['forceSync'], {
      syncStatus$: syncStatusSubject.asObservable()
    });
    
    offlineStorageMock = jasmine.createSpyObj('OfflineStorageService', [], {
      operationsCount$: operationsCountSubject.asObservable()
    });
    
    connectionServiceMock = jasmine.createSpyObj('ConnectionService', [], {
      online$: onlineSubject.asObservable()
    });

    await TestBed.configureTestingModule({
      imports: [
        SyncStatusComponent,
        MatIconModule,
        MatTooltipModule,
        MatButtonModule, 
        MatBadgeModule
      ],
      providers: [
        { provide: SyncService, useValue: syncServiceMock },
        { provide: OfflineStorageService, useValue: offlineStorageMock },
        { provide: ConnectionService, useValue: connectionServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SyncStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crear el componente', () => {
    expect(component).toBeTruthy();
  });
  
  it('debe mostrar el icono cloud_done cuando está sincronizado', () => {
    syncStatusSubject.next(SyncStatus.SYNCED);
    onlineSubject.next(true);
    fixture.detectChanges();
    
    const iconElement = fixture.debugElement.query(By.css('mat-icon')).nativeElement;
    expect(iconElement.textContent.trim()).toBe('cloud_done');
  });
  
  it('debe mostrar el icono cloud_off cuando está offline', () => {
    onlineSubject.next(false);
    fixture.detectChanges();
    
    const iconElement = fixture.debugElement.query(By.css('mat-icon')).nativeElement;
    expect(iconElement.textContent.trim()).toBe('cloud_off');
  });
  
  it('debe mostrar el icono sync cuando está sincronizando', () => {
    syncStatusSubject.next(SyncStatus.SYNCING);
    onlineSubject.next(true);
    fixture.detectChanges();
    
    const iconElement = fixture.debugElement.query(By.css('mat-icon')).nativeElement;
    expect(iconElement.textContent.trim()).toBe('sync');
  });
  
  it('debe mostrar badge con el número de operaciones pendientes', () => {
    syncStatusSubject.next(SyncStatus.PENDING);
    operationsCountSubject.next(5);
    fixture.detectChanges();
    
    const buttonElement = fixture.debugElement.query(By.css('button')).nativeElement;
    expect(buttonElement.getAttribute('ng-reflect-mat-badge')).toBe('5');
  });
  
  it('debe llamar a forceSync cuando se hace clic y hay operaciones pendientes', () => {
    syncStatusSubject.next(SyncStatus.PENDING);
    operationsCountSubject.next(3);
    onlineSubject.next(true);
    fixture.detectChanges();
    
    const button = fixture.debugElement.query(By.css('button'));
    button.triggerEventHandler('click', null);
    
    expect(syncServiceMock.forceSync).toHaveBeenCalled();
  });
  
  it('no debe llamar a forceSync cuando se hace clic estando offline', () => {
    syncStatusSubject.next(SyncStatus.PENDING);
    operationsCountSubject.next(3);
    onlineSubject.next(false);
    fixture.detectChanges();
    
    const button = fixture.debugElement.query(By.css('button'));
    button.triggerEventHandler('click', null);
    
    expect(syncServiceMock.forceSync).not.toHaveBeenCalled();
  });
  
  it('debe mostrar color primario cuando está sincronizado', () => {
    syncStatusSubject.next(SyncStatus.SYNCED);
    onlineSubject.next(true);
    fixture.detectChanges();
    
    expect(component.getStatusColor()).toBe('primary');
  });
  
  it('debe mostrar color warn cuando hay error de sincronización', () => {
    syncStatusSubject.next(SyncStatus.ERROR);
    onlineSubject.next(true);
    fixture.detectChanges();
    
    expect(component.getStatusColor()).toBe('warn');
  });
});