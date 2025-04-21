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
import { LoadingIndicatorComponent } from '../../../components/loading-indicator/loading-indicator.component';




@Component({
  selector: 'app-post-detail',
  standalone: true,
  imports: [MatButtonModule,MatCardModule,CommonModule, ToDatePipe,
    MatIcon, MatTooltipModule, MatChipsModule,LoadingIndicatorComponent,
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
  loadedMap: Record<string, boolean> = {};
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
    private snackBar: MatSnackBar,
     private router: Router,
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
    this.post$.subscribe(post => {
      // reset all to false whenever the post changes
      this.loadedMap = {};
      (post.linkedPictures || []).forEach(url => this.loadedMap[url] = false);
    });    
  }
  onImageLoad(url: string) {
    this.loadedMap[url] = true;
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
  onDeletePost(postId: string) {
    if (!confirm('Delete this post? This cannot be undone.')) return;
    this.forum.deletePost(postId).subscribe({
      next: () => {
        this.snackBar.open('Post deleted', 'Dismiss', { duration: 3000 });
        this.router.navigate(['/forum']);
      },
      error: err => {
        console.error(err);
        this.snackBar.open('Could not delete post', 'Dismiss', { duration: 3000 });
      }
    });
  }
   /** Delete a comment under this post and refresh the comments list */
   onDeleteComment(commentId: string) {
    if (!confirm('Delete this comment?')) return;
    this.forum.deleteComment(this.postId, commentId).subscribe({
      next: () => {
        this.snackBar.open('Comment deleted', 'Dismiss', { duration: 2000 });
        // reload comments$
        this.comments$ = this.forum.getForumPostComments(this.postId);
      },
      error: err => {
        console.error(err);
        this.snackBar.open('Could not delete comment', 'Dismiss', { duration: 2000 });
      }
    });
  }
}
