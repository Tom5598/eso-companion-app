import { Component, inject, OnInit } from '@angular/core';
import { v4 as uuid } from 'uuid';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  FormControl,
} from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule, MatHint } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { ForumService } from '../../../services/forum.service';
import { AuthService } from '../../../services/auth.service';
import {
  catchError,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  firstValueFrom,
  forkJoin,
  from,
  map,
  Observable,
  of,
  shareReplay,
  switchMap,
  take,
  tap,
  throwError,
} from 'rxjs';
import { Router } from '@angular/router';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Post } from '../../../models/post.model';
import { Timestamp, FieldValue } from 'firebase/firestore';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import { AngularFireFunctions } from '@angular/fire/compat/functions';
import { MatChipsModule }   from '@angular/material/chips';
@Component({
  selector: 'app-post-create',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressBarModule,MatChipsModule,
  ],
  templateUrl: './post-create.component.html',
  styleUrls: ['./post-create.component.scss'],
})
export class PostCreateComponent implements OnInit {
  postID: string = '';

  private fb = inject(FormBuilder);
  private storage = inject(AngularFireStorage);
  private forumService = inject(ForumService);
  private afs = inject(AngularFirestore);
  private auth = inject(AuthService);
  private router = inject(Router);
  private fns   = inject(AngularFireFunctions);
  tags$!: Observable<string[]>;
  ngOnInit(): void {
    this.postID = this.afs.createId();
    this.tags$ = this.afs
      .doc<{ tags: string[] }>('utils/hashtags')
      .valueChanges()
      .pipe(map(doc => doc?.tags || []));
  }
  form = this.fb.group({
    title: [
      '',
      [Validators.required, Validators.minLength(6), Validators.maxLength(100)],
    ],
    content: [
      '',
      [
        Validators.required,
        Validators.minLength(10),
        Validators.maxLength(2000),
      ],
    ],
    hashtags: this.fb.control<string[]>([]),
  });

  /** local file list & thumbnails */
  files: File[] = [];
  previews: string[] = [];
  uploading = false;
  uploadProgress = 0;

  /* ---------- image handling ---------- */
  onFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;

    Array.from(input.files).forEach((file) => {
      if (this.files.length >= 10) return;
      if (!['image/png', 'image/jpeg'].includes(file.type)) return;

      const img = new Image();
      img.onload = () => {
        if (img.width <= 1920 && img.height <= 1080) {
          this.files.push(file);
          this.previews.push(URL.createObjectURL(file));
        }
      };
      img.src = URL.createObjectURL(file);
    });

    // reset input so same file can be re‑selected
    input.value = '';
  }

  remove(idx: number) {
    this.files.splice(idx, 1);
    this.previews.splice(idx, 1);
  }
  
  async savePost() {
    if (this.form.invalid) return;

    const user = await firstValueFrom(
      this.auth.getCurrentUserData().pipe(take(1))
    );
    if (!user) {
      alert('You must be logged in to post.');
      return;
    }

    // Build the minimal draft
    const now = new Date();
    const draft  = {
      id: this.postID,
      title: this.form.value.title!,
      content: this.form.value.content!,
      authorId: user.uid,
      username: user.username,
      hashtags:  this.form.value.hashtags      
    } as Partial<Post>;

    this.uploading = true;

    // Call the new service method
    this.forumService
      .createPostWithImages(draft, this.postID, this.files)
      .pipe(
        tap(post => {
          console.log('Created post with images:', post);
          this.router.navigate(['/forum', post.id]);
        }),
        catchError(err => {
          console.error(err);
          alert('Error creating post. Please try again later.');
          this.uploading = false;
          return throwError(() => err);
        })
      )
      .subscribe();
  }
  toggleTag(tag: string) {
    const tags: string[] = this.form.value.hashtags || [];
    const idx = tags.indexOf(tag);
    if (idx >= 0) {
      tags.splice(idx, 1);
    } else {
      tags.push(tag);
    }
    this.form.get('hashtags')!.setValue(tags);
  }

}
