import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import firebase from 'firebase/compat/app';
import { Observable, from, map, of, switchMap, take } from 'rxjs';
import { AuthService } from '../auth/auth.service';

@Injectable({ providedIn: 'root' })
export class ChatService {
  constructor(private afs: AngularFirestore, private auth: AuthService) {}

  getUserId() {
    return this.auth.currentUser?.uid;
  }

  getUserChats(): Observable<any[]> {
    const uid = this.getUserId();
    return this.afs
      .collection('chats', (ref) =>
        ref
          .where('participants', 'array-contains', uid)
          .orderBy('timestamp', 'desc')
      )
      .snapshotChanges()
      .pipe(
        map((actions) =>
          actions.map((a) => ({
            id: a.payload.doc.id,
            ...(a.payload.doc.data() as Record<string, any>),
          }))
        )
      );
  }

  getChatById(chatId: string): Observable<any> {
    return this.afs.doc(`chats/${chatId}`).valueChanges();
  }

  getMessages(chatId: string): Observable<any[]> {
    const messagesPath = `chats/${chatId}/messages`;
    const collectionRef = this.afs.collection(messagesPath, (ref) =>
      ref.orderBy('timestamp', 'asc')
    );

    return collectionRef.snapshotChanges().pipe(
      map((actions) => actions.map((a) => a.payload.doc.data())),
      map((messages) => {
        console.log('Fetched messages:', messages);
        return messages;
      })
    );
  }

  sendMessage(chatId: string, text: string): Observable<void> {
    const message = {
      text,
      senderId: this.getUserId(),
      chatId,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    };

    return from(
      this.afs
        .collection(`chats/${chatId}/messages`)
        .add(message)
        .then(() => {})
    );
  }

  getUserDisplayName(uid: string): Observable<string> {
    return this.afs
      .doc<any>(`users/${uid}`)
      .valueChanges()
      .pipe(
        take(1),
        map((user) => {
          return user?.displayName || uid;
        })
      );
  }

  /** Método para usar en el botón de una publicación */
  startChatWithUser(ownerId: string): Observable<string> {
    console.log(firebase.auth().currentUser?.uid);
    const myId = this.getUserId();
    if (!myId || myId === ownerId) return of('');

    const chatParticipants = [myId, ownerId].sort();
    const chatId = chatParticipants.join('_');

    const chatRef = this.afs.doc(`chats/${chatId}`);

    return from(
      chatRef.set(
        {
          participants: chatParticipants,
          timestamp: firebase.firestore.FieldValue.serverTimestamp(),
          lastMessage: '',
        },
        { merge: true }
      )
    ).pipe(map(() => chatId));
  }
}
