"use client";

import { useCallback, useEffect, useState } from "react";

export function useTimerTick(active: boolean = true): number {
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => {
    setTick((value) => value + 1);
  }, []);

  useEffect(() => {
    if (!active) return;

    refresh();
    const intervalId = window.setInterval(refresh, 1000);

    return () => window.clearInterval(intervalId);
  }, [active, refresh]);

  useEffect(() => {
    if (!active) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refresh();
      }
    };

    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        refresh();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pageshow", handlePageShow);
    window.addEventListener("focus", refresh);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pageshow", handlePageShow);
      window.removeEventListener("focus", refresh);
    };
  }, [active, refresh]);

  return tick;
}
