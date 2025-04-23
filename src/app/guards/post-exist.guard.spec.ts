import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { postExistGuard } from './post-exist.guard';

describe('postExistGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => postExistGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
