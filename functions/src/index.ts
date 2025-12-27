import {onDocumentUpdated} from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";

// Inicializamos la app solo si no existe ya (buena práctica)
if (admin.apps.length === 0) {
  admin.initializeApp();
}

export const syncUserPosts = onDocumentUpdated(
  "users/{userId}",
  async (event) => {
    const userId = event.params.userId;

    // Obtenemos los datos antes y después del cambio
    const before = event.data?.before.data();
    const after = event.data?.after.data();

    // Si el documento fue creado o borrado (no actualizado), salimos
    if (!before || !after) {
      console.log(`User ${userId} created or deleted. No sync needed.`);
      return;
    }

    // 1. Verificar si cambiaron los datos que nos importan
    // Esto ahorra dinero y ejecuciones innecesarias
    if (
      before.displayName === after.displayName &&
      before.photoURL === after.photoURL &&
      before.city === after.city &&
      before.province === after.province
    ) {
      console.log("No profile changes detected. Skipping post sync.");
      return;
    }

    console.log(`Syncing profile changes for user ${userId}...`, {
      newCity: after.city,
      newProvince: after.province,
    });

    try {
      // 2. Buscar todos los posts de este usuario
      const postsSnap = await admin
        .firestore()
        .collection("posts")
        .where("userId", "==", userId)
        .get();

      if (postsSnap.empty) {
        console.log("User has no posts to update.");
        return;
      }

      console.log(`Found ${postsSnap.size} posts to update.`);

      // 3. Ejecutar actualización en lote (Batch)
      const batch = admin.firestore().batch();

      postsSnap.docs.forEach((doc) => {
        batch.update(doc.ref, {
          // Usamos '?? null' para proteger contra undefined.
          // Si after.city es undefined, se guarda null.
          // Si es un string, se guarda el string.
          authorName: after.displayName ?? null,
          authorPhoto: after.photoURL ?? null,
          authorCity: after.city ?? null,
          authorProvince: after.province ?? null,
        });
      });

      await batch.commit();
      console.log(`Successfully updated ${postsSnap.size} posts.`);
    } catch (error) {
      console.error("Error updating user posts:", error);
    }
  }
);
