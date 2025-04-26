import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AuthService } from './auth.service';
import { Survey, SurveyAnswerEntry, SurveyDefinition, UserSurveyAnswers } from '../models/survey.model';
import { from, Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class SurveyService {
  private readonly ANSWERS_DOC = 'responses';
  constructor(
    private afs: AngularFirestore,
    private auth: AuthService
  ) {}
  /** Get all survey definitions */
  getDefinitions(): Observable<SurveyDefinition[]> {
    return this.afs
      .collection<SurveyDefinition>('surveys', ref =>
        ref.orderBy('createdAt', 'desc')
      )
      .valueChanges({ idField: 'id' })
      .pipe(
        map(arr =>
          arr.map(s => ({
            ...s,
            createdAt: (s.createdAt as any).toDate()
          }))
        )
      );
  }
  getVisibleDefinitions(): Observable<SurveyDefinition[]> {
    return this.afs
      .collection<SurveyDefinition>('surveys', ref =>
        ref.where("isHidden","==",false).orderBy('createdAt', 'desc')
      )
      .valueChanges({ idField: 'id' })
      .pipe(
        map(arr =>
          arr.map(s => ({
            ...s,
            createdAt: (s.createdAt as any).toDate()
          }))
        )
      );
  }
  /** Add a new survey definition */
  addDefinition(def: Omit<SurveyDefinition, 'id'>): Observable<void> {
    const survey:SurveyDefinition ={
      name: def.name,
      questions: def.questions,
      createdAt: def.createdAt,
      isHidden: false,
      id: this.afs.createId()
    }
    return from(
      this.afs.collection<SurveyDefinition>('surveys')
        .add(survey)
        .then(() => {})
    );
  }
  hideDefinition(id: string): Observable<void> {
    return from(
      this.afs.doc(`surveys/${id}`).update({ isHidden: true })
    );
  }

  /** Unhide a survey */
  unhideDefinition(id: string): Observable<void> {
    return from(
      this.afs.doc(`surveys/${id}`).update({ isHidden: false })
    );
  }
  /** Get a single survey definition by ID */
  getDefinition(id: string): Observable<SurveyDefinition | undefined> {
    return this.afs
      .doc<SurveyDefinition>(`surveys/${id}`)
      .valueChanges({ idField: 'id' })
      .pipe(
        map(s =>
          s
            ? { ...s, createdAt: (s.createdAt as any).toDate() }
            : undefined
        )
      );
  }

  // === User Survey Answers ===

  /** Get all survey answers for a user */
  getUserAnswers(uid: string): Observable<UserSurveyAnswers | null> {
    return this.afs
      .doc<UserSurveyAnswers>(`users/${uid}/surveyanswers/${this.ANSWERS_DOC}`)
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
  /**
   * Fetch _every_ user's surveyanswers doc, then extract
   * the responses array for the given surveyId (only if completed).
   */
  getAllResponses(surveyId: string): Observable<number[][]> {
    return this.afs
      .collectionGroup<{ entries: Record<string, any> }>('surveyanswers')
      .valueChanges()
      .pipe(
        map(docs =>
          docs
            // pull out the specific entry for this surveyId
            .map(d => d.entries?.[surveyId])
            // only keep completed ones
            .filter(e => e && e.completed)
            // pluck the responses array
            .map(e => e.responses as number[])
        )
      );
  }
  /** Submit answers for a single survey */
  submitAnswers(
    uid: string,
    surveyId: string,
    responses: number[]
  ): Observable<void> {
    const docRef = this.afs.doc(
      `users/${uid}/surveyanswers/${this.ANSWERS_DOC}`
    );
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

  /**
   * Retrieve all user responses for a given survey across all users
   */
  getAllResponsess(surveyId: string): Observable<SurveyAnswerEntry[]> {
    return this.afs
      .collectionGroup<UserSurveyAnswers>('surveyanswers')
      .valueChanges()
      .pipe(
        map(docs =>
          docs
            .map(doc => doc.entries?.[surveyId])
            .filter((entry): entry is SurveyAnswerEntry => !!entry)
        )
      );
  }
}
