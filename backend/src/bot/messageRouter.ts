import type { Client, Message } from "whatsapp-web.js";
import { transcribeAudio } from "../ai/transcription";
import { getIntentFromDialogflow } from "../ai/dialogflow";
import { handleIntent } from "./intentHandlers";
import { logger } from "../utils/logger";

const shouldIgnoreMessage = (message: Message): boolean => {
  if (message.fromMe) return true;
  if (message.from === "status@broadcast") return true;
  if (message.from.endsWith("@g.us")) return true;
  return false;
};

const extractTextPayload = async (message: Message): Promise<string | null> => {
  if (message.hasMedia && message.type === "ptt") {
    const media = await message.downloadMedia();
    if (!media) {
      throw new Error("No se pudo descargar el audio");
    }
    return transcribeAudio(media);
  }

  const body = message.body.trim();
  return body.length > 0 ? body : null;
};

export const registerMessageListener = (client: Client): void => {
  client.on("message", async (message: Message) => {
    if (shouldIgnoreMessage(message)) {
      return;
    }

    try {
      const text = await extractTextPayload(message);
      if (!text) {
        logger.info("Mensaje sin texto/transcripción, se ignora");
        return;
      }

      logger.info(`Mensaje normalizado (${message.from}): ${text}`);

      const intent = await getIntentFromDialogflow(text, message.from);

      if (intent.confidence < 0.3) {
        await message.reply(
          "No estoy seguro de haber entendido. ¿Podés darme más detalles?"
        );
        return;
      }

      await handleIntent(message, intent);
    } catch (error) {
      const reason =
        error instanceof Error ? error.message : "error desconocido";
      logger.error(`Fallo al procesar mensaje (${message.id.id}): ${reason}`);
      await message.reply(
        "Tu mensaje no se pudo procesar en este momento. Intentá nuevamente más tarde."
      );
    }
  });
};
