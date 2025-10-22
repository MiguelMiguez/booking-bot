import dotenv from "dotenv";
import { logger } from "../utils/logger";

dotenv.config();

interface EnvConfig {
  port: number;
  firebaseProjectId: string;
  firebaseClientEmail: string;
  firebasePrivateKey: string;
  whatsappEnabled: boolean;
  whatsappSessionPath?: string;
  whatsappBrowserPath?: string;
  whatsappHeadless: boolean;
  adminApiKey: string;
  userApiKey: string;
}

const rawEnv = {
  PORT: process.env.PORT ?? "3000",
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
  FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
  FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY,
  WHATSAPP_ENABLED: process.env.WHATSAPP_ENABLED,
  WHATSAPP_SESSION_PATH: process.env.WHATSAPP_SESSION_PATH,
  WHATSAPP_BROWSER_PATH: process.env.WHATSAPP_BROWSER_PATH,
  WHATSAPP_HEADLESS: process.env.WHATSAPP_HEADLESS,
  ADMIN_API_KEY: process.env.ADMIN_API_KEY,
  USER_API_KEY: process.env.USER_API_KEY,
};

const sanitizeMultilineSecret = (value: string | undefined): string => {
  if (!value) {
    return "";
  }

  const trimmed = value.trim();
  const unquoted =
    trimmed.startsWith('"') && trimmed.endsWith('"')
      ? trimmed.slice(1, -1)
      : trimmed;

  return unquoted.replace(/\\n/g, "\n");
};

const env: EnvConfig = {
  port: Number.parseInt(rawEnv.PORT, 10) || 3000,
  firebaseProjectId: rawEnv.FIREBASE_PROJECT_ID ?? "",
  firebaseClientEmail: rawEnv.FIREBASE_CLIENT_EMAIL ?? "",
  firebasePrivateKey: sanitizeMultilineSecret(rawEnv.FIREBASE_PRIVATE_KEY),
  whatsappEnabled: rawEnv.WHATSAPP_ENABLED === "true",
  whatsappSessionPath: rawEnv.WHATSAPP_SESSION_PATH,
  whatsappBrowserPath: rawEnv.WHATSAPP_BROWSER_PATH,
  whatsappHeadless: rawEnv.WHATSAPP_HEADLESS !== "false",
  adminApiKey: rawEnv.ADMIN_API_KEY?.trim() ?? "",
  userApiKey: rawEnv.USER_API_KEY?.trim() ?? "",
};

const credentialKeys: Array<
  "firebaseProjectId" | "firebaseClientEmail" | "firebasePrivateKey"
> = ["firebaseProjectId", "firebaseClientEmail", "firebasePrivateKey"];

const credentialEnvMap: Record<(typeof credentialKeys)[number], string> = {
  firebaseProjectId: "FIREBASE_PROJECT_ID",
  firebaseClientEmail: "FIREBASE_CLIENT_EMAIL",
  firebasePrivateKey: "FIREBASE_PRIVATE_KEY",
};

const apiKeyEnvMap: Record<"adminApiKey" | "userApiKey", string> = {
  adminApiKey: "ADMIN_API_KEY",
  userApiKey: "USER_API_KEY",
};

const missingCredentialKeys = credentialKeys.filter((key) => env[key] === "");

const anyCredentialProvided = credentialKeys.some((key) => env[key] !== "");

const runningOnGcp = Boolean(
  process.env.FIREBASE_CONFIG ??
    process.env.GOOGLE_CLOUD_PROJECT ??
    process.env.GCLOUD_PROJECT ??
    process.env.K_SERVICE ??
    process.env.FUNCTIONS_EMULATOR
);

if (anyCredentialProvided && missingCredentialKeys.length > 0) {
  missingCredentialKeys.forEach((key) => {
    logger.warn(`Variable de entorno faltante: ${credentialEnvMap[key]}`);
  });
} else if (!anyCredentialProvided && !runningOnGcp) {
  logger.warn(
    "No se detectaron credenciales de Firebase. Configura las variables FIREBASE_* o define GOOGLE_APPLICATION_CREDENTIALS."
  );
}

(
  Object.entries(apiKeyEnvMap) as Array<["adminApiKey" | "userApiKey", string]>
).forEach(([key, envName]) => {
  if (!env[key]) {
    logger.warn(
      `Variable de entorno faltante para seguridad del API: ${envName}`
    );
  }
});

export default env;
