import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import firebase from 'firebase/compat/app';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(public afAuth: AngularFireAuth) {}
  currentUser: any;
  
  setCurrentUser(user: any): void {
    this.currentUser = user;
  }

  getUser(): any {
    return this.currentUser;
  }

  isLoggedIn(): Observable<boolean> {
    return this.afAuth.authState.pipe(map((user) => !!user));
  }

  // Iniciar sesión con Google
  loginWithGoogle() {
    return this.afAuth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
  }

  // Registrar un nuevo usuario con email y contraseña
  registerWithEmail(email: string, password: string) {
    return this.afAuth.createUserWithEmailAndPassword(email, password);
  }

  // Iniciar sesión con email y contraseña
  loginWithEmail(email: string, password: string) {
    return this.afAuth.signInWithEmailAndPassword(email, password);
  }

  // Cerrar sesión
  logout() {
    return this.afAuth.signOut();
  }

  // Recuperar contraseña
  resetPassword(email: string) {
    return this.afAuth.sendPasswordResetEmail(email);
  }

  // Obtener el usuario actual
  getCurrentUser() {
    return this.afAuth.authState;
  }

  // Confirmar restablecimiento de contraseña
  confirmPasswordReset(oobCode: string, newPassword: string) {
    return this.afAuth.confirmPasswordReset(oobCode, newPassword);
  }
}
