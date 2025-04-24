export interface Survey {
  id: string;
  name: string;
  createdAt: Date;
  questions: string[]; 
}
export interface SurveyDefinition {
  id: string;
  name: string;
  createdAt: Date;
  questions: string[];
}

// src/app/models/survey-answers.model.ts
export interface SurveyAnswerEntry {
  completed: boolean;
  completedAt: Date;
  responses: number[];
}

export interface UserSurveyAnswers {
  id: string;            // e.g. 'responses'
  entries: {
    [surveyId: string]: SurveyAnswerEntry;
  };
}