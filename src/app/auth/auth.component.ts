import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { AuthService } from './auth.service';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LoadingComponent } from '../common/loading/loading.component';
import { Router } from '@angular/router';
import { take } from 'rxjs';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatDividerModule,
    LoadingComponent,
    MatCheckboxModule,
  ],
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss'],
})
export class AuthComponent implements OnInit {
  loginForm!: FormGroup; // Formulario para login
  registerForm!: FormGroup; // Formulario para registro
  forgotForm!: FormGroup; // Formulario para olvido
  isLoginMode: boolean = true; // Alternar entre login y registro
  isForgotPassword: boolean = false; // Mostrar formulario de restablecimiento de contraseña
  isLoading: boolean = false; // Mostrar spinner de carga
  hide: boolean = true; // Ocultar contraseña
  errorMessage: string = ''; // Mensaje de error

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private router: Router,
  ) {}

  ngOnInit() {
    this.authService
      .getCurrentUser()
      .pipe(take(1))
      .subscribe(async (user) => {
        if (user) {
          const isBanned = await this.authService.isUserBanned(user.uid);
          if (isBanned) {
            await this.authService.logout();
            this.errorMessage =
              'Tu cuenta ha sido deshabilitada por violar las políticas de Circular.';
            return;
          }

          if (this.authService.checkIfAdmin(user.email)) {
            this.router.navigate(['/admin-dashboard']);
          } else {
            this.router.navigate(['/home']);
          }
        }
      });
    this.initForms();
  }

  // Inicializar formularios reactivos
  private initForms() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });

    this.registerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required, Validators.minLength(6)]],
      displayName: ['', [Validators.required, Validators.minLength(5)]],
      termsAccepted: [false, Validators.requiredTrue],
    });

    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  getForm() {
    return this.isLoginMode ? this.loginForm : this.registerForm;
  }

  isControlInvalid(controlName: string, form: FormGroup) {
    const control = form.controls[controlName];
    return control.invalid && control.touched;
  }

  // Manejar login con email
  onLogin() {
    if (this.loginForm.invalid) return;
    const { email, password } = this.loginForm.value;
    this.isLoading = true;

    this.authService
      .loginWithEmail(email, password)
      .then(async (result) => {
        if (result.user) {
          const isBanned = await this.authService.isUserBanned(result.user.uid);

          if (isBanned) {
            await this.authService.logout();
            this.isLoading = false;
            this.errorMessage =
              'Tu cuenta ha sido deshabilitada por violar las políticas de Circular.';
            return;
          }

          const userEmail = result.user?.email;
          if (this.authService.checkIfAdmin(userEmail)) {
            this.router.navigate(['/admin-dashboard']);
          } else {
            this.router.navigate(['/home']);
          }
        }
      })
      .catch((error) => {
        if (error.code === 'auth/invalid-credential') {
          this.errorMessage = 'Email o contraseña incorrectos';
        }
        this.isLoading = false;
      });
  }

  // Manejar registro
  onRegister() {
    if (this.registerForm.invalid) return;
    const { email, password, confirmPassword, displayName } =
      this.registerForm.value;
    this.isLoading = true;

    if (password !== confirmPassword) {
      this.errorMessage = 'Las contraseñas no coinciden';
      this.isLoading = false;
      return;
    }

    this.authService
      .registerWithEmail(email, password, displayName)
      .then(() => {
        this.router.navigate(['/home']);
      })
      .catch((error) => {
        if (error.code === 'auth/email-already-in-use') {
          this.errorMessage =
            'El email ya se encuentra en uso. Intenta con otro.';
        }
        this.isLoading = false;
      });
  }

  // Manejar login con Google
  onLoginWithGoogle() {
    this.isLoading = true;

    this.authService
      .loginWithGoogle()
      .then(async (result) => {
        if (result.user) {
          const isBanned = await this.authService.isUserBanned(result.user.uid);

          if (isBanned) {
            await this.authService.logout();
            this.isLoading = false;
            this.errorMessage =
              'Tu cuenta ha sido deshabilitada por violar las políticas de Circular.';
            return;
          }

          const userEmail = result.user?.email;
          if (this.authService.checkIfAdmin(userEmail)) {
            this.router.navigate(['/admin-dashboard']);
          } else {
            this.router.navigate(['/home']);
          }
        }
      })
      .catch((error) => {
        this.isLoading = false;
        this.snackBar.open(error.message, 'Cerrar', { duration: 3000 });
      });
  }

  onForgotPassword() {
    if (this.forgotForm.invalid) return;
    this.isLoading = true;
    this.authService
      .resetPassword(this.forgotForm.value.email)
      .then(() => {
        this.isLoading = false;
        this.snackBar.open('Correo de restablecimiento enviado', 'Cerrar', {
          duration: 4000,
        });
        this.toggleForgot();
      })
      .catch((err) => {
        this.isLoading = false;
        this.snackBar.open(err.messae, 'Cerrar', { duration: 3000 });
      });
  }

  toggleMode() {
    this.isLoginMode = !this.isLoginMode;
    this.errorMessage = '';

    if (this.loginForm) this.loginForm.reset();
    if (this.registerForm) this.registerForm.reset();
  }

  backToLogin() {
    this.isForgotPassword = false;
  }

  toggleForgot() {
    this.isForgotPassword = !this.isForgotPassword;
  }
}
