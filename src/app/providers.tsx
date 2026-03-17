"use client";

import { DuckDBProvider } from "@/contexts/DuckDBContext";
import type { ReactNode } from "react";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return <DuckDBProvider>{children}</DuckDBProvider>;
}
