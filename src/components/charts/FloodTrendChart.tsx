"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
import { useDateRange } from "@/contexts/DateRangeContext";

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

// ── Custom Tooltip (fixed positioning to prevent layout shift) ────────────────

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ payload: MonthlyData }>;
  selectedMonth: string | null;
  coordinate?: { x: number; y: number };
}

function ChartTooltip({ active, payload, selectedMonth }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const d: MonthlyData = payload[0].payload;
  const isSelected = d.month === selectedMonth;

  return (
    <div
      className="rounded-lg border border-[#16425B]/12 bg-white/98 px-3 py-2 text-xs shadow-2xl backdrop-blur-sm pointer-events-none"
      style={{ minWidth: 120 }}
    >
      <p className="font-semibold text-[#16425B] mb-1.5">{formatBulan(d.month)}</p>
      <div className="space-y-0.5">
        <p className="text-[#2F6690]">
          <span className="tabular-nums font-medium">
            {d.count.toLocaleString("id-ID")}
          </span>{" "}
          peristiwa
        </p>
        <p className="text-[#6b8a9e]">
          <span className="tabular-nums">
            {d.area.toLocaleString("id-ID", { maximumFractionDigits: 0 })}
          </span>{" "}
          km²
        </p>
      </div>
      {!isSelected && (
        <p className="mt-1.5 text-[10px] text-[#9cb3c2] border-t border-[#16425B]/6 pt-1">
          Klik untuk memfilter peta
        </p>
      )}
    </div>
  );
}

// ── Custom X-axis tick (shows year labels only) ───────────────────────────────

function YearTick({ x, y, payload }: { x?: number; y?: number; payload?: { value: string } }) {
  if (!payload?.value?.endsWith("-01")) return <g />;
  return (
    <g transform={`translate(${x ?? 0},${y ?? 0})`}>
      <text
        x={0}
        y={0}
        dy={11}
        textAnchor="middle"
        fontSize={9}
        fill="#6b8a9e"
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
  const { setHoverMonth } = useDateRange();
  const [data, setData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const hoverDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (hoverDebounceRef.current) {
        clearTimeout(hoverDebounceRef.current);
      }
    };
  }, []);

  // ── Handle bar click ──────────────────────────────────────────────────────
  const handleChartClick = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (chartData: any) => {
      const month: string | undefined =
        chartData?.activePayload?.[0]?.payload?.month;
      if (!month) return;
      onMonthSelect(month === selectedMonth ? null : month);
    },
    [selectedMonth, onMonthSelect]
  );

  // ── Handle mouse move for hover-based map updates ─────────────────────────
  const handleMouseMove = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (chartData: any) => {
      // Clear any pending debounce
      if (hoverDebounceRef.current) {
        clearTimeout(hoverDebounceRef.current);
      }

      const month: string | undefined =
        chartData?.activePayload?.[0]?.payload?.month;

      // Debounce hover updates to prevent rapid re-queries
      hoverDebounceRef.current = setTimeout(() => {
        setHoverMonth(month ?? null);
      }, 100);
    },
    [setHoverMonth]
  );

  // ── Handle mouse leave ────────────────────────────────────────────────────
  const handleMouseLeave = useCallback(() => {
    if (hoverDebounceRef.current) {
      clearTimeout(hoverDebounceRef.current);
    }
    setHoverMonth(null);
  }, [setHoverMonth]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      ref={containerRef}
      className="flex-none h-[185px] border-t border-[#16425B]/8 bg-white/92 backdrop-blur-sm overflow-hidden"
      style={{ contain: "layout size" }}
    >
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 pt-3 pb-1">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-3.5 h-3.5 text-[#9cb3c2]" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#6b8a9e]">
            Tren Bulanan
          </span>
          {loading && (
            <Loader2 className="w-3 h-3 animate-spin text-[#9cb3c2]" />
          )}
        </div>

        {/* Selected month badge */}
        {selectedMonth && (
          <button
            onClick={() => onMonthSelect(null)}
            className="flex items-center gap-1.5 rounded-full bg-[#2F6690]/10 border border-[#2F6690]/20 px-2.5 py-0.5 text-[10px] font-medium text-[#2F6690] hover:bg-[#2F6690]/20 transition-colors"
          >
            <span>{formatBulan(selectedMonth)}</span>
            <X className="w-2.5 h-2.5" />
          </button>
        )}
      </div>

      {/* ── Chart area (fixed height to prevent layout shift) ─────────────── */}
      <div className="h-[140px] px-2 pb-1 relative">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-[#9cb3c2]" />
          </div>
        ) : data.length === 0 ? (
          <EmptyState />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 8, right: 8, left: 0, bottom: 16 }}
              onClick={handleChartClick}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              style={{ cursor: "pointer" }}
            >
              <XAxis
                dataKey="month"
                tick={<YearTick />}
                tickLine={false}
                axisLine={{ stroke: "rgba(22,66,91,0.06)" }}
                interval={0}
                height={20}
              />
              <YAxis
                tick={{ fontSize: 9, fill: "#6b8a9e" }}
                axisLine={false}
                tickLine={false}
                width={32}
                tickFormatter={(v) =>
                  v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v
                }
              />
              <Tooltip
                content={<ChartTooltip selectedMonth={selectedMonth} />}
                cursor={{ fill: "rgba(22,66,91,0.04)" }}
                position={{ y: -10 }}
                allowEscapeViewBox={{ x: false, y: true }}
                wrapperStyle={{
                  zIndex: 100,
                  pointerEvents: "none",
                  outline: "none",
                }}
              />
              {/* Selected month reference line */}
              {selectedMonth && (
                <ReferenceLine
                  x={selectedMonth}
                  stroke="#16425B"
                  strokeWidth={1.5}
                  strokeDasharray="3 3"
                  strokeOpacity={0.5}
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
                      fill={isSelected ? "#16425B" : "#3A7CA5"}
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
      <CalendarDays className="w-6 h-6 text-[#9cb3c2]" />
      <p className="text-[11px] text-[#6b8a9e]">
        Belum ada data untuk jendela waktu ini
      </p>
    </div>
  );
}
