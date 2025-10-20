import { NextFunction, Request, Response } from "express";
import type { UserRole } from "./authenticate";
import { HttpError } from "../utils/httpError";

export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.userRole) {
      next(new HttpError(401, "Requiere autenticación válida."));
      return;
    }

    if (!allowedRoles.includes(req.userRole)) {
      next(
        new HttpError(
          403,
          "Permisos insuficientes para la operación solicitada."
        )
      );
      return;
    }

    next();
  };
};
