import "./DashboardHeader.css";

export type DashboardHeaderStat = {
  label: string;
  value: string | number;
  helperText?: string;
  changeLabel?: string;
  changeTone?: "positive" | "negative" | "neutral";
};

interface DashboardHeaderProps {
  id?: string;
  title: string;
  subtitle?: string;
  stats?: DashboardHeaderStat[];
}

/**
 * Encabezado reutilizable para vistas con resumen y métricas destacadas.
 */
export const DashboardHeader = ({
  id,
  title,
  subtitle,
  stats = [],
}: DashboardHeaderProps) => {
  return (
    <header className="dashboardHeaderRoot" id={id}>
      <div className="dashboardHeaderText">
        <h1>{title}</h1>
        {subtitle ? <p>{subtitle}</p> : null}
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
