import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { surveyGuard } from './survey.guard';

describe('surveyGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => surveyGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
