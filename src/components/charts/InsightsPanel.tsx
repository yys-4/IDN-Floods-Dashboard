"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Area,
  AreaChart,
} from "recharts";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  Activity,
  Loader2,
} from "lucide-react";
import type { ProvinceCount, YearlyTrend, MetrikValue } from "@/types/flood";
import { PROVINCES } from "@/lib/geography";

interface InsightsPanelProps {
  provinceData: ProvinceCount[];
  trendData: YearlyTrend[];
  loading: boolean;
  currentYear?: number;
  /** When set, bar chart drills down to kabupaten level for this province */
  selectedProvince?: string;
  /** Active metric — controls chart labels and aggregation context */
  metrik?: MetrikValue;
  /** Highlighted province/kabupaten name in the bar chart */
  highlightedRegion?: string | null;
  /** Callback when a bar is clicked */
  onRegionClick?: (province: string) => void;
  /** Currently hovered year on the trend chart */
  hoveredYear?: number | null;
  /** Callback when a year is hovered on the trend chart */
  onHoverYear?: (year: number | null) => void;
}

export function InsightsPanel({
  provinceData,
  trendData,
  loading,
  currentYear,
  selectedProvince,
  metrik = "jumlah_peristiwa",
  highlightedRegion,
  onRegionClick,
  hoveredYear,
  onHoverYear,
}: InsightsPanelProps) {
  // Human-readable label for the active metric
  const metrikLabel =
    metrik === "luas_irisan" ? "Luas (km²)" : "Peristiwa";

  // Calculate YoY change
  const yoyChange = useMemo(() => {
    if (trendData.length < 2) return null;

    const sorted = [...trendData].sort((a, b) => b.year - a.year);
    const latest = sorted[0];
    const previous = sorted[1];

    if (!latest || !previous || previous.count === 0) return null;

    const change = ((latest.count - previous.count) / previous.count) * 100;
    return {
      value: change,
      latestYear: latest.year,
      latestCount: latest.count,
      previousYear: previous.year,
      previousCount: previous.count,
    };
  }, [trendData]);

  // Top 5 entries (province or kabupaten depending on selection)
  const top5 = useMemo(
    () => [...provinceData].sort((a, b) => b.count - a.count).slice(0, 5),
    [provinceData]
  );

  // Determine bar chart label based on selected province
  const selectedProvinceLabel =
    selectedProvince && selectedProvince !== "all"
      ? PROVINCES.find((p) => p.value === selectedProvince)?.label ?? selectedProvince
      : null;

  const barChartTitle = selectedProvinceLabel
    ? `5 Kabupaten Teratas — ${selectedProvinceLabel}`
    : `5 Provinsi Teratas berdasarkan ${metrikLabel}`;

  return (
    <div
      className="flex-none w-[320px] min-w-[320px] max-w-[320px] h-full border-l border-[#16425B]/10 bg-white/95 backdrop-blur-sm overflow-y-auto overflow-x-hidden z-20"
      style={{ contain: "layout size", willChange: "auto" }}
    >
      <div className="p-4 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#16425B]">Analitik</h2>
          {loading && (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#3A7CA5]" />
          )}
        </div>

        {/* KPI Card — YoY */}
        <KPICard yoyChange={yoyChange} loading={loading} metrikLabel={metrikLabel} />

        {/* Province / Kabupaten Bar Chart */}
        <Section title={barChartTitle} icon={<BarChart3 className="w-3.5 h-3.5" />}>
          <ProvinceBarChart
            data={top5}
            loading={loading}
            metrikLabel={metrikLabel}
            highlightedRegion={highlightedRegion}
            onRegionClick={onRegionClick}
          />
        </Section>

        {/* Trend Line Chart */}
        <Section
          title="Tren Banjir dari Waktu ke Waktu"
          icon={<Activity className="w-3.5 h-3.5" />}
        >
          <TrendLineChart
            data={trendData}
            loading={loading}
            currentYear={currentYear}
            hoveredYear={hoveredYear}
            onHoverYear={onHoverYear}
          />
        </Section>
      </div>
    </div>
  );
}

// ── KPI Card ─────────────────────────────────────────────────────────────────

interface YoYChange {
  value: number;
  latestYear: number;
  latestCount: number;
  previousYear: number;
  previousCount: number;
}

function KPICard({
  yoyChange,
  loading,
  metrikLabel,
}: {
  yoyChange: YoYChange | null;
  loading: boolean;
  metrikLabel: string;
}) {
  if (loading) {
    return (
      <div className="rounded-xl border border-[#16425B]/8 bg-[#16425B]/[0.02] p-4">
        <div className="h-20 flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-[#9cb3c2]" />
        </div>
      </div>
    );
  }

  if (!yoyChange) {
    return (
      <div className="rounded-xl border border-[#16425B]/8 bg-[#16425B]/[0.02] p-4">
        <p className="text-xs text-[#6b8a9e] text-center py-4">
          Data tidak cukup untuk perbandingan
        </p>
      </div>
    );
  }

  const isIncrease = yoyChange.value > 0;
  const isDecrease = yoyChange.value < 0;
  const absValue = Math.abs(yoyChange.value);

  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`rounded-xl border p-4 ${
        isIncrease
          ? "border-red-400/25 bg-gradient-to-br from-red-50/80 to-transparent"
          : isDecrease
          ? "border-emerald-400/25 bg-gradient-to-br from-emerald-50/80 to-transparent"
          : "border-[#16425B]/8 bg-[#16425B]/[0.02]"
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-[#6b8a9e] mb-1">
            Perubahan Tahun ke Tahun
          </p>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-3xl font-bold tabular-nums ${
                isIncrease
                  ? "text-red-500"
                  : isDecrease
                  ? "text-emerald-600"
                  : "text-[#6b8a9e]"
              }`}
            >
              {isIncrease ? "+" : isDecrease ? "-" : ""}
              {absValue.toFixed(1)}%
            </span>
          </div>
        </div>
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-full ${
            isIncrease
              ? "bg-red-100 text-red-500"
              : isDecrease
              ? "bg-emerald-100 text-emerald-600"
              : "bg-[#16425B]/8 text-[#6b8a9e]"
          }`}
        >
          {isIncrease ? (
            <TrendingUp className="w-5 h-5" />
          ) : isDecrease ? (
            <TrendingDown className="w-5 h-5" />
          ) : (
            <Minus className="w-5 h-5" />
          )}
        </div>
      </div>
      <div className="mt-3 flex items-center gap-3 text-[11px] text-[#6b8a9e]">
        <span>
          {yoyChange.latestYear}: {yoyChange.latestCount.toLocaleString("id-ID")} {metrikLabel}
        </span>
        <span>vs</span>
        <span>
          {yoyChange.previousYear}: {yoyChange.previousCount.toLocaleString("id-ID")} {metrikLabel}
        </span>
      </div>
    </motion.div>
  );
}

// ── Province / Kabupaten Bar Chart ────────────────────────────────────────────

function ProvinceBarChart({
  data,
  loading,
  metrikLabel,
  highlightedRegion,
  onRegionClick,
}: {
  data: ProvinceCount[];
  loading: boolean;
  metrikLabel: string;
  highlightedRegion?: string | null;
  onRegionClick?: (province: string) => void;
}) {
  if (loading) {
    return (
      <div className="h-[180px] flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-[#9cb3c2]" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="h-[180px] flex items-center justify-center text-xs text-[#6b8a9e]">
        Tidak ada data di tampilan ini
      </div>
    );
  }

  return (
    <div className="h-[180px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
          onClick={(chartData) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const name = (chartData as any)?.activePayload?.[0]?.payload?.province;
            if (name && onRegionClick) onRegionClick(name);
          }}
          style={onRegionClick ? { cursor: "pointer" } : undefined}
        >
          <XAxis
            type="number"
            tick={{ fontSize: 10, fill: "#6b8a9e" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) =>
              v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v
            }
          />
          <YAxis
            type="category"
            dataKey="province"
            tick={{ fontSize: 10, fill: "#2F6690" }}
            axisLine={false}
            tickLine={false}
            width={90}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#ffffff",
              border: "1px solid rgba(22,66,91,0.12)",
              borderRadius: "8px",
              fontSize: "12px",
              color: "#16425B",
            }}
            labelStyle={{ color: "#16425B", fontWeight: 600 }}
            itemStyle={{ color: "#2F6690" }}
            formatter={(value) => [
              `${Number(value).toLocaleString("id-ID")} ${metrikLabel}`,
              "Nilai",
            ]}
          />
          <Bar
            dataKey="count"
            radius={[0, 4, 4, 0]}
            animationDuration={800}
          >
            {data.map((entry) => {
              const isHighlighted = highlightedRegion === entry.province;
              const hasHighlight = !!highlightedRegion;
              return (
                <Cell
                  key={`bar-${entry.province}`}
                  fill={isHighlighted ? "#16425B" : "#3A7CA5"}
                  fillOpacity={hasHighlight && !isHighlighted ? 0.3 : 1}
                />
              );
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Trend Line Chart ──────────────────────────────────────────────────────────

function TrendLineChart({
  data,
  loading,
  currentYear,
  hoveredYear,
  onHoverYear,
}: {
  data: YearlyTrend[];
  loading: boolean;
  currentYear?: number;
  hoveredYear?: number | null;
  onHoverYear?: (year: number | null) => void;
}) {
  if (loading) {
    return (
      <div className="h-[160px] flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-[#9cb3c2]" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="h-[160px] flex items-center justify-center text-xs text-[#6b8a9e]">
        Tidak ada data di tampilan ini
      </div>
    );
  }

  const sortedData = [...data].sort((a, b) => a.year - b.year);

  return (
    <div className="h-[160px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={sortedData}
          margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
          onMouseMove={(e: any) => {
            if (e && e.activePayload && e.activePayload.length > 0) {
              const year = e.activePayload[0].payload.year;
              if (onHoverYear && year !== hoveredYear) onHoverYear(year);
            }
          }}
          onMouseLeave={() => {
            if (onHoverYear) onHoverYear(null);
          }}
        >
          <defs>
            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3A7CA5" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#81C3D7" stopOpacity={0.03} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(22,66,91,0.06)"
            vertical={false}
          />
          <XAxis
            dataKey="year"
            tick={{ fontSize: 10, fill: "#6b8a9e" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `'${String(v).slice(-2)}`}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "#6b8a9e" }}
            axisLine={false}
            tickLine={false}
            width={40}
            tickFormatter={(v) =>
              v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v
            }
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#ffffff",
              border: "1px solid rgba(22,66,91,0.12)",
              borderRadius: "8px",
              fontSize: "12px",
              color: "#16425B",
            }}
            labelStyle={{ color: "#16425B", fontWeight: 600 }}
            formatter={(value, name) => [
              `${Number(value).toLocaleString("id-ID")}`,
              name === "count" ? "Peristiwa" : "Luas (km²)",
            ]}
            labelFormatter={(label) => `Tahun ${label}`}
          />
          <Area
            type="monotone"
            dataKey="count"
            stroke="#2F6690"
            strokeWidth={2}
            fill="url(#colorCount)"
            animationDuration={800}
            dot={(props: any) => {
              const { cx, cy, payload } = props;
              if (payload.year === currentYear) {
                return (
                  <circle
                    key={`dot-${payload.year}`}
                    cx={cx}
                    cy={cy}
                    r={5}
                    fill="#2F6690"
                    stroke="#fff"
                    strokeWidth={2}
                  />
                );
              }
              return (
                <circle
                  key={`dot-${payload.year}`}
                  cx={cx}
                  cy={cy}
                  r={3}
                  fill="#3A7CA5"
                />
              );
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Section wrapper ───────────────────────────────────────────────────────────

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-[#16425B]/8 bg-[#16425B]/[0.02] p-3">
      <div className="flex items-center gap-1.5 mb-3 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#6b8a9e]">
        {icon}
        <span className="truncate">{title}</span>
      </div>
      {children}
    </div>
  );
}
