"use client";

import { useCallback, useEffect, useState } from "react";
import {
  type BeforeInstallPromptEvent,
  dismissInstallPrompt,
  isInstallPromptDismissed,
  isIosSafari,
  isStandaloneDisplayMode,
} from "@/lib/pwa/install";

export function usePwaInstall() {
  const [ready, setReady] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [iosSafari, setIosSafari] = useState(false);

  useEffect(() => {
    setInstalled(isStandaloneDisplayMode());
    setDismissed(isInstallPromptDismissed());
    setIosSafari(isIosSafari());
    setReady(true);

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const onAppInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  const dismiss = useCallback(() => {
    dismissInstallPrompt();
    setDismissed(true);
  }, []);

  const install = useCallback(async () => {
    if (!deferredPrompt) {
      return;
    }

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setInstalled(true);
    }

    setDeferredPrompt(null);
  }, [deferredPrompt]);

  const showInstallPrompt =
    ready && !installed && !dismissed && deferredPrompt !== null;
  const showIosGuide =
    ready && !installed && !dismissed && iosSafari && deferredPrompt === null;

  return {
    showInstallPrompt,
    showIosGuide,
    install,
    dismiss,
  };
}
