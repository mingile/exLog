import { isStandaloneDisplayMode } from "@/lib/pwa/install";

export function isIOS(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return /iPad|iPhone|iPod/.test(window.navigator.userAgent);
}

export function isStandalonePwa(): boolean {
  return isStandaloneDisplayMode();
}

export function shouldUseSafariHandoffFlow(): boolean {
  return isStandalonePwa() && isIOS();
}

export function toSafariSchemeUrl(httpsUrl: string): string {
  return httpsUrl.replace(/^https:\/\//, "x-safari-https://");
}
