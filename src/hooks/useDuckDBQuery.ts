"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useDuckDB } from "@/contexts/DuckDBContext";
import type { QueryResult } from "@/types/flood";

// ── useDuckDBQuery ───────────────────────────────────────────────────────────

interface UseDuckDBQueryResult<T> {
  data: T[] | null;
  columns: string[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook for executing a DuckDB query with automatic loading states.
 *
 * @example
 * const { data, loading, error } = useDuckDBQuery<FloodRecord>(
 *   'SELECT * FROM floods WHERE area_km2 > 100 LIMIT 50'
 * );
 */
export function useDuckDBQuery<T = Record<string, unknown>>(
  sql: string | null,
  deps: unknown[] = []
): UseDuckDBQueryResult<T> {
  const { ready, query } = useDuckDB();
  const [data, setData] = useState<T[] | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!sql) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await query<T>(sql);
      setData(result.rows);
      setColumns(result.columns);
    } catch (err) {
      console.error("[useDuckDBQuery] Query failed:", err);
      setError(err instanceof Error ? err.message : "Query failed");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [sql, query]);

  useEffect(() => {
    if (ready && sql) {
      fetchData();
    }
  }, [ready, fetchData, ...deps]);

  return { data, columns, loading: loading || !ready, error, refetch: fetchData };
}

// ── useDuckDBScalar ──────────────────────────────────────────────────────────

interface UseDuckDBScalarResult<T> {
  value: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook for executing a scalar query (COUNT, SUM, etc).
 *
 * @example
 * const { value: totalRecords } = useDuckDBScalar<number>(
 *   'SELECT COUNT(*) FROM floods'
 * );
 */
export function useDuckDBScalar<T = number>(
  sql: string | null,
  deps: unknown[] = []
): UseDuckDBScalarResult<T> {
  const { ready, queryScalar } = useDuckDB();
  const [value, setValue] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!sql) {
      setValue(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await queryScalar<T>(sql);
      setValue(result);
    } catch (err) {
      console.error("[useDuckDBScalar] Query failed:", err);
      setError(err instanceof Error ? err.message : "Query failed");
      setValue(null);
    } finally {
      setLoading(false);
    }
  }, [sql, queryScalar]);

  useEffect(() => {
    if (ready && sql) {
      fetchData();
    }
  }, [ready, fetchData, ...deps]);

  return { value, loading: loading || !ready, error, refetch: fetchData };
}

// ── useFloodStats ─────────────────────────────────────────────────────────────

export interface FloodStatsResult {
  totalEvents: number;
  uniqueLocations: number;
  timeWindow: {
    start: string;
    end: string;
  } | null;
}

interface UseFloodStatsResult {
  stats: FloodStatsResult | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * High-performance hook for calculating flood statistics using SQL queries.
 *
 * Features:
 * - Total Events: COUNT(*) of all matching records
 * - Unique Locations: Distinct lat/lon pairs rounded to 2 decimal places
 * - Time Window: Min and max of start_date
 * - Dynamic filtering via whereClause
 * - useMemo to prevent unnecessary re-renders
 *
 * @param whereClause - SQL WHERE clause (without "WHERE" keyword), e.g. "area_km2 > 10"
 * @example
 * const { stats, loading, error } = useFloodStats("area_km2 > 100");
 * // stats: { totalEvents: 5000, uniqueLocations: 120, timeWindow: { start: '2000-01-01', end: '2026-02-03' } }
 */
export function useFloodStats(whereClause?: string): UseFloodStatsResult {
  const { ready, query } = useDuckDB();
  const [stats, setStats] = useState<FloodStatsResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Memoize the SQL query to prevent unnecessary re-builds
  const sql = useMemo(() => {
    const whereFragment = whereClause ? `WHERE ${whereClause}` : "";

    // Single optimized query that calculates all stats
    // Use CAST to ensure numeric types (avoids BigInt issues)
    return `
      SELECT
        CAST(COUNT(*) AS INTEGER) AS total_events,
        CAST(COUNT(DISTINCT (
          ROUND(centroid_lat, 2) * 10000 + ROUND(centroid_lon, 2)
        )) AS INTEGER) AS unique_locations,
        MIN(start_date) AS min_date,
        MAX(start_date) AS max_date
      FROM floods
      ${whereFragment}
    `;
  }, [whereClause]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await query<{
        total_events: number;
        unique_locations: number;
        min_date: string | null;
        max_date: string | null;
      }>(sql);

      const row = result.rows[0];
      if (row) {
        // Ensure conversion to Number (handles any residual BigInt)
        setStats({
          totalEvents: Number(row.total_events) || 0,
          uniqueLocations: Number(row.unique_locations) || 0,
          timeWindow: row.min_date && row.max_date
            ? { start: row.min_date, end: row.max_date }
            : null,
        });
      } else {
        setStats(null);
      }
    } catch (err) {
      console.error("[useFloodStats] Query failed:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch flood stats");
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [sql, query]);

  // Re-fetch when ready or SQL changes
  useEffect(() => {
    if (ready) {
      fetchData();
    }
  }, [ready, fetchData]);

  // Memoize return value to prevent unnecessary re-renders
  return useMemo(
    () => ({
      stats,
      loading: loading || !ready,
      error,
      refetch: fetchData,
    }),
    [stats, loading, ready, error, fetchData]
  );
}
