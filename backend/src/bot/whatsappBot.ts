import path from "node:path";
import qrcode from "qrcode-terminal";
import { Client, LocalAuth, Message } from "whatsapp-web.js";
import { registerMessageListener } from "./messageRouter";
import env from "../config/env";
import {
  createBooking,
  isSlotAvailable,
  isWithinBusinessHours,
  listBookings,
  suggestAvailableSlots,
} from "../services/bookingService";
import { listServices } from "../services/serviceService";
import type { Booking } from "../models/booking";
import type { Service } from "../models/service";
import { isHttpError } from "../utils/httpError";
import { logger } from "../utils/logger";

const HELP_MESSAGE = [
  "Hola! Soy el asistente de turnos.",
  "", // Paragraph spacing
  "Comandos disponibles:",
  "- menu: Ver esta ayuda.",
  "- servicios: Listar servicios activos.",
  "- turnos: Mostrar los próximos turnos.",
  "- Reservar turno: Iniciar una reserva guiada paso a paso.",
  "- Cancelar: Abandonar la reserva actual.",
].join("\n");

let client: Client | null = null;

type ConversationStep = "idle" | "awaitingDate" | "awaitingTime";

interface ConversationState {
  step: ConversationStep;
  selectedService?: string;
  pendingDate?: string;
}

const conversations = new Map<string, ConversationState>();

const getConversationState = (chatId: string): ConversationState => {
  return conversations.get(chatId) ?? { step: "idle" };
};

const setConversationState = (
  chatId: string,
  state: ConversationState
): void => {
  conversations.set(chatId, state);
};

const resetConversation = (chatId: string): void => {
  conversations.delete(chatId);
};

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const TIME_REGEX = /^\d{2}:\d{2}$/;
const CANCEL_KEYWORD = "cancelar";
const CUSTOMER_FALLBACK_NAME = "Cliente WhatsApp";

const isValidDateInput = (value: string): boolean => {
  if (!DATE_REGEX.test(value)) {
    return false;
  }

  const candidate = new Date(`${value}T00:00:00`);
  if (Number.isNaN(candidate.getTime())) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  candidate.setHours(0, 0, 0, 0);

  return candidate.getTime() >= today.getTime();
};

const sanitizePhoneNumber = (from: string, rawNumber?: string): string => {
  if (rawNumber && rawNumber.trim().length > 0) {
    return rawNumber.startsWith("+") ? rawNumber : `+${rawNumber}`;
  }

  return from.replace(/@.+$/, "");
};

const startReservationFlow = async (message: Message): Promise<void> => {
  try {
    const services = await listServices();

    if (services.length === 0) {
      await message.reply(
        "Todavía no hay servicios configurados. Agrega uno desde el panel de administración."
      );
      return;
    }

    const selectedService = services[0];

    setConversationState(message.from, {
      step: "awaitingDate",
      selectedService: selectedService.name,
    });

    await message.reply(
      `Perfecto, reservemos un turno para ${selectedService.name}.`
    );
    await message.reply(
      "¿Qué día te viene bien? Escribe la fecha en formato YYYY-MM-DD (ejemplo 2025-10-18). Puedes escribir *cancelar* para salir."
    );
  } catch (error) {
    logger.error(
      "No se pudieron obtener los servicios para iniciar la reserva",
      error
    );
    await message.reply(
      "No pude obtener la lista de servicios en este momento. Intenta más tarde."
    );
  }
};

const handleDateStep = async (
  message: Message,
  state: ConversationState
): Promise<void> => {
  const dateText = message.body.trim();

  if (!isValidDateInput(dateText)) {
    await message.reply(
      "Necesito una fecha válida a partir de hoy en formato YYYY-MM-DD (ejemplo 2025-10-18)."
    );
    return;
  }

  setConversationState(message.from, {
    ...state,
    step: "awaitingTime",
    pendingDate: dateText,
  });

  await message.reply(
    "Genial. ¿A qué hora? Usa el formato HH:mm (ejemplo 15:30). Los turnos disponibles son de 09:00 a 19:00."
  );
};

const handleTimeStep = async (
  message: Message,
  state: ConversationState
): Promise<void> => {
  const timeText = message.body.trim();

  if (!TIME_REGEX.test(timeText)) {
    await message.reply(
      "Por favor escribe la hora en formato HH:mm (ejemplo 15:30)."
    );
    return;
  }

  if (!isWithinBusinessHours(timeText)) {
    await message.reply(
      "Ese horario está fuera de la franja disponible (09:00 a 19:00). Elige otro horario."
    );
    return;
  }

  const date = state.pendingDate;
  if (!date) {
    resetConversation(message.from);
    await message.reply(
      "Perdí la fecha del turno. Escribe *reservar turno* para comenzar nuevamente."
    );
    return;
  }

  const serviceName = state.selectedService ?? "Turno";

  try {
    const slotAvailable = await isSlotAvailable(date, timeText, serviceName);

    if (!slotAvailable) {
      const suggestions = await suggestAvailableSlots(date, serviceName);
      const alternatives = suggestions.filter((slot) => slot !== timeText);

      let reply = "Ese horario ya no está disponible.";

      if (alternatives.length > 0) {
        reply += ` Horarios libres: ${alternatives.join(", ")}.`;
      } else {
        reply += " No quedan turnos libres para ese día.";
      }

      reply += " Elige otro horario en formato HH:mm.";
      await message.reply(reply);
      return;
    }

    let customerName = CUSTOMER_FALLBACK_NAME;
    let customerPhone = sanitizePhoneNumber(message.from);

    try {
      const contact = await message.getContact();

      if (contact.pushname && contact.pushname.trim().length > 0) {
        customerName = contact.pushname.trim();
      } else if (contact.name && contact.name.trim().length > 0) {
        customerName = contact.name.trim();
      }

      if (contact.number && contact.number.trim().length > 0) {
        customerPhone = sanitizePhoneNumber(message.from, contact.number);
      }
    } catch (contactError) {
      const reason =
        contactError instanceof Error
          ? contactError.message
          : String(contactError);
      logger.debug(`No se pudo obtener el contacto de WhatsApp: ${reason}`);
    }

    const booking = await createBooking({
      name: customerName,
      service: serviceName,
      date,
      time: timeText,
      phone: customerPhone,
    });

    await message.reply(
      `Listo ${customerName}! Reservamos ${serviceName} para el ${booking.date} a las ${booking.time}.`
    );

    resetConversation(message.from);
  } catch (error) {
    logger.error("No se pudo crear el turno durante la conversación", error);

    if (isHttpError(error)) {
      await message.reply(`No se pudo crear el turno: ${error.message}`);
    } else {
      await message.reply(
        "Tuvimos un problema al crear el turno. Intenta nuevamente más tarde."
      );
    }

    resetConversation(message.from);
  }
};

const resolveSessionPath = (): string => {
  const customPath = env.whatsappSessionPath;
  if (customPath && customPath.trim().length > 0) {
    return path.resolve(customPath);
  }
  return path.join(process.cwd(), ".wwebjs_auth");
};

const formatServices = (services: Service[]): string => {
  if (services.length === 0) {
    return "No hay servicios configurados en este momento.";
  }

  const items = services.map((service) => {
    const duration =
      service.durationMinutes !== undefined
        ? `${service.durationMinutes} min`
        : "Duración no informada";
    const price =
      service.price !== undefined
        ? `$${service.price.toFixed(2)}`
        : "Sin precio";
    const description = service.description ? `\n${service.description}` : "";
    return `• ${service.name} (${duration}) - ${price}${description}`;
  });

  return `Estos son los servicios disponibles:\n\n${items.join("\n\n")}`;
};

const formatBookings = (bookings: Booking[]): string => {
  if (bookings.length === 0) {
    return "No hay turnos registrados por ahora.";
  }

  const items = bookings.slice(0, 5).map((booking) => {
    return `• ${booking.date} ${booking.time} - ${booking.name} (${booking.phone})`;
  });

  return `Próximos turnos:\n\n${items.join("\n")}`;
};

const handleReserveCommand = async (
  message: Message,
  rawInput: string
): Promise<void> => {
  const parts = rawInput
    .split("|")
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);

  if (parts.length < 5) {
    await message.reply(
      "Formato inválido. Usa: reservar Nombre|Servicio|YYYY-MM-DD|HH:mm|Telefono"
    );
    return;
  }

  const [name, serviceLabel, date, time, phone] = parts;

  if (!name || !serviceLabel || !date || !time || !phone) {
    await message.reply(
      "Todos los campos son obligatorios. Revisa el formato solicitado."
    );
    return;
  }

  try {
    const services = await listServices();
    const matchingService = services.find(
      (service) => service.name.toLowerCase() === serviceLabel.toLowerCase()
    );

    if (!matchingService) {
      await message.reply(
        "No encontré ese servicio. Escribe *servicios* para ver la lista disponible."
      );
      return;
    }

    const booking = await createBooking({
      name,
      service: matchingService.name,
      date,
      time,
      phone,
    });

    await message.reply(
      `Turno reservado: ${booking.date} ${booking.time} - ${booking.service}. Nos vemos pronto!`
    );
  } catch (error) {
    logger.error("No se pudo crear el turno vía WhatsApp", error);

    if (isHttpError(error)) {
      await message.reply(`No se pudo crear el turno: ${error.message}`);
      return;
    }

    await message.reply(
      "Tuvimos un problema al crear el turno. Intenta nuevamente más tarde."
    );
  }
};

const handleIncomingMessage = async (message: Message): Promise<void> => {
  if (message.fromMe) {
    return;
  }

  if (message.from === "status@broadcast") {
    return;
  }

  if (message.from.endsWith("@g.us")) {
    return;
  }

  const text = message.body.trim();

  if (text.length === 0) {
    return;
  }

  const normalized = text.toLowerCase();
  const chatId = message.from;

  if (normalized === CANCEL_KEYWORD) {
    resetConversation(chatId);
    await message.reply(
      "Cancelé la solicitud. Escribe *reservar turno* si querés comenzar nuevamente."
    );
    return;
  }

  if (normalized.startsWith("reservar") && text.includes("|")) {
    const payload = text
      .slice("reservar".length)
      .replace(/^[:\s-]+/, "")
      .trim();
    await handleReserveCommand(message, payload);
    return;
  }

  const state = getConversationState(chatId);

  if (state.step === "awaitingDate") {
    await handleDateStep(message, state);
    return;
  }

  if (state.step === "awaitingTime") {
    await handleTimeStep(message, state);
    return;
  }

  logger.info(`Mensaje entrante de ${message.from}: ${text}`);

  const greetings = ["hola", "hello", "buenas"];

  if (greetings.some((term) => normalized.startsWith(term))) {
    await message.reply("Hola! Soy el asistente de turnos.");
    await message.reply(
      "¿En qué te puedo ayudar?\n- Reservar turno\nEscribe *reservar turno* para comenzar o *menu* para ver todas las opciones."
    );
    return;
  }

  if (["menu", "help", "ayuda"].includes(normalized)) {
    await message.reply(HELP_MESSAGE);
    return;
  }

  if (normalized === "reservar turno" || normalized === "reservar") {
    await startReservationFlow(message);
    return;
  }

  if (normalized === "servicios") {
    try {
      const services = await listServices();
      await message.reply(formatServices(services));
    } catch (error) {
      logger.error("No se pudieron obtener los servicios para WhatsApp", error);
      await message.reply(
        "No pude recuperar la lista de servicios. Intenta más tarde."
      );
    }
    return;
  }

  if (normalized === "turnos") {
    try {
      const bookings = await listBookings();
      await message.reply(formatBookings(bookings));
    } catch (error) {
      logger.error("No se pudieron obtener los turnos para WhatsApp", error);
      await message.reply("No pude recuperar los turnos. Intenta más tarde.");
    }
    return;
  }

  if (normalized.startsWith("reservar")) {
    const payload = text
      .slice("reservar".length)
      .replace(/^[:\s-]+/, "")
      .trim();
    await handleReserveCommand(message, payload);
    return;
  }

  await message.reply(
    "No entiendo tu mensaje. Escribe *menu* para ver los comandos disponibles o *reservar turno* para iniciar una reserva."
  );
};

export const startWhatsappBot = (): Client => {
  if (client) {
    return client;
  }

  const sessionPath = resolveSessionPath();

  const puppeteerArgs: string[] = [];
  if (process.platform !== "win32") {
    puppeteerArgs.push("--no-sandbox", "--disable-setuid-sandbox");
  }

  const puppeteerOptions = {
    // headless: env.whatsappHeadless, // Comenta o cambia esto
    headless: false, // <--- Cambia a false temporalmente
    args: puppeteerArgs,
    executablePath: env.whatsappBrowserPath, // Asegúrate que env.whatsappBrowserPath siga comentado en .env
  };

  const headlessFlag = String(puppeteerOptions.headless); // Se actualizará solo
  const executable = puppeteerOptions.executablePath ?? "(por defecto)";
  logger.info(
    `Configuración WhatsApp: headless=${headlessFlag}, sessionPath=${sessionPath}, executablePath=${executable}`
  ); // Log actualizado

  client = new Client({
    authStrategy: new LocalAuth({
      dataPath: sessionPath,
    }),
    puppeteer: puppeteerOptions, // Usa las opciones actualizadas
    webVersionCache: {
      type: "remote",
      remotePath:
        "https://raw.githubusercontent.com/guigo613/alternative-wa-version/main/html/2.2412.54.html",
    },
  });

  logger.info("Registrando listeners..."); // <-- Añade esto

  client.on("qr", (qr: string) => {
    logger.info(
      "Evento QR recibido. Escanea el código QR para vincular el bot de WhatsApp."
    ); // Modifica/Añade log
    qrcode.generate(qr, { small: true });
  });

  client.on("authenticated", () => {
    logger.info("Evento AUTHENTICATED recibido. Autenticación completada."); // <-- Añade esto
  });

  client.on("ready", () => {
    logger.info("Evento READY recibido. Bot listo para recibir mensajes."); // <-- Añade esto
  });

  client.on("auth_failure", (message: string) => {
    logger.error(
      "Evento AUTH_FAILURE recibido. Falló la autenticación con WhatsApp",
      message
    ); // <-- Añade esto
  });

  client.on("disconnected", (reason: string) => {
    logger.warn(
      `Evento DISCONNECTED recibido. Bot desconectado (${reason}). Intentando reconexión...` // <-- Añade esto
    );
    client?.initialize().catch((error: unknown) => {
      logger.error("No se pudo reiniciar el bot de WhatsApp", error);
    });
  });

  // ... otros listeners como message, error, browserPage, etc. ...

  logger.info("Listeners registrados. Llamando a initialize()..."); // <-- Añade esto
  //client.initialize();
  // ... resto del código

  client.on("qr", (qr: string) => {
    logger.info("Escanea el código QR para vincular el bot de WhatsApp.");
    qrcode.generate(qr, { small: true });
  });

  client.on("ready", () => {
    logger.info("Bot de WhatsApp listo para recibir mensajes.");
  });

  client.on("authenticated", () => {
    logger.info("Autenticación de WhatsApp completada.");
  });

  client.on("change_state", (state: string) => {
    logger.info(`Estado de WhatsApp actualizado: ${state}`);
  });

  client.on("loading_screen", (percent: number, message: string) => {
    logger.info(`Pantalla de carga WhatsApp: ${percent}% - ${message}`);
  });

  client.on("auth_failure", (message: string) => {
    logger.error("Falló la autenticación con WhatsApp", message);
  });

  client.on("disconnected", (reason: string) => {
    logger.warn(
      `Bot de WhatsApp desconectado (${reason}). Intentando reconexión...`
    );
    client?.initialize().catch((error: unknown) => {
      logger.error("No se pudo reiniciar el bot de WhatsApp", error);
    });
  });

  client.on("error", (error: unknown) => {
    logger.error("Error del cliente de WhatsApp", error);
  });

  client.on("browserPage", (page) => {
    logger.info(
      "Página de WhatsApp detectada, habilitando escuchas del navegador."
    );
    page.on("pageerror", (error) => {
      logger.error("Error en la página de WhatsApp", error);
    });

    page.on("error", (error) => {
      logger.error("Fallo en el navegador de WhatsApp", error);
    });

    page.on("console", (message) => {
      const entry = `${message.type()} :: ${message.text()}`;
      if (message.type() === "error") {
        logger.error(`WhatsApp (console error): ${entry}`);
        return;
      }

      logger.info(`WhatsApp (console): ${entry}`);
    });
  });

  client.on("remote_session_saved", () => {
    logger.info("Sesión remota de WhatsApp guardada correctamente.");
  });

  /* client.on("message", (message: Message) => {
    void handleIncomingMessage(message);
  }); */

  registerMessageListener(client);

  client
    .initialize()
    .then(() => logger.info("Cliente de WhatsApp inicializado."))
    .catch((error: unknown) => {
      logger.error("No se pudo inicializar el cliente de WhatsApp", error);
    });

  return client;
};

export const getWhatsappClient = (): Client | null => client;
