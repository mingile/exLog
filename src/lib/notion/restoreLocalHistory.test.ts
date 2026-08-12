import { describe, expect, it } from "vitest";
import { mergeSessionsBySessionId } from "./restoreLocalHistory";
import type { Session } from "@/app/types";

function createSession(id: string, savedAt: string): Session {
  return {
    id,
    savedAt,
    sessionName: id,
    exercises: [],
  };
}

describe("mergeSessionsBySessionId", () => {
  it("로컬에 없는 sessionId만 추가한다", () => {
    const local = [createSession("a", "2026-08-10T10:00:00.000Z")];
    const incoming = [
      createSession("a", "2026-08-09T10:00:00.000Z"),
      createSession("b", "2026-08-08T10:00:00.000Z"),
    ];

    const { merged, added, skipped } = mergeSessionsBySessionId(local, incoming);

    expect(added).toBe(1);
    expect(skipped).toBe(1);
    expect(merged.map((session) => session.id)).toEqual(["a", "b"]);
  });

  it("로컬에 있는 sessionId는 덮어쓰지 않는다", () => {
    const local = [createSession("a", "2026-08-10T10:00:00.000Z")];
    const incoming = [createSession("a", "2026-08-01T10:00:00.000Z")];

    const { merged, added, skipped } = mergeSessionsBySessionId(local, incoming);

    expect(added).toBe(0);
    expect(skipped).toBe(1);
    expect(merged[0]?.savedAt).toBe("2026-08-10T10:00:00.000Z");
  });

  it("savedAt 기준 내림차순으로 정렬한다", () => {
    const local = [createSession("a", "2026-08-01T10:00:00.000Z")];
    const incoming = [createSession("b", "2026-08-10T10:00:00.000Z")];

    const { merged } = mergeSessionsBySessionId(local, incoming);

    expect(merged.map((session) => session.id)).toEqual(["b", "a"]);
  });
});
