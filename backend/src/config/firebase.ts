import admin from "firebase-admin";
import env from "./env";
import { logger } from "../utils/logger";

let firestoreInstance: admin.firestore.Firestore | null = null;

const ensureFirebaseApp = (): void => {
  if (firestoreInstance) {
    return;
  }

  if (
    !env.firebaseProjectId ||
    !env.firebaseClientEmail ||
    !env.firebasePrivateKey
  ) {
    throw new Error("Faltan credenciales de Firebase. Revisa el archivo .env.");
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: env.firebaseProjectId,
      clientEmail: env.firebaseClientEmail,
      privateKey: env.firebasePrivateKey,
    }),
  });

  firestoreInstance = admin.firestore();
  logger.info("Firebase Firestore inicializado");
};

export const getFirestore = (): admin.firestore.Firestore => {
  ensureFirebaseApp();
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return firestoreInstance!;
};
