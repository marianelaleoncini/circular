import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import firebase from 'firebase/compat/app';
import { firstValueFrom, map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(
    public afAuth: AngularFireAuth,
    private firestore: AngularFirestore
  ) {}
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

  async saveUserProfile(
    nombre: string,
    fotoUrl: string,
    direccion: string,
    ciudad: string,
    provincia: string
  ): Promise<void> {
    if (!this.currentUser) return;

    // Guardar datos del usuario con merge para no sobrescribir
    await this.firestore.collection('users').doc(this.currentUser.uid).set(
      {
        uid: this.currentUser.uid,
        nombre,
        foto: fotoUrl,
        ubicacion: { direccion, ciudad, provincia },
      },
      { merge: true }
    );

    // Si el usuario no tiene displayName o photoURL en Auth, actualizarlo
    if (!this.currentUser.displayName || !this.currentUser.photoURL) {
      await this.currentUser.updateProfile({
        displayName: nombre,
        photoURL: fotoUrl
      });
    }
  }

  async getUserProfile() {
    const user = this.currentUser;
    if (!user) return null;

    
    const userDocRef = this.firestore.collection('users').doc(user.uid);
    const docSnapshot = await firstValueFrom(userDocRef.get());
    
console.log(docSnapshot.exists);
    if (docSnapshot.exists) {
      console.log(docSnapshot.data());
      return docSnapshot.data();
    } else {
      // Si no existe en Firestore, usar datos de Firebase Auth
      return {
        uid: user.uid,
        nombre: user.displayName || '',
        foto: user.photoURL || '',
        ubicacion: { direccion: '', ciudad: '', provincia: '' }
      };
    }
  }
}
