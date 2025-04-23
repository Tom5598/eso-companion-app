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

export const routes: Routes = [
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },
    { path: 'forum', component: ForumComponent },
    { path: 'forum/post-edit/:id',component: PostEditComponent, canActivate: [AuthGuard,PostExistsGuard] },
    { path : 'forum/post-create', component: PostCreateComponent, canActivate: [AuthGuard]},
    { path: 'forum/:id', component :PostDetailComponent, canActivate: [PostExistsGuard] },     
    { path: 'home', component: HomeComponent },
    { path: 'profile', component: ProfileComponent, canActivate: [AuthGuard] },
    { path: 'not-found', component: PageNotFoundComponent,   },
    { path: '**', component: PageNotFoundComponent,  },
    {path: '', redirectTo: 'home', pathMatch: 'full'},
];
