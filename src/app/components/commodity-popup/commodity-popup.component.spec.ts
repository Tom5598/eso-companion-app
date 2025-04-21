import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommodityPopupComponent } from './commodity-popup.component';

describe('CommodityPopupComponent', () => {
  let component: CommodityPopupComponent;
  let fixture: ComponentFixture<CommodityPopupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommodityPopupComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CommodityPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
