import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { User } from '../models/user.model';
import firebase from 'firebase/compat/app'; 
import { from, map, Observable, of, switchMap, take, throwError } from 'rxjs';
import { GoogleAuthProvider } from '@angular/fire/auth';
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
  isAdmin$(): Observable<boolean> {
    return this.afAuth.authState.pipe(
      switchMap(u => u ? from(u.getIdTokenResult()) : of(null)),
      map(res => !!res?.claims['admin'])
    );
  }
  resetPassword(email: string): Observable<void> {
    return from(this.afAuth.sendPasswordResetEmail(email));
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
              disabled: false,
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
  /** Google popup login with disabled-check */
  googleSignIn(): Observable<firebase.auth.UserCredential> {
    const provider = new GoogleAuthProvider();
    return from(this.afAuth.signInWithPopup(provider)).pipe(
      switchMap(cred => {
        const fbUser = cred.user!;
        const uid = fbUser.uid;
        const ref = this.firestore.doc<User>(`users/${uid}`);
        // first, get existing doc to check disabled flag
        return from(ref.ref.get()).pipe(
          switchMap(snapshot => {
            const exists = snapshot.exists;
            const data = snapshot.data() as User | undefined;
            const wasDisabled = data?.disabled === true;
            // prepare merge data
            const userData: User = {
              uid,
              email: fbUser.email || '',
              username: fbUser.displayName || '',
              photoURL: fbUser.photoURL || '',
              createdAt: exists ? data!.createdAt : new Date(),
              disabled: exists ? data!.disabled : false
            };
            // write/update doc (preserves disabled if existed)
            return from(ref.set(userData, { merge: true })).pipe(
              switchMap(() => {
                if (wasDisabled) {
                  return from(this.afAuth.signOut()).pipe(
                    switchMap(() => throwError(() => new Error('Your account has been disabled.')))
                  );
                }
                return of(cred);
              })
            );
          })
        );
      })
    );
  }
  /** Email/password login with disabled-check */
  login(email: string, password: string): Observable<firebase.auth.UserCredential> {
    return from(this.afAuth.signInWithEmailAndPassword(email, password)).pipe(
      switchMap(cred => {
        const uid = cred.user!.uid;
        // fetch the user doc once
        return this.firestore.doc<User>(`users/${uid}`).valueChanges().pipe(
          take(1),
          switchMap(userData => {
            if (userData?.disabled) {
              // user is disabled → sign out and error
              return from(this.afAuth.signOut()).pipe(
                switchMap(() => throwError(() => new Error('Your account has been disabled.')))
              );
            }
            // ok
            return of(cred);
          })
        );
      })
    );
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
