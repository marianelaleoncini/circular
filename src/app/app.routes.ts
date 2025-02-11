import { Routes } from '@angular/router';
import { ResetPasswordComponent } from './auth/reset-password/reset-password.component';
import { AuthComponent } from './auth/auth.component';
import { HomeComponent } from './home/home.component';
import { authGuard } from './auth/auth.guard';
import { PostsComponent } from './posts/posts.component';
import { ProfileComponent } from './profile/profile.component';
import { ChatComponent } from './chat/chat.component';
import { PostComponent } from './posts/post/post.component';

export const routes: Routes = [
  { path: 'auth', component: AuthComponent },
  { path: 'home', component: HomeComponent, canActivate: [authGuard] },
  { path: 'posts', component: PostsComponent, canActivate: [authGuard] },
  { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },
  { path: 'chat', component: ChatComponent, canActivate: [authGuard] },
  { path: 'reset-password', component: ResetPasswordComponent },
  { path: '**', redirectTo: 'auth' },
  { path: '', redirectTo: '/home', pathMatch: 'full' },
];
