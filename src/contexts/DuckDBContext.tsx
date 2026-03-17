"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { initDuckDB, query, queryScalar, isReady, close } from "@/lib/duckdb";
import type { QueryResult } from "@/types/flood";

// ── Types ────────────────────────────────────────────────────────────────────

interface DuckDBContextValue {
  /** Whether DuckDB is fully initialized and ready */
  ready: boolean;
  /** Whether DuckDB is currently loading */
  loading: boolean;
  /** Error message if initialization failed */
  error: string | null;
  /** Execute a SQL query */
  query: <T = Record<string, unknown>>(sql: string) => Promise<QueryResult<T>>;
  /** Execute a query returning a single scalar value */
  queryScalar: <T = number>(sql: string) => Promise<T | null>;
}

const DuckDBContext = createContext<DuckDBContextValue | null>(null);

// ── Provider ─────────────────────────────────────────────────────────────────

interface DuckDBProviderProps {
  children: ReactNode;
}

export function DuckDBProvider({ children }: DuckDBProviderProps) {
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        await initDuckDB();
        if (mounted) {
          setReady(true);
          setLoading(false);
        }
      } catch (err) {
        console.error("[DuckDBProvider] Initialization failed:", err);
        if (mounted) {
          setError(err instanceof Error ? err.message : "Failed to initialize DuckDB");
          setLoading(false);
        }
      }
    }

    init();

    return () => {
      mounted = false;
    };
  }, []);

  // Wrapped query function that checks readiness
  const safeQuery = useCallback(
    async <T = Record<string, unknown>>(sql: string): Promise<QueryResult<T>> => {
      if (!isReady()) {
        throw new Error("DuckDB is not ready yet");
      }
      return query<T>(sql);
    },
    []
  );

  const safeQueryScalar = useCallback(
    async <T = number>(sql: string): Promise<T | null> => {
      if (!isReady()) {
        throw new Error("DuckDB is not ready yet");
      }
      return queryScalar<T>(sql);
    },
    []
  );

  const value: DuckDBContextValue = {
    ready,
    loading,
    error,
    query: safeQuery,
    queryScalar: safeQueryScalar,
  };

  return (
    <DuckDBContext.Provider value={value}>{children}</DuckDBContext.Provider>
  );
}

// ── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Hook to access DuckDB functionality from any component.
 *
 * @example
 * function MyComponent() {
 *   const { ready, query } = useDuckDB();
 *
 *   useEffect(() => {
 *     if (ready) {
 *       query('SELECT * FROM floods LIMIT 10').then(console.log);
 *     }
 *   }, [ready, query]);
 * }
 */
export function useDuckDB(): DuckDBContextValue {
  const context = useContext(DuckDBContext);
  if (!context) {
    throw new Error("useDuckDB must be used within a DuckDBProvider");
  }
  return context;
}
