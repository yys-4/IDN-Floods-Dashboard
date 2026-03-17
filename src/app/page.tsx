"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Flame, Grid3X3, Map as MapIcon, BarChart3, CalendarDays } from "lucide-react";
import { useDuckDB } from "@/contexts/DuckDBContext";
import { useDateRange } from "@/contexts/DateRangeContext";
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
  KABUPATEN_MAP,
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

  // ── DateRange context (global state for chart<->map sync) ──────────────────
  const {
    dateRange,
    source: dateSource,
    isHovering,
    selectedMonth,
    yearRange,
    timelineActive,
    timelineYear,
    setYearRange,
    setTimelineYear,
    setSelectedMonth,
    resetToYearRange,
  } = useDateRange();

  // ── Filter state ────────────────────────────────────────────────────────
  const [province, setProvince] = useState<ProvinceValue>("all");
  const [intensity, setIntensity] = useState<IntensityValue>("all");
  const [layerMode, setLayerMode] = useState<LayerMode>("choropleth");
  const [geoLevel, setGeoLevel] = useState<GeoLevel>("provinsi");
  const [metrik, setMetrik] = useState<MetrikValue>("jumlah_peristiwa");

  // ── Timeline state (play/pause only, year managed by context) ──────────
  const [timelinePlaying, setTimelinePlaying] = useState(false);
  const [hoveredYear, setHoveredYear] = useState<number | null>(null);

  // ── Panel visibility state ───────────────────────────────────────────────
  const [showInsights, setShowInsights] = useState(true);
  const [showTrendChart, setShowTrendChart] = useState(true);

  // ── Viewport bounds state ───────────────────────────────────────────────
  const [viewportBounds, setViewportBounds] = useState<ViewportBounds | null>(null);
  const [targetBounds, setTargetBounds] = useState<ViewportBounds | null>(null);

  // Automatically adjust map targetBounds when province changes
  useEffect(() => {
    if (province === "all") {
      // Extent for typical complete Indonesian coverage
      setTargetBounds({
        minLon: 95.0,
        maxLon: 141.0,
        minLat: -11.0,
        maxLat: 6.0,
      });
    } else {
      const p = PROVINCES.find((x) => x.value === province);
      if (p && "lonMin" in p) {
        setTargetBounds({
          minLon: p.lonMin,
          maxLon: p.lonMax,
          minLat: p.latMin,
          maxLat: p.latMax,
        });
      }
    }
  }, [province]);

  // ── Data state ──────────────────────────────────────────────────────────
  const [mapData, setMapData] = useState<FloodPoint[]>([]);
  const [stats, setStats] = useState<FloodStats | null>(null);
  const [dataLoading, setDataLoading] = useState(false);

  // ── Insights data state ─────────────────────────────────────────────────
  const [provinceInsights, setProvinceInsights] = useState<ProvinceCount[]>([]);
  const [trendInsights, setTrendInsights] = useState<YearlyTrend[]>([]);
  const [insightsLoading, setInsightsLoading] = useState(false);

  // ── Choropleth data state (province-level, no viewport filter) ────────
  const [choroplethData, setChoroplethData] = useState<ProvinceCount[]>([]);
  const [showChoropleth, setShowChoropleth] = useState(true);

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

  // ── WHERE clause for map/stats (uses dateRange from context) ─────────────
  const whereClause = useMemo(() => {
    const clauses: string[] = [];

    // Date filter from context (handles selectedMonth, hover, timeline, yearRange)
    if (dateSource === "chartClick" || dateSource === "chartHover") {
      // For month-based filtering (click or hover)
      clauses.push(`start_date >= '${dateRange.startDate}'`);
      clauses.push(`start_date < '${dateRange.endDate}'`);
    } else if (dateSource === "timeline") {
      clauses.push(`start_date >= '${dateRange.startDate}'`);
      clauses.push(`start_date <= '${dateRange.endDate}'`);
    } else {
      // yearRange
      clauses.push(`start_date >= '${dateRange.startDate}'`);
      clauses.push(`start_date <= '${dateRange.endDate}'`);
    }

    clauses.push(...buildGeoIntensityClauses(province, intensity));
    return clauses.join(" AND ") || "1=1";
  }, [dateRange, dateSource, province, intensity]);

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

  // ── Fetch main data (re-queries when dateRange changes from context) ────
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

  // ── Debounced data fetch (prevents jank from rapid filter changes) ─────────
  const fetchDataTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (fetchDataTimerRef.current) clearTimeout(fetchDataTimerRef.current);
    fetchDataTimerRef.current = setTimeout(() => { fetchData(); }, 100);
    return () => { if (fetchDataTimerRef.current) clearTimeout(fetchDataTimerRef.current); };
  }, [fetchData]);

  // ── Fetch choropleth data (province-level, no viewport filter) ─────────
  const fetchChoroplethData = useCallback(async () => {
    if (!ready) return;
    try {
      const result = await query<ProvinceCount>(`
        SELECT ${PROVINCE_CASE_SQL} AS province,
               CAST(COUNT(*) AS INTEGER) AS count,
               ROUND(SUM(area_km2), 2) AS area
        FROM floods WHERE ${whereClause}
        GROUP BY province ORDER BY count DESC
      `);
      setChoroplethData(
        result.rows.map((r) => ({
          province: r.province,
          count: Number(r.count) || 0,
          area: Number(r.area) || 0,
        }))
      );
    } catch (err) {
      console.error("Choropleth query failed:", err);
    }
  }, [ready, query, whereClause]);

  const fetchChoroplethTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (fetchChoroplethTimerRef.current) clearTimeout(fetchChoroplethTimerRef.current);
    fetchChoroplethTimerRef.current = setTimeout(() => { fetchChoroplethData(); }, 100);
    return () => { if (fetchChoroplethTimerRef.current) clearTimeout(fetchChoroplethTimerRef.current); };
  }, [fetchChoroplethData]);

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

  const fetchInsightsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (fetchInsightsTimerRef.current) clearTimeout(fetchInsightsTimerRef.current);
    fetchInsightsTimerRef.current = setTimeout(() => { fetchInsights(); }, 150);
    return () => { if (fetchInsightsTimerRef.current) clearTimeout(fetchInsightsTimerRef.current); };
  }, [fetchInsights]);

  // ── Handlers ────────────────────────────────────────────────────────────
  const boundsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleBoundsChange = useCallback((bounds: ViewportBounds) => {
    if (boundsTimerRef.current) clearTimeout(boundsTimerRef.current);
    boundsTimerRef.current = setTimeout(() => {
      setViewportBounds(bounds);
    }, 200);
  }, []);

  const handleYearRangeChange = useCallback((values: number[]) => {
    setYearRange(values[0], values[1]);
    setTimelinePlaying(false);
  }, [setYearRange]);

  const handleMonthSelect = useCallback((month: string | null) => {
    setSelectedMonth(month);
    if (month) {
      setTimelinePlaying(false);
    }
  }, [setSelectedMonth]);

  const handleTimelineYearChange = useCallback((y: number) => {
    setTimelineYear(y);
  }, [setTimelineYear]);

  const handleTimelinePlayPause = useCallback(() => {
    if (!timelineActive) {
      setTimelineYear(timelineYear);
    }
    setTimelinePlaying((p) => !p);
  }, [timelineActive, timelineYear, setTimelineYear]);

  const handleTimelineReset = useCallback(() => {
    setTimelinePlaying(false);
    resetToYearRange();
  }, [resetToYearRange]);

  // Toggle highlight when a bar in InsightsPanel is clicked
  const handleRegionClick = useCallback((regionName: string) => {
    setHighlightedRegion((prev) => (prev === regionName ? null : regionName));

    const p = PROVINCES.find((x) => x.label === regionName);
    if (p) {
      setProvince((prev) => (prev === p.value ? "all" : p.value));
    } else {
      // Coba cari apakah ini Kabupaten, untuk flyTo saja
      let kab;
      for (const kList of Object.values(KABUPATEN_MAP)) {
        const found = kList.find((k) => k.name === regionName);
        if (found) {
          kab = found;
          break;
        }
      }
      if (kab) {
        setTargetBounds({
          minLon: kab.lonMin,
          maxLon: kab.lonMax,
          minLat: kab.latMin,
          maxLat: kab.latMax,
        });
      }
    }
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
      <main className="h-screen flex items-center justify-center bg-[#f5f6f4]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-[#2F6690]" />
          <p className="text-lg text-[#16425B] font-medium">Menginisialisasi DuckDB-WASM…</p>
          <p className="text-sm text-[#6b8a9e]">
            Memuat 370 ribu data banjir ke browser
          </p>
        </motion.div>
      </main>
    );
  }

  if (dbError) {
    return (
      <main className="h-screen flex items-center justify-center bg-[#f5f6f4]">
        <div className="text-center space-y-4 max-w-md px-6">
          <h1 className="text-xl font-semibold text-[#16425B]">
            Gagal menginisialisasi DuckDB
          </h1>
          <p className="text-[#6b8a9e] text-sm">{dbError}</p>
        </div>
      </main>
    );
  }

  // ── Main Render ────────────────────────────────────────────────────────

  return (
    <main className="h-screen w-screen overflow-hidden bg-[#f5f6f4] text-[#16425B] flex flex-col">
      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <header className="flex-none flex items-center justify-end border-b border-[#16425B]/8 bg-white/90 px-5 py-2.5 backdrop-blur-sm z-20 gap-3">
        <AnimatePresence>
          {province !== "all" && (
            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              onClick={() => setProvince("all")}
              className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium bg-[#16425B]/[0.05] text-[#2F6690] hover:bg-red-50 hover:text-red-500 transition-all border border-transparent hover:border-red-200"
            >
              Reset ke Nasional
            </motion.button>
          )}
        </AnimatePresence>

        {/* Hover indicator */}
        <AnimatePresence>
          {isHovering && dateSource === "chartHover" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[10px] font-medium bg-[#3A7CA5]/10 text-[#2F6690] border border-[#3A7CA5]/20"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#3A7CA5] animate-pulse" />
              Pratinjau
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-1.5 rounded-lg border border-[#16425B]/10 bg-[#16425B]/[0.03] p-1">
          <PanelToggleBtn
            active={showTrendChart}
            icon={<CalendarDays className="w-3.5 h-3.5" />}
            label="Tren Bulanan"
            onClick={() => setShowTrendChart((v) => !v)}
          />
          <PanelToggleBtn
            active={showInsights}
            icon={<BarChart3 className="w-3.5 h-3.5" />}
            label="Analitik"
            onClick={() => setShowInsights((v) => !v)}
          />
        </div>

        <div className="flex items-center gap-1.5 rounded-lg border border-[#16425B]/10 bg-[#16425B]/[0.03] p-1">
          <LayerBtn
            active={layerMode === "choropleth"}
            icon={<MapIcon className="w-3.5 h-3.5" />}
            label="Choropleth"
            onClick={() => setLayerMode("choropleth")}
          />
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
        <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
          {/* Map */}
          <div className="flex-1 relative min-h-0">
            <FloodMap
              data={mapData}
              layerMode={layerMode}
              metrik={metrik}
              hoveredYear={hoveredYear}
              targetBounds={targetBounds}
              onBoundsChange={handleBoundsChange}
              choroplethData={choroplethData}
              showChoropleth={showChoropleth}
              onProvinceClick={(id) => setProvince(id as ProvinceValue)}
            />

            {/* Loading overlay */}
            <AnimatePresence>
              {dataLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center bg-white/30 backdrop-blur-[1px] z-20"
                >
                  <div className="flex items-center gap-2 rounded-lg bg-white/95 px-4 py-2 text-sm shadow-xl border border-[#16425B]/10 text-[#16425B]">
                    <Loader2 className="w-4 h-4 animate-spin text-[#3A7CA5]" />
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
          <motion.div
            initial={false}
            animate={{ height: showTrendChart ? 185 : 0, opacity: showTrendChart ? 1 : 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            style={{ overflow: "hidden", flexShrink: 0 }}
          >
            <FloodTrendChart
              whereClause={chartWhereClause}
              selectedMonth={selectedMonth}
              onMonthSelect={handleMonthSelect}
            />
          </motion.div>
        </div>

        {/* ── Insights Panel ──────────────────────────────────────────── */}
        <motion.div
          initial={false}
          animate={{ width: showInsights ? 320 : 0, opacity: showInsights ? 1 : 0 }}
          transition={{ duration: 0.22, ease: "easeInOut" }}
          style={{ overflow: "hidden", flexShrink: 0 }}
        >
          {/* Fixed-size inner div: width for Recharts, height to fill flex-stretched motion.div */}
          <div style={{ width: 320, height: "100%" }}>
            <InsightsPanel
              provinceData={provinceInsights}
              trendData={trendInsights}
              loading={insightsLoading}
              currentYear={timelineActive ? timelineYear : undefined}
              hoveredYear={hoveredYear}
              onHoverYear={setHoveredYear}
              selectedProvince={province}
              metrik={metrik}
              highlightedRegion={activeHighlight}
              onRegionClick={handleRegionClick}
            />
          </div>
        </motion.div>
      </div>
    </main>
  );
}

// ── PanelToggleBtn ────────────────────────────────────────────────────────────

function PanelToggleBtn({
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
      title={active ? `Sembunyikan ${label}` : `Tampilkan ${label}`}
      className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
        active
          ? "text-[#16425B] bg-[#16425B]/[0.07]"
          : "text-[#9cb3c2] hover:text-[#6b8a9e] hover:bg-[#16425B]/[0.03]"
      }`}
    >
      {icon}
      {label}
    </button>
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
          ? "bg-[#2F6690] text-white shadow-sm shadow-[#2F6690]/20"
          : "text-[#6b8a9e] hover:text-[#16425B] hover:bg-[#16425B]/[0.05]"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
