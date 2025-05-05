import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  ViewChild,
  ElementRef,
  OnDestroy,
  AfterViewInit,
  inject
} from '@angular/core';
import { CommonModule }    from '@angular/common';
import { MatCardModule }   from '@angular/material/card';
import { MatDividerModule} from '@angular/material/divider';
import { MatListModule }   from '@angular/material/list'; 
import {
  Chart,
  ChartData,
  ChartOptions,
  registerables
} from 'chart.js';
import { Commodity } from '../../../models/commodity.model';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { TranslatePipe } from '@ngx-translate/core';

Chart.register(...registerables);

@Component({
  selector: 'app-commodity',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatDividerModule,
    MatListModule,
    MatButtonModule,RouterModule, TranslatePipe,
  ],
  templateUrl: './commodity.component.html',
  styleUrl: './commodity.component.scss'
})
export class CommodityComponent implements OnChanges, OnDestroy, AfterViewInit {
  private router = inject(Router);
  @Input() commodity!: Commodity;
  @ViewChild('chart') canvas!: ElementRef<HTMLCanvasElement>;
  private chart?: Chart;
  ngAfterViewInit() {
    if (this.commodity) {
      this.renderChart();
    }
  }
  ngOnChanges(changes: SimpleChanges) {
    if (this.chart && changes['commodity'] && this.canvas) {
      this.renderChart();
    }
  }

  private renderChart() {
    const hist = this.commodity.historical.slice(-7);
    const labels = hist.map(h => h.date.toLocaleDateString());
    const prices = hist.map(h => h.price);
    const volumes = hist.map(h => h.volume);
    const ctx = this.canvas.nativeElement.getContext('2d')!;
    this.chart?.destroy();
    this.chart = new Chart(ctx, {
      type: 'bar',
      data: <ChartData<'bar'>>{
        labels,
        datasets: [
          {
            type: 'line',
            label: 'Price',
            data: prices,
            borderColor: '#1976d2',
            yAxisID: 'y-price'
          },
          {
            type: 'bar',
            label: 'Volume',
            data: volumes,
            backgroundColor: 'rgba(255,152,0,0.6)',
            yAxisID: 'y-volume'
          }
        ]
      },
      options: <ChartOptions>{
        responsive: true,
        scales: {
          'y-price': {
            type: 'linear',
            position: 'left',
            beginAtZero: true
          },
          'y-volume': {
            type: 'linear',
            position: 'right',
            beginAtZero: true
          }
        },
        plugins: {
          legend: { position: 'bottom' }
        }
      }
    });
  }
   
  ngOnDestroy() {
    this.chart?.destroy();
  }
}
