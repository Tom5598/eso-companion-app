import { AfterViewInit, Component, ElementRef, Input, ViewChild } from '@angular/core';
import { Chart, ChartConfiguration } from 'chart.js/auto';
@Component({
  selector: 'app-chartjs-chart',
  standalone: true,
  imports: [],
  templateUrl: './chartjs-chart.component.html',
  styleUrl: './chartjs-chart.component.scss'
})
export class ChartjsChartComponent implements AfterViewInit {
  @ViewChild('canvas') canvas!: ElementRef<HTMLCanvasElement>;
  @Input() config!: ChartConfiguration;

  private chart!: Chart;

  ngAfterViewInit() {
    this.chart = new Chart(this.canvas.nativeElement, this.config);
  }

}
