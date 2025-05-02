import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AdminService } from '../../../services/admin.service';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-emails',
  standalone: true,
  imports: [CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSnackBarModule,
    TranslatePipe,
  ],
  templateUrl: './emails.component.html',
  styleUrl: './emails.component.scss'
})
export class EmailsComponent implements OnInit {
  emailForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private adminSvc: AdminService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.emailForm = this.fb.group({
      subject: ['', Validators.required],
      body: ['', Validators.required]
    });
  }

  send() {
    if (this.emailForm.invalid) return;
    const { subject, body } = this.emailForm.value;
    this.adminSvc.sendEmailToAll(subject, body).subscribe({
      next: () => {
        this.snackBar.open('Emails sent to all users', 'OK', { duration: 3000 });
        this.emailForm.reset();
      },
      error: err => {
        this.snackBar.open(`Error: ${err.message}`, 'Close', { duration: 3000 });
      }
    });
  }
}
