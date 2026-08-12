import { describe, expect, it } from "vitest";
import {
  buildSessionMetaByPageId,
  buildSessionsFromNotion,
  parseExerciseNameFromSetTitle,
  parseNotionSessionMeta,
} from "./buildSessionsFromNotion";

const SESSION_PAGE_ID = "session-page-1";
const EXERCISE_PAGE_ID_A = "exercise-page-a";
const EXERCISE_PAGE_ID_B = "exercise-page-b";

function createSessionPage(overrides?: {
  id?: string;
  sessionId?: string;
  sessionName?: string;
  startedAt?: string | null;
}) {
  return {
    id: overrides?.id ?? SESSION_PAGE_ID,
    properties: {
      이름: {
        title: [{ plain_text: overrides?.sessionName ?? "등 운동" }],
      },
      "Session ID": {
        rich_text: [{ plain_text: overrides?.sessionId ?? "session-uuid-1" }],
      },
      시작시간:
        overrides?.startedAt === null
          ? { date: null }
          : {
              date: {
                start: overrides?.startedAt ?? "2026-08-10T09:00:00.000Z",
              },
            },
    },
  };
}

function createSetPage(overrides?: {
  id?: string;
  sessionPageId?: string | null;
  exercisePageId?: string | null;
  setNo?: number;
  weight?: number;
  reps?: number;
  title?: string;
  equipment?: string;
  part?: string;
  memo?: string;
  date?: string;
}) {
  const setNo = overrides?.setNo ?? 1;
  const sessionPageId =
    overrides && "sessionPageId" in overrides
      ? overrides.sessionPageId
      : SESSION_PAGE_ID;
  const exercisePageId =
    overrides && "exercisePageId" in overrides
      ? overrides.exercisePageId
      : EXERCISE_PAGE_ID_A;

  return {
    id: overrides?.id ?? `set-page-${setNo}`,
    properties: {
      Name: {
        title: [
          {
            plain_text: overrides?.title ?? `랫풀다운 - #${setNo}`,
          },
        ],
      },
      "Set No": { number: setNo },
      Weight: { number: overrides?.weight ?? 40 },
      Reps: { number: overrides?.reps ?? 10 },
      Date: {
        date: {
          start: overrides?.date ?? "2026-08-10T09:30:00.000Z",
        },
      },
      Part: { select: { name: overrides?.part ?? "등" } },
      Memo: {
        rich_text: overrides?.memo ? [{ plain_text: overrides.memo }] : [],
      },
      Equipment: {
        select: { name: overrides?.equipment ?? "케이블" },
      },
      Exercise:
        exercisePageId === null
          ? { relation: [] }
          : { relation: [{ id: exercisePageId }] },
      Session:
        sessionPageId === null
          ? { relation: [] }
          : { relation: [{ id: sessionPageId }] },
    },
  };
}

describe("parseExerciseNameFromSetTitle", () => {
  it("Set title에서 운동명을 파싱한다", () => {
    expect(parseExerciseNameFromSetTitle("랫풀다운 - #2", 2)).toBe("랫풀다운");
  });

  it("setNo가 일치하지 않으면 null을 반환한다", () => {
    expect(parseExerciseNameFromSetTitle("랫풀다운 - #2", 1)).toBeNull();
  });
});

describe("parseNotionSessionMeta", () => {
  it("Session DB row를 메타로 변환한다", () => {
    expect(parseNotionSessionMeta(createSessionPage())).toEqual({
      pageId: SESSION_PAGE_ID,
      sessionId: "session-uuid-1",
      sessionName: "등 운동",
      startedAt: "2026-08-10T09:00:00.000Z",
    });
  });

  it("Session ID가 없으면 null을 반환한다", () => {
    expect(
      parseNotionSessionMeta({
        id: SESSION_PAGE_ID,
        properties: {
          이름: { title: [{ plain_text: "세션" }] },
        },
      }),
    ).toBeNull();
  });
});

describe("buildSessionMetaByPageId", () => {
  it("pageId 키로 Session 메타 맵을 만든다", () => {
    const map = buildSessionMetaByPageId([createSessionPage()]);
    expect(map.get(SESSION_PAGE_ID)?.sessionId).toBe("session-uuid-1");
  });
});

describe("buildSessionsFromNotion", () => {
  it("단일 세션·운동·2세트를 Session[]로 변환한다", () => {
    const sessions = buildSessionsFromNotion({
      sessionPages: [createSessionPage()],
      setPages: [
        createSetPage({ id: "set-1", setNo: 1, weight: 40, reps: 10 }),
        createSetPage({
          id: "set-2",
          setNo: 2,
          weight: 45,
          reps: 8,
          title: "랫풀다운 - #2",
        }),
      ],
    });

    expect(sessions).toHaveLength(1);
    expect(sessions[0]).toMatchObject({
      id: "session-uuid-1",
      savedAt: "2026-08-10T09:00:00.000Z",
      sessionName: "등 운동",
    });
    expect(sessions[0].exercises).toHaveLength(1);
    expect(sessions[0].exercises[0]).toMatchObject({
      id: EXERCISE_PAGE_ID_A,
      name: "랫풀다운",
      exercisePageId: EXERCISE_PAGE_ID_A,
      part: "등",
    });
    expect(sessions[0].exercises[0].sets).toEqual([
      {
        setNo: 1,
        weight: 40,
        reps: 10,
        memo: "",
        equipment: "cable-machine",
      },
      {
        setNo: 2,
        weight: 45,
        reps: 8,
        memo: "",
        equipment: "cable-machine",
      },
    ]);
  });

  it("Session relation이 없는 Set row는 제외한다", () => {
    const sessions = buildSessionsFromNotion({
      sessionPages: [createSessionPage()],
      setPages: [createSetPage({ sessionPageId: null })],
    });

    expect(sessions).toEqual([]);
  });

  it("Exercise relation이 없는 Set row는 제외한다", () => {
    const sessions = buildSessionsFromNotion({
      sessionPages: [createSessionPage()],
      setPages: [createSetPage({ exercisePageId: null })],
    });

    expect(sessions).toEqual([]);
  });

  it("Session DB에 없는 Session relation은 제외한다", () => {
    const sessions = buildSessionsFromNotion({
      sessionPages: [createSessionPage()],
      setPages: [createSetPage({ sessionPageId: "unknown-session-page" })],
    });

    expect(sessions).toEqual([]);
  });

  it("한 세션에 여러 운동을 그룹핑한다", () => {
    const sessions = buildSessionsFromNotion({
      sessionPages: [createSessionPage()],
      setPages: [
        createSetPage({
          id: "set-a",
          exercisePageId: EXERCISE_PAGE_ID_A,
          title: "랫풀다운 - #1",
        }),
        createSetPage({
          id: "set-b",
          exercisePageId: EXERCISE_PAGE_ID_B,
          title: "시티드로우 - #1",
          part: "등",
        }),
      ],
    });

    expect(sessions).toHaveLength(1);
    expect(sessions[0].exercises).toHaveLength(2);
    expect(sessions[0].exercises.map((exercise) => exercise.name).sort()).toEqual(
      ["랫풀다운", "시티드로우"],
    );
  });

  it("exerciseNameByPageId lookup을 우선 사용한다", () => {
    const sessions = buildSessionsFromNotion({
      sessionPages: [createSessionPage()],
      setPages: [createSetPage({ title: "잘못된 title" })],
      exerciseNameByPageId: {
        [EXERCISE_PAGE_ID_A]: "랫풀다운",
      },
    });

    expect(sessions[0]?.exercises[0]?.name).toBe("랫풀다운");
  });

  it("Equipment 한글 select를 slug로 변환한다", () => {
    const sessions = buildSessionsFromNotion({
      sessionPages: [createSessionPage()],
      setPages: [createSetPage({ equipment: "덤벨" })],
    });

    expect(sessions[0]?.exercises[0]?.sets[0]?.equipment).toBe("dumbbell");
  });

  it("같은 exercisePageId·setNo 중복 row는 더 최신 Date를 유지한다", () => {
    const sessions = buildSessionsFromNotion({
      sessionPages: [createSessionPage()],
      setPages: [
        createSetPage({
          id: "set-old",
          setNo: 1,
          weight: 30,
          date: "2026-08-09T09:00:00.000Z",
        }),
        createSetPage({
          id: "set-new",
          setNo: 1,
          weight: 40,
          date: "2026-08-10T09:30:00.000Z",
        }),
      ],
    });

    expect(sessions[0]?.exercises[0]?.sets).toEqual([
      {
        setNo: 1,
        weight: 40,
        reps: 10,
        memo: "",
        equipment: "cable-machine",
      },
    ]);
  });

  it("Session 시작시간이 없으면 Set Date 최신값을 savedAt으로 사용한다", () => {
    const sessions = buildSessionsFromNotion({
      sessionPages: [
        createSessionPage({ startedAt: null }),
      ],
      setPages: [
        createSetPage({ date: "2026-08-08T08:00:00.000Z" }),
        createSetPage({
          id: "set-2",
          setNo: 2,
          date: "2026-08-09T08:00:00.000Z",
          title: "랫풀다운 - #2",
        }),
      ],
    });

    expect(sessions[0]?.savedAt).toBe("2026-08-09T08:00:00.000Z");
  });

  it("여러 sessionId를 savedAt 내림차순으로 반환한다", () => {
    const sessions = buildSessionsFromNotion({
      sessionPages: [
        createSessionPage({
          id: "session-page-old",
          sessionId: "session-old",
          startedAt: "2026-08-01T09:00:00.000Z",
        }),
        createSessionPage({
          id: "session-page-new",
          sessionId: "session-new",
          sessionName: "가슴",
          startedAt: "2026-08-10T09:00:00.000Z",
        }),
      ],
      setPages: [
        createSetPage({
          sessionPageId: "session-page-old",
          date: "2026-08-01T10:00:00.000Z",
        }),
        createSetPage({
          id: "set-new",
          sessionPageId: "session-page-new",
          title: "벤치프레스 - #1",
          date: "2026-08-10T10:00:00.000Z",
        }),
      ],
    });

    expect(sessions.map((session) => session.id)).toEqual([
      "session-new",
      "session-old",
    ]);
  });
});
