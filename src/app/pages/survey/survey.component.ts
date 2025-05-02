import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router }    from '@angular/router';
import { AuthService }       from '../../services/auth.service';
import { SurveyService }     from '../../services/survey.service';
import { Survey }            from '../../models/survey.model';
import { Observable, of }    from 'rxjs';
import { switchMap }         from 'rxjs/operators';
import { CommonModule }      from '@angular/common';
import { MatCardModule }     from '@angular/material/card';
import { MatListModule }     from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import {MatSliderModule} from '@angular/material/slider';
import { MatIcon } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslatePipe } from '@ngx-translate/core';
@Component({
  selector: 'app-survey',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatListModule, MatButtonModule, FormsModule, MatSlideToggleModule,MatSliderModule, ReactiveFormsModule,
    MatIcon, MatTooltipModule, TranslatePipe,
  ],
  templateUrl: './survey.component.html',
  styleUrl: './survey.component.scss'
})
export class SurveyComponent implements OnInit {
  survey?: Survey;
  currentIndex = 0;
  form!: FormGroup;
  responses: number[] = [];

  constructor(
    private route: ActivatedRoute,
    private auth: AuthService,
    private fb: FormBuilder,
    private surveySvc: SurveyService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('surveyId')!;
    this.auth.getCurrentUser()
      .pipe(switchMap(u => (u ? this.surveySvc.getDefinition(id) : of(undefined))))
      .subscribe(s => {
        if (!s) {
          this.router.navigate(['/profile']);
          return;
        }
        this.survey = s;
        // initialize responses
        this.responses = new Array(s.questions.length).fill(5);
      });
  }

  prev(): void {
    if (this.currentIndex > 0) {
      this.currentIndex--;
    }
  }

  next(): void {
    if (this.survey && this.currentIndex < this.survey.questions.length - 1) {
      this.currentIndex++;
    }
  }

  submit(): void {
    if (!this.survey) return;
    this.auth
      .getCurrentUser()
      .pipe(switchMap(u => (u ? this.surveySvc.submitAnswers(u.uid, this.survey!.id, this.responses) : of(null))))
      .subscribe(() => this.router.navigate(['/profile']));
  }

  cancel(): void {
    this.router.navigate(['/profile']);
  }
}
