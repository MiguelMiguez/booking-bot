import type { Service } from "../types";

interface ServiceListProps {
  services: Service[];
  isLoading?: boolean;
  emptyMessage?: string;
}

/**
 * Tabla simple con los servicios disponibles.
 */
export const ServiceList = ({
  services,
  isLoading = false,
  emptyMessage = "Carga servicios para ofrecerlos en el bot.",
}: ServiceListProps) => {
  if (isLoading && services.length === 0) {
    return <p className="empty-state">Cargando servicios...</p>;
  }

  if (services.length === 0) {
    return <p className="empty-state">{emptyMessage}</p>;
  }

  return (
    <div className="table">
      <div className="table-header">
        <span>Servicio</span>
        <span>Duración</span>
        <span>Precio (opcional)</span>
      </div>
      {services.map((service) => (
        <div key={service.id} className="table-row">
          <span>{service.name}</span>
          <span>{service.duration} min</span>
          <span>{service.price ? `$${service.price.toFixed(2)}` : "—"}</span>
        </div>
      ))}
    </div>
  );
};
