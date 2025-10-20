import { useEffect, useState, type FormEvent, type ChangeEvent } from "react";
import CloseIcon from "../../assets/icons/close.svg";
import type { Service } from "../../types";
import "./ServiceEditorModal.css";

export interface ServiceFormValues {
  name: string;
  description: string;
  durationMinutes: string;
  price: string;
}

interface ServiceEditorModalProps {
  open: boolean;
  mode: "create" | "edit";
  initialService?: Service | null;
  isSubmitting?: boolean;
  error?: string | null;
  onSubmit: (values: ServiceFormValues) => Promise<void> | void;
  onClose: () => void;
}

const emptyForm: ServiceFormValues = {
  name: "",
  description: "",
  durationMinutes: "",
  price: "",
};

export const ServiceEditorModal = ({
  open,
  mode,
  initialService,
  isSubmitting = false,
  error,
  onSubmit,
  onClose,
}: ServiceEditorModalProps) => {
  const [form, setForm] = useState<ServiceFormValues>(emptyForm);

  useEffect(() => {
    if (!open) {
      setForm(emptyForm);
      return;
    }

    if (initialService) {
      setForm({
        name: initialService.name,
        description: initialService.description ?? "",
        durationMinutes:
          initialService.durationMinutes !== undefined
            ? String(initialService.durationMinutes)
            : "",
        price:
          initialService.price !== undefined
            ? String(initialService.price)
            : "",
      });
    } else {
      setForm(emptyForm);
    }
  }, [open, initialService]);

  if (!open) {
    return null;
  }

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
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

    await onSubmit(form);
  };

  const title = mode === "create" ? "Agregar servicio" : "Editar servicio";
  const actionLabel = mode === "create" ? "Crear" : "Guardar";

  return (
    <div className="serviceEditorOverlay" role="dialog" aria-modal="true">
      <div className="serviceEditorCard">
        <header className="serviceEditorHeader">
          <div>
            <h2>{title}</h2>
            <p>
              Define los detalles del servicio, incluyendo duración estimada y
              precio de referencia.
            </p>
          </div>
          <button
            type="button"
            className="serviceEditorClose"
            onClick={onClose}
            aria-label="Cerrar"
            disabled={isSubmitting}
          >
            <img
              className="closeButton"
              src={CloseIcon}
              alt=""
              aria-hidden="true"
            />
          </button>
        </header>

        <form className="serviceEditorForm" onSubmit={handleSubmit}>
          <label className="serviceEditorField">
            <span>Nombre</span>
            <input
              name="name"
              type="text"
              placeholder="Ej: Corte de cabello"
              value={form.name}
              onChange={handleChange}
              required
              disabled={isSubmitting}
            />
          </label>

          <label className="serviceEditorField">
            <span>Descripción</span>
            <textarea
              name="description"
              placeholder="Describe brevemente el servicio"
              value={form.description}
              onChange={handleChange}
              rows={3}
              disabled={isSubmitting}
            />
          </label>

          <div className="serviceEditorGrid">
            <label className="serviceEditorField">
              <span>Duración (minutos)</span>
              <input
                name="durationMinutes"
                type="number"
                min={1}
                step={1}
                placeholder="Ej: 60"
                value={form.durationMinutes}
                onChange={handleChange}
                disabled={isSubmitting}
              />
            </label>

            <label className="serviceEditorField">
              <span>Precio</span>
              <input
                name="price"
                type="number"
                min={0}
                step={1}
                placeholder="Ej: 1500"
                value={form.price}
                onChange={handleChange}
                disabled={isSubmitting}
              />
            </label>
          </div>

          {error ? <p className="serviceEditorError">{error}</p> : null}

          <div className="serviceEditorActions">
            <button
              type="button"
              className="serviceEditorCancel"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : actionLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
