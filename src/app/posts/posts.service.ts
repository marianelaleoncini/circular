import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { BehaviorSubject, Observable, firstValueFrom, of } from 'rxjs';
import { map, switchMap, take } from 'rxjs/operators';
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

getHomePostsPaginated(
    batchSize: number,
    lastDoc?: any,
  ): Observable<{ posts: any[]; lastDoc: any; hasMore: boolean }> {
    return this.authService.getCurrentUser().pipe(
      take(1),
      switchMap((user) => {
        return this.firestore
          .collection('posts', (ref) => {
            let query: any = ref
              .where('isActive', '==', true)
              .orderBy('createdAt', 'desc')
              .limit(batchSize);

            if (lastDoc) {
              query = query.startAfter(lastDoc);
            }
            return query;
          })
          .get()
          .pipe(
            map((snapshot) => {
              const posts = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...(doc.data() as any),
              }));

              const filteredPosts = user
                ? posts.filter((p) => p.userId !== user.uid)
                : posts;

              const newLastDoc =
                snapshot.docs.length > 0
                  ? snapshot.docs[snapshot.docs.length - 1]
                  : null;

              return {
                posts: filteredPosts,
                lastDoc: newLastDoc,
                hasMore: snapshot.docs.length === batchSize,
              };
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
    buyer: any,
    finalPrice: number,
  ): Promise<void> {
    const sellerId = firebase.auth().currentUser?.uid;
    if (!sellerId) throw new Error('Usuario no autenticado');

    const batch = this.firestore.firestore.batch();
    const transactionRef = this.firestore.collection('transactions').doc().ref;

    // Agregamos toda la info de contexto a la transacción
    const transactionData = {
      postId: post.id,
      postTitle: post.title,
      postImageUrl: post.imageUrl || null,
      postCategory: post.category || 'Otros', // <-- CATEGORÍA

      // Info del vendedor (quien hace la acción)
      sellerId: sellerId,
      sellerName: post.authorName,
      sellerPhoto: post.authorPhoto || null,

      // Info del comprador (seleccionado en el modal)
      buyerId: buyer.id,
      buyerName: buyer.name,
      buyerPhoto: buyer.photoURL || null,

      finalPrice: finalPrice,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      status: 'completed',

      // Banderas para el sistema de calificación
      buyerRatedSeller: false,
      sellerRatedBuyer: false,
    };

    batch.set(transactionRef, transactionData);

    const postRef = this.firestore.collection('posts').doc(post.id).ref;
    batch.update(postRef, {
      isActive: false,
      status: 'sold',
    });

    return batch.commit();
  }

  // Obtener las ventas del usuario
  getUserSales(userId: string): Observable<any[]> {
    return this.firestore
      .collection('transactions', (ref) =>
        ref.where('sellerId', '==', userId).orderBy('timestamp', 'desc'),
      )
      .valueChanges({ idField: 'id' });
  }

  // Obtener las compras del usuario
  getUserPurchases(userId: string): Observable<any[]> {
    return this.firestore
      .collection('transactions', (ref) =>
        ref.where('buyerId', '==', userId).orderBy('timestamp', 'desc'),
      )
      .valueChanges({ idField: 'id' });
  }

  async saveRating(
    transactionId: string,
    targetUserId: string,
    ratingData: any,
    myRole: 'buyer' | 'seller',
  ): Promise<void> {
    const currentUserId = firebase.auth().currentUser?.uid;
    if (!currentUserId) throw new Error('Usuario no autenticado');

    const batch = this.firestore.firestore.batch();

    // 1. Crear el registro en la colección 'ratings'
    const ratingRef = this.firestore.collection('ratings').doc().ref;
    batch.set(ratingRef, {
      transactionId: transactionId,
      raterId: currentUserId,
      targetUserId: targetUserId,
      rating: ratingData.rating,
      comment: ratingData.comment || '',
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      role: myRole, // Guardamos si el que calificó fue el comprador o el vendedor
    });

    // 2. Actualizar la transacción para que desaparezca el botón
    const transactionRef = this.firestore
      .collection('transactions')
      .doc(transactionId).ref;

    if (myRole === 'buyer') {
      // El comprador acaba de calificar al vendedor
      batch.update(transactionRef, { buyerRatedSeller: true });
    } else {
      // El vendedor acaba de calificar al comprador
      batch.update(transactionRef, { sellerRatedBuyer: true });
    }

    return batch.commit();
  }

  // Obtener las calificaciones recibidas por un usuario
  getUserRatings(userId: string): Observable<any[]> {
    return this.firestore
      .collection('ratings', (ref) =>
        ref.where('targetUserId', '==', userId).orderBy('timestamp', 'desc'),
      )
      .valueChanges({ idField: 'id' });
  }
}
