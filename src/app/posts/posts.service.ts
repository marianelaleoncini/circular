import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class PostService {
  constructor(
    private firestore: AngularFirestore,
    private storage: AngularFireStorage
  ) {}

  // Crear una nueva publicación
  addPost(post: any): Promise<void> {
    const postId = this.firestore.createId();
    return this.firestore
      .collection('posts')
      .doc(postId)
      .set({ ...post, id: postId });
  }

  // Obtener publicaciones de un usuario
  getPostsByUser(userId: string): Observable<any[]> {
    return this.firestore
      .collection('posts', (ref) => ref.where('userId', '==', userId))
      .valueChanges();
  }

  // Subir imagen a Firebase Storage
  uploadImage(file: File): Observable<string> {
    const filePath = `images/${Date.now()}_${file.name}`;
    const fileRef = this.storage.ref(filePath);
    const task = this.storage.upload(filePath, file);

    return new Observable((observer) => {
      task.snapshotChanges()
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
}
