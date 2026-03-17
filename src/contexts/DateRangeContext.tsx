"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DateRange {
  /** Start date in YYYY-MM-DD or YYYY-MM format */
  startDate: string;
  /** End date in YYYY-MM-DD or YYYY-MM format */
  endDate: string;
}

export type DateRangeSource = "yearRange" | "timeline" | "chartHover" | "chartClick";

interface DateRangeContextValue {
  /** Currently active date range for filtering */
  dateRange: DateRange;
  /** Source of the current date range */
  source: DateRangeSource;
  /** Whether the user is actively hovering over the chart */
  isHovering: boolean;
  /** Selected month from chart click (YYYY-MM format) */
  selectedMonth: string | null;
  /** Update date range from year slider */
  setYearRange: (startYear: number, endYear: number) => void;
  /** Update date range from timeline */
  setTimelineYear: (year: number) => void;
  /** Update date range from chart hover (debounced internally) */
  setHoverMonth: (month: string | null) => void;
  /** Select/deselect a month from chart click */
  setSelectedMonth: (month: string | null) => void;
  /** Clear all selections and reset to year range */
  resetToYearRange: () => void;
  /** Current year range (for reference) */
  yearRange: [number, number];
  /** Whether timeline is active */
  timelineActive: boolean;
  /** Current timeline year */
  timelineYear: number;
}

// ── Context ───────────────────────────────────────────────────────────────────

const DateRangeContext = createContext<DateRangeContextValue | null>(null);

// ── Helper: get next month string ─────────────────────────────────────────────

function nextMonthStr(yearMonth: string): string {
  const [y, m] = yearMonth.split("-").map(Number);
  const nm = m === 12 ? 1 : m + 1;
  const ny = m === 12 ? y + 1 : y;
  return `${ny}-${String(nm).padStart(2, "0")}`;
}

// ── Provider ──────────────────────────────────────────────────────────────────

interface DateRangeProviderProps {
  children: ReactNode;
  initialYearMin?: number;
  initialYearMax?: number;
}

export function DateRangeProvider({
  children,
  initialYearMin = 2000,
  initialYearMax = 2026,
}: DateRangeProviderProps) {
  // Base state
  const [yearRange, setYearRangeState] = useState<[number, number]>([
    initialYearMin,
    initialYearMax,
  ]);
  const [timelineYear, setTimelineYearState] = useState(initialYearMin);
  const [timelineActive, setTimelineActive] = useState(false);
  const [selectedMonth, setSelectedMonthState] = useState<string | null>(null);
  const [hoverMonth, setHoverMonthState] = useState<string | null>(null);
  const [isHovering, setIsHovering] = useState(false);

  // Compute active date range based on priority:
  // chartClick (selectedMonth) > chartHover > timeline > yearRange
  const { dateRange, source } = useMemo(() => {
    if (selectedMonth) {
      return {
        dateRange: {
          startDate: `${selectedMonth}-01`,
          endDate: `${nextMonthStr(selectedMonth)}-01`,
        },
        source: "chartClick" as DateRangeSource,
      };
    }
    if (hoverMonth && isHovering) {
      return {
        dateRange: {
          startDate: `${hoverMonth}-01`,
          endDate: `${nextMonthStr(hoverMonth)}-01`,
        },
        source: "chartHover" as DateRangeSource,
      };
    }
    if (timelineActive) {
      return {
        dateRange: {
          startDate: `${timelineYear}-01-01`,
          endDate: `${timelineYear}-12-31`,
        },
        source: "timeline" as DateRangeSource,
      };
    }
    return {
      dateRange: {
        startDate: `${yearRange[0]}-01-01`,
        endDate: `${yearRange[1]}-12-31`,
      },
      source: "yearRange" as DateRangeSource,
    };
  }, [selectedMonth, hoverMonth, isHovering, timelineActive, timelineYear, yearRange]);

  // Handlers
  const setYearRange = useCallback((startYear: number, endYear: number) => {
    setYearRangeState([startYear, endYear]);
    setTimelineActive(false);
    setSelectedMonthState(null);
    setHoverMonthState(null);
    setIsHovering(false);
  }, []);

  const setTimelineYear = useCallback((year: number) => {
    setTimelineYearState(year);
    setTimelineActive(true);
    setSelectedMonthState(null);
  }, []);

  const setHoverMonth = useCallback((month: string | null) => {
    if (month) {
      setHoverMonthState(month);
      setIsHovering(true);
    } else {
      setIsHovering(false);
      // Keep hoverMonth for smooth transitions, it will be ignored when isHovering is false
    }
  }, []);

  const setSelectedMonth = useCallback((month: string | null) => {
    setSelectedMonthState(month);
    if (month) {
      setTimelineActive(false);
    }
  }, []);

  const resetToYearRange = useCallback(() => {
    setTimelineActive(false);
    setSelectedMonthState(null);
    setHoverMonthState(null);
    setIsHovering(false);
  }, []);

  const value = useMemo<DateRangeContextValue>(
    () => ({
      dateRange,
      source,
      isHovering,
      selectedMonth,
      setYearRange,
      setTimelineYear,
      setHoverMonth,
      setSelectedMonth,
      resetToYearRange,
      yearRange,
      timelineActive,
      timelineYear,
    }),
    [
      dateRange,
      source,
      isHovering,
      selectedMonth,
      setYearRange,
      setTimelineYear,
      setHoverMonth,
      setSelectedMonth,
      resetToYearRange,
      yearRange,
      timelineActive,
      timelineYear,
    ]
  );

  return (
    <DateRangeContext.Provider value={value}>
      {children}
    </DateRangeContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useDateRange(): DateRangeContextValue {
  const context = useContext(DateRangeContext);
  if (!context) {
    throw new Error("useDateRange must be used within a DateRangeProvider");
  }
  return context;
}
