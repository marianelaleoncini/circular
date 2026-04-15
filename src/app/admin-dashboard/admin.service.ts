import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import firebase from 'firebase/compat/app';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AdminService {
  constructor(private firestore: AngularFirestore) {}

  getAllUsers(): Observable<any[]> {
    return this.firestore.collection('users').valueChanges({ idField: 'id' });
  }

  getAllPosts(): Observable<any[]> {
    return this.firestore.collection('posts').valueChanges({ idField: 'id' });
  }

  getAllTransactions(): Observable<any[]> {
    return this.firestore
      .collection('transactions')
      .valueChanges({ idField: 'id' });
  }

  getAllRatings(): Observable<any[]> {
    return this.firestore.collection('ratings').valueChanges({ idField: 'id' });
  }

  getAllChats(): Observable<any[]> {
    return this.firestore.collection('chats').valueChanges({ idField: 'id' });
  }

  async toggleUserStatus(userId: string, isEnabled: boolean): Promise<void> {
    const db = this.firestore.firestore;
    const batch = db.batch();

    const userRef = db.collection('users').doc(userId);
    batch.update(userRef, { isEnabled });

    const postsRef = db.collection('posts');

    if (!isEnabled) {
      const activePosts = await postsRef
        .where('userId', '==', userId)
        .where('isActive', '==', true)
        .get();

      activePosts.forEach((doc) => {
        batch.update(doc.ref, {
          isActive: false,
          wasActiveBeforeBan: true,
        });
      });
    } else {
      const bannedPosts = await postsRef
        .where('userId', '==', userId)
        .where('wasActiveBeforeBan', '==', true)
        .get();

      bannedPosts.forEach((doc) => {
        batch.update(doc.ref, {
          isActive: true,
          wasActiveBeforeBan: firebase.firestore.FieldValue.delete(),
        });
      });
    }

    return batch.commit();
  }
}
