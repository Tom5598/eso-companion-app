import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AuthService } from './auth.service';
import { Survey, SurveyAnswerEntry, SurveyDefinition, UserSurveyAnswers } from '../models/survey.model';
import { from, Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class SurveyService {
  private readonly DOC_ID = 'responses';
  constructor(
    private afs: AngularFirestore,
    private auth: AuthService
  ) {}
  getAll(): Observable<SurveyDefinition[]> {
    return this.afs
      .collection<SurveyDefinition>('surveys', ref => ref.orderBy('createdAt', 'desc'))
      .valueChanges({ idField: 'id' })
      .pipe(
        map(arr => arr.map(s => ({ ...s, createdAt: (s.createdAt as any).toDate() })))
      );
  }

  getOne(id: string): Observable<SurveyDefinition | undefined> {
    return this.afs
      .doc<SurveyDefinition>(`surveys/${id}`)
      .valueChanges({ idField: 'id' })
      .pipe(
        map(s => s ? { ...s, createdAt: (s.createdAt as any).toDate() } : undefined)
      );
  }

  getUserAnswers(uid: string): Observable<UserSurveyAnswers | null> {
    return this.afs
      .doc<UserSurveyAnswers>(`users/${uid}/surveyanswers/${this.DOC_ID}`)
      .valueChanges({ idField: 'id' })
      .pipe(
        map(doc => {
          if (!doc) return null;
          const entries: Record<string, SurveyAnswerEntry> = {};
          for (const [sid, e] of Object.entries(doc.entries || {})) {
            entries[sid] = {
              completed: e.completed,
              completedAt: (e.completedAt as any).toDate(),
              responses: e.responses
            };
          }
          return { id: doc.id, entries };
        })
      );
  }

  submit(uid: string, surveyId: string, responses: number[]): Observable<void> {
    const docRef = this.afs.doc(`users/${uid}/surveyanswers/${this.DOC_ID}`);
    const payload = {
      entries: {
        [surveyId]: {
          completed: true,
          completedAt: new Date(),
          responses
        }
      }
    };
    return from(docRef.set(payload, { merge: true }));
  }
}
