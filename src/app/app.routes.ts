import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { ForumComponent } from './pages/forum/forum.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { AuthGuard } from './guards/auth.guard';
import { HomeComponent } from './pages/home/home.component';
import { PostCreateComponent } from './pages/forum/post-create/post-create.component';
import { PostEditComponent } from './pages/forum/post-edit/post-edit.component';
import { PostDetailComponent } from './pages/forum/post-detail/post-detail.component';
import { PageNotFoundComponent } from './components/page-not-found/page-not-found.component';
import { PostExistsGuard } from './guards/post-exist.guard';
import { SurveyComponent } from './pages/survey/survey.component';
import { SurveyGuard } from './guards/survey.guard';
import { ResetPasswordComponent } from './components/reset-password/reset-password.component';
import { ResetPasswordConfirmComponent } from './components/reset-password-confirm/reset-password-confirm.component';
import { AdminGuard } from './guards/admin.guard';
import { AdminDashboardComponent } from './pages/admin-dashboard/admin-dashboard.component';
import { SurveyManagementComponent } from './pages/admin-dashboard/survey-management/survey-management.component';
import { ArticlesComponent } from './pages/admin-dashboard/articles/articles.component';
import { EmailsComponent } from './pages/admin-dashboard/emails/emails.component';
import { UsersComponent } from './pages/admin-dashboard/users/users.component';
import { StatisticsComponent } from './pages/admin-dashboard/statistics/statistics.component';
import { ArticleDetailComponent } from './components/article-detail/article-detail.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'home', component: HomeComponent },
  { path: 'forum', component: ForumComponent },
  {
    path: 'forum/post-edit/:id',
    component: PostEditComponent,
    canActivate: [AuthGuard, PostExistsGuard],
  },
  {
    path: 'forum/post-create',
    component: PostCreateComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'forum/:id',
    component: PostDetailComponent,
    canActivate: [PostExistsGuard],
  },

  { path: 'articles/:id', component: ArticleDetailComponent },
  { path: 'profile', component: ProfileComponent, canActivate: [AuthGuard] },
  {
    path: 'survey/:surveyId',
    component: SurveyComponent,
    canActivate: [AuthGuard, SurveyGuard],
  },
  { path: 'reset-password', component: ResetPasswordComponent },
  { path: 'reset-password-confirm', component: ResetPasswordConfirmComponent },
  {
    path: 'admin',
    component: AdminDashboardComponent,
    canActivate: [AdminGuard],
    children: [
      { path: 'survey', component: SurveyManagementComponent },
      { path: 'articles', component: ArticlesComponent },
      { path: 'emails', component: EmailsComponent },
      { path: 'users', component: UsersComponent },
      { path: 'statistics', component: StatisticsComponent },
      { path: '', redirectTo: 'admin', pathMatch: 'full' },
    ],
  },
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'not-found', component: PageNotFoundComponent },
  { path: '**', component: PageNotFoundComponent },
];
