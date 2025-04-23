import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AuthService } from './auth.service';
import { Survey } from '../models/survey.model';
import { from, Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class SurveyService {
  constructor(
    private afs: AngularFirestore,
    private auth: AuthService
  ) {}

  /** All surveys for the given user */
  getAll(uid: string): Observable<Survey[]> {
    return this.afs
      .collection<Survey>(`users/${uid}/surveys`, ref =>
        ref.orderBy('createdAt', 'desc')
      )
      .valueChanges({ idField: 'id' })
      .pipe(
        map(arr =>
          arr.map(s => ({
            ...s,
            createdAt: (s.createdAt as any).toDate(), completedAt: s.completedAt ? (s.completedAt as any).toDate() : undefined
          }))
        )
      );
  }

  /** Only surveys with completed == false */
  getIncomplete(uid: string): Observable<Survey[]> {
    return this.afs
      .collection<Survey>(`users/${uid}/surveys`, ref =>
        ref.where('completed', '==', false)
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

  /** Single survey by ID */
  getOne(uid: string, surveyId: string): Observable<Survey | undefined> {
    return this.afs
      .doc<Survey>(`users/${uid}/surveys/${surveyId}`)
      .valueChanges({ idField: 'id' })
      .pipe(
        map(s =>
          s ? { ...s, createdAt: (s.createdAt as any).toDate(), completedAt: s.completedAt ? (s.completedAt as any).toDate() : undefined } : undefined
        )
      );
  }
  /** Submit survey responses and mark as completed */
  submitSurvey(uid: string, surveyId: string, responses: number[]): Observable<void> {
    const docRef = this.afs.doc(`users/${uid}/surveys/${surveyId}`);
    return from(
      docRef.update({
        completed: true,
        completedAt: new Date(),
        responses
      })
    );
  }
}
