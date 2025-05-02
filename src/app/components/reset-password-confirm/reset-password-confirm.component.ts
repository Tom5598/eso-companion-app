import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AngularFireAuth }     from '@angular/fire/compat/auth';
import { FormsModule }         from '@angular/forms';
import { CommonModule }        from '@angular/common';
import { MatCardModule }       from '@angular/material/card';
import { MatInputModule }      from '@angular/material/input';
import { MatButtonModule }     from '@angular/material/button';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-reset-password-confirm',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule, MatInputModule, MatButtonModule,TranslatePipe,],
  templateUrl: './reset-password-confirm.component.html',
  styleUrl: './reset-password-confirm.component.scss'
})
export class ResetPasswordConfirmComponent implements OnInit {
  email: string | null = null;
  newPassword = '';
  message = '';
  private oobCode!: string;

  constructor(
    private route: ActivatedRoute,
    private afAuth: AngularFireAuth,
    private router: Router
  ) {}

  ngOnInit() {
    // Extract code & verify validity
    this.oobCode = this.route.snapshot.queryParamMap.get('oobCode')!;
    this.afAuth.verifyPasswordResetCode(this.oobCode)
      .then(email => this.email = email) 
      .catch(() => { this.email = null; });
  }

  onConfirm() {
    this.afAuth.confirmPasswordReset(this.oobCode, this.newPassword)
      .then(() => {
        this.message = 'Your password has been reset! Redirecting…';
        setTimeout(() => this.router.navigate(['/login']), 2000);
      })
      .catch(err => this.message = err.message); 
  }
}