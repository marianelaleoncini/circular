import {onDocumentUpdated} from "firebase-functions/v2/firestore";
import {setGlobalOptions} from "firebase-functions/v2";
import * as admin from "firebase-admin";

// Inicializamos la app solo si no existe ya (buena práctica)
if (admin.apps.length === 0) {
  admin.initializeApp();
}

setGlobalOptions({region: "southamerica-east1"});


export const syncUserPosts = onDocumentUpdated(
  {
    document: "users/{userId}",
    memory: "512MiB",
    timeoutSeconds: 60,
    maxInstances: 10,
    region: "us-central1",
  },
  async (event) => {
    const userId = event.params.userId;
    const before = event.data?.before.data();
    const after = event.data?.after.data();

    // LOG CRÍTICO 1: Ver qué llega realmente
    console.log("🔥 FUNCTION TRIGGERED for:", userId);
    console.log("BEFORE data:", JSON.stringify(before));
    console.log("AFTER data:", JSON.stringify(after));

    if (!before || !after) return;

    // LOG CRÍTICO 2: Ver por qué falla la comparación
    const changes = {
      nameChanged: before.displayName !== after.displayName,
      photoChanged: before.photoURL !== after.photoURL,
      cityChanged: before.city !== after.city,
      provinceChanged: before.province !== after.province,
    };
    console.log("🔍 Detected changes:", changes);

    if (!Object.values(changes).some(Boolean)) {
      console.log("❌ No relevant changes detected. Exiting.");
      return;
    }

    try {
      // LOG CRÍTICO 3: Verificar la query
      console.log(`Searching posts where 'userId' == '${userId}'`);
      const postsSnap = await admin
        .firestore()
        .collection("posts")
        .where("userId", "==", userId) // <--- OJO AQUÍ
        .get();

      console.log(`Found ${postsSnap.size} posts to update.`);

      if (postsSnap.empty) {
        console.log(
          "User has no posts or 'userId' field in posts does not match."
        );
        return;
      }

      const batch = admin.firestore().batch();
      postsSnap.docs.forEach((doc) => {
        // Log para ver qué doc se está actualizando
        console.log(`Queueing update for post ${doc.id}`);
        batch.update(doc.ref, {
          authorName: after.displayName ?? null,
          authorPhoto: after.photoURL ?? null,
          authorCity: after.city ?? null,
          authorProvince: after.province ?? null,
        });
      });

      await batch.commit();
      console.log("✅ Update successful!");
    } catch (error) {
      console.error("🔥 Error syncing posts:", error);
    }
  }
);
