import { TestBed } from '@angular/core/testing';

import { LoadoutService } from './loadout.service';

describe('LoadoutService', () => {
  let service: LoadoutService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LoadoutService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
