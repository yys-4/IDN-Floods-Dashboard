"use client";

import { useState, useEffect, useCallback } from "react";
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { Loader2, X, CalendarDays } from "lucide-react";
import { useDuckDB } from "@/contexts/DuckDBContext";

// ── Indonesian month names ────────────────────────────────────────────────────

const BULAN_PANJANG = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

function formatBulan(month: string): string {
  const [y, m] = month.split("-");
  return `${BULAN_PANJANG[+m - 1]} ${y}`;
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface MonthlyData {
  month: string;     // "YYYY-MM"
  year: number;
  month_num: number;
  count: number;
  area: number;
}

export interface FloodTrendChartProps {
  /** WHERE clause WITHOUT month selection (used for base chart data) */
  whereClause: string;
  /** Currently selected month in "YYYY-MM" format, or null */
  selectedMonth: string | null;
  /** Callback when a bar is clicked — pass null to deselect */
  onMonthSelect: (month: string | null) => void;
}

// ── Custom Tooltip ────────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, selectedMonth }: any) {
  if (!active || !payload?.length) return null;
  const d: MonthlyData = payload[0].payload;
  const isSelected = d.month === selectedMonth;

  return (
    <div className="rounded-lg border border-white/[0.1] bg-gray-900/95 px-3 py-2 text-xs shadow-2xl backdrop-blur-sm">
      <p className="font-semibold text-white mb-1.5">{formatBulan(d.month)}</p>
      <div className="space-y-0.5">
        <p className="text-blue-400">
          <span className="tabular-nums font-medium">
            {d.count.toLocaleString("id-ID")}
          </span>{" "}
          peristiwa
        </p>
        <p className="text-gray-500">
          <span className="tabular-nums">
            {d.area.toLocaleString("id-ID", { maximumFractionDigits: 0 })}
          </span>{" "}
          km²
        </p>
      </div>
      {!isSelected && (
        <p className="mt-1.5 text-[10px] text-gray-600 border-t border-white/[0.06] pt-1">
          Klik untuk memfilter peta
        </p>
      )}
    </div>
  );
}

// ── Custom X-axis tick (shows year labels only) ───────────────────────────────

function YearTick({ x, y, payload }: any) {
  if (!payload?.value?.endsWith("-01")) return <g />;
  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={11}
        textAnchor="middle"
        fontSize={9}
        fill="#4b5563"
      >
        {payload.value.slice(0, 4)}
      </text>
    </g>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function FloodTrendChart({
  whereClause,
  selectedMonth,
  onMonthSelect,
}: FloodTrendChartProps) {
  const { ready, query } = useDuckDB();
  const [data, setData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(false);

  // ── Fetch monthly data ────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    if (!ready) return;
    setLoading(true);
    try {
      const sql = `
        SELECT
          SUBSTR(start_date, 1, 7)                   AS month,
          CAST(SUBSTR(start_date, 1, 4) AS INTEGER)  AS year,
          CAST(SUBSTR(start_date, 6, 2) AS INTEGER)  AS month_num,
          CAST(COUNT(*) AS INTEGER)                  AS count,
          ROUND(SUM(area_km2), 2)                    AS area
        FROM floods
        WHERE ${whereClause}
        GROUP BY month, year, month_num
        ORDER BY month
      `;
      const result = await query<MonthlyData>(sql);
      setData(
        result.rows.map((r) => ({
          ...r,
          year:      Number(r.year)      || 0,
          month_num: Number(r.month_num) || 0,
          count:     Number(r.count)     || 0,
          area:      Number(r.area)      || 0,
        }))
      );
    } catch (err) {
      console.error("FloodTrendChart query failed:", err);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [ready, query, whereClause]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Handle bar click ──────────────────────────────────────────────────────
  const handleChartClick = useCallback(
    (chartData: any) => {
      const month: string | undefined =
        chartData?.activePayload?.[0]?.payload?.month;
      if (!month) return;
      onMonthSelect(month === selectedMonth ? null : month);
    },
    [selectedMonth, onMonthSelect]
  );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex-none border-t border-white/[0.06] bg-gray-950/80 backdrop-blur-sm">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 pt-3 pb-1">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-3.5 h-3.5 text-gray-600" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-gray-500">
            Tren Bulanan
          </span>
          {loading && (
            <Loader2 className="w-3 h-3 animate-spin text-gray-600" />
          )}
        </div>

        {/* Selected month badge */}
        {selectedMonth && (
          <button
            onClick={() => onMonthSelect(null)}
            className="flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-500/25 px-2.5 py-0.5 text-[10px] font-medium text-amber-400 hover:bg-amber-500/25 transition-colors"
          >
            <span>{formatBulan(selectedMonth)}</span>
            <X className="w-2.5 h-2.5" />
          </button>
        )}
      </div>

      {/* ── Chart area ───────────────────────────────────────────────────── */}
      <div className="h-[140px] px-2 pb-1">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-gray-700" />
          </div>
        ) : data.length === 0 ? (
          <EmptyState />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 8, right: 8, left: 0, bottom: 16 }}
              onClick={handleChartClick}
              style={{ cursor: "pointer" }}
            >
              <XAxis
                dataKey="month"
                tick={<YearTick />}
                tickLine={false}
                axisLine={{ stroke: "rgba(255,255,255,0.05)" }}
                interval={0}
                height={20}
              />
              <YAxis
                tick={{ fontSize: 9, fill: "#4b5563" }}
                axisLine={false}
                tickLine={false}
                width={32}
                tickFormatter={(v) =>
                  v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v
                }
              />
              <Tooltip
                content={
                  <ChartTooltip selectedMonth={selectedMonth} />
                }
                cursor={{ fill: "rgba(255,255,255,0.04)" }}
              />
              {/* Selected month reference line */}
              {selectedMonth && (
                <ReferenceLine
                  x={selectedMonth}
                  stroke="#f59e0b"
                  strokeWidth={1.5}
                  strokeDasharray="3 3"
                  strokeOpacity={0.6}
                />
              )}
              <Bar
                dataKey="count"
                maxBarSize={7}
                radius={[1, 1, 0, 0]}
                isAnimationActive={false}
              >
                {data.map((entry) => {
                  const isSelected = entry.month === selectedMonth;
                  const hasSelection = selectedMonth !== null;
                  return (
                    <Cell
                      key={`cell-${entry.month}`}
                      fill={isSelected ? "#f59e0b" : "#3b82f6"}
                      fillOpacity={
                        hasSelection && !isSelected ? 0.2 : 0.8
                      }
                    />
                  );
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-2">
      <CalendarDays className="w-6 h-6 text-gray-800" />
      <p className="text-[11px] text-gray-600">
        Belum ada data untuk jendela waktu ini
      </p>
    </div>
  );
}
