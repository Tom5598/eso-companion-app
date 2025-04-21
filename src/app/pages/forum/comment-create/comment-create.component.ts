// src/app/pages/forum/comment-create/comment-create.component.ts
import { Component, inject } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import {
  MatBottomSheetRef,
  MatBottomSheetModule,
  MAT_BOTTOM_SHEET_DATA
} from '@angular/material/bottom-sheet';
import { CommonModule } from '@angular/common';
import { ForumService } from '../../../services/forum.service';
import { AuthService } from '../../../services/auth.service';
import { take, switchMap } from 'rxjs/operators';
import { MatButton, MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-comment-create',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatBottomSheetModule, MatButtonModule
  ],
  templateUrl: './comment-create.component.html',
  styleUrls: ['./comment-create.component.scss']
})
export class CommentCreateComponent {
  private fb = inject(FormBuilder);
  private bottomSheetRef = inject(MatBottomSheetRef<CommentCreateComponent>);
  private forum = inject(ForumService);
  private auth = inject(AuthService);
  private data = inject(MAT_BOTTOM_SHEET_DATA) as { postId: string };

  form = this.fb.group({
    content: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(2000)]]
  });

  cancel() {
    this.bottomSheetRef.dismiss();
  }

  post() {
    if (this.form.invalid) return;
  
    this.auth.user$
      .pipe(take(1))
      .subscribe({
        next: user => {
          if (!user) {
            alert('You must be signed in to comment.');
            return;
          }
          const content = this.form.value.content!;
          this.forum
            .createCommentTransaction(
              {
                authorId: user.uid, username: (user as any).username || user.email!,
                 content,
                isLocked: false,
                isEdited: false,
                isHidden: false
              },
              this.data.postId
            )
            .then(() => this.bottomSheetRef.dismiss())
            .catch(err => {
              console.error(err);
              alert('Failed to post comment.');
            });
        }
      });
  }
}