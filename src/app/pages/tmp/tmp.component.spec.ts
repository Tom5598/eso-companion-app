import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TmpComponent } from './tmp.component';

describe('TmpComponent', () => {
  let component: TmpComponent;
  let fixture: ComponentFixture<TmpComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TmpComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TmpComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
