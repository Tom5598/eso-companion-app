import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCard, MatCardModule } from '@angular/material/card';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Post } from '../../../models/post.model';
import {
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  filter,
  firstValueFrom,
  from,
  map,
  Observable,
  of,
  shareReplay,
  Subject,
  switchMap,
  take,
  tap,
} from 'rxjs';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { CommonModule } from '@angular/common';
import { ForumService } from '../../../services/forum.service';
import { AuthService } from '../../../services/auth.service';
import { Comment } from '../../../models/comment.model';
import { ToDatePipe } from '../../../util/timestampt-to-date.pipe';
import { MatBottomSheet} from '@angular/material/bottom-sheet';
import { CommentCreateComponent } from '../comment-create/comment-create.component';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { PostEditComponent } from '../post-edit/post-edit.component';
import { MatIcon } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { LoadingIndicatorComponent } from '../../../components/loading-indicator/loading-indicator.component';
import { CommodityService } from '../../../services/commodity.service';
import { CommodityNames } from '../../../models/commodity-names.model';
import { TranslatePipe } from '@ngx-translate/core';

type Token = { type: 'text' | 'commodity'; value: string , link : string};

@Component({
  selector: 'app-post-detail',
  standalone: true,
  imports: [
    MatButtonModule,
    MatCardModule,
    CommonModule,
    ToDatePipe,
    MatIcon,
    MatTooltipModule,
    MatChipsModule,
    LoadingIndicatorComponent,RouterModule,TranslatePipe,
  ],
  templateUrl: './post-detail.component.html',
  styleUrl: './post-detail.component.scss',
})
export class PostDetailComponent implements OnInit {
  postId!: string;
  post$: Observable<Post> = new Observable<Post>();
  comments$: Observable<Comment[]> = new Observable<Comment[]>();
  currentUserId$: any;
  isLiked$!: Observable<boolean>;
  currentUserId: string | null = null;
  loadedMap: Record<string, boolean> = {};
  isLocked!: boolean;
  contentTokens: {type: 'text' | 'commodity'; value: string; link?: string}[] = [];
  isAdmin$!: Observable<boolean> ;
  isAdmin: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private forum: ForumService,
    private auth: AuthService,
    private bottomSheet: MatBottomSheet,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router,
    private commoditySvc: CommodityService,
  ) {}

  async ngOnInit() {
    this.postId = this.route.snapshot.paramMap.get('id')!;
    this.isAdmin$ = this.auth.isAdmin$();
    // 1) Grab name→link list once
    const names$: Observable<CommodityNames[]> =
      this.commoditySvc
        .getCommodityNames()
        .pipe(shareReplay(1));

    // 2) Combine the real-time post stream with that lookup table
    this.post$ = combineLatest([
      this.forum.getForumPostById(this.postId),  // streams forever
      names$
    ]).pipe(
      // 3) On every emission, build the lookup map & tokenize
      tap(([post, names]) => {
        if (!post) {
          this.router.navigate(['/not-found']);
          return;
        }
        this.isLocked=post.isLocked;
        // build quick lookup: { "wood": "/market/wood-id", ... }
        const lookup: Record<string,string> = {};
        for (const n of names) {
          lookup[n.name] = n.link;
        }
        // split + enrich tokens
        this.contentTokens = this.tokenize(post.content, lookup);
      }),
      // 4) throw away any null post, so downstream sees only Post
      filter((pair): pair is [Post, CommodityNames[]] => pair[0] !== null),
      // 5) map back to the Post itself
      map(([post]) => post)
    );
    this.comments$ = this.forum.getForumPostComments(this.postId);
    const user = await firstValueFrom(this.auth.getCurrentUser().pipe(take(1)));
    this.loadUser().then(() => {
      this.currentUserId = user?.uid ?? null;
      if (this.currentUserId) {
        this.isLiked$ = this.forum
          .getUserLikedPosts(this.currentUserId)
          .pipe(map((ids) => ids.includes(this.postId)));
      } else {
        this.isLiked$ = of(false);
      } 
      this.isAdmin$.pipe(take(1)).subscribe((isAdmin) => {
        this.isAdmin = isAdmin;}
      );
      
      
    });
    this.post$.subscribe((post) => {
      // reset all to false whenever the post changes
      this.loadedMap = {};
      (post.linkedPictures || []).forEach(
        (url) => (this.loadedMap[url] = false)
      );
    });
  }
  
  private tokenize(text: string, lookup: Record<string, string>): Token[] {    
    // split on $word tokens
    const parts = text.split(/(\$[A-Za-z]+)/g);
    return parts.map((p) => {
      const m = /^\$([A-Za-z]+)$/.exec(p);
      if (m) {
        const name = m[1];
        const link = lookup[name];
        if (link) {
          return { type: 'commodity', value: name, link: link };
        }
      }
      return { type: 'text', value: p, link: '' };
    });
  }

  onImageLoad(url: string) {
    this.loadedMap[url] = true;
  }
  async loadUser() {
    this.currentUserId$ = await firstValueFrom(
      this.auth.getCurrentUser().pipe(take(1))
    );
  }
  goToCommodity(link:string|undefined){
    if(link === undefined) return;
    this.router.navigateByUrl('/market/commodity/' + link);
  }
  openEditPost(postEdit: Post) {
    if( this.isLocked) {
      this.snackBar.open('Post is locked', 'Dismiss', { duration: 3000 });
      return;
    }
    const dialogConfig = new MatDialogConfig();
    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;
    dialogConfig.minWidth = '300px';
    dialogConfig.data = postEdit;
    this.dialog
      .open(PostEditComponent, dialogConfig)
      .afterClosed()
      .subscribe((result) => {
        if (result) {
          // write the changes back into Firestore:
          this.forum.updatePost(this.postId, {
            title:   result.title,
            content: result.content,
            isEdited: true,
            updatedAt: new Date()
          }).subscribe({
            next: () => {
              // snackbar, etc. no need to touch post$ 
            },
            error: err => { /* handle error */ }
          });
        }
      });
  }
 
  openComment() {
    if( this.isLocked) {
      this.snackBar.open('Post is locked', 'Dismiss', { duration: 3000 });
      return;
    }
    const id = this.postId!;
    this.bottomSheet.open(CommentCreateComponent, {
      data: { postId: id },
    });
  }

  toggleLike() {
    if (!this.currentUserId) return;
    if( this.isLocked) {
      this.snackBar.open('Post is locked', 'Dismiss', { duration: 3000 });
      return;
    }
    this.forum.toggleLike(this.postId, this.currentUserId).subscribe(); // transaction updates both docs for you
  }
  share() {
    // Build full URL to this post
    const url = `${window.location.origin}/forum/${this.postId}`;
    navigator.clipboard
      .writeText(url)
      .then(() => {
        this.snackBar.open('Link copied to clipboard', 'Dismiss', {
          duration: 3000,
        });
      })
      .catch((err) => {
        console.error('Failed to copy link', err);
        this.snackBar.open('Could not copy link', 'Dismiss', {
          duration: 3000,
        });
      });
  }
  onToggleLockPost(postID: string) {
    return this.forum.toggleLockPost(postID, this.isLocked).subscribe({
      next: () => {
        this.snackBar.open('Post lock toggled', 'Dismiss', { duration: 3000 });
        this.router.navigate(['/forum']);
      },
      error: (err: any) => {
        console.error(err);
        this.snackBar.open('Could not toggle lock on post', 'Dismiss', {
          duration: 3000,
        });
      },
    });
  } 
  onDeletePost(postId: string) {
    if (!confirm('Delete this post? This cannot be undone.')) return;
    this.forum.deletePost(postId).subscribe({
      next: () => {
        this.snackBar.open('Post deleted', 'Dismiss', { duration: 3000 });
        this.router.navigate(['/forum']);
      },
      error: (err) => {
        console.error(err);
        this.snackBar.open('Could not delete post', 'Dismiss', {
          duration: 3000,
        });
      },
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
      error: (err) => {
        console.error(err);
        this.snackBar.open('Could not delete comment', 'Dismiss', {
          duration: 2000,
        });
      },
    });
  }
}
