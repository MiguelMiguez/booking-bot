import { Pencil, Trash2 } from "lucide-react";
import type { Service } from "../../types";
import { getServiceIcon } from "../../utils/serviceIcons";
import "./ServiceCard.css";

interface ServiceCardProps {
  service: Service;
  onEdit?: (service: Service) => void;
  onDelete?: (service: Service) => void;
  disabled?: boolean;
}

type ServiceMeta = {
  durationLabel: string | null;
  priceLabel: string | null;
};

const buildServiceMeta = (service: Service): ServiceMeta => {
  const durationLabel =
    typeof service.durationMinutes === "number"
      ? `${service.durationMinutes} min`
      : null;
  const priceLabel =
    typeof service.price === "number" ? `$${service.price}` : null;

  return { durationLabel, priceLabel };
};

export const ServiceCard = ({
  service,
  onEdit,
  onDelete,
  disabled = false,
}: ServiceCardProps) => {
  const { durationLabel, priceLabel } = buildServiceMeta(service);
  const canEdit = Boolean(onEdit) && !disabled;
  const canDelete = Boolean(onDelete) && !disabled;
  const ServiceIcon = getServiceIcon(service.name, service.icon);

  return (
    <article className="serviceCard">
      <div className="serviceCardIcon" aria-hidden="true">
        <ServiceIcon size={24} />
      </div>

      <div className="serviceCardContent">
        <div className="serviceCardHeader">
          <h3>{service.name}</h3>
          <ul className="serviceCardMeta" aria-label="Detalles del servicio">
            {durationLabel ? (
              <span className="service-list__pill">{durationLabel}</span>
            ) : null}
            {priceLabel ? (
              <span className="service-list__pill service-list__pill--accent">
                {priceLabel}
              </span>
            ) : null}
          </ul>
          {service.description ? (
            <p className="serviceCardDescription">{service.description}</p>
          ) : null}
        </div>
      </div>

      <div className="serviceCardActions">
        {onEdit ? (
          <button
            type="button"
            className="serviceCardAction"
            onClick={() => onEdit(service)}
            aria-label={`Editar ${service.name}`}
            disabled={!canEdit}
          >
            <Pencil size={16} />
          </button>
        ) : null}
        {onDelete ? (
          <button
            type="button"
            className="serviceCardAction isDanger"
            onClick={() => onDelete(service)}
            aria-label={`Eliminar ${service.name}`}
            disabled={!canDelete}
          >
            <Trash2 size={16} />
          </button>
        ) : null}
      </div>
    </article>
  );
};
