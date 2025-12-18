import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { ServiceCard } from "../../components/ServiceCard/ServiceCard";
import {
  Modal,
  type FormField,
  type ModalConfig,
} from "../../components/Modal";
import { DashboardHeader } from "../../components/DashboardHeader/DashboardHeader";
import NotificationToast, {
  type NotificationType,
} from "../../components/NotificationToast/NotificationToast";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { useAuth } from "../../hooks/useAuth";
import { useConfirmDialog } from "../../hooks/useConfirmDialog";
import {
  createService,
  deleteService,
  fetchServices,
  updateService,
} from "../../services/serviceService";
import type { NewService, Service } from "../../types";
import "./Services.css";

type ServiceFormValues = {
  name: string;
  description: string;
  durationMinutes: string;
  price: string;
};

const toNumberOrUndefined = (value: string): number | undefined => {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const buildCreatePayload = (values: ServiceFormValues): NewService => {
  return {
    name: values.name.trim(),
    description: values.description.trim() || undefined,
    durationMinutes: toNumberOrUndefined(values.durationMinutes),
    price: toNumberOrUndefined(values.price),
  };
};

const buildUpdatePayload = (
  values: ServiceFormValues,
  original: Service
): Partial<NewService> => {
  const payload: Partial<NewService> = {};
  const normalizedName = values.name.trim();
  if (normalizedName !== original.name) {
    payload.name = normalizedName;
  }

  const normalizedDescription = values.description.trim();
  if ((original.description ?? "") !== normalizedDescription) {
    payload.description = normalizedDescription || undefined;
  }

  const normalizedDuration = toNumberOrUndefined(values.durationMinutes);
  if (normalizedDuration !== original.durationMinutes) {
    payload.durationMinutes = normalizedDuration;
  }

  const normalizedPrice = toNumberOrUndefined(values.price);
  if (normalizedPrice !== original.price) {
    payload.price = normalizedPrice;
  }

  return payload;
};

const ServicesPage = () => {
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

  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const confirmDelete = useConfirmDialog<Service>({
    defaultTitle: "Eliminar servicio",
    defaultConfirmLabel: "Eliminar",
    defaultCancelLabel: "Cancelar",
    defaultTone: "danger",
  });

  const loadServices = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchServices();
      setServices(Array.isArray(data) ? data : []);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "No se pudieron obtener los servicios.";
      setError(message);
      notify(message, "error");
    } finally {
      setIsLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    void loadServices();
  }, [loadServices]);

  const openCreateModal = () => {
    if (!isAdmin) {
      return;
    }
    setModalMode("create");
    setSelectedService(null);
    setModalError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (service: Service) => {
    if (!isAdmin) {
      return;
    }
    setModalMode("edit");
    setSelectedService(service);
    setModalError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (isSubmitting) {
      return;
    }
    setIsModalOpen(false);
    setSelectedService(null);
    setModalError(null);
  };

  const handleSubmit = async (values: ServiceFormValues): Promise<void> => {
    if (!isAdmin) {
      return;
    }

    setIsSubmitting(true);
    setModalError(null);

    try {
      if (modalMode === "create") {
        const payload = buildCreatePayload(values);
        const next = await createService(payload);
        setServices((prev) =>
          [...prev, next].sort((a, b) => a.name.localeCompare(b.name))
        );
        notify(`${next.name} se agregó correctamente.`, "success");
      } else if (selectedService) {
        const payload = buildUpdatePayload(values, selectedService);
        if (Object.keys(payload).length === 0) {
          notify("No se realizaron modificaciones en el servicio.", "info");
          closeModal();
          return;
        }
        const updated = await updateService(selectedService.id, payload);
        setServices((prev) =>
          prev
            .map((service) => (service.id === updated.id ? updated : service))
            .sort((a, b) => a.name.localeCompare(b.name))
        );
        notify(`${updated.name} se guardó correctamente.`, "success");
      }

      closeModal();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "No se pudo guardar el servicio.";
      setModalError(message);
      notify(message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const requestDelete = (service: Service): void => {
    if (!isAdmin) {
      return;
    }

    setError(null);
    confirmDelete.open({
      description: `¿Eliminar el servicio "${service.name}"? Esta acción no se puede deshacer.`,
      data: service,
    });
  };

  const handleConfirmDelete = useCallback(async () => {
    if (!isAdmin || !confirmDelete.data) {
      return;
    }

    const serviceToDelete = confirmDelete.data;
    confirmDelete.setBusy(true);
    setDeletingId(serviceToDelete.id);

    try {
      await deleteService(serviceToDelete.id);
      setServices((prev) =>
        prev.filter((item) => item.id !== serviceToDelete.id)
      );
      notify(`${serviceToDelete.name} se eliminó correctamente.`, "success");
      confirmDelete.reset();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "No se pudo eliminar el servicio.";
      setError(message);
      notify(message, "error");
      confirmDelete.setBusy(false);
    } finally {
      setDeletingId(null);
    }
  }, [isAdmin, notify, confirmDelete]);

  const emptyStateMessage = useMemo(() => {
    if (isLoading) {
      return "Cargando servicios...";
    }

    if (services.length === 0) {
      return isAdmin
        ? "No hay servicios registrados. Agrega el primero para comenzar."
        : "No hay servicios disponibles por el momento.";
    }

    return null;
  }, [isLoading, services.length, isAdmin]);

  const serviceFormFields = useMemo<FormField[]>(
    () => [
      {
        name: "name",
        label: "Nombre del servicio",
        type: "text",
        placeholder: "Ej: Corte de cabello",
        required: true,
        gridColumn: "full",
      },
      {
        name: "description",
        label: "Descripción",
        type: "textarea",
        placeholder: "Describe brevemente el servicio...",
        gridColumn: "full",
        rows: 3,
      },
      {
        name: "durationMinutes",
        label: "Duración (minutos)",
        type: "number",
        placeholder: "Ej: 30",
        min: 1,
      },
      {
        name: "price",
        label: "Precio",
        type: "number",
        placeholder: "Ej: 5000",
        min: 0,
      },
    ],
    []
  );

  const modalConfig = useMemo<ModalConfig>(
    () => ({
      title: modalMode === "create" ? "Agregar servicio" : "Editar servicio",
      description:
        "Define los detalles del servicio, incluyendo duración estimada y precio de referencia.",
      submitLabel: modalMode === "create" ? "Crear" : "Guardar",
      submitLoadingLabel:
        modalMode === "create" ? "Creando..." : "Guardando...",
    }),
    [modalMode]
  );

  const initialModalValues = useMemo<Partial<ServiceFormValues> | undefined>(
    () =>
      selectedService
        ? {
            name: selectedService.name,
            description: selectedService.description ?? "",
            durationMinutes:
              selectedService.durationMinutes !== undefined
                ? String(selectedService.durationMinutes)
                : "",
            price:
              selectedService.price !== undefined
                ? String(selectedService.price)
                : "",
          }
        : undefined,
    [selectedService]
  );

  return (
    <div className="servicesPage">
      <NotificationToast
        message={toast.message}
        type={toast.type}
        isOpen={toast.isOpen}
        onClose={handleCloseToast}
      />

      <DashboardHeader
        title="Servicios"
        subtitle="Administra el catálogo que se utiliza en el bot y en el panel. Actualiza duraciones, precios y descripciones desde aquí."
        showAction={isAdmin}
        action={{
          label: "Agregar servicio",
          icon: Plus,
          onClick: openCreateModal,
          disabled: !isAdmin,
        }}
      />

      {error ? <p className="servicesError">{error}</p> : null}

      {emptyStateMessage ? (
        <p className="servicesEmpty">{emptyStateMessage}</p>
      ) : (
        <section className="servicesList" aria-live="polite">
          {services.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              onEdit={isAdmin ? openEditModal : undefined}
              onDelete={isAdmin ? requestDelete : undefined}
              disabled={deletingId === service.id}
            />
          ))}
        </section>
      )}

      <ConfirmDialog
        {...confirmDelete.dialogProps}
        onConfirm={handleConfirmDelete}
      />

      <Modal<ServiceFormValues>
        open={isModalOpen}
        config={modalConfig}
        fields={serviceFormFields}
        initialValues={initialModalValues}
        isSubmitting={isSubmitting}
        error={modalError}
        onSubmit={handleSubmit}
        onClose={closeModal}
      />
    </div>
  );
};

export default ServicesPage;
