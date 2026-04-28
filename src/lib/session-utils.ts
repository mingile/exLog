import { SessionMetadata } from "@/app/types";

export function generateSessionId(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let randomStr = "";
  for (let i = 0; i < 16; i++) {
    randomStr += chars[Math.floor(Math.random() * chars.length)];
  }
  return `sess_${randomStr}`;
}

export function generateSessionName(startedAt: string, customName?: string): string {
  if (customName && customName.trim() !== "") {
    return customName.trim();
  }

  const date = new Date(startedAt);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes} 세션`;
}

export function createSessionMetadata(customName?: string): SessionMetadata {
  const startedAt = new Date().toISOString();
  return {
    sessionId: generateSessionId(),
    sessionName: generateSessionName(startedAt, customName),
    startedAt,
  };
}
