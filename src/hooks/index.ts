export { useDuckDBQuery, useDuckDBScalar, useFloodStats } from "./useDuckDBQuery";
export type { FloodStatsResult } from "./useDuckDBQuery";

// Extended stats hook with more metrics
export {
  useFloodStats as useFloodStatsExtended,
  type FloodStats,
  type UseFloodStatsResult,
} from "./useFloodStats";
