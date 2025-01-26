import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { User } from '../models/user.model';
import { from, Observable } from 'rxjs';
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(
    private afAuth: AngularFireAuth,
    private firestore: AngularFirestore
  ) {}

  /**
   * Register a new user with email and password.
   * Also create a user profile document in Firestore.
   */
  register(email: string, password: string, username: string): Observable<any> {
    return from(
      this.afAuth
        .createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
          // If the user is created, save additional user data in Firestore
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

  /**
   * Log in user with email and password.
   */
  login(email: string, password: string): Observable<any> {
    return from(this.afAuth.signInWithEmailAndPassword(email, password));
  }

  /**
   * Log out the current user.
   */
  logout(): Observable<void> {
    return from(this.afAuth.signOut());
  }

  /**
   * Returns an observable with the current user.
   */
  getCurrentUser(): Observable<any> {
    return this.afAuth.authState;
  }
}
