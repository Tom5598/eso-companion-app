import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  OnDestroy
} from '@angular/core';
import { CommonModule }      from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule }     from '@angular/material/card';
import { MatFormFieldModule} from '@angular/material/form-field';
import { MatSelectModule }   from '@angular/material/select';
import { MatInputModule }    from '@angular/material/input';
import { MatButtonModule }   from '@angular/material/button';
import { Chart, ChartOptions, ChartData, registerables  } from 'chart.js';
import { Observable, Subscription, forkJoin, of }     from 'rxjs';
import { switchMap, take, map }           from 'rxjs/operators';
import { SurveyDefinition } from '../../../models/survey.model';
import { SurveyService } from '../../../services/survey.service';
 
@Component({
  selector: 'app-statistics',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule
  ],
  templateUrl: './statistics.component.html',
  styleUrl: './statistics.component.scss'
})
export class StatisticsComponent implements OnInit, OnDestroy {
  @ViewChild('canvas', { static: true }) canvas!: ElementRef<HTMLCanvasElement>;
  form!: FormGroup;  
  private sub!: Subscription;
  private chart?: Chart;
  surveyDefs$!: Observable<SurveyDefinition[]>;
  constructor(
    private fb: FormBuilder,
    private surveySvc: SurveyService
  ) {}

  ngOnInit() {
    Chart.register(...registerables);
    // build form
    this.form = this.fb.group({
      survey: ['', Validators.required]
    });
    this.surveyDefs$ = this.surveySvc.getDefinitions();
    // on survey change, fetch definition + all responses
    this.sub = this.form.get('survey')!.valueChanges
      .pipe(
        switchMap((surveyId: string) => {
          if (!surveyId) return of(null);
          return forkJoin({
            def: this.surveySvc
                    .getDefinitions()
                    .pipe(
                      map(arr => arr.find(s => s.id === surveyId)),
                      take(1)
                    ),
            resps: this.surveySvc.getAllResponses(surveyId).pipe(take(1))
          });
        })
      )
      .subscribe(data => {
        if (!data?.def) {
          this.destroyChart();
          return;
        }
        this.buildChart(data.def, data.resps);
      });
  }

  private buildChart(
    def: SurveyDefinition,
    resps: number[][]
  ) {
    // compute means and stddevs
    const qCount = def.questions.length;
    const means = Array(qCount).fill(0);
    const vars  = Array(qCount).fill(0);

    resps.forEach(r =>
      r.forEach((v,i) => (means[i] += v))
    );
    if (resps.length) {
      for (let i = 0; i < qCount; i++) {
        means[i] /= resps.length;
      }
      resps.forEach(r =>
        r.forEach((v,i) => {
          const diff = v - means[i];
          vars[i] += diff*diff;
        })
      );
      for (let i = 0; i < qCount; i++) {
        vars[i] = Math.sqrt(vars[i]/resps.length);
      }
    }

    // destroy old chart if any
    this.destroyChart();

    // draw new
    const ctx = this.canvas.nativeElement.getContext('2d')!;
    this.chart = new Chart(ctx, {
      type: 'bar',
      data: <ChartData<'bar'>>{
        labels: def.questions,
        datasets: [
          {
            label: 'Average',
            data: means,
            backgroundColor: 'rgba(54,162,235,0.6)'
          },
          {
            label: 'Std Dev',
            data: vars,
            backgroundColor: 'rgba(255,99,132,0.6)'
          }
        ]
      },
      options: <ChartOptions>{
        responsive: true,
        scales: {
          y: { beginAtZero: true, max: 10 }
        },
        plugins: {
          legend: { position: 'bottom' }
        }
      }
    });
  }

  private destroyChart() {
    if (this.chart) {
      this.chart.destroy();
      this.chart = undefined;
    }
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
    this.destroyChart();
  }
}
