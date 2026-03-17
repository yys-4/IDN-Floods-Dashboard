/**
 * DuckDB-WASM utility for browser-based SQL queries on Parquet data
 *
 * Usage:
 *   import { initDuckDB, query } from '@/lib/duckdb';
 *   await initDuckDB();
 *   const results = await query('SELECT * FROM floods LIMIT 10');
 */

import * as duckdb from "@duckdb/duckdb-wasm";
import type { QueryResult } from "@/types/flood";

// ── Module State ─────────────────────────────────────────────────────────────

let db: duckdb.AsyncDuckDB | null = null;
let conn: duckdb.AsyncDuckDBConnection | null = null;
let initPromise: Promise<duckdb.AsyncDuckDB> | null = null;

// CDN bundles for DuckDB WASM
const DUCKDB_BUNDLES: duckdb.DuckDBBundles = {
  mvp: {
    mainModule: "https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@1.33.1-dev20.0/dist/duckdb-mvp.wasm",
    mainWorker: "https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@1.33.1-dev20.0/dist/duckdb-browser-mvp.worker.js",
  },
  eh: {
    mainModule: "https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@1.33.1-dev20.0/dist/duckdb-eh.wasm",
    mainWorker: "https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@1.33.1-dev20.0/dist/duckdb-browser-eh.worker.js",
  },
};

const PARQUET_URL = "/indonesia_floods.parquet";
const TABLE_NAME = "floods";

// ── Initialization ───────────────────────────────────────────────────────────

/**
 * Initialize DuckDB WASM and register the parquet file.
 * Safe to call multiple times - returns cached instance.
 */
export async function initDuckDB(): Promise<duckdb.AsyncDuckDB> {
  // Return existing instance
  if (db) return db;

  // Return in-progress initialization
  if (initPromise) return initPromise;

  initPromise = (async () => {
    console.log("[DuckDB] Initializing...");

    // Select best bundle for this browser
    const bundle = await duckdb.selectBundle(DUCKDB_BUNDLES);

    // Workers must be same-origin. Fetch the CDN script and create
    // a same-origin blob URL so the browser allows instantiation.
    const workerScript = await fetch(bundle.mainWorker!).then((r) => r.text());
    const workerBlob = new Blob([workerScript], {
      type: "application/javascript",
    });
    const worker = new Worker(URL.createObjectURL(workerBlob));
    const logger = new duckdb.ConsoleLogger(duckdb.LogLevel.WARNING);

    // Instantiate database
    db = new duckdb.AsyncDuckDB(logger, worker);
    await db.instantiate(bundle.mainModule);
    console.log("[DuckDB] Instantiated");

    // Create connection
    conn = await db.connect();
    console.log("[DuckDB] Connected");

    // Register parquet file from public folder
    await registerParquet();

    return db;
  })();

  return initPromise;
}

/**
 * Register the parquet file as a virtual table
 */
async function registerParquet(): Promise<void> {
  if (!db || !conn) {
    throw new Error("DuckDB not initialized");
  }

  console.log("[DuckDB] Fetching parquet file...");

  // Fetch parquet file
  const response = await fetch(PARQUET_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${PARQUET_URL}: ${response.statusText}`);
  }

  const buffer = await response.arrayBuffer();
  console.log(`[DuckDB] Loaded ${(buffer.byteLength / 1024 / 1024).toFixed(1)} MB`);

  // Register as virtual file
  await db.registerFileBuffer(
    "indonesia_floods.parquet",
    new Uint8Array(buffer)
  );

  // Create view/table from parquet
  await conn.query(`
    CREATE TABLE IF NOT EXISTS ${TABLE_NAME} AS
    SELECT * FROM read_parquet('indonesia_floods.parquet')
  `);

  // Verify table
  const result = await conn.query(`SELECT COUNT(*) as cnt FROM ${TABLE_NAME}`);
  const count = result.toArray()[0]?.cnt;
  console.log(`[DuckDB] Table '${TABLE_NAME}' ready with ${count?.toLocaleString()} rows`);
}

// ── Query Functions ──────────────────────────────────────────────────────────

/**
 * Get the current database connection.
 * Initializes DuckDB if not already done.
 */
export async function getConnection(): Promise<duckdb.AsyncDuckDBConnection> {
  await initDuckDB();
  if (!conn) {
    throw new Error("Failed to establish DuckDB connection");
  }
  return conn;
}

/**
 * Convert BigInt values to Number for JSON compatibility.
 * DuckDB-WASM returns COUNT/SUM as BigInt which can't be mixed with Numbers.
 * Recursively handles nested objects and arrays.
 */
function convertBigIntToNumber(value: unknown): unknown {
  if (typeof value === "bigint") {
    // Safe conversion for reasonable sizes (Number.MAX_SAFE_INTEGER = 9007199254740991)
    return Number(value);
  }
  if (Array.isArray(value)) {
    return value.map(convertBigIntToNumber);
  }
  if (value !== null && typeof value === "object") {
    const converted: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      converted[k] = convertBigIntToNumber(v);
    }
    return converted;
  }
  return value;
}

/**
 * Execute a SQL query and return typed results.
 *
 * @example
 * const { rows } = await query<FloodRecord>('SELECT * FROM floods LIMIT 10');
 */
export async function query<T = Record<string, unknown>>(
  sql: string
): Promise<QueryResult<T>> {
  const connection = await getConnection();

  const result = await connection.query(sql);
  const columns = result.schema.fields.map((f) => f.name);
  const rawRows = result.toArray();

  const rows = rawRows.map((row) => {
    const obj: Record<string, unknown> = {};

    // Handle both Arrow struct rows (with toJSON) and plain objects
    const rowData =
      typeof row.toJSON === "function" ? row.toJSON() : (row as object);

    columns.forEach((col, i) => {
      // Try column name first, then index
      let rawValue: unknown;
      if (col in rowData) {
        rawValue = (rowData as Record<string, unknown>)[col];
      } else if (Array.isArray(rowData)) {
        rawValue = rowData[i];
      } else {
        // Fallback: try accessing by column name or index on original row
        rawValue = row[col] ?? row[i];
      }

      // Convert BigInt to Number to avoid "Invalid mix of BigInt" errors
      obj[col] = convertBigIntToNumber(rawValue);
    });

    return obj as T;
  });

  return {
    rows,
    columns,
    rowCount: rows.length,
  };
}

/**
 * Execute a query and return a single value (first column of first row).
 * Useful for COUNT, SUM, etc.
 */
export async function queryScalar<T = number>(sql: string): Promise<T | null> {
  const { rows, columns } = await query(sql);
  if (rows.length === 0 || columns.length === 0) return null;
  return rows[0][columns[0] as keyof typeof rows[0]] as T;
}

/**
 * Check if DuckDB is initialized and ready
 */
export function isReady(): boolean {
  return db !== null && conn !== null;
}

/**
 * Get the database instance (for advanced usage)
 */
export function getDB(): duckdb.AsyncDuckDB | null {
  return db;
}

/**
 * Close the connection and clean up resources
 */
export async function close(): Promise<void> {
  if (conn) {
    await conn.close();
    conn = null;
  }
  if (db) {
    await db.terminate();
    db = null;
  }
  initPromise = null;
  console.log("[DuckDB] Closed");
}
