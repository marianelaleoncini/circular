import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PostService } from '../posts/posts.service';
import { AuthService } from '../auth/auth.service'; // O el servicio donde hayas puesto getUserById
import { ReportDialogComponent } from './report-dialog/report-dialog.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';

@Component({
  selector: 'app-public-profile',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatMenuModule
  ],
  templateUrl: './public-profile.component.html',
  styleUrls: ['./public-profile.component.scss'],
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
    private authService: AuthService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
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
    this.authService.getUserById(this.userId).subscribe((user) => {
      this.userData = user;
    });

    // 2. Buscamos sus calificaciones
    this.postService.getUserRatings(this.userId).subscribe((ratings) => {
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

  openReportDialog() {
    const dialogRef = this.dialog.open(ReportDialogComponent, {
      width: '400px',
      data: {
        userName: this.userData.displayName || 'Usuario',
        userId: this.userId,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        // Acá llamamos al servicio que acabamos de crear
        this.authService
          .reportUser(
            this.userId,
            this.userData.displayName,
            result.reason,
            result.details,
          )
          .then(() => {
            this.snackBar.open(
              'Denuncia enviada. Revisaremos el caso a la brevedad.',
              'Cerrar',
              { duration: 4000 },
            );
          })
          .catch((error) => {
            console.error('Error al enviar denuncia:', error);
            this.snackBar.open(
              'Hubo un error al enviar la denuncia.',
              'Cerrar',
              { duration: 3000 },
            );
          });
      }
    });
  }

  goBack() {
    this.router.navigate(['/home']);
  }
}
