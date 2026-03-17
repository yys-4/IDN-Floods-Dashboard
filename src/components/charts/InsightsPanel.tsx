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
    <motion.div
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: "spring", damping: 24, stiffness: 200, delay: 0.1 }}
      className="flex-none w-[320px] border-l border-white/[0.06] bg-gray-950/90 backdrop-blur-sm overflow-y-auto z-20"
    >
      <div className="p-4 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Analitik</h2>
          {loading && (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
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
          />
        </Section>
      </div>
    </motion.div>
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
      <div className="rounded-xl border border-white/[0.06] bg-gradient-to-br from-white/[0.03] to-transparent p-4">
        <div className="h-20 flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-gray-600" />
        </div>
      </div>
    );
  }

  if (!yoyChange) {
    return (
      <div className="rounded-xl border border-white/[0.06] bg-gradient-to-br from-white/[0.03] to-transparent p-4">
        <p className="text-xs text-gray-500 text-center py-4">
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
          ? "border-red-500/20 bg-gradient-to-br from-red-500/10 to-transparent"
          : isDecrease
          ? "border-green-500/20 bg-gradient-to-br from-green-500/10 to-transparent"
          : "border-white/[0.06] bg-gradient-to-br from-white/[0.03] to-transparent"
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">
            Perubahan Tahun ke Tahun
          </p>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-3xl font-bold tabular-nums ${
                isIncrease
                  ? "text-red-400"
                  : isDecrease
                  ? "text-green-400"
                  : "text-gray-400"
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
              ? "bg-red-500/20 text-red-400"
              : isDecrease
              ? "bg-green-500/20 text-green-400"
              : "bg-gray-500/20 text-gray-400"
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
      <div className="mt-3 flex items-center gap-3 text-[11px] text-gray-500">
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
        <Loader2 className="w-5 h-5 animate-spin text-gray-600" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="h-[180px] flex items-center justify-center text-xs text-gray-500">
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
            tick={{ fontSize: 10, fill: "#6b7280" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) =>
              v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v
            }
          />
          <YAxis
            type="category"
            dataKey="province"
            tick={{ fontSize: 10, fill: "#9ca3af" }}
            axisLine={false}
            tickLine={false}
            width={90}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#111827",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            labelStyle={{ color: "#fff", fontWeight: 600 }}
            itemStyle={{ color: "#60a5fa" }}
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
                  fill={isHighlighted ? "#f59e0b" : "#3b82f6"}
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
}: {
  data: YearlyTrend[];
  loading: boolean;
  currentYear?: number;
}) {
  if (loading) {
    return (
      <div className="h-[160px] flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-gray-600" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="h-[160px] flex items-center justify-center text-xs text-gray-500">
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
        >
          <defs>
            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.05)"
            vertical={false}
          />
          <XAxis
            dataKey="year"
            tick={{ fontSize: 10, fill: "#6b7280" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `'${String(v).slice(-2)}`}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "#6b7280" }}
            axisLine={false}
            tickLine={false}
            width={40}
            tickFormatter={(v) =>
              v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v
            }
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#111827",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            labelStyle={{ color: "#fff", fontWeight: 600 }}
            formatter={(value, name) => [
              `${Number(value).toLocaleString("id-ID")}`,
              name === "count" ? "Peristiwa" : "Luas (km²)",
            ]}
            labelFormatter={(label) => `Tahun ${label}`}
          />
          <Area
            type="monotone"
            dataKey="count"
            stroke="#3b82f6"
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
                    fill="#3b82f6"
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
                  fill="#3b82f6"
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
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
      <div className="flex items-center gap-1.5 mb-3 text-[10px] font-semibold uppercase tracking-[0.1em] text-gray-500">
        {icon}
        <span className="truncate">{title}</span>
      </div>
      {children}
    </div>
  );
}
