import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import firebase from 'firebase/compat/app';
import { Observable, map, of, switchMap } from 'rxjs';
import { AngularFireAuth } from '@angular/fire/compat/auth';

@Injectable({ providedIn: 'root' })
export class ChatService {
  constructor(
    private afs: AngularFirestore,
    private afAuth: AngularFireAuth
  ) {}

  getUserId(): string | null {
    return firebase.auth().currentUser?.uid || null;
  }

  getUserChats(): Observable<any[]> {
    return this.afAuth.authState.pipe(
      switchMap((user) => {
        if (!user) return of([]);

        return this.afs
          .collection('chats', (ref) =>
            ref
              .where('participants', 'array-contains', user.uid)
              .orderBy('timestamp', 'desc')
          )
          .snapshotChanges()
          .pipe(
            map((actions) =>
              actions.map((a) => {
                const data = a.payload.doc.data() as any;
                return {
                  id: a.payload.doc.id,
                  ...data,
                  unreadCount: data.unreadCounts?.[user.uid] || 0,
                };
              })
            )
          );
      })
    );
  }

  getUserData(uid: string): Observable<any> {
    return this.afs
      .doc<any>(`users/${uid}`)
      .valueChanges()
      .pipe(
        map((user) => {
          if (!user) return { displayName: 'Usuario', photoURL: null };
          return {
            displayName: user.displayName || 'Usuario',
            photoURL: user.photoURL || null,
          };
        })
      );
  }

  getMessages(chatId: string): Observable<any[]> {
    return this.afs
      .collection(`chats/${chatId}/messages`, (ref) =>
        ref.orderBy('timestamp', 'asc')
      )
      .valueChanges({ idField: 'id' });
  }

  async sendMessage(chatId: string, text: string): Promise<void> {
    const myId = this.getUserId();
    if (!myId) return;

    // 1. Averiguamos quién es el destinatario leyendo el chat
    const chatDoc = await this.afs.collection('chats').doc(chatId).ref.get();
    const chatData = chatDoc.data() as any;
    const otherUserId = chatData?.participants?.find((p: string) => p !== myId);

    const batch = this.afs.firestore.batch();

    // 2. Crear mensaje
    const messageRef = this.afs
      .collection(`chats/${chatId}/messages`)
      .doc().ref;
    batch.set(messageRef, {
      text,
      senderId: myId,
      chatId,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    });

    // 3. Actualizar Chat (Datos generales)
    const chatRef = this.afs.collection('chats').doc(chatId).ref;

    batch.set(
      chatRef,
      {
        lastMessage: text,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    // 4. Actualizar Contador (SOLO del otro usuario)
    if (otherUserId) {
      batch.set(
        chatRef,
        {
          unreadCounts: {
            [otherUserId]: firebase.firestore.FieldValue.increment(1),
          },
        },
        { merge: true }
      );
    }

    return batch.commit();
  }

  async markChatAsRead(chatId: string) {
    const uid = this.getUserId();
    if (!uid) return;

    return this.afs.collection('chats').doc(chatId).update({
      [`unreadCounts.${uid}`]: 0,
      [`lastReadTimestamp.${uid}`]:
        firebase.firestore.FieldValue.serverTimestamp(),
    });
  }

  getTotalUnreadCount(): Observable<number> {
    return this.afAuth.authState.pipe(
      switchMap((user) => {
        if (!user) return of(0);

        return this.afs
          .collection('chats', (ref) =>
            ref.where('participants', 'array-contains', user.uid)
          )
          .valueChanges()
          .pipe(
            map((chats: any[]) => {
              return chats.reduce((acc, chat) => {
                const count = chat.unreadCounts?.[user.uid] || 0;
                return acc + count;
              }, 0);
            })
          );
      })
    );
  }

  getChatById(chatId: string): Observable<any> {
    return this.afs.collection('chats').doc(chatId).valueChanges();
  }

  startChatWithUser(ownerId: string): Observable<string> {
    const myId = this.getUserId();
    if (!myId || myId === ownerId) return of('');

    const chatParticipants = [myId, ownerId].sort();
    const chatId = chatParticipants.join('_');
    const chatRef = this.afs.doc(`chats/${chatId}`);

    return new Observable((obs) => {
      chatRef.get().subscribe((doc) => {
        if (doc.exists) {
          obs.next(chatId);
          obs.complete();
        } else {
          chatRef
            .set(
              {
                participants: chatParticipants,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                lastMessage: '',
                unreadCounts: { [myId]: 0, [ownerId]: 0 },
                lastReadTimestamp: { [myId]: null, [ownerId]: null },
              },
              { merge: true }
            )
            .then(() => {
              obs.next(chatId);
              obs.complete();
            });
        }
      });
    });
  }
}