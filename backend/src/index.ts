import app from "./app";
import env from "./config/env";
import { getFirestore } from "./config/firebase";
import { logger } from "./utils/logger";

const start = async (): Promise<void> => {
  try {
    await getFirestore();
    app.listen(env.port, () => {
      logger.info(`Servidor escuchando en http://localhost:${env.port}`);
    });
  } catch (error) {
    logger.error("No se pudo iniciar el servidor", error);
    process.exit(1);
  }
};

process.on("unhandledRejection", (reason: unknown) => {
  logger.error("Unhandled Promise Rejection", reason);
});

process.on("uncaughtException", (error: Error) => {
  logger.error("Uncaught Exception", error);
  process.exit(1);
});

void start();
