import type { Service } from "../../types";
import "./ServiceList.css";

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
    return <p className="service-list__empty">Cargando servicios...</p>;
  }

  if (services.length === 0) {
    return <p className="service-list__empty">{emptyMessage}</p>;
  }

  return (
    <div className="service-list">
      <div className="service-list__inner">
        <div className="service-list__header-row">
          <span className="service-list__header-cell">Servicio</span>
          <span className="service-list__header-cell">Duración</span>
          <span className="service-list__header-cell">Precio (opcional)</span>
        </div>

        <div className="service-list__body">
          {services.map((service) => (
            <div key={service.id} className="service-list__row">
              <span
                className="service-list__cell service-list__cell--primary"
                data-label="Servicio"
              >
                {service.name}
              </span>
              <span className="service-list__cell" data-label="Duración">
                {service.durationMinutes !== undefined ? (
                  <span className="service-list__pill">
                    {service.durationMinutes} min
                  </span>
                ) : (
                  <span className="service-list__muted">—</span>
                )}
              </span>
              <span
                className="service-list__cell"
                data-label="Precio (opcional)"
              >
                {service.price !== undefined ? (
                  <span className="service-list__pill service-list__pill--accent">
                    {`$${service.price.toFixed(2)}`}
                  </span>
                ) : (
                  <span className="service-list__muted">—</span>
                )}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
