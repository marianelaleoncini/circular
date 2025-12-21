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
import { Router } from '@angular/router';

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

  constructor(
    private authService: AuthService,
    private fb: FormBuilder,
    private locationService: LocationService,
    private utilsService: UtilsService,
    private router: Router,
    private snackBar: MatSnackBar
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
        this.profileForm.patchValue({
          name: this.user.displayName,
          photoURL: this.user.photoURL,
          city: this.user.city || '',
          province: this.user.province || '',
        });

        if (this.user.province) {
          this.loadCities(this.user.province, this.user.city);
        }
        console.log(this.user);
      }
    });

    this.profileForm.get('province')?.valueChanges.subscribe((provinceId) => {
      const cityControl = this.profileForm.get('city');

      if (provinceId) {
        cityControl?.enable();
        this.loadCities(provinceId);
        this.profileForm.patchValue({ city: '' });
      } else {
        cityControl?.disable();
        this.cities = [];
        this.profileForm.patchValue({ city: '' });
      }
    });
  }

  setCityDisabled() {
    return !this.profileForm?.get('province')?.value;
  }

  loadCities(provinceId: string, selectedCityId?: string) {
    console.log('Loading cities for province:', provinceId);
    this.locationService.getCities(provinceId).subscribe((cities) => {
      this.cities = cities;
      if (selectedCityId && cities.some((c: any) => c.id === selectedCityId)) {
        this.profileForm.patchValue({ city: selectedCityId });
      }
    });
  }

  async saveProfile() {
    if (this.profileForm.invalid) return;
    this.isLoading = true;

    const { name, city, province } = this.profileForm.value;
    const photoURL = this.imageUrl;
    console.log(photoURL);
    await this.authService.saveUserProfile(name, photoURL, city, province);
    this.snackBar.open('Perfil guardado con éxito', 'Cerrar', {
      duration: 4000,
    });
    this.isLoading = false;
    this.router.navigate(['/home']); // Redirigir a la página principal
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

  goBack() {
    this.router.navigate(['/home']);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/auth']);
  }
}
