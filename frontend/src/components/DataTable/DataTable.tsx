import { useCallback, useMemo } from "react";
import {
  DataGrid,
  GridToolbarQuickFilter,
  type GridColDef,
  type GridRenderCellParams,
} from "@mui/x-data-grid";
import { Pencil, Trash2 } from "lucide-react";
import { ConfirmDialog } from "../ConfirmDialog";
import { useConfirmDialog } from "../../hooks/useConfirmDialog";
import "./DataTable.css";

export interface DataTableColumn<T = Record<string, unknown>> {
  field: string;
  headerName: string;
  flex?: number;
  minWidth?: number;
  sortable?: boolean;
  filterable?: boolean;
  renderCell?: (params: GridRenderCellParams) => React.ReactNode;
  valueFormatter?: (value: T[keyof T]) => string;
}

export interface DataTableHeaderConfig {
  title: string;
  subtitle?: string;
  badgeCount?: number;
}

export interface DataTableActions<T> {
  onEdit?: (item: T) => void;
  onDelete?: (id: string) => Promise<void>;
  editLabel?: string;
  deleteLabel?: string;
  deleteConfirmTitle?: string;
  deleteConfirmDescription?: (item: T) => string;
}

interface DataTableProps<T extends { id: string }> {
  data: T[];
  columns: DataTableColumn<T>[];
  header?: DataTableHeaderConfig;
  actions?: DataTableActions<T>;
  isLoading?: boolean;
  deletingId?: string | null;
  searchPlaceholder?: string;
  pageSize?: number;
  pageSizeOptions?: number[];
  id?: string;
}

const Toolbar = ({ placeholder }: { placeholder?: string }) => (
  <div className="dataTableToolbar">
    <GridToolbarQuickFilter placeholder={placeholder ?? "Buscar..."} />
  </div>
);

export const DataTable = <T extends { id: string }>({
  data,
  columns,
  header,
  actions,
  isLoading = false,
  deletingId = null,
  searchPlaceholder,
  pageSize = 5,
  pageSizeOptions = [5, 10, 20],
  id,
}: DataTableProps<T>) => {
  const confirmDelete = useConfirmDialog<T>({
    defaultTitle: actions?.deleteConfirmTitle ?? "Eliminar elemento",
    defaultConfirmLabel: "Eliminar",
    defaultCancelLabel: "Cancelar",
    defaultTone: "danger",
  });

  const handleRequestDelete = useCallback(
    (itemId: string) => {
      const item = data.find((d) => d.id === itemId);
      if (!item || !actions?.onDelete) {
        return;
      }

      const description = actions.deleteConfirmDescription
        ? actions.deleteConfirmDescription(item)
        : "¿Estás seguro de que deseas eliminar este elemento?";

      confirmDelete.open({
        description,
        data: item,
      });
    },
    [data, actions, confirmDelete]
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!confirmDelete.data || !actions?.onDelete) {
      return;
    }

    const itemToDelete = confirmDelete.data;
    confirmDelete.setBusy(true);

    try {
      await actions.onDelete(itemToDelete.id);
      confirmDelete.reset();
    } catch {
      confirmDelete.setBusy(false);
    }
  }, [confirmDelete, actions]);

  const gridColumns = useMemo<GridColDef[]>(() => {
    const baseColumns: GridColDef[] = columns.map((col) => ({
      field: col.field,
      headerName: col.headerName,
      flex: col.flex ?? 1,
      minWidth: col.minWidth ?? 120,
      sortable: col.sortable ?? true,
      filterable: col.filterable ?? true,
      renderCell: col.renderCell,
      valueFormatter: col.valueFormatter
        ? (value: T[keyof T]) => col.valueFormatter!(value)
        : undefined,
    }));

    const hasActions = actions?.onEdit || actions?.onDelete;

    if (hasActions) {
      baseColumns.push({
        field: "actions",
        headerName: "",
        sortable: false,
        filterable: false,
        minWidth: actions?.onEdit && actions?.onDelete ? 100 : 60,
        flex: 0,
        renderCell: (params: GridRenderCellParams) => (
          <div className="dataTableActions">
            {actions?.onEdit && (
              <button
                type="button"
                className="dataTableActionBtn dataTableEditBtn"
                onClick={() => {
                  const item = data.find((d) => d.id === params.row.id);
                  if (item) {
                    actions.onEdit!(item);
                  }
                }}
                aria-label={actions.editLabel ?? "Editar"}
                title={actions.editLabel ?? "Editar"}
              >
                <Pencil size={16} />
              </button>
            )}
            {actions?.onDelete && (
              <button
                type="button"
                className="dataTableActionBtn dataTableDeleteBtn"
                onClick={() => handleRequestDelete(params.row.id as string)}
                disabled={deletingId === (params.row.id as string)}
                aria-label={actions.deleteLabel ?? "Eliminar"}
                title={actions.deleteLabel ?? "Eliminar"}
              >
                {deletingId === (params.row.id as string) ? (
                  <span className="dataTableSpinner" />
                ) : (
                  <Trash2 size={16} />
                )}
              </button>
            )}
          </div>
        ),
      });
    }

    return baseColumns;
  }, [columns, actions, data, deletingId, handleRequestDelete]);

  return (
    <div className="dataTableCard" id={id}>
      {header && (
        <header className="dataTableHeader">
          <div>
            <h2>{header.title}</h2>
            {header.subtitle && (
              <p className="dataTableHint">{header.subtitle}</p>
            )}
          </div>
          {header.badgeCount !== undefined && (
            <span className="dataTableBadge">{header.badgeCount}</span>
          )}
        </header>
      )}

      <div className="dataTableGridWrapper">
        <DataGrid
          style={{ height: "600px" }}
          rows={data}
          columns={gridColumns}
          loading={isLoading}
          disableRowSelectionOnClick
          pageSizeOptions={pageSizeOptions}
          initialState={{
            pagination: { paginationModel: { pageSize, page: 0 } },
          }}
          slots={{
            toolbar: () => <Toolbar placeholder={searchPlaceholder} />,
          }}
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
