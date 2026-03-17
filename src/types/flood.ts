/**
 * Type definitions for Indonesian flood data
 */

export interface FloodRecord {
  uuid: string;
  area_km2: number;
  geometry: Uint8Array; // WKB binary
  start_date: string;
  end_date: string;
  centroid_lon: number;
  centroid_lat: number;
}

export interface FloodSummary {
  total_records: number;
  total_area_km2: number;
  date_range: {
    min: string;
    max: string;
  };
  avg_area_km2: number;
}

/** Lightweight point used by map layers (no WKB geometry) */
export interface FloodPoint {
  uuid: string;
  area_km2: number;
  start_date: string;
  end_date: string;
  centroid_lon: number;
  centroid_lat: number;
}

export type LayerMode = "heatmap" | "hexagon" | "choropleth";

/** Geographic aggregation level */
export type GeoLevel = "provinsi" | "kabupaten" | "kecamatan";

/** Metric for the insights bar chart */
export type MetrikValue =
  | "jumlah_peristiwa"
  | "hari_banjir"
  | "luas_irisan"
  | "rasio_cakupan";

/** Sidebar stats summary */
export interface FloodStats {
  total_records: number;
  total_area: number;
  avg_area: number;
  max_area: number;
  min_date: string | null;
  max_date: string | null;
}

/** Viewport bounding box for spatial filtering */
export interface ViewportBounds {
  minLon: number;
  maxLon: number;
  minLat: number;
  maxLat: number;
}

/** Province flood count for bar chart and choropleth */
export interface ProvinceCount {
  province: string;
  count: number;
  area?: number;
}

/** Yearly flood count for trend line chart */
export interface YearlyTrend {
  year: number;
  count: number;
  area: number;
}

export interface QueryResult<T = Record<string, unknown>> {
  rows: T[];
  columns: string[];
  rowCount: number;
}
