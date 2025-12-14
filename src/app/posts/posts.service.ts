import { UtilsService } from './../common/services/utils.service';
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
    private authService: AuthService
  ) {
    this.userId = this.authService.currentUser.uid;
  }

  private selectedTabSubject = new BehaviorSubject<number>(0);
  selectedTab$ = this.selectedTabSubject.asObservable();
  private editModeSubject = new BehaviorSubject<boolean>(false);
  editMode$ = this.editModeSubject.asObservable();

  // Crear una nueva publicación
  async addPost(post: any): Promise<void> {
    const user = this.authService.currentUser;

    const postId = this.firestore.createId();

    const newPost = {
      ...post,
      id: postId,
      userId: user.uid,
      authorName: user.displayName,
      authorPhoto: user.photoURL,
      isActive: true,
    };

    return this.firestore.collection('posts').doc(postId).set(newPost);
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

  toggleActive(postId: string, isActive: boolean): Promise<void> {
    return this.updatePost(postId, { isActive });
  }

  setSelectedTab(index: number) {
    this.selectedTabSubject.next(index);
  }

  setEditMode(value: boolean) {
    this.editModeSubject.next(value);
  }
}
