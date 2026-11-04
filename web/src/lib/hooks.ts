import { useEffect, useState, useSyncExternalStore } from "react";

export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mql = matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    () => matchMedia(query).matches,
  );
}

/** md breakpoint and up: dialogs instead of bottom sheets */
export const useIsDesktop = () => useMediaQuery("(min-width: 48rem)");

export function useDebounced<T>(value: T, ms = 300): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export type Keyboard = { bottom: number; height: number };

/** On-screen keyboard. iOS and Android shrink only the visual viewport, so a fixed bottom sheet ends up behind
 *  the keyboard. While it is up: `bottom` = px from the layout bottom to the visible bottom, `height` = visible
 *  height. null while it is down. */
export function useKeyboard(active: boolean): Keyboard | null {
  const [kb, setKb] = useState<Keyboard | null>(null);
  useEffect(() => {
    const vv = window.visualViewport;
    if (!active || !vv) return;
    // ponytail: >80px covered = keyboard (toolbar jitter is smaller); pinch-zoom is excluded by scale
    const update = () =>
      setKb(innerHeight - vv.height > 80 && vv.scale < 1.05 ? { bottom: innerHeight - vv.height - vv.offsetTop, height: vv.height } : null);
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
      setKb(null);
    };
  }, [active]);
  return kb;
}

/** Re-renders every `ms`, for countdowns */
export function useNow(ms = 60_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return now;
}
