"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import Map from "react-map-gl/maplibre";
import DeckGL from "@deck.gl/react";
import { HeatmapLayer } from "@deck.gl/aggregation-layers";
import { HexagonLayer } from "@deck.gl/aggregation-layers";
import type { FloodPoint, LayerMode, ViewportBounds, MetrikValue } from "@/types/flood";
import type { PickingInfo } from "@deck.gl/core";
import { MapTooltip } from "./MapTooltip";
import "maplibre-gl/dist/maplibre-gl.css";

// ── Constants ────────────────────────────────────────────────────────────────

const CARTO_DARK_MATTER =
  "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

const INITIAL_VIEW_STATE = {
  longitude: 118.0,
  latitude: -2.5,
  zoom: 4.5,
  pitch: 45,
  bearing: 0,
};

// ── Color ramp (blue → cyan → green → yellow → red) ────────────────────────

const HEATMAP_COLOR_RANGE: [number, number, number][] = [
  [1, 152, 189],
  [73, 227, 206],
  [216, 254, 181],
  [254, 237, 177],
  [254, 173, 84],
  [209, 55, 78],
];

// ── Props ────────────────────────────────────────────────────────────────────

interface FloodMapProps {
  data: FloodPoint[];
  layerMode: LayerMode;
  metrik?: MetrikValue;
  radius?: number;
  onBoundsChange?: (bounds: ViewportBounds) => void;
}

// ── Component ────────────────────────────────────────────────────────────────

export function FloodMap({
  data,
  layerMode,
  metrik = "jumlah_peristiwa",
  radius = 12000,
  onBoundsChange,
}: FloodMapProps) {
  const [hoverInfo, setHoverInfo] = useState<PickingInfo | null>(null);
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);
  const [glReady, setGlReady] = useState(false);
  const boundsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const deckRef = useRef<any>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onHover = useCallback((info: any) => {
    setHoverInfo(info.object ? info : null);
    return true;
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

  // Handle view state changes with debounce
  const handleViewStateChange = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (params: any) => {
      const newViewState = params.viewState;
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

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (boundsTimeoutRef.current) {
        clearTimeout(boundsTimeoutRef.current);
      }
    };
  }, []);

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

  const layers = useMemo(() => {
    // Wait for WebGL context to be ready to avoid device.limits error
    if (!data.length || !glReady) return [];

    // Weight functions switch based on active metric
    const isArea = metrik === "luas_irisan";
    const getHeatWeight = isArea
      ? (d: FloodPoint) => Math.sqrt(d.area_km2)
      : (_d: FloodPoint) => 1;
    const getAggWeight = isArea
      ? (d: FloodPoint) => d.area_km2
      : (_d: FloodPoint) => 1;

    if (layerMode === "heatmap") {
      return [
        new HeatmapLayer<FloodPoint>({
          id: "flood-heatmap",
          data,
          getPosition: (d) => [d.centroid_lon, d.centroid_lat],
          getWeight: getHeatWeight,
          radiusPixels: 60,
          intensity: 1.2,
          threshold: 0.05,
          colorRange: HEATMAP_COLOR_RANGE,
          pickable: false,
        }),
        // Invisible hex layer on top for hoverable clusters
        new HexagonLayer<FloodPoint>({
          id: "flood-heatmap-pick",
          data,
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
        }),
      ];
    }

    // hexagon mode
    return [
      new HexagonLayer<FloodPoint>({
        id: "flood-hexagon",
        data,
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
      }),
    ];
  }, [data, layerMode, metrik, radius, onHover, glReady]);

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
        controller={true}
        layers={layers}
        getTooltip={() => null}
      >
        <Map reuseMaps mapStyle={CARTO_DARK_MATTER} />
      </DeckGL>
      <MapTooltip hoverInfo={hoverInfo} />
    </div>
  );
}
