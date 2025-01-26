import { Component, OnInit, OnDestroy,ViewChild,  ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
// RxJS
import { Subscription, switchMap, finalize } from 'rxjs';

import { AuthService } from '../../services/auth.service';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireStorage } from '@angular/fire/compat/storage';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent implements OnInit, OnDestroy {
  user: any;
  userData: any;
  private authSub!: Subscription;
  private userDocSub!: Subscription;
  defaultPicUrl = '';
  @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;
  constructor(
    private authService: AuthService,
    private firestore: AngularFirestore,
    private storage: AngularFireStorage
  ) {}

  ngOnInit(): void {
    //Gets  loggedin user
    this.authSub = this.authService
      .getCurrentUser()
      .subscribe((currentUser) => {
        this.user = currentUser;
        if (this.user) {
          this.loadUserData(this.user.uid);
        }
      });
      this.storage.ref('shared/profile_default.png').getDownloadURL()
      .subscribe(url => {
        this.defaultPicUrl = url;
      });
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
