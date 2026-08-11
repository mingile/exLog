export const PWA_INSTALL_DISMISS_KEY = "pwa.installPrompt.dismissed.v1";

export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function isStandaloneDisplayMode(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone ===
      true
  );
}

export function isIosSafari(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const ua = window.navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);

  return isIOS && isSafari;
}

export function isInstallPromptDismissed(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return localStorage.getItem(PWA_INSTALL_DISMISS_KEY) === "true";
}

export function dismissInstallPrompt(): void {
  localStorage.setItem(PWA_INSTALL_DISMISS_KEY, "true");
}
