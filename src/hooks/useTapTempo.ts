"use client";

import { useCallback, useRef } from "react";

/** Tap-tempo: averages the last few taps and reports a BPM from the 3rd tap. */
export function useTapTempo(onTempo: (bpm: number) => void) {
  const taps = useRef<number[]>([]);
  return useCallback(() => {
    const now = performance.now();
    const list = taps.current;
    if (list.length && now - list[list.length - 1]! > 2000) list.length = 0;
    list.push(now);
    if (list.length > 8) list.shift();
    if (list.length >= 3) {
      const intervals = list.slice(1).map((t, i) => t - list[i]!);
      const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const bpm = Math.round((60000 / avg) * 10) / 10;
      if (bpm >= 60 && bpm <= 200) onTempo(bpm);
    }
  }, [onTempo]);
}
