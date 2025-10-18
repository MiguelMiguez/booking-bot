import { NextFunction, Request, Response } from "express";
import { isHttpError } from "../utils/httpError";
import { logger } from "../utils/logger";

// Middleware centralizado para manejo de errores de Express.
export const errorHandler = (
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = isHttpError(error) ? error.statusCode : 500;
  const message = error instanceof Error ? error.message : "Error inesperado";

  if (statusCode >= 500) {
    logger.error("Error interno del servidor", error);
  } else {
    logger.warn(`Solicitud rechazada (${statusCode}): ${message}`);
  }

  res.status(statusCode).json({
    error: message,
  });
};
