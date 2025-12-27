import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import firebase from 'firebase/compat/app';
import { firstValueFrom, map, Observable } from 'rxjs';
import { UtilsService } from '../common/services/utils.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(
    public afAuth: AngularFireAuth,
    private firestore: AngularFirestore,
    private utilsService: UtilsService
  ) {}
  currentUser: any;

  setCurrentUser(user: any): void {
    this.currentUser = user;
    console.log('Usuario actual:', this.currentUser);
  }

  getUser(): any {
    return this.currentUser;
  }

  isLoggedIn(): Observable<boolean> {
    return this.afAuth.authState.pipe(map((user) => !!user));
  }

  // Iniciar sesión con Google
  loginWithGoogle() {
    return this.afAuth
      .signInWithPopup(new firebase.auth.GoogleAuthProvider())
      .then(async (result) => {
        if (result.user) {
          this.setCurrentUser(result.user);
          await this.syncUserWithFirestore(result.user);
        }
        return result;
      });
  }

  // Registrar un nuevo usuario con email y contraseña
  registerWithEmail(email: string, password: string, displayName: string) {
    return this.afAuth
      .createUserWithEmailAndPassword(email, password)
      .then(async (result) => {
        const user = result.user;
        if (user) {
          await user.updateProfile({ displayName });

          this.setCurrentUser(user);

          const userRef = this.firestore.collection('users').doc(user.uid);
          await userRef.set({
            uid: user.uid,
            displayName: displayName,
            email: user.email,
            photoURL: user.photoURL || '',
            createdAt: new Date(),
          });
        }
        return result;
      });
  }

  // Iniciar sesión con email y contraseña
  loginWithEmail(email: string, password: string) {
    return this.afAuth
      .signInWithEmailAndPassword(email, password)
      .then(async (result) => {
        if (result.user) {
          this.setCurrentUser(result.user);
          await this.syncUserWithFirestore(result.user);
        }
        return result;
      });
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

  private async syncUserWithFirestore(user: firebase.User): Promise<void> {
    if (!user) return;

    const userRef = this.firestore.collection('users').doc(user.uid);
    const doc = await firstValueFrom(userRef.get());
    let userData: any = doc.data();

    // 1. SI NO EXISTE: Lo creamos
    if (!doc.exists) {
      let finalPhotoURL = user.photoURL || '';

      // Si es una foto de Google, la subimos a nuestro storage antes de guardar
      if (this.isGoogleUrl(finalPhotoURL)) {
        try {
          finalPhotoURL = await firstValueFrom(
            this.utilsService.uploadImageFromUrl(
              finalPhotoURL,
              `avatars/${user.uid}.jpg`
            )
          );
        } catch (error) {
          console.error('Error migrando foto de Google al crear:', error);
        }
      }

      userData = {
        uid: user.uid,
        displayName: user.displayName || '',
        email: user.email || '',
        photoURL: finalPhotoURL,
        createdAt: new Date(),
        city: '',
        province: '',
      };

      await userRef.set(userData);
    }

    // 2. SI YA EXISTE: Verificamos si tiene una URL "vieja" de Google
    else {
      if (userData?.photoURL && this.isGoogleUrl(userData.photoURL)) {
        console.log(
          'Detectada imagen de Google antigua. Migrando a Storage...'
        );
        try {
          const newPhotoURL = await firstValueFrom(
            this.utilsService.uploadImageFromUrl(
              userData.photoURL,
              `avatars/${user.uid}.jpg`
            )
          );

          await userRef.update({ photoURL: newPhotoURL });
          await user.updateProfile({ photoURL: newPhotoURL });
        } catch (error) {
          console.error('No se pudo migrar la imagen antigua:', error);
        }
      }
    }
  }

  private isGoogleUrl(url: string): boolean {
    return url.includes('googleusercontent.com');
  }

  async saveUserProfile(
    displayName: string,
    photoURL: string,
    city: string,
    province: string
  ): Promise<void> {
    if (!this.currentUser) return;
    const safeData = {
      uid: this.currentUser.uid,
      displayName: displayName || '',
      photoURL: photoURL || '',
      city: city || null,
      province: province || null,
    };

    await this.firestore
      .collection('users')
      .doc(this.currentUser.uid)
      .set(safeData, { merge: true });

    if (
      this.currentUser.displayName !== displayName ||
      this.currentUser.photoURL !== photoURL
    ) {
      await this.currentUser.updateProfile({
        displayName: displayName,
        photoURL: photoURL,
      });
    }
  }

  async getUserProfile() {
    const user = this.currentUser;
    if (!user) return null;

    const userDocRef = this.firestore.collection('users').doc(user.uid);
    const docSnapshot = await firstValueFrom(userDocRef.get());

    if (docSnapshot.exists) {
      return docSnapshot.data();
    } else {
      // Si no existe en Firestore, usar datos de Firebase Auth
      let photoURL = '';

      if (user.photoURL) {
        try {
          photoURL = await firstValueFrom(
            this.utilsService.uploadImageFromUrl(
              user.photoURL,
              `avatar_${user.uid}.jpg`
            )
          );
        } catch (e) {
          console.error('Error subiendo imagen de Google', e);
        }
      }

      const profile = {
        uid: user.uid,
        displayName: user.displayName || '',
        photoURL,
        city: '',
        province: '',
        createdAt: new Date(),
      };

      await userDocRef.set(profile);

      return profile;
    }
  }
}
