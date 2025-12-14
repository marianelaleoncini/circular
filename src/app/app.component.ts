import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavigationComponent } from './navigation/navigation.component';
import { AuthService } from './auth/auth.service';
import { CommonModule } from '@angular/common';
import { LoadingComponent } from './common/loading/loading.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavigationComponent, CommonModule, LoadingComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  isAuthenticated = false;
  isLoading = true;

  constructor(private authService: AuthService) {
    this.authService.getCurrentUser().subscribe(user => {
      this.isAuthenticated = !!user; // true si hay usuario, false si no
      this.isLoading = false;
    });
  }
}