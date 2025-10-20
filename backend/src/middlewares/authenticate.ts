import { NextFunction, Request, Response } from "express";
import env from "../config/env";
import { HttpError } from "../utils/httpError";
import { logger } from "../utils/logger";

export type UserRole = "admin" | "user";

type ApiKeyEntry = {
  role: UserRole;
  value: string;
};

const apiKeys: ApiKeyEntry[] = [
  { role: "admin", value: env.adminApiKey },
  { role: "user", value: env.userApiKey },
];

const findRoleByKey = (apiKey: string | undefined): UserRole | undefined => {
  if (!apiKey) {
    return undefined;
  }

  const normalizedKey = apiKey.trim();
  const match = apiKeys.find(
    (entry) => entry.value && entry.value === normalizedKey
  );
  return match?.role;
};

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (req.method === "OPTIONS") {
    next();
    return;
  }

  const apiKeyHeader = req.header("x-api-key");
  const apiKeyQuery =
    typeof req.query.apiKey === "string" ? req.query.apiKey : undefined;
  const apiKeyCandidate = apiKeyHeader ?? apiKeyQuery;

  const role = findRoleByKey(apiKeyCandidate);

  if (!role) {
    logger.warn(
      `Intento de acceso no autorizado a ${req.method} ${req.originalUrl}`
    );
    next(new HttpError(401, "Requiere autenticación válida."));
    return;
  }

  req.userRole = role;
  next();
};
