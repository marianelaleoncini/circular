import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";

if (admin.apps.length === 0) {
  admin.initializeApp();
}

export const syncUserPosts = onDocumentUpdated(
  {
    document: "users/{userId}",
    memory: "512MiB",
    timeoutSeconds: 60,
    maxInstances: 10,
    region: "southamerica-east1", // <--- LA REGIÓN ESTÁ ACÁ ADENTRO AHORA
  },
  async (event) => {
    const userId = event.params.userId;
    const before = event.data?.before.data();
    const after = event.data?.after.data();

    if (!before || !after) return;

    const changes = {
      nameChanged: before.displayName !== after.displayName,
      photoChanged: before.photoURL !== after.photoURL,
      cityChanged: before.city !== after.city,
      provinceChanged: before.province !== after.province,
    };

    if (!Object.values(changes).some(Boolean)) return;

    try {
      const postsSnap = await admin
        .firestore()
        .collection("posts")
        .where("userId", "==", userId)
        .get();

      if (postsSnap.empty) return;

      const updateData: any = {};
      
      if (changes.nameChanged) updateData.authorName = after.displayName ?? null;
      if (changes.photoChanged) updateData.authorPhoto = after.photoURL ?? null;
      
      if (changes.cityChanged) {
        updateData.authorCity = after.city ?? null;
        updateData.city = after.city ?? null; 
      }
      
      if (changes.provinceChanged) {
        updateData.authorProvince = after.province ?? null;
        updateData.province = after.province ?? null;
      }

      const batch = admin.firestore().batch();
      postsSnap.docs.forEach((doc) => {
        batch.update(doc.ref, updateData);
      });

      await batch.commit();
      console.log(`✅ Posts sincronizados con éxito para el usuario ${userId}`);
      
    } catch (error) {
      console.error("🔥 Error syncing posts:", error);
    }
  }
);