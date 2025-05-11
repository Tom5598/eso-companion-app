import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { finalize, map, Observable, switchMap } from 'rxjs';
import { Notification } from '../models/notification.model';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { SurveyService } from './survey.service';
@Injectable({
  providedIn: 'root',
})
export class UserService {
  constructor(
    private afs: AngularFirestore,
    private storage: AngularFireStorage,
    private surveySvc: SurveyService
  ) {}
  
  /**
   * @description Fetches all notifications for a user from Firestore, ordered by date in descending order.
   * @param uid The user ID
   * @returns An observable of the user's notifications
  */
  getNotifications(uid: string): Observable<Notification[]> {
    return this.afs
      .collection<Notification>(`users/${uid}/notifications`, (ref) =>
        ref.orderBy('date', 'desc')
      )
      .valueChanges({ idField: 'id' })
      .pipe(
        // convert Firestore Timestamp to JS Date
        map((arr) =>
          arr.map((n) => ({
            ...n,
            date: n.date instanceof Date ? n.date : (n.date as any).toDate(),
          }))
        )
      );
  }

  /**
   * @description Fetches all survey definitions that are not hidden and the user has not answered yet.
   * @param uid The user ID
   * @returns An observable of the survey definitions that the user has not completed
  */
  getIncompleteSurveys(uid: string) {
    return this.surveySvc
      .getVisibleDefinitions()
      .pipe(
        switchMap((defs) =>
          this.surveySvc
            .getUserAnswers(uid)
            .pipe(
              map((answers) =>
                defs.filter((def) => !answers?.entries?.[def.id]?.completed)
              )
            )
        )
      );
  }
  /**
   * @description Marks a notification as read by updating the 'read' field to true in Firestore.
   * @param uid The user ID
   * @param notificationId The notification ID
   * @returns A promise that resolves when the update is complete
  */
  markAsRead(uid: string, notificationId: string): Promise<void> {
    return this.afs
      .doc(`users/${uid}/notifications/${notificationId}`)
      .update({ read: true });
  }
  /** 
   * @description Fetches the default profile picture URL from Firebase Storage.
   * @returns An observable of the default profile picture URL
  */
  getDefaultPicUrl(): Observable<string> {
    return this.storage.ref('shared/profile_default.png').getDownloadURL();
  }

  /** 
   * @description Fetches the user data from Firestore by user ID.
   * @param uid The user ID
   * @returns An observable of the user data
  */
  userData$(uid: string): Observable<any> {
    return this.afs.doc(`users/${uid}`).valueChanges();
  }

  /** 
   * @description Uploads a profile picture to Firebase Storage and updates the user's document with the new URL.
   * @param uid The user ID
   * @param file The image file to upload
   * @returns An observable of the download URL
   */
  updateProfilePic(uid: string, file: File): Observable<string> {
    const ext = file.type === 'image/png' ? 'png' : 'jpg';
    const path = `profiles/${uid}/profilePic.${ext}`;
    const ref = this.storage.ref(path);
    const task = this.storage.upload(path, file);

    // when complete, grab the URL and write it into the user document
    return task.snapshotChanges().pipe(
      finalize(() => {
        ref
          .getDownloadURL()
          .pipe(
            map((url) => {
              this.afs.doc(`users/${uid}`).update({ photoURL: url });
              return url;
            })
          )
          .subscribe();
      })
    ) as unknown as Observable<string>;
  }
}
