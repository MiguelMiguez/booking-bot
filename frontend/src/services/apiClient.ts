import { getCurrentApiKey } from "./authStorage";

const detectDefaultBaseUrl = (): string => {
  if (import.meta.env.PROD && typeof window !== "undefined") {
    return `${window.location.origin}/api`;
  }

  return "http://localhost:3000/api";
};

const DEFAULT_BASE_URL = detectDefaultBaseUrl();

const trimTrailingSlash = (value: string): string =>
  value.endsWith("/") ? value.slice(0, -1) : value;

export const API_BASE_URL = trimTrailingSlash(
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
    (import.meta.env.REACT_APP_API_BASE_URL as string | undefined) ??
    DEFAULT_BASE_URL
);

const buildUrl = (path: string): string => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface RequestOptions<TBody> {
  method?: HttpMethod;
  body?: TBody;
  signal?: AbortSignal;
  apiKey?: string | null;
  skipAuth?: boolean;
  headers?: Record<string, string>;
}

const parseJson = async (response: Response): Promise<unknown> => {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

export class ApiError extends Error {
  status: number;
  payload: unknown;

  constructor(status: number, message: string, payload: unknown) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

export const request = async <TResponse = unknown, TBody = unknown>(
  path: string,
  options: RequestOptions<TBody> = {}
): Promise<TResponse> => {
  const {
    method = "GET",
    body,
    signal,
    apiKey,
    skipAuth = false,
    headers: customHeaders,
  } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(customHeaders ?? {}),
  };

  const resolvedApiKey = skipAuth ? null : apiKey ?? getCurrentApiKey();

  if (resolvedApiKey) {
    headers["x-api-key"] = resolvedApiKey;
  }

  const requestUrl = new URL(buildUrl(path));

  if (resolvedApiKey) {
    requestUrl.searchParams.set("apiKey", resolvedApiKey);
  }

  const response = await fetch(requestUrl.toString(), {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    signal,
  });

  const data = await parseJson(response);

  if (!response.ok) {
    const message =
      data && typeof data === "object" && "error" in data
        ? String((data as { error: unknown }).error)
        : response.statusText || "Error inesperado";

    let normalizedMessage = message;

    if (response.status === 401) {
      normalizedMessage =
        "Sesión no autorizada. Inicia sesión nuevamente para continuar.";
    } else if (response.status === 403) {
      normalizedMessage = "No tenés permisos para realizar esta acción.";
    }

    throw new ApiError(response.status, normalizedMessage, data);
  }

  return data as TResponse;
};
