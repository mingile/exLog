import { withBasePath } from "@/lib/base-path";
import { isIOS, shouldUseSafariHandoffFlow, toSafariSchemeUrl } from "@/lib/is-standalone-pwa";

export const NOTION_CONNECT_HANDOFF_ID_KEY = "notion_connect_handoff_id";
export const NOTION_CONNECT_HANDOFF_LAUNCHED_KEY =
  "notion_connect_handoff_launched";
export const NOTION_CONNECT_HANDOFF_STARTED_AT_KEY =
  "notion_connect_handoff_started_at";
export const NOTION_OAUTH_PENDING_KEY = "notion_oauth_pending";
export const NOTION_CONNECT_HANDOFF_TTL_MS = 10 * 60 * 1000;
export const SAFARI_FALLBACK_DELAY_MS = 3000;

function assertBrowserSessionStorage(): void {
  if (typeof window === "undefined") {
    throw new Error("sessionStorage is unavailable");
  }
}

export function setNotionConnectPending(handoffId: string): void {
  assertBrowserSessionStorage();
  sessionStorage.setItem(NOTION_CONNECT_HANDOFF_ID_KEY, handoffId);
  sessionStorage.setItem(NOTION_OAUTH_PENDING_KEY, "1");
  sessionStorage.setItem(
    NOTION_CONNECT_HANDOFF_STARTED_AT_KEY,
    String(Date.now()),
  );
  sessionStorage.removeItem(NOTION_CONNECT_HANDOFF_LAUNCHED_KEY);
}

export function hasNotionConnectPendingFlow(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return sessionStorage.getItem(NOTION_OAUTH_PENDING_KEY) === "1";
}

export function clearNotionConnectSession(): void {
  if (typeof window === "undefined") {
    return;
  }

  sessionStorage.removeItem(NOTION_CONNECT_HANDOFF_ID_KEY);
  sessionStorage.removeItem(NOTION_CONNECT_HANDOFF_LAUNCHED_KEY);
  sessionStorage.removeItem(NOTION_CONNECT_HANDOFF_STARTED_AT_KEY);
  sessionStorage.removeItem(NOTION_OAUTH_PENDING_KEY);
}

export function getStoredHandoffId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return sessionStorage.getItem(NOTION_CONNECT_HANDOFF_ID_KEY);
}

export function storeHandoffId(handoffId: string): void {
  assertBrowserSessionStorage();
  sessionStorage.setItem(NOTION_CONNECT_HANDOFF_ID_KEY, handoffId);
  if (!sessionStorage.getItem(NOTION_OAUTH_PENDING_KEY)) {
    sessionStorage.setItem(NOTION_OAUTH_PENDING_KEY, "1");
  }
  if (!sessionStorage.getItem(NOTION_CONNECT_HANDOFF_STARTED_AT_KEY)) {
    sessionStorage.setItem(
      NOTION_CONNECT_HANDOFF_STARTED_AT_KEY,
      String(Date.now()),
    );
  }
}

export function markHandoffLaunch(handoffId: string): void {
  assertBrowserSessionStorage();
  sessionStorage.setItem(NOTION_CONNECT_HANDOFF_ID_KEY, handoffId);
  sessionStorage.setItem(NOTION_CONNECT_HANDOFF_LAUNCHED_KEY, "1");
}

export function isHandoffLaunched(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return sessionStorage.getItem(NOTION_CONNECT_HANDOFF_LAUNCHED_KEY) === "1";
}

export function isHandoffSessionExpired(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const startedAt = sessionStorage.getItem(NOTION_CONNECT_HANDOFF_STARTED_AT_KEY);
  if (!startedAt) {
    return false;
  }

  return Date.now() - Number(startedAt) > NOTION_CONNECT_HANDOFF_TTL_MS;
}

export function buildHandoffAuthUrl(handoffId: string): string {
  const path = withBasePath(
    `/api/notion/auth?handoff=${encodeURIComponent(handoffId)}`,
  );
  return `${window.location.origin}${path}`;
}

export function buildSafariSettingsUrl(): string {
  const path = withBasePath("/settings/notion");
  return `${window.location.origin}${path}`;
}

export function getSafariHandoffAuthUrl(handoffId: string): string {
  const httpsUrl = buildHandoffAuthUrl(handoffId);
  return isIOS() ? toSafariSchemeUrl(httpsUrl) : httpsUrl;
}

export function getSafariSettingsUrl(): string {
  const httpsUrl = buildSafariSettingsUrl();
  return isIOS() ? toSafariSchemeUrl(httpsUrl) : httpsUrl;
}

export function navigateToDirectNotionAuth(): void {
  window.location.href = withBasePath("/api/notion/auth");
}

export async function createHandoffAndNavigate(): Promise<void> {
  const res = await fetch(withBasePath("/api/notion/oauth-handoff"), {
    method: "POST",
    credentials: "include",
    cache: "no-store",
  });

  const data = (await res.json()) as { handoffId?: string; error?: string };

  if (!res.ok) {
    throw new Error(data.error || "Handoff 생성에 실패했습니다.");
  }

  if (!data.handoffId) {
    throw new Error("Handoff ID를 받지 못했습니다.");
  }

  setNotionConnectPending(data.handoffId);
  window.location.href = withBasePath(
    `/notion/connect?handoff=${encodeURIComponent(data.handoffId)}`,
  );
}

export async function startNotionConnect(): Promise<void> {
  if (shouldUseSafariHandoffFlow()) {
    await createHandoffAndNavigate();
    return;
  }

  navigateToDirectNotionAuth();
}
