import { useCallback, useEffect, useMemo, useState } from "react";
import NotificationToast, {
  type NotificationType,
} from "../../components/NotificationToast/NotificationToast";
import { BookingTable } from "../../components/BookingTable/BookingTable";
import { DashboardMetrics } from "../../components/DashboardMetrics/DashboardMetrics";
import { BookingModal } from "../../components/BookingModal/BookingModal";
import { useAuth } from "../../hooks/useAuth";
import {
  createBooking,
  deleteBooking,
  fetchBookings,
} from "../../services/bookingService";
import { fetchServices } from "../../services/serviceService";
import type { Booking, NewBooking, Service } from "../../types";
import "./Turnos.css";

const normalizeDate = (booking: Booking): number => {
  const dateTime = new Date(`${booking.date}T${booking.time}`);
  if (!Number.isNaN(dateTime.getTime())) {
    return dateTime.getTime();
  }

  const created = booking.createdAt ? new Date(booking.createdAt) : null;
  if (created && !Number.isNaN(created.getTime())) {
    return created.getTime();
  }

  return 0;
};

const sortBookings = (items: Booking[]): Booking[] => {
  return [...items].sort((a, b) => normalizeDate(b) - normalizeDate(a));
};

const TurnosPage = () => {
  const { role } = useAuth();
  const isAdmin = role === "admin";

  const [toast, setToast] = useState<{
    message: string;
    type: NotificationType;
    isOpen: boolean;
  }>({
    message: "",
    type: "info",
    isOpen: false,
  });

  const notify = useCallback(
    (message: string, type: NotificationType = "info") => {
      setToast({ message, type, isOpen: true });
    },
    []
  );

  const handleCloseToast = useCallback(() => {
    setToast((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(true);
  const [isLoadingServices, setIsLoadingServices] = useState(true);
  const [bookingsError, setBookingsError] = useState<string | null>(null);
  const [servicesError, setServicesError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadBookings = useCallback(async () => {
    setIsLoadingBookings(true);
    setBookingsError(null);

    try {
      const data = await fetchBookings();
      setBookings(sortBookings(Array.isArray(data) ? data : []));
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No se pudieron obtener los turnos.";
      setBookingsError(message);
      notify(message, "error");
    } finally {
      setIsLoadingBookings(false);
    }
  }, [notify]);

  const loadServices = useCallback(async () => {
    setIsLoadingServices(true);
    setServicesError(null);

    try {
      const data = await fetchServices();
      setServices(Array.isArray(data) ? data : []);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No se pudieron obtener los servicios.";
      setServicesError(message);
    } finally {
      setIsLoadingServices(false);
    }
  }, []);

  useEffect(() => {
    void loadBookings();
  }, [loadBookings]);

  useEffect(() => {
    void loadServices();
  }, [loadServices]);

  const openModal = () => {
    if (!isAdmin) {
      return;
    }
    setModalError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (isSubmitting) {
      return;
    }
    setIsModalOpen(false);
    setModalError(null);
  };

  const handleCreateBooking = async (payload: NewBooking): Promise<void> => {
    if (!isAdmin) {
      return;
    }

    setIsSubmitting(true);
    setModalError(null);

    try {
      const created = await createBooking(payload);
      setBookings((prev) => sortBookings([...prev, created]));
      notify("Turno creado correctamente.", "success");
      setIsModalOpen(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudo crear el turno.";
      setModalError(message);
      notify(message, "error");
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBooking = useCallback(
    async (id: string): Promise<void> => {
      if (!isAdmin) {
        return;
      }

      setDeletingId(id);

      try {
        await deleteBooking(id);
        setBookings((prev) => prev.filter((item) => item.id !== id));
        notify("Turno eliminado correctamente.", "success");
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "No se pudo eliminar el turno.";
        notify(message, "error");
        throw error;
      } finally {
        setDeletingId(null);
      }
    },
    [isAdmin, notify]
  );

  const metricsLoading = useMemo(
    () => isLoadingBookings || isLoadingServices,
    [isLoadingBookings, isLoadingServices]
  );

  return (
    <div className="turnosPage">
      <NotificationToast
        message={toast.message}
        type={toast.type}
        isOpen={toast.isOpen}
        onClose={handleCloseToast}
      />

      <header className="turnosHeader">
        <div>
          <h1>Turnos</h1>
          <p>
            Visualiza y gestiona todos los turnos registrados. Podés crear
            nuevos turnos manuales para mantener tu agenda actualizada.
          </p>
        </div>
        <button
          type="button"
          className="turnosHeaderButton"
          onClick={openModal}
          disabled={!isAdmin}
        >
          Agregar turno
        </button>
      </header>

      {bookingsError ? <p className="turnosError">{bookingsError}</p> : null}
      {servicesError && !bookingsError ? (
        <p className="turnosWarning">{servicesError}</p>
      ) : null}

      <section className="turnosTableSection" aria-live="polite">
        <BookingTable
          bookings={bookings}
          isLoading={isLoadingBookings}
          onDelete={isAdmin ? handleDeleteBooking : undefined}
          deletingId={deletingId}
        />
      </section>

      <section className="turnosMetrics">
        <h2 className="turnosMetricsTitle">Métricas de turnos</h2>
        <DashboardMetrics
          bookings={bookings}
          services={services}
          isLoading={metricsLoading}
        />
      </section>

      <BookingModal
        open={isModalOpen}
        services={services}
        isSubmitting={isSubmitting}
        error={modalError}
        onSubmit={handleCreateBooking}
        onClose={closeModal}
      />
    </div>
  );
};

export default TurnosPage;
