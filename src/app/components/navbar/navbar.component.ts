import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { map, Observable, of, switchMap } from 'rxjs';

import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AuthService } from '../../services/auth.service';
import { ProfileMenuComponent } from '../profile-menu/profile-menu.component';
import { User } from '../../models/user.model';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    ProfileMenuComponent,
    MatBadgeModule,
    MatTooltipModule,MatMenuModule,TranslatePipe
  ],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
})
export class NavbarComponent implements OnInit, OnDestroy {
  private auth = inject(AuthService);
  private router = inject(Router);
  isLoggedIn = false;
  user$!: Observable<User | null>;
  isAdmin$!: Observable<boolean>;
  constructor() {}

  ngOnInit() {
    this.user$ = this.auth.user$;
    this.isAdmin$ = this.auth.isAdmin$();
    
  }
  goToAdminDashboard() {
    this.router.navigate(['/admin']);
  }
  ngOnDestroy() {}

  onLogout() {
    this.auth.logout().subscribe(() => {
      this.isLoggedIn = false;
      this.router.navigate(['/home']);
    });
  }
}
