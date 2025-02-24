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
import { MatSnackBar } from '@angular/material/snack-bar';
import { LoadingComponent } from '../common/loading/loading.component';
import { Router } from '@angular/router';

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
    private router: Router
  ) {}

  ngOnInit() {
    this.authService.getCurrentUser().subscribe((user) => {
      if (user) {
        this.router.navigate(['/home']); // Redirige al Home si ya está autenticado
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
      .then((result) => {
        console.log('Usuario autenticado:', result.user);
        this.isLoading = false;
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
    const { email, password, confirmPassword } = this.registerForm.value;
    this.isLoading = true;

    if (password !== confirmPassword) {
      console.error('Las contraseñas no coinciden');
      return;
    }

    this.authService
      .registerWithEmail(email, password)
      .then((result) => {
        console.log('Usuario registrado:', result.user);
        this.isLoading = false;
      })
      .catch((error) => {
        console.error('Error al registrar:', error);
        this.isLoading = false;
      });
  }

  // Manejar login con Google
  onLoginWithGoogle() {
    this.isLoading = true;

    this.authService
      .loginWithGoogle()
      .then((result) => {
        console.log('Usuario autenticado:', result.user);
        this.isLoading = false;
      })
      .catch((error) => {
        console.error('Error al iniciar sesión:', error);
        this.isLoading = false;
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
        this.snackBar.open(err.message, 'Cerrar', { duration: 3000 });
      });
  }

  // Alternar entre login y registro
  toggleMode() {
    this.isLoginMode = !this.isLoginMode;
  }

  backToLogin() {
    this.isForgotPassword = false;
  }

  toggleForgot() {
    this.isForgotPassword = !this.isForgotPassword;
  }
}
