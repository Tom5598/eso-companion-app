import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { firstValueFrom, Observable, take } from 'rxjs';
import { ForumService } from '../../services/forum.service';
import { Post } from '../../models/post.model';
import { RouterModule } from '@angular/router';
import { ToDatePipe } from '../../util/timestampt-to-date.pipe'; 
// Material
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { PostCreateComponent } from './post-create/post-create.component';
import { AuthService } from '../../services/auth.service';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltip } from '@angular/material/tooltip';

@Component({
  selector: 'app-forum',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatSidenavModule,
    MatListModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule, ToDatePipe, MatChipsModule, MatTooltip
  ],
  templateUrl: './forum.component.html',
  styleUrl: './forum.component.scss'
})
export class ForumComponent {
  private forum = inject(ForumService);
  private dialog = inject(MatDialog);
  auth = inject(AuthService);
  
  posts$!: Observable<Post[]>;
  user :any;
  async ngOnInit() {
    this.posts$ = this.forum.getLatestForumPosts();
    this.user = await firstValueFrom(this.auth.getCurrentUser().pipe(take(1)));
  }

  openPostDialog() {
    this.dialog.open(PostCreateComponent, { width: '600px' });
  }
}