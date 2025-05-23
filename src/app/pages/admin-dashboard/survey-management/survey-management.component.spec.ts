import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SurveyManagementComponent } from './survey-management.component';

describe('SurveyManagementComponent', () => {
  let component: SurveyManagementComponent;
  let fixture: ComponentFixture<SurveyManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SurveyManagementComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SurveyManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
