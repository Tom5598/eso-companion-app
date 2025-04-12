import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { ForumComponent } from './pages/forum/forum.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { AuthGuard } from './guards/auth.guard';
import { HomeComponent } from './pages/home/home.component';
import { TmpComponent } from './pages/tmp/tmp.component'; // Temporary component for testing

export const routes: Routes = [
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },
    { path: 'forum', component: ForumComponent },
    { path: 'home', component: HomeComponent },
    { path: 'tmp', component: TmpComponent },
    { path: 'profile', component: ProfileComponent, canActivate: [AuthGuard] },
    {path: '', redirectTo: 'home', pathMatch: 'full'},
];
