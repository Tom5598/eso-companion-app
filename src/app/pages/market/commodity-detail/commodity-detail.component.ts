import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  OnDestroy,
  AfterViewInit,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { Chart, ChartOptions, ChartData, registerables } from 'chart.js';
import { startWith, Subscription } from 'rxjs';
import { Commodity } from '../../../models/commodity.model';
import { CommodityService } from '../../../services/commodity.service';
import { MatIcon } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';
import { log } from 'three/webgpu';
Chart.register(...registerables);
@Component({
  selector: 'app-commodity-detail',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatSelectModule,
    MatIcon,
    TranslatePipe,
  ],
  templateUrl: './commodity-detail.component.html',
  styleUrl: './commodity-detail.component.scss',
})
export class CommodityDetailComponent implements OnInit, OnDestroy, AfterViewInit, OnChanges {
  @ViewChild('historyCanvas', { static: false })
  historyCtx!: ElementRef<HTMLCanvasElement>;

  @ViewChild('regionCanvas', { static: false })
  regionCtx!: ElementRef<HTMLCanvasElement>;

  commodity?: Commodity;
  daysControl = new FormControl(30);
  private sub = new Subscription();
  private viewReady = false;
  private historyChart?: Chart;
  private regionChart?: Chart;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private svc: CommodityService
  ) {}

  ngOnInit() {
    const name = this.route.snapshot.paramMap.get('name')!;
    this.sub.add(
      this.svc.getByName(name).subscribe((c) => {
        if (!c) {
          this.router.navigate(['/market']);
          return;
        }
        this.commodity = c;
        if (this.viewReady) {
          console.log('Commodity loaded:', c);
          
          this.drawAll();
        }
      })
    );
    // redraw when days toggle changes
    this.sub.add(
      this.daysControl.valueChanges
        .pipe(startWith(this.daysControl.value))
        .subscribe(() => this.drawAll())
    );
  }
  ngAfterViewInit() {
    this.viewReady = true;
    if (this.commodity) {
      this.drawAll();
    }
  }
  ngOnChanges(changes: SimpleChanges) {
    if (changes['commodity'] && this.historyCtx) {
      this.drawAll();
    }
  }
  private drawAll() {
    if (!this.commodity || !this.historyCtx || !this.regionCtx) return;    
    this.drawHistoryChart();
    this.drawRegionScatter();
  }

  private drawHistoryChart() {
    const days = this.daysControl.value ?? 30;
    const hist = this.commodity!.historical.slice(-days);
    const labels = hist.map((h) => h.date.toLocaleDateString());
    const prices = hist.map((h) => h.price);
    const volumes = hist.map((h) => h.volume);

    this.historyChart?.destroy();
    this.historyChart = new Chart(
      this.historyCtx.nativeElement.getContext('2d')!,
      {
        type: 'bar',
        data: <ChartData<'bar'>>{
          labels,
          datasets: [
            {
              type: 'line',
              label: 'Price',
              data: prices,
              borderColor: '#1976d2',
              yAxisID: 'y-price',
            },
            {
              type: 'bar',
              label: 'Volume',
              data: volumes,
              backgroundColor: 'rgba(255,152,0,0.6)',
              yAxisID: 'y-volume',
            },
          ],
        },
        options: <ChartOptions>{
          responsive: true,
          scales: {
            'y-price': { type: 'linear', position: 'left', beginAtZero: true },
            'y-volume': {
              type: 'linear',
              position: 'right',
              beginAtZero: true,
            },
          },
          plugins: { legend: { position: 'bottom' } },
        },
      }
    );
  }

  private drawRegionScatter() {
    const regions = Object.entries(this.commodity!.regionalData);
    const data = regions.map(([region, val]) => ({
      x: val.price,
      y: val.volume,
    }));

    this.regionChart?.destroy();
    this.regionChart = new Chart(
      this.regionCtx.nativeElement.getContext('2d')!,
      {
        type: 'scatter',
        data: <ChartData<'scatter'>>{
          datasets: [
            {
              label: 'Regions',
              data,
              pointRadius: 6,
              pointBackgroundColor: '#4caf50',
            },
          ],
        },
        options: <ChartOptions>{
          responsive: true,
          scales: {
            x: { title: { display: true, text: 'Price' }, beginAtZero: true },
            y: { title: { display: true, text: 'Volume' }, beginAtZero: true },
          },
          plugins: { legend: { display: false } },
        },
      }
    );
  }

  goBack() {
    this.router.navigate(['/market']);
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
    this.historyChart?.destroy();
    this.regionChart?.destroy();
  }
}
