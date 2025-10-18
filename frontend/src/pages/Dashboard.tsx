import type { ChangeEvent, FormEvent } from "react";
import { useEffect, useState } from "react";
import { BookingForm } from "../components/BookingForm";
import { BookingList } from "../components/BookingList";
import { ServiceList } from "../components/ServiceList";
import { createBooking, subscribeToBookings } from "../services/bookingService";
import { createService, subscribeToServices } from "../services/serviceService";
import type { Booking, NewBooking, NewService, Service } from "../types";

interface ServiceFormState {
  name: string;
  duration: string;
  price: string;
}

const emptyServiceForm: ServiceFormState = {
  name: "",
  duration: "",
  price: "",
};

/**
 * Panel principal que reúne listados y formularios para administrar turnos y servicios.
 */
const Dashboard = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(true);
  const [isLoadingServices, setIsLoadingServices] = useState(true);
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
  const [isSubmittingService, setIsSubmittingService] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [serviceError, setServiceError] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [serviceForm, setServiceForm] =
    useState<ServiceFormState>(emptyServiceForm);

  useEffect(() => {
    const unsubscribe = subscribeToBookings(
      (items) => {
        setBookings(items);
        setIsLoadingBookings(false);
      },
      (error) => {
        setBookingError(error.message);
        setIsLoadingBookings(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToServices(
      (items) => {
        setServices(items);
        setIsLoadingServices(false);
      },
      (error) => {
        setServiceError(error.message);
        setIsLoadingServices(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  const handleCreateBooking = async (payload: NewBooking): Promise<void> => {
    setIsSubmittingBooking(true);
    setBookingError(null);
    setNotification(null);

    try {
      await createBooking(payload);
      setNotification("Turno creado correctamente.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo crear el turno. Intenta nuevamente.";
      setBookingError(message);
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  const handleServiceFormChange = (
    event: ChangeEvent<HTMLInputElement>
  ): void => {
    const { name, value } = event.target;
    setServiceForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateService = async (
    event: FormEvent<HTMLFormElement>
  ): Promise<void> => {
    event.preventDefault();
    setIsSubmittingService(true);
    setServiceError(null);
    setNotification(null);

    const payload: NewService = {
      name: serviceForm.name.trim(),
      duration: Number(serviceForm.duration),
      price:
        serviceForm.price.trim().length > 0
          ? Number(serviceForm.price)
          : undefined,
    };

    if (!payload.name || Number.isNaN(payload.duration)) {
      setServiceError("Completa el nombre y una duración válida en minutos.");
      setIsSubmittingService(false);
      return;
    }

    try {
      await createService(payload);
      setServiceForm(emptyServiceForm);
      setNotification("Servicio creado correctamente.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo crear el servicio.";
      setServiceError(message);
    } finally {
      setIsSubmittingService(false);
    }
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Panel de administración</h1>
        <p>
          Gestiona turnos y servicios en tiempo real. Ideal para probar flujos
          del bot de WhatsApp y validar reglas del negocio.
        </p>
        {notification && <p className="status">{notification}</p>}
      </header>

      <section className="dashboard-grid">
        <BookingForm
          services={services}
          onSubmit={handleCreateBooking}
          isSubmitting={isSubmittingBooking}
          error={bookingError}
        />

        <form className="panel form" onSubmit={handleCreateService}>
          <div className="panel-header">
            <div>
              <h2>Nuevo servicio</h2>
              <p className="panel-hint">
                Los servicios aparecen como opciones en formularios y bots.
              </p>
            </div>
          </div>

          <label className="field">
            <span>Nombre</span>
            <input
              name="name"
              type="text"
              required
              value={serviceForm.name}
              onChange={handleServiceFormChange}
              placeholder="Ej: Corte clásico"
              disabled={isSubmittingService}
            />
          </label>

          <div className="grid">
            <label className="field">
              <span>Duración (min)</span>
              <input
                name="duration"
                type="number"
                min="1"
                required
                value={serviceForm.duration}
                onChange={handleServiceFormChange}
                disabled={isSubmittingService}
              />
            </label>
            <label className="field">
              <span>Precio (opcional)</span>
              <input
                name="price"
                type="number"
                min="0"
                step="0.01"
                value={serviceForm.price}
                onChange={handleServiceFormChange}
                disabled={isSubmittingService}
              />
            </label>
          </div>

          {serviceError && <p className="error">{serviceError}</p>}

          <div className="actions">
            <button type="submit" disabled={isSubmittingService}>
              {isSubmittingService ? "Guardando..." : "Crear servicio"}
            </button>
          </div>
        </form>
      </section>

      <section className="dashboard-grid">
        <article className="panel">
          <div className="panel-header">
            <div>
              <h2>Turnos registrados</h2>
              <p className="panel-hint">
                Vista general de los turnos reservados por clientes o
                asistentes.
              </p>
            </div>
            <span className="badge">{bookings.length}</span>
          </div>
          <BookingList
            bookings={bookings}
            isLoading={isLoadingBookings}
            emptyMessage="Aún no hay turnos. Crea uno con el formulario."
          />
        </article>

        <article className="panel">
          <div className="panel-header">
            <div>
              <h2>Servicios activos</h2>
              <p className="panel-hint">
                Configura aquí la oferta disponible para el bot y el equipo.
              </p>
            </div>
            <span className="badge">{services.length}</span>
          </div>
          <ServiceList
            services={services}
            isLoading={isLoadingServices}
            emptyMessage="Agrega servicios para comenzar a ofrecer turnos."
          />
        </article>
      </section>
    </div>
  );
};

export default Dashboard;
