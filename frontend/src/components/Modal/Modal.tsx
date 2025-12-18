import { useEffect, useState, type FormEvent, type ChangeEvent } from "react";
import { X } from "lucide-react";
import "./Modal.css";

export type FieldType =
  | "text"
  | "email"
  | "tel"
  | "number"
  | "date"
  | "time"
  | "textarea"
  | "select";

export interface SelectOption {
  value: string;
  label: string;
}

export interface FormField {
  name: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  required?: boolean;
  autoComplete?: string;
  options?: SelectOption[];
  min?: number | string;
  max?: number | string;
  step?: number | string;
  rows?: number;
  gridColumn?: "full" | "half";
}

export interface ModalConfig {
  title: string;
  description?: string;
  submitLabel?: string;
  submitLoadingLabel?: string;
}

interface ModalProps<T extends Record<string, string>> {
  open: boolean;
  config: ModalConfig;
  fields: FormField[];
  initialValues?: Partial<T>;
  isSubmitting?: boolean;
  error?: string | null;
  onSubmit: (values: T) => Promise<void> | void;
  onClose: () => void;
}

const ANIMATION_DURATION = 260;

const buildInitialState = <T extends Record<string, string>>(
  fields: FormField[],
  initialValues?: Partial<T>
): T => {
  const state: Record<string, string> = {};
  for (const field of fields) {
    state[field.name] = initialValues?.[field.name] ?? "";
  }
  return state as T;
};

export const Modal = <T extends Record<string, string>>({
  open,
  config,
  fields,
  initialValues,
  isSubmitting = false,
  error,
  onSubmit,
  onClose,
}: ModalProps<T>) => {
  const [form, setForm] = useState<T>(() =>
    buildInitialState(fields, initialValues)
  );
  const [shouldRender, setShouldRender] = useState(open);
  const [isVisible, setIsVisible] = useState(open);

  useEffect(() => {
    if (open) {
      setShouldRender(true);
      setForm(buildInitialState(fields, initialValues));
      const frame = window.requestAnimationFrame(() => {
        setIsVisible(true);
      });
      return () => window.cancelAnimationFrame(frame);
    }

    if (shouldRender) {
      setIsVisible(false);
      const timer = window.setTimeout(() => {
        setShouldRender(false);
      }, ANIMATION_DURATION);

      return () => window.clearTimeout(timer);
    }

    return undefined;
  }, [open, shouldRender, fields, initialValues]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }

      event.preventDefault();
      if (!isSubmitting) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, isSubmitting, onClose]);

  if (!shouldRender) {
    return null;
  }

  const handleChange = (
    event: ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ): void => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ): Promise<void> => {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }

    try {
      await onSubmit(form);
    } catch {
      /* error handled by parent */
    }
  };

  const renderField = (field: FormField) => {
    const baseProps = {
      name: field.name,
      required: field.required,
      disabled: isSubmitting,
      placeholder: field.placeholder,
      autoComplete: field.autoComplete,
    };

    switch (field.type) {
      case "textarea":
        return (
          <textarea
            {...baseProps}
            value={form[field.name] ?? ""}
            onChange={handleChange}
            rows={field.rows ?? 3}
          />
        );

      case "select":
        return (
          <select
            {...baseProps}
            value={form[field.name] ?? ""}
            onChange={handleChange}
          >
            <option value="" disabled>
              {field.placeholder ?? "Selecciona una opción"}
            </option>
            {field.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );

      default:
        return (
          <input
            {...baseProps}
            type={field.type}
            value={form[field.name] ?? ""}
            onChange={handleChange}
            min={field.min}
            max={field.max}
            step={field.step}
          />
        );
    }
  };

  return (
    <div
      className={`modalOverlay ${isVisible ? "is-visible" : "is-hidden"}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby={config.description ? "modal-description" : undefined}
    >
      <div className={`modalCard ${isVisible ? "is-visible" : "is-hidden"}`}>
        <header className="modalHeader">
          <div>
            <h2 id="modal-title">{config.title}</h2>
            {config.description && (
              <p id="modal-description">{config.description}</p>
            )}
          </div>
          <button
            type="button"
            className="modalClose"
            onClick={onClose}
            aria-label="Cerrar"
            disabled={isSubmitting}
          >
            <X size={20} />
          </button>
        </header>

        <form className="modalForm" onSubmit={handleSubmit}>
          <div className="modalFormGrid">
            {fields.map((field) => (
              <label
                key={field.name}
                className={`modalFormField ${
                  field.gridColumn === "full" ? "is-full" : ""
                }`}
              >
                <span>{field.label}</span>
                {renderField(field)}
              </label>
            ))}
          </div>

          {error && <p className="modalFormError">{error}</p>}

          <div className="modalFormActions">
            <button
              type="button"
              className="modalCancelBtn"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="modalSubmitBtn"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? config.submitLoadingLabel ?? "Guardando..."
                : config.submitLabel ?? "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
