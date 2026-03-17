"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import {
  Search,
  Droplets,
  Database,
  Map,
  Clock,
  LayoutGrid,
  BarChart2,
  Mail,
  Info,
  Calendar,
  ExternalLink,
  MapPin,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { Slider } from "@/components/ui/Slider";
import { PROVINCES, INTENSITY_OPTIONS, KABUPATEN_MAP } from "@/lib/geography";
import type {
  FloodStats,
  GeoLevel,
  MetrikValue,
} from "@/types/flood";
import type { ProvinceValue, IntensityValue } from "@/lib/geography";

// ── Re-export types used externally ──────────────────────────────────────────
export type { ProvinceValue, IntensityValue };

// ── Geo-level & metric options ────────────────────────────────────────────────

const GEO_LEVEL_OPTIONS: { value: GeoLevel; label: string }[] = [
  { value: "provinsi",  label: "Provinsi"  },
  { value: "kabupaten", label: "Kabupaten" },
  { value: "kecamatan", label: "Kecamatan" },
];

const METRIK_OPTIONS: { value: MetrikValue; label: string }[] = [
  { value: "jumlah_peristiwa", label: "Jumlah peristiwa unik"  },
  { value: "hari_banjir",      label: "Hari banjir"             },
  { value: "luas_irisan",      label: "Luas irisan (km²)"       },
  { value: "rasio_cakupan",    label: "Rasio cakupan maks"      },
];

// ── Props ─────────────────────────────────────────────────────────────────────

interface SidebarProps {
  // Data
  stats: FloodStats | null;
  dataLoading: boolean;
  visibleCount: number;
  unitCount: number;

  // Filters
  province: ProvinceValue;
  yearRange: [number, number];
  intensity: IntensityValue;
  geoLevel: GeoLevel;
  metrik: MetrikValue;
  yearMin: number;
  yearMax: number;

  // Timeline
  timelineActive: boolean;
  timelineYear: number;

  // Month selection (from FloodTrendChart)
  selectedMonth?: string | null;

  // Callbacks
  onProvinceChange: (v: ProvinceValue) => void;
  onYearRangeChange: (values: number[]) => void;
  onIntensityChange: (v: IntensityValue) => void;
  onGeoLevelChange: (v: GeoLevel) => void;
  onMetrikChange: (v: MetrikValue) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function Sidebar({
  stats,
  dataLoading,
  visibleCount,
  unitCount,
  province,
  yearRange,
  intensity,
  geoLevel,
  metrik,
  yearMin,
  yearMax,
  timelineActive,
  timelineYear,
  selectedMonth,
  onProvinceChange,
  onYearRangeChange,
  onIntensityChange,
  onGeoLevelChange,
  onMetrikChange,
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Build search results from provinces + kabupaten
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];

    type SearchResult = { label: string; provinceValue: ProvinceValue; type: "provinsi" | "kabupaten" };
    const results: SearchResult[] = [];

    // Search provinces
    for (const p of PROVINCES) {
      if (p.value === "all") continue;
      if (p.label.toLowerCase().includes(q)) {
        results.push({ label: p.label, provinceValue: p.value, type: "provinsi" });
      }
    }

    // Search kabupaten
    for (const [provKey, kabList] of Object.entries(KABUPATEN_MAP)) {
      const prov = PROVINCES.find((p) => p.value === provKey);
      if (!prov) continue;
      for (const kab of kabList) {
        if (kab.name.toLowerCase().includes(q)) {
          results.push({
            label: `${kab.name}, ${prov.label}`,
            provinceValue: prov.value as ProvinceValue,
            type: "kabupaten",
          });
        }
      }
    }

    return results.slice(0, 8);
  }, [searchQuery]);

  const handleSearchSelect = (provinceValue: ProvinceValue) => {
    onProvinceChange(provinceValue);
    setSearchQuery("");
    setSearchFocused(false);
  };

  // Format date range for Jendela Waktu
  // Priority: selectedMonth > timelineActive > stats date range > yearRange
  const timeWindow = (() => {
    if (selectedMonth) {
      const [y, m] = selectedMonth.split("-");
      const BULAN_SINGKAT = [
        "Jan","Feb","Mar","Apr","Mei","Jun",
        "Jul","Agu","Sep","Okt","Nov","Des",
      ];
      return `${BULAN_SINGKAT[+m - 1]} ${y}`;
    }
    if (timelineActive) return `${timelineYear}`;
    if (stats?.min_date && stats?.max_date)
      return `${stats.min_date.slice(0, 4)} – ${stats.max_date.slice(0, 4)}`;
    return `${yearRange[0]} – ${yearRange[1]}`;
  })();

  return (
    <aside
      className="flex-none w-[300px] min-w-[300px] max-w-[300px] border-r border-[#16425B]/10 bg-white/95 backdrop-blur-md overflow-y-auto overflow-x-hidden z-20 flex flex-col"
      style={{ contain: "layout size", willChange: "auto" }}
    >
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="relative px-5 pt-5 pb-4 border-b border-[#16425B]/8">
        {/* subtle top glow */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#3A7CA5]/30 to-transparent" />

        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#2F6690] to-[#81C3D7] shadow-lg shadow-[#2F6690]/25">
            <Droplets className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-[#16425B] leading-none">
              Peta Banjir Indonesia
            </h1>
            <p className="text-[10px] text-[#3A7CA5] mt-0.5 font-medium">
              2000 – 2026
            </p>
          </div>
        </div>

        {/* Description */}
        <p className="text-[11px] text-[#6b8a9e] leading-relaxed mb-3">
          Visualisasi banjir berbasis data satelit{" "}
          <span className="text-[#2F6690] font-medium">Groundsource</span>{" "}
          — deteksi permukaan genangan air dari citra radar spasial resolusi
          tinggi.
        </p>

        {/* Contact */}
        <div className="flex items-center gap-1.5 rounded-lg bg-[#16425B]/[0.04] border border-[#16425B]/[0.08] px-2.5 py-1.5">
          <Mail className="w-3 h-3 text-[#9cb3c2] shrink-0" />
          <a
            href="mailto:muhammadayyas1003@gmail.com"
            className="text-[10px] text-[#6b8a9e] hover:text-[#2F6690] transition-colors truncate"
          >
            Muhammad Ayyas · muhammadayyas1003@gmail.com
          </a>
        </div>
      </div>

      <div className="px-4 py-4 space-y-5 flex-1">
        {/* ── Search ──────────────────────────────────────────────────────── */}
        <div className="relative" ref={searchRef}>
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9cb3c2] pointer-events-none z-10" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            placeholder="Cari lokasi..."
            className="w-full rounded-lg border border-[#16425B]/10 bg-[#16425B]/[0.03] pl-8 pr-3 py-2 text-[12px] text-[#16425B] placeholder-[#9cb3c2] outline-none transition-all focus:border-[#3A7CA5]/40 focus:bg-[#16425B]/[0.05] focus:shadow-[0_0_0_3px_rgba(58,124,165,0.08)]"
          />
          {/* Search results dropdown */}
          {searchFocused && searchResults.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 z-50 rounded-lg border border-[#16425B]/10 bg-white/98 backdrop-blur-md shadow-2xl overflow-hidden">
              {searchResults.map((r, i) => (
                <button
                  key={`${r.provinceValue}-${r.label}-${i}`}
                  onClick={() => handleSearchSelect(r.provinceValue)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left text-[11px] text-[#2F6690] hover:bg-[#81C3D7]/10 hover:text-[#16425B] transition-colors"
                >
                  <MapPin className="w-3 h-3 shrink-0 text-[#3A7CA5]" />
                  <span className="truncate">{r.label}</span>
                  <span className="ml-auto text-[9px] text-[#9cb3c2] uppercase shrink-0">
                    {r.type}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Ringkasan ────────────────────────────────────────────────────── */}
        <SidebarSection
          title="Ringkasan"
          icon={<LayoutGrid className="w-3.5 h-3.5" />}
        >
          <div className="grid grid-cols-2 gap-2">
            <KPICard
              icon={<Database className="w-3 h-3" />}
              label={metrik === "luas_irisan" ? "TOTAL LUAS (km²)" : "TOTAL PERISTIWA"}
              value={
                dataLoading
                  ? null
                  : stats
                  ? metrik === "luas_irisan"
                    ? stats.total_area.toLocaleString("id-ID", { maximumFractionDigits: 0 })
                    : stats.total_records.toLocaleString("id-ID")
                  : "—"
              }
              accent="navy"
            />
            <KPICard
              icon={<BarChart2 className="w-3 h-3" />}
              label="UNIT DENGAN DATA"
              value={
                dataLoading
                  ? null
                  : unitCount > 0
                  ? unitCount.toLocaleString("id-ID")
                  : "—"
              }
              accent="deep"
            />
            <KPICard
              icon={<Map className="w-3 h-3" />}
              label="UNIT DI PETA"
              value={
                dataLoading
                  ? null
                  : visibleCount.toLocaleString("id-ID")
              }
              accent="medium"
            />
            <KPICard
              icon={<Clock className="w-3 h-3" />}
              label="JENDELA WAKTU"
              value={dataLoading ? null : timeWindow}
              accent="sky"
            />
          </div>
        </SidebarSection>

        {/* ── Filter Geografi ──────────────────────────────────────────────── */}
        <SidebarSection
          title="Filter"
          icon={<Map className="w-3.5 h-3.5" />}
        >
          <div className="space-y-3">
            {/* Level Geografi */}
            <LabeledControl label="Level Geografi">
              <Select
                value={geoLevel}
                onValueChange={(v) => onGeoLevelChange(v as GeoLevel)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GEO_LEVEL_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </LabeledControl>

            {/* Metrik */}
            <LabeledControl label="Metrik">
              <Select
                value={metrik}
                onValueChange={(v) => onMetrikChange(v as MetrikValue)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {METRIK_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </LabeledControl>

            {/* Province */}
            <LabeledControl label="Provinsi">
              <Select
                value={province}
                onValueChange={(v) => onProvinceChange(v as ProvinceValue)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROVINCES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </LabeledControl>

            {/* Intensity */}
            <LabeledControl label="Intensitas Peristiwa">
              <Select
                value={intensity}
                onValueChange={(v) => onIntensityChange(v as IntensityValue)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INTENSITY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </LabeledControl>

            {/* Year Range */}
            <LabeledControl label="Rentang Tahun">
              <div className="flex items-center justify-between text-[11px] mb-2">
                <span className="tabular-nums font-semibold text-[#2F6690]">
                  {yearRange[0]}
                </span>
                <span className="text-[#9cb3c2]">–</span>
                <span className="tabular-nums font-semibold text-[#2F6690]">
                  {yearRange[1]}
                </span>
              </div>
              <Slider
                value={yearRange}
                min={yearMin}
                max={yearMax}
                step={1}
                onValueChange={onYearRangeChange}
              />
              {timelineActive && (
                <p className="mt-1.5 flex items-center gap-1 text-[10px] text-[#3A7CA5]/70">
                  <Calendar className="w-3 h-3" />
                  Timeline aktif — menampilkan {timelineYear} saja
                </p>
              )}
            </LabeledControl>
          </div>
        </SidebarSection>
      </div>

      {/* ── Methodology Section ─────────────────────────────────────────────── */}
      <MethodologySection />
    </aside>
  );
}

// ── Section wrapper ───────────────────────────────────────────────────────────

function SidebarSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2.5">
        <span className="text-[#9cb3c2]">{icon}</span>
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6b8a9e]">
          {title}
        </h2>
      </div>
      {children}
    </div>
  );
}

// ── Labeled control ───────────────────────────────────────────────────────────

function LabeledControl({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] text-[#6b8a9e] font-medium">{label}</p>
      {children}
    </div>
  );
}

// ── KPI Card ──────────────────────────────────────────────────────────────────

type Accent = "navy" | "deep" | "medium" | "sky";

const ACCENT_STYLES: Record<Accent, { border: string; icon: string; val: string; bg: string }> = {
  navy:   { border: "border-[#16425B]/15", icon: "text-[#16425B]", val: "text-[#16425B]", bg: "bg-[#16425B]/[0.03]" },
  deep:   { border: "border-[#2F6690]/15", icon: "text-[#2F6690]", val: "text-[#2F6690]", bg: "bg-[#2F6690]/[0.03]" },
  medium: { border: "border-[#3A7CA5]/15", icon: "text-[#3A7CA5]", val: "text-[#3A7CA5]", bg: "bg-[#3A7CA5]/[0.03]" },
  sky:    { border: "border-[#81C3D7]/20", icon: "text-[#3A7CA5]", val: "text-[#2F6690]", bg: "bg-[#81C3D7]/[0.05]" },
};

function KPICard({
  icon,
  label,
  value,
  accent = "navy",
}: {
  icon: React.ReactNode;
  label: string;
  value: string | null;
  accent?: Accent;
}) {
  const styles = ACCENT_STYLES[accent];

  return (
    <div
      className={`rounded-xl border ${styles.border} ${styles.bg} px-3 py-2.5`}
    >
      <div className={`flex items-center gap-1 ${styles.icon} mb-1.5`}>
        {icon}
        <span className="text-[9px] font-semibold uppercase tracking-[0.08em] text-[#6b8a9e]">
          {label}
        </span>
      </div>
      <div className={`text-sm font-bold tabular-nums ${styles.val}`}>
        {value === null ? (
          <div className="h-4 w-14 animate-pulse rounded bg-[#16425B]/10" />
        ) : (
          value
        )}
      </div>
    </div>
  );
}

// ── Methodology Section ───────────────────────────────────────────────────────

function MethodologySection() {
  return (
    <div className="px-4 pt-4 pb-5 border-t border-[#16425B]/8 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-1.5">
        <Info className="w-3 h-3 text-[#9cb3c2] shrink-0" />
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6b8a9e]">
          Metodologi
        </h2>
      </div>

      {/* Narrative */}
      <p className="text-[10px] text-[#6b8a9e] leading-relaxed">
        Dashboard ini menggabungkan rekaman banjir{" "}
        <a
          href="https://groundsource.ai"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#3A7CA5] hover:text-[#2F6690] transition-colors"
        >
          Groundsource
        </a>{" "}
        (didukung Google) dengan batas administrasi Indonesia untuk
        memberikan gambaran spasial genangan air yang akurat.
      </p>

      {/* Bullet points */}
      <ul className="space-y-1.5">
        {[
          "Tersedia hingga tingkat Provinsi dan Kabupaten/Kota.",
          "Data bersifat informatif — bukan sistem peringatan dini banjir.",
          "Sumber: citra radar satelit resolusi tinggi (2000–2026).",
        ].map((item) => (
          <li
            key={item}
            className="flex items-start gap-1.5 text-[10px] text-[#6b8a9e] leading-relaxed"
          >
            <span className="mt-[5px] h-1 w-1 shrink-0 rounded-full bg-[#3A7CA5]/40" />
            {item}
          </li>
        ))}
      </ul>

      {/* Attribution links */}
      <div className="flex items-center gap-2 flex-wrap">
        <a
          href="https://groundsource.ai"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-0.5 text-[9px] text-[#9cb3c2] hover:text-[#3A7CA5] transition-colors"
        >
          Groundsource Data
          <ExternalLink className="w-2.5 h-2.5" />
        </a>
        <span className="text-[#9cb3c2] text-[9px]">·</span>
        <a
          href="#"
          className="flex items-center gap-0.5 text-[9px] text-[#9cb3c2] hover:text-[#3A7CA5] transition-colors"
        >
          Proyek Ini
          <ExternalLink className="w-2.5 h-2.5" />
        </a>
      </div>

      {/* Copyright */}
      <p className="text-[9px] text-[#9cb3c2] pt-1.5 border-t border-[#16425B]/6 leading-relaxed">
        © 2026 Muhammad Ayyas. All rights reserved.
      </p>
    </div>
  );
}
