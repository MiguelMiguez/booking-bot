import { useMemo } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Booking, Service } from "../../types";
import {
  ChartContainer,
  ChartLegend,
  ChartTooltipContent,
  type ChartConfig,
} from "../Charts/Chart";
import "./DashboardMetrics.css";

interface DashboardMetricsProps {
  bookings: Booking[];
  services: Service[];
  isLoading?: boolean;
}

const BOOKINGS_CHART_CONFIG: ChartConfig = {
  turnos: {
    label: "Turnos",
    color: "#2563eb",
  },
};

const SERVICES_CHART_CONFIG: ChartConfig = {
  reservas: {
    label: "Reservas",
    color: "#10b981",
  },
};

const STATUS_CHART_CONFIG: ChartConfig = {
  proximos: {
    label: "Próximos",
    color: "#6366f1",
  },
  historicos: {
    label: "Históricos",
    color: "#f97316",
  },
};

type StatusKey = keyof typeof STATUS_CHART_CONFIG;

const LAST_DAYS = 7;

const formatter = new Intl.DateTimeFormat("es-AR", {
  weekday: "short",
});

const monthDayFormatter = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "short",
});

const getStartOfDay = (input: Date) => {
  const date = new Date(input);
  date.setHours(0, 0, 0, 0);

  return date;
};

export const DashboardMetrics = ({
  bookings,
  services,
  isLoading = false,
}: DashboardMetricsProps) => {
  const bookingsByDay = useMemo(() => {
    const today = getStartOfDay(new Date());
    const days: Array<{
      label: string;
      tooltipLabel: string;
      turnos: number;
      key: number;
    }> = [];
    const indexMap = new Map<number, number>();

    for (let offset = LAST_DAYS - 1; offset >= 0; offset -= 1) {
      const day = new Date(today);
      day.setDate(today.getDate() - offset);

      const key = day.getTime();
      const label = formatter.format(day);
      const tooltipLabel = monthDayFormatter.format(day);

      indexMap.set(key, days.length);
      days.push({ label, tooltipLabel, turnos: 0, key });
    }

    for (const booking of bookings) {
      const raw = booking.createdAt
        ? new Date(booking.createdAt)
        : new Date(`${booking.date}T${booking.time}`);

      if (Number.isNaN(raw.getTime())) {
        continue;
      }

      const normalizedKey = getStartOfDay(raw).getTime();
      const index = indexMap.get(normalizedKey);

      if (typeof index === "number") {
        days[index].turnos += 1;
      }
    }

    return days;
  }, [bookings]);

  const bookingsSummary = useMemo(() => {
    const totalTurnos = bookings.length;
    const now = new Date();

    let upcoming = 0;
    for (const booking of bookings) {
      const parsed = new Date(`${booking.date}T${booking.time}`);
      if (!Number.isNaN(parsed.getTime()) && parsed >= now) {
        upcoming += 1;
      }
    }

    const historicos = Math.max(totalTurnos - upcoming, 0);

    return { totalTurnos, upcoming, historicos };
  }, [bookings]);

  const servicesByPopularity = useMemo(() => {
    if (!bookings.length) {
      return [];
    }

    const counts = new Map<string, number>();

    for (const booking of bookings) {
      const serviceName = booking.service?.trim() || "Sin servicio";
      counts.set(serviceName, (counts.get(serviceName) ?? 0) + 1);
    }

    return Array.from(counts.entries())
      .map(([serviceName, reservas]) => ({ serviceName, reservas }))
      .sort((a, b) => b.reservas - a.reservas)
      .slice(0, 5);
  }, [bookings]);

  const bookingStatusData: Array<{
    key: StatusKey;
    label: string;
    value: number;
  }> = [
    {
      key: "proximos",
      label: STATUS_CHART_CONFIG.proximos.label,
      value: bookingsSummary.upcoming,
    },
    {
      key: "historicos",
      label: STATUS_CHART_CONFIG.historicos.label,
      value: bookingsSummary.historicos,
    },
  ];

  const hasStatusData = bookingStatusData.some((item) => item.value > 0);
  const hasBookingsData = bookingsByDay.some((item) => item.turnos > 0);
  const hasServicesData = servicesByPopularity.length > 0;

  return (
    <div className="dashboardMetrics">
      <div className="dashboardMetrics__grid">
        <article className="dashboardMetrics__card">
          <header className="dashboardMetrics__cardHeader">
            <div>
              <h3>Contratación de servicios</h3>
              <p>Top 5 servicios por reservas</p>
            </div>
            <div className="dashboardMetrics__stat">
              <span className="dashboardMetrics__statValue">
                {services.length}
              </span>
              <span className="dashboardMetrics__statLabel">Activos</span>
            </div>
          </header>

          {isLoading ? (
            <p className="dashboardMetrics__empty">Cargando métricas...</p>
          ) : hasServicesData ? (
            <ChartContainer config={SERVICES_CHART_CONFIG}>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={servicesByPopularity}
                  layout="vertical"
                  margin={{ left: 16, right: 24 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={false}
                    stroke="var(--chart-grid-color)"
                  />
                  <XAxis type="number" allowDecimals={false} hide />
                  <YAxis
                    type="category"
                    dataKey="serviceName"
                    width={120}
                    tickLine={false}
                    axisLine={false}
                    stroke="var(--chart-text-color)"
                    fontSize={12}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(16, 185, 129, 0.08)" }}
                    content={<ChartTooltipContent />}
                  />
                  <Bar
                    dataKey="reservas"
                    fill="var(--chart-color-reservas)"
                    radius={[12, 12, 12, 12]}
                    barSize={36}
                    name="Reservas"
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <p className="dashboardMetrics__empty">
              Todavía no hay reservas asociadas a servicios.
            </p>
          )}

          {hasServicesData ? (
            <ChartLegend
              items={[
                {
                  label: "Reservas por servicio",
                  color: SERVICES_CHART_CONFIG.reservas.color,
                },
              ]}
            />
          ) : null}
        </article>

        <article className="dashboardMetrics__card">
          <header className="dashboardMetrics__cardHeader">
            <div>
              <h3>Estado de turnos</h3>
              <p>Comparativa entre próximos e históricos</p>
            </div>
            <div className="dashboardMetrics__stat">
              <span className="dashboardMetrics__statValue">
                {bookingsSummary.upcoming}
              </span>
              <span className="dashboardMetrics__statLabel">Próximos</span>
            </div>
          </header>

          {isLoading ? (
            <p className="dashboardMetrics__empty">Cargando métricas...</p>
          ) : hasStatusData ? (
            <ChartContainer config={STATUS_CHART_CONFIG}>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart
                  data={bookingStatusData}
                  margin={{ left: 12, right: 12 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="var(--chart-grid-color)"
                  />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    stroke="var(--chart-text-color)"
                    fontSize={12}
                  />
                  <YAxis
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={false}
                    stroke="var(--chart-text-color)"
                    fontSize={12}
                  />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" radius={[12, 12, 12, 12]} name="Turnos">
                    {bookingStatusData.map((item) => (
                      <Cell
                        key={item.key}
                        fill={`var(--chart-color-${item.key})`}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <p className="dashboardMetrics__empty">
              Todavía no se cargaron turnos suficientes para el gráfico.
            </p>
          )}

          {hasStatusData ? (
            <ChartLegend
              items={bookingStatusData.map((item) => ({
                label: STATUS_CHART_CONFIG[item.key].label,
                color: STATUS_CHART_CONFIG[item.key].color,
              }))}
            />
          ) : null}
        </article>

        <article className="dashboardMetrics__card">
          <header className="dashboardMetrics__cardHeader">
            <div>
              <h3>Turnos registrados</h3>
              <p>Últimos {LAST_DAYS} días</p>
            </div>
            <div className="dashboardMetrics__stat">
              <span className="dashboardMetrics__statValue">
                {bookingsSummary.totalTurnos}
              </span>
              <span className="dashboardMetrics__statLabel">Total</span>
            </div>
          </header>

          {isLoading ? (
            <p className="dashboardMetrics__empty">Cargando métricas...</p>
          ) : hasBookingsData ? (
            <ChartContainer config={BOOKINGS_CHART_CONFIG}>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart
                  data={bookingsByDay}
                  margin={{ left: 12, right: 12 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="var(--chart-grid-color)"
                  />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    stroke="var(--chart-text-color)"
                    fontSize={12}
                    dy={8}
                  />
                  <YAxis
                    width={32}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                    stroke="var(--chart-text-color)"
                    fontSize={12}
                  />
                  <Tooltip
                    cursor={{ stroke: "#bfdbfe" }}
                    content={<ChartTooltipContent indicator="line" />}
                    labelFormatter={(_, payload) =>
                      payload?.[0]?.payload?.tooltipLabel ?? undefined
                    }
                  />
                  <Area
                    type="monotone"
                    dataKey="turnos"
                    stroke="var(--chart-color-turnos)"
                    fill="var(--chart-color-turnos)"
                    fillOpacity={0.15}
                    strokeWidth={2.5}
                    name="Turnos"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <p className="dashboardMetrics__empty">
              No se registraron turnos en los últimos {LAST_DAYS} días.
            </p>
          )}
        </article>
      </div>
    </div>
  );
};
