import { v4 as uuid } from "uuid";
import { SessionsClient } from "@google-cloud/dialogflow";

export interface DialogflowIntentResult {
  intent: string;
  confidence: number;
  entities: Record<string, unknown>;
  fulfillmentText?: string;
}

const projectId = process.env.DIALOGFLOW_PROJECT_ID;
const languageCode = process.env.DIALOGFLOW_LANGUAGE_CODE ?? "es";
const sessionsClient = new SessionsClient();
/**
 * Sends text to Dialogflow ES and maps out the intent + entities.
 */
export const getIntentFromDialogflow = async (
  text: string,
  sessionId: string = uuid()
): Promise<DialogflowIntentResult> => {
  if (!projectId) {
    throw new Error("DIALOGFLOW_PROJECT_ID is not configured");
  }

  const request = {
    session: sessionsClient.projectAgentSessionPath(projectId, sessionId),
    queryInput: {
      text: {
        text,
        languageCode,
      },
    },
  };

  const [response] = await sessionsClient.detectIntent(request);
  const queryResult = response.queryResult;

  if (!queryResult) {
    throw new Error("Dialogflow returned an empty queryResult");
  }

  const intentName = queryResult.intent?.displayName ?? "fallback";
  const parameters = queryResult.parameters?.fields ?? {};

  const entities = Object.entries(parameters).reduce<Record<string, unknown>>(
    (acc, [key, value]) => {
      if (!value) {
        return acc;
      }

      if (value.stringValue !== undefined) {
        acc[key] = value.stringValue;
        return acc;
      }

      if (value.numberValue !== undefined) {
        acc[key] = value.numberValue;
        return acc;
      }

      if (value.boolValue !== undefined) {
        acc[key] = value.boolValue;
        return acc;
      }

      if (value.listValue?.values) {
        acc[key] = value.listValue.values
          .map((item) => item?.stringValue ?? null)
          .filter((entry): entry is string => entry !== null);
        return acc;
      }

      if (value.structValue?.fields) {
        acc[key] = value.structValue.fields;
        return acc;
      }

      acc[key] = value;
      return acc;
    },
    {}
  );

  return {
    intent: intentName,
    confidence: queryResult.intentDetectionConfidence ?? 0,
    entities,
    fulfillmentText: queryResult.fulfillmentText ?? undefined,
  };
};
