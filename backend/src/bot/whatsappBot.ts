import path from "node:path";
import qrcode from "qrcode-terminal";
import { Client, LocalAuth, Message } from "whatsapp-web.js";
import env from "../config/env";
import { createBooking, listBookings } from "../services/bookingService";
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
  "- reservar Nombre|Servicio|YYYY-MM-DD|HH:mm|Telefono: Crear un turno rápido.",
].join("\n");

let client: Client | null = null;

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

  if (message.from.endsWith("@g.us")) {
    return;
  }

  const text = message.body.trim();

  if (text.length === 0) {
    return;
  }

  const normalized = text.toLowerCase();

  logger.info(`Mensaje entrante de ${message.from}: ${text}`);

  const greetings = ["hola", "hello", "buenas"];

  if (
    greetings.some((term) => normalized.startsWith(term)) ||
    ["menu", "help", "ayuda"].includes(normalized)
  ) {
    await message.reply(HELP_MESSAGE);
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
    "No entiendo tu mensaje. Escribe *menu* para ver los comandos disponibles."
  );
};

export const startWhatsappBot = (): Client => {
  if (client) {
    return client;
  }

  const sessionPath = resolveSessionPath();
  const puppeteerOptions = {
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    executablePath: env.whatsappBrowserPath,
  };

  client = new Client({
    authStrategy: new LocalAuth({
      dataPath: sessionPath,
    }),
    puppeteer: puppeteerOptions,
  });

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

  client.on("message", (message: Message) => {
    void handleIncomingMessage(message);
  });

  client
    .initialize()
    .then(() => {
      logger.info("Cliente de WhatsApp inicializado.");
    })
    .catch((error: unknown) => {
      logger.error("No se pudo inicializar el cliente de WhatsApp", error);
    });

  return client;
};

export const getWhatsappClient = (): Client | null => client;
