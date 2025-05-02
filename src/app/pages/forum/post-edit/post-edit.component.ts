import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { Post } from '../../../models/post.model';
import { CommonModule } from '@angular/common';
import { MatFormField, MatFormFieldControl, MatLabel } from '@angular/material/form-field';
import { ForumService } from '../../../services/forum.service';
import { catchError, of } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatInput } from '@angular/material/input';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-post-edit',
  standalone: true,
  imports: [
    MatDialogModule, CommonModule,MatFormField, MatLabel, FormsModule, ReactiveFormsModule,MatButtonModule,
    MatInput, TranslatePipe,
  ],
  templateUrl: './post-edit.component.html',
  styleUrl: './post-edit.component.scss'
})
export class PostEditComponent {
  form:FormGroup;
  post!:Post;
  constructor(    
    private dialogRef: MatDialogRef<PostEditComponent>,
    private fb: FormBuilder,
    @Inject(MAT_DIALOG_DATA) post: Post,
    private forum : ForumService,
  ) {
    this.post = post;
    this.form = this.fb.group({
      title: [post.title, [Validators.required, Validators.minLength(10), Validators.maxLength(100)]],
      content: [post.content, [Validators.required, Validators.minLength(10), Validators.maxLength(2000)]],
      hashtags: [post.hashtags],
      linkedPictures: [post.linkedPictures]
    });
  }
  
  cancel(){
    this.dialogRef.close();
  }

  save() {
    if (this.form.invalid) return;
  
    const changes: Partial<Post> = {
      title: this.form.value.title,
      content: this.form.value.content,
  
      // mark as edited, and stamp the new edit time
      isEdited: true,
      updatedAt: new Date()
    };
  
    this.forum
      .updatePost(this.post.id!, changes)
      .pipe(
        catchError(err => {
          console.error(err);
          alert('Failed to save changes.');
          return of(null);
        })
      )
      .subscribe(result => {
        if (result === null) return;
        // propagate the merged object back to the detail view
        const updated: Post = { ...this.post, ...changes };
        this.dialogRef.close(updated);
      });
    }






}
