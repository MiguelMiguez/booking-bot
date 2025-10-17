import dotenv from "dotenv";
import { logger } from "../utils/logger";

dotenv.config();

interface EnvConfig {
  port: number;
  firebaseProjectId: string;
  firebaseClientEmail: string;
  firebasePrivateKey: string;
}

const requiredVariables: Array<keyof Omit<EnvConfig, "port">> = [
  "firebaseProjectId",
  "firebaseClientEmail",
  "firebasePrivateKey",
];

const rawEnv = {
  PORT: process.env.PORT ?? "3000",
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
  FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
  FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY,
};

const env: EnvConfig = {
  port: Number.parseInt(rawEnv.PORT, 10) || 3000,
  firebaseProjectId: rawEnv.FIREBASE_PROJECT_ID ?? "",
  firebaseClientEmail: rawEnv.FIREBASE_CLIENT_EMAIL ?? "",
  firebasePrivateKey: (rawEnv.FIREBASE_PRIVATE_KEY ?? "").replace(/\\n/g, "\n"),
};

requiredVariables.forEach((key) => {
  if (!env[key] || env[key].length === 0) {
    const variableName = key
      .replace("firebase", "FIREBASE_")
      .replace("ProjectId", "PROJECT_ID")
      .replace("ClientEmail", "CLIENT_EMAIL")
      .replace("PrivateKey", "PRIVATE_KEY");

    logger.warn(`Variable de entorno faltante: ${variableName}`);
  }
});

export default env;
