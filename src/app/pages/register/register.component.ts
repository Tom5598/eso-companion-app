import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule, MatLabel } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButton } from '@angular/material/button';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButton,MatLabel
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent {
  username = '';
  email = '';
  password = '';
  errorMessage = '';
  constructor(private authService: AuthService, private router: Router) {}

  onRegister() {
    this.authService
      .register(this.email, this.password, this.username)
      .subscribe({
        next: () => {
          this.router.navigate(['/home']);
          console.log('User registration successful!');
        },
        error: (err) => {          
          this.errorMessage = err.message;
        },
      });
  }
}
