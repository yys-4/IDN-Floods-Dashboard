"use client";

import type { MetrikValue } from "@/types/flood";

interface ChoroplethTooltipProps {
  provinceName: string | null;
  count: number;
  area: number;
  metrik: MetrikValue;
  x: number;
  y: number;
}

const METRIK_LABELS: Record<MetrikValue, string> = {
  jumlah_peristiwa: "Jumlah peristiwa unik",
  hari_banjir: "Hari banjir",
  luas_irisan: "Luas terdampak",
  rasio_cakupan: "Rasio cakupan",
};

function formatNumber(value: number): string {
  return new Intl.NumberFormat("id-ID").format(value);
}

function formatArea(value: number): string {
  return `${new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 }).format(value)} km²`;
}

export function ChoroplethTooltip({
  provinceName,
  count,
  area,
  metrik,
  x,
  y,
}: ChoroplethTooltipProps) {
  if (!provinceName) return null;

  const isAreaMetric = metrik === "luas_irisan";
  const displayValue = isAreaMetric ? formatArea(area) : formatNumber(count);
  const metrikLabel = METRIK_LABELS[metrik] || "Jumlah peristiwa";

  return (
    <div
      className="pointer-events-none absolute z-50 rounded-lg border border-[#16425B]/12 bg-white/98 px-3 py-2 shadow-xl backdrop-blur-sm"
      style={{
        left: x + 16,
        top: y + 16,
      }}
    >
      <div className="font-semibold text-[#16425B] text-sm">{provinceName}</div>
      <div className="text-xs text-[#6b8a9e] mt-0.5">
        {metrikLabel}: <span className="text-[#2F6690] font-medium">{displayValue}</span>
      </div>
    </div>
  );
}
