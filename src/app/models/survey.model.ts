export interface Survey {
  id: string;
  name: string;
  createdAt: Date;
  completedAt?: Date;
  completed: boolean;
  questions: string[];
  responses?: number[];
}