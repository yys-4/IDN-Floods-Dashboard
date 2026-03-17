"use client";

import type { PickingInfo } from "@deck.gl/core";
import type { FloodPoint } from "@/types/flood";
import { Droplets, Calendar, Layers, Ruler } from "lucide-react";

interface MapTooltipProps {
  hoverInfo: PickingInfo | null;
}

/**
 * Tooltip for HexagonLayer clusters.
 * Shows aggregated info: event count, date range, total area.
 */
export function MapTooltip({ hoverInfo }: MapTooltipProps) {
  if (!hoverInfo?.object) return null;

  const { x, y, object } = hoverInfo;

  // HexagonLayer aggregated object
  const points: FloodPoint[] = object.points?.map(
    (p: { source: FloodPoint }) => p.source
  ) ?? [];

  if (points.length === 0) return null;

  const count = points.length;
  const totalArea = points.reduce((s, p) => s + p.area_km2, 0);
  const avgArea = totalArea / count;

  // Date range within cluster
  const dates = points.map((p) => p.start_date).filter(Boolean).sort();
  const earliest = dates[0] ?? "—";
  const latest = dates[dates.length - 1] ?? "—";

  // Severity label
  let severity: { label: string; color: string };
  if (totalArea > 5000) {
    severity = { label: "Extreme", color: "text-red-500" };
  } else if (totalArea > 1000) {
    severity = { label: "Severe", color: "text-orange-500" };
  } else if (totalArea > 200) {
    severity = { label: "Moderate", color: "text-amber-500" };
  } else {
    severity = { label: "Minor", color: "text-emerald-600" };
  }

  return (
    <div
      className="pointer-events-none absolute z-50"
      style={{ left: x, top: y }}
    >
      <div className="ml-4 -mt-2 min-w-[220px] rounded-lg border border-[#16425B]/12 bg-white/98 px-4 py-3 text-sm text-[#16425B] shadow-xl backdrop-blur-sm">
        {/* Header */}
        <div className="mb-2 flex items-center justify-between border-b border-[#16425B]/8 pb-2">
          <span className="font-semibold">Flood Cluster</span>
          <span className={`text-xs font-medium ${severity.color}`}>
            {severity.label}
          </span>
        </div>

        {/* Stats */}
        <div className="space-y-1.5 text-[13px]">
          <Row icon={<Layers className="w-3.5 h-3.5" />} label="Events" value={count.toLocaleString()} />
          <Row
            icon={<Ruler className="w-3.5 h-3.5" />}
            label="Total area"
            value={`${totalArea.toFixed(1)} km²`}
          />
          <Row
            icon={<Droplets className="w-3.5 h-3.5" />}
            label="Avg area"
            value={`${avgArea.toFixed(1)} km²`}
          />
          <Row
            icon={<Calendar className="w-3.5 h-3.5" />}
            label="Date range"
            value={earliest === latest ? earliest : `${earliest} — ${latest}`}
          />
        </div>

        {/* Sample events */}
        {count > 0 && (
          <div className="mt-2 border-t border-[#16425B]/8 pt-2">
            <span className="text-[11px] text-[#6b8a9e]">
              Sample events:
            </span>
            <ul className="mt-1 space-y-0.5">
              {points.slice(0, 3).map((p) => (
                <li key={p.uuid} className="text-[11px] text-[#2F6690]">
                  {p.start_date} — {p.area_km2.toFixed(1)} km²
                </li>
              ))}
              {count > 3 && (
                <li className="text-[11px] text-[#9cb3c2]">
                  +{count - 3} more events
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="flex items-center gap-1.5 text-[#6b8a9e]">
        {icon}
        {label}
      </span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
