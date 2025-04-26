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
  isHidden?: boolean;
  questions: string[];
}
export interface SurveyAnswerEntry {
  completed: boolean;
  completedAt: Date;
  responses: number[];
}
export interface UserSurveyAnswers {
  id: string;
  entries: { [surveyId: string]: SurveyAnswerEntry };
}
