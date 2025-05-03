import { AfterViewInit, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule }      from '@angular/common';
import { MatToolbarModule }  from '@angular/material/toolbar';
import { MatIconModule }     from '@angular/material/icon';
import { MatButtonModule }   from '@angular/material/button';
import { MatCardModule }     from '@angular/material/card';
import { MatDividerModule }  from '@angular/material/divider';

import { ArticleService, ArticleItem } from '../../services/article.service';
import { last, Observable, of, switchMap }   from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { TranslatePipe } from '@ngx-translate/core';
import { AngularFireAnalytics } from '@angular/fire/compat/analytics';

@Component({
  selector: 'app-article-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatDividerModule,
    TranslatePipe,
  ],
  templateUrl: './article-detail.component.html',
  styleUrl: './article-detail.component.scss'
})
export class ArticleDetailComponent implements OnInit, AfterViewInit {
  article$!: Observable<ArticleItem | undefined>;
  isAdmin$ !: Observable<boolean> ;
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private articleSvc: ArticleService,
    private auth:AuthService,
    private analytics: AngularFireAnalytics
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.article$ = this.articleSvc.getArticle(id);
    this.isAdmin$ = this.auth.isAdmin$();    
  }

  ngAfterViewInit(): void {
    this.article$.subscribe((article) => {
      if (article) {
        this.analytics.logEvent('article_view', { article_id: article.id, article_title: article.title });
      }
    });
  }

  goBack() {
    this.router.navigateByUrl('/home');   
  }
  
  deleteArticle(id: string) {
    this.articleSvc.deleteArticle(id).pipe(
      last(), // Wait for the observable to complete
      switchMap(() => {
        this.router.navigateByUrl('/home'); // Navigate after deletion
        return of(null); // Return null to satisfy the observable type
      })
    ).subscribe(  // Subscribe to trigger the observable
      () => {},
      (error) => {
        console.error('Error deleting article:', error);
      }
    ); 
  }
}
