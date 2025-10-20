import { useCallback, useEffect, useMemo, useState } from "react";
import { BookingTable } from "../../components/BookingTable/BookingTable";
import { ServiceList } from "../../components/ServiceList/ServiceList";
import {
  DashboardHeader,
  type DashboardHeaderStat,
} from "../../components/DashboardHeader/DashboardHeader";
import { DashboardMetrics } from "../../components/DashboardMetrics/DashboardMetrics";
import { deleteBooking, fetchBookings } from "../../services/bookingService";
import { fetchServices } from "../../services/serviceService";
import type { Booking, Service } from "../../types";
import "./Dashboard.css";

const Dashboard = () => {
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

  const handleDeleteBooking = async (id: string): Promise<void> => {
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
          <BookingTable
            bookings={bookings}
            isLoading={isLoadingBookings}
            onDelete={handleDeleteBooking}
            deletingId={deletingBookingId}
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
    </div>
  );
};

export default Dashboard;
