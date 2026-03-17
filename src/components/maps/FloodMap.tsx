"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import Map from "react-map-gl/maplibre";
import DeckGL from "@deck.gl/react";
import { HeatmapLayer } from "@deck.gl/aggregation-layers";
import { HexagonLayer } from "@deck.gl/aggregation-layers";
import { GeoJsonLayer, TextLayer } from "@deck.gl/layers";
import type { FloodPoint, LayerMode, ViewportBounds, MetrikValue, ProvinceCount } from "@/types/flood";
import type { PickingInfo } from "@deck.gl/core";
import { WebMercatorViewport } from "@deck.gl/core";
import {
  loadProvincesGeoJSON,
  mergeCountsToGeoJSON,
  getColorForIntensity,
  type ProvincesGeoJSON,
  type ProvinceFeature,
} from "@/lib/choropleth";
import { MapTooltip } from "./MapTooltip";
import { ChoroplethTooltip } from "./ChoroplethTooltip";
import "maplibre-gl/dist/maplibre-gl.css";

// ── Constants ────────────────────────────────────────────────────────────────

const CARTO_VOYAGER =
  "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json";

const INITIAL_VIEW_STATE = {
  longitude: 118.0,
  latitude: -2.5,
  zoom: 4.2,
  pitch: 0,
  bearing: 0,
};

// MapLibre Bounds Constraint: [[minLon, minLat], [maxLon, maxLat]]
const INDONESIA_MAX_BOUNDS: [number, number, number, number] = [94.0, -11.5, 141.5, 6.5];
const MIN_ZOOM = 3.8;
const MAX_ZOOM = 14;

// ── Color ramp (Deep Blue Waters: light → dark blue) ─────────────────────────

const HEATMAP_COLOR_RANGE: [number, number, number][] = [
  [129, 195, 215],  // #81C3D7 sky blue
  [58,  124, 165],  // #3A7CA5 medium blue
  [47,  102, 144],  // #2F6690 deep blue
  [22,  66,  91],   // #16425B navy
  [14,  46,  68],   // darker navy
  [8,   30,  50],   // darkest
];

// Hover highlight colors
const HOVER_LINE_COLOR: [number, number, number, number] = [129, 195, 215, 255]; // Sky blue
const DEFAULT_LINE_COLOR: [number, number, number, number] = [47, 102, 144, 140]; // Deep blue

// ── Props ────────────────────────────────────────────────────────────────────

interface FloodMapProps {
  data: FloodPoint[];
  layerMode: LayerMode;
  metrik?: MetrikValue;
  radius?: number;
  hoveredYear?: number | null;
  /** Bounding box target untuk efek animasi kamera Peta */
  targetBounds?: ViewportBounds | null;
  onBoundsChange?: (bounds: ViewportBounds) => void;
  /** Province flood counts for choropleth layer */
  choroplethData?: ProvinceCount[];
  /** Show choropleth layer */
  showChoropleth?: boolean;
  /** Callback when a province is clicked */
  onProvinceClick?: (provinceId: string, provinceName: string) => void;
}

// ── Hovered Province State ───────────────────────────────────────────────────

interface HoveredProvince {
  id: string;
  name: string;
  count: number;
  area: number;
  x: number;
  y: number;
}

// ── Component ────────────────────────────────────────────────────────────────

export function FloodMap({
  data,
  layerMode,
  metrik = "jumlah_peristiwa",
  radius = 12000,
  hoveredYear,
  targetBounds,
  onBoundsChange,
  choroplethData,
  showChoropleth = true,
  onProvinceClick,
}: FloodMapProps) {
  const [hoverInfo, setHoverInfo] = useState<PickingInfo | null>(null);
  const [hoveredProvince, setHoveredProvince] = useState<HoveredProvince | null>(null);
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);
  const [glReady, setGlReady] = useState(false);
  const [provincesGeoJSON, setProvincesGeoJSON] = useState<ProvincesGeoJSON | null>(null);
  const boundsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const deckRef = useRef<any>(null);

  // Load provinces GeoJSON on mount
  useEffect(() => {
    loadProvincesGeoJSON()
      .then(setProvincesGeoJSON)
      .catch((err) => console.warn("Failed to load provinces GeoJSON:", err));
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onHover = useCallback((info: any) => {
    setHoverInfo(info.object ? info : null);
    return true;
  }, []);

  // Handle province hover for choropleth
  const handleProvinceHover = useCallback((info: PickingInfo) => {
    if (info.object) {
      const feature = info.object as ProvinceFeature;
      setHoveredProvince({
        id: feature.properties.id,
        name: feature.properties.name,
        count: feature.properties.count ?? 0,
        area: feature.properties.area ?? 0,
        x: info.x ?? 0,
        y: info.y ?? 0,
      });
    } else {
      setHoveredProvince(null);
    }
  }, []);

  // Calculate bounds from viewport and notify parent (debounced)
  const calculateAndNotifyBounds = useCallback(() => {
    if (!onBoundsChange || !deckRef.current) return;

    // Get the deck.gl instance's viewport
    const deck = deckRef.current.deck;
    if (!deck) return;

    const viewport = deck.getViewports()[0];
    if (!viewport) return;

    // Get the bounding box of the current viewport
    // Use viewport bounds - this gives us the visible area
    const { width, height } = viewport;

    // Unproject corners of the viewport to get lat/lon bounds
    const topLeft = viewport.unproject([0, 0]);
    const topRight = viewport.unproject([width, 0]);
    const bottomLeft = viewport.unproject([0, height]);
    const bottomRight = viewport.unproject([width, height]);

    if (!topLeft || !topRight || !bottomLeft || !bottomRight) return;

    const lons = [topLeft[0], topRight[0], bottomLeft[0], bottomRight[0]];
    const lats = [topLeft[1], topRight[1], bottomLeft[1], bottomRight[1]];

    const bounds: ViewportBounds = {
      minLon: Math.min(...lons),
      maxLon: Math.max(...lons),
      minLat: Math.min(...lats),
      maxLat: Math.max(...lats),
    };

    onBoundsChange(bounds);
  }, [onBoundsChange]);

  // Handle view state changes with debounce & clamp logic
  const handleViewStateChange = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (params: any) => {
      let newViewState = params.viewState;

      // Clamp zoom level
      if (newViewState.zoom < MIN_ZOOM) newViewState.zoom = MIN_ZOOM;
      if (newViewState.zoom > MAX_ZOOM) newViewState.zoom = MAX_ZOOM;

      // Clamp target bounds logic (approximate bounding box logic via DeckGL)
      if (newViewState.longitude < INDONESIA_MAX_BOUNDS[0]) newViewState.longitude = INDONESIA_MAX_BOUNDS[0];
      if (newViewState.longitude > INDONESIA_MAX_BOUNDS[2]) newViewState.longitude = INDONESIA_MAX_BOUNDS[2];
      if (newViewState.latitude < INDONESIA_MAX_BOUNDS[1]) newViewState.latitude = INDONESIA_MAX_BOUNDS[1];
      if (newViewState.latitude > INDONESIA_MAX_BOUNDS[3]) newViewState.latitude = INDONESIA_MAX_BOUNDS[3];

      setViewState(newViewState);

      // Debounce bounds calculation
      if (boundsTimeoutRef.current) {
        clearTimeout(boundsTimeoutRef.current);
      }
      boundsTimeoutRef.current = setTimeout(() => {
        calculateAndNotifyBounds();
      }, 300);
    },
    [calculateAndNotifyBounds]
  );

  // Calculate initial bounds after mount
  useEffect(() => {
    const timer = setTimeout(() => {
      calculateAndNotifyBounds();
    }, 500);
    return () => clearTimeout(timer);
  }, [calculateAndNotifyBounds]);

  // Adjust pitch based on layer mode: top-down for choropleth, tilted for 3D hexagon
  useEffect(() => {
    const targetPitch = layerMode === "hexagon" ? 45 : 0;
    if (viewState.pitch !== targetPitch) {
      setViewState((prev) => ({
        ...prev,
        pitch: targetPitch,
        transitionDuration: 500,
      }));
    }
  }, [layerMode]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (boundsTimeoutRef.current) {
        clearTimeout(boundsTimeoutRef.current);
      }
    };
  }, []);

  // Menangani flyTo bounds jika ada targetBounds dari induk
  useEffect(() => {
    if (!targetBounds || !deckRef.current?.deck) return;
    const { width, height } = deckRef.current.deck;
    if (!width || !height) return;

    try {
      const viewport = new WebMercatorViewport({ width, height });
      const { longitude, latitude, zoom } = viewport.fitBounds(
        [
          [targetBounds.minLon, targetBounds.minLat],
          [targetBounds.maxLon, targetBounds.maxLat],
        ],
        { padding: 60 }
      );
      setViewState((prev) => ({
        ...prev,
        longitude,
        latitude,
        zoom,
        transitionDuration: 1000,
      }));
    } catch (err) {
      console.warn("fitBounds failed", err);
    }
  }, [targetBounds]);

  // Handler for WebGL/WebGPU context initialization
  // Use onDeviceInitialized for deck.gl 9.0+ (replaces deprecated onWebGLInitialized)
  const handleDeviceInitialized = useCallback(() => {
    setGlReady(true);
  }, []);

  // Fallback: set ready after a short delay if callback doesn't fire
  useEffect(() => {
    const fallbackTimer = setTimeout(() => {
      if (!glReady) {
        setGlReady(true);
      }
    }, 1000);
    return () => clearTimeout(fallbackTimer);
  }, [glReady]);

  // Merge choropleth data with GeoJSON
  const choroplethGeoJSON = useMemo(() => {
    if (!provincesGeoJSON || !choroplethData) return null;
    return mergeCountsToGeoJSON(provincesGeoJSON, choroplethData, metrik);
  }, [provincesGeoJSON, choroplethData, metrik]);

  // Compute province label centroids from GeoJSON for TextLayer
  const provinceLabelData = useMemo(() => {
    if (!choroplethGeoJSON) return [];
    return choroplethGeoJSON.features.map((f) => {
      // Approximate centroid from bounding box of first polygon ring
      const geom = f.geometry;
      const coords =
        geom.type === "Polygon"
          ? geom.coordinates[0]
          : geom.type === "MultiPolygon"
          ? geom.coordinates[0][0]
          : [];
      if (!coords.length) return null;
      let sumLon = 0, sumLat = 0;
      for (const c of coords) {
        sumLon += c[0];
        sumLat += c[1];
      }
      return {
        name: f.properties.name,
        count: f.properties.count ?? 0,
        position: [sumLon / coords.length, sumLat / coords.length] as [number, number],
      };
    }).filter(Boolean) as { name: string; count: number; position: [number, number] }[];
  }, [choroplethGeoJSON]);

  // Handle province click - zoom into province
  const handleProvinceClick = useCallback(
    (info: PickingInfo) => {
      if (info.object && onProvinceClick) {
        const feature = info.object as ProvinceFeature;
        onProvinceClick(feature.properties.id, feature.properties.name);
      }
    },
    [onProvinceClick]
  );

  const layers = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allLayers: any[] = [];

    // Choropleth layer (bottom layer)
    if (showChoropleth && choroplethGeoJSON && glReady) {
      allLayers.push(
        new GeoJsonLayer({
          id: "province-choropleth",
          data: choroplethGeoJSON,
          pickable: true,
          stroked: true,
          filled: true,
          // Fill color with hover opacity boost
          getFillColor: (d) => {
            const feature = d as ProvinceFeature;
            const baseColor = getColorForIntensity(feature.properties.intensity ?? 0);
            const isHovered = hoveredProvince?.id === feature.properties.id;
            // Slight opacity boost when hovered, but stay semi-transparent so labels show
            return [baseColor[0], baseColor[1], baseColor[2], isHovered ? Math.min(baseColor[3] + 40, 200) : baseColor[3]];
          },
          // Line color changes on hover
          getLineColor: (d) => {
            const feature = d as ProvinceFeature;
            const isHovered = hoveredProvince?.id === feature.properties.id;
            return isHovered ? HOVER_LINE_COLOR : DEFAULT_LINE_COLOR;
          },
          // Line width increases on hover
          getLineWidth: (d) => {
            const feature = d as ProvinceFeature;
            const isHovered = hoveredProvince?.id === feature.properties.id;
            return isHovered ? 3 : 1;
          },
          lineWidthMinPixels: 1,
          lineWidthMaxPixels: 4,
          onHover: handleProvinceHover,
          onClick: handleProvinceClick,
          updateTriggers: {
            getFillColor: [choroplethData, metrik, hoveredProvince?.id],
            getLineColor: [hoveredProvince?.id],
            getLineWidth: [hoveredProvince?.id],
          },
        })
      );

      // Province name labels (on top of choropleth fills)
      if (provinceLabelData.length > 0) {
        allLayers.push(
          new TextLayer({
            id: "province-labels",
            data: provinceLabelData,
            getPosition: (d: { position: [number, number] }) => d.position,
            getText: (d: { name: string }) => d.name,
            getSize: 11,
            getColor: [22, 66, 91, 230],
            getTextAnchor: "middle" as const,
            getAlignmentBaseline: "center" as const,
            fontFamily: "Inter, system-ui, sans-serif",
            fontWeight: 600,
            outlineWidth: 3,
            outlineColor: [255, 255, 255, 200],
            pickable: false,
            billboard: false,
            sizeUnits: "pixels" as const,
            sizeMinPixels: 9,
            sizeMaxPixels: 14,
          })
        );
      }
    }

    // If choropleth-only mode, skip heatmap/hexagon layers
    if (layerMode === "choropleth") {
      return allLayers;
    }

    // Wait for WebGL context to be ready to avoid device.limits error
    if (!data.length || !glReady) return allLayers;

    // Terapkan filter year di CPU: data yang di-filter memakan waktu eksekusi yang sangat minim di browser modern
    const activeData = hoveredYear
      ? data.filter((d) => d.start_date.substring(0, 4) === hoveredYear.toString())
      : data;

    // Weight functions switch based on active metric
    const isArea = metrik === "luas_irisan";
    const getHeatWeight = isArea
      ? (d: FloodPoint) => Math.sqrt(d.area_km2)
      : (_d: FloodPoint) => 1;
    const getAggWeight = isArea
      ? (d: FloodPoint) => d.area_km2
      : (_d: FloodPoint) => 1;

    if (layerMode === "heatmap") {
      allLayers.push(
        new HeatmapLayer<FloodPoint>({
          id: "flood-heatmap",
          data: activeData,
          getPosition: (d) => [d.centroid_lon, d.centroid_lat],
          getWeight: getHeatWeight,
          radiusPixels: 60,
          intensity: 1.2,
          threshold: 0.05,
          colorRange: HEATMAP_COLOR_RANGE,
          pickable: false,
          updateTriggers: {
            getWeight: [isArea],
          },
        }),
        // Invisible hex layer on top for hoverable clusters
        new HexagonLayer<FloodPoint>({
          id: "flood-heatmap-pick",
          data: activeData,
          getPosition: (d) => [d.centroid_lon, d.centroid_lat],
          radius,
          coverage: 0.9,
          elevationScale: 0,
          extruded: false,
          pickable: true,
          onHover,
          opacity: 0,
          getColorWeight: getAggWeight,
          colorAggregation: "SUM",
          updateTriggers: {
            getColorWeight: [isArea],
          },
        })
      );
      return allLayers;
    }

    // hexagon mode
    allLayers.push(
      new HexagonLayer<FloodPoint>({
        id: "flood-hexagon",
        data: activeData,
        getPosition: (d) => [d.centroid_lon, d.centroid_lat],
        radius,
        coverage: 0.88,
        upperPercentile: 95,
        elevationScale: 50,
        elevationRange: [0, 3000],
        extruded: true,
        pickable: true,
        onHover,
        colorRange: HEATMAP_COLOR_RANGE,
        getColorWeight: getAggWeight,
        colorAggregation: "SUM",
        getElevationWeight: getAggWeight,
        elevationAggregation: "SUM",
        material: {
          ambient: 0.64,
          diffuse: 0.6,
          shininess: 32,
        },
        updateTriggers: {
          getColorWeight: [isArea],
          getElevationWeight: [isArea],
        },
      })
    );

    return allLayers;
  }, [data, layerMode, metrik, radius, onHover, glReady, hoveredYear, showChoropleth, choroplethGeoJSON, choroplethData, handleProvinceClick, handleProvinceHover, hoveredProvince, provinceLabelData]);

  // Controller settings: disable drag rotation for choropleth mode
  const controllerOptions = useMemo(
    () => ({
      dragRotate: layerMode === "hexagon",
      touchRotate: layerMode === "hexagon",
    }),
    [layerMode]
  );

  return (
    <div className="relative w-full h-full">
      <DeckGL
        ref={deckRef}
        viewState={viewState}
        onViewStateChange={handleViewStateChange}
        onDeviceInitialized={handleDeviceInitialized}
        onWebGLInitialized={handleDeviceInitialized}
        // Force WebGL2 — prevents deck.gl 9.x from attempting WebGPU, which
        // causes "this.device.limits.maxTextureDimension2D" before device ready
        deviceProps={{ type: "webgl" }}
        controller={controllerOptions}
        layers={layers}
        getTooltip={() => null}
      >
        <Map reuseMaps mapStyle={CARTO_VOYAGER} />
      </DeckGL>
      <MapTooltip hoverInfo={hoverInfo} />
      {hoveredProvince && (
        <ChoroplethTooltip
          provinceName={hoveredProvince.name}
          count={hoveredProvince.count}
          area={hoveredProvince.area}
          metrik={metrik}
          x={hoveredProvince.x}
          y={hoveredProvince.y}
        />
      )}
    </div>
  );
}
