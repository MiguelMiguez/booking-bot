import type { CSSProperties, ReactNode } from "react";
import { useMemo } from "react";
import "./Chart.css";

export type ChartConfig = Record<string, { label: string; color: string }>;

interface ChartContainerProps {
  config: ChartConfig;
  children: ReactNode;
  className?: string;
}

export const ChartContainer = ({
  config,
  children,
  className,
}: ChartContainerProps) => {
  const style = useMemo(() => {
    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(config)) {
      result[`--chart-color-${key}`] = value.color;
    }

    return result as CSSProperties;
  }, [config]);

  return (
    <div
      className={`chart-container${className ? ` ${className}` : ""}`}
      style={style}
    >
      {children}
    </div>
  );
};

interface ChartTooltipContentProps {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string | number;
  indicator?: "dot" | "line";
}

type TooltipEntry = {
  color?: string;
  dataKey?: string | number;
  name?: string;
  value?: number | string;
  payload?: Record<string, unknown>;
};

export const ChartTooltipContent = ({
  active,
  payload,
  label,
  indicator = "dot",
}: ChartTooltipContentProps) => {
  if (!active || !payload?.length) {
    return null;
  }

  const items = (payload ?? []) as TooltipEntry[];

  const resolvedLabel =
    (items[0]?.payload as { tooltipLabel?: string })?.tooltipLabel ?? label;

  return (
    <div className="chart-tooltip" role="presentation">
      {resolvedLabel ? (
        <span className="chart-tooltip__label">{resolvedLabel}</span>
      ) : null}
      <div className="chart-tooltip__items">
        {items.map((item) => {
          if (item.value === undefined || item.value === null) {
            return null;
          }

          return (
            <div key={item.dataKey} className="chart-tooltip__item">
              <span
                className={`chart-tooltip__indicator chart-tooltip__indicator--${indicator}`}
                style={{ backgroundColor: item.color ?? "#2563eb" }}
              />
              <span className="chart-tooltip__name">
                {item.name ?? item.dataKey}
              </span>
              <span className="chart-tooltip__value">{item.value}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface ChartLegendProps {
  items: Array<{ label: string; color: string }>;
}

export const ChartLegend = ({ items }: ChartLegendProps) => {
  if (!items.length) {
    return null;
  }

  return (
    <div
      className="chart-legend"
      role="list"
      aria-label="Referencias del gráfico"
    >
      {items.map((item) => (
        <span key={item.label} className="chart-legend__item" role="listitem">
          <span
            className="chart-legend__swatch"
            style={{ backgroundColor: item.color }}
            aria-hidden="true"
          />
          {item.label}
        </span>
      ))}
    </div>
  );
};
