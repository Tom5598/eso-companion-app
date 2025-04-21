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
import { ActivatedRoute, Router } from '@angular/router';
import { Post } from '../../../models/post.model';
import {
  combineLatest,
  debounceTime,
  distinctUntilChanged,
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
import {
  MatBottomSheet,
  MatBottomSheetModule,
} from '@angular/material/bottom-sheet';
import { CommentCreateComponent } from '../comment-create/comment-create.component';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { PostEditComponent } from '../post-edit/post-edit.component';
import { MatIcon } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { LoadingIndicatorComponent } from '../../../components/loading-indicator/loading-indicator.component';
import { CommodityPopupComponent } from '../../../components/commodity-popup/commodity-popup.component';
import { CommodityService } from '../../../services/commodity.service';
import { Commodity } from '../../../models/commodity.model';
import { ChartConfiguration } from 'chart.js';

type Token = { type: 'text' | 'commodity'; value: string };
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
    LoadingIndicatorComponent,
    CommodityPopupComponent,
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
  //parsing tokens for mentions
  contentTokens: { type: 'text' | 'commodity'; value: string }[] = [];
  // For hover mechanics
  clickedCommodity!: Commodity | null;
  clickedChartConfig!: ChartConfiguration<'line'>;
  popupX = 0;
  popupY = 0;

  @Output()
  postEdited = new EventEmitter<Post>();
  @Output()
  postDeleted = new EventEmitter<Post>();
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
    this.post$ = this.forum.getForumPostById(this.postId).pipe(
      tap(post => {
        this.contentTokens = this.tokenize(post.content);          
      })
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
    });
    this.post$.subscribe((post) => {
      // reset all to false whenever the post changes
      this.loadedMap = {};
      (post.linkedPictures || []).forEach(
        (url) => (this.loadedMap[url] = false)
      );
    });
     
  }

   
   /** Called on tag click */
   onTagClick(symbol: string, e: MouseEvent) {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    //get window width and height
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    this.popupX = windowWidth/2 - 200;
    this.popupY = windowHeight/2 - 300;

    this.commoditySvc.getCommodityByName(symbol)
    .pipe(
      take(1),
      map((c)=>{
        this.clickedCommodity = c;
        // build chart config same as before
        const last30 = c.historical.slice(-30);
        const dates  = last30.map(h => h.date );
        const prices = last30.map(h => h.price);
        this.clickedChartConfig = {
          type: 'line',
          data: { labels: dates, datasets:[{ data: prices, label:'Price', fill:false, tension:0.1 }] },
          options: { responsive:true, plugins:{legend:{display:false}}, scales:{x:{display:false}} }
        };
      }),
      shareReplay(1)).subscribe();
  }

  /** Manually close the popup */
  closePopup() {
    this.clickedCommodity = null;     
  }

  private tokenize(text: string): Token[] {
    const parts = text.split(/(\$[A-Za-z]+)/g);
    return parts.map(p =>
      /^\$[A-Za-z]+$/.test(p)
        ? { type: 'commodity' as const, value: p.substring(1) }
        : { type: 'text' as const, value: p }
    );
  }

  trackByToken(_: number, t: { type: string; value: string }) {
    return t.type + '|' + t.value;
  }

  onImageLoad(url: string) {
    this.loadedMap[url] = true;
  }
  async loadUser() {
    this.currentUserId$ = await firstValueFrom(
      this.auth.getCurrentUser().pipe(take(1))
    );
  }

  openEditPost(postEdit: Post) {
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
      data: { postId: id },
    });
  }

  toggleLike() {
    if (!this.currentUserId) return;
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
