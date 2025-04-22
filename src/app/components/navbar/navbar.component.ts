import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RedirectCommand, Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';

import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { AuthService } from '../../services/auth.service';
import { ProfileMenuComponent } from '../profile-menu/profile-menu.component';
@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [ CommonModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    ProfileMenuComponent
  ],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent implements OnInit, OnDestroy {
  isLoggedIn = false;
  private userSub!: Subscription;

  constructor(private authService: AuthService,private router: Router) {}

  ngOnInit() {
    // Subscribe to the current user/auth state
    this.userSub = this.authService.getCurrentUser().subscribe(user => {
      this.isLoggedIn = !!user; // true if user object exists
    });
  }

  ngOnDestroy() {
    if (this.userSub) {
      this.userSub.unsubscribe();
    }
  }

  onLogout() {
    this.authService.logout().subscribe(() => {
      this.isLoggedIn = false;
      this.router.navigate(['/home']);
    });
  }
}
