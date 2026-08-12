"use client";

import { useEffect } from "react";
import { withBasePath } from "@/lib/base-path";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      return;
    }

    if (!("serviceWorker" in navigator)) {
      return;
    }

    navigator.serviceWorker.register(withBasePath("/sw.js")).catch((error) => {
      console.error("Service worker registration failed:", error);
    });
  }, []);

  return null;
}
