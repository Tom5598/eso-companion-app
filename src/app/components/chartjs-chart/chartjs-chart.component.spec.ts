import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChartjsChartComponent } from './chartjs-chart.component';

describe('ChartjsChartComponent', () => {
  let component: ChartjsChartComponent;
  let fixture: ComponentFixture<ChartjsChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChartjsChartComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChartjsChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
