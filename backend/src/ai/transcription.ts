import OpenAI from "openai";
import { toFile } from "openai/uploads";
import mime from "mime-types";
import type { MessageMedia } from "whatsapp-web.js";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const transcribeAudio = async (media: MessageMedia): Promise<string> => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  if (!media.data) {
    throw new Error("Media payload is empty");
  }

  const buffer = Buffer.from(media.data, "base64");
  const mimeType = media.mimetype ?? "audio/ogg";
  const resolvedExtension = mime.extension(mimeType);
  const extension = typeof resolvedExtension === "string" ? resolvedExtension : "ogg";
  const fileName = `incoming.${extension}`;

  try {
  const file = await toFile(buffer, fileName, { type: mimeType });

    const transcription = await openai.audio.transcriptions.create({
      model: "whisper-1",
      file,
      language: "es",
      temperature: 0.2,
      response_format: "json",
    });

    if (!transcription.text || transcription.text.trim().length === 0) {
      throw new Error("Whisper returned an empty transcription");
    }

    return transcription.text.trim();
  } catch (error) {
    const reason =
      error instanceof Error ? error.message : "unknown Whisper error";
    throw new Error(`Failed to transcribe audio: ${reason}`);
  }
};
