import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  FormControl,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
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
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Post } from '../../../models/post.model';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import 'firebase/compat/firestore';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommodityService } from '../../../services/commodity.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommodityNames } from '../../../models/commodity-names.model';

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
    MatProgressBarModule,
    MatChipsModule,
    MatTooltipModule,
  ],
  templateUrl: './post-create.component.html',
  styleUrls: ['./post-create.component.scss'],
})
export class PostCreateComponent implements OnInit {
  private fb = inject(FormBuilder);
  private forumService = inject(ForumService);
  private afs = inject(AngularFirestore);
  private auth = inject(AuthService);
  private router = inject(Router);
  private commoditySvc = inject(CommodityService);
  private snackBar = inject(MatSnackBar);

  tags$!: Observable<string[]>;
  postID: string = '';
  maxTags = 10;
  commodityNames: CommodityNames[] = [];

  ngOnInit(): void {
    this.postID = this.afs.createId();
    this.tags$ = this.afs
      .doc<{ tags: string[] }>('utils/hashtags')
      .valueChanges()
      .pipe(map((doc) => doc?.tags || []));
    this.commoditySvc.getCommodityNames().subscribe((names) => {
      this.commodityNames = names;
    });
    // 2) Watch content and validate on each change (debounced)
    this.form
      .get('content')!
      .valueChanges.pipe(debounceTime(1000))
      .subscribe((text) => this._validateCommodities(text || ''));
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
  private _validateCommodities(text: string) {
    // regex to find $word tokens ending with space or end-of-string
    const regex = /(\$[A-Za-z]+)(?=\s|$)/g;
    let match: RegExpExecArray | null;
    let cleaned = text;
  
    while ((match = regex.exec(text))) {
      const token  = match[1];        // e.g. "$wood"
      const symbol = token.substring(1) ;
  
      // look for a matching commodity name (case-insensitive)
      const exists = this.commodityNames.some(
        c => c?.name   === symbol
      );
      console.log(`Checking whether "${symbol}" exists...`, exists);      
      if (!exists) {
        // strip out invalid token
        cleaned = cleaned.replace(token, '');
        this.snackBar.open(`No such commodity: ${symbol}`, 'Dismiss', {
          duration: 2000,
        });
      }
    }
  
    // if we removed anything, update control without retriggering validation
    if (cleaned !== text) {
      this.form.get('content')!.setValue(cleaned, { emitEvent: false });
    }
  }
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
    const draft = {
      id: this.postID,
      title: this.form.value.title!,
      content: this.form.value.content!,
      authorId: user.uid,
      username: user.username,
      hashtags: this.form.value.hashtags,
    } as Partial<Post>;

    this.uploading = true;

    // Call the new service method
    this.forumService
      .createPostWithImages(draft, this.postID, this.files)
      .pipe(
        tap((post) => {
          console.log('Created post with images:', post);
          this.router.navigate(['/forum', post.id]);
        }),
        catchError((err) => {
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
      if (tags.length >= this.maxTags) {
        // optional: notify the user
        alert(`You can select up to ${this.maxTags} tags.`);
        return;
      }
      tags.push(tag);
    }
    this.form.get('hashtags')!.setValue(tags);
  }
}
