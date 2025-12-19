import { NextFunction, Request, Response } from "express";
import {
  createBooking,
  deleteBooking,
  listBookings,
  updateBooking,
} from "../services/bookingService";
import { CreateBookingInput, UpdateBookingInput } from "../models/booking";
import { HttpError } from "../utils/httpError";
import { logger } from "../utils/logger";

const requiredFields: Array<keyof CreateBookingInput> = [
  "name",
  "service",
  "date",
  "time",
  "phone",
];

const validatePayload = (payload: Partial<CreateBookingInput>): void => {
  const missingFields = requiredFields.filter((field) => {
    const value = payload[field];
    return typeof value !== "string" || value.trim().length === 0;
  });

  if (missingFields.length > 0) {
    throw new HttpError(
      400,
      `Campos requeridos faltantes: ${missingFields.join(", ")}`
    );
  }
};

export const handleCreateBooking = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    validatePayload(req.body);
    const payload = req.body as CreateBookingInput;
    const booking = await createBooking(payload);
    logger.info(`Turno creado para ${booking.name} (${booking.service})`);
    res.status(201).json(booking);
  } catch (error) {
    next(error);
  }
};

export const handleListBookings = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const bookings = await listBookings();
    res.json(bookings);
  } catch (error) {
    next(error);
  }
};

export const handleDeleteBooking = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) {
      throw new HttpError(400, "Se requiere el id del turno a eliminar.");
    }

    await deleteBooking(id);
    logger.info(`Turno eliminado (${id})`);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const handleUpdateBooking = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) {
      throw new HttpError(400, "Se requiere el id del turno a actualizar.");
    }

    const payload = req.body as UpdateBookingInput;

    if (Object.keys(payload).length === 0) {
      throw new HttpError(400, "Se requiere al menos un campo para actualizar.");
    }

    const booking = await updateBooking(id, payload);
    logger.info(`Turno actualizado (${id})`);
    res.json(booking);
  } catch (error) {
    next(error);
  }
};
