import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarPlus } from "lucide-react";
import NotificationToast, {
  type NotificationType,
} from "../../components/NotificationToast/NotificationToast";
import { DataTable, type DataTableColumn } from "../../components/DataTable";
import { DashboardMetrics } from "../../components/DashboardMetrics/DashboardMetrics";
import { DashboardHeader } from "../../components/DashboardHeader/DashboardHeader";
import {
  Modal,
  type FormField,
  type ModalConfig,
} from "../../components/Modal";
import { useAuth } from "../../hooks/useAuth";
import {
  createBooking,
  deleteBooking,
  updateBooking,
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

const formatDate = (date: string): string => {
  if (!date) return "—";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString();
};

const formatTime = (time: string): string => {
  if (!time) return "—";
  const [hours, minutes] = time.split(":");
  if (hours === undefined || minutes === undefined) return time;
  const date = new Date();
  date.setHours(Number(hours));
  date.setMinutes(Number(minutes));
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

type BookingFormValues = {
  name: string;
  phone: string;
  service: string;
  date: string;
  time: string;
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
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
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

  const openCreateModal = () => {
    if (!isAdmin) {
      return;
    }
    setModalMode("create");
    setSelectedBooking(null);
    setModalError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (booking: Booking) => {
    if (!isAdmin) {
      return;
    }
    setModalMode("edit");
    setSelectedBooking(booking);
    setModalError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (isSubmitting) {
      return;
    }
    setIsModalOpen(false);
    setSelectedBooking(null);
    setModalError(null);
  };

  const handleSubmitBooking = async (
    values: BookingFormValues
  ): Promise<void> => {
    if (!isAdmin) {
      return;
    }

    setIsSubmitting(true);
    setModalError(null);

    try {
      if (modalMode === "create") {
        const payload: NewBooking = {
          name: values.name,
          phone: values.phone,
          service: values.service,
          date: values.date,
          time: values.time,
        };
        const created = await createBooking(payload);
        setBookings((prev) => sortBookings([...prev, created]));
        notify("Turno creado correctamente.", "success");
      } else if (selectedBooking) {
        const updated = await updateBooking(selectedBooking.id, {
          name: values.name,
          phone: values.phone,
          service: values.service,
          date: values.date,
          time: values.time,
        });
        setBookings((prev) =>
          sortBookings(prev.map((b) => (b.id === updated.id ? updated : b)))
        );
        notify("Turno actualizado correctamente.", "success");
      }
      setIsModalOpen(false);
      setSelectedBooking(null);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudo guardar el turno.";
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

  const tableColumns = useMemo<DataTableColumn<Booking>[]>(
    () => [
      {
        field: "date",
        headerName: "Fecha",
        flex: 1,
        minWidth: 140,
        valueFormatter: (value) => formatDate(value as string),
      },
      {
        field: "time",
        headerName: "Hora",
        minWidth: 120,
        flex: 0.6,
        valueFormatter: (value) => formatTime(value as string),
      },
      {
        field: "name",
        headerName: "Cliente",
        flex: 1,
        minWidth: 160,
      },
      {
        field: "service",
        headerName: "Servicio",
        flex: 1,
        minWidth: 160,
      },
      {
        field: "phone",
        headerName: "Contacto",
        flex: 1,
        minWidth: 160,
      },
    ],
    []
  );

  const bookingFormFields = useMemo<FormField[]>(
    () => [
      {
        name: "name",
        label: "Nombre del cliente",
        type: "text",
        placeholder: "Ej: Ana Pérez",
        required: true,
        autoComplete: "name",
      },
      {
        name: "phone",
        label: "Teléfono",
        type: "tel",
        placeholder: "Ej: +5491112345678",
        required: true,
        autoComplete: "tel",
      },
      {
        name: "service",
        label: "Servicio",
        type: "select",
        required: true,
        placeholder: "Selecciona un servicio",
        gridColumn: "full",
        options: services.map((s) => ({
          value: s.name,
          label: `${s.name}${
            s.durationMinutes ? ` · ${s.durationMinutes} min` : ""
          }`,
        })),
      },
      {
        name: "date",
        label: "Día",
        type: "date",
        required: true,
      },
      {
        name: "time",
        label: "Hora",
        type: "time",
        required: true,
        step: 900,
      },
    ],
    [services]
  );

  const modalConfig = useMemo<ModalConfig>(
    () => ({
      title: modalMode === "create" ? "Agregar turno" : "Editar turno",
      description:
        modalMode === "create"
          ? "Completa los datos del cliente, servicio y horario para registrarlo en el sistema."
          : "Modifica los datos del turno según sea necesario.",
      submitLabel: modalMode === "create" ? "Crear turno" : "Guardar cambios",
      submitLoadingLabel:
        modalMode === "create" ? "Creando..." : "Guardando...",
    }),
    [modalMode]
  );

  const initialModalValues = useMemo<Partial<BookingFormValues> | undefined>(
    () =>
      selectedBooking
        ? {
            name: selectedBooking.name,
            phone: selectedBooking.phone,
            service: selectedBooking.service,
            date: selectedBooking.date,
            time: selectedBooking.time,
          }
        : undefined,
    [selectedBooking]
  );

  return (
    <div className="turnosPage">
      <NotificationToast
        message={toast.message}
        type={toast.type}
        isOpen={toast.isOpen}
        onClose={handleCloseToast}
      />

      <DashboardHeader
        title="Turnos"
        subtitle="Visualiza y gestiona todos los turnos registrados. Podés crear nuevos turnos manuales para mantener tu agenda actualizada."
        showAction={isAdmin}
        action={{
          label: "Agregar turno",
          icon: CalendarPlus,
          onClick: openCreateModal,
          disabled: !isAdmin,
        }}
      />

      {bookingsError ? <p className="turnosError">{bookingsError}</p> : null}
      {servicesError && !bookingsError ? (
        <p className="turnosWarning">{servicesError}</p>
      ) : null}

      <section className="turnosTableSection" aria-live="polite">
        <DataTable
          data={bookings}
          columns={tableColumns}
          header={{
            title: "Turnos registrados",
            subtitle:
              "Controla los turnos programados y filtra por fecha, hora o cliente.",
            badgeCount: bookings.length,
          }}
          actions={
            isAdmin
              ? {
                  onEdit: openEditModal,
                  onDelete: handleDeleteBooking,
                  editLabel: "Editar turno",
                  deleteLabel: "Eliminar turno",
                  deleteConfirmTitle: "Eliminar turno",
                  deleteConfirmDescription: (booking) =>
                    `¿Eliminar el turno de ${booking.name} para el servicio ${booking.service} el ${booking.date} a las ${booking.time}?`,
                }
              : undefined
          }
          isLoading={isLoadingBookings}
          deletingId={deletingId}
          searchPlaceholder="Buscar por fecha, hora o cliente"
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

      <Modal<BookingFormValues>
        open={isModalOpen}
        config={modalConfig}
        fields={bookingFormFields}
        initialValues={initialModalValues}
        isSubmitting={isSubmitting}
        error={modalError}
        onSubmit={handleSubmitBooking}
        onClose={closeModal}
      />
    </div>
  );
};

export default TurnosPage;
