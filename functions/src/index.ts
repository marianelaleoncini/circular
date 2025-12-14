import {onDocumentUpdated} from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";

admin.initializeApp();

export const syncUserPosts = onDocumentUpdated(
  "users/{userId}",
  async (event) => {
    const userId = event.params.userId;

    const before = event.data?.before.data();
    const after = event.data?.after.data();

    if (!before || !after) return;

    if (
      before.displayName === after.displayName &&
      before.photoURL === after.photoURL
    ) {
      return;
    }

    const postsSnap = await admin
      .firestore()
      .collection("posts")
      .where("userId", "==", userId)
      .get();

    if (postsSnap.empty) return;

    const batch = admin.firestore().batch();

    postsSnap.docs.forEach((doc) => {
      batch.update(doc.ref, {
        authorName: after.displayName,
        authorPhoto: after.photoURL,
      });
    });

    await batch.commit();
  }
);
