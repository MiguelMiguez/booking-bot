import { setGlobalOptions } from "firebase-functions/v2";
import { onRequest } from "firebase-functions/v2/https";
import app from "./app";
import { getFirestore } from "./config/firebase";
import { logger } from "./utils/logger";

// Prepara Firestore al cargar la función para evitar inicializaciones repetidas.
try {
  getFirestore();
  logger.info("Firestore inicializado para Cloud Functions");
} catch (error) {
  logger.error("No se pudo inicializar Firestore al cargar la función", error);
}

setGlobalOptions({ region: "us-central1", maxInstances: 10 });

export const api = onRequest(app);
