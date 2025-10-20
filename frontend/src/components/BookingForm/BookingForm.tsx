import type { ChangeEvent, FormEvent } from "react";
import { useState } from "react";
import type { NewBooking, Service } from "../../types";
import "./BookingForm.css";

interface BookingFormProps {
  services: Service[];
  onSubmit: (payload: NewBooking) => Promise<void> | void;
  isSubmitting: boolean;
  error?: string | null;
  id?: string;
  className?: string;
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
  id,
  className,
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
    try {
      await onSubmit(form);
      setForm(emptyForm);
    } catch {
      /* el error se maneja en el componente padre */
    }
  };

  return (
    <form
      className={`bookingFormCard${className ? ` ${className}` : ""}`}
      id={id}
      onSubmit={handleSubmit}
    >
      <div className="bookingFormHeader">
        <div>
          <h2>Nuevo turno</h2>
          <p className="bookingFormHint">
            Crea turnos manuales para monitorear la disponibilidad del negocio.
          </p>
        </div>
      </div>

      <div className="bookingFormGrid">
        <label className="bookingFormField">
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
        <label className="bookingFormField">
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

      <label className="bookingFormField">
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

      <div className="bookingFormGrid">
        <label className="bookingFormField">
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
        <label className="bookingFormField">
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

      {error && <p className="bookingFormError">{error}</p>}

      <div className="bookingFormActions">
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creando..." : "Crear turno"}
        </button>
      </div>
    </form>
  );
};
