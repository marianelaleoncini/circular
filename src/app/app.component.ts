import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavigationComponent } from './navigation/navigation.component';
import { AuthService } from './auth/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavigationComponent, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  isAuthenticated = false;
  isAdmin = false;

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.authService.getCurrentUser().subscribe(async (user) => {
      if (user) {
        const isBanned = await this.authService.isUserBanned(user.uid);

        if (isBanned) {
          this.isAuthenticated = false;
          this.isAdmin = false;
        } else {
          this.isAuthenticated = true;
          this.isAdmin = this.authService.checkIfAdmin(user.email);
        }
      } else {
        this.isAuthenticated = false;
        this.isAdmin = false;
      }
    });
  }
}
