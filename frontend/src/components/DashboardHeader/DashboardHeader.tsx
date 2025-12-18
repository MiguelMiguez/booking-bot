import { Plus, type LucideIcon } from "lucide-react";
import "./DashboardHeader.css";

export type DashboardHeaderStat = {
  label: string;
  value: string | number;
  helperText?: string;
  changeLabel?: string;
  changeTone?: "positive" | "negative" | "neutral";
};

export interface DashboardHeaderAction {
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary";
}

interface DashboardHeaderProps {
  id?: string;
  title: string;
  subtitle?: string;
  stats?: DashboardHeaderStat[];
  showAction?: boolean;
  action?: DashboardHeaderAction;
}

/**
 * Encabezado reutilizable para vistas con resumen y métricas destacadas.
 */
export const DashboardHeader = ({
  id,
  title,
  subtitle,
  stats = [],
  showAction = false,
  action,
}: DashboardHeaderProps) => {
  const ActionIcon = action?.icon ?? Plus;

  return (
    <header className="dashboardHeaderRoot" id={id}>
      <div className="dashboardHeaderTop">
        <div className="dashboardHeaderText">
          <h1>{title}</h1>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>

        {showAction && action && (
          <div className="containerButtonHeader">
            <button
              type="button"
              className={`dashboardHeaderActionBtn ${
                action.variant === "secondary" ? "is-secondary" : "is-primary"
              }`}
              onClick={action.onClick}
              disabled={action.disabled}
            >
              <ActionIcon size={18} />
              <span>{action.label}</span>
            </button>
          </div>
        )}
      </div>

      {stats.length > 0 ? (
        <div className="dashboardHeaderStats">
          {stats.map((stat) => (
            <article key={stat.label} className="dashboardHeaderStat">
              <span className="dashboardHeaderLabel">{stat.label}</span>
              <strong className="dashboardHeaderValue">{stat.value}</strong>
              {stat.helperText ? (
                <span className="dashboardHeaderHelper">{stat.helperText}</span>
              ) : null}
              {stat.changeLabel ? (
                <span
                  className={`dashboardHeaderChange ${
                    stat.changeTone ?? "neutral"
                  }`}
                >
                  {stat.changeLabel}
                </span>
              ) : null}
            </article>
          ))}
        </div>
      ) : null}
    </header>
  );
};
