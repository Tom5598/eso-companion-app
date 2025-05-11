import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { from, map, Observable, of, switchMap, take } from 'rxjs';
import { User } from '../models/user.model';
import { AngularFireStorage } from '@angular/fire/compat/storage';

export interface AppUser {
  uid: string;
  email: string;
  disabled: boolean;
}
export interface Article {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
}
@Injectable({
  providedIn: 'root',
})
export class AdminService {
  constructor(private afs: AngularFirestore) {}
  /**
   * @description This method retreieves all users from the Firestore database. Then it writes a document to the 'mail' collection for each user with their email address and the message to be sent.
   * @param subject The subject of the email
   * @param html The HTML content of the email
   * @returns An observable that emits when the batch commit is complete
   */
  sendEmailToAll(subject: string, html: string): Observable<void> {
    return this.afs
      .collection('users')
      .get()
      .pipe(
        take(1), // ensure we only process it once
        switchMap((snapshot) => {
          const emails = Array.from(
            new Set(
              snapshot.docs
                .map((doc) => (doc.data() as { email: string }).email)
                .filter((e) => !!e)
            )
          );
          const batch = this.afs.firestore.batch();
          const mailCol = this.afs.firestore.collection('mail');
          emails.forEach((emailAddr) => {
            const docRef = mailCol.doc();
            batch.set(docRef, { to: emailAddr, message: { subject, html } });
          });

          return from(batch.commit());
        })
      );
  }
  /**
   * @description This method retrieves all users from the Firestore database and returns them as an observable array of User objects.
   * @returns An observable array of User objects
   */
  searchUsers(prefix: string): Observable<User[]> {
    return this.afs
      .collection<User>('users', (ref) => {
        let q = ref.orderBy('username').limit(10);
        if (prefix) {
          const end = prefix + '\uf8ff';
          q = q.startAt(prefix).endAt(end);
        }
        return q;
      })
      .valueChanges({ idField: 'uid' });
  }
  /**
   * 
   * @param uid The UID of the user that is to be updated
   * @param disabled The disabled status of the user
   * @returns An observable of void
   */
  setUserDisabled(uid: string, disabled: boolean): Observable<void> {
    return from(this.afs.doc(`users/${uid}`).update({ disabled }));
  }
}
