import type { DialogflowIntentResult } from "../ai/dialogflow";
import type { Message } from "whatsapp-web.js";
import {
  createBooking,
  isSlotAvailable,
  suggestAvailableSlots,
} from "../services/bookingService";
import { logger } from "../utils/logger";

interface BookingEntities {
  fecha?: string;
  horario?: string;
  servicio?: string;
  nombre?: string;
  telefono?: string;
}

const extractSlotInfo = (
  entities: Record<string, unknown>
): BookingEntities => ({
  fecha: entities.fecha as string | undefined,
  horario: entities.horario as string | undefined,
  servicio: entities.servicio as string | undefined,
  nombre: entities.nombre as string | undefined,
  telefono: entities.telefono as string | undefined,
});

export const handleIntent = async (
  message: Message,
  intentPayload: DialogflowIntentResult
): Promise<void> => {
  switch (intentPayload.intent) {
    case "agendar_turno":
      await handleBookingIntent(message, intentPayload);
      break;

    case "consultar_servicios":
      // TODO: integrate with existing listServices flow.
      await message.reply(
        intentPayload.fulfillmentText ?? "Aquí van los servicios disponibles."
      );
      break;

    default:
      await message.reply(
        intentPayload.fulfillmentText ??
          "Perdón, todavía no entiendo eso. ¿Podés reformularlo?"
      );
  }
};

const handleBookingIntent = async (
  message: Message,
  payload: DialogflowIntentResult
): Promise<void> => {
  const entities = extractSlotInfo(payload.entities);
  const { fecha, horario, servicio, nombre, telefono } = entities;

  if (!fecha || !horario || !servicio) {
    await message.reply(
      "Necesito fecha, horario y servicio para agendar. Por favor, envíame esos datos."
    );
    return;
  }

  try {
    const slotAvailable = await isSlotAvailable(fecha, horario, servicio);

    if (!slotAvailable) {
      const suggestions = await suggestAvailableSlots(fecha, servicio);
      const reply =
        suggestions.length > 0
          ? `Ese turno no está libre. ¿Te sirven estos horarios? ${suggestions.join(
              ", "
            )}`
          : "Ese turno ya está ocupado y no encuentro alternativas cercanas.";
      await message.reply(reply);
      return;
    }

    const booking = await createBooking({
      name: nombre ?? "Cliente WhatsApp",
      service: servicio,
      date: fecha,
      time: horario,
      phone: telefono ?? message.from,
    });

    await message.reply(
      `Listo, reservé ${booking.service} para el ${booking.date} a las ${booking.time}.`
    );
  } catch (error) {
    logger.error("No se pudo crear el turno vía intent", error);
    await message.reply(
      "Tuvimos un problema al agendar el turno. Intentá de nuevo en unos minutos."
    );
  }
};
