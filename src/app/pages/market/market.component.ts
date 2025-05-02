import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule }       from '@angular/common';
import { MatCardModule }      from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule }     from '@angular/material/input';
import { MatSelectModule }    from '@angular/material/select';
import { MatButtonModule }    from '@angular/material/button';

import { CommodityService } from '../../services/commodity.service';
import { Commodity, CommodityFilter }    from '../../models/commodity.model';
import { Observable }   from 'rxjs'; 
import { CommodityComponent } from './commodity/commodity.component';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-market',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    CommodityComponent,
    TranslatePipe,
  ],
  templateUrl: './market.component.html',
  styleUrl: './market.component.scss'
})
export class MarketComponent  implements OnInit {
  form!: FormGroup;
  resultsOptions = [25, 50, 100];
  commodities$!: Observable<Commodity[]>;

  constructor(
    private fb: FormBuilder,
    private commoditySvc: CommodityService
  ) {}

  ngOnInit() {
    this.form = this.fb.group({
      name:      [''],
      minPrice:  [null],
      maxPrice:  [null],
      minVolume: [null],
      maxVolume: [null],
      limit:     [10]
    });
    this.search();
  }

  search() {
    const f: CommodityFilter = this.form.value;
    this.commodities$ = this.commoditySvc.queryCommodities(f);
  }
}
