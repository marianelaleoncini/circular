import { Injectable } from '@angular/core';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { finalize, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UtilsService {
  constructor(private storage: AngularFireStorage) {}

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

  uploadImageFromUrl(imageUrl: string, fileName: string): Observable<string> {
    return new Observable((observer) => {
      fetch(imageUrl)
        .then((res) => res.blob())
        .then((blob) => {
          const file = new File([blob], fileName, { type: blob.type });
          this.uploadImage(file).subscribe({
            next: (url) => {
              observer.next(url);
              observer.complete();
            },
            error: (err) => observer.error(err),
          });
        })
        .catch((err) => observer.error(err));
    });
  }
}
