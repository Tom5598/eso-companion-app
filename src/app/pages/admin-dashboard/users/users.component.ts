import { Component, OnInit } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AdminService } from '../../../services/admin.service';
import { User } from '../../../models/user.model';
import { Observable } from 'rxjs';
import {
  startWith,
  debounceTime,
  distinctUntilChanged,
  switchMap,
  finalize,
  tap,
  delay,
  first,
  take,
} from 'rxjs/operators';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../services/auth.service';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatListModule,
    MatTabsModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    TranslatePipe,
  ],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss',
})
export class UsersComponent implements OnInit {
  searchControl = new FormControl('');
  users$!: Observable<User[]>;
  isLoading = false;
  constructor(private adminSvc: AdminService, private auth:AuthService) {}
  currentUserID: string |null= '';
  ngOnInit() {
    this.users$ = this.searchControl.valueChanges.pipe(
      startWith(''),
      debounceTime(1000),
      distinctUntilChanged(),
      tap(() => (this.isLoading = true)),
      delay(500),
      switchMap((q: string | null) =>
        this.adminSvc.searchUsers(q!.trim().toLowerCase()).pipe(
          tap(() => {
            this.isLoading = false;
          })
        )
      )
    );
    this.auth.getCurrentUserID().pipe(take(1)).subscribe((uid) => {
      this.currentUserID = uid;
    });
  }

  toggleUser(u: User) {
    if (u.uid == this.currentUserID) {
      alert('You cannot disable your own admin account!');
      return;
    }
    this.adminSvc.setUserDisabled(u.uid, !u.disabled).subscribe(() => {
      // refresh list
      const cur = this.searchControl.value;
      this.searchControl.setValue(cur);
    });
  }
}
