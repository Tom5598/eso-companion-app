import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { combineLatest, firstValueFrom, map, Observable, startWith, take, tap } from 'rxjs';
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
import { MatChip, MatChipsModule } from '@angular/material/chips';
import { MatTooltip } from '@angular/material/tooltip';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { PostFilterOptions } from '../../models/post-filter-options.model';
import { MatFormField, MatFormFieldModule, MatLabel } from '@angular/material/form-field';
import { MatNativeDateModule, MatOption } from '@angular/material/core';
import {MatDatepickerModule, MatDateSelectionModel} from '@angular/material/datepicker';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { MatInputModule } from '@angular/material/input';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {MatSelectModule} from '@angular/material/select';
import { BreakpointObserver } from '@angular/cdk/layout';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import { LoadingIndicatorComponent } from "../../components/loading-indicator/loading-indicator.component";
import { TranslatePipe } from '@ngx-translate/core';
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
    MatDialogModule, ToDatePipe, MatChipsModule, MatTooltip, ReactiveFormsModule, MatFormField, MatLabel, MatDatepickerModule, MatOption, MatChip,
    MatFormFieldModule, MatInputModule, MatSlideToggleModule, MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSlideToggleModule,
    MatNativeDateModule, MatProgressSpinnerModule,
    LoadingIndicatorComponent, TranslatePipe,
],
  templateUrl: './forum.component.html',
  styleUrl: './forum.component.scss'
})
export class ForumComponent {  
  private forum = inject(ForumService);
  private dialog = inject(MatDialog);
  readonly auth = inject(AuthService);
  private fb = inject(FormBuilder);
  private bo   = inject(BreakpointObserver);
  posts$!: Observable<Post[]>;
  user :any;
  filterForm: any;
  tags$!: Observable<string[]>;
  showFilters = true; 
  viewMode: 'list' | 'grid' = 'list';

  constructor(private afs: AngularFirestore) {
    this.filterForm = this.fb.group({
      titleFilter:    [''],      
      dateOrder:      ['desc'],
      hashtags:       [[]] as unknown as string[],
      hotFirst:       [false],       
    });
    this.bo
      .observe('(max-width: 700px)')
      .subscribe(state => this.showFilters = !state.matches);
  }
  
  async ngOnInit() {
    this.posts$ = this.forum.getLatestForumPosts();
    this.user = await firstValueFrom(this.auth.getCurrentUser().pipe(take(1)));
    this.tags$ = this.afs
      .doc<{ tags: string[] }>('utils/hashtags')
      .valueChanges()
      .pipe(map(doc => doc?.tags || []));      
  }
  toggleView(mode: 'list' | 'grid') {
       this.viewMode = mode;
     }
  clearTags() {
    this.filterForm.get('hashtags')!.setValue([]);
  }

  applyFilters() {
    const v = this.filterForm.value;
    const opts: PostFilterOptions = {
      title:      v.titleFilter,      
      dateOrder:  v.dateOrder,
      hashtags:   v.hashtags,
      hotFirst:   v.hotFirst
    };
    this.posts$ = this.forum.getFilteredForumPosts(opts);    
  }

  toggleFilters() {
    this.showFilters = !this.showFilters;
  }   
  
  openPostDialog() {
    this.dialog.open(PostCreateComponent, { width: '600px' });
  }

}