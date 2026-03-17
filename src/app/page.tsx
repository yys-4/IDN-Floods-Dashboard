"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Flame, Grid3X3 } from "lucide-react";
import { useDuckDB } from "@/contexts/DuckDBContext";
import { FloodMap } from "@/components/maps/FloodMap";
import { InsightsPanel } from "@/components/charts/InsightsPanel";
import { FloodTrendChart } from "@/components/charts/FloodTrendChart";
import { Sidebar } from "@/components/ui/Sidebar";
import { TimelineSlider } from "@/components/ui/TimelineSlider";
import {
  PROVINCES,
  INTENSITY_OPTIONS,
  PROVINCE_CASE_SQL,
  buildKabupatenCaseSQL,
} from "@/lib/geography";
import type { ProvinceValue, IntensityValue } from "@/lib/geography";
import type {
  FloodPoint,
  LayerMode,
  ViewportBounds,
  ProvinceCount,
  YearlyTrend,
  GeoLevel,
  MetrikValue,
  FloodStats,
} from "@/types/flood";

const YEAR_MIN = 2000;
const YEAR_MAX = 2026;

// ── Helper: next month string (YYYY-MM) ──────────────────────────────────────

function nextMonthStr(yearMonth: string): string {
  const [y, m] = yearMonth.split("-").map(Number);
  const nm = m === 12 ? 1 : m + 1;
  const ny = m === 12 ? y + 1 : y;
  return `${ny}-${String(nm).padStart(2, "0")}`;
}

// ── Build geo-only WHERE clauses (province + intensity, no dates) ────────────

function buildGeoIntensityClauses(
  province: ProvinceValue,
  intensity: IntensityValue
): string[] {
  const clauses: string[] = [];

  const prov = PROVINCES.find((p) => p.value === province);
  if (prov && "lonMin" in prov) {
    clauses.push(`centroid_lon >= ${prov.lonMin}`);
    clauses.push(`centroid_lon <= ${prov.lonMax}`);
    clauses.push(`centroid_lat >= ${prov.latMin}`);
    clauses.push(`centroid_lat <= ${prov.latMax}`);
  }

  const intensityOpt = INTENSITY_OPTIONS.find((i) => i.value === intensity);
  if (intensityOpt && intensityOpt.value !== "all") {
    clauses.push(`area_km2 >= ${intensityOpt.min}`);
    if ("max" in intensityOpt && intensityOpt.max !== undefined) {
      clauses.push(`area_km2 < ${intensityOpt.max}`);
    }
  }

  return clauses;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Home() {
  const { ready, loading: dbLoading, error: dbError, query } = useDuckDB();

  // ── Filter state ────────────────────────────────────────────────────────
  const [province, setProvince] = useState<ProvinceValue>("all");
  const [yearRange, setYearRange] = useState<[number, number]>([YEAR_MIN, YEAR_MAX]);
  const [intensity, setIntensity] = useState<IntensityValue>("all");
  const [layerMode, setLayerMode] = useState<LayerMode>("heatmap");
  const [geoLevel, setGeoLevel] = useState<GeoLevel>("provinsi");
  const [metrik, setMetrik] = useState<MetrikValue>("jumlah_peristiwa");

  // ── Timeline state ──────────────────────────────────────────────────────
  const [timelineYear, setTimelineYear] = useState(YEAR_MIN);
  const [timelinePlaying, setTimelinePlaying] = useState(false);
  const [timelineActive, setTimelineActive] = useState(false);

  // ── Month selection (FloodTrendChart) ───────────────────────────────────
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  // ── Viewport bounds state ───────────────────────────────────────────────
  const [viewportBounds, setViewportBounds] = useState<ViewportBounds | null>(null);

  // ── Data state ──────────────────────────────────────────────────────────
  const [mapData, setMapData] = useState<FloodPoint[]>([]);
  const [stats, setStats] = useState<FloodStats | null>(null);
  const [dataLoading, setDataLoading] = useState(false);

  // ── Insights data state ─────────────────────────────────────────────────
  const [provinceInsights, setProvinceInsights] = useState<ProvinceCount[]>([]);
  const [trendInsights, setTrendInsights] = useState<YearlyTrend[]>([]);
  const [insightsLoading, setInsightsLoading] = useState(false);

  // ── Highlighted region (for InsightsPanel bar chart) ────────────────────
  const [highlightedRegion, setHighlightedRegion] = useState<string | null>(null);

  // ── Derived: visible event count from viewport ──────────────────────────
  const visibleCount = useMemo(() => {
    if (!viewportBounds) return mapData.length;
    return mapData.filter(
      (p) =>
        p.centroid_lon >= viewportBounds.minLon &&
        p.centroid_lon <= viewportBounds.maxLon &&
        p.centroid_lat >= viewportBounds.minLat &&
        p.centroid_lat <= viewportBounds.maxLat
    ).length;
  }, [mapData, viewportBounds]);

  const unitCount = provinceInsights.filter((p) => p.count > 0).length;

  // ── WHERE clause for map/stats (includes month selection) ───────────────
  const whereClause = useMemo(() => {
    const clauses: string[] = [];

    // Date filter — priority: selectedMonth > timelineActive > yearRange
    if (selectedMonth) {
      clauses.push(`start_date >= '${selectedMonth}-01'`);
      clauses.push(`start_date < '${nextMonthStr(selectedMonth)}-01'`);
    } else if (timelineActive) {
      clauses.push(`start_date >= '${timelineYear}-01-01'`);
      clauses.push(`start_date <= '${timelineYear}-12-31'`);
    } else {
      clauses.push(`start_date >= '${yearRange[0]}-01-01'`);
      clauses.push(`start_date <= '${yearRange[1]}-12-31'`);
    }

    clauses.push(...buildGeoIntensityClauses(province, intensity));
    return clauses.join(" AND ") || "1=1";
  }, [selectedMonth, province, yearRange, intensity, timelineActive, timelineYear]);

  // ── WHERE clause for FloodTrendChart (year range only, no month filter) ──
  const chartWhereClause = useMemo(() => {
    const clauses: string[] = [
      `start_date >= '${yearRange[0]}-01-01'`,
      `start_date <= '${yearRange[1]}-12-31'`,
      ...buildGeoIntensityClauses(province, intensity),
    ];
    return clauses.join(" AND ");
  }, [province, yearRange, intensity]);

  // ── Spatial WHERE clause for insights (viewport) ─────────────────────────
  const spatialWhereClause = useMemo(() => {
    if (!viewportBounds) return whereClause;
    return [
      whereClause,
      `centroid_lon >= ${viewportBounds.minLon}`,
      `centroid_lon <= ${viewportBounds.maxLon}`,
      `centroid_lat >= ${viewportBounds.minLat}`,
      `centroid_lat <= ${viewportBounds.maxLat}`,
    ].join(" AND ");
  }, [whereClause, viewportBounds]);

  // ── Fetch main data ─────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    if (!ready) return;
    setDataLoading(true);
    try {
      const [pointsResult, statsResult] = await Promise.all([
        query<FloodPoint>(
          `SELECT uuid, area_km2, start_date, end_date, centroid_lon, centroid_lat
           FROM floods WHERE ${whereClause}`
        ),
        query<FloodStats>(
          `SELECT
             CAST(COUNT(*) AS INTEGER)  AS total_records,
             ROUND(SUM(area_km2), 2)    AS total_area,
             ROUND(AVG(area_km2), 2)    AS avg_area,
             ROUND(MAX(area_km2), 2)    AS max_area,
             MIN(start_date)            AS min_date,
             MAX(start_date)            AS max_date
           FROM floods WHERE ${whereClause}`
        ),
      ]);
      setMapData(pointsResult.rows);
      const raw = statsResult.rows[0];
      if (raw) {
        setStats({
          ...raw,
          total_records: Number(raw.total_records) || 0,
          total_area:    Number(raw.total_area)    || 0,
          avg_area:      Number(raw.avg_area)      || 0,
          max_area:      Number(raw.max_area)      || 0,
        });
      } else {
        setStats(null);
      }
    } catch (err) {
      console.error("Query failed:", err);
    } finally {
      setDataLoading(false);
    }
  }, [ready, query, whereClause]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Fetch insights (viewport + province drill-down) ─────────────────────
  const fetchInsights = useCallback(async () => {
    if (!ready || !viewportBounds) return;
    setInsightsLoading(true);
    try {
      const geoCaseSQL =
        province !== "all"
          ? buildKabupatenCaseSQL(province)
          : PROVINCE_CASE_SQL;

      // Switch aggregate based on selected metric
      const metrikAggregate =
        metrik === "luas_irisan"
          ? "ROUND(SUM(area_km2), 2)"
          : "CAST(COUNT(*) AS INTEGER)";

      const [geoResult, trendResult] = await Promise.all([
        query<ProvinceCount>(`
          SELECT ${geoCaseSQL} AS province,
                 ${metrikAggregate} AS count
          FROM floods WHERE ${spatialWhereClause}
          GROUP BY province ORDER BY count DESC
        `),
        query<YearlyTrend>(`
          SELECT CAST(SUBSTR(start_date, 1, 4) AS INTEGER) AS year,
                 CAST(COUNT(*) AS INTEGER)                  AS count,
                 ROUND(SUM(area_km2), 2)                    AS area
          FROM floods WHERE ${spatialWhereClause}
          GROUP BY year ORDER BY year
        `),
      ]);

      setProvinceInsights(
        geoResult.rows.map((r) => ({ ...r, count: Number(r.count) || 0 }))
      );
      setTrendInsights(
        trendResult.rows.map((r) => ({
          ...r,
          year:  Number(r.year)  || 0,
          count: Number(r.count) || 0,
          area:  Number(r.area)  || 0,
        }))
      );
    } catch (err) {
      console.error("Insights query failed:", err);
    } finally {
      setInsightsLoading(false);
    }
  }, [ready, query, spatialWhereClause, viewportBounds, province, metrik]);

  useEffect(() => { fetchInsights(); }, [fetchInsights]);

  // ── Handlers ────────────────────────────────────────────────────────────
  const handleBoundsChange = useCallback((bounds: ViewportBounds) => {
    setViewportBounds(bounds);
  }, []);

  const handleYearRangeChange = useCallback((values: number[]) => {
    setYearRange([values[0], values[1]]);
    setTimelineActive(false);
    setTimelinePlaying(false);
    setSelectedMonth(null);
  }, []);

  const handleMonthSelect = useCallback((month: string | null) => {
    setSelectedMonth(month);
    if (month) {
      setTimelineActive(false);
      setTimelinePlaying(false);
    }
  }, []);

  const handleTimelineYearChange = useCallback((y: number) => {
    setTimelineYear(y);
    setTimelineActive(true);
    setSelectedMonth(null);
  }, []);

  const handleTimelinePlayPause = useCallback(() => {
    setTimelineActive(true);
    setTimelinePlaying((p) => !p);
    setSelectedMonth(null);
  }, []);

  const handleTimelineReset = useCallback(() => {
    setTimelinePlaying(false);
    setTimelineActive(false);
    setTimelineYear(YEAR_MIN);
  }, []);

  // Toggle highlight when a bar in InsightsPanel is clicked
  const handleRegionClick = useCallback((regionName: string) => {
    setHighlightedRegion((prev) => (prev === regionName ? null : regionName));
  }, []);

  // Derive highlighted region label from province selection
  const activeHighlight = useMemo(() => {
    if (highlightedRegion) return highlightedRegion;
    if (province !== "all") {
      const p = PROVINCES.find((pr) => pr.value === province);
      return p ? p.label : null;
    }
    return null;
  }, [highlightedRegion, province]);

  // ── Loading / Error ─────────────────────────────────────────────────────

  if (dbLoading) {
    return (
      <main className="h-screen flex items-center justify-center bg-gray-950">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-blue-500" />
          <p className="text-lg text-gray-300">Menginisialisasi DuckDB-WASM…</p>
          <p className="text-sm text-gray-600">
            Memuat 370 ribu data banjir ke browser
          </p>
        </motion.div>
      </main>
    );
  }

  if (dbError) {
    return (
      <main className="h-screen flex items-center justify-center bg-gray-950">
        <div className="text-center space-y-4 max-w-md px-6">
          <h1 className="text-xl font-semibold text-white">
            Gagal menginisialisasi DuckDB
          </h1>
          <p className="text-gray-400 text-sm">{dbError}</p>
        </div>
      </main>
    );
  }

  // ── Main Render ────────────────────────────────────────────────────────

  return (
    <main className="h-screen w-screen overflow-hidden bg-gray-950 text-white flex flex-col">
      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <header className="flex-none flex items-center justify-end border-b border-white/[0.06] bg-gray-950/80 px-5 py-2.5 backdrop-blur-sm z-20">
        <div className="flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.03] p-1">
          <LayerBtn
            active={layerMode === "heatmap"}
            icon={<Flame className="w-3.5 h-3.5" />}
            label="Heatmap"
            onClick={() => setLayerMode("heatmap")}
          />
          <LayerBtn
            active={layerMode === "hexagon"}
            icon={<Grid3X3 className="w-3.5 h-3.5" />}
            label="3D Heksagon"
            onClick={() => setLayerMode("hexagon")}
          />
        </div>
      </header>

      <div className="flex-1 flex min-h-0">
        {/* ── Sidebar ─────────────────────────────────────────────────── */}
        <Sidebar
          stats={stats}
          dataLoading={dataLoading}
          visibleCount={visibleCount}
          unitCount={unitCount}
          province={province}
          yearRange={yearRange}
          intensity={intensity}
          geoLevel={geoLevel}
          metrik={metrik}
          yearMin={YEAR_MIN}
          yearMax={YEAR_MAX}
          timelineActive={timelineActive}
          timelineYear={timelineYear}
          selectedMonth={selectedMonth}
          onProvinceChange={setProvince}
          onYearRangeChange={handleYearRangeChange}
          onIntensityChange={setIntensity}
          onGeoLevelChange={setGeoLevel}
          onMetrikChange={setMetrik}
        />

        {/* ── Map column (map + trend chart stacked) ─────────────────── */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          {/* Map */}
          <div className="flex-1 relative min-h-0">
            <FloodMap
              data={mapData}
              layerMode={layerMode}
              metrik={metrik}
              onBoundsChange={handleBoundsChange}
            />

            {/* Loading overlay */}
            <AnimatePresence>
              {dataLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[1px] z-20"
                >
                  <div className="flex items-center gap-2 rounded-lg bg-gray-900/90 px-4 py-2 text-sm shadow-xl border border-white/10">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                    Mengambil data…
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Timeline — only visible when no month selected */}
            {!selectedMonth && (
              <TimelineSlider
                year={timelineYear}
                minYear={YEAR_MIN}
                maxYear={YEAR_MAX}
                playing={timelinePlaying}
                onYearChange={handleTimelineYearChange}
                onPlayPause={handleTimelinePlayPause}
                onReset={handleTimelineReset}
                eventCount={timelineActive ? stats?.total_records : undefined}
              />
            )}
          </div>

          {/* Flood Trend Chart (monthly bar chart) */}
          <FloodTrendChart
            whereClause={chartWhereClause}
            selectedMonth={selectedMonth}
            onMonthSelect={handleMonthSelect}
          />
        </div>

        {/* ── Insights Panel ──────────────────────────────────────────── */}
        <InsightsPanel
          provinceData={provinceInsights}
          trendData={trendInsights}
          loading={insightsLoading}
          currentYear={timelineActive ? timelineYear : undefined}
          selectedProvince={province}
          metrik={metrik}
          highlightedRegion={activeHighlight}
          onRegionClick={handleRegionClick}
        />
      </div>
    </main>
  );
}

// ── LayerBtn ──────────────────────────────────────────────────────────────────

function LayerBtn({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
        active
          ? "bg-blue-600 text-white shadow-sm shadow-blue-500/20"
          : "text-gray-500 hover:text-gray-300 hover:bg-white/[0.05]"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
