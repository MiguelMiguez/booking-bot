import type { Booking } from "../types";

interface BookingListProps {
  bookings: Booking[];
  isLoading?: boolean;
  emptyMessage?: string;
  onDelete?: (id: string) => void;
  deletingId?: string | null;
}

const formatDate = (date: string, time: string): string => {
  if (!date || !time) {
    return "Sin horario";
  }
  const isoDate = `${date}T${time}`;
  const parsed = new Date(isoDate);
  return Number.isNaN(parsed.getTime())
    ? `${date} ${time}`
    : parsed.toLocaleString();
};

const formatCreatedAt = (createdAt: string): string => {
  const parsed = new Date(createdAt);
  return Number.isNaN(parsed.getTime()) ? createdAt : parsed.toLocaleString();
};

export const BookingList = ({
  bookings,
  isLoading = false,
  emptyMessage = "No hay turnos registrados por el momento.",
  onDelete,
  deletingId = null,
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
            <div className="list-item-actions">
              <span className="badge muted">{booking.service}</span>
              {onDelete && (
                <button
                  type="button"
                  className="secondary"
                  onClick={() => onDelete(booking.id)}
                  disabled={deletingId === booking.id}
                >
                  {deletingId === booking.id ? "Eliminando..." : "Eliminar"}
                </button>
              )}
            </div>
          </div>
          <span>{formatDate(booking.date, booking.time)}</span>
          <span>Contacto: {booking.phone}</span>
          <span className="fine-print">
            Creado: {formatCreatedAt(booking.createdAt)}
          </span>
        </div>
      ))}
    </div>
  );
};
