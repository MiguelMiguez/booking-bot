import { NextFunction, Request, Response } from "express";
import {
  createService,
  deleteService,
  listServices,
  updateService,
} from "../services/serviceService";
import { CreateServiceInput } from "../models/service";
import { HttpError } from "../utils/httpError";
import { logger } from "../utils/logger";

const sanitizeServicePayload = (
  payload: Partial<CreateServiceInput>
): Partial<CreateServiceInput> => {
  const normalized: Partial<CreateServiceInput> = {};

  if (payload.name !== undefined) {
    const name = payload.name.trim();
    if (name.length === 0) {
      throw new HttpError(400, "El servicio debe incluir un nombre.");
    }
    normalized.name = name;
  }

  if (payload.description !== undefined) {
    normalized.description = payload.description.trim();
  }

  if (payload.durationMinutes !== undefined) {
    const minutes = Number(payload.durationMinutes);
    if (!Number.isFinite(minutes) || minutes <= 0) {
      throw new HttpError(400, "La duración debe ser un número mayor a 0.");
    }
    normalized.durationMinutes = Math.round(minutes);
  }

  if (payload.price !== undefined) {
    const price = Number(payload.price);
    if (!Number.isFinite(price) || price < 0) {
      throw new HttpError(
        400,
        "El precio debe ser un número mayor o igual a 0."
      );
    }
    normalized.price = Number(price.toFixed(2));
  }

  return normalized;
};

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
    const payload = sanitizeServicePayload(req.body ?? {});

    if (!payload.name) {
      throw new HttpError(400, "El servicio debe incluir un nombre.");
    }

    const service = await createService(payload as CreateServiceInput);

    logger.info(`Servicio creado (${service.name})`);
    res.status(201).json(service);
  } catch (error) {
    next(error);
  }
};

export const handleUpdateService = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) {
      throw new HttpError(400, "Se requiere el identificador del servicio.");
    }

    const payload = sanitizeServicePayload(req.body ?? {});

    if (Object.keys(payload).length === 0) {
      throw new HttpError(400, "No se proporcionaron campos para actualizar.");
    }

    const service = await updateService(id, payload);
    logger.info(`Servicio actualizado (${service.name})`);
    res.json(service);
  } catch (error) {
    next(error);
  }
};

export const handleDeleteService = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) {
      throw new HttpError(400, "Se requiere el identificador del servicio.");
    }

    await deleteService(id);
    logger.info(`Servicio eliminado (${id})`);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
