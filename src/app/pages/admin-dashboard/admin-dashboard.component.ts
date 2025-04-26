import { Component, inject, OnInit } from '@angular/core';
import { SurveyService } from '../../services/survey.service';
import { UserService } from '../../services/user.service';
import { CommonModule } from '@angular/common';
import { MatTab, MatTabGroup, MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormArray, FormBuilder, FormControl, FormControlName, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminService } from '../../services/admin.service';
import { MatInputModule } from '@angular/material/input';
import { debounceTime, distinctUntilChanged, forkJoin, Observable, of, startWith, switchMap, take } from 'rxjs';
import { User } from '../../models/user.model';
import { MatListModule } from '@angular/material/list';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatIcon, MatIconModule } from '@angular/material/icon';
import { SurveyAnswerEntry, SurveyDefinition } from '../../models/survey.model';
import { ChartData, ChartOptions, ChartType } from 'chart.js';
import { MatOptionModule } from '@angular/material/core';
import { RouterModule } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { BreakpointObserver } from '@angular/cdk/layout';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatSidenavModule,
    MatToolbarModule,
    MatIconModule,
    MatListModule,
    MatIcon,
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss'
})
export class AdminDashboardComponent   {
  private bo   = inject(BreakpointObserver);
  showFilters = true; 
  constructor( 
  ) {
    this.bo
      .observe('(max-width: 700px)')
      .subscribe(state => this.showFilters = !state.matches);
  }

  toggleFilters() {
    this.showFilters = !this.showFilters;
  }
  
}
