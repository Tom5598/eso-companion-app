import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { AuthService } from '../../services/auth.service';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable, of } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';
import { User } from '../../models/user.model';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';

@Component({
  selector: 'app-profile-menu',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatBadgeModule,
    MatTooltipModule,
  ],
  templateUrl: './profile-menu.component.html',
  styleUrl: './profile-menu.component.scss',
})
export class ProfileMenuComponent implements OnInit {
  private auth = inject(AuthService);
  private afs = inject(AngularFirestore);
  private router = inject(Router);
  user$!: Observable<User | null>;
  unreadCount$!: Observable<number>;
  constructor() {}

  ngOnInit() {
    this.user$ = this.auth.user$;
    // 2) count unread notifications in users/{uid}/notifications
    this.unreadCount$ = this.auth.getCurrentUserID().pipe(
      switchMap((uid) => {
        if (!uid) return of(0);
        return this.afs
          .collection(`users/${uid}/notifications`, (ref) =>
            ref.where('read', '==', false)
          )
          .valueChanges()
          .pipe(map((arr) => arr.length));
      })
    );
  }
  goToProfile() {
    this.router.navigate(['/profile']);
  }
}
