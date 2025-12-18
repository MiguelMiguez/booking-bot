import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { DataTable, type DataTableColumn } from "../../components/DataTable";
import { ServiceList } from "../../components/ServiceList/ServiceList";
import {
  DashboardHeader,
  type DashboardHeaderStat,
} from "../../components/DashboardHeader/DashboardHeader";
import { DashboardMetrics } from "../../components/DashboardMetrics/DashboardMetrics";
import {
  Modal,
  type FormField,
  type ModalConfig,
} from "../../components/Modal";
import {
  deleteBooking,
  updateBooking,
  fetchBookings,
} from "../../services/bookingService";
import { fetchServices } from "../../services/serviceService";
import type { Booking, Service } from "../../types";
import { useAuth } from "../../hooks/useAuth";
import "./Dashboard.css";

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

const Dashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(true);
  const [isLoadingServices, setIsLoadingServices] = useState(true);
  const [deletingBookingId, setDeletingBookingId] = useState<string | null>(
    null
  );
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [serviceError, setServiceError] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Modal state for editing
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { role } = useAuth();
  const isAdmin = role === "admin";

  const loadBookings = useCallback(async () => {
    setIsLoadingBookings(true);
    setBookingError(null);

    try {
      const items = await fetchBookings();
      setBookings(Array.isArray(items) ? items : []);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No se pudieron obtener los turnos.";
      setBookingError(message);
    } finally {
      setIsLoadingBookings(false);
    }
  }, []);

  const loadServices = useCallback(async () => {
    setIsLoadingServices(true);
    setServiceError(null);

    try {
      const items = await fetchServices();
      setServices(Array.isArray(items) ? items : []);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No se pudieron obtener los servicios.";
      setServiceError(message);
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

  useEffect(() => {
    const state = location.state as { section?: string } | null;
    if (state?.section) {
      const element = document.getElementById(state.section);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate]);

  const handleDeleteBooking = async (id: string): Promise<void> => {
    if (!isAdmin) {
      return;
    }

    setDeletingBookingId(id);
    setNotification(null);
    setBookingError(null);

    try {
      await deleteBooking(id);
      await loadBookings();
      setNotification("Turno eliminado correctamente.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo eliminar el turno.";
      setBookingError(message);
    } finally {
      setDeletingBookingId(null);
    }
  };

  const openEditModal = (booking: Booking) => {
    if (!isAdmin) {
      return;
    }
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

  const handleEditBooking = async (
    values: BookingFormValues
  ): Promise<void> => {
    if (!isAdmin || !selectedBooking) {
      return;
    }

    setIsSubmitting(true);
    setModalError(null);

    try {
      await updateBooking(selectedBooking.id, {
        name: values.name,
        phone: values.phone,
        service: values.service,
        date: values.date,
        time: values.time,
      });
      await loadBookings();
      setNotification("Turno actualizado correctamente.");
      setIsModalOpen(false);
      setSelectedBooking(null);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo actualizar el turno.";
      setModalError(message);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const dashboardStats = useMemo<DashboardHeaderStat[]>(() => {
    const today = new Date();
    const upcoming = bookings.filter((booking) => {
      const dateValue = new Date(`${booking.date}T${booking.time}`);
      return !Number.isNaN(dateValue.getTime()) && dateValue >= today;
    }).length;

    return [
      {
        label: "Total de turnos",
        value: bookings.length,
      },
      {
        label: "Próximos turnos",
        value: upcoming,
      },
      {
        label: "Servicios activos",
        value: services.length,
      },
    ];
  }, [bookings, services.length]);

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
      title: "Editar turno",
      description: "Modifica los datos del turno según sea necesario.",
      submitLabel: "Guardar cambios",
      submitLoadingLabel: "Guardando...",
    }),
    []
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
    <div className="dashboardPage">
      <DashboardHeader
        id="resumen"
        title="Panel de administración"
        subtitle="Gestiona turnos y servicios en tiempo real. Visualiza métricas clave y mantén tu agenda al día."
        stats={dashboardStats}
      />

      {notification ? (
        <p className="dashboardNotification">{notification}</p>
      ) : null}
      {bookingError && !notification ? (
        <p className="dashboardError">{bookingError}</p>
      ) : null}

      <div className="dashboardContentGrid">
        <section className="dashboardBookingTable">
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
            deletingId={deletingBookingId}
            searchPlaceholder="Buscar por fecha, hora o cliente"
          />
        </section>

        <section className="dashboardServiceList" id="servicios">
          <div className="serviceListCard">
            <div className="serviceListHeader">
              <div>
                <h2>Servicios activos</h2>
                <p className="serviceListHint">
                  Consulta los servicios activos y gestioná altas desde la
                  sección Servicios.
                </p>
              </div>
              <span className="serviceListBadge">{services.length}</span>
            </div>
            <ServiceList
              services={services}
              isLoading={isLoadingServices}
              emptyMessage="No hay servicios activos. Administralos desde la sección Servicios."
            />
            {serviceError ? (
              <p className="serviceListError">{serviceError}</p>
            ) : null}
          </div>
        </section>

        <section className="dashboardMetrics" id="metricas">
          <DashboardMetrics
            bookings={bookings}
            services={services}
            isLoading={isLoadingBookings || isLoadingServices}
          />
        </section>
      </div>

      <Modal<BookingFormValues>
        open={isModalOpen}
        config={modalConfig}
        fields={bookingFormFields}
        initialValues={initialModalValues}
        isSubmitting={isSubmitting}
        error={modalError}
        onSubmit={handleEditBooking}
        onClose={closeModal}
      />
    </div>
  );
};

export default Dashboard;
