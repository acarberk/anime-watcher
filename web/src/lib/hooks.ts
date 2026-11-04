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

export type VisibleArea = { bottom: number; height: number; keyboard: boolean };

/** The part of the screen a fixed bottom sheet can use. With the on-screen keyboard up, browsers shrink the visual
 *  viewport and may or may not shrink the layout viewport too, so both are measured: `bottom` = px from the layout
 *  bottom to the visible bottom, `height` = visible height. */
export function useVisibleArea(active: boolean): VisibleArea | null {
  const [area, setArea] = useState<VisibleArea | null>(null);
  useEffect(() => {
    const vv = window.visualViewport;
    if (!active || !vv) return;
    let full = vv.height;
    const update = () => {
      if (vv.scale > 1.05) return; // pinch-zoom, not the keyboard
      full = Math.max(full, vv.height);
      // ponytail: >120px shorter than at open = keyboard (toolbars collapsing move less); only drives padding
      setArea({ bottom: Math.max(0, innerHeight - vv.height - vv.offsetTop), height: vv.height, keyboard: full - vv.height > 120 });
    };
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
      setArea(null);
    };
  }, [active]);
  return area;
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
