import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import {FormsModule} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import {  Router } from '@angular/router';
import { AngularFirestore } from '@angular/fire/compat/firestore';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  email = '';
  password = '';
  errorMessage = '';

  constructor(private authService: AuthService, private router:Router) {}

  onLogin() {    
    this.authService.login(this.email, this.password).subscribe({
      next: () => {
        this.router.navigate(['/home']);
        console.log('User login successful!');
      },
      error: (err) => {
        this.errorMessage = err.message;
      }
    });
  }
  onGoogleSignIn() {
    this.authService.googleSignIn().subscribe({
      next: () => this.router.navigate(['/home']),
      error: err => this.errorMessage = err.message
    });
  }
  onResetPassword() {
    this.router.navigate(['/reset-password']);
  }
  
}
