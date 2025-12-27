import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { BehaviorSubject, Observable, firstValueFrom, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { AuthService } from '../auth/auth.service';

@Injectable({
  providedIn: 'root',
})
export class PostService {
  constructor(
    private firestore: AngularFirestore,
    private authService: AuthService
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
            })
          );
      })
    );
  }

  getActivePosts(): Observable<any[]> {
    return this.authService.getCurrentUser().pipe(
      switchMap((user) => {
        if (!user) return of([]);
        return this.firestore
          .collection('posts', (ref) =>
            ref.where('userId', '==', user.uid).where('isActive', '==', true)
          )
          .valueChanges({ idField: 'id' });
      })
    );
  }

  getInactivePosts(): Observable<any[]> {
    return this.authService.getCurrentUser().pipe(
      switchMap((user) => {
        if (!user) return of([]);

        return this.firestore
          .collection('posts', (ref) =>
            ref.where('userId', '==', user.uid).where('isActive', '==', false)
          )
          .valueChanges({ idField: 'id' });
      })
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
}
