import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { map, Observable } from 'rxjs';
import { Notification } from '../models/notification.model';
@Injectable({
  providedIn: 'root'
})
export class UserService {
  constructor(private afs: AngularFirestore) {}

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
}
