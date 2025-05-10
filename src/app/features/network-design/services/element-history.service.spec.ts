import { TestBed } from '@angular/core/testing';

import { ElementHistoryService } from './element-history.service';

describe('ElementHistoryService', () => {
  let service: ElementHistoryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ElementHistoryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
