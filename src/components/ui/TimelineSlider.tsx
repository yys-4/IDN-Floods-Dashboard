"use client";

import { useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw } from "lucide-react";
import { Slider } from "@/components/ui/Slider";

interface TimelineSliderProps {
  year: number;
  minYear: number;
  maxYear: number;
  playing: boolean;
  onYearChange: (year: number) => void;
  onPlayPause: () => void;
  onReset: () => void;
  eventCount?: number;
}

export function TimelineSlider({
  year,
  minYear,
  maxYear,
  playing,
  onYearChange,
  onPlayPause,
  onReset,
  eventCount,
}: TimelineSliderProps) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-advance when playing
  useEffect(() => {
    if (playing) {
      intervalRef.current = setInterval(() => {
        onYearChange(year >= maxYear ? minYear : year + 1);
      }, 1200);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [playing, year, minYear, maxYear, onYearChange]);

  const handleSliderChange = useCallback(
    (value: number[]) => {
      onYearChange(value[0]);
    },
    [onYearChange]
  );

  // Tick marks
  const years = Array.from(
    { length: maxYear - minYear + 1 },
    (_, i) => minYear + i
  );

  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", damping: 20, stiffness: 200, delay: 0.3 }}
      className="absolute bottom-3 left-0 right-0 z-30"
    >
      <div className="mx-auto max-w-4xl px-4 pb-2">
        <div className="rounded-xl border border-[#16425B]/12 bg-white/92 px-4 py-2.5 shadow-xl backdrop-blur-md">
          <div className="flex items-center gap-3">
            {/* Controls */}
            <div className="flex items-center gap-1">
              <button
                onClick={onPlayPause}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-[#2F6690] text-white transition-all hover:bg-[#3A7CA5] hover:scale-105 active:scale-95"
              >
                <AnimatePresence mode="wait">
                  {playing ? (
                    <motion.div
                      key="pause"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                    >
                      <Pause className="h-3.5 w-3.5" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="play"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                    >
                      <Play className="h-3.5 w-3.5 ml-0.5" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
              <button
                onClick={onReset}
                className="flex h-6 w-6 items-center justify-center rounded-full text-[#6b8a9e] transition-colors hover:bg-[#81C3D7]/15 hover:text-[#16425B]"
              >
                <RotateCcw className="h-3 w-3" />
              </button>
            </div>

            {/* Year badge */}
            <motion.div
              key={year}
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-baseline gap-1.5 min-w-[64px]"
            >
              <span className="text-lg font-bold tabular-nums text-[#16425B] leading-none">
                {year}
              </span>
              {eventCount !== undefined && (
                <span className="text-[9px] text-[#9cb3c2] tabular-nums">
                  {eventCount.toLocaleString()}ev
                </span>
              )}
            </motion.div>

            {/* Slider */}
            <div className="flex-1 flex flex-col gap-0.5">
              <Slider
                value={[year]}
                min={minYear}
                max={maxYear}
                step={1}
                onValueChange={handleSliderChange}
              />

              {/* Tick labels */}
              <div className="flex justify-between px-0.5">
                {years.map((y) => (
                  <span
                    key={y}
                    className={`text-[8px] tabular-nums transition-colors leading-none ${
                      y === year
                        ? "text-[#2F6690] font-medium"
                        : y % 5 === 0
                        ? "text-[#9cb3c2]"
                        : "text-transparent"
                    }`}
                  >
                    {y % 5 === 0 || y === year ? String(y).slice(-2) : "·"}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
