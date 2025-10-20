import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { request } from "../services/apiClient";
import {
  AUTH_STORAGE_KEY,
  clearAuthSnapshot,
  initializeAuthSnapshot,
  persistAuthSnapshot,
  subscribeToAuth,
  type AuthSnapshot,
} from "../services/authStorage";
import { ApiError } from "../services/apiClient";
import type { UserRole } from "../types";

interface LoginParams {
  apiKey: string;
  role: UserRole;
  rememberMe?: boolean;
}

interface AuthContextValue extends AuthSnapshot {
  isAuthenticated: boolean;
  login: (params: LoginParams) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [authState, setAuthState] = useState<AuthSnapshot>(() =>
    initializeAuthSnapshot()
  );

  useEffect(() => {
    const unsubscribe = subscribeToAuth(setAuthState);
    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key === AUTH_STORAGE_KEY) {
        setAuthState(initializeAuthSnapshot());
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const login = useCallback(
    async ({ apiKey, role, rememberMe = false }: LoginParams) => {
      const trimmedKey = apiKey.trim();

      if (!trimmedKey) {
        throw new Error("Ingresá la clave proporcionada por el administrador.");
      }

      try {
        await request("/services", { apiKey: trimmedKey });

        if (role === "admin") {
          try {
            await request("/bookings", {
              method: "POST",
              apiKey: trimmedKey,
              body: {},
            });
          } catch (adminError) {
            if (adminError instanceof ApiError) {
              if (adminError.status === 400 || adminError.status === 409) {
                // El endpoint es accesible y devuelve un error de validación esperado, por lo tanto la clave es de administrador.
              } else if (adminError.status === 403) {
                throw new Error(
                  "La clave indicada no tiene permisos de administrador."
                );
              } else {
                throw new Error(
                  adminError.message ||
                    "No se pudo verificar la clave de administrador."
                );
              }
            } else {
              throw new Error(
                "No se pudo verificar la clave de administrador."
              );
            }
          }
        }
      } catch (error) {
        if (error instanceof ApiError) {
          throw new Error(
            error.message || "No se pudo verificar la clave de acceso."
          );
        }

        throw new Error("No se pudo verificar la clave de acceso.");
      }

      persistAuthSnapshot(
        { apiKey: trimmedKey, role },
        { remember: rememberMe }
      );
    },
    []
  );

  const logout = useCallback(() => {
    clearAuthSnapshot();
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    return {
      ...authState,
      isAuthenticated: Boolean(authState.apiKey && authState.role),
      login,
      logout,
    };
  }, [authState, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
