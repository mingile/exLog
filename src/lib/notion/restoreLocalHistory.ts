import type { Session } from "@/app/types";
import { withBasePath } from "../base-path";

export const WORKOUT_SESSIONS_KEY = "workout.sessions.v1";

export function loadLocalSessions(): Session[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(WORKOUT_SESSIONS_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as Session[]) : [];
  } catch {
    return [];
  }
}

export function mergeSessionsBySessionId(
  localSessions: Session[],
  incomingSessions: Session[],
): { merged: Session[]; added: number; skipped: number } {
  const localIds = new Set(localSessions.map((session) => session.id));
  const toAdd = incomingSessions.filter((session) => !localIds.has(session.id));
  const skipped = incomingSessions.length - toAdd.length;

  const merged = [...localSessions, ...toAdd].sort(
    (a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime(),
  );

  return { merged, added: toAdd.length, skipped };
}

export type RestoreHistoryResult =
  | { ok: true; added: number; skipped: number }
  | { ok: false; error: string };

export async function restoreHistoryFromNotion(): Promise<RestoreHistoryResult> {
  try {
    const response = await fetch(withBasePath("/api/notion/import-history"), {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });

    const data = (await response.json()) as {
      sessions?: Session[];
      error?: string;
    };

    if (!response.ok) {
      return {
        ok: false,
        error: data.error ?? "Notion에서 기록을 가져오지 못했습니다.",
      };
    }

    const incomingSessions = Array.isArray(data.sessions) ? data.sessions : [];
    const localSessions = loadLocalSessions();
    const { merged, added, skipped } = mergeSessionsBySessionId(
      localSessions,
      incomingSessions,
    );

    localStorage.setItem(WORKOUT_SESSIONS_KEY, JSON.stringify(merged));

    return { ok: true, added, skipped };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Notion에서 기록을 가져오지 못했습니다.",
    };
  }
}
