import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { BehaviorSubject, Observable } from 'rxjs';
import { finalize, map, tap } from 'rxjs/operators';
import { AuthService } from '../auth/auth.service';

@Injectable({
  providedIn: 'root',
})
export class PostService {
  userId: any;
  constructor(
    private firestore: AngularFirestore,
    private storage: AngularFireStorage,
    private authService: AuthService
  ) {
    this.userId = this.authService.currentUser.uid;
  }

  private selectedTabSubject = new BehaviorSubject<number>(0);
  selectedTab$ = this.selectedTabSubject.asObservable();

  // Crear una nueva publicación
  addPost(post: any): Promise<void> {
    const postId = this.firestore.createId();
    return this.firestore
      .collection('posts')
      .doc(postId)
      .set({ ...post, id: postId });
  }

  // Recuperar una publicación
  getPost(postId: string): Observable<any> {
    return this.firestore.collection('posts').doc(postId).valueChanges();
  }

  /**
   * Obtiene todos los posts ACTIVOS
   */
  getHomePosts(): Observable<any[]> {
    return this.firestore
      .collection('posts', (ref) => ref.where('isActive', '==', true))
      .valueChanges({ idField: 'id' })
      .pipe(map((posts) => posts.filter((p: any) => p.userId !== this.userId)));
  }

  /**
   * Obtiene todos los posts ACTIVOS del usuario actual
   */
  getActivePosts(): Observable<any[]> {
    return this.firestore
      .collection('posts', (ref) =>
        ref.where('userId', '==', this.userId).where('isActive', '==', true)
      )
      .valueChanges({ idField: 'id' });
  }

  /**
   * Obtiene todos los posts INACTIVOS (pausados) del usuario actual
   */
  getInactivePosts(): Observable<any[]> {
    return this.firestore
      .collection('posts', (ref) =>
        ref.where('userId', '==', this.userId).where('isActive', '==', false)
      )
      .valueChanges({ idField: 'id' });
  }

  /**
   * Actualiza un post específico del usuario actual
   */
  updatePost(postId: string, data: any): Promise<void> {
    return this.firestore.collection('posts').doc(postId).update(data);
  }

  /**
   * Elimina un post específico
   */
  deletePost(postId: string): Promise<void> {
    return this.firestore.collection('posts').doc(postId).delete();
  }

  // Subir imagen a Firebase Storage
  uploadImage(file: File): Observable<string> {
    const filePath = `images/${Date.now()}_${file.name}`;
    const fileRef = this.storage.ref(filePath);
    const task = this.storage.upload(filePath, file);

    return new Observable((observer) => {
      task
        .snapshotChanges()
        .pipe(
          finalize(() => {
            fileRef.getDownloadURL().subscribe((url) => {
              observer.next(url);
              observer.complete();
            });
          })
        )
        .subscribe();
    });
  }

  toggleActive(postId: string, isActive: boolean): Promise<void> {
    return this.updatePost(postId, { isActive });
  }

  setSelectedTab(index: number) {
    this.selectedTabSubject.next(index);
  }
}
