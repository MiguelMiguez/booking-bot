const detectDefaultBaseUrl = (): string => {
  if (import.meta.env.PROD && typeof window !== "undefined") {
    return `${window.location.origin}/api`;
  }

  return "http://localhost:3000/api";
};

const DEFAULT_BASE_URL = detectDefaultBaseUrl();

const trimTrailingSlash = (value: string): string =>
  value.endsWith("/") ? value.slice(0, -1) : value;

const API_BASE_URL = trimTrailingSlash(
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
    (import.meta.env.REACT_APP_API_BASE_URL as string | undefined) ??
    DEFAULT_BASE_URL
);

const buildUrl = (path: string): string => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};

type HttpMethod = "GET" | "POST" | "DELETE";

interface RequestOptions<TBody> {
  method?: HttpMethod;
  body?: TBody;
  signal?: AbortSignal;
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

export const request = async <TResponse = unknown, TBody = unknown>(
  path: string,
  options: RequestOptions<TBody> = {}
): Promise<TResponse> => {
  const { method = "GET", body, signal } = options;

  const response = await fetch(buildUrl(path), {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
    signal,
  });

  const data = await parseJson(response);

  if (!response.ok) {
    const message =
      data && typeof data === "object" && "error" in data
        ? String((data as { error: unknown }).error)
        : response.statusText || "Error inesperado";
    throw new Error(message);
  }

  return data as TResponse;
};
