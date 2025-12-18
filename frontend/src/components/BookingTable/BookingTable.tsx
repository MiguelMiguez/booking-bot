import { useCallback, useMemo } from "react";
import {
  DataGrid,
  GridToolbarQuickFilter,
  type GridColDef,
  type GridRenderCellParams,
} from "@mui/x-data-grid";
import { ConfirmDialog } from "../ConfirmDialog";
import { useConfirmDialog } from "../../hooks/useConfirmDialog";
import type { Booking } from "../../types";
import "./BookingTable.css";

interface BookingTableProps {
  bookings: Booking[];
  isLoading?: boolean;
  onDelete?: (id: string) => Promise<void>;
  deletingId?: string | null;
}

const formatDate = (date: string): string => {
  if (!date) {
    return "—";
  }
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return date;
  }
  return parsed.toLocaleDateString();
};

const formatTime = (time: string): string => {
  if (!time) {
    return "—";
  }
  const [hours, minutes] = time.split(":");
  if (hours === undefined || minutes === undefined) {
    return time;
  }
  const date = new Date();
  date.setHours(Number(hours));
  date.setMinutes(Number(minutes));
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const Toolbar = () => (
  <div className="bookingTableToolbar">
    <GridToolbarQuickFilter placeholder="Buscar por fecha, hora o cliente" />
  </div>
);

export const BookingTable = ({
  bookings,
  isLoading = false,
  onDelete,
  deletingId = null,
}: BookingTableProps) => {
  const confirmDelete = useConfirmDialog<Booking>({
    defaultTitle: "Eliminar turno",
    defaultConfirmLabel: "Eliminar",
    defaultCancelLabel: "Cancelar",
    defaultTone: "danger",
  });

  const handleRequestDelete = useCallback(
    (id: string) => {
      const booking = bookings.find((item) => item.id === id);
      if (!booking) {
        return;
      }

      confirmDelete.open({
        description: `¿Eliminar el turno de ${booking.name} para el servicio ${booking.service} el ${booking.date} a las ${booking.time}?`,
        data: booking,
      });
    },
    [bookings, confirmDelete]
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!confirmDelete.data || !onDelete) {
      return;
    }

    const bookingToDelete = confirmDelete.data;
    confirmDelete.setBusy(true);

    try {
      await onDelete(bookingToDelete.id);
      confirmDelete.reset();
    } catch {
      confirmDelete.setBusy(false);
    }
  }, [confirmDelete, onDelete]);

  const rows = useMemo(
    () =>
      bookings.map((booking) => ({
        id: booking.id,
        date: booking.date,
        time: booking.time,
        dateLabel: formatDate(booking.date),
        timeLabel: formatTime(booking.time),
        name: booking.name,
        service: booking.service,
        phone: booking.phone,
      })),
    [bookings]
  );

  const columns = useMemo<GridColDef[]>(
    () => [
      {
        field: "dateLabel",
        headerName: "Fecha",
        flex: 1,
        minWidth: 140,
        sortable: true,
        filterable: true,
      },
      {
        field: "timeLabel",
        headerName: "Hora",
        minWidth: 120,
        flex: 0.6,
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
      {
        field: "actions",
        headerName: "",
        sortable: false,
        filterable: false,
        minWidth: 140,
        renderCell: (params: GridRenderCellParams) =>
          onDelete ? (
            <button
              type="button"
              className="bookingTableDelete"
              onClick={() => handleRequestDelete(params.row.id as string)}
              disabled={deletingId === (params.row.id as string)}
            >
              {deletingId === (params.row.id as string)
                ? "Eliminando..."
                : "Eliminar"}
            </button>
          ) : null,
      },
    ],
    [deletingId, onDelete, handleRequestDelete]
  );

  return (
    <div className="bookingTableCard">
      <header className="bookingTableHeader" id="turnos">
        <div>
          <h2>Turnos registrados</h2>
          <p className="bookingTableHint">
            Controla los turnos programados y filtra por fecha, hora o cliente.
          </p>
        </div>
        <span className="bookingTableBadge">{bookings.length}</span>
      </header>

      <div className="bookingTableGridWrapper">
        <DataGrid
          autoHeight
          rows={rows}
          columns={columns}
          loading={isLoading}
          disableRowSelectionOnClick
          pageSizeOptions={[5, 10, 20]}
          initialState={{
            pagination: { paginationModel: { pageSize: 5, page: 0 } },
          }}
          slots={{ toolbar: Toolbar }}
          slotProps={{
            toolbar: {
              showQuickFilter: true,
            },
          }}
          sx={{
            border: "none",
            "& .MuiDataGrid-columnHeaders": {
              backgroundColor: "#f1f5f9",
              borderRadius: "12px 12px 0 0",
            },
            "& .MuiDataGrid-cell": {
              borderBottom: "1px solid #e2e8f0",
            },
          }}
        />
      </div>

      <ConfirmDialog
        {...confirmDelete.dialogProps}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};
