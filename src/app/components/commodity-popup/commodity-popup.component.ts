import { Component, Input } from '@angular/core'; 
import { Commodity } from '../../models/commodity.model'; 
import { CommonModule, CurrencyPipe } from '@angular/common';
import { ChartjsChartComponent } from '../chartjs-chart/chartjs-chart.component';
import { ChartConfiguration } from 'chart.js';

@Component({
  selector: 'app-commodity-popup',
  standalone: true,
  imports: [CurrencyPipe,ChartjsChartComponent,CommonModule],
  templateUrl: './commodity-popup.component.html',
  styleUrl: './commodity-popup.component.scss'
})
export class CommodityPopupComponent  {
  @Input() commodity!: Commodity;
  @Input() config!: ChartConfiguration<'line'>;  
  constructor( ) {}
}
