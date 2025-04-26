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
import { AdminService } from '../../services/admin.service';

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
  /** Firestore user profile data */
  user$!: Observable<User | null>;
  /** Number of unread notifications */
  unreadCount$!: Observable<number>;
  isAdmin$!: Observable<boolean>;
  constructor() {}

  ngOnInit() {
    // 1) grab auth‑state → user profile doc
    this.user$ = this.auth.user$; // from AuthService
    this.isAdmin$ = this.auth.isAdmin$(); // from AdminService
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
  goToAdminDashboard() {
    this.router.navigate(['/admin']);
  }
  logout() {
    this.auth.logout().subscribe();
    this.router.navigate(['/home']);
  }
}
