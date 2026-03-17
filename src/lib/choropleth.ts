import type { Feature, FeatureCollection, Polygon, MultiPolygon } from "geojson";
import type { MetrikValue } from "@/types/flood";

// ── Types ────────────────────────────────────────────────────────────────────

export interface ProvinceProperties {
  id: string;
  name: string;
  count?: number;
  area?: number;
  intensity?: number; // normalized 0-1
}

export type ProvinceFeature = Feature<Polygon | MultiPolygon, ProvinceProperties>;
export type ProvincesGeoJSON = FeatureCollection<Polygon | MultiPolygon, ProvinceProperties>;

export interface ProvinceFloodCount {
  province: string;
  count: number;
  area?: number;
}

// ── Color scale (Deep Blue Waters) ────────────────────────────────────────────

const CHOROPLETH_COLORS: [number, number, number, number][] = [
  [217, 220, 214, 80],   // #D9DCD6 — very low (light grey)
  [129, 195, 215, 110],  // #81C3D7 — low (sky blue)
  [58,  124, 165, 130],  // #3A7CA5 — moderate (medium blue)
  [47,  102, 144, 150],  // #2F6690 — elevated (deep blue)
  [22,  66,  91,  170],  // #16425B — high (navy)
  [14,  46,  68,  185],  // darker navy — very high
  [8,   30,  50,  200],  // darkest navy — extreme
];

/**
 * Maps a normalized intensity (0-1) to RGBA color
 */
export function getColorForIntensity(intensity: number): [number, number, number, number] {
  const clampedIntensity = Math.max(0, Math.min(1, intensity));
  const index = Math.floor(clampedIntensity * (CHOROPLETH_COLORS.length - 1));
  return CHOROPLETH_COLORS[Math.min(index, CHOROPLETH_COLORS.length - 1)];
}

/**
 * Merges flood counts into GeoJSON features
 */
export function mergeCountsToGeoJSON(
  geojson: ProvincesGeoJSON,
  counts: ProvinceFloodCount[],
  metrik: MetrikValue = "jumlah_peristiwa"
): ProvincesGeoJSON {
  // Create lookup by province name
  const countMap = new Map<string, ProvinceFloodCount>();
  counts.forEach((c) => countMap.set(c.province, c));

  // Find max value for normalization
  const values = counts.map((c) => (metrik === "luas_irisan" ? c.area ?? 0 : c.count));
  const maxValue = Math.max(...values, 1);

  // Merge into features
  const updatedFeatures = geojson.features.map((feature) => {
    const provinceName = feature.properties.name;
    const countData = countMap.get(provinceName);

    const value = countData
      ? metrik === "luas_irisan"
        ? countData.area ?? 0
        : countData.count
      : 0;

    return {
      ...feature,
      properties: {
        ...feature.properties,
        count: countData?.count ?? 0,
        area: countData?.area ?? 0,
        intensity: value / maxValue,
      },
    };
  });

  return {
    ...geojson,
    features: updatedFeatures,
  };
}

/**
 * Load provinces GeoJSON from public folder
 */
export async function loadProvincesGeoJSON(): Promise<ProvincesGeoJSON> {
  const response = await fetch("/indonesia_provinces.geojson");
  if (!response.ok) {
    throw new Error("Failed to load provinces GeoJSON");
  }
  return response.json();
}
