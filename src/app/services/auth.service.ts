import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { User } from '../models/user.model';
import firebase from 'firebase/compat/app';
import { from, Observable, of, switchMap } from 'rxjs';
@Injectable({
  providedIn: 'root',
})
export class AuthService {  
  public fbUser$ !: Observable<firebase.User | null | undefined>;
  public user$ !: Observable<User | null>;
  constructor(
    private afAuth: AngularFireAuth,
    private firestore: AngularFirestore
  ) {
    this.fbUser$ = this.afAuth.authState;
    this.user$ = this.fbUser$.pipe(
      switchMap(authUser => {
        if (!authUser) return of(null);
        return this.firestore
          .doc<User>(`users/${authUser.uid}`)
          .valueChanges({ idField: 'uid' });
      }),
      switchMap(user => of(user ?? null)) // Ensure undefined is replaced with null
    );
  }
  
  register(email: string, password: string, username: string): Observable<any> {
    return from(
      this.afAuth
        .createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
          if (userCredential.user) {
            const uid = userCredential.user.uid;
            const userData: User = {
              uid,
              email,
              username,
              createdAt: new Date(),
              photoURL: 'https://firebasestorage.googleapis.com/v0/b/eso-companion-app-89474.firebasestorage.app/o/shared%2Fprofile_default.png?alt=media&token=3179657a-a62a-4ad7-b634-316a8a666f7c',
            };
            return this.firestore.collection('users').doc(uid).set(userData);
          }
          return null;
        })
        .catch((error) => {})
    );
  }

  login(email: string, password: string): Observable<any> {
    return from(this.afAuth.signInWithEmailAndPassword(email, password));
  }
  logout(): Observable<void> {
    return from(this.afAuth.signOut());
  }
  // Get the current user from Firebase Auth
  getCurrentUser(): Observable<any> {
    return this.afAuth.authState;
  }
  // Get the current user ID from Firebase Auth
  getCurrentUserID(): Observable<string | null> {
    return this.afAuth.authState.pipe(
      switchMap((user) => {
        if (user) {
          return of(user.uid);
        } else {
          return of(null);
        }
      })
    );
  }
  // Get the current user data from Firestore
  getCurrentUserData(): Observable<User | null | undefined> {
    return this.user$.pipe(
      switchMap((user) => {
        if (user) {
          return this.firestore.doc<User>(`users/${user.uid}`).valueChanges({ idField: 'uid' });
        } else {
          return of(null);
        }
      }));
  }
}
