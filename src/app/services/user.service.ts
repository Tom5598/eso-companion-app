import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { finalize, map, Observable } from 'rxjs';
import { Notification } from '../models/notification.model';
import { AngularFireStorage } from '@angular/fire/compat/storage';
@Injectable({
  providedIn: 'root'
})
export class UserService {
 
  constructor(private afs: AngularFirestore, private storage: AngularFireStorage) {}
  getAllUsers(): any {
    return this.afs.collection('users').get;
  }
  /** Stream of all notifications for a user, ordered newest first */
  getNotifications(uid: string): Observable<Notification[]> {
    return this.afs
      .collection<Notification>(
        `users/${uid}/notifications`,
        ref => ref.orderBy('date', 'desc')
      )
      .valueChanges({ idField: 'id' })
      .pipe(
        // convert Firestore Timestamp → JS Date
        map(arr =>
          arr.map(n => ({ ...n, date: n.date instanceof Date ? n.date : (n.date as any).toDate() }))
        )
      );
  }

  /** Marks a single notification as read */
  markAsRead(uid: string, notificationId: string): Promise<void> {     
    return this.afs
      .doc(`users/${uid}/notifications/${notificationId}`)
      .update({ read: true });
  }
   /** Default “blank” profile picture URL */
  getDefaultPicUrl(): Observable<string> {
    return this.storage
      .ref('shared/profile_default.png')
      .getDownloadURL();
  }

  /** Real-time stream of a user’s document */
  userData$(uid: string): Observable<any> {
    return this.afs
      .doc(`users/${uid}`)
      .valueChanges();
  }

  /** Upload a new profile pic and update the user doc */
  updateProfilePic(uid: string, file: File): Observable<string> {
    const ext    = file.type === 'image/png' ? 'png' : 'jpg';
    const path   = `profiles/${uid}/profilePic.${ext}`;
    const ref    = this.storage.ref(path);
    const task   = this.storage.upload(path, file);

    // when complete, grab the URL and write it into the user document
    return task.snapshotChanges().pipe(
      finalize(() => {
        ref.getDownloadURL().pipe(
          map(url => {
            this.afs.doc(`users/${uid}`).update({ photoURL: url });
            return url;
          })
        ).subscribe();
      })
    ) as unknown as Observable<string>; 
  }
}
