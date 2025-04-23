// src/app/guards/post-exists.guard.ts
import { Injectable }          from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  Router
} from '@angular/router';
import { Observable, of }      from 'rxjs';
import { catchError, map, take } from 'rxjs/operators';
import { ForumService }        from '../services/forum.service';
import { Post } from '../models/post.model';

@Injectable({ providedIn: 'root' })
export class PostExistsGuard implements CanActivate {
  constructor(
    private forum: ForumService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean> {     
    const id = route.paramMap.get('id'); 
    if (!id) {     
      this.router.navigateByUrl('/not-found');
      return of(false);
    }
    return this.forum.getForumPostById(id).pipe(
      take(1),
      map((post:Post|null)  => {        
        if (post?.authorId) {
          return true;
        } 
        console.log('Post not found, redirecting to 404 page' );        
        this.router.navigateByUrl('/not-found');
        return false;
      }),
      catchError(_ => {
        this.router.navigateByUrl('/not-found');
        return of(false);
      })
    );
  }
}