import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { LoadingComponent } from '../../common/loading/loading.component';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    LoadingComponent,
  ],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss',
})
export class ResetPasswordComponent {
  resetForm: FormGroup;
  oobCode: string | null = null;
  isLoading: boolean = false;
  hide: boolean = true; // Ocultar contraseña

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {
    this.resetForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  ngOnInit() {
    // Extraer el oobCode de la URL
    this.oobCode = this.route.snapshot.queryParamMap.get('oobCode');
    if (!this.oobCode) {
      this.snackBar.open('Código de restablecimiento no válido', 'Cerrar', {
        duration: 3000,
      });
      this.router.navigate(['/']);
    }
  }

  onSubmit() {
    if (!this.oobCode) return;

    const newPassword = this.resetForm.get('password')?.value;
    this.isLoading = true;
    this.authService
      .confirmPasswordReset(this.oobCode, newPassword)
      .then(() => {
        this.snackBar.open('Contraseña restablecida exitosamente', 'Cerrar', {
          duration: 3000,
        });
        this.isLoading = false;
        this.router.navigate(['/auth']);
      })
      .catch((error) => {
        this.isLoading = false;
        this.snackBar.open(error.message, 'Cerrar', { duration: 3000 });
        this.router.navigate(['/auth']);
      });
  }
}
