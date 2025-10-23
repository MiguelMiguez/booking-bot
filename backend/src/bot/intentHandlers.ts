import type { DialogflowIntentResult } from "../ai/dialogflow";
import type { Message } from "whatsapp-web.js";
import {
  createBooking,
  isSlotAvailable,
  suggestAvailableSlots,
} from "../services/bookingService";
import { logger } from "../utils/logger";

// Define las funciones de parseo aquí o impórtalas desde otro archivo
// (ej: import { parseDialogflowDate, parseDialogflowTime } from "../helpers/dialogflowParser";)

const safeStringify = (value: unknown): string => {
  if (typeof value === "string") {
    return value;
  }

  try {
    return JSON.stringify(value);
  } catch (error) {
    return String(value);
  }
};

/**
 * Intenta convertir la salida de fecha de Dialogflow a YYYY-MM-DD.
 */
const parseDialogflowDate = (dialogflowDate: unknown): string | null => {
  if (
    typeof dialogflowDate === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(dialogflowDate)
  ) {
    return dialogflowDate;
  }

  let dateStr = "";
  if (typeof dialogflowDate === "string") {
    dateStr = dialogflowDate;
  } else if (dialogflowDate && typeof dialogflowDate === "object") {
    // Intenta extraer de estructuras comunes de Dialogflow ES
    const potentialDate =
      (dialogflowDate as { date_time?: string }).date_time ||
      (dialogflowDate as { dateTime?: string }).dateTime ||
      (
        dialogflowDate as {
          structValue?: { fields?: { date_time?: { stringValue?: string } } };
        }
      )?.structValue?.fields?.date_time?.stringValue ||
      (dialogflowDate as { iso?: string }).iso;
    if (typeof potentialDate === "string") {
      dateStr = potentialDate;
    }
  }

  if (!dateStr) {
    logger.warn(
      `No se pudo extraer un string de fecha de Dialogflow. Valor: ${safeStringify(
        dialogflowDate
      )}`
    );
    return null;
  }

  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      logger.warn(
        `String de fecha de Dialogflow no es válido. Valor: ${safeStringify(
          dateStr
        )}`
      );
      return null;
    }
    // Formato YYYY-MM-DD usando UTC para evitar problemas de zona horaria local del servidor
    const year = date.getUTCFullYear();
    const month = (date.getUTCMonth() + 1).toString().padStart(2, "0");
    const day = date.getUTCDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
  } catch (e) {
    logger.error(
      `Error parseando fecha de Dialogflow. Valor: ${safeStringify(dateStr)}`,
      e
    );
    return null;
  }
};

/**
 * Intenta convertir la salida de hora de Dialogflow a HH:mm.
 */
const parseDialogflowTime = (dialogflowTime: unknown): string | null => {
  if (
    typeof dialogflowTime === "string" &&
    /^\d{2}:\d{2}$/.test(dialogflowTime)
  ) {
    return dialogflowTime;
  }
  if (
    typeof dialogflowTime === "string" &&
    /^\d{2}:\d{2}:\d{2}$/.test(dialogflowTime)
  ) {
    return dialogflowTime.substring(0, 5); // Tomar HH:mm de HH:mm:ss
  }

  let timeStr = "";
  if (typeof dialogflowTime === "string") {
    timeStr = dialogflowTime;
  } else if (dialogflowTime && typeof dialogflowTime === "object") {
    // Intenta extraer de estructuras comunes de Dialogflow ES
    const potentialTime =
      (dialogflowTime as { date_time?: string }).date_time ||
      (dialogflowTime as { dateTime?: string }).dateTime ||
      (
        dialogflowTime as {
          structValue?: { fields?: { date_time?: { stringValue?: string } } };
        }
      )?.structValue?.fields?.date_time?.stringValue ||
      (dialogflowTime as { iso?: string }).iso;
    if (typeof potentialTime === "string") {
      timeStr = potentialTime;
    }
  }

  if (!timeStr) {
    logger.warn(
      `No se pudo extraer un string de hora de Dialogflow. Valor: ${safeStringify(
        dialogflowTime
      )}`
    );
    return null;
  }

  try {
    const date = new Date(timeStr);
    if (isNaN(date.getTime())) {
      logger.warn(
        `String de hora de Dialogflow no es válido. Valor: ${safeStringify(
          timeStr
        )}`
      );
      // Intenta parsear solo la parte de la hora si es algo como "15:30:00"
      if (/^\d{2}:\d{2}:\d{2}$/.test(timeStr)) {
        return timeStr.substring(0, 5);
      }
      return null;
    }
    // Formato HH:mm usando UTC para evitar problemas de zona horaria local del servidor
    const hours = date.getUTCHours().toString().padStart(2, "0");
    const minutes = date.getUTCMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  } catch (e) {
    logger.error(
      `Error parseando hora de Dialogflow. Valor: ${safeStringify(timeStr)}`,
      e
    );
    return null;
  }
};

interface BookingEntities {
  fecha?: unknown; // Cambiado a unknown para parseo seguro
  horario?: unknown; // Cambiado a unknown para parseo seguro
  servicio?: unknown; // Cambiado a unknown para parseo seguro
  nombre?: string;
  telefono?: string;
}

// Función para extraer entidades de forma segura
const extractSlotInfo = (
  entities: Record<string, unknown>
): BookingEntities => ({
  fecha: entities.fecha, // Mantener como unknown
  horario: entities.horario, // Mantener como unknown
  servicio: entities.servicio, // Mantener como unknown
  nombre: entities.nombre as string | undefined, // Asumir que nombre y tel son strings simples si existen
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
      // TODO: Llamar a listServices y formatear la respuesta
      // import { listServices } from "../services/serviceService";
      // const services = await listServices();
      // const formattedServices = formatServices(services); // Necesitarías una función formatServices
      await message.reply(
        intentPayload.fulfillmentText ??
          "Aquí van los servicios disponibles." /* Reemplazar con formattedServices */
      );
      break;

    default:
      // Usa el fulfillmentText si Dialogflow lo proporciona (puede ser una respuesta configurada o un reprompt)
      if (intentPayload.fulfillmentText) {
        await message.reply(intentPayload.fulfillmentText);
      } else {
        // Respuesta genérica si no hay fulfillmentText
        await message.reply(
          "Perdón, todavía no entiendo eso. ¿Podés reformularlo?"
        );
        logger.info(
          `Intent no manejado o sin fulfillmentText. Intent detectado: ${safeStringify(
            intentPayload.intent
          )}`
        );
      }
  }
};

const handleBookingIntent = async (
  message: Message,
  payload: DialogflowIntentResult
): Promise<void> => {
  const entities = extractSlotInfo(payload.entities);
  const { fecha, horario, servicio, nombre /* telefono */ } = entities;

  // --- ¡BLOQUE ELIMINADO! ---
  // No verificar aquí si faltan datos, Dialogflow lo maneja con los prompts.

  // Parsear fecha y hora recibidas de Dialogflow
  const formattedDate = parseDialogflowDate(fecha);
  const formattedTime = parseDialogflowTime(horario);
  // Extraer nombre del servicio (asumiendo que viene como string o string dentro de lista/struct)
  let serviceName: string | null = null;
  if (typeof servicio === "string") {
    serviceName = servicio.trim();
  } else if (
    Array.isArray(servicio) &&
    servicio.length > 0 &&
    typeof servicio[0] === "string"
  ) {
    serviceName = servicio[0].trim(); // Tomar el primer elemento si es un array de strings
  } else if (servicio && typeof servicio === "object") {
    // Podría ser un structValue, intenta extraer stringValue si existe
    const potentialService = (servicio as { stringValue?: string }).stringValue;
    if (typeof potentialService === "string") {
      serviceName = potentialService.trim();
    }
  }

  // Verificar si tenemos toda la información necesaria *después* del parseo
  // Si falta algo, significa que Dialogflow no pudo llenarlo o el parseo falló.
  // En este punto, SÍ debemos responder o registrar el error, porque el intent se consideró completo.
  if (!formattedDate || !formattedTime || !serviceName) {
    logger.warn(
      "Faltan datos esenciales post-parseo para agendar_turno. Datos:" +
        ` fecha=${safeStringify(fecha)}` +
        ` horario=${safeStringify(horario)}` +
        ` servicio=${safeStringify(servicio)}` +
        ` formattedDate=${safeStringify(formattedDate)}` +
        ` formattedTime=${safeStringify(formattedTime)}` +
        ` serviceName=${safeStringify(serviceName)}`
    );
    // Usar fulfillmentText si existe (podría ser un prompt final de Dialogflow)
    await message.reply(
      payload.fulfillmentText ??
        "Parece que falta información clave (fecha, hora o servicio). ¿Podrías confirmarme los datos?"
    );
    return;
  }

  try {
    // Comprobar disponibilidad
    const slotAvailable = await isSlotAvailable(
      formattedDate,
      formattedTime,
      serviceName
    );

    if (!slotAvailable) {
      const suggestions = await suggestAvailableSlots(
        formattedDate,
        serviceName
      );
      const reply =
        suggestions.length > 0
          ? `El horario ${formattedTime} para ${serviceName} el ${formattedDate} no está libre. ¿Te sirven estos?: ${suggestions.join(
              ", "
            )}`
          : `Lo siento, el horario ${formattedTime} para ${serviceName} el ${formattedDate} ya está ocupado y no encuentro alternativas cercanas para ese día.`;
      await message.reply(reply);
      return;
    }

    // Obtener datos del contacto de WhatsApp
    let customerName = typeof nombre === "string" ? nombre : "Cliente WhatsApp";
    let customerPhone = message.from.replace(/@.+$/, ""); // Número base sin @c.us

    try {
      const contact = await message.getContact();
      customerName = contact.pushname || contact.name || customerName;
      // Whatsapp-web.js a menudo devuelve el número en 'id.user'
      const remoteCandidate = (message.id as { remote?: unknown }).remote;
      const remoteId =
        typeof remoteCandidate === "string" ? remoteCandidate : message.from;
      const authorId = (message as unknown as { author?: string }).author;
      const originId = remoteId.includes("@g.us")
        ? authorId ?? message.from
        : message.from;

      customerPhone = originId.replace(/@.+$/, "");
    } catch (contactError) {
      const contactErrorMessage =
        contactError instanceof Error ? contactError.message : contactError;
      logger.debug(
        `No se pudo obtener info detallada del contacto, usando datos base. Error: ${safeStringify(
          contactErrorMessage
        )}`
      );
    }

    // Crear la reserva
    const booking = await createBooking({
      name: customerName,
      service: serviceName,
      date: formattedDate,
      time: formattedTime,
      phone: customerPhone.startsWith("+")
        ? customerPhone
        : `+${customerPhone}`, // Asegurar prefijo '+'
    });

    // Confirmar al usuario
    await message.reply(
      `¡Listo ${customerName}! Agendé tu turno para ${booking.service} el día ${booking.date} a las ${booking.time}. ¡Te esperamos!`
    );
  } catch (error) {
    logger.error(
      `No se pudo crear el turno vía intent. Datos: fecha=${formattedDate}, hora=${formattedTime}, servicio=${serviceName}`,
      error
    );
    // Informar al usuario de forma más específica si es posible
    const userMessage =
      error instanceof Error &&
      (error.message.includes("horario") ||
        error.message.includes("disponible"))
        ? error.message // Reutiliza el mensaje de error si es claro (ej: "El horario ya no está disponible.")
        : "Hubo un problema al intentar agendar tu turno. Por favor, intenta de nuevo en unos minutos.";
    await message.reply(userMessage);
  }
};
