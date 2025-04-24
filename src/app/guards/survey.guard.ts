import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { SurveyService } from '../services/survey.service';
import { Observable, of } from 'rxjs';
import { switchMap, take, map, tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class SurveyGuard implements CanActivate {
  constructor(
    private auth: AuthService,
    private surveySvc: SurveyService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean> {
    const surveyId = route.paramMap.get('surveyId')!;
    return this.auth.getCurrentUser().pipe(
      switchMap(u => {
        if (!u) {
          this.router.navigate(['/login']);
          return of(false);
        }
        return this.surveySvc.getUserAnswers(u.uid).pipe(
          take(1),
          map(doc => !!doc ? !doc.entries[surveyId]?.completed : true),
          tap(ok => { if (!ok) this.router.navigate(['/profile']); })
        );
      })
    );
  }
}
