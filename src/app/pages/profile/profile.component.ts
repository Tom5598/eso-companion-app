import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import {
  Subscription,
  switchMap,
  finalize,
  Observable,
  map,
  of,
  combineLatest,
} from 'rxjs';
import { MatTabsModule } from '@angular/material/tabs';
import { MatListModule } from '@angular/material/list';
import { AuthService } from '../../services/auth.service';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { UserService } from '../../services/user.service';
import { Notification } from '../../models/notification.model';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { SurveyService } from '../../services/survey.service';
import { Survey } from '../../models/survey.model';
import { Router } from '@angular/router';
import { TranslationService } from '../../services/translation.service';
import { TranslatePipe } from '@ngx-translate/core';


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
    MatFormFieldModule,TranslatePipe,
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent implements OnInit, OnDestroy {
  @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;
  user: any;
  userData: any;
  private authSub!: Subscription;
  private userDocSub!: Subscription;
  defaultPicUrl = '';
  unread$!: Observable<Notification[]>;
  read$!: Observable<Notification[]>;
  incompleteSurveys$!: Observable<Survey[]>;
  selectedLang!: string;
  langs = ['en', 'hu'];
  constructor(
    private auth: AuthService,
    private firestore: AngularFirestore,
    private storage: AngularFireStorage,
    private userSvc: UserService,
    private surveySvc: SurveyService,
    private router: Router,
    private i18n: TranslationService
  ) {
    this.selectedLang = this.i18n.getCurrentLang(); 
  }

  ngOnInit(): void {
    //Gets  loggedin user

    this.authSub = this.auth.getCurrentUser().subscribe((currentUser) => {
      this.user = currentUser;
      if (this.user) {
        this.loadUserData(this.user.uid);
      }
    });
    this.storage
      .ref('shared/profile_default.png')
      .getDownloadURL()
      .subscribe((url) => {
        this.defaultPicUrl = url;
      });

    // 3) load notifications streams
    this.unread$ = this.auth.getCurrentUser().pipe(
      switchMap((u) => (u ? this.userSvc.getNotifications(u.uid) : of([]))),
      map((arr) => arr.filter((n) => !n.read))
    );
    this.read$ = this.auth.getCurrentUser().pipe(
      switchMap((u) => (u ? this.userSvc.getNotifications(u.uid) : of([]))),
      map((arr) => arr.filter((n) => n.read))
    );
  }
  switch(lang: string) {
    this.i18n.useLanguage(lang);
  }
  loadUserData(uid: string) {
    //Load the user's data from
    this.userDocSub = this.firestore
      .collection('users')
      .doc(uid)
      .valueChanges()
      .subscribe((data) => {
        this.userData = data;
      });
    this.incompleteSurveys$ = combineLatest([
      this.surveySvc.getVisibleDefinitions(),
      this.surveySvc.getUserAnswers(uid),
    ]).pipe(
      map(([defs, doc]) =>
        defs.filter((d) => !(doc && doc.entries[d.id]?.completed))
      )
    );
  }
  onSelectSurvey(surveyId: string) {
    this.router.navigate(['/survey', surveyId]);
  }
  /** Dismiss moves it to “read” */
  dismiss(n: Notification) {
    if (!this.user) return;
    this.userSvc.markAsRead(this.userData.uid, n.id);
  }
  onSelectProfilePic() {
    // This triggers the hidden file input
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
      alert('Please select a PNG or JPEG image.');
      return;
    }
    const isValidDimensions = await this.checkImageDimensions(file, 256, 256);
    if (!isValidDimensions) {
      alert('Image must not exceed 256x256 pixels.');
      return;
    }
    //Upload to "profiles/{uid}/"
    const ext = file.type === 'image/png' ? 'png' : 'jpg';
    const filePath = `profiles/${this.user.uid}/profilePic.${ext}`;
    const fileRef = this.storage.ref(filePath);
    const uploadTask = this.storage.upload(filePath, file);
    uploadTask
      .snapshotChanges()
      .pipe(
        finalize(() => {
          // Once upload is complete, get the download URL
          fileRef.getDownloadURL().subscribe((downloadURL) => {
            this.firestore
              .collection('users')
              .doc(this.user.uid)
              .update({ photoURL: downloadURL });
          });
        })
      )
      .subscribe();
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
    if (this.authSub) this.authSub.unsubscribe();
    if (this.userDocSub) this.userDocSub.unsubscribe();
  }
}
