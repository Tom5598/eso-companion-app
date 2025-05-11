import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatCard, MatCardModule } from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';
import { MatInputModule, MatLabel } from '@angular/material/input';
import { MatListItem, MatListModule } from '@angular/material/list';
import { Observable } from 'rxjs';
import { SurveyDefinition } from '../../../models/survey.model';
import { SurveyService } from '../../../services/survey.service';
import { MatButtonModule } from '@angular/material/button';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-survey-management',
  standalone: true,
  imports: [
    MatInputModule,
    MatLabel,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatListModule,MatListItem,
    MatIcon,
    MatButtonModule,
    TranslatePipe,
  ],
  templateUrl: './survey-management.component.html',
  styleUrl: './survey-management.component.scss',
})
export class SurveyManagementComponent implements OnInit {
  surveyForm!: FormGroup;
  definitions$!: Observable<SurveyDefinition[]>;

  constructor(private fb: FormBuilder, private surveySvc: SurveyService) {}

  ngOnInit() {
    // Build form
    this.surveyForm = this.fb.group({
      name: ['', Validators.required],
      questions: this.fb.array([this.fb.control('', Validators.required)]),
    });

    // Load existing definitions
    this.definitions$ = this.surveySvc.getDefinitions();
  }

  get questions(): FormArray {
    return this.surveyForm.get('questions') as FormArray;
  }
  /**
   * @description Add a new question to the form
   */
  addQuestion() {
    this.questions.push(this.fb.control('', Validators.required));
  }

  /**
   * @description Remove a question from the form
   * @param index The index of the question to remove
   */
  removeQuestion(index: number) {
    if (this.questions.length > 1) {
      this.questions.removeAt(index);
    }
  }
  /**
   * @description Toggle the hidden state of a survey definition
   * @param def The survey definition to toggle
   */
  toggleHidden(def: SurveyDefinition) {
    if (def.isHidden) {
      this.surveySvc.unhideDefinition(def.id).subscribe();
    } else {
      this.surveySvc.hideDefinition(def.id).subscribe();
    }
  }
  /**
   * @description Create a new survey definition
   */
  createDefinition() {
    if (this.surveyForm.invalid) return;
    const { name, questions } = this.surveyForm.value;
    this.surveySvc
      .addDefinition({
        name,
        questions,
        createdAt: new Date(),
      })
      .subscribe(() => {
        this.surveyForm.reset();
        // reset questions array
        while (this.questions.length) this.questions.removeAt(0);
        this.addQuestion();
      });
  }
}
