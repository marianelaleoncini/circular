import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { BehaviorSubject, Observable, firstValueFrom, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { AuthService } from '../auth/auth.service';
import firebase from 'firebase/compat/app';

@Injectable({
  providedIn: 'root',
})
export class PostService {
  constructor(
    private firestore: AngularFirestore,
    private authService: AuthService,
  ) {}

  private selectedTabSubject = new BehaviorSubject<number>(0);
  selectedTab$ = this.selectedTabSubject.asObservable();

  private editModeSubject = new BehaviorSubject<boolean>(false);
  editMode$ = this.editModeSubject.asObservable();

  async addPost(post: any): Promise<void> {
    const user = await firstValueFrom(this.authService.getCurrentUser());

    if (!user) {
      throw new Error('Usuario no autenticado');
    }
    const userProfileRef = this.firestore.collection('users').doc(user.uid);
    const userProfileSnap = await firstValueFrom(userProfileRef.get());
    const userData: any = userProfileSnap.data();

    const postId = this.firestore.createId();

    const newPost = {
      ...post,
      id: postId,
      userId: user.uid,
      authorName: userData?.displayName || user.displayName,
      authorPhoto: userData?.photoURL || user.photoURL,
      authorProvince: userData?.province || null,
      authorCity: userData?.city || null,
      isActive: true,
      createdAt: new Date(),
    };

    return this.firestore.collection('posts').doc(postId).set(newPost);
  }

  getPost(postId: string): Observable<any> {
    return this.firestore.collection('posts').doc(postId).valueChanges();
  }

  getHomePosts(): Observable<any[]> {
    return this.authService.getCurrentUser().pipe(
      switchMap((user) => {
        return this.firestore
          .collection('posts', (ref) => ref.where('isActive', '==', true))
          .valueChanges({ idField: 'id' })
          .pipe(
            map((posts: any[]) => {
              if (user) {
                return posts.filter((p) => p.userId !== user.uid);
              }
              return posts;
            }),
          );
      }),
    );
  }

  getActivePosts(): Observable<any[]> {
    return this.authService.getCurrentUser().pipe(
      switchMap((user) => {
        if (!user) return of([]);
        return this.firestore
          .collection('posts', (ref) =>
            ref.where('userId', '==', user.uid).where('isActive', '==', true),
          )
          .valueChanges({ idField: 'id' });
      }),
    );
  }

  getInactivePosts(): Observable<any[]> {
    return this.authService.getCurrentUser().pipe(
      switchMap((user) => {
        if (!user) return of([]);

        return this.firestore
          .collection('posts', (ref) =>
            ref.where('userId', '==', user.uid).where('isActive', '==', false),
          )
          .valueChanges({ idField: 'id' });
      }),
    );
  }

  updatePost(postId: string, data: any): Promise<void> {
    return this.firestore.collection('posts').doc(postId).update(data);
  }

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

  async registerTransaction(
    post: any,
    buyerId: string,
    finalPrice: number,
  ): Promise<void> {
    const sellerId = firebase.auth().currentUser?.uid;
    if (!sellerId) throw new Error('Usuario no autenticado');

    const batch = this.firestore.firestore.batch();

    // 1. Crear el registro de la transacción
    // Creamos una nueva colección 'transactions' para mantener el historial limpio
    const transactionRef = this.firestore.collection('transactions').doc().ref;

    const transactionData = {
      postId: post.id,
      postTitle: post.title,
      postImageUrl: post.imageUrl || null,
      sellerId: sellerId,
      buyerId: buyerId,
      finalPrice: finalPrice,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      status: 'completed',
    };

    batch.set(transactionRef, transactionData);

    // 2. Actualizar el estado del post a "vendido" e inactivo
    const postRef = this.firestore.collection('posts').doc(post.id).ref;

    batch.update(postRef, {
      isActive: false,
      status: 'sold', // Agregamos este flag para diferenciarlo de un post pausado
    });

    // 3. Ejecutar ambas operaciones juntas
    return batch.commit();
  }
}
