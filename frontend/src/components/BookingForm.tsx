import type { ChangeEvent, FormEvent } from "react";
import { useState } from "react";
import type { NewBooking, Service } from "../types";

interface BookingFormProps {
  services: Service[];
  onSubmit: (payload: NewBooking) => Promise<void> | void;
  isSubmitting: boolean;
  error?: string | null;
}

const emptyForm: NewBooking = {
  name: "",
  phone: "",
  service: "",
  date: "",
  time: "",
};

/**
 * Formulario controlado para crear nuevos turnos desde el panel.
 */
export const BookingForm = ({
  services,
  onSubmit,
  isSubmitting,
  error,
}: BookingFormProps) => {
  const [form, setForm] = useState<NewBooking>(emptyForm);

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
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
    setForm(emptyForm);
  };

  return (
    <form className="panel form" onSubmit={handleSubmit}>
      <div className="panel-header">
        <div>
          <h2>Nuevo turno</h2>
          <p className="panel-hint">
            Crea turnos manuales para monitorear la disponibilidad del negocio.
          </p>
        </div>
      </div>

      <div className="grid">
        <label className="field">
          <span>Nombre del cliente</span>
          <input
            name="name"
            type="text"
            required
            value={form.name}
            onChange={handleChange}
            placeholder="Ej: Ana Pérez"
            autoComplete="name"
            disabled={isSubmitting}
          />
        </label>
        <label className="field">
          <span>Teléfono</span>
          <input
            name="phone"
            type="tel"
            required
            value={form.phone}
            onChange={handleChange}
            placeholder="Ej: +5491112345678"
            autoComplete="tel"
            disabled={isSubmitting}
          />
        </label>
      </div>

      <label className="field">
        <span>Servicio</span>
        <select
          name="service"
          required
          value={form.service}
          onChange={handleChange}
          disabled={isSubmitting}
        >
          <option value="" disabled>
            Selecciona un servicio
          </option>
          {services.map((service) => (
            <option key={service.id} value={service.name}>
              {service.name}
              {service.durationMinutes !== undefined
                ? ` · ${service.durationMinutes} min`
                : ""}
            </option>
          ))}
        </select>
      </label>

      <div className="grid">
        <label className="field">
          <span>Día</span>
          <input
            name="date"
            type="date"
            required
            value={form.date}
            onChange={handleChange}
            disabled={isSubmitting}
          />
        </label>
        <label className="field">
          <span>Hora</span>
          <input
            name="time"
            type="time"
            required
            value={form.time}
            onChange={handleChange}
            step="900"
            disabled={isSubmitting}
          />
        </label>
      </div>

      {error && <p className="error">{error}</p>}

      <div className="actions">
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creando..." : "Crear turno"}
        </button>
      </div>
    </form>
  );
};
