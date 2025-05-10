import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ElementHistoryDialogComponent } from './element-history-dialog.component';

describe('ElementHistoryDialogComponent', () => {
  let component: ElementHistoryDialogComponent;
  let fixture: ComponentFixture<ElementHistoryDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ElementHistoryDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ElementHistoryDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
