"use client";

import { DuckDBProvider } from "@/contexts/DuckDBContext";
import { DateRangeProvider } from "@/contexts/DateRangeContext";
import type { ReactNode } from "react";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <DuckDBProvider>
      <DateRangeProvider initialYearMin={2000} initialYearMax={2026}>
        {children}
      </DateRangeProvider>
    </DuckDBProvider>
  );
}
