import {  Component,  OnInit,  OnDestroy,  ViewChild,  ElementRef, OnChanges, SimpleChanges, } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Subscription,  switchMap,  finalize,  Observable,  map,  of,  combineLatest, tap, } from 'rxjs';
import { MatTabsModule } from '@angular/material/tabs';
import { MatListModule } from '@angular/material/list';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { Notification } from '../../models/notification.model';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { Survey } from '../../models/survey.model';
import { Router } from '@angular/router';
import { TranslationService } from '../../services/translation.service';
import { TranslatePipe } from '@ngx-translate/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatListModule,
    MatSelectModule,
    MatFormFieldModule,
    TranslatePipe,
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent implements OnInit, OnDestroy  {
  @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;
  user: any;
  userData: any;
  private authSub!: Subscription;
  defaultPicUrl = '';
  unread$!: Observable<Notification[]>;
  read$!: Observable<Notification[]>;
  incompleteSurveys$!: Observable<Survey[]>;
  selectedLang!: string;
  langs = ['en', 'hu'];

  constructor(
    private auth: AuthService,
    private userSvc: UserService,
    private router: Router,
    private i18n: TranslationService,
    private snackBar: MatSnackBar
  ) {
    this.selectedLang = this.i18n.getCurrentLang();
  }
  

  ngOnInit(): void {
    this.authSub = this.auth.getCurrentUser().subscribe((currentUser) => {
      this.user = currentUser;
      if (this.user) {
        this.userSvc
          .userData$(this.user.uid)
          .subscribe((data) => (this.userData = data));
        this.userSvc.getNotifications(this.user.uid).subscribe((arr) => {
          this.unread$ = of(arr.filter((n) => !n.read));          
          this.read$ = of(arr.filter((n) => n.read));
        });
        this.incompleteSurveys$ = this.userSvc.getIncompleteSurveys(
          this.user.uid
        );
        this.userSvc
          .getDefaultPicUrl()
          .subscribe((url) => (this.defaultPicUrl = url));
      }
    });
    
  }

  

  switch(lang: string) {
    this.i18n.useLanguage(lang);    
  }

  onSelectSurvey(surveyId: string) {    
    this.router.navigate(['/survey', surveyId]);
  }

  dismiss(n: Notification) {
    if (!this.user) return;
    this.userSvc.markAsRead(this.userData.uid, n.id);
  }
  onSelectProfilePic() {
    this.fileInputRef.nativeElement.click();
  }

  async onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || !input.files[0]) {
      return;
    }
    const file = input.files[0];
    // Validation
    const validTypes = ['image/png', 'image/jpeg'];
    if (!validTypes.includes(file.type)) {
      this.snackBar.open('Please select a PNG or JPEG image.', 'Dismiss', {
        duration: 2000,
      });
      return;
    }
    const isValidDimensions = await this.checkImageDimensions(file, 256, 256);
    if (!isValidDimensions) {
      this.snackBar.open('Image must not exceed 256x256 pixels.', 'Dismiss', {
        duration: 2000,
      });
      return;
    }
    //Upload to "profiles/{uid}/"
    this.userSvc.updateProfilePic(this.user.uid, file).subscribe(() => {
      this.snackBar.open('Profile picture updated', 'OK', { duration: 2000 });
    });
  }

  private checkImageDimensions(
    file: File,
    maxWidth: number,
    maxHeight: number
  ): Promise<boolean> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        if (img.width <= maxWidth && img.height <= maxHeight) {
          resolve(true);
        } else {
          resolve(false);
        }
      };
      //blob URL for the file
      img.src = URL.createObjectURL(file);
    });
  }

  ngOnDestroy(): void {
    this.authSub?.unsubscribe();    
  }
}
