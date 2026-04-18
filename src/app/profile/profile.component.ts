import { Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { AuthService } from '../auth/auth.service';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { LocationService } from '../common/services/location.service';
import { UtilsService } from '../common/services/utils.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { PostService } from '../posts/posts.service';
import { MatDialog } from '@angular/material/dialog';
import { RatingDialogComponent } from './rating-dialog/rating-dialog.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTabsModule,
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent implements OnInit {
  profileForm: FormGroup;
  isLoading = false;
  user: any;
  provinces: any;
  selectedProvince: any;
  cities: any;
  selectedCity: any;
  uploadingImage = false;
  imageUrl: any;
  sales: any[] = [];
  purchases: any[] = [];
  isLoadingHistory = true;
  ratings: any[] = [];
  averageRating: number = 0;
  isLoadingRatings = true;
  selectedTabIndex = 0;

  constructor(
    private authService: AuthService,
    private fb: FormBuilder,
    private locationService: LocationService,
    private utilsService: UtilsService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    private postService: PostService,
    private dialog: MatDialog,
  ) {
    this.profileForm = this.fb.group({
      name: ['', Validators.required],
      photoURL: [''],
      city: [{ value: '', disabled: true }, Validators.required],
      province: ['', Validators.required],
    });
  }

  ngOnInit() {
    this.locationService.getProvinces().subscribe((provinces) => {
      this.provinces = provinces;
    });

    this.authService.getUserProfile().then((profile) => {
      if (profile) {
        this.user = profile;
        this.imageUrl = this.user.photoURL;

        this.profileForm.patchValue(
          {
            name: this.user.displayName,
            photoURL: this.user.photoURL,
            province: this.user.province || '',
            city: this.user.city || '',
          },
          { emitEvent: false },
        );

        if (this.user.province) {
          this.loadCities(this.user.province, this.user.city);
          this.profileForm.get('city')?.enable({ emitEvent: false });
        }

        this.loadTransactionHistory(this.user.uid);
      }
    });

    this.profileForm.get('province')?.valueChanges.subscribe((provinceId) => {
      if (provinceId) {
        this.profileForm.get('city')?.enable();
        this.loadCities(provinceId);
        this.profileForm.patchValue({ city: '' });
      } else {
        this.profileForm.get('city')?.disable();
        this.cities = [];
        this.profileForm.patchValue({ city: '' });
      }
    });

    this.route.queryParams.subscribe(params => {
      if (params['tab'] === 'compras') {
        this.selectedTabIndex = 1;
      } else if (params['tab'] === 'ventas') {
        this.selectedTabIndex = 2;
      }
    });
  }

  setCityDisabled() {
    return !this.profileForm?.get('province')?.value;
  }

  loadCities(provinceId: string, selectedCityId?: string) {
    this.locationService.getCities(provinceId).subscribe((cities) => {
      this.cities = cities;
      if (
        selectedCityId &&
        cities.some((city: any) => city.name === selectedCityId)
      ) {
        this.profileForm.patchValue({ city: selectedCityId });
      }
    });
  }

  async saveProfile() {
    if (this.profileForm.invalid) return;
    this.isLoading = true;

    const { name, city, province } = this.profileForm.getRawValue();

    const photoURL = this.imageUrl;

    await this.authService.saveUserProfile(name, photoURL, city, province);
    this.snackBar.open('Perfil guardado con éxito', 'Cerrar', {
      duration: 4000,
    });
    this.isLoading = false;
    this.router.navigate(['/home']);
  }

  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      this.uploadingImage = true;
      this.utilsService.uploadImage(file).subscribe((url) => {
        this.imageUrl = url;
        this.uploadingImage = false;
      });
    }
  }

  loadTransactionHistory(userId: string) {
    this.isLoadingHistory = true;
    this.isLoadingRatings = true; // Iniciamos la carga

    this.postService.getUserSales(userId).subscribe((data) => {
      this.sales = data;
    });

    this.postService.getUserPurchases(userId).subscribe((data) => {
      this.purchases = data;
      this.isLoadingHistory = false;
    });

    // NUEVO: Cargar calificaciones y calcular promedio
    this.postService.getUserRatings(userId).subscribe((data) => {
      this.ratings = data;
      this.calculateAverageRating();
      this.isLoadingRatings = false;
    });
  }

  openRatingDialog(transaction: any, myRole: 'buyer' | 'seller') {
    // Definimos a quién estamos calificando según nuestro rol en esa transacción
    const targetUserId =
      myRole === 'buyer' ? transaction.sellerId : transaction.buyerId;
    const targetUserName =
      myRole === 'buyer' ? transaction.sellerName : transaction.buyerName;

    const dialogRef = this.dialog.open(RatingDialogComponent, {
      width: '95vw',
      maxWidth: '400px',
      data: {
        userName: targetUserName,
        targetUserId: targetUserId,
        transactionId: transaction.id,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        // Si el usuario llenó las estrellas y le dio a enviar, guardamos en BD
        this.postService
          .saveRating(transaction.id, targetUserId, result, myRole)
          .then(() => {
            this.snackBar.open('¡Calificación enviada con éxito!', 'Cerrar', {
              duration: 3000,
            });
            // Al usar valueChanges en loadTransactionHistory, la vista se actualizará sola
          })
          .catch((error) => {
            console.error('Error al guardar calificación:', error);
            this.snackBar.open(
              'Hubo un error al enviar la calificación.',
              'Cerrar',
              { duration: 3000 },
            );
          });
      }
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

  // Funciones útiles para pintar las estrellitas en el HTML
  getStarsArray(rating: number): number[] {
    return Array(5)
      .fill(0)
      .map((x, i) => i + 1);
  }

  goBack() {
    this.router.navigate(['/home']);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/auth']);
  }
}
