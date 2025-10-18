import {
  getApp,
  getApps,
  initializeApp,
  type FirebaseOptions,
} from "firebase/app";
import { getFirestore } from "firebase/firestore";

type EnvKey =
  | "FIREBASE_API_KEY"
  | "FIREBASE_AUTH_DOMAIN"
  | "FIREBASE_PROJECT_ID"
  | "FIREBASE_STORAGE_BUCKET"
  | "FIREBASE_MESSAGING_SENDER_ID"
  | "FIREBASE_APP_ID";

type EnvRecord = Record<EnvKey, string | undefined>;

const readEnv = (key: EnvKey): string | undefined => {
  const baseKey = key.replace(/^FIREBASE_/, "");
  const candidates = [
    `VITE_${key}`,
    `VITE_${baseKey}`,
    `REACT_APP_${key}`,
    `REACT_APP_${baseKey}`,
  ];

  for (const candidate of candidates) {
    const value = import.meta.env[candidate as keyof ImportMetaEnv] as
      | string
      | undefined;
    if (value && value.length > 0) {
      return value;
    }
  }

  return undefined;
};

const env: EnvRecord = {
  FIREBASE_API_KEY: readEnv("FIREBASE_API_KEY"),
  FIREBASE_AUTH_DOMAIN: readEnv("FIREBASE_AUTH_DOMAIN"),
  FIREBASE_PROJECT_ID: readEnv("FIREBASE_PROJECT_ID"),
  FIREBASE_STORAGE_BUCKET: readEnv("FIREBASE_STORAGE_BUCKET"),
  FIREBASE_MESSAGING_SENDER_ID: readEnv("FIREBASE_MESSAGING_SENDER_ID"),
  FIREBASE_APP_ID: readEnv("FIREBASE_APP_ID"),
};

const missing = Object.entries(env)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missing.length > 0) {
  // Provide a friendly error early if the environment variables are not configured.
  throw new Error(
    `Variables de Firebase faltantes: ${missing.join(", ")}. ` +
      "Crea un archivo .env con las claves VITE_FIREBASE_* o REACT_APP_*"
  );
}

const firebaseConfig: FirebaseOptions = {
  apiKey: env.FIREBASE_API_KEY!,
  authDomain: env.FIREBASE_AUTH_DOMAIN!,
  projectId: env.FIREBASE_PROJECT_ID!,
  storageBucket: env.FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: env.FIREBASE_MESSAGING_SENDER_ID!,
  appId: env.FIREBASE_APP_ID!,
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const db = getFirestore(app);
