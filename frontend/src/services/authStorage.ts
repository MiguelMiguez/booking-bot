import type { UserRole } from "../types";

export interface AuthSnapshot {
  apiKey: string | null;
  role: UserRole | null;
}

const STORAGE_KEY = "bookingBot.auth";

let snapshot: AuthSnapshot = { apiKey: null, role: null };
const subscribers = new Set<(value: AuthSnapshot) => void>();

const safeGetItem = (
  storage: Storage | undefined,
  key: string
): string | null => {
  if (!storage) {
    return null;
  }

  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
};

const safeSetItem = (
  storage: Storage | undefined,
  key: string,
  value: string
): void => {
  if (!storage) {
    return;
  }

  try {
    storage.setItem(key, value);
  } catch {
    /* ignore quota or unavailable storage */
  }
};

const safeRemoveItem = (storage: Storage | undefined, key: string): void => {
  if (!storage) {
    return;
  }

  try {
    storage.removeItem(key);
  } catch {
    /* ignore */
  }
};

const parseStoredValue = (raw: string | null): AuthSnapshot => {
  if (!raw) {
    return { apiKey: null, role: null };
  }

  try {
    const parsed = JSON.parse(raw) as {
      apiKey?: string;
      role?: UserRole;
    };

    if (parsed.apiKey && parsed.role) {
      return { apiKey: parsed.apiKey, role: parsed.role };
    }
  } catch {
    /* ignore malformed values */
  }

  return { apiKey: null, role: null };
};

const readFromStorage = (): AuthSnapshot => {
  if (typeof window === "undefined") {
    return snapshot;
  }

  const sessionValue = parseStoredValue(
    safeGetItem(window.sessionStorage, STORAGE_KEY)
  );
  if (sessionValue.apiKey && sessionValue.role) {
    return sessionValue;
  }

  const localValue = parseStoredValue(
    safeGetItem(window.localStorage, STORAGE_KEY)
  );
  return localValue;
};

const writeToStorage = (value: AuthSnapshot, remember: boolean): void => {
  if (typeof window === "undefined") {
    return;
  }

  safeRemoveItem(window.sessionStorage, STORAGE_KEY);
  safeRemoveItem(window.localStorage, STORAGE_KEY);

  if (!value.apiKey || !value.role) {
    return;
  }

  const payload = JSON.stringify({
    apiKey: value.apiKey,
    role: value.role,
  });

  if (remember) {
    safeSetItem(window.localStorage, STORAGE_KEY, payload);
  } else {
    safeSetItem(window.sessionStorage, STORAGE_KEY, payload);
  }
};

const notify = () => {
  subscribers.forEach((listener) => listener({ ...snapshot }));
};

export const initializeAuthSnapshot = (): AuthSnapshot => {
  snapshot = readFromStorage();
  return { ...snapshot };
};

export const getAuthSnapshot = (): AuthSnapshot => ({ ...snapshot });

export const getCurrentApiKey = (): string | null => snapshot.apiKey;

export const persistAuthSnapshot = (
  value: AuthSnapshot,
  options: { remember: boolean }
): void => {
  snapshot = { ...value };
  writeToStorage(snapshot, options.remember);
  notify();
};

export const clearAuthSnapshot = (): void => {
  snapshot = { apiKey: null, role: null };
  writeToStorage(snapshot, false);
  notify();
};

export const subscribeToAuth = (
  listener: (value: AuthSnapshot) => void
): (() => void) => {
  subscribers.add(listener);
  return () => {
    subscribers.delete(listener);
  };
};

export const AUTH_STORAGE_KEY = STORAGE_KEY;
