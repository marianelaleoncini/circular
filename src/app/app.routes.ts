import { Routes } from '@angular/router';
import { ResetPasswordComponent } from './auth/reset-password/reset-password.component';
import { AuthComponent } from './auth/auth.component';
import { HomeComponent } from './home/home.component';
import { authGuard } from './auth/auth.guard';
import { PostsComponent } from './posts/posts.component';
import { ProfileComponent } from './profile/profile.component';
import { ChatComponent } from './chat/chat.component';
import { PublicProfileComponent } from './public-profile/public-profile.component';
import { TermsComponent } from './auth/terms/terms.component';
import { PrivacyPolicyComponent } from './auth/privacy-policy/privacy-policy.component';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component';
import { adminGuard } from './auth/admin.guard';
import { FaqComponent } from './faq/faq.component';

export const routes: Routes = [
  { path: 'auth', component: AuthComponent },
  { path: 'home', component: HomeComponent, canActivate: [authGuard] },
  { path: 'posts', component: PostsComponent, canActivate: [authGuard] },
  { path: 'posts/:id', component: PostsComponent, canActivate: [authGuard] },
  { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },
  { path: 'chat', component: ChatComponent, canActivate: [authGuard] },
  {
    path: 'perfil-publico/:id',
    component: PublicProfileComponent,
    canActivate: [authGuard],
  },
  { path: 'faqs', component: FaqComponent, canActivate: [authGuard] },
  {
    path: 'admin-dashboard',
    component: AdminDashboardComponent,
    canActivate: [adminGuard],
  },
  { path: 'reset-password', component: ResetPasswordComponent },
  { path: 'terminos', component: TermsComponent },
  { path: 'politica-de-privacidad', component: PrivacyPolicyComponent },
  { path: '**', redirectTo: 'auth' },
  { path: '', redirectTo: '/home', pathMatch: 'full' },
];
