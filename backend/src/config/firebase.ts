import admin from "firebase-admin";
import env from "./env";
import { logger } from "../utils/logger";

let firestoreInstance: admin.firestore.Firestore | null = null;

const hasServiceAccountCredentials = (): boolean => {
  return (
    env.firebaseProjectId !== "" &&
    env.firebaseClientEmail !== "" &&
    env.firebasePrivateKey !== ""
  );
};

const hasPartialCredentials = (): boolean => {
  return !hasServiceAccountCredentials() &&
    (env.firebaseProjectId !== "" ||
      env.firebaseClientEmail !== "" ||
      env.firebasePrivateKey !== "");
};

const canUseDefaultCredentials = (): boolean => {
  return Boolean(
    process.env.GOOGLE_APPLICATION_CREDENTIALS ??
      process.env.FIREBASE_CONFIG ??
      process.env.GOOGLE_CLOUD_PROJECT ??
      process.env.GCLOUD_PROJECT ??
      process.env.K_SERVICE ??
      process.env.FUNCTIONS_EMULATOR
  );
};

const ensureFirebaseApp = (): void => {
  if (firestoreInstance) {
    return;
  }

  if (hasPartialCredentials()) {
    throw new Error(
      "Credenciales de Firebase incompletas. Define FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL y FIREBASE_PRIVATE_KEY."
    );
  }

  if (!hasServiceAccountCredentials() && !canUseDefaultCredentials()) {
    throw new Error(
      "No se encontraron credenciales de Firebase. Configura las variables FIREBASE_* o GOOGLE_APPLICATION_CREDENTIALS."
    );
  }

  if (admin.apps.length === 0) {
    if (hasServiceAccountCredentials()) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: env.firebaseProjectId,
          clientEmail: env.firebaseClientEmail,
          privateKey: env.firebasePrivateKey,
        }),
      });
      logger.info(
        "Firebase Firestore inicializado con credenciales de servicio."
      );
    } else {
      admin.initializeApp();
      logger.info(
        "Firebase Firestore inicializado utilizando credenciales predeterminadas."
      );
    }
  }

  firestoreInstance = admin.firestore();
};

export const getFirestore = (): admin.firestore.Firestore => {
  ensureFirebaseApp();
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return firestoreInstance!;
};
