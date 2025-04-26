import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { from, map, Observable, switchMap, take } from 'rxjs';
import { User } from '../models/user.model';
import { AngularFireStorage } from '@angular/fire/compat/storage';



export interface AppUser { uid: string; email: string; disabled: boolean; }
export interface Article { id: string; title: string; content: string; createdAt: Date; }
@Injectable({
  providedIn: 'root'
})
export class AdminService { 

  constructor(
    private afs: AngularFirestore,
    private afAuth: AngularFireAuth,
    private storage: AngularFireStorage
  ) {}

  // Bulk Email via Firestore 'mail' collection (Trigger Email)
  sendEmailToAll(subject: string, html: string): Observable<void> {
    // Fetch the user list *once*
    return this.afs
      .collection<{ email: string }>('users')
      .valueChanges({ idField: 'uid' })
      .pipe(
        take(1), // <-- only the first emission
        switchMap(users => {
          // Deduplicate addresses
          const emails = Array.from(
            new Set(users.map(u => u.email))
          );

          // Batch all writes
          const batch = this.afs.firestore.batch();
          const mailCol = this.afs.firestore.collection('mail');
          emails.forEach(emailAddr => {
            const docRef = mailCol.doc(); 
            batch.set(docRef, {
              to: emailAddr,
              message: { subject, html }
            });
          });

          // Commit as a single promise
          return from(batch.commit());
        })
      );
  }

  searchUsers(prefix: string): Observable<User[]> {
    return this.afs
      .collection<User>('users', ref => {
        let q = ref.orderBy('username').limit(10);
        if (prefix) {
          const end = prefix + '\uf8ff';
          q = q.startAt(prefix).endAt(end);
        }
        return q;
      })
      .valueChanges({ idField: 'uid' });
  }

  /** Toggle a user’s disabled flag on their own doc */
  setUserDisabled(uid: string, disabled: boolean): Observable<void> {
    return from(this.afs.doc(`users/${uid}`).update({ disabled }));
  }
 
}
