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
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule,
    MatInputModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
  ],
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss'],
})
export class AuthComponent implements OnInit {
  loginForm!: FormGroup; // Formulario para login
  registerForm!: FormGroup; // Formulario para registro
  isLoginMode: boolean = true; // Alternar entre login y registro

  constructor(private fb: FormBuilder, private authService: AuthService) {}

  ngOnInit() {
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
  }

  // Manejar login con email
  onLogin() {
    if (this.loginForm.invalid) return;

    const { email, password } = this.loginForm.value;
    this.authService
      .loginWithEmail(email, password)
      .then((result) => console.log('Usuario autenticado:', result.user))
      .catch((error) => console.error('Error al iniciar sesión:', error));
  }

  // Manejar registro
  onRegister() {
    if (this.registerForm.invalid) return;

    const { email, password, confirmPassword } = this.registerForm.value;
    if (password !== confirmPassword) {
      console.error('Las contraseñas no coinciden');
      return;
    }

    this.authService
      .registerWithEmail(email, password)
      .then((result) => console.log('Usuario registrado:', result.user))
      .catch((error) => console.error('Error al registrar usuario:', error));
  }

  // Manejar login con Google
  onLoginWithGoogle() {
    this.authService
      .loginWithGoogle()
      .then((result) =>
        console.log('Usuario autenticado con Google:', result.user)
      )
      .catch((error) =>
        console.error('Error al iniciar sesión con Google:', error)
      );
  }

  // Alternar entre login y registro
  toggleMode() {
    this.isLoginMode = !this.isLoginMode;
  }
}
