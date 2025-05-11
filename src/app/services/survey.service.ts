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
  /**
   * @description This method fetches all survey definitions from Firestore. It orders the results by createdAt in descending order and maps the createdAt field to a Date object if it is not already one.
   * @returns An observable of the survey definitions
   */
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
  /**
   * @description This method fetches all survey definitions from Firestore that are not hidden. It orders the results by createdAt in descending order and maps the createdAt field to a Date object if it is not already one.
   * @returns An observable of the survey definitions
   */
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
  /**
   * 
   * @param def The survey definition to be added
   * @description This method adds a new survey definition to Firestore. It generates a unique ID for the survey using the createId() method from AngularFirestore.
   * @returns "void"
   */
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
  /**
   * @param id The ID of the survey
   * @description This method hides a survey definition in Firestore by setting the isHidden field to true.
   * @returns "void"
   */
  hideDefinition(id: string): Observable<void> {
    return from(
      this.afs.doc(`surveys/${id}`).update({ isHidden: true })
    );
  }

  /**
   * @param id The ID of the survey
   * @description This method unhides a survey definition in Firestore by setting the isHidden field to false.
   * @returns "void"
   */
  unhideDefinition(id: string): Observable<void> {
    return from(
      this.afs.doc(`surveys/${id}`).update({ isHidden: false })
    );
  }
  /**
   * @param id The ID of the survey
   * @description This method fetches a single survey definition from Firestore by its ID. It maps the createdAt field to a Date object if it is not already one.
   * @returns "SurveyDefinition" or undefined
   */
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
  /**
   * 
   * @param uid The user ID
   * @returns "UserSurveyAnswers" or null
   * @description This method fetches the survey answers for a specific user from Firestore.
   */
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
   * @param surveyId The ID of the survey
   * @return An observable of the survey answers
   * @description This method fetches all survey answers for a specific survey from Firestore.
   * It uses the collectionGroup query to search across all user subcollections named 'surveyanswers'. 
   * It filters the results to only include completed surveys and maps the responses to an array of numbers.
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
  /**
   * @description Submit survey answers for a user
   * @param uid The user ID
   * @param surveyId The survey ID
   * @param responses The array of responses  
   * @returns An observable that completes when the answers are submitted
   */
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
}
