import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommodityDetailComponent } from './commodity-detail.component';

describe('CommodityDetailComponent', () => {
  let component: CommodityDetailComponent;
  let fixture: ComponentFixture<CommodityDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommodityDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CommodityDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
