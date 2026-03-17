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
      className="absolute bottom-4 left-0 right-0 z-30"
    >
      <div className="mx-auto max-w-5xl px-6 pb-5">
        <div className="rounded-xl border border-white/10 bg-gray-900/90 px-6 py-4 shadow-2xl backdrop-blur-md">
          <div className="flex items-center gap-4">
            {/* Controls */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={onPlayPause}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-white transition-all hover:bg-blue-500 hover:scale-105 active:scale-95"
              >
                <AnimatePresence mode="wait">
                  {playing ? (
                    <motion.div
                      key="pause"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                    >
                      <Pause className="h-4 w-4" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="play"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                    >
                      <Play className="h-4 w-4 ml-0.5" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
              <button
                onClick={onReset}
                className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Year badge */}
            <motion.div
              key={year}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex min-w-[90px] flex-col items-center"
            >
              <span className="text-2xl font-bold tabular-nums text-white">
                {year}
              </span>
              {eventCount !== undefined && (
                <span className="text-[10px] text-gray-500">
                  {eventCount.toLocaleString()} events
                </span>
              )}
            </motion.div>

            {/* Slider */}
            <div className="flex-1 flex flex-col gap-1">
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
                    className={`text-[9px] tabular-nums transition-colors ${
                      y === year
                        ? "text-blue-400 font-medium"
                        : y % 5 === 0
                        ? "text-gray-500"
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
