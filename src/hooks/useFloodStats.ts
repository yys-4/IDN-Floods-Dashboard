"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useDuckDB } from "@/contexts/DuckDBContext";

// ── Types ────────────────────────────────────────────────────────────────────

export interface FloodStats {
  /** Total flood events matching the filter */
  totalEvents: number;
  /** Unique locations (rounded to 2 decimal places) */
  uniqueLocations: number;
  /** Total affected area in km² */
  totalArea: number;
  /** Average event area in km² */
  avgArea: number;
  /** Largest single event in km² */
  maxArea: number;
  /** Earliest event date */
  minDate: string | null;
  /** Latest event date */
  maxDate: string | null;
  /** Date range as formatted string */
  dateRange: string;
}

export interface UseFloodStatsResult {
  stats: FloodStats | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// ── Default/empty stats ──────────────────────────────────────────────────────

const EMPTY_STATS: FloodStats = {
  totalEvents: 0,
  uniqueLocations: 0,
  totalArea: 0,
  avgArea: 0,
  maxArea: 0,
  minDate: null,
  maxDate: null,
  dateRange: "—",
};

// ── Hook ─────────────────────────────────────────────────────────────────────

/**
 * High-performance hook for fetching aggregated flood statistics.
 * Uses a single optimized SQL query to minimize DuckDB round-trips.
 *
 * @param whereClause - SQL WHERE clause (without 'WHERE' keyword), e.g. "area_km2 > 10"
 * @param enabled - Whether to run the query (defaults to true)
 *
 * @example
 * const { stats, loading } = useFloodStats("start_date >= '2020-01-01'");
 * console.log(stats?.totalEvents); // 12345
 */
export function useFloodStats(
  whereClause: string = "1=1",
  enabled: boolean = true
): UseFloodStatsResult {
  const { ready, query } = useDuckDB();
  const [stats, setStats] = useState<FloodStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Memoize the SQL query string to prevent unnecessary re-renders
  const sql = useMemo(() => {
    // Use CAST to ensure numeric types (avoids BigInt issues)
    // Use a single query with all aggregations for maximum performance
    return `
      SELECT
        CAST(COUNT(*) AS INTEGER) AS total_events,
        CAST(COUNT(DISTINCT (ROUND(centroid_lon, 2) || ',' || ROUND(centroid_lat, 2))) AS INTEGER) AS unique_locations,
        ROUND(COALESCE(SUM(area_km2), 0), 2) AS total_area,
        ROUND(COALESCE(AVG(area_km2), 0), 2) AS avg_area,
        ROUND(COALESCE(MAX(area_km2), 0), 2) AS max_area,
        MIN(start_date) AS min_date,
        MAX(start_date) AS max_date
      FROM floods
      WHERE ${whereClause}
    `;
  }, [whereClause]);

  const fetchStats = useCallback(async () => {
    if (!ready || !enabled) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      interface StatsRow {
        total_events: number;
        unique_locations: number;
        total_area: number;
        avg_area: number;
        max_area: number;
        min_date: string | null;
        max_date: string | null;
      }

      const result = await query<StatsRow>(sql);

      if (result.rows.length === 0) {
        setStats(EMPTY_STATS);
        return;
      }

      const row = result.rows[0];

      // Ensure numbers are converted (handles any residual BigInt)
      const totalEvents = Number(row.total_events) || 0;
      const uniqueLocations = Number(row.unique_locations) || 0;
      const totalArea = Number(row.total_area) || 0;
      const avgArea = Number(row.avg_area) || 0;
      const maxArea = Number(row.max_area) || 0;

      // Format date range
      const minDate = row.min_date || null;
      const maxDate = row.max_date || null;
      const dateRange =
        minDate && maxDate
          ? `${minDate} — ${maxDate}`
          : minDate || maxDate || "—";

      setStats({
        totalEvents,
        uniqueLocations,
        totalArea,
        avgArea,
        maxArea,
        minDate,
        maxDate,
        dateRange,
      });
    } catch (err) {
      console.error("[useFloodStats] Query failed:", err);
      setError(err instanceof Error ? err.message : "Query failed");
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [ready, enabled, query, sql]);

  // Re-fetch when dependencies change
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading: loading || (!ready && enabled),
    error,
    refetch: fetchStats,
  };
}
