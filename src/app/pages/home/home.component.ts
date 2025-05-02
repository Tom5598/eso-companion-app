import { Component, OnInit } from '@angular/core';
import { CommonModule }      from '@angular/common';
import { ArticleService, ArticleItem } from '../../services/article.service';
import { Observable }        from 'rxjs';

import { MatCardModule }     from '@angular/material/card';
import { MatToolbarModule }  from '@angular/material/toolbar';
import { MatButtonModule }   from '@angular/material/button';
import { MatDividerModule }  from '@angular/material/divider';
import { RouterModule } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatCardModule,
    MatDividerModule,
    MatButtonModule,
    RouterModule,TranslatePipe,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  articles$!: Observable<ArticleItem[]>;

  constructor(private articleSvc: ArticleService) {}

  ngOnInit() {
    this.articles$ = this.articleSvc.getArticles();
  }

}
