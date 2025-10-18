import type { Booking } from "../types";

interface BookingListProps {
  bookings: Booking[];
  isLoading?: boolean;
  emptyMessage?: string;
}

const formatDate = (day: string, hour: string): string => {
  if (!day || !hour) {
    return "Sin horario";
  }
  const isoDate = `${day}T${hour}`;
  const parsed = new Date(isoDate);
  return Number.isNaN(parsed.getTime())
    ? `${day} ${hour}`
    : parsed.toLocaleString();
};

const formatCreatedAt = (value: Booking["createdAt"]): string => {
  const date = value.toDate();
  return date.toLocaleString();
};

/**
 * Lista de turnos existentes, utilizada dentro del panel principal.
 */
export const BookingList = ({
  bookings,
  isLoading = false,
  emptyMessage = "No hay turnos registrados por el momento.",
}: BookingListProps) => {
  if (isLoading && bookings.length === 0) {
    return <p className="empty-state">Cargando turnos...</p>;
  }

  if (bookings.length === 0) {
    return <p className="empty-state">{emptyMessage}</p>;
  }

  return (
    <div className="list">
      {bookings.map((booking) => (
        <div key={booking.id} className="list-item">
          <div className="list-item-header">
            <strong>{booking.name}</strong>
            <span className="badge muted">{booking.service}</span>
          </div>
          <span>{formatDate(booking.day, booking.hour)}</span>
          <span>Contacto: {booking.phone}</span>
          <span className="fine-print">
            Creado: {formatCreatedAt(booking.createdAt)}
          </span>
        </div>
      ))}
    </div>
  );
};
