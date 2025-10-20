import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useAuth } from "../../hooks/useAuth";
import type { UserRole } from "../../types";
import EyeIcon from "../../assets/icons/eye.svg";
import EyeOffIcon from "../../assets/icons/eye-off.svg";
import "./Login.css";

interface FormState {
  apiKey: string;
  role: UserRole;
  rememberMe: boolean;
}

const ROLE_OPTIONS: Array<{ value: UserRole; label: string; helper: string }> =
  [
    {
      value: "admin",
      label: "Administrador",
      helper: "Puede crear y eliminar turnos y servicios.",
    },
    {
      value: "user",
      label: "Operador",
      helper: "Solo puede consultar listados y métricas.",
    },
  ];

const initialForm: FormState = {
  apiKey: "",
  role: "admin",
  rememberMe: false,
};

const Login = () => {
  const { login } = useAuth();
  const [form, setForm] = useState<FormState>(initialForm);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const target = event.target;
    const { name, value } = target;

    setForm((prev) => ({
      ...prev,
      [name]:
        target instanceof HTMLInputElement && target.type === "checkbox"
          ? target.checked
          : value,
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await login({
        apiKey: form.apiKey,
        role: form.role,
        rememberMe: form.rememberMe,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error inesperado";
      setError(message);
    } finally {
      if (isMounted.current) {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="loginLayout">
      <div className="loginCard">
        <header className="loginHeader">
          <span className="loginBrandMark" aria-hidden="true">
            BB
          </span>
          <div>
            <h1>Booking Bot</h1>
            <p>Accede al panel con tu clave de API asignada.</p>
          </div>
        </header>

        <form className="loginForm" onSubmit={handleSubmit}>
          <label className="loginField">
            <span>Rol</span>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              disabled={isSubmitting}
            >
              {ROLE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <small className="loginHelper">
              {
                ROLE_OPTIONS.find((option) => option.value === form.role)
                  ?.helper
              }
            </small>
          </label>

          <label className="loginField">
            <span>Clave de API</span>
            <div className="loginPasswordWrapper">
              <input
                name="apiKey"
                type={showApiKey ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Ingresa la clave suministrada"
                value={form.apiKey}
                onChange={handleChange}
                disabled={isSubmitting}
                required
              />
              <button
                type="button"
                className="loginToggleVisibility"
                onClick={() => setShowApiKey((prev) => !prev)}
                aria-label={showApiKey ? "Ocultar clave" : "Mostrar clave"}
                aria-pressed={showApiKey}
                disabled={isSubmitting}
              >
                <img
                  src={showApiKey ? EyeOffIcon : EyeIcon}
                  alt=""
                  aria-hidden="true"
                />
              </button>
            </div>
          </label>

          <label className="loginCheckbox">
            <input
              type="checkbox"
              name="rememberMe"
              checked={form.rememberMe}
              onChange={handleChange}
              disabled={isSubmitting}
            />
            <span>Mantener sesión iniciada en este dispositivo</span>
          </label>

          {error ? <p className="loginError">{error}</p> : null}

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Verificando..." : "Iniciar sesión"}
          </button>
        </form>

        <footer className="loginFooter">
          <p>
            ¿No tenés una clave? Solicitala al administrador de tu equipo para
            habilitar tu perfil.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Login;
