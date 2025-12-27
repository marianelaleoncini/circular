import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { finalize, from, Observable, switchMap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UtilsService {
  constructor(private storage: AngularFireStorage, private http: HttpClient) {}

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

  uploadImageFromUrl(url: string, path: string): Observable<string> {
  // 1. Descargamos la imagen como un BLOB (Binary Large Object)
  return this.http.get(url, { responseType: 'blob' }).pipe(
    switchMap((blob) => {
      // 2. La subimos a Firebase Storage
      const ref = this.storage.ref(path);
      const task = ref.put(blob);
      
      // 3. Esperamos a que termine y devolvemos la URL de descarga propia
      return from(task).pipe(
        switchMap(() => ref.getDownloadURL())
      );
    })
  );
}
}
