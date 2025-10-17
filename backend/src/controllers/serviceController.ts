import { NextFunction, Request, Response } from "express";
import { createService, listServices } from "../services/serviceService";
import { CreateServiceInput } from "../models/service";
import { HttpError } from "../utils/httpError";
import { logger } from "../utils/logger";

export const handleListServices = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const services = await listServices();
    res.json(services);
  } catch (error) {
    next(error);
  }
};

export const handleCreateService = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const payload = req.body as CreateServiceInput;
    if (!payload?.name || payload.name.trim().length === 0) {
      throw new HttpError(400, "El servicio debe incluir un nombre.");
    }

    const service = await createService({
      ...payload,
      name: payload.name.trim(),
    });

    logger.info(`Servicio creado (${service.name})`);
    res.status(201).json(service);
  } catch (error) {
    next(error);
  }
};
