import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PostService } from '../posts/posts.service';
import { AuthService } from '../auth/auth.service'; // O el servicio donde hayas puesto getUserById

@Component({
  selector: 'app-public-profile',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './public-profile.component.html',
  styleUrls: ['./public-profile.component.scss']
})
export class PublicProfileComponent implements OnInit {
  userId: string = '';
  userData: any = null;
  ratings: any[] = [];
  averageRating: number = 0;
  
  isLoading = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private postService: PostService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.userId = id;
        this.loadPublicProfile();
      } else {
        this.router.navigate(['/']);
      }
    });
  }

  loadPublicProfile() {
    this.isLoading = true;

    // 1. Buscamos los datos básicos del usuario (nombre, foto)
    this.authService.getUserById(this.userId).subscribe(user => {
      this.userData = user;
    });

    // 2. Buscamos sus calificaciones
    this.postService.getUserRatings(this.userId).subscribe(ratings => {
      this.ratings = ratings;
      this.calculateAverageRating();
      this.isLoading = false;
    });
  }

  calculateAverageRating() {
    if (this.ratings.length === 0) {
      this.averageRating = 0;
      return;
    }
    const sum = this.ratings.reduce((acc, curr) => acc + curr.rating, 0);
    this.averageRating = sum / this.ratings.length;
  }

  getStarsArray(rating: number): number[] {
    return [1, 2, 3, 4, 5];
  }

  goBack() {
    this.router.navigate(['/home']);
  }
}