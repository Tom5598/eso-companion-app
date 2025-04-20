import { Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCard, MatCardModule } from '@angular/material/card';
import { ActivatedRoute, Router } from '@angular/router';
import { Post } from '../../../models/post.model';
import { combineLatest, firstValueFrom, from, map, Observable, of, switchMap, take, tap } from 'rxjs';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { CommonModule } from '@angular/common';
import { ForumService } from '../../../services/forum.service';
import { AuthService } from '../../../services/auth.service';
import { Comment } from '../../../models/comment.model';
import { ToDatePipe } from '../../../util/timestampt-to-date.pipe';
import {
  MatBottomSheet,
  MatBottomSheetModule
} from '@angular/material/bottom-sheet';
import { CommentCreateComponent } from '../comment-create/comment-create.component';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { PostEditComponent } from '../post-edit/post-edit.component';
import { MatIcon } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import {MatTooltipModule} from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';




@Component({
  selector: 'app-post-detail',
  standalone: true,
  imports: [MatButtonModule,MatCardModule,CommonModule, ToDatePipe,
    MatIcon, MatTooltipModule, MatChipsModule,
  ],
  templateUrl: './post-detail.component.html',
  styleUrl: './post-detail.component.scss'
})
export class PostDetailComponent implements OnInit {  
  postId!: string;
  post$:Observable<Post> = new Observable<Post>();
  comments$:Observable<Comment[]> = new Observable<Comment[]>();
  currentUserId$:any;
  isLiked$!: Observable<boolean>;
  currentUserId: string | null = null;
  @Output() 
  postEdited = new EventEmitter<Post>();
  @Output() 
  postDeleted = new EventEmitter<Post>();
  constructor(
    private route: ActivatedRoute,
    private forum: ForumService,
    private auth: AuthService,
    private bottomSheet :MatBottomSheet,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}  
   
  async ngOnInit(){   
   this.postId = this.route.snapshot.paramMap.get('id')!;    
    this.post$ = this.forum.getForumPostById(this.postId);
    this.comments$ = this.forum.getForumPostComments(this.postId);
    const user = await firstValueFrom(this.auth.getCurrentUser().pipe(take(1)));
    this.loadUser().then(()=>{
      this.currentUserId = user?.uid ?? null;
      if (this.currentUserId) {
        this.isLiked$ = this.forum
          .getUserLikedPosts(this.currentUserId)
          .pipe(map(ids => ids.includes(this.postId)));
      } else {
        this.isLiked$ = of(false);
      }
    });    
  }

  async loadUser(){     
    this.currentUserId$  = await firstValueFrom(this.auth.getCurrentUser().pipe(take(1)));
  }
  
  openEditPost(postEdit: Post) {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;
    dialogConfig.minWidth = '300px';
    dialogConfig.data = postEdit;
    this.dialog.open(PostEditComponent, dialogConfig)
    .afterClosed()
    .subscribe(result => {
      if (result){
        console.log('postEdit', result);        
        this.postEdited.emit(result);
        this.post$ = of(result);
      }
    });
  }

  openComment() {    
    const id = this.route.snapshot.paramMap.get('id')!;
    console.log('openComment creation with id:', id);
    this.bottomSheet.open(CommentCreateComponent, {
      data: { postId: id}
    });
  }

  toggleLike() {
    if (!this.currentUserId) return;
    this.forum
      .toggleLike(this.postId, this.currentUserId)
      .subscribe(); // transaction updates both docs for you
  }
  share() {
    // Build full URL to this post
    const url = `${window.location.origin}/forum/${this.postId}`;
    navigator.clipboard
      .writeText(url)
      .then(() => {
        this.snackBar.open('Link copied to clipboard', 'Dismiss', {
          duration: 3000
        });
      })
      .catch(err => {
        console.error('Failed to copy link', err);
        this.snackBar.open('Could not copy link', 'Dismiss', { duration: 3000 });
      });
  }
}
